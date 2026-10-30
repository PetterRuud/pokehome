/**
 * Special living-dex form boxes (PokéPC-style), appended after the national species boxes.
 * Form IDs from PokéAPI pokemon-form resources.
 */

const BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/** Defaults that use `/sprites/pokemon/{nationalId}.png` (no form suffix). */
const DEFAULT_PIXEL_ONLY = new Set([
  'unown-a',
  'vivillon-meadow',
  'furfrou-natural',
]);

function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formLabel(formName) {
  if (formName === 'exclamation') return '!';
  if (formName === 'question') return '?';
  if (formName === 'poke-ball') return 'Poké Ball';
  if (formName === 'la-reine') return 'La Reine';
  return titleCase(formName);
}

/**
 * Cosmetic forms share one Pokémon id — sprites are `{nationalId}-{formName}.png`
 * (e.g. 666-icy-snow, 201-b, 676-heart). Never use pokemon-form IDs like 10086 in
 * `/sprites/pokemon/{id}.png` — those collide with unrelated species.
 *
 * Some event forms are separate Pokémon entries (Eternal Floette = 10061); pass
 * `spriteId` for those.
 */
function pixelSpritePath(nationalId, formName, species, spriteId) {
  if (spriteId != null) {
    return `${BASE}/${spriteId}.png`;
  }
  const formSlug = `${species}-${formName}`;
  if (DEFAULT_PIXEL_ONLY.has(formSlug)) {
    return `${BASE}/${nationalId}.png`;
  }
  return `${BASE}/${nationalId}-${formName}.png`;
}

function shinySpritePath(nationalId, formName, species, spriteId) {
  if (spriteId != null) {
    return `${BASE}/shiny/${spriteId}.png`;
  }
  const formSlug = `${species}-${formName}`;
  if (DEFAULT_PIXEL_ONLY.has(formSlug)) {
    return `${BASE}/shiny/${nationalId}.png`;
  }
  return `${BASE}/shiny/${nationalId}-${formName}.png`;
}

/**
 * @param {{
 *   nationalId: number,
 *   formId: number,
 *   formName: string,
 *   species: string,
 *   displayName: string,
 *   spriteId?: number,
 * }} spec
 */
function slot(spec) {
  const formSlug = `${spec.species}-${spec.formName}`;
  return {
    id: spec.nationalId,
    key: `f${spec.formId}`,
    slug: formSlug,
    name: spec.displayName,
    sprite: pixelSpritePath(spec.nationalId, spec.formName, spec.species, spec.spriteId),
    shinySprite: shinySpritePath(spec.nationalId, spec.formName, spec.species, spec.spriteId),
    formId: spec.formId,
    formSlug,
  };
}

/** Unown A–Z, !, ? (28). */
const UNOWN = [
  ['a', 201],
  ['b', 10001],
  ['c', 10002],
  ['d', 10003],
  ['e', 10004],
  ['f', 10005],
  ['g', 10006],
  ['h', 10007],
  ['i', 10008],
  ['j', 10009],
  ['k', 10010],
  ['l', 10011],
  ['m', 10012],
  ['n', 10013],
  ['o', 10014],
  ['p', 10015],
  ['q', 10016],
  ['r', 10017],
  ['s', 10018],
  ['t', 10019],
  ['u', 10020],
  ['v', 10021],
  ['w', 10022],
  ['x', 10023],
  ['y', 10024],
  ['z', 10025],
  ['exclamation', 10026],
  ['question', 10027],
].map(([formName, formId]) =>
  slot({
    nationalId: 201,
    formId,
    formName,
    species: 'unown',
    displayName: `Unown ${formLabel(formName)}`,
  }),
);

/** Furfrou salon trims (exclude Natural — already in species dex). */
const FURFROU_TRIMS = [
  ['heart', 10115],
  ['star', 10116],
  ['diamond', 10117],
  ['debutante', 10118],
  ['matron', 10119],
  ['dandy', 10120],
  ['la-reine', 10121],
  ['kabuki', 10122],
  ['pharaoh', 10123],
].map(([formName, formId]) =>
  slot({
    nationalId: 676,
    formId,
    formName,
    species: 'furfrou',
    displayName: `${formLabel(formName)} Furfrou`,
  }),
);

const FLOWER_COLORS = [
  ['red', { flabebe: 669, floette: 670, florges: 671 }],
  ['yellow', { flabebe: 10103, floette: 10107, florges: 10111 }],
  ['orange', { flabebe: 10104, floette: 10108, florges: 10112 }],
  ['blue', { flabebe: 10105, floette: 10109, florges: 10113 }],
  ['white', { flabebe: 10106, floette: 10110, florges: 10114 }],
];

const SPECIES_LABEL = {
  flabebe: 'Flabébé',
  floette: 'Floette',
  florges: 'Florges',
};

function flowerLine(species, nationalId, formIdsByColor) {
  const speciesName = SPECIES_LABEL[species] ?? titleCase(species);
  return FLOWER_COLORS.map(([color]) =>
    slot({
      nationalId,
      formId: formIdsByColor[color],
      formName: color,
      species,
      displayName: `${formLabel(color)} ${speciesName}`,
    }),
  );
}

