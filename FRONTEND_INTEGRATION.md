# Frontend Integration Guide

This guide explains how to integrate the React frontend with the Node.js backend for the Rubik's Cube Solver.

## API Endpoints

### 1. Solve Cube (From Complete Cube String)

**Endpoint:** `POST /api/solve`

**Purpose:** Solve a cube when you have the complete 54-character cube state.

**Request:**
```javascript
const cubeString = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

fetch('http://localhost:5000/api/solve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cubeString })
})
.then(res => res.json())
.then(data => {
  console.log('Solution:', data.moves);
  console.log('Moves needed:', data.moveCount);
});
```

**Response:**
```json
{
  "moves": ["R", "U", "R'", "U'", "F2", "..."],
  "moveCount": 21,
  "error": null
}
```

### 2. Solve Cube (From 6 Faces)

**Endpoint:** `POST /api/solve-faces`

**Purpose:** Submit 6 individual cube faces from camera scanning or manual input, and get the solution.

**Request:**
```javascript
const faces = {
  U: "UUUUUUUUU",  // Top face (9 characters)
  R: "RRRRRRRRR",  // Right face
  F: "FFFFFFFFF",  // Front face
  D: "DDDDDDDDD",  // Bottom face
  L: "LLLLLLLLL",  // Left face
  B: "BBBBBBBBB"   // Back face
};

fetch('http://localhost:5000/api/solve-faces', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(faces)
})
.then(res => res.json())
.then(data => {
  if (data.error) {
    console.error('Error:', data.error);
  } else {
    console.log('Solution:', data.moves);
  }
});
```

**Response:**
```json
{
  "moves": ["R", "U", "R'", "..."],
  "moveCount": 21,
  "error": null
}
```

## Cube State Format

### 54-Character String Format

The cube is represented as a 54-character string where each character represents a sticker color:

```
U (0-8):   U U U     R (9-17):  R R R     etc...
           U U U                R R R
           U U U                R R R

Position:  0 1 2
           3 4 5
           6 7 8
```

**Characters:**
- `U` = Up face (White)
- `D` = Down face (Yellow)
- `F` = Front face (Green)
- `B` = Back face (Blue)
- `L` = Left face (Orange)
- `R` = Right face (Red)

**Solved Cube:**
```
UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
```

### 6-Face Format

Each face is submitted as a 9-character string in grid order:

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

**Grid Order for Each Face:**
```
[0] [1] [2]
[3] [4] [5]
[6] [7] [8]
```

Position 4 is always the center sticker (fixed color for that face).

## Camera Integration

### Step 1: Capture Face Image

```javascript
async function captureFaceImage() {
  // Use <video> element with camera input
  const video = document.getElementById('camera');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg');
}
```

### Step 2: Detect Sticker Colors

```javascript
function detectStickersFromImage(imageData) {
  // Divide image into 3x3 grid
  const width = imageData.width;
  const height = imageData.height;
  
  const colors = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      // Sample center of each grid square
      const x = Math.floor(width * (col + 0.5) / 3);
      const y = Math.floor(height * (row + 0.5) / 3);
      
      const color = getColorAtPixel(imageData, x, y);
      colors.push(color);  // Returns 'U', 'R', 'F', 'D', 'L', or 'B'
    }
  }
  
  return colors.join('');  // 9-character string
}
```

### Step 3: Submit All 6 Faces

```javascript
const cubeState = {};
const faceLetters = ['U', 'R', 'F', 'D', 'L', 'B'];
const faceNames = ['Top', 'Right', 'Front', 'Bottom', 'Left', 'Back'];

// For each face...
for (let i = 0; i < 6; i++) {
  // Show message to user
  console.log(`Scan ${faceNames[i]} face`);
  
  // Capture and detect
  const imageData = await captureFaceImage();
  cubeState[faceLetters[i]] = detectStickersFromImage(imageData);
}

// Submit to solver
const response = await fetch('http://localhost:5000/api/solve-faces', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(cubeState)
});

const solution = await response.json();
displaySolution(solution.moves);
```

## Manual Input

