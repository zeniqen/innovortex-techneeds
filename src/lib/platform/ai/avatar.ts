/**
 * The generative avatar.
 *
 * Every participant gets a crest that is drawn from their own details, so
 * two people never look the same and the same person always does. It is
 * drawn from a hash of their id and name, which means the picture is the
 * same on every device and on every visit without anything being stored.
 *
 * The shape is a mirrored five by five grid of marks, which reads as a
 * badge rather than as noise, and the colours come from the site's own
 * palette so the crest sits inside the design rather than on top of it.
 */

/**
 * The colour sets a crest is drawn from.
 *
 * Each one is a set of tones that work together. They are all taken from
 * the site's palette so a crest never looks like it came from somewhere
 * else.
 */
const PALETTES: { name: string; tones: string[] }[] = [
  {
    name: "ink",
    tones: ["#2A2D31", "#5F5B5D", "#95898B", "#C0BFBD", "#E1E0DE"],
  },
  {
    name: "plum",
    tones: ["#17092F", "#3F1D95", "#6D28D9", "#C0BFBD", "#E1E0DE"],
  },
  {
    name: "sand",
    tones: ["#2A2D31", "#95898B", "#C0BFBD", "#E1E0DE", "#FCFCFB"],
  },
  {
    name: "ember",
    tones: ["#2A2D31", "#B9621F", "#EB9A5C", "#F7C948", "#E1E0DE"],
  },
  {
    name: "moss",
    tones: ["#2A2D31", "#15803D", "#5F5B5D", "#C0BFBD", "#E1E0DE"],
  },
  {
    name: "steel",
    tones: ["#17092F", "#3F1D95", "#5F5B5D", "#9AA3B2", "#D5DAE3"],
  },
];

/**
 * The size of the grid the crest is drawn on.
 */
const GRID = 5;

/**
 * How much of the grid is filled.
 */
const DENSITY = 0.46;

export interface AvatarMark {
  shape: "circle" | "square" | "triangle";
  /** The left edge of the mark, on the hundred unit grid. */
  x: number;
  /** The top edge of the mark. */
  y: number;
  /** The width and height of the mark. */
  side: number;
  /** The colour of the mark. */
  fill: string;
}

export interface AvatarSpec {
  /** The name of the palette the crest was drawn from. */
  palette: string;
  /** The colours of the palette, lightest last. */
  tones: string[];
  /** The background colour. */
  background: string;
  /** The marks, in grid order. */
  marks: AvatarMark[];
}

/**
 * A number from a string, the same every time.
 */
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * A small random number generator, seeded so it always gives the same
 * sequence.
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Works out what a person's crest looks like.
 */
export function avatarSpec(seed: string): AvatarSpec {
  const hash = hashSeed(seed);
  const random = seededRandom(hash);

  const palette = PALETTES[hash % PALETTES.length];
  const cell = 100 / GRID;
  const inset = cell * 0.14;
  const marks: AvatarMark[] = [];

  // The left half is worked out and the right half mirrors it, which is
  // what makes the crest look deliberate rather than random.
  for (let column = 0; column < Math.ceil(GRID / 2); column++) {
    for (let row = 0; row < GRID; row++) {
      if (random() > DENSITY) continue;

      const shape = (["circle", "square", "triangle"] as const)[
        Math.floor(random() * 3)
      ];
      const tone = 1 + Math.floor(random() * (palette.tones.length - 1));

      marks.push({
        shape,
        x: column * cell + inset,
        y: row * cell + inset,
        side: cell - inset * 2,
        fill: palette.tones[tone],
      });

      const mirrored = GRID - 1 - column;
      if (mirrored !== column) {
        marks.push({
          shape,
          x: mirrored * cell + inset,
          y: row * cell + inset,
          side: cell - inset * 2,
          fill: palette.tones[tone],
        });
      }
    }
  }

  return {
    palette: palette.name,
    tones: palette.tones,
    background: palette.tones[palette.tones.length - 1],
    marks,
  };
}
