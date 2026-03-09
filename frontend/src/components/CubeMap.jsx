import React, { useState } from 'react';
import { FACE_NAMES, COLOR_MAP } from '../utils/cubeStringMapper';

const CubeMap = ({ cubeState, onColorChange }) => {
  const [selectedColor, setSelectedColor] = useState('W');

  return (
    <div className="glass-panel cube-map-container">
      <h2>Verify Colors</h2>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
        Select a color below and click a sticker to manually override incorrect scans.
      </p>

      {/* Palette selector */}
      <div className="color-palette">
        {Object.entries(COLOR_MAP).map(([key, hex]) => {
          if (key === 'E') return null;
          return (
            <button
              key={key}
              className={`color-btn ${selectedColor === key ? 'selected' : ''}`}
              style={{ backgroundColor: hex }}
              onClick={() => setSelectedColor(key)}
            />
          );
        })}
      </div>

      {/* 2D Unfolded Cube Map Layout */}
      <div className="cube-map">
        {FACE_NAMES.map(faceName => (
          <div key={faceName} className={`cube-face-2d ${faceName.toLowerCase()}`}>
            {cubeState[faceName].map((colorChar, idx) => (
              <div
                key={`${faceName}-${idx}`}
                className={`cube-sticker-2d color-${colorChar}`}
                onClick={() => {
                  // Don't allow changing centers (idx 4)
                  if (idx === 4) return;
                  onColorChange(faceName, idx, selectedColor);
                }}
                style={{ cursor: idx !== 4 ? 'pointer' : 'default' , opacity: idx === 4 ? 0.8 : 1 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CubeMap;
