import React, { useState, useEffect } from 'react';
import Scene3D from './components/Scene3D';
import UIOverlay from './components/UIOverlay';
import { AppState, ControlMode } from './types';

import HandController, { HandGesture } from './components/HandController';

const App: React.FC = () => {
  // Application State
  const [controlMode, setControlMode] = useState<ControlMode>(ControlMode.MOUSE);
  const [focusedBody, setFocusedBody] = useState<string | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [particleDensity, setParticleDensity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [bloomIntensity, setBloomIntensity] = useState<number>(1.5);
  const [showUI, setShowUI] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Hand Gesture State (shared with Scene3D via a ref or context would be better, but for now passing via props/state)
  // Actually, Scene3D needs to react to these. Let's pass a gesture callback or state object.
  // We'll use a Ref to store the latest gesture to avoid re-rendering App too often, 
  // but Scene3D needs to read it in useFrame.
  const gestureRef = React.useRef<HandGesture>({ type: 'NONE' });

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const appState: AppState = {
    controlMode,
    setControlMode,
    focusedBody,
    setFocusedBody,
    simulationSpeed,
    setSimulationSpeed,
    particleDensity,
    setParticleDensity,
    bloomIntensity,
    setBloomIntensity,
    showUI,
    setShowUI
  };

  const handleGesture = (gesture: HandGesture) => {
    gestureRef.current = gesture;

    // Handle discrete events here
    if (gesture.type === 'EXIT_FOCUS' && focusedBody) {
      setFocusedBody(null);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white select-none">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene3D appState={appState} isMobile={isMobile} gestureRef={gestureRef} />
      </div>

      {/* UI Overlay Layer */}
      <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <UIOverlay appState={appState} isMobile={isMobile} />
      </div>

      {/* Hand Controller */}
      <HandController appState={appState} onGesture={handleGesture} />

      {/* Toggle UI Button (Always visible) */}
      {!showUI && (
        <button
          onClick={() => setShowUI(true)}
          className="absolute top-4 right-4 z-50 bg-gray-900/80 border border-cyan-500/50 text-cyan-400 px-3 py-1 rounded backdrop-blur hover:bg-cyan-900/50 transition-colors pointer-events-auto"
        >
          Show UI
        </button>
      )}
    </div>
  );
};

export default App;