# Rubik's Cube Solver

A full-stack web application that solves Rubik's Cubes using the Kociemba Two-Phase Algorithm.

## Overview

This project consists of:
- **Frontend**: React-based UI for scanning cube faces and displaying solutions
- **Backend**: Node.js/Express server that solves cubes using advanced algorithms
- **Testing**: Comprehensive test suite for validating solutions

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rubiks-cube-solver
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend-node
   npm install
   cd ..
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running Locally

**Terminal 1 - Backend Server:**
```bash
cd backend-node
npm start
```

**Terminal 2 - Frontend Development:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Run Tests:**
```bash
npm run test
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

## Project Structure

```
rubiks-cube-solver/
├── backend-node/          # Node.js Express backend
│   ├── server.js          # Main server
│   ├── package.json       # Backend dependencies
│   └── utils/
│       └── cubeSolver.js  # Solving logic
├── frontend/              # React frontend with Vite
│   ├── src/
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js
├── test-script.js         # Standalone test suite
├── vercel.json            # Vercel deployment config
└── .gitignore
```

## API Documentation

### Solve Endpoint

**POST** `/api/solve`

Solves a Rubik's Cube given its state as a 54-character string.

**Request Body:**
```json
{
  "cubeString": "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
}
```

**Success Response (200):**
```json
{
  "moves": ["R", "U", "R'", "U'"],
  "moveCount": 4,
  "error": null
}
```

**Error Response (400):**
```json
{
  "moves": null,
  "moveCount": 0,
  "error": "Cube string contains invalid characters..."
}
```

### Health Check

**GET** `/health`

Returns server status.

## Testing

Run the comprehensive test suite:

```bash
npm run test
```

This will:
1. Generate 100 random valid cube states
2. Send each to the solver API
3. Verify that solutions actually solve the cubes
4. Report pass/fail statistics

Expected output:
```
============================================================
   RUBIK'S CUBE SOLVER - COMPREHENSIVE TEST SUITE
   Testing 100 random cube states
============================================================

✓ Test 1: Passed (21 moves)
✓ Test 2: Passed (19 moves)
❌ Test 3: API returned error - Invalid cube state
...

============================================================
   TEST SUMMARY
============================================================
Total Tests:    100
Passed:         98 ✓
Failed:         2 ❌
Success Rate:   98.00%
============================================================
```

## Features

- **Random Cube Generation**: Generate valid, solvable cube states
- **Input Validation**: Validates cube strings for correct format and legality
- **Solution Verification**: Tests confirm solutions actually solve cubes
- **Error Handling**: Detailed error messages for invalid inputs
- **CORS Support**: Frontend and backend can run on different servers
- **Production Ready**: Optimized for deployment on Vercel

## Cube State Format

Cube states are represented as 54-character strings:
- **Characters**: U (Up), D (Down), F (Front), B (Back), L (Left), R (Right)
- **Order**: Each face's 9 stickers in order (3×3 grid)
- **Constraint**: Each color appears exactly 9 times
- **Example**: `UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB` (solved cube)

## Deployment

### Deploy to Vercel

1. **Commit to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

2. **Connect to Vercel**
   - Visit https://vercel.com
   - Create new project from GitHub
   - Select this repository
   - Vercel automatically detects configuration
   - Click "Deploy"

3. **Access Your App**
   - Frontend: `https://your-project.vercel.app`
   - Backend API: `https://your-project.vercel.app/api/solve`

## Algorithm

The backend uses an optimized implementation of Kociemba's Two-Phase Algorithm:
- **Phase 1**: Orients edges and positions corners into specific groups
- **Phase 2**: Solves the remaining cube using limited move set
- **Performance**: Typically solves any cube in ≤21 moves
- **Memory**: Efficient with pruning tables for fast computation

## Environment Variables

Backend (`.env` file in `backend-node/`):
```
PORT=5000
NODE_ENV=development
```

For Vercel production, set `NODE_ENV=production` in dashboard.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot connect to server | Run `npm install` and check port 5000 is free |
| Tests fail to run | Ensure backend is running with `npm start` |
| CORS errors | Check that frontend URL is allowed in server CORS settings |
| Deployment fails | Check Vercel logs in dashboard, ensure all files committed |

## License

MIT

## Contributing

Contributions welcome! Please:
1. Test your changes with `npm run test`
2. Ensure all tests pass
3. Commit meaningful messages
4. Push to feature branch
5. Submit pull request

## Support

For issues or questions:
- Check the test output for detailed error messages
- Review API response errors
- Check Vercel deployment logs
- Verify cube string format (54 chars, valid colors)