If the user prefers to input colors manually instead of camera:

```javascript
// User clicks stickers in a 3x3 grid
function handleStickerClick(faceIndex, stickerIndex, colorSelected) {
  cubeState[faceIndex][stickerIndex] = colorSelected;
}

// After all 9 stickers of each face filled in...
function submitManualInput() {
  const faces = {
    U: cubeState[0].join(''),
    R: cubeState[1].join(''),
    F: cubeState[2].join(''),
    D: cubeState[3].join(''),
    L: cubeState[4].join(''),
    B: cubeState[5].join('')
  };
  
  // Submit via API
  submitFaceData(faces);
}
```

## Error Handling

### Invalid Cube Errors

The API returns errors in this format:

```json
{
  "moves": null,
  "moveCount": 0,
  "error": "Descriptive error message"
}
```

**Common Errors:**

| Error | Meaning | Solution |
|-------|---------|----------|
| `Cube string must be exactly 54 characters` | Wrong length | Rescan all faces |
| `Cube string contains invalid characters` | Bad color input | Verify color detection |
| `Color count error: each face color must appear exactly 9 times` | Duplicate colors | Rescan with better lighting |
| `Edge piece error` | Invalid cube configuration | The cube state is physically impossible |
| `Corner twist error` | Twisted corner piece | The cube state is impossible without disassembly |
| `Parity error` | Impossible move sequence | Likely a mis-scanned sticker |

### Handling Errors in Frontend

```javascript
fetch(apiUrl, { method: 'POST', body: JSON.stringify(data) })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      // Display error to user
      showErrorMessage(data.error);
      // Suggest re-scanning
      promptUserToRescan();
    } else {
      // Display solution
      displaySolution(data.moves, data.moveCount);
    }
  });
```

## Solution Display

### Formatting Moves

Standard Rubik's cube notation:
- `R` = Clockwise 90°
- `R'` = Counter-clockwise 90°
- `R2` = 180°

Faces: U (Up), D (Down), F (Front), B (Back), L (Left), R (Right)

### Displaying Steps

```javascript
function displaySolution(moves, moveCount) {
  console.log(`Solution found in ${moveCount} moves:`);
  console.log(moves.join(' '));
  
  // Display step-by-step
  moves.forEach((move, index) => {
    setTimeout(() => {
      highlightFace(move);
      showInstruction(`Move ${index + 1}/${moveCount}: ${move}`);
    }, index * 2000);  // 2 seconds per move
  });
}
```

## Testing the Integration

### Quick Test

```javascript
// Test endpoint
async function testBackend() {
  const response = await fetch('http://localhost:5000/health');
  const data = await response.json();
  console.log(data);  // { status: 'Server is running' }
}

testBackend();
```

### Test with Sample Cube

```javascript
// Test with a valid cube string
const testCube = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

fetch('http://localhost:5000/api/solve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cubeString: testCube })
})
.then(res => res.json())
.then(data => console.log(data));
```

## Environment Configuration

### Development

Backend URL: `http://localhost:5000`

### Production (Vercel)

Backend URL: `https://your-project.vercel.app`

### Setting Backend URL in Frontend

```javascript
const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

fetch(`${API_URL}/api/solve`, {
  // ... request config
});
```

Update `frontend/.env.local`:
```
VITE_API_URL=http://localhost:5000
```

Update `frontend/.env.production`:
```
VITE_API_URL=https://your-project.vercel.app
```

## CORS Configuration

The backend allows requests from any origin (CORS enabled). For production, you may want to restrict this:

```javascript
// In server.js
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

## Performance Tips

1. **Debounce API calls** - Don't spam requests
2. **Show loading state** - User knows something is happening
3. **Cache results** - For identical cube states
4. **Validate client-side** - Catch errors before sending
5. **Timeout requests** - Long network delays

Example:

```javascript
async function solveCubeWithFallback(cubeState) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);  // 10s timeout
    
    const response = await fetch('http://localhost:5000/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cubeString: cubeState }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    showErrorMessage('Request timeout or network error');
  }
}
```
