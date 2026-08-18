# Rubik's Cube Solver

A full-stack Rubik's Cube solver that captures cube faces from a camera, converts them to Kociemba format, and solves the cube with the real Kociemba algorithm.

## Overview

This project is split into two main pieces:

- Frontend: React + Vite app for webcam face scanning and the interactive cube UI
- Backend: Express server that validates cube strings and solves them using Kociemba

## Stack

- Frontend: React 19, Vite, Axios, lucide-react
- Backend: Node.js, Express, dotenv, cors, kociemba
- Solver: real Kociemba implementation from the npm package

## Project structure

```text
rubiks-cube-solver/
├── backend-node/
│   ├── server.js
│   ├── package.json
│   ├── README.md
│   └── utils/
│       ├── cubeInput.js
│       └── cubeSolver.js
├── frontend/
│   ├── package.json
│   ├── README.md
│   ├── vite.config.js
│   └── src/
├── .gitignore
├── README.md
├── test-script.js
├── vercel.json
└── package.json
```

## Local setup

### 1) Install dependencies

```bash
npm install
npm --prefix frontend install
npm --prefix backend-node install
```

### 2) Run the backend

```bash
npm run dev:backend
```

Backend listens on:

- http://localhost:5000

### 3) Run the frontend

```bash
npm run dev:frontend
```

Frontend runs on:

- http://localhost:5173

### 4) Run the project test script

```bash
npm run test
```

## API endpoints

### GET /health

Returns server status.

Example response:

```json
{
  "status": "Server is running"
}
```

### POST /api/solve

Solves a cube from a 54-character Kociemba-style string.

Request body:

```json
{
  "cubeString": "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
}
```

Response:

```json
{
  "moves": ["R", "U", "R'", "U'"],
  "moveCount": 4,
  "error": null
}
```

### POST /api/solve-faces

Accepts six face strings instead of a combined cube string.

Request body:

```json
{
  "U": "UUUUUUUUU",
  "R": "RRRRRRRRR",
  "F": "FFFFFFFFF",
  "D": "DDDDDDDDD",
  "L": "LLLLLLLLL",
  "B": "BBBBBBBBB"
}
```

## Cube format

The backend expects a 54-character cube string using face letters:

- U = Up
- R = Right
- F = Front
- D = Down
- L = Left
- B = Back

Each face contributes 9 stickers, and each letter appears 9 times in the full 54-character cube string.

## Notes

- The real solver is implemented in [backend-node/utils/cubeSolver.js](backend-node/utils/cubeSolver.js)
- The frontend converts the scanned sticker colors into a valid cube string in [frontend/src/utils/cubeStringMapper.js](frontend/src/utils/cubeStringMapper.js)
- The webcam/detection logic lives in [frontend/src/utils/colorDetection.js](frontend/src/utils/colorDetection.js)

## Deployment

This repo is meant for local development and GitHub deployment. The backend is configured to run on port 5000 and the frontend uses Vite on port 5173.

## License

MIT
