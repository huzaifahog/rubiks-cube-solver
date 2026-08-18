import kociemba from 'kociemba';

const SOLVED_STATE = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

/**
 * Validate a cube state.
 * Returns null if valid, otherwise an error string.
 */
export function validateCube(cubeString) {
  if (!cubeString || cubeString.length !== 54) {
    return `Cube string must be exactly 54 characters but got ${cubeString.length}`;
  }

  const validChars = /^[UDFBLR]+$/;
  if (!validChars.test(cubeString)) {
    return 'Cube string contains invalid characters. Only U, R, F, D, L, B are allowed.';
  }

  const colorCounts = {};
  for (const char of cubeString) {
    colorCounts[char] = (colorCounts[char] || 0) + 1;
  }

  for (const [color, count] of Object.entries(colorCounts)) {
    if (count !== 9) {
      return `Color count error: each face color must appear exactly 9 times. Got ${count} of ${color}.`;
    }
  }

  return null;
}

/**
 * Generate a random valid cube state for testing.
 */
export function generateRandomCube() {
  const faces = 'UDFBLR';
  let cube = '';
  const colorCounts = { U: 0, D: 0, F: 0, B: 0, L: 0, R: 0 };

  for (let i = 0; i < 54; i++) {
    let randomColor;
    do {
      randomColor = faces[Math.floor(Math.random() * 6)];
    } while (colorCounts[randomColor] >= 9);

    cube += randomColor;
    colorCounts[randomColor]++;
  }

  return cube;
}

export function isCubeSolved(cubeState) {
  return cubeState === SOLVED_STATE;
}

/**
 * Solve a cube using the real Kociemba library.
 */
export function solveCube(cubeString) {
  try {
    const normalized = String(cubeString || '').trim();

    if (!normalized) {
      return { moves: null, error: 'Cube string is required' };
    }

    const validationError = validateCube(normalized);
    if (validationError) {
      return { moves: null, error: validationError };
    }

    if (isCubeSolved(normalized)) {
      return { moves: [], error: null };
    }

    const solution = kociemba.solve(normalized);
    if (!solution || typeof solution !== 'string') {
      return { moves: null, error: 'Solver returned no valid move sequence' };
    }

    const moves = solution
      .split(/\s+/)
      .filter(Boolean);

    return { moves, error: null };
  } catch (error) {
    return {
      moves: null,
      error: `Solver error: ${error.message}`
    };
  }
}
