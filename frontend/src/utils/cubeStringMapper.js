export const FACE_NAMES = ['Up', 'Right', 'Front', 'Down', 'Left', 'Back'];

export const INITIAL_CUBE_STATE = {
  Up: Array(9).fill('W'),
  Right: Array(9).fill('B'),
  Front: Array(9).fill('R'),
  Down: Array(9).fill('Y'),
  Left: Array(9).fill('G'),
  Back: Array(9).fill('O'),
};

export const COLOR_MAP = {
  W: '#ffffff', // Up face center (white)
  Y: '#ffd500', // Down face center (yellow)
  G: '#009e60', // Left face center (green)
  B: '#0051ba', // Right face center (blue)
  R: '#c41e3a', // Front face center (red)
  O: '#ff5800', // Back face center (orange)
  E: '#333333', // Unknown / error
};

// Maps each scanned color code to its Kociemba face letter.
// This relies on the fixed Western color scheme (white up, blue right, red front).
// The centers are always preserved from INITIAL_CUBE_STATE in App.jsx so this
// mapping is always valid regardless of what the camera detected for other stickers.
const COLOR_TO_FACE_LETTER = {
  W: 'U',
  B: 'R',
  R: 'F',
  Y: 'D',
  G: 'L',
  O: 'B',
};

/**
 * Build the 54-character Kociemba cube string from the scanned cube state.
 *
 * Each sticker color code (W/Y/G/B/R/O) is mapped to the face letter whose
 * center has that color (U/R/F/D/L/B). Unknown or error codes ('E') are
 * logged with their position so the user can find and correct them in the
 * 2D map rather than silently producing a corrupted string.
 *
 * @param {Object} cubeState - { Up, Right, Front, Down, Left, Back } arrays of color codes
 * @returns {string} 54-character string for the backend
 */
export const buildCubeString = (cubeState) => {
  const faceOrder = [
    { key: 'Up',    letter: 'U' },
    { key: 'Right', letter: 'R' },
    { key: 'Front', letter: 'F' },
    { key: 'Down',  letter: 'D' },
    { key: 'Left',  letter: 'L' },
    { key: 'Back',  letter: 'B' },
  ];

  let result = '';

  for (const { key, letter } of faceOrder) {
    const face = cubeState[key];
    for (let i = 0; i < 9; i++) {
      const colorCode = face[i];
      const faceLetter = COLOR_TO_FACE_LETTER[colorCode];
      if (!faceLetter) {
        // Unknown sticker — log position details so the developer can track it down.
        // We substitute the face's own letter so the character set stays valid,
        // but this will likely cause a parity error that the backend reports specifically.
        console.warn(
          `buildCubeString: unknown color code "${colorCode}" at ${key}[${i}]. ` +
          `This sticker will need to be corrected in the 2D map.`
        );
        result += letter; // use the face's own letter as a safe placeholder
      } else {
        result += faceLetter;
      }
    }
  }

  console.log('Cube string sent to solver:', result);
  return result;
};

/**
 * Count how many stickers of each face letter appear in the built string.
 * Returns an object like { U: 9, R: 9, F: 9, D: 9, L: 9, B: 9 } for a valid cube.
 *
 * @param {Object} cubeState
 * @returns {{ counts: Object, errors: string[] }}
 */
export const validateCubeState = (cubeState) => {
  const cubeString = buildCubeString(cubeState);
  const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };

  for (const ch of cubeString) {
    if (counts[ch] !== undefined) counts[ch]++;
  }

  const errors = [];
  for (const [letter, count] of Object.entries(counts)) {
    if (count !== 9) {
      errors.push(`${letter} face has ${count} stickers (expected 9)`);
    }
  }

  return { counts, errors, cubeString };
};
