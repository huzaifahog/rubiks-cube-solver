/**
 * Cube state engine.
 *
 * The cube state is an object with six keys: U, R, F, D, L, B.
 * Each value is a flat array of 9 sticker color codes (strings).
 * Array indices follow this layout for every face when viewed facing you:
 *
 *   0 1 2
 *   3 4 5
 *   6 7 8
 *
 * Index 4 is always the center (immovable).
 *
 * INITIAL SOLVED STATE (standard Western color scheme):
 *   U = white   (W)
 *   R = blue    (B)   -- note: some schemes use orange for R, but we
 *   F = red     (R)      match INITIAL_CUBE_STATE in cubeStringMapper.js
 *   D = yellow  (Y)
 *   L = green   (G)
 *   B = orange  (O)
 */

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Return a deep copy of the cube state so mutations don't alias. */
const cloneState = (state) => ({
  U: [...state.U],
  R: [...state.R],
  F: [...state.F],
  D: [...state.D],
  L: [...state.L],
  B: [...state.B],
});

/**
 * Rotate the 9 stickers on a single face 90 degrees clockwise.
 *
 * The permutation for a CW face rotation (0-indexed):
 *   0->2, 1->5, 2->8, 3->1, 4->4, 5->7, 6->0, 7->3, 8->6
 * which is equivalent to reading columns bottom-to-top as rows.
 */
const rotateFaceCW = (face) => [
  face[6], face[3], face[0],
  face[7], face[4], face[1],
  face[8], face[5], face[2],
];

// ------------------------------------------------------------------
// Move definitions
// Each move mutates a cloned state using explicit index swaps for the
// four adjacent edge/corner bands that cycle around the turning face.
// ------------------------------------------------------------------

/**
 * U face clockwise: top row of F, L, B, R cycles.
 *   F[0,1,2] <- R[0,1,2] <- B[0,1,2] <- L[0,1,2] <- F[0,1,2]
 *   Wait — for U CW (looking down at U), the cycle goes:
 *   F top-row  <-  R top-row  <-  B top-row  <-  L top-row
 *   but B is stored as viewed from behind, so B[0,1,2] are actually the
 *   top-right-to-left when seen from above.  The exact cycle (verified
 *   by standard Rubik's conventions) is:
 *   F[0,1,2] <- L[0,1,2] <- B[2,1,0] <- R[0,1,2] ... no, let's be precise.
 *
 * Standard U-CW cycle (viewing U face from above, cube in standard orientation):
 *   F top  [0,1,2]  goes to  R top  [0,1,2]
 *   R top  [0,1,2]  goes to  B top  [2,1,0]  (reversed because B faces opposite)
 *   B top  [2,1,0]  goes to  L top  [0,1,2]
 *   L top  [0,1,2]  goes to  F top  [0,1,2]
 * So reading "what replaces F top": it was L top.
 */

const applyU = (s) => {
  const n = cloneState(s);
  n.U = rotateFaceCW(s.U);
  // Band: F[0,1,2] <- L[0,1,2] <- B[2,1,0] <- R[0,1,2] <- F[0,1,2]
  [n.F[0], n.F[1], n.F[2]] = [s.L[0], s.L[1], s.L[2]];
  [n.L[0], n.L[1], n.L[2]] = [s.B[2], s.B[1], s.B[0]];
  [n.B[2], n.B[1], n.B[0]] = [s.R[0], s.R[1], s.R[2]];
  [n.R[0], n.R[1], n.R[2]] = [s.F[0], s.F[1], s.F[2]];
  return n;
};

const applyUCCW = (s) => applyU(applyU(applyU(s)));
const applyU2   = (s) => applyU(applyU(s));

/**
 * D face clockwise (looking at D from below):
 *   Bottom row of F, R, B, L cycles.
 *   F[6,7,8] <- R[6,7,8] <- B[6,7,8] reversed <- L[6,7,8] <- ...
 * The cycle (D-CW = front-bottom goes to left-bottom):
 *   F[6,7,8] <- R[6,7,8] <- B[2,1,0] of bottom ... let's do precisely:
 *   D-CW: F bottom goes to L bottom; R bottom goes to F bottom;
 *         B bottom (reversed) goes to R; L bottom goes to B (reversed).
 *   F[6,7,8] <- R[6,7,8]
 *   R[6,7,8] <- B[2,1,0]   (B bottom reversed)
 *   B[2,1,0] <- L[6,7,8]
 *   L[6,7,8] <- F[6,7,8]
 */
