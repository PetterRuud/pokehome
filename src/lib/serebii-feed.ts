import type { MysteryGift } from "@/lib/types";

const YEARS = [new Date().getFullYear() + 1, new Date().getFullYear()] as const;

/** Heal UTF-8 / Latin-1 mojibake in gift titles (also for cached feeds). */
export function fixMojibake(text: string): string {
  return text
    .replace(/Pok\uFFFDmon/gi, "Pokémon")
    .replace(/Pok\uFFFD[Dd]ex/g, "PokéDex")
    .replace(/PokÃ©mon/gi, "Pokémon")
    .replace(/PokÃ©[Dd]ex/g, "PokéDex")
    .replace(/PokÃ©/gi, "Poké")
    .replace(/\uFFFD/g, "");
}

export function healGift(gift: MysteryGift): MysteryGift {
  let notes = gift.notes ? fixMojibake(gift.notes) : gift.notes;
  // Drop legacy auto-attribution; UI shows “Serebii” from sourceUrl instead
  if (notes && (/^via\s+serebii/i.test(notes.trim()) || /·\s*via\s+serebii/i.test(notes))) {
    notes = undefined;
  }
  return {
    ...gift,
    name: fixMojibake(gift.name),
    pokemon: gift.pokemon ? fixMojibake(gift.pokemon) : gift.pokemon,
    notes,
  };
}

