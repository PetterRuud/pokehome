/** Berry slug matching PokeAPI item sprites (`haban` → `haban-berry.png`). */
export type TipBerry = {
  id: string;
  count: number;
  /** Prefix label with Hyper (ZA Mega Dimension). */
  hyper?: boolean;
  optional?: boolean;
};

export type TipRecipe = {
  /** Donut / mission name when relevant. */
  label?: string;
  ingredients: TipBerry[];
  note?: string;
};

export type TipBlock =
  | { type: "text"; body: string }
  | { type: "recipes"; title: string; goal: string; recipes: TipRecipe[] }
  | { type: "bullets"; items: string[] };

export type TipSection = {
  title: string;
  blocks: TipBlock[];
};

export type GameTips = {
  id: string;
  title: string;
  sourceUrl?: string;
  sections: TipSection[];
};

function b(id: string, count: number, opts?: { hyper?: boolean; optional?: boolean }): TipBerry {
  return { id, count, ...opts };
}

const H = true;

/** Curated tips by family id (`za`, `swsh`, …). Missing ids = empty state. */
export const trainerTipsById: Record<string, GameTips> = {
  za: {
    id: "za",
    title: "Legends: Z-A",
    sourceUrl: "https://game8.co/games/Pokemon-Legends-Z-A/archives/570965",
    sections: [
      {
        title: "Hyperspace mission bosses",
        blocks: [
          {
            type: "text",
            body: "Match donut ★ to the arena. Special recipes unlock from Ansha during the mission — pick the named recipe option, then use these mixes (or substitutes that hit the flavor totals).",
          },
          {
            type: "recipes",
            title: "Story rogue megas",
            goal: "Regular donuts — hit the listed star rank (Flavor Score).",
            recipes: [
              {
                label: "Mega Absol Z · Survey No. 1 · 1★ arena",
                ingredients: [b("occa", 1), b("wacan", 1), b("yache", 1)],
                note: "1★ · early berries · Fairy recommended",
              },
              {
                label: "Mega Staraptor · Survey No. 2 · 2★ arena",
                ingredients: [b("aspear", 3, { hyper: H }), b("hondew", 2, { hyper: H })],
                note: "2★ · Nice Butter (4 berries) · Electric / Fairy / Ice",
              },
              {
                label: "Mega Tatsugiri · Survey No. 3 · 3★ arena",
                ingredients: [b("pomeg", 5, { hyper: H })],
                note: "3★ · Great Butter (5 berries) · Fairy / Dragon",
              },
              {
                label: "Mega Meowstic · Survey No. 4 · 3★ arena",
                ingredients: [b("qualot", 3, { hyper: H }), b("hondew", 2, { hyper: H })],
                note: "3★ · Amazing Butter (6 berries) · Bug / Ghost / Dark",
              },
              {
                label: "Mega Heatran · Survey No. 5 · 4★ arena",
                ingredients: [
                  b("coba", 4, { hyper: H }),
                  b("charti", 4, { hyper: H }),
                ],
                note: "4★ · Spicy/Bitter for offense/defense powers · Ground ×4",
              },
            ],
          },
          {
            type: "recipes",
            title: "Special donuts (legendary portals)",
            goal: "Talk to Ansha → named recipe. Epice Noire / salts are added for you.",
            recipes: [
              {
                label: "Bad Dreams Cruller · Mission 11 · Mega Darkrai",
                ingredients: [
                  b("tanga", 3, { hyper: H }),
                  b("kasib", 3, { hyper: H }),
                  b("coba", 1, { hyper: H }),
                  b("yache", 1, { hyper: H }),
                ],
                note: "310 Sweet · 100 Spicy · 310 Sour · 40 Bitter · 40 Fresh · Coba can be Rindo",
              },
              {
                label: "Omega Old Fashioned · Mission 13 · Primal Groudon",
                ingredients: [
                  b("haban", 2, { hyper: H }),
                  b("tamato", 1, { hyper: H }),
                  b("tanga", 1, { hyper: H }),
                  b("colbur", 1, { hyper: H }),
                  b("chilan", 1, { hyper: H }),
                  b("roseli", 1, { hyper: H }),
                  b("oran", 1, { hyper: H, optional: true }),
                ],
                note: "260 Sweet · 160 Spicy · 160 Sour · 20 Bitter · 260 Fresh · optional 7th any berry",
              },
              {
                label: "Alpha Old Fashioned · Mission 14 · Primal Kyogre",
                ingredients: [
                  b("payapa", 2, { hyper: H }),
                  b("kelpsy", 1, { hyper: H }),
                  b("yache", 1, { hyper: H }),
                  b("kebia", 1, { hyper: H }),
                  b("kasib", 1, { hyper: H }),
                  b("colbur", 1, { hyper: H }),
                  b("chilan", 1, { hyper: H }),
                ],
                note: "50 Sweet · 50 Spicy · 210 Sour · 180 Bitter · 370 Fresh",
              },
              {
                label: "Delta Old Fashioned · Mission 12 · Mega Rayquaza",
                ingredients: [
                  b("oran", 1, { hyper: H }),
                  b("yache", 1, { hyper: H }),
                  b("payapa", 1, { hyper: H }),
                  b("kasib", 1, { hyper: H }),
                  b("haban", 1, { hyper: H }),
                  b("colbur", 2, { hyper: H }),
                  b("roseli", 1, { hyper: H }),
                ],
                note: "120 Sweet · 40 Spicy · 340 Sour · 40 Bitter · 390 Fresh · after Groudon + Kyogre",
              },
              {
                label: "Plasma-Glazed · Side EX3 · Mega Zeraora",
                ingredients: [
                  b("kebia", 1, { hyper: H }),
                  b("charti", 1, { hyper: H }),
                  b("kasib", 4, { hyper: H }),
                  b("chilan", 2, { hyper: H }),
                ],
                note: "40 Sweet · 200 Spicy · 400 Sour · 280 Bitter · 40 Fresh · after Rayquaza",
              },
            ],
          },
        ],
      },
      {
        title: "Shiny & Alpha hunting",
        blocks: [
          {
            type: "text",
            body: "Stack Sweet for Sparkling Power + Alpha Power. Fresh on the side can also roll Encounter Power (faster respawns after KO).",
          },
          {
            type: "recipes",
            title: "Sweet donuts",
            goal: "Aim for Sparkling + Alpha (match Sparkling type to your hunt).",
            recipes: [
              {
                ingredients: [b("haban", 8, { hyper: H })],
                note: "Sweet 680 · Fresh 520 — best all-rounder",
              },
              {
                ingredients: [b("tanga", 4, { hyper: H }), b("haban", 4, { hyper: H })],
                note: "Sweet 720 · Fresh 260",
              },
              {
                ingredients: [
                  b("haban", 3, { hyper: H }),
                  b("occa", 3, { hyper: H }),
                  b("tanga", 2, { hyper: H }),
                ],
                note: "Sweet 625 · Fresh 270",
              },
            ],
          },
        ],
      },
      {
        title: "Item & berry farming",
        blocks: [
          {
            type: "text",
            body: "Stack Sour for Big Haul Power + Item Power. Prefer Item Power: Berries when grinding Hyper Berries in Hyperspace.",
          },
          {
            type: "recipes",
            title: "Sour donuts",
            goal: "Big Haul Lv. 3 + Item Power: Berries Lv. 3 when you can reroll.",
            recipes: [
              { ingredients: [b("kasib", 8, { hyper: H })], note: "Sour 760" },
              {
                ingredients: [b("kasib", 4, { hyper: H }), b("roseli", 4, { hyper: H })],
                note: "Sour 720",
              },
              {
                ingredients: [
                  b("kasib", 4, { hyper: H }),
                  b("colbur", 2, { hyper: H }),
                  b("babiri", 2, { hyper: H }),
                ],
                note: "Sour 640",
              },
              {
                ingredients: [
                  b("wacan", 6, { hyper: H }),
                  b("hondew", 1, { hyper: H }),
                  b("grepa", 1, { hyper: H }),
                ],
                note: "Sour 420",
              },
              {
                ingredients: [
                  b("kasib", 3, { hyper: H }),
                  b("colbur", 2, { hyper: H }),
                  b("chilan", 2, { hyper: H }),
                ],
                note: "Sour 415",
              },
              {
                ingredients: [
                  b("roseli", 2, { hyper: H }),
                  b("payapa", 1, { hyper: H }),
                  b("kasib", 1, { hyper: H }),
                  b("colbur", 3, { hyper: H }),
                ],
                note: "Sour 470",
              },
            ],
          },
          {
            type: "recipes",
            title: "Cheap berry-farm donut",
            goal: "Item Power: Berries on a 5★ donut for 4★/5★ zones. Seven slots + optional 8th.",
            recipes: [
              {
                ingredients: [
                  b("payapa", 1, { hyper: H }),
                  b("tanga", 1, { hyper: H }),
                  b("kasib", 1, { hyper: H }),
                  b("colbur", 1, { hyper: H }),
                  b("babiri", 1, { hyper: H }),
                  b("roseli", 1, { hyper: H }),
                  b("babiri", 1, { hyper: H, optional: true }),
                ],
                note: "Sour ~330 · cost-efficient mix",
              },
            ],
          },
        ],
      },
      {
        title: "Extra story donuts",
        blocks: [
          {
            type: "recipes",
            title: "More mixes by stage",
            goal: "Use these for surveys when you need calories or a different flavor profile.",
            recipes: [
              { ingredients: [b("pecha", 3)], note: "Early · +3 · 180 cal" },
              {
                ingredients: [
                  b("cheri", 3, { hyper: H }),
                  b("oran", 1, { hyper: H }),
                  b("pomeg", 1, { hyper: H }),
                ],
                note: "Mid · +33 · 564 cal",
              },
              {
                ingredients: [
                  b("oran", 2, { hyper: H }),
                  b("coba", 1, { hyper: H }),
                  b("charti", 1, { hyper: H }),
                  b("chilan", 4, { hyper: H }),
                ],
                note: "Late · +99 · 3345 cal",
              },
              {
                ingredients: [b("chilan", 6, { hyper: H }), b("kelpsy", 2)],
                note: "Late · +87 · 3525 cal",
              },
              {
                ingredients: [
                  b("rindo", 3, { hyper: H }),
                  b("kebia", 3, { hyper: H }),
                  b("oran", 2, { hyper: H }),
                ],
                note: "Late · +84 · 2268 cal",
              },
            ],
          },
        ],
      },
      {
        title: "Hyperspace quick tips",
        blocks: [
          {
            type: "bullets",
            items: [
              "Finish every survey task in a zone so the gold Bonus Ball appears — best Hyper Berry haul.",
              "Courier trainers (yellow dialogue after battle) often reward Hyper Berries.",
              "Higher ★ Hyperspace zones drop better Hyper Berries and rarer items (4★/5★ preferred).",
              "5★ battle zones unlock after Side Mission 188 (once all Hyperspace missions are done).",
            ],
          },
        ],
      },
    ],
  },
};
