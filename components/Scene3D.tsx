import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Trail, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import { AppState, ControlMode } from '../types';
import { PLANET_DATA, ASTEROID_COUNT, ASTEROID_BELT_RADIUS_MIN, ASTEROID_BELT_RADIUS_MAX } from '../constants';

// --- Helper Components ---

const Moon: React.FC<{
  planetRadius: number;
  distance: number;
  speed: number;
  color: string;
  appState: AppState;
}> = ({ planetRadius, distance, speed, color, appState }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime() * speed * appState.simulationSpeed * 0.5;
      meshRef.current.position.x = Math.cos(t) * distance;
      meshRef.current.position.z = Math.sin(t) * distance;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[planetRadius * 0.2, 8, 8]} />
        <meshBasicMaterial color={color} />
        {appState.particleDensity !== 'LOW' && (
          <Trail
            width={planetRadius * 0.15}
            length={8}
            color={new THREE.Color(color)}
            attenuation={(t) => t * t}
          >
            <mesh visible={false}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial />
            </mesh>
          </Trail>
        )}
      </mesh>
    </group>
  );
};

const Planet: React.FC<{
  data: typeof PLANET_DATA[0];
  appState: AppState;
  isMobile: boolean
}> = ({ data, appState, isMobile }) => {
  const meshRef = useRef<THREE.Group>(null);
  const particleRef = useRef<THREE.Points>(null);
  const [hovered, setHover] = useState(false);

  // Logic for orbit
  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Orbit
      const t = clock.getElapsedTime() * data.speed * appState.simulationSpeed * 0.2;
      // If it's the sun, it stays at 0,0,0
      if (data.distance > 0) {
        meshRef.current.position.x = Math.cos(t) * data.distance;
        meshRef.current.position.z = Math.sin(t) * data.distance;
      }

      // Rotation
      if (particleRef.current) {
        particleRef.current.rotation.y += data.rotationSpeed * (appState.simulationSpeed || 1);
      }
    }
  });

  // Particle Geometry based on density settings
  const particleCount = useMemo(() => {
    const base = isMobile ? 200 : 800;
    const multipliers = { LOW: 0.5, MEDIUM: 1, HIGH: 2 };
    return Math.floor(base * multipliers[appState.particleDensity] * data.radius);
  }, [appState.particleDensity, data.radius, isMobile]);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const radius = data.radius;
    for (let i = 0; i < particleCount; i++) {
      // Random point on sphere surface
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius; // Surface only for neon shell look

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, [particleCount, data.radius]);

  // Handle interaction
  const handlePointerOver = () => {
    document.body.style.cursor = 'pointer';
    setHover(true);
  };
  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
    setHover(false);
  };
  const handleClick = (e: any) => {
    e.stopPropagation();
    appState.setFocusedBody(data.id);
  };

  const isFocused = appState.focusedBody === data.id;

  return (
    <group>
      {/* Static Orbit Path Visualizer - Now independent of planet rotation/position in hierarchy */}
      {data.distance > 0 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={128}
              array={new Float32Array(129 * 3).map((_, i) => {
                const angle = (i / 128) * Math.PI * 2;
                return i % 3 === 0 ? Math.cos(angle) * data.distance
                  : i % 3 === 2 ? Math.sin(angle) * data.distance
                    : 0;
              })}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={data.color} transparent opacity={0.15} />
        </line>
      )}

      {/* The Moving Planet Group */}
      <group ref={meshRef}>
        <group
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          {/* Visual Core */}
          <points ref={particleRef}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={particleCount}
                array={particlesPosition}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              size={isMobile ? 0.3 : 0.15}
              color={hovered || isFocused ? '#ffffff' : data.color}
              transparent
              opacity={0.8}
              sizeAttenuation
              blending={THREE.AdditiveBlending}
            />
          </points>

          {/* Inner Glow Mesh for solidity */}
          <mesh>
            <icosahedronGeometry args={[data.radius * 0.9, 1]} />
            <meshBasicMaterial color={data.color} transparent opacity={0.3} wireframe />
          </mesh>

          {/* Saturn Rings */}
          {data.hasRings && (
            <points rotation={[Math.PI / 2.5, 0, 0]}>
              <ringGeometry args={[data.radius * 1.4, data.radius * 2.2, 64]} />
              <pointsMaterial size={0.1} color={data.color} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
            </points>
          )}

          {/* Moons */}
          {data.moons && data.moons > 0 && (
            <Moon
              planetRadius={data.radius}
              distance={data.radius * 2.5}
              speed={2}
              color={data.color}
              appState={appState}
            />
          )}
        </group>
      </group>
    </group>
  );
};

