# Backend API

This folder contains the Express backend for the Rubik's Cube solver.

## Stack

- Node.js
- Express
- CORS
- dotenv
- Kociemba

## Run locally

```bash
npm install
npm run dev
```

The server starts on:

- http://localhost:5000

## Endpoints

### GET /health

Returns the health status of the API.

Example response:

```json
{
  "status": "Server is running"
}
```

### POST /api/solve

Solves a cube from a 54-character cube string.

Request example:

```json
{
  "cubeString": "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
}
```

Response example:

```json
{
  "moves": ["R", "U", "R'", "U'"],
  "moveCount": 4,
  "error": null
}
```

### POST /api/solve-faces

Solves a cube from six face strings instead of a single combined string.

Example request:

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

## Env

Create a .env file in this folder if needed:

```env
PORT=5000
NODE_ENV=development
```

## Important note

The real solving code is implemented in [utils/cubeSolver.js](utils/cubeSolver.js). It uses the installed Kociemba package rather than the older generated fake solver.
