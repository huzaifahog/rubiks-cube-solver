import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipForward, SkipBack, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  buildStateSnapshots,
  getMoveInstruction,
  appStateToEngineState,
  COLOR_HEX,
} from '../utils/cubeStateEngine';

// Duration of a single face-turn CSS animation in milliseconds.
const ANIM_DURATION_MS = 400;

// Auto-play delay between steps (animation + pause).
const AUTOPLAY_INTERVAL_MS = 900;

// ------------------------------------------------------------------
// Camera angles that highlight each turning face.
// When the user steps through a move we briefly tilt the camera so the
// active face is more visible, then snap to the standard resting angle.
// ------------------------------------------------------------------
const FACE_CAMERA_ANGLE = {
  U: 'rotateX(-60deg) rotateY(-30deg)',
  D: 'rotateX(30deg) rotateY(-30deg)',
  R: 'rotateX(-20deg) rotateY(-100deg)',
  L: 'rotateX(-20deg) rotateY(30deg)',
  F: 'rotateX(-20deg) rotateY(-10deg)',
  B: 'rotateX(-20deg) rotateY(190deg)',
};

const RESTING_ANGLE = 'rotateX(-20deg) rotateY(-45deg)';

// Which face each move affects (for camera tilt).
const MOVE_FACE = {
  U: 'U', "U'": 'U', 'U2': 'U',
  R: 'R', "R'": 'R', 'R2': 'R',
  F: 'F', "F'": 'F', 'F2': 'F',
  D: 'D', "D'": 'D', 'D2': 'D',
  L: 'L', "L'": 'L', 'L2': 'L',
  B: 'B', "B'": 'B', 'B2': 'B',
};

// ------------------------------------------------------------------
// Face component — renders a single face of the 3D cube.
// The "animating" prop applies a CSS face-turn animation.
// ------------------------------------------------------------------
const CubeFace = ({ faceKey, stickers, className, animating, animClass }) => (
  <div
    className={`cube-face ${className} ${animating ? animClass : ''}`}
    style={{ '--anim-dur': `${ANIM_DURATION_MS}ms` }}
  >
    {stickers.map((color, i) => (
      <div
        key={i}
        className="sticker"
        style={{ background: COLOR_HEX[color] ?? COLOR_HEX.E }}
      />
    ))}
  </div>
);

// Maps each face key to its CSS class and its face-turn animation class.
const FACE_META = {
  U: { className: 'f-up',    animClass: 'face-turn-u' },
  D: { className: 'f-down',  animClass: 'face-turn-d' },
  F: { className: 'f-front', animClass: 'face-turn-f' },
  B: { className: 'f-back',  animClass: 'face-turn-b' },
  R: { className: 'f-right', animClass: 'face-turn-r' },
  L: { className: 'f-left',  animClass: 'face-turn-l' },
};

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------

/**
 * Cube3DView renders the solve sequence step by step.
 *
 * Props:
 *   solution   {string[]}  - Array of Kociemba move tokens e.g. ["U","R2","F'"].
 *   cubeState  {Object}    - The scanned cube state { Up, Right, Front, Down, Left, Back }.
 *   onReset    {Function}  - Called when the user clicks "Solve Another".
 */