const applyD = (s) => {
  const n = cloneState(s);
  n.D = rotateFaceCW(s.D);
  [n.F[6], n.F[7], n.F[8]] = [s.R[6], s.R[7], s.R[8]];
  [n.R[6], n.R[7], n.R[8]] = [s.B[2], s.B[1], s.B[0]];
  [n.B[2], n.B[1], n.B[0]] = [s.L[6], s.L[7], s.L[8]];
  [n.L[6], n.L[7], n.L[8]] = [s.F[6], s.F[7], s.F[8]];
  return n;
};

const applyDCCW = (s) => applyD(applyD(applyD(s)));
const applyD2   = (s) => applyD(applyD(s));

/**
 * R face clockwise (looking at R from the right):
 *   Right column of U, F, D, B cycles.
 *   Indices in right column: [2,5,8] for U, F, D.
 *   B is stored face-forward (from behind), so its LEFT column [0,3,6]
 *   is the band adjacent to R, and it runs top-to-bottom reversed relative
 *   to U/F/D right columns.
 *
 *   R-CW cycle:
 *   U right col [2,5,8] <- F right col [2,5,8] ... (U[2,5,8] <- F[2,5,8])
 *   Wait — R-CW means the front-right goes up. So:
 *   U[2,5,8] <- F[2,5,8]
 *   F[2,5,8] <- D[2,5,8]
 *   D[2,5,8] <- B[6,3,0]  (B left col reversed, because B is flipped)
 *   B[6,3,0] <- U[2,5,8]  reversed
 *   Clarified:
 *   n.U[2,5,8] <- s.F[2,5,8]
 *   n.F[2,5,8] <- s.D[2,5,8]
 *   n.D[2,5,8] <- s.B[6,3,0]
 *   n.B[6,3,0] <- s.U[2,5,8]
 */
const applyR = (s) => {
  const n = cloneState(s);
  n.R = rotateFaceCW(s.R);
  [n.U[2], n.U[5], n.U[8]] = [s.F[2], s.F[5], s.F[8]];
  [n.F[2], n.F[5], n.F[8]] = [s.D[2], s.D[5], s.D[8]];
  [n.D[2], n.D[5], n.D[8]] = [s.B[6], s.B[3], s.B[0]];
  [n.B[6], n.B[3], n.B[0]] = [s.U[2], s.U[5], s.U[8]];
  return n;
};

const applyRCCW = (s) => applyR(applyR(applyR(s)));
const applyR2   = (s) => applyR(applyR(s));

/**
 * L face clockwise (looking at L from the left):
 *   Left column of U, B, D, F cycles.
 *   L-CW: front-left goes down; U left goes to F left.
 *   n.U[0,3,6] <- s.B[8,5,2]
 *   n.F[0,3,6] <- s.U[0,3,6]
 *   n.D[0,3,6] <- s.F[0,3,6]
 *   n.B[8,5,2] <- s.D[0,3,6]
 */
const applyL = (s) => {
  const n = cloneState(s);
  n.L = rotateFaceCW(s.L);
  [n.U[0], n.U[3], n.U[6]] = [s.B[8], s.B[5], s.B[2]];
  [n.F[0], n.F[3], n.F[6]] = [s.U[0], s.U[3], s.U[6]];
  [n.D[0], n.D[3], n.D[6]] = [s.F[0], s.F[3], s.F[6]];
  [n.B[8], n.B[5], n.B[2]] = [s.D[0], s.D[3], s.D[6]];
  return n;
};

const applyLCCW = (s) => applyL(applyL(applyL(s)));
const applyL2   = (s) => applyL(applyL(s));

