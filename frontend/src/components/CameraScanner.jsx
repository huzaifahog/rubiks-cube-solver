import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw } from 'lucide-react';
import { extractColorsFromVideo } from '../utils/colorDetection';

/**
 * The scanner overlay in CSS uses "padding: 10%" which means the 3x3 grid
 * occupies from 10% to 90% of the video display on each axis.
 * This constant must match the CSS so that the sampling region in colorDetection.js
 * aligns with what the user actually sees inside the overlay squares.
 */
const OVERLAY_RECT = { x: 0.10, y: 0.10, width: 0.80, height: 0.80 };

/**
 * CSS color values for each sticker code. Used to color live feedback elements.
 * These match the CSS custom properties defined in index.css.
 */
const STICKER_CSS_COLOR = {
  W: '#ffffff',
  Y: '#ffd500',
  G: '#009e60',
  B: '#0051ba',
  R: '#c41e3a',
  O: '#ff5800',
  E: 'transparent',
};

const CameraScanner = ({ currentFace, onScanFace }) => {
  const webcamRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  /**
   * liveColors holds the 9 color codes detected from the current video frame.
   * It is updated every 400ms so the user sees real-time feedback:
   * - Each overlay cell border turns the color it is detecting.
   * - A mini 3x3 preview grid below the video shows the 9 decoded stickers.
   * This lets the user align the cube correctly before committing to a capture.
   */
  const [liveColors, setLiveColors] = useState(null);
  const liveTimerRef = useRef(null);

  useEffect(() => {
    liveTimerRef.current = setInterval(() => {
      const video = webcamRef.current?.video;
      // readyState 4 = HAVE_ENOUGH_DATA, meaning a stable frame is available
      if (video?.readyState === 4) {
        setLiveColors(extractColorsFromVideo(video, OVERLAY_RECT));
      }
    }, 400);

    return () => clearInterval(liveTimerRef.current);
  }, []);

  const capture = useCallback(() => {
    const video = webcamRef.current?.video;
    if (!video) return;

    setIsScanning(true);

    // Short delay so the "scanning" animation renders before the CPU-bound
    // canvas read blocks the main thread momentarily.
    setTimeout(() => {
      const colors = extractColorsFromVideo(video, OVERLAY_RECT);
      onScanFace(colors);
      setIsScanning(false);
    }, 200);
  }, [onScanFace]);

  return (
    <div className="glass-panel camera-container">
      <h2>Scan {currentFace} Face</h2>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
        Hold the face parallel to the camera and align all 9 stickers inside the grid.
        Cell borders show the detected colour in real time — use them to confirm alignment before capturing.
      </p>

      <div className="video-wrapper">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 400, height: 400, facingMode: 'environment' }}
        />

        {/*
          The 3x3 overlay grid defines the cube face detection region.
          CSS padding: 10% means the grid starts at 10% from every edge,
          matching OVERLAY_RECT above.

          When liveColors is available each cell's border color is replaced with
          the detected sticker color — an immediate visual indicator that the
          cube is correctly positioned and the colors are being read.
        */}
        <div className="scanner-overlay">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className={`scanner-cell ${isScanning ? 'scanned' : ''}`}
              style={
                liveColors
                  ? {
                      borderColor: STICKER_CSS_COLOR[liveColors[i]] ?? 'rgba(255,255,255,0.6)',
                      borderWidth: '3px',
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Mini 3x3 preview grid — shows the 9 decoded sticker colours at a glance */}
      {liveColors && (
        <div className="live-preview-grid">
          {liveColors.map((color, i) => (
            <div
              key={i}
              className="live-preview-cell"
              style={{ background: STICKER_CSS_COLOR[color] ?? '#333' }}
              title={color}
            />
          ))}
        </div>
      )}

      <button className="primary" onClick={capture} disabled={isScanning} style={{ width: '100%' }}>
        {isScanning ? <RefreshCw className="spin" size={20} /> : <Camera size={20} />}
        {isScanning ? 'Scanning...' : `Capture ${currentFace} Face`}
      </button>
    </div>
  );
};

export default CameraScanner;