const Cube3DView = ({ solution, cubeState, onReset }) => {
  // Convert scanned state (Up/Right/...) to engine state (U/R/...) once.
  const engineInitial = appStateToEngineState(cubeState);

  // Pre-compute every intermediate cube state so stepping is instant.
  const snapshots = buildStateSnapshots(engineInitial, solution);

  // Current step index. 0 = before any move. solution.length = after all moves.
  const [stepIndex, setStepIndex] = useState(0);

  // Which face is currently animating (null when idle).
  const [animatingFace, setAnimatingFace] = useState(null);

  // Camera transform — changes during each step to face the active face.
  const [cameraAngle, setCameraAngle] = useState(RESTING_ANGLE);

  // Whether auto-play is running.
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);

  // The cube state shown right now (may be mid-animation).
  const [displayedStateIndex, setDisplayedStateIndex] = useState(0);

  // ------------------------------------------------------------------
  // Step execution
  // ------------------------------------------------------------------

  /**
   * Advance or retreat by one step.
   * Direction: +1 = forward, -1 = backward.
   *
   * When going forward:
   *   1. Tilt camera toward the face being turned.
   *   2. Start the CSS face-turn animation.
   *   3. After ANIM_DURATION_MS, update the sticker colors to the new state
   *      and restore the resting camera angle.
   *
   * When going backward we skip the animation (just snap to the previous state).
   */
  const step = useCallback((direction) => {
    const nextIndex = stepIndex + direction;
    if (nextIndex < 0 || nextIndex > solution.length) return;

    if (direction === 1 && stepIndex < solution.length) {
      const move = solution[stepIndex];
      const face = MOVE_FACE[move] ?? null;

      // Tilt camera and start face animation.
      if (face) {
        setCameraAngle(FACE_CAMERA_ANGLE[face] ?? RESTING_ANGLE);
        setAnimatingFace(face);
      }

      // After the animation completes, flip the stickers and restore camera.
      setTimeout(() => {
        setDisplayedStateIndex(nextIndex);
        setStepIndex(nextIndex);
        setAnimatingFace(null);
        setCameraAngle(RESTING_ANGLE);
      }, ANIM_DURATION_MS);
    } else {
      // Backward or jump — instant update, no animation.
      setDisplayedStateIndex(nextIndex);
      setStepIndex(nextIndex);
      setAnimatingFace(null);
      setCameraAngle(RESTING_ANGLE);
    }
  }, [stepIndex, solution]);

  // ------------------------------------------------------------------
  // Auto-play
  // ------------------------------------------------------------------

  useEffect(() => {
    if (isPlaying) {
      if (stepIndex >= solution.length) {
        // Reached the end, stop.
        setIsPlaying(false);
        return;
      }
      playTimerRef.current = setTimeout(() => {
        step(1);
      }, AUTOPLAY_INTERVAL_MS);
    }
    return () => clearTimeout(playTimerRef.current);
  }, [isPlaying, stepIndex, step, solution.length]);

  const togglePlay = () => {
    if (stepIndex >= solution.length) {
      // Restart from beginning before playing.
      setDisplayedStateIndex(0);
      setStepIndex(0);
      setAnimatingFace(null);
      setCameraAngle(RESTING_ANGLE);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  };

  // ------------------------------------------------------------------
  // Derived display values
  // ------------------------------------------------------------------

  const currentState = snapshots[displayedStateIndex];
  const isAtStart = stepIndex === 0;
  const isAtEnd = stepIndex === solution.length;
  const isAnimating = animatingFace !== null;
  const isBusy = isAnimating; // block controls while animating

  const currentMove = stepIndex < solution.length ? solution[stepIndex] : null;
  const lastAppliedMove = stepIndex > 0 ? solution[stepIndex - 1] : null;

  const instructionText = isAtEnd
    ? 'Cube solved! All moves have been applied.'
    : isAtStart
    ? 'Press Play or use the arrows to step through the solution.'
    : getMoveInstruction(lastAppliedMove);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="solution-layout">

      {/* 3D cube viewer */}
      <div className="cube-viewer glass-panel">
        <div className="cube-3d-wrapper">
          <div
            className="cube-3d"
            style={{ transform: cameraAngle, transition: `transform ${ANIM_DURATION_MS}ms ease-in-out` }}
          >
            {Object.entries(FACE_META).map(([faceKey, { className, animClass }]) => (
              <CubeFace
                key={faceKey}
                faceKey={faceKey}
                stickers={currentState[faceKey]}
                className={className}
                animating={animatingFace === faceKey}
                animClass={animClass}
              />
            ))}
          </div>
        </div>

        {/* Step counter */}
        <div className="step-counter">
          {isAtEnd ? (
            <span style={{ color: '#10b981', fontWeight: 700 }}>Solved!</span>
          ) : (
            <span>Step <strong>{stepIndex}</strong> / {solution.length}</span>
          )}
        </div>

        {/* Current move label (large, shown during or just before each step) */}
        <div className="current-move-label">
          {isAtEnd ? null : currentMove ? (
            <>
              <span className="move-token">{currentMove}</span>
              <span className="move-hint">next move</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Right panel: instruction + controls + step list */}
      <div className="solution-panel glass-panel">

        {/* Human-readable instruction for the current step */}
        <div className="instruction-box">
          <div className="instruction-step-label">
            {isAtEnd ? 'Done' : `Move ${stepIndex + 1}: ${currentMove ?? ''}`}
          </div>
          <p className="instruction-text">{instructionText}</p>
        </div>

        {/* Playback controls */}
        <div className="playback-controls">
          <button
            onClick={() => { setIsPlaying(false); setDisplayedStateIndex(0); setStepIndex(0); setCameraAngle(RESTING_ANGLE); setAnimatingFace(null); }}
            disabled={isBusy || isAtStart}
            title="Back to start"
          >
            <SkipBack size={18} />
          </button>

          <button onClick={() => { setIsPlaying(false); step(-1); }} disabled={isBusy || isAtStart} title="Previous step">
            <ChevronLeft size={20} />
          </button>

          <button className="primary play-btn" onClick={togglePlay} disabled={isBusy}>
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>

          <button onClick={() => { setIsPlaying(false); step(1); }} disabled={isBusy || isAtEnd} title="Next step">
            <ChevronRight size={20} />
          </button>

          <button
            onClick={() => { setIsPlaying(false); setDisplayedStateIndex(solution.length); setStepIndex(solution.length); setCameraAngle(RESTING_ANGLE); setAnimatingFace(null); }}
            disabled={isBusy || isAtEnd}
            title="Skip to end"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* All move badges, scrollable */}
        <div className="solution-steps">
          {solution.map((move, idx) => (
            <div
              key={idx}
              className={`step-badge ${idx === stepIndex ? 'active' : idx < stepIndex ? 'done' : ''}`}
              onClick={() => {
                if (!isBusy) {
                  setIsPlaying(false);
                  setDisplayedStateIndex(idx);
                  setStepIndex(idx);
                  setCameraAngle(RESTING_ANGLE);
                  setAnimatingFace(null);
                }
              }}
              title={getMoveInstruction(move)}
              style={{ cursor: isBusy ? 'default' : 'pointer' }}
            >
              {move}
            </div>
          ))}
        </div>

        <button className="primary" onClick={onReset} style={{ marginTop: 'auto' }}>
          <RotateCcw size={18} /> Solve Another Cube
        </button>
      </div>
    </div>
  );
};

export default Cube3DView;
