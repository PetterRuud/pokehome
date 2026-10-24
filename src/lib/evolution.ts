export type EvoMethod = {
  label: string;
};

export type EvoNode = {
  id: number;
  slug: string;
  name: string;
  sprite: string;
  methodFromParent: EvoMethod | null;
  evolvesTo: EvoNode[];
};

type PokeApiResource = { name: string; url: string };

type EvolutionDetail = {
  min_level: number | null;
  min_happiness: number | null;
  min_affection: number | null;
  min_beauty: number | null;
  time_of_day: string;
  gender: number | null;
  relative_physical_stats: number | null;
  needs_overworld_rain: boolean;
  turn_upside_down: boolean;
  item: PokeApiResource | null;
  held_item: PokeApiResource | null;
  known_move: PokeApiResource | null;
  known_move_type: PokeApiResource | null;
  location: PokeApiResource | null;
  party_species: PokeApiResource | null;
  party_type: PokeApiResource | null;
  trade_species: PokeApiResource | null;
  trigger: PokeApiResource | null;
};

type ChainLink = {
  species: PokeApiResource;
  evolution_details: EvolutionDetail[];
  evolves_to: ChainLink[];
};

function titleCase(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function speciesIdFromUrl(url: string) {
  return Number(url.split("/").filter(Boolean).pop());
}

function formatItem(name: string | undefined) {
  if (!name) return "Item";
  return titleCase(name);
}

export function simplifyEvolutionDetail(detail: EvolutionDetail | undefined): EvoMethod {
  if (!detail) return { label: "Evolve" };

  const trigger = detail.trigger?.name;

  if (detail.min_level != null) {
    let label = `Lv. ${detail.min_level}`;
    if (detail.time_of_day) label += ` (${detail.time_of_day})`;
    if (detail.known_move) label += ` + ${titleCase(detail.known_move.name)}`;
    return { label };
  }

  if (detail.item) {
    return { label: formatItem(detail.item.name) };
  }

  if (trigger === "trade") {
    if (detail.held_item) {
      return { label: `Trade holding ${formatItem(detail.held_item.name)}` };
    }
    if (detail.trade_species) {
      return { label: `Trade for ${titleCase(detail.trade_species.name)}` };
    }
    return { label: "Trade" };
  }

  if (detail.min_happiness != null) {
    let label = "Friendship";
    if (detail.time_of_day) label += ` (${detail.time_of_day})`;
    if (detail.known_move_type) {
      label += ` + ${titleCase(detail.known_move_type.name)} move`;
    }
    return { label };
  }

  if (detail.min_affection != null) return { label: "Affection" };
  if (detail.location) return { label: `At ${titleCase(detail.location.name)}` };
  if (detail.known_move) {
    return { label: `Know ${titleCase(detail.known_move.name)}` };
  }
  if (detail.turn_upside_down) return { label: "Level (upside-down)" };
  if (detail.needs_overworld_rain) return { label: "Level in rain" };
  if (detail.gender === 1) return { label: "Female" };
  if (detail.gender === 2) return { label: "Male" };
  if (detail.relative_physical_stats === 1) return { label: "Atk > Def" };
  if (detail.relative_physical_stats === -1) return { label: "Atk < Def" };
  if (detail.relative_physical_stats === 0) return { label: "Atk = Def" };

  if (trigger === "level-up") return { label: "Level up" };
  if (trigger) return { label: titleCase(trigger) };
  return { label: "Evolve" };
}

function mapChain(link: ChainLink, methodFromParent: EvoMethod | null): EvoNode {
  const id = speciesIdFromUrl(link.species.url);
  return {
    id,
    slug: link.species.name,
    name: titleCase(link.species.name),
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    methodFromParent,
    evolvesTo: link.evolves_to.map((child) =>
      mapChain(child, simplifyEvolutionDetail(child.evolution_details[0])),
    ),
  };
}

export async function fetchEvolutionChainBySpecies(
  speciesIdOrSlug: string | number,
): Promise<EvoNode> {
  const species = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesIdOrSlug}/`).then(
    (r) => {
      if (!r.ok) throw new Error("Species not found");
      return r.json() as Promise<{
        evolution_chain: { url: string };
        name: string;
        id: number;
      }>;
    },
  );

  const chainRes = await fetch(species.evolution_chain.url);
  if (!chainRes.ok) throw new Error("Evolution chain not found");
  const chainJson = (await chainRes.json()) as { chain: ChainLink };
  return mapChain(chainJson.chain, null);
}