/**
 * F face clockwise (looking at F directly):
 *   U bottom row, R left col, D top row, L right col cycle.
 *   F-CW:
 *   n.U[6,7,8] <- s.L[8,5,2]  (L right col, bottom to top)
 *   n.R[0,3,6] <- s.U[6,7,8]
 *   n.D[2,1,0] <- s.R[0,3,6]
 *   n.L[8,5,2] <- s.D[2,1,0]
 *   Simplified with correct directions:
 *   n.U[6,7,8] <- s.L[8,5,2]
 *   n.R[0,3,6] <- s.U[6,7,8]
 *   n.D[0,1,2] <- s.R[6,3,0]  (reversed)
 *   n.L[2,5,8] <- s.D[0,1,2]
 *   Need precise derivation:
 *   F-CW means left column of R moves down to D top row,
 *   U bottom row moves to R left col, etc.
 *   n.R[0,3,6] <- s.U[6,7,8]
 *   n.D[0,1,2] <- s.R[6,3,0]
 *   n.L[2,5,8] <- s.D[0,1,2]
 *   n.U[6,7,8] <- s.L[8,5,2]
 */
const applyF = (s) => {
  const n = cloneState(s);
  n.F = rotateFaceCW(s.F);
  [n.R[0], n.R[3], n.R[6]] = [s.U[6], s.U[7], s.U[8]];
  [n.D[0], n.D[1], n.D[2]] = [s.R[6], s.R[3], s.R[0]];
  [n.L[2], n.L[5], n.L[8]] = [s.D[0], s.D[1], s.D[2]];
  [n.U[6], n.U[7], n.U[8]] = [s.L[8], s.L[5], s.L[2]];
  return n;
};

const applyFCCW = (s) => applyF(applyF(applyF(s)));
const applyF2   = (s) => applyF(applyF(s));

/**
 * B face clockwise (looking at B from behind, which is from the back):
 *   U top row, L left col, D bottom row, R right col cycle.
 *   B-CW (as seen from behind):
 *   n.U[2,1,0] <- s.R[2,5,8]
 *   n.L[0,3,6] <- s.U[2,1,0]  ... need precise:
 *   n.R[2,5,8] <- s.D[6,7,8]
 *   n.D[6,7,8] <- s.L[6,3,0]  reversed
 *   n.L[0,3,6] <- s.U[2,1,0]
 *   n.U[0,1,2] <- s.R[8,5,2]  ... let me use the canonical derivation:
 *
 *   B-CW: right side of R goes up into U top-right.
 *   n.U[0,1,2] <- s.R[2,5,8]  (R right col, top first)
 *   n.L[0,3,6] <- s.U[2,1,0]  (U top row reversed)
 *   n.D[6,7,8] <- s.L[0,3,6]  ... 
 *   n.R[2,5,8] <- s.D[8,7,6]
 */
const applyB = (s) => {
  const n = cloneState(s);
  n.B = rotateFaceCW(s.B);
  [n.U[0], n.U[1], n.U[2]] = [s.R[2], s.R[5], s.R[8]];
  [n.L[0], n.L[3], n.L[6]] = [s.U[2], s.U[1], s.U[0]];
  [n.D[6], n.D[7], n.D[8]] = [s.L[0], s.L[3], s.L[6]];
  [n.R[2], n.R[5], n.R[8]] = [s.D[8], s.D[7], s.D[6]];
  return n;
};

const applyBCCW = (s) => applyB(applyB(applyB(s)));
const applyB2   = (s) => applyB(applyB(s));

// ------------------------------------------------------------------
// Move table
// ------------------------------------------------------------------

/**
 * Maps every Kociemba notation token to its state transformer function.
 * Kociemba uses U R F D L B with optional ' (CCW) or 2 (double).
 */
const MOVE_FUNCTIONS = {
  'U':  applyU,  "U'": applyUCCW, 'U2': applyU2,
  'R':  applyR,  "R'": applyRCCW, 'R2': applyR2,
  'F':  applyF,  "F'": applyFCCW, 'F2': applyF2,
  'D':  applyD,  "D'": applyDCCW, 'D2': applyD2,
  'L':  applyL,  "L'": applyLCCW, 'L2': applyL2,
  'B':  applyB,  "B'": applyBCCW, 'B2': applyB2,
};

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