function cleanText(html: string): string {
  return fixMojibake(
    html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&eacute;/gi, "é")
      .replace(/&#233;/g, "é")
      .replace(/&#x[eE]9;/g, "é")
      .replace(/&amp;/gi, "&")
      .replace(/&nbsp;/gi, " ")
      .replace(/&#9794;/g, "")
      .replace(/&#9792;/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function tryDecode(buf: ArrayBuffer, label: string): string | null {
  try {
    return new TextDecoder(label).decode(buf);
  } catch {
    return null;
  }
}

function encodingScore(text: string): number {
  let score = 0;
  if (text.includes("\uFFFD")) score -= 100;
  if (/Pokémon|Pokédex|PokéDex|Poké/i.test(text)) score += 20;
  if (/PokÃ©/.test(text)) score -= 40;
  if (/Pok\uFFFDmon/i.test(text)) score -= 40;
  return score;
}

/**
 * Serebii serves ISO-8859-1 (raw 0xE9 for “é”). Some runtimes also rewrite
 * bodies to UTF-8 while leaving the charset header — pick the best decode.
 */
async function readHtml(res: Response): Promise<string> {
  const buf = await res.arrayBuffer();
  const header = res.headers.get("content-type") ?? "";
  const charsetMatch = header.match(/charset=([^;]+)/i);
  const declared = charsetMatch?.[1]?.trim().toLowerCase() ?? "";

  const candidates: string[] = [];
  const utf8 = tryDecode(buf, "utf-8");
  const latin1 = tryDecode(buf, "windows-1252");
  if (utf8) candidates.push(utf8);
  if (latin1) candidates.push(latin1);

  if (
    declared &&
    declared !== "utf-8" &&
    declared !== "utf8" &&
    declared !== "windows-1252" &&
    declared !== "iso-8859-1" &&
    declared !== "latin1"
  ) {
    const extra = tryDecode(buf, declared);
    if (extra) candidates.push(extra);
  } else if (declared === "iso-8859-1" || declared === "latin1" || declared === "windows-1252") {
    const extra = tryDecode(buf, "iso-8859-1") ?? tryDecode(buf, "latin1");
    if (extra) candidates.push(extra);
  }

  // Meta tag hint (often present even when the HTTP header differs)
  const sniff = utf8 ?? latin1 ?? "";
  const metaCharset = sniff.match(/<meta[^>]+charset\s*=\s*["']?([^"'>\s]+)/i)?.[1]?.toLowerCase();
  if (metaCharset) {
    const extra = tryDecode(buf, metaCharset);
    if (extra) candidates.push(extra);
  }

  let best = candidates[0] ?? "";
  let bestScore = encodingScore(best);
  for (const c of candidates.slice(1)) {
    const s = encodingScore(c);
    if (s > bestScore) {
      best = c;
      bestScore = s;
    }
  }
  return best;
}

function parseSerebiiDate(raw: string): string | null {
  const text = cleanText(raw);
  if (!text || /^no end date$/i.test(text)) return null;
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mapMethod(raw: string): MysteryGift["method"] {
  const t = raw.toLowerCase();
  if (t.includes("serial")) return "serial";
  if (t.includes("internet") || t.includes("wi-fi") || t.includes("wifi")) {
    return "internet";
  }
  if (t.includes("in-game") || t.includes("in-life")) return "in-game";
  if (t.includes("code") || t.includes("qr")) return "code";
  return "serial";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Serebii uses `/Shiny/…/721.png` (and similar) for shiny event art. */
function detectShiny(section: string): boolean {
  return /\/shiny\//i.test(section);
}

/** Prefer national id from the Pokémon sprite path. */
function extractPokemonId(section: string): number | undefined {
  const shiny = section.match(/\/shiny\/[^"'>\s]+\/(\d{1,4})(?:-[a-z0-9]+)?\.png/i);
  if (shiny) return Number(shiny[1]);
  const small = section.match(
    /\/(?:pokemon(?:home)?\/pokemon(?:\/new)?|legendsz-a\/pokemon|scarletviolet\/pokemon\/new|letsgopikachueevee\/pokemon)\/(?:small\/)?(\d{1,4})(?:-[a-z0-9]+)?\.png/i,
  );
  if (small) return Number(small[1]);
  const anyDex = section.match(/\/pokedex[^"'>\s]*\/(\d{1,4})\.shtml/i);
  if (anyDex) return Number(anyDex[1]);
  return undefined;
}

/** Parse one Serebii year events HTML page into MysteryGift records. */
export function parseSerebiiEventsHtml(html: string, year: number): MysteryGift[] {
  const gifts: MysteryGift[] = [];
  const blocks = html.split(/<table[^>]*class="eventpoke"[^>]*>/i).slice(1);

  for (const block of blocks) {
    const tableEnd = block.indexOf("</table><br");
    const section = tableEnd >= 0 ? block.slice(0, tableEnd + 2000) : block.slice(0, 8000);

    const nameMatch = section.match(/class="label"[^>]*>\s*<img[^>]*>\s*([^<]+)/i);
    let pokemon = nameMatch ? cleanText(nameMatch[1]!) : undefined;
    // Skip pure CJK OT labels when we have a dex id (name resolved later in UI)
    if (pokemon && !/[A-Za-z]/.test(pokemon)) pokemon = undefined;

    const shiny = detectShiny(section);
    const pokemonId = extractPokemonId(section);

    const descMatch = section.match(
      /Description[\s\S]*?<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>/i,
    );
    const description = descMatch ? cleanText(descMatch[1]!) : (pokemon ?? "Event");
    const methodRaw = descMatch ? cleanText(descMatch[2]!) : "Serial Code";
    const region = descMatch ? cleanText(descMatch[3]!) : "Global";

    const startMatch = section.match(
      /Start Date[\s\S]*?<\/tr>\s*<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>/i,
    );
    const start = startMatch ? parseSerebiiDate(startMatch[1]!) : null;
    const end = startMatch ? parseSerebiiDate(startMatch[2]!) : null;

    const gamesMatch = section.match(/Games Available[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i);
    const gamesRaw = gamesMatch ? cleanText(gamesMatch[1]!) : "";
    const games = gamesRaw
      ? gamesRaw
          .split(/[,/]/)
          .map((g) => g.trim())
          .filter(Boolean)
      : ["Unknown"];

    if (!start) continue;

    const id = `serebii-${year}-${slugify(description)}-${start}`;
    gifts.push({
      id,
      name: description,
      pokemon,
      pokemonId,
      shiny: shiny || undefined,
      games,
      region: region || "Global",
      start,
      end,
      method: mapMethod(methodRaw),
      sourceUrl: `https://www.serebii.net/events/${year}.shtml`,
    });
  }

  return gifts;
}

export async function fetchSerebiiGiftFeed(
  fetchImpl: typeof fetch = fetch,
): Promise<MysteryGift[]> {
  const years = [...new Set(YEARS)];
  const all: MysteryGift[] = [];

  for (const year of years) {
    const url = `https://www.serebii.net/events/${year}.shtml`;
    const res = await fetchImpl(url, {
      headers: {
        "user-agent":
          "PokehomeGiftBot/1.0 (+https://github.com/local/pokehome; daily mystery-gift sync)",
        accept: "text/html",
      },
    });
    if (!res.ok) continue;
    const html = await readHtml(res);
    all.push(...parseSerebiiEventsHtml(html, year));
  }

  // Dedupe by id, prefer later years if collision
  const byId = new Map<string, MysteryGift>();
  for (const gift of all) byId.set(gift.id, gift);
  return Array.from(byId.values()).sort((a, b) => b.start.localeCompare(a.start));
}
