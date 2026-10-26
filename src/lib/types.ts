export type DexSlot = {
  id: number;
  key: string;
  slug: string;
  name: string;
  sprite: string;
  shinySprite: string;
  entryNumber?: number;
  /** PokéAPI form id when this slot shows a regional (or other) form. */
  formId?: number;
  formSlug?: string;
  region?: 'alola' | 'galar' | 'hisui' | 'paldea';
  /**
   * When false, this species is not obtainable in the game yet (e.g. unreleased in Pokémon GO).
   * Omitted / true means available.
   */
  available?: boolean;
};

export type DexBox = {
  id: string;
  title: string;
  rangeLabel: string;
  slots: DexSlot[];
};

export type GameId = string;

export type GameDex = {
  id: GameId;
  name: string;
  short: string;
  /** HOME family grouping, e.g. "Sword / Shield" or "Legends: Z-A". */
  group: string;
  groupShort: string;
  kind: 'main' | 'dlc' | 'special';
  /** Logo key shared across a family's DLC entries. */
  logo: string;
  pokedexSlugs: string[];
  total: number;
  boxSize: number;
  boxes: DexBox[];
};

export type MysteryGift = {
  id: string;
  name: string;
  pokemon?: string;
  /** National dex id when known from the Serebii sprite. */
  pokemonId?: number;
  /** True when Serebii shows a shiny sprite (/Shiny/…). */
  shiny?: boolean;
  games: string[];
  region: string;
  start: string;
  end: string | null;
  method: 'serial' | 'internet' | 'in-game' | 'code';
  notes?: string;
  sourceUrl?: string;
};

/** Which form overlay / sprite mode the national dex grid uses (one at a time). */
export type FormView = 'default' | 'home' | 'shiny' | 'alpha' | 'mega' | 'gmax' | 'regional';

/** Pixel battle sprites vs Pokémon HOME 3D-style renders (PokeAPI). */
export type SpriteStyle = 'pixel' | 'home';

/** Dex grid card density. Medium matches the original layout. */
export type CardSize = 'small' | 'medium' | 'large';

export type DexPrefs = {
  notificationsEnabled: boolean;
  formView: FormView;
  spriteStyle: SpriteStyle;
  cardSize: CardSize;
};

/** Custom national-dex box titles. `order` is legacy and ignored. */
export type BoxLayout = {
  order: string[];
  titles: Record<string, string>;
};

export type ExportPayload = {
  version: 5;
  exportedAt: string;
  caughtByKey: Record<string, boolean>;
  shinyByKey: Record<string, boolean>;
  alphaByKey: Record<string, boolean>;
  megaByKey: Record<string, boolean>;
  gmaxByKey: Record<string, boolean>;
  /** Present on new exports; older v5 backups may omit it. */
  regionalByKey?: Record<string, boolean>;
  /** Deposited in Pokémon HOME. Older v5 backups may omit it. */
  homeByKey?: Record<string, boolean>;
  caughtByGame: Record<GameId, Record<string, boolean>>;
  /** Deposited in HOME from that origin game. Older v5 backups may omit it. */
  homeByGame?: Record<GameId, Record<string, boolean>>;
  claimedGiftIds: string[];
  lastSeenGiftIds: string[];
  prefs: DexPrefs;
  nationalBoxLayout: BoxLayout;
};

/** Legacy v4 backup shape (migrated on import). */
export type ExportPayloadV4 = {
  version: 4;
  exportedAt: string;
  caughtByKey?: Record<string, boolean>;
  shinyByKey?: Record<string, boolean>;
  alphaByKey?: Record<string, boolean>;
  megaByKey?: Record<string, boolean>;
  gmaxByKey?: Record<string, boolean>;
  caughtByGame?: Record<GameId, Record<string, boolean>>;
  claimedGiftIds?: string[];
  lastSeenGiftIds?: string[];
  prefs?: DexPrefs;
};

/** Legacy v3 backup shape (migrated on import). */
export type ExportPayloadV3 = {
  version: 3;
  exportedAt: string;
  caughtByKey?: Record<string, boolean>;
  shinyByKey?: Record<string, boolean>;
  alphaByKey?: Record<string, boolean>;
  megaByKey?: Record<string, boolean>;
  caughtByGame?: Record<GameId, Record<string, boolean>>;
  claimedGiftIds?: string[];
  lastSeenGiftIds?: string[];
  prefs?: Partial<DexPrefs> & {
    showShiny?: boolean;
    showAlpha?: boolean;
    showMega?: boolean;
  };
};

/** Legacy v2 backup shape (migrated on import). */
export type ExportPayloadV2 = {
  version: 2;
  exportedAt: string;
  caughtByKey?: Record<string, boolean>;
  shinyByKey?: Record<string, boolean>;
  claimedGiftIds?: string[];
  lastSeenGiftIds?: string[];
  prefs?: Partial<DexPrefs> & {
    showShiny?: boolean;
    showAlpha?: boolean;
    showMega?: boolean;
  };
};

/** Legacy v1 backup shape (migrated on import). */
export type ExportPayloadV1 = {
  version: 1;
  exportedAt: string;
  statusByKey?: Record<string, string>;
  claimedGiftIds?: string[];
  lastSeenGiftIds?: string[];
  prefs?: {
    collapseCompleted?: boolean;
    notificationsEnabled?: boolean;
    trackShinies?: boolean;
  };
};

export type AnyExportPayload = ExportPayload | ExportPayloadV4 | ExportPayloadV3 | ExportPayloadV2 | ExportPayloadV1;