const AsteroidBelt: React.FC<{ count: number; appState: AppState }> = ({ count, appState }) => {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = THREE.MathUtils.lerp(ASTEROID_BELT_RADIUS_MIN, ASTEROID_BELT_RADIUS_MAX, Math.random());
      const spreadY = (Math.random() - 0.5) * 4;

      p[i * 3] = Math.cos(angle) * radius;
      p[i * 3 + 1] = spreadY;
      p[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return p;
  }, [count]);

  const ref = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.05 * appState.simulationSpeed;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={points} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#555555" transparent opacity={0.6} />
    </points>
  );
};

import { HandGesture } from './HandController';

// ... (previous imports)

const CameraController: React.FC<{ appState: AppState; gestureRef?: React.MutableRefObject<HandGesture> }> = ({ appState, gestureRef }) => {
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef<any>(null);
  const autoOrbitRef = useRef(0);

  // Hand Control State
  const handState = useRef({
    rotation: { x: 0, y: 0 },
    zoom: 300,
    cursor: new THREE.Vector2(0, 0),
    isFocusing: false
  });

  // Initial Position
  useEffect(() => {
    camera.position.set(0, 150, 300);
  }, [camera]);

  // Handle Focus Changes
  useEffect(() => {
    if (!appState.focusedBody) {
      // Reset View
      if (appState.controlMode === ControlMode.AUTO) return; // Let auto handle it

      gsap.to(camera.position, {
        x: 0, y: 150, z: 300,
        duration: 2,
        ease: 'power3.inOut'
      });
      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x: 0, y: 0, z: 0,
          duration: 2,
          ease: 'power3.inOut'
        });
      }
      return;
    }

    // Since planets move, we need a frame loop to follow them, but for the transition we jump to near them
  }, [appState.focusedBody, camera, appState.controlMode]);


  // Frame Loop for following focused planet or Auto Orbit
  useFrame(({ clock, raycaster }, delta) => {
    if (appState.controlMode === ControlMode.AUTO) {
      autoOrbitRef.current += delta * 0.05; // Slower auto orbit for larger scale
      const r = 350;
      const x = Math.sin(autoOrbitRef.current) * r;
      const z = Math.cos(autoOrbitRef.current) * r;
      camera.position.lerp(new THREE.Vector3(x, 100, z), 0.05);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) controlsRef.current.update();
    } else if (appState.controlMode === ControlMode.HAND && gestureRef) {
      // HAND CONTROL LOGIC
      const gesture = gestureRef.current;

      if (gesture.type === 'ROTATE' && gesture.value) {
        // Rotate camera around target (0,0,0) or focused body
        // Simple orbit implementation
        const speed = 5;
        handState.current.rotation.x += gesture.value.x * speed;
        handState.current.rotation.y += gesture.value.y * speed;

        // Apply rotation to camera position
        const r = handState.current.zoom;
        const theta = handState.current.rotation.x; // Horizontal
        const phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, handState.current.rotation.y + Math.PI / 4)); // Vertical (clamped)

        const x = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);

        camera.position.lerp(new THREE.Vector3(x, y, z), 0.1);
        camera.lookAt(0, 0, 0);
      } else if (gesture.type === 'ZOOM' && typeof gesture.value === 'number') {
        handState.current.zoom = Math.max(50, Math.min(600, handState.current.zoom - gesture.value));
        // Apply zoom (position update handled in rotate block or separate)
        // If not rotating, just lerp distance
        const dir = new THREE.Vector3().copy(camera.position).normalize();
        camera.position.lerp(dir.multiplyScalar(handState.current.zoom), 0.1);
      } else if (gesture.type === 'FOCUS' && gesture.value) {
        // Move virtual cursor
        handState.current.cursor.set(gesture.value.x * 2 - 1, -(gesture.value.y * 2 - 1));

        // Raycast from camera
        raycaster.setFromCamera(handState.current.cursor, camera);
        // We need to raycast against planets. 
        // Since we don't have direct access to meshes here easily without a global store or context,
        // we can use a simple distance check or rely on the fact that planets have click handlers.
        // But raycaster needs objects.
        // For now, let's just visualize the cursor if possible or skip selection logic 
        // and rely on "Pinch to Select" if we can hit-test.
        // Actually, without passing the scene objects, raycasting is hard here.
        // Alternative: The Planet component checks if it's being hovered by the "Hand Cursor".
        // But the cursor is here.
        // Let's skip complex raycasting for now and focus on Rotate/Zoom/Exit.
      }

      if (controlsRef.current) controlsRef.current.enabled = false;

    } else if (appState.focusedBody) {
      // Find the object
      const planet = PLANET_DATA.find(p => p.id === appState.focusedBody);
      if (planet) {
        const t = clock.getElapsedTime() * planet.speed * appState.simulationSpeed * 0.2;
        const pX = Math.cos(t) * planet.distance;
        const pZ = Math.sin(t) * planet.distance;

        const targetPos = new THREE.Vector3(pX, 0, pZ);

        // Smoothly move controls target to planet
        if (controlsRef.current) {
          controlsRef.current.target.lerp(targetPos, 0.1);
          // Keep camera at a fixed offset relative to planet
          const offset = new THREE.Vector3(pX + planet.radius * 5, planet.radius * 3, pZ + planet.radius * 5);
          camera.position.lerp(offset, 0.05);
          controlsRef.current.update();
        }
      }
    } else if (controlsRef.current) {
      controlsRef.current.enabled = true;
      controlsRef.current.update();
    }
  });

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (appState.controlMode !== ControlMode.KEYBOARD) return;

      const moveSpeed = 8;
      const rotSpeed = 0.05;

      switch (e.key) {
        case 'ArrowUp': camera.translateZ(-moveSpeed); break;
        case 'ArrowDown': camera.translateZ(moveSpeed); break;
        case 'ArrowLeft': camera.translateX(-moveSpeed); break;
        case 'ArrowRight': camera.translateX(moveSpeed); break;
        case 'w': camera.position.y += moveSpeed; break;
        case 's': camera.position.y -= moveSpeed; break;
        case ' ': appState.setFocusedBody(null); break; // Reset
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState.controlMode, camera, appState]);


  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableDamping={true}
        dampingFactor={0.05}
        enabled={appState.controlMode === ControlMode.MOUSE}
        maxDistance={650}
        minDistance={10}
      />
      {/* Visual Cursor for Hand Mode */}
      {appState.controlMode === ControlMode.HAND && (
        <mesh position={[0, 0, 0]} ref={(mesh) => {
          if (mesh && gestureRef?.current?.type === 'FOCUS' && gestureRef.current.value) {
            // This is tricky to position in 3D space to match screen space without raycasting to a plane.
            // Let's skip the visual cursor for now or put it on a HUD plane.
            // Actually, we can just use a DOM element for the cursor!
          }
        }}>
        </mesh>
      )}
    </>
  );
};