/**
 * Starting from an initial cube state, compute a snapshot array where
 * snapshot[i] is the cube state AFTER applying the first i moves.
 * snapshot[0] is therefore the state before any moves (the scanned state).
 *
 * @param {Object} initialState - Starting cube state { U, R, F, D, L, B }
 *   where each value is a 9-element array of color code strings.
 * @param {string[]} moves - Array of Kociemba notation strings, e.g.
 *   ["U", "R2", "F'", "B"].
 * @returns {Object[]} Array of length moves.length + 1.
 */
export const buildStateSnapshots = (initialState, moves) => {
  const snapshots = [cloneState(initialState)];
  for (const move of moves) {
    const fn = MOVE_FUNCTIONS[move];
    if (!fn) {
      // Unknown move token — push the same state unchanged so indices stay aligned.
      snapshots.push(cloneState(snapshots[snapshots.length - 1]));
      console.warn('cubeStateEngine: unknown move token:', move);
    } else {
      snapshots.push(fn(snapshots[snapshots.length - 1]));
    }
  }
  return snapshots;
};

// ------------------------------------------------------------------
// Human-readable instruction strings
// ------------------------------------------------------------------

/**
 * A plain-English description for every possible Kociemba move token.
 * These are shown below the cube during step playback.
 */
const MOVE_INSTRUCTIONS = {
  'U':  'Turn the Upper (white) face 90° clockwise — as if spinning a bottle cap forward.',
  "U'": 'Turn the Upper (white) face 90° counter-clockwise.',
  'U2': 'Turn the Upper (white) face 180° (two quarter turns).',
  'D':  'Turn the Bottom (yellow) face 90° clockwise (viewed from below).',
  "D'": 'Turn the Bottom (yellow) face 90° counter-clockwise (viewed from below).',
  'D2': 'Turn the Bottom (yellow) face 180°.',
  'R':  'Turn the Right (blue) face 90° clockwise — front-right stickers move upward.',
  "R'": 'Turn the Right (blue) face 90° counter-clockwise — front-right stickers move downward.',
  'R2': 'Turn the Right (blue) face 180°.',
  'L':  'Turn the Left (green) face 90° clockwise — front-left stickers move downward.',
  "L'": 'Turn the Left (green) face 90° counter-clockwise — front-left stickers move upward.',
  'L2': 'Turn the Left (green) face 180°.',
  'F':  'Turn the Front (red) face 90° clockwise — hold the cube and rotate the face toward you.',
  "F'": 'Turn the Front (red) face 90° counter-clockwise.',
  'F2': 'Turn the Front (red) face 180°.',
  'B':  'Turn the Back (orange) face 90° clockwise (viewed from behind the cube).',
  "B'": 'Turn the Back (orange) face 90° counter-clockwise (viewed from behind).',
  'B2': 'Turn the Back (orange) face 180°.',
};

/**
 * Return the human-readable instruction string for a move token.
 * @param {string} move - e.g. "R", "U'", "F2".
 * @returns {string}
 */
export const getMoveInstruction = (move) =>
  MOVE_INSTRUCTIONS[move] ?? `Apply move: ${move}`;

// ------------------------------------------------------------------
// Camera-scanned state -> engine state conversion
// ------------------------------------------------------------------

/**
 * The scanned cube state from App.jsx uses face names Up/Right/Front/Down/Left/Back.
 * The engine uses the single-letter keys U/R/F/D/L/B.
 * This function converts between the two representations.
 *
 * @param {Object} appState - { Up, Right, Front, Down, Left, Back }
 * @returns {Object} - { U, R, F, D, L, B }
 */
export const appStateToEngineState = (appState) => ({
  U: appState.Up,
  R: appState.Right,
  F: appState.Front,
  D: appState.Down,
  L: appState.Left,
  B: appState.Back,
});

export const COLOR_HEX = {
  W: '#ffffff',
  Y: '#ffd500',
  G: '#009e60',
  B: '#0051ba',
  R: '#c41e3a',
  O: '#ff5800',
  E: '#1a1a2e',
};
