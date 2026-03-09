import React, { useState } from 'react';
import CameraScanner from './components/CameraScanner';
import CubeMap from './components/CubeMap';
import       Cube3DView from './components/Cube3DView';
import { solveCube } from './services/apiService';
import { INITIAL_CUBE_STATE, FACE_NAMES, buildCubeString, validateCubeState } from './utils/cubeStringMapper';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import './index.css';

// Face letter → human-readable name for the diagnostic count display
const FACE_LABEL = { U: 'Up (white)', R: 'Right (blue)', F: 'Front (red)', D: 'Down (yellow)', L: 'Left (green)', B: 'Back (orange)' };

/**
 * Shown after all 6 faces are scanned.
 * Runs a client-side color count check so the user can see which face (if any)
 * has the wrong number of stickers before even hitting the backend.
 * The full 54-character Kociemba string is also displayed for debugging.
 */
const AllFacesPanel = ({ cubeState, isSolving, onSolve, onReset }) => {
  const { counts, errors, cubeString } = validateCubeState(cubeState);
  const hasCountErrors = errors.length > 0;

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>All Faces Scanned</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Review the 2D map on the right. Use the colour palette to correct any wrong stickers before solving.
      </p>

      {/* Color count diagnostic — each face should show exactly 9 */}
      <div className="diagnostic-grid">
        {Object.entries(counts).map(([letter, count]) => (
          <div key={letter} className={`diagnostic-cell ${count === 9 ? 'ok' : 'bad'}`}>
            <span className="diag-label">{FACE_LABEL[letter]}</span>
            <span className="diag-count">{count} / 9</span>
          </div>
        ))}
      </div>

      {/* Show specific count error hints */}
      {hasCountErrors && (
        <div className="warning-box">
          <AlertTriangle size={16} />
          <span>
            Sticker count mismatch detected — the solver will likely reject this.
            Correct the highlighted faces in the 2D map before solving.
          </span>
        </div>
      )}

      {/* Cube string for copy-paste debugging */}
      <details style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <summary style={{ cursor: 'pointer', marginBottom: '0.4rem' }}>Show raw cube string (for debugging)</summary>
        <code style={{ wordBreak: 'break-all', background: 'rgba(0,0,0,0.4)', padding: '0.5rem', borderRadius: '6px', display: 'block', fontSize: '0.85rem', letterSpacing: '0.05em', color: '#a5b4fc' }}>
          {cubeString}
        </code>
      </details>

      <button
        className="primary"
        onClick={onSolve}
        disabled={isSolving}
        style={{ width: '100%', marginTop: '0.5rem' }}
      >
        {isSolving ? 'Solving...' : 'Solve Cube'} <ArrowRight size={18} />
      </button>
      <button onClick={onReset}>Start Over</button>
    </div>
  );
};

function App() {
  const [cubeState, setCubeState] = useState(INITIAL_CUBE_STATE);
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const [solution, setSolution] = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState(null);

  const currentFace = FACE_NAMES[currentFaceIndex];
  const allFacesScanned = currentFaceIndex >= FACE_NAMES.length;

  const handleScanFace = (colors) => {
    // Preserve the center color
    const newColors = [...colors];
    newColors[4] = INITIAL_CUBE_STATE[currentFace][4];
    
    setCubeState(prev => ({
      ...prev,
      [currentFace]: newColors
    }));

    if (currentFaceIndex < FACE_NAMES.length) {
      setCurrentFaceIndex(prev => prev + 1);
    }
  };

  const handleColorOverride = (faceName, stickerIdx, newColor) => {
    setCubeState(prev => {
      const updatedFace = [...prev[faceName]];
      updatedFace[stickerIdx] = newColor;
      return { ...prev, [faceName]: updatedFace };
    });
  };

  const handleSolve = async () => {
    setIsSolving(true);
    setError(null);
    try {
      const cubeString = buildCubeString(cubeState);
      const data = await solveCube(cubeString);
      setSolution(data.moves);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSolving(false);
    }
  };

  const handleReset = () => {
    setCubeState(INITIAL_CUBE_STATE);
    setCurrentFaceIndex(0);
    setSolution(null);
    setError(null);
  };

  return (
    <div className="app-container">
      <header>
        <h1>Rubik's Solver</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Powered by Kociemba Two-Phase Algorithm</p>
      </header>

      {error && (
        <div className="error-message">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {!solution ? (
        <div className="main-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {!allFacesScanned ? (
              <>
                <CameraScanner 
                  currentFace={currentFace} 
                  onScanFace={handleScanFace} 
                />
                <div className="face-indicator">
                  {FACE_NAMES.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`face-dot ${idx < currentFaceIndex ? 'completed' : idx === currentFaceIndex ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </>
            ) : (
                <AllFacesPanel
                  cubeState={cubeState}
                  isSolving={isSolving}
                  onSolve={handleSolve}
                  onReset={handleReset}
                />
            )}
          </div>
          <CubeMap 
            cubeState={cubeState} 
            onColorChange={handleColorOverride} 
          />
        </div>
      ) : (
        <Cube3DView solution={solution} cubeState={cubeState} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