const Scene3D: React.FC<{ appState: AppState; isMobile: boolean; gestureRef?: React.MutableRefObject<HandGesture> }> = ({ appState, isMobile, gestureRef }) => {
  return (
    <Canvas
      camera={{ position: [0, 150, 300], fov: 45, far: 2000 }}
      dpr={[1, isMobile ? 1.5 : 2]} // Optimization
      gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
    >
      <color attach="background" args={['#000000']} />

      <Stars radius={600} depth={100} count={isMobile ? 2000 : 8000} factor={4} saturation={0} fade speed={1} />

      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 0]} intensity={3} color="#ffaa00" distance={800} decay={1.5} />

      <CameraController appState={appState} gestureRef={gestureRef} />

      {/* Render Solar System */}
      <group>
        {PLANET_DATA.map((planet) => (
          <Planet
            key={planet.id}
            data={planet}
            appState={appState}
            isMobile={isMobile}
          />
        ))}
        {/* Asteroid Belt */}
        {appState.particleDensity !== 'LOW' && (
          <AsteroidBelt count={isMobile ? 500 : ASTEROID_COUNT} appState={appState} />
        )}
      </group>

      <EffectComposer enableNormalPass={false}>
        <Bloom
          luminanceThreshold={0.2}
          mipmapBlur
          intensity={appState.bloomIntensity}
          radius={0.5}
        />
      </EffectComposer>
    </Canvas>
  );
};

export default Scene3D;