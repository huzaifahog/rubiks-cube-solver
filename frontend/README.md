# Frontend App

This is the React frontend for the Rubik's Cube solver.

## Run locally

```bash
npm install
npm run dev
```

The app runs on:

- http://localhost:5173

## App flow

- Webcam scanning captures a cube face
- The color detection logic identifies the nine stickers on that face
- The frontend converts the scanned result into a 54-character cube state
- The solved move list is fetched from the backend API

## Main files

- [src/App.jsx](src/App.jsx)
- [src/utils/colorDetection.js](src/utils/colorDetection.js)
- [src/utils/cubeStringMapper.js](src/utils/cubeStringMapper.js)
- [src/services/apiService.js](src/services/apiService.js)

## Build

```bash
npm run build
```

## Notes

The frontend expects the backend to be running locally on port 5000.
