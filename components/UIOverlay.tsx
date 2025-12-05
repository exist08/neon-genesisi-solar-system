import React, { useState } from 'react';
import { AppState, ControlMode } from '../types';
import { PLANET_DATA } from '../constants';
import {
  Maximize,
  MousePointer2,
  Keyboard as KeyboardIcon,
  Video,
  Hand,
  Info,
  Settings,
  X
} from 'lucide-react';

interface UIOverlayProps {
  appState: AppState;
  isMobile: boolean;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ appState, isMobile }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const activePlanet = appState.focusedBody
    ? PLANET_DATA.find(p => p.id === appState.focusedBody)
    : null;

  const controlModeIcon = {
    [ControlMode.MOUSE]: <MousePointer2 size={18} />,
    [ControlMode.KEYBOARD]: <KeyboardIcon size={18} />,
    [ControlMode.AUTO]: <Video size={18} />,
    [ControlMode.HAND]: <Hand size={18} />,
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 md:p-6 pointer-events-none">

      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 neon-text">
            SOLAR<span className="text-white">OS</span>
          </h1>
          <div className="text-xs text-cyan-500/80 tracking-widest uppercase">System Visualization v2.0</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-black/40 border border-cyan-500/30 rounded hover:bg-cyan-500/20 text-cyan-400 transition-colors backdrop-blur-md"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => setShowAbout(true)}
            className="p-2 bg-black/40 border border-cyan-500/30 rounded hover:bg-cyan-500/20 text-cyan-400 transition-colors backdrop-blur-md"
          >
            <Info size={20} />
          </button>
          <button
            onClick={() => appState.setShowUI(false)}
            className="p-2 bg-black/40 border border-red-500/30 rounded hover:bg-red-500/20 text-red-400 transition-colors backdrop-blur-md"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Settings Modal (Overlay) */}
      {showSettings && (
        <div className="absolute top-20 right-4 w-64 bg-black/80 border border-cyan-500/50 backdrop-blur-lg p-4 rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.2)] pointer-events-auto z-50">
          <h3 className="text-cyan-400 font-bold mb-4 uppercase text-sm border-b border-gray-800 pb-2">Configuration</h3>

          {/* Control Mode */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-2 block">Control Mode</label>
            <div className="flex gap-1">
              {Object.values(ControlMode).map(mode => (
                <button
                  key={mode}
                  onClick={() => appState.setControlMode(mode)}
                  className={`flex-1 p-2 flex justify-center items-center rounded ${appState.controlMode === mode ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  title={mode}
                >
                  {controlModeIcon[mode]}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Speed */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <label className="text-xs text-gray-400">Time Scale</label>
              <span className="text-xs text-cyan-400">{appState.simulationSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range" min="0" max="5" step="0.1"
              value={appState.simulationSpeed}
              onChange={(e) => appState.setSimulationSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Bloom */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <label className="text-xs text-gray-400">Neon Intensity</label>
              <span className="text-xs text-purple-400">{appState.bloomIntensity.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0" max="4" step="0.1"
              value={appState.bloomIntensity}
              onChange={(e) => appState.setBloomIntensity(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Quality */}
          <div className="mb-2">
            <label className="text-xs text-gray-400 mb-2 block">Particle Quality</label>
            <div className="flex text-xs border border-gray-700 rounded overflow-hidden">
              {['LOW', 'MEDIUM', 'HIGH'].map((q) => (
                <button
                  key={q}
                  onClick={() => appState.setParticleDensity(q as any)}
                  className={`flex-1 py-1 ${appState.particleDensity === q ? 'bg-cyan-900/80 text-cyan-200' : 'bg-black/50 text-gray-500 hover:bg-gray-800'}`}
                >
                  {q.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="bg-gray-900 border border-cyan-500 rounded-lg p-6 max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">About Neon SolarOS</h2>
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              An interactive 3D particle visualization of our solar system.
              Designed with a cyberpunk aesthetic using React Three Fiber and GSAP.
            </p>
            <ul className="text-xs text-gray-400 space-y-2 mb-6">
              <li>• <strong className="text-white">Mouse Mode:</strong> Drag to rotate, scroll to zoom, click to focus.</li>
              <li>• <strong className="text-white">Keyboard:</strong> Arrows to move, W/S for elevation, Space to reset.</li>
              <li>• <strong className="text-white">Hand:</strong> Fist to rotate, Pinch to zoom, Palm to exit.</li>
              <li>• <strong className="text-white">Auto:</strong> Cinematic tour mode.</li>
            </ul>
            <button
              onClick={() => setShowAbout(false)}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition-colors"
            >
              Enter System
            </button>
          </div>
        </div>
      )}

      {/* Planet Navigation Strip (Bottom) */}
      <div className="flex flex-col items-center pointer-events-auto">
        {/* Active Planet Info Panel */}
        {activePlanet && (
          <div className="mb-4 bg-black/60 border-l-2 border-cyan-500 backdrop-blur-md p-4 rounded-r-lg max-w-md animate-fade-in-up self-start md:self-center">
            <div className="flex justify-between items-baseline mb-1">
              <h2 className="text-2xl font-bold text-white uppercase tracking-wider" style={{ textShadow: `0 0 10px ${activePlanet.color}` }}>
                {activePlanet.name}
              </h2>
              <button onClick={() => appState.setFocusedBody(null)} className="text-xs text-red-400 hover:text-red-300 ml-4">[CLOSE FOCUS]</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-2">
              <div>
                <span className="block text-gray-500 uppercase text-[10px]">Distance</span>
                {activePlanet.distance === 0 ? '0 AU' : `${(activePlanet.distance / 75).toFixed(1)} AU`}
              </div>
              <div>
                <span className="block text-gray-500 uppercase text-[10px]">Moons</span>
                {activePlanet.moons}
              </div>
              <div>
                <span className="block text-gray-500 uppercase text-[10px]">Radius</span>
                {activePlanet.radius}x Earth
              </div>
              <div>
                <span className="block text-gray-500 uppercase text-[10px]">Orbit Speed</span>
                {activePlanet.speed} km/s
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-snug border-t border-gray-700 pt-2 mt-2">
              {activePlanet.details}
            </p>
          </div>
        )}

        {/* Planet Quick Select */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto max-w-full pb-2 px-2 mask-linear-gradient">
          {PLANET_DATA.map((p) => (
            <button
              key={p.id}
              onClick={() => appState.setFocusedBody(p.id)}
              className={`
                group relative flex flex-col items-center min-w-[60px] p-2 rounded transition-all
                ${appState.focusedBody === p.id ? 'bg-white/10' : 'hover:bg-white/5'}
              `}
            >
              <div
                className={`w-3 h-3 rounded-full mb-2 shadow-[0_0_8px_currentColor] transition-transform group-hover:scale-125`}
                style={{ backgroundColor: p.color, color: p.color }}
              />
              <span className={`text-[10px] uppercase tracking-wider ${appState.focusedBody === p.id ? 'text-white font-bold' : 'text-gray-500'}`}>
                {p.name.substring(0, 3)}
              </span>
              {/* Active Indicator Line */}
              {appState.focusedBody === p.id && (
                <div className="absolute bottom-0 w-full h-[2px]" style={{ backgroundColor: p.color }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;