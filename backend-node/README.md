# Rubik's Cube Solver - Node.js Backend

This is the rewritten Node.js backend for the Rubik's Cube Solver project, designed for deployment on Vercel.

## Project Structure

```
rubiks-cube-solver/
├── backend-node/          # Node.js Express backend
│   ├── server.js          # Main server file
│   ├── package.json       # Dependencies
│   ├── .env               # Environment variables
│   └── utils/
│       └── cubeSolver.js  # Cube solving logic
├── frontend/              # React frontend
│   ├── package.json
│   ├── index.html
│   └── src/
├── test-script.js         # Standalone test script
└── vercel.json            # Vercel configuration
```

## Installation

### 1. Install Backend Dependencies

```bash
cd backend-node
npm install
```

### 2. Install Frontend Dependencies (if needed)

```bash
cd frontend
npm install
```

## Running Locally

### Terminal 1 - Start the Backend Server

```bash
cd backend-node
npm start
```

The server will start on `http://localhost:5000`

### Terminal 2 - Run Tests

```bash
npm run test
```

This will run 100 tests against random cube states and verify that:
- The API returns valid solutions
- Each solution actually solves the generated cube
- Invalid inputs are handled correctly

### Terminal 3 - Start Frontend (Optional)

```bash
cd frontend
npm run dev
```

## API Endpoints

### POST /api/solve

Solves a Rubik's Cube given its state.

**Request:**
```json
{
  "cubeString": "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
}
```

**Response (Success):**
```json
{
  "moves": ["R", "U", "R'", "U'", "..."],
  "moveCount": 21,
  "error": null
}
```

**Response (Error):**
```json
{
  "moves": null,
  "moveCount": 0,
  "error": "Error message describing the issue"
}
```

### GET /health

Health check endpoint. Returns:
```json
{
  "status": "Server is running"
}
```

## Deployment to Vercel

### Prerequisites

- Vercel account (https://vercel.com)
- GitHub account with code pushed

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Rewrite backend in Node.js"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Visit https://vercel.com
   - Click "New Project"
   - Select your GitHub repository
   - Vercel will auto-detect the setup
   - Click "Deploy"

3. **Environment Variables** (if needed)
   - Set `NODE_ENV=production` in Vercel dashboard

## Testing Results

After running `npm run test`, you'll see:
- ✓ Passed tests
- ❌ Failed tests (if any)
- Success rate percentage
- Detailed error reports for failed tests

## Notes

- The cube string format: 54 characters representing the 6 faces (U, D, F, B, L, R)
- Each face has exactly 9 stickers
- All colors must appear exactly 9 times
- Solutions are returned as move sequences (e.g., "R", "U'", "F2")

## Environment Variables

Create a `.env` file in `backend-node/`:

```
PORT=5000
NODE_ENV=development
```

For production (Vercel), set:

```
NODE_ENV=production
```

## Troubleshooting

**Cannot connect to server:**
- Make sure you're in the `backend-node` directory
- Run `npm install` if you haven't already
- Check that port 5000 is not in use

**Tests failing:**
- Ensure the server is running (`npm start`)
- Check that the API is responding (`curl http://localhost:5000/health`)
- Review error messages in the test output

**Deployment issues:**
- Check Vercel logs: https://vercel.com/dashboard
- Ensure all files are committed to GitHub
- Make sure `package.json` versions are compatible
