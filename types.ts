import { Vector3 } from 'three';

export interface PlanetData {
  id: string;
  name: string;
  radius: number; // Visual size relative to Earth
  distance: number; // Distance from Sun
  speed: number; // Orbital speed
  rotationSpeed: number; // Self-rotation speed
  color: string; // Neon hex color
  details: string; // Description
  moons?: number;
  hasRings?: boolean;
}

export enum ControlMode {
  MOUSE = 'MOUSE',
  KEYBOARD = 'KEYBOARD',
  AUTO = 'AUTO',
}

export interface AppState {
  controlMode: ControlMode;
  setControlMode: (mode: ControlMode) => void;
  focusedBody: string | null;
  setFocusedBody: (name: string | null) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  particleDensity: 'LOW' | 'MEDIUM' | 'HIGH';
  setParticleDensity: (density: 'LOW' | 'MEDIUM' | 'HIGH') => void;
  bloomIntensity: number;
  setBloomIntensity: (intensity: number) => void;
  showUI: boolean;
  setShowUI: (show: boolean) => void;
}

export type CameraTarget = {
  position: Vector3;
  target: Vector3;
}