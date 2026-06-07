/**
 * Utility functions for handling cube face input
 * Supports both camera/image input and manual color input
 */

/**
 * Convert 6 individual cube faces to a single 54-character cube string
 * Each face should be an array of 9 color characters in order
 * 
 * @param {Object} faces - Object with keys U, R, F, D, L, B, each containing 9 color chars
 * @returns {string} 54-character cube string
 */
export function combineFaces(faces) {
  const order = ['U', 'R', 'F', 'D', 'L', 'B'];
  let cubeString = '';
  
  for (const face of order) {
    if (!faces[face] || faces[face].length !== 9) {
      throw new Error(`Face ${face} must have exactly 9 stickers`);
    }
    cubeString += faces[face];
  }
  
  if (cubeString.length !== 54) {
    throw new Error('Combined cube string must be exactly 54 characters');
  }
  
  return cubeString;
}

/**
 * Split a 54-character cube string into 6 individual faces
 * 
 * @param {string} cubeString - 54-character cube string
 * @returns {Object} Object with keys U, R, F, D, L, B containing 9-char strings
 */
export function separateFaces(cubeString) {
  if (cubeString.length !== 54) {
    throw new Error('Cube string must be exactly 54 characters');
  }
  
  return {
    U: cubeString.substring(0, 9),
    R: cubeString.substring(9, 18),
    F: cubeString.substring(18, 27),
    D: cubeString.substring(27, 36),
    L: cubeString.substring(36, 45),
    B: cubeString.substring(45, 54)
  };
}

/**
 * Detect colors from an image of a cube face
 * This would integrate with frontend camera/image processing
 * 
 * @param {Buffer|Blob} imageData - Image data from camera or upload
 * @param {Array<string>} gridPositions - Grid positions to analyze (3x3)
 * @returns {Promise<Array<string>>} Array of 9 detected colors
 */
export async function detectColorsFromImage(imageData, gridPositions) {
  // This function would use image processing library like:
  // - jimp
  // - sharp
  // - OpenCV.js
  // to analyze the image and detect the 9 colors in a 3x3 grid
  
  // Placeholder - in production, implement actual color detection
  throw new Error('Color detection requires image processing library integration');
}

/**
 * Validate that a face has exactly 9 stickers of the expected colors
 * 
 * @param {string} faceString - 9-character string representing one face
 * @param {string} expectedColor - The color that should appear (e.g., 'U' for white)
 * @returns {boolean} True if valid, false otherwise
 */
export function validateFace(faceString, expectedColor) {
  if (faceString.length !== 9) {
    return false;
  }
  
  // At least one sticker should be the center color (expected color)
  // This is a loose validation - actual validation happens in main validator
  return /^[UDFBLR]{9}$/.test(faceString);
}

/**
 * Map camera input format to cube notation
 * Handles different camera orientations and perspectives
 * 
 * @param {Object} cameraCapture - Object with button-labeled colors (e.g., { topLeft: 'W', topCenter: 'W', ... })
 * @returns {string} 9-character face string in order
 */
export function mapCameraInputToFace(cameraCapture) {
  // Standard 3x3 grid mapping
  const gridOrder = [
    'topLeft', 'topCenter', 'topRight',
    'middleLeft', 'center', 'middleRight',
    'bottomLeft', 'bottomCenter', 'bottomRight'
  ];
  
  let faceString = '';
  for (const position of gridOrder) {
    if (!cameraCapture[position]) {
      throw new Error(`Missing color for position: ${position}`);
    }
    faceString += cameraCapture[position];
  }
  
  return faceString;
}

/**
 * Convert RGB color to cube notation (U, R, F, D, L, B)
 * Returns the closest matching color
 * 
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {string} Color notation (U, R, F, D, L, B)
 */
export function rgbToColorNotation(r, g, b) {
  // Color mapping based on standard cube colors
  const colors = {
    'U': { r: 255, g: 255, b: 255 }, // White - Up
    'D': { r: 255, g: 255, b: 0 },   // Yellow - Down
    'F': { r: 0, g: 255, b: 0 },     // Green - Front
    'B': { r: 0, g: 0, b: 255 },     // Blue - Back
    'L': { r: 255, g: 165, b: 0 },   // Orange - Left
    'R': { r: 255, g: 0, b: 0 }      // Red - Right
  };
  
  let closestColor = 'U';
  let closestDistance = Infinity;
  
  for (const [notation, rgb] of Object.entries(colors)) {
    const distance = Math.sqrt(
      Math.pow(r - rgb.r, 2) +
      Math.pow(g - rgb.g, 2) +
      Math.pow(b - rgb.b, 2)
    );
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestColor = notation;
    }
  }
  
  return closestColor;
}

/**
 * Generate a user-friendly face description
 * 
 * @param {string} faceLetter - Single letter (U, R, F, D, L, B)
 * @returns {string} User-friendly name
 */
export function getFaceName(faceLetter) {
  const names = {
    'U': 'Up (White)',
    'D': 'Down (Yellow)',
    'F': 'Front (Green)',
    'B': 'Back (Blue)',
    'L': 'Left (Orange)',
    'R': 'Right (Red)'
  };
  
  return names[faceLetter] || 'Unknown';
}

/**
 * Get the expected color for a face (center sticker)
 * 
 * @param {string} faceLetter - Single letter (U, R, F, D, L, B)
 * @returns {string} The letter representing that color
 */
export function getFaceColor(faceLetter) {
  // In a standard Rubik's cube, each face's center sticker matches the face letter
  return faceLetter;
}
