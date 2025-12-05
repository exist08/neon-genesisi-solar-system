import { PlanetData } from './types';

// Using "Artistic" scaling because realistic scaling makes planets invisible dots
// Distances adjusted to prevent visual overlapping
export const PLANET_DATA: PlanetData[] = [
  {
    id: 'sun',
    name: 'Sun',
    radius: 12,
    distance: 0,
    speed: 0,
    rotationSpeed: 0.005,
    color: '#ffaa00', // Neon Orange/Gold
    details: 'The star at the center of our Solar System. A nearly perfect sphere of hot plasma.',
    moons: 0
  },
  {
    id: 'mercury',
    name: 'Mercury',
    radius: 1.5,
    distance: 35,
    speed: 1.5,
    rotationSpeed: 0.01,
    color: '#00e0ff', // Electric Cyan
    details: 'The smallest planet in the Solar System and the closest to the Sun.',
    moons: 0
  },
  {
    id: 'venus',
    name: 'Venus',
    radius: 2.2,
    distance: 55,
    speed: 1.2,
    rotationSpeed: 0.008,
    color: '#ff00ff', // Hot Pink
    details: 'The second planet from the Sun. It has the hottest planetary surface in the solar system.',
    moons: 0
  },
  {
    id: 'earth',
    name: 'Earth',
    radius: 2.4,
    distance: 75,
    speed: 1.0,
    rotationSpeed: 0.02,
    color: '#00ff41', // Matrix Green / Neon Lime
    details: 'Our home. The only astronomical object known to harbor life.',
    moons: 1
  },
  {
    id: 'mars',
    name: 'Mars',
    radius: 1.8,
    distance: 95,
    speed: 0.8,
    rotationSpeed: 0.018,
    color: '#ff3333', // Neon Red
    details: 'The Red Planet. Home to Olympus Mons, the largest volcano in the solar system.',
    moons: 2
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    radius: 6.5,
    distance: 150,
    speed: 0.4,
    rotationSpeed: 0.04,
    color: '#bf00ff', // Electric Purple
    details: 'The largest planet in the Solar System. A gas giant with a mass one-thousandth that of the Sun.',
    moons: 95
  },
  {
    id: 'saturn',
    name: 'Saturn',
    radius: 5.5,
    distance: 200,
    speed: 0.3,
    rotationSpeed: 0.038,
    color: '#ffd700', // Neon Gold
    details: 'Famous for its prominent ring system. It is a gas giant with an average radius of about nine and a half times that of Earth.',
    moons: 146,
    hasRings: true
  },
  {
    id: 'uranus',
    name: 'Uranus',
    radius: 3.5,
    distance: 250,
    speed: 0.2,
    rotationSpeed: 0.03,
    color: '#00ffff', // Cyan
    details: 'It has the coldest planetary atmosphere in the Solar System.',
    moons: 27
  },
  {
    id: 'neptune',
    name: 'Neptune',
    radius: 3.4,
    distance: 290,
    speed: 0.15,
    rotationSpeed: 0.032,
    color: '#0033ff', // Deep Electric Blue
    details: 'The farthest known planet from the Sun. It is 17 times the mass of Earth.',
    moons: 14
  }
];

export const ASTEROID_COUNT = 1500;
export const ASTEROID_BELT_RADIUS_MIN = 110;
export const ASTEROID_BELT_RADIUS_MAX = 125;