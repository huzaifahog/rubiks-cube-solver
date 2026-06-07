import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { solveCube, validateCube } from './utils/cubeSolver.js';
import { combineFaces, separateFaces, validateFace } from './utils/cubeInput.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Solve endpoint
app.post('/api/solve', (req, res) => {
  try {
    const { cubeString } = req.body;

    // Validate input
    if (!cubeString) {
      return res.status(400).json({
        moves: null,
        moveCount: 0,
        error: 'Cube string is required'
      });
    }

    if (cubeString.length !== 54) {
      return res.status(400).json({
        moves: null,
        moveCount: 0,
        error: `Cube string must be exactly 54 characters but got ${cubeString.length}. Make sure all 6 faces have been scanned.`
      });
    }

    // Validate characters
    const validChars = /^[UDFBLR]+$/;
    if (!validChars.test(cubeString)) {
      return res.status(400).json({
        moves: null,
        moveCount: 0,
        error: 'Cube string contains invalid characters. Only U, R, F, D, L, B are allowed.'
      });
    }

    // Validate cube state
    const validationError = validateCube(cubeString);
    if (validationError) {
      return res.status(400).json({
        moves: null,
        moveCount: 0,
        error: validationError
      });
    }

    // Solve the cube
    const solution = solveCube(cubeString);

    if (solution.error) {
      return res.status(400).json({
        moves: null,
        moveCount: 0,
        error: solution.error
      });
    }

    return res.json({
      moves: solution.moves,
      moveCount: solution.moves.length,
      error: null
    });
  } catch (error) {
    console.error('Error solving cube:', error);
    return res.status(500).json({
      moves: null,
      moveCount: 0,
      error: 'Internal server error: ' + error.message
    });
  }
});

// Endpoint to combine 6 faces and solve
// Accepts: { U: "UUUUUUUUU", R: "RRRRRRRRR", F: "FFFFFFFFF", D: "DDDDDDDDD", L: "LLLLLLLLL", B: "BBBBBBBBB" }
app.post('/api/solve-faces', (req, res) => {
  try {
    const { U, R, F, D, L, B } = req.body;

    // Validate all faces are present
    if (!U || !R || !F || !D || !L || !B) {
      return res.status(400).json({
        moves: null,
        moveCount: 0,
        error: 'All 6 faces (U, R, F, D, L, B) are required'
      });
    }

    // Validate each face has exactly 9 characters
    const faces = { U, R, F, D, L, B };
    for (const [name, face] of Object.entries(faces)) {
      if (typeof face !== 'string' || face.length !== 9) {
        return res.status(400).json({
          moves: null,
          moveCount: 0,
          error: `Face ${name} must be exactly 9 characters, got ${face.length}`
        });
      }
      
      if (!validateFace(face, name)) {
        return res.status(400).json({
          moves: null,
          moveCount: 0,
          error: `Face ${name} contains invalid characters. Only U, R, F, D, L, B are allowed.`
        });
      }
    }

    // Combine faces into single cube string
    let cubeString;
    try {
      cubeString = combineFaces(faces);
    } catch (error) {
      return res.status(400).json({
        moves: null,
        moveCount: 0,
        error: `Error combining faces: ${error.message}`
      });
    }

    // Validate cube state
    const validationError = validateCube(cubeString);
    if (validationError) {
      return res.status(400).json({
        moves: null,
        moveCount: 0,
        error: validationError
      });
    }

    // Solve the cube
    const solution = solveCube(cubeString);

    if (solution.error) {
      return res.status(400).json({
        moves: null,
        moveCount: 0,
        error: solution.error
      });
    }

    return res.json({
      moves: solution.moves,
      moveCount: solution.moves.length,
      error: null
    });
  } catch (error) {
    console.error('Error in solve-faces endpoint:', error);
    return res.status(500).json({
      moves: null,
      moveCount: 0,
      error: 'Internal server error: ' + error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