const FLABEBE = flowerLine('flabebe', 669, Object.fromEntries(FLOWER_COLORS.map(([c, ids]) => [c, ids.flabebe])));
const FLOETTE = [
  ...flowerLine('floette', 670, Object.fromEntries(FLOWER_COLORS.map(([c, ids]) => [c, ids.floette]))),
  slot({
    nationalId: 670,
    formId: 10163,
    formName: 'eternal',
    species: 'floette',
    displayName: 'Eternal Floette',
    // Separate Pokémon entry in PokéAPI (not 670-eternal.png).
    spriteId: 10061,
  }),
];
const FLORGES = flowerLine('florges', 671, Object.fromEntries(FLOWER_COLORS.map(([c, ids]) => [c, ids.florges])));

const TRIMS_AND_FLOWERS = [...FURFROU_TRIMS, ...FLABEBE, ...FLOETTE, ...FLORGES];

/** All 20 Vivillon patterns (including Meadow). */
const VIVILLON = [
  ['meadow', 666],
  ['icy-snow', 10086],
  ['polar', 10087],
  ['tundra', 10088],
  ['continental', 10089],
  ['garden', 10090],
  ['elegant', 10091],
  ['modern', 10092],
  ['marine', 10093],
  ['archipelago', 10094],
  ['high-plains', 10095],
  ['sandstorm', 10096],
  ['river', 10097],
  ['monsoon', 10098],
  ['savanna', 10099],
  ['sun', 10100],
  ['ocean', 10101],
  ['jungle', 10102],
  ['fancy', 10161],
  ['poke-ball', 10162],
].map(([formName, formId]) =>
  slot({
    nationalId: 666,
    formId,
    formName,
    species: 'vivillon',
    displayName: `${formLabel(formName)} Vivillon`,
  }),
);

const ALCREMIE_CREAMS = [
  'vanilla-cream',
  'ruby-cream',
  'matcha-cream',
  'mint-cream',
  'lemon-cream',
  'salted-cream',
  'ruby-swirl',
  'caramel-swirl',
  'rainbow-swirl',
];

const ALCREMIE_SWEETS = [
  'strawberry-sweet',
  'berry-sweet',
  'love-sweet',
  'star-sweet',
  'clover-sweet',
  'flower-sweet',
  'ribbon-sweet',
];

/** formId matrix: cream × sweet (PokéAPI). Strawberry column first (incl. default vanilla). */
const ALCREMIE_FORM_IDS = {
  'vanilla-cream': [869, 10449, 10458, 10467, 10476, 10485, 10494],
  'ruby-cream': [10346, 10450, 10459, 10468, 10477, 10486, 10495],
  'matcha-cream': [10347, 10451, 10460, 10469, 10478, 10487, 10496],
  'mint-cream': [10348, 10452, 10461, 10470, 10479, 10488, 10497],
  'lemon-cream': [10349, 10453, 10462, 10471, 10480, 10489, 10498],
  'salted-cream': [10350, 10454, 10463, 10472, 10481, 10490, 10499],
  'ruby-swirl': [10351, 10455, 10464, 10473, 10482, 10491, 10500],
  'caramel-swirl': [10352, 10456, 10465, 10474, 10483, 10492, 10501],
  'rainbow-swirl': [10353, 10457, 10466, 10475, 10484, 10493, 10502],
};

function alcremieSlots(creams) {
  const out = [];
  for (const cream of creams) {
    const ids = ALCREMIE_FORM_IDS[cream];
    ALCREMIE_SWEETS.forEach((sweet, i) => {
      const formName = `${cream}-${sweet}`;
      out.push(
        slot({
          nationalId: 869,
          formId: ids[i],
          formName,
          species: 'alcremie',
          displayName: `${formLabel(cream)} · ${formLabel(sweet.replace(/-sweet$/, ''))}`,
        }),
      );
    });
  }
  return out;
}

/** 4 creams × 7 sweets = 28. */
const ALCREMIE_1 = alcremieSlots(ALCREMIE_CREAMS.slice(0, 4));
/** Next 4 creams = 28. */
const ALCREMIE_2 = alcremieSlots(ALCREMIE_CREAMS.slice(4, 8));
/** Last cream = 7. */
const ALCREMIE_3 = alcremieSlots(ALCREMIE_CREAMS.slice(8));

/**
 * @param {number} startBoxIndex 1-based index of first special box id
 * @returns {{ boxes: object[], formSlotCount: number }}
 */
export function buildFormBoxes(startBoxIndex) {
  const groups = [
    { idSuffix: 'unown', title: 'Unown Dex', rangeLabel: 'Unown A–Z', slots: UNOWN },
    {
      idSuffix: 'trims-flowers',
      title: 'Trims & Flowers',
      rangeLabel: 'Furfrou · Flabébé line',
      slots: TRIMS_AND_FLOWERS,
    },
    { idSuffix: 'vivillon', title: 'Vivillon Patt.', rangeLabel: 'Vivillon patterns', slots: VIVILLON },
    { idSuffix: 'alcremie-1', title: 'Alcremie 1', rangeLabel: 'Alcremie (1/3)', slots: ALCREMIE_1 },
    { idSuffix: 'alcremie-2', title: 'Alcremie 2', rangeLabel: 'Alcremie (2/3)', slots: ALCREMIE_2 },
    { idSuffix: 'alcremie-3', title: 'Alcremie 3', rangeLabel: 'Alcremie (3/3)', slots: ALCREMIE_3 },
  ];

  let index = startBoxIndex;
  const boxes = groups.map((g) => {
    const box = {
      id: `box-${g.idSuffix}`,
      title: g.title,
      rangeLabel: g.rangeLabel,
      slots: g.slots,
    };
    index += 1;
    return box;
  });

  const formSlotCount = boxes.reduce((n, b) => n + b.slots.length, 0);
  return { boxes, formSlotCount };
}
