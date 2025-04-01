import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useFBX, Stars } from '@react-three/drei';
import * as THREE from 'three';
import BoneModel from './BoneModel';

// Audio context for sound effects
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext;
let collectSoundBuffer;

// Load audio file
const loadCollectSound = async () => {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    
    const response = await fetch('/sounds/collect.mp3');
    const arrayBuffer = await response.arrayBuffer();
    collectSoundBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log('Collect sound loaded successfully');
  } catch (error) {
    console.error('Error loading collect sound:', error);
  }
};

// Play collect sound
const playCollectSound = () => {
  if (audioContext && collectSoundBuffer) {
    try {
      // Resume audio context if it was suspended (needed for some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // Create sound source
      const source = audioContext.createBufferSource();
      source.buffer = collectSoundBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      console.log('Playing collect sound');
    } catch (error) {
      console.error('Error playing collect sound:', error);
    }
  } else {
    console.warn('Audio not loaded yet');
  }
};

// Load sound effects when the module initializes
loadCollectSound();

// Starry Night Sky component with dark pink color
function StarrySky() {
  return (
    <>
      {/* Dark pink background */}
      <color attach="background" args={['#1a0011']} />
      
      {/* Stars from drei */}
      <Stars 
        radius={150} 
        depth={80} 
        count={8000} 
        factor={6} 
        saturation={0.7}
        fade 
        speed={0.5} 
        color="#ff9ee8"  // Pink-tinted stars
      />
      
      {/* Fog with increased distance for zoomed out view */}
      <fog attach="fog" args={['#2a0022', 80, 150]} />
    </>
  );
}

// Simple FBX Model component for background
function BackgroundFBXModel({ path, position = [0, 0, 0], scale = 0.01, rotation = [0, 0, 0] }) {
  const fbx = useFBX(path);
  const modelRef = useRef();
  
  useEffect(() => {
    if (modelRef.current) {
      console.log(`Background FBX model loaded: ${path}`);
      
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [path]);
  
  return (
    <primitive 
      ref={modelRef}
      object={fbx} 
      position={position}
      scale={scale}
      rotation={rotation}
    />
  );
}

// Lungs Model component
function LungsModel({ position = [0, 4, 0], rotation = [0, Math.PI / 2, 0], scale = 1.0 }) {
  const path = '/models/lungs_breathing.fbx';
  const fbx = useFBX(path);
  const modelRef = useRef();
  const mixerRef = useRef();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (modelRef.current) {
      try {
        console.log('Lungs FBX model loaded');
        
        modelRef.current.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Set up animation mixer
        mixerRef.current = new THREE.AnimationMixer(modelRef.current);
        
        // Get all animations from the FBX
        const animations = fbx.animations;
        if (animations && animations.length > 0) {
          // Create an action for the first animation
          const action = mixerRef.current.clipAction(animations[0]);
          // Set the action to loop
          action.setLoop(THREE.LoopRepeat);
          // Play the animation
          action.play();
        }
      } catch (error) {
        console.error('Error setting up lungs model:', error);
        setError(error);
      }
    }
  }, [fbx]);
  
  // Update animation mixer on each frame
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });
  
  if (error) {
    return (
      <mesh position={position} rotation={rotation} scale={scale}>
        <boxGeometry args={[2, 3, 1]} />
        <meshStandardMaterial color="#ff6699" />
      </mesh>
    );
  }
  
  return (
    <primitive 
      ref={modelRef}
      object={fbx} 
      position={position}
      scale={scale}
      rotation={rotation}
    />
  );
}

// Character FBX Model component
function CharacterFBXModel({ path, position = [0, 0, 0], scale = 0.01, rotation = [0, 0, 0] }) {
  const [error, setError] = useState(null);
  const fbx = useFBX(path || '/models/character.fbx');
  const modelRef = useRef();
  
  useEffect(() => {
    if (modelRef.current) {
      try {
        console.log(`Character FBX model loaded: ${path}`);
        
        modelRef.current.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      } catch (error) {
        console.error(`Error setting up character model:`, error);
        setError(error);
      }
    }
  }, [path]);
  
  if (error) {
    return (
      <mesh position={position} rotation={rotation} scale={scale}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#66ccff" />
      </mesh>
    );
  }
  
  return (
    <primitive 
      ref={modelRef}
      object={fbx} 
      position={position} 
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
      rotation={rotation}
    />
  );
}

// Door Model component
function DoorModel() {
  const [error, setError] = useState(null);
  const fbx = useFBX('/models/door.fbx');
  const modelRef = useRef();
  
  useEffect(() => {
    if (modelRef.current) {
      try {
        console.log('Door FBX model loaded');
        
        modelRef.current.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      } catch (error) {
        console.error('Error setting up door model:', error);
        setError(error);
      }
    }
  }, []);
  
  if (error) {
    return (
      <mesh position={[-30, 7, 5]} scale={0.002} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2, 4, 0.2]} />
        <meshStandardMaterial color="#ff6699" />
      </mesh>
    );
  }
  
  return (
    <primitive 
      ref={modelRef}
      object={fbx} 
      position={[-30, 7, 5]} 
      scale={0.002}
      rotation={[0, Math.PI / 2, 0]} 
    />
  );
}

// Platform component with animation
function MovingPlatform({ position, size = [2, 0.2, 2], color = "#ff99cc", amplitude = 0.5, speed = 1, phase = 0 }) {
  const platformRef = useRef();
  const initialY = position[1];
  
  useFrame((state) => {
    if (platformRef.current) {
      // Vertical oscillation with sine wave
      const time = state.clock.elapsedTime;
      const newY = initialY + Math.sin((time * speed) + phase) * amplitude;
      platformRef.current.position.y = newY;
      
      // Optional slight rotation for visual interest
      platformRef.current.rotation.z = Math.sin(time * speed * 0.5 + phase) * 0.05;
    }
  });
  
  return (
    <group ref={platformRef} position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.6} 
          roughness={0.2}
          emissive={color}
          emissiveIntensity={1.0}
        />
      </mesh>
      
      {/* Add a point light to make platform more visible */}
      <pointLight 
        position={[0, 1, 0]} 
        color={color}
        intensity={2}
        distance={10}
      />
    </group>
  );
}

// Main component
export default function Scene5() {
  console.log("RENDERING Scene5 COMPONENT");
  const [characterPosition, setCharacterPosition] = useState({ x: 0, y: 0, z: 0 });
  const [showInstructions, setShowInstructions] = useState(true);
  const [teleportTarget, setTeleportTarget] = useState(null);
  const [resetCameraFlag, setResetCameraFlag] = useState(false);
  
  const handlePositionChange = (newPosition) => {
    setCharacterPosition(newPosition);
  };
  
  // Toggle instructions visibility
  const toggleInstructions = () => {
    setShowInstructions(prev => !prev);
  };
  
  const handleResetCamera = () => {
    setResetCameraFlag(true);
    setTimeout(() => setResetCameraFlag(false), 100);
  };
  
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas shadows camera={{ position: [15, 20, 0], fov: 75 }}>
        <StarrySky />
        <Scene 
          characterPosition={characterPosition} 
          setCharacterPosition={setCharacterPosition}
          showInstructions={showInstructions}
          teleportTarget={teleportTarget}
          setTeleportTarget={setTeleportTarget}
          resetCamera={resetCameraFlag}
        />
      </Canvas>
      <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' }}>
        <button onClick={toggleInstructions} style={{ padding: '10px', background: '#ff66aa', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
        </button>
        <button onClick={handleResetCamera} style={{ padding: '10px', background: '#ff66aa', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Reset Position
        </button>
      </div>
    </div>
  );
}

// Scene component
function Scene({ characterPosition, setCharacterPosition, showInstructions, teleportTarget, setTeleportTarget, resetCamera }) {
  const { camera } = useThree();
  const characterRef = useRef();
  const positionRef = useRef(new THREE.Vector3(0, 0, 0));
  
  // Update position ref when character position changes
  useEffect(() => {
    positionRef.current.set(characterPosition.x, characterPosition.y, characterPosition.z);
  }, [characterPosition]);
  
  // Camera follows character
  useFrame(() => {
    if (characterRef.current) {
      const target = new THREE.Vector3();
      characterRef.current.getWorldPosition(target);
      
      // Smooth camera follow with rotated view (90 degrees)
      camera.position.x = target.x + 15;
      camera.position.y = target.y + 20;
      camera.position.z = target.z;
      
      // Look at character
      camera.lookAt(target);
    }
  });
  
  // Clickable ground for teleportation
  const handleClick = (event) => {
    // Prevent clicks when in UI
    if (event.intersections.length === 0) return;
    
    // Find the clicked object - only allow clicking on the ground
    const clickedObject = event.intersections[0].object;
    if (clickedObject && clickedObject.name === 'ground') {
      // Get the click position
      const clickPosition = event.intersections[0].point;
      console.log('Clicked on ground at:', clickPosition);
      
      // Set teleport target
      setTeleportTarget({
        x: clickPosition.x,
        y: clickPosition.y,
        z: clickPosition.z
      });
    }
  };
  
  return (
    <>
      {/* Starry sky background */}
      <StarrySky />
      
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.5} />
      
      {/* Main directional light with shadows */}
      <directionalLight 
        position={[30, 50, 30]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Additional colored spotlights for dramatic effect */}
      <spotLight 
        position={[20, 30, 0]} 
        intensity={1} 
        color="#ff66aa" 
        distance={80} 
        angle={0.5}
        penumbra={0.8}
      />
      
      <spotLight 
        position={[-20, 30, 0]} 
        intensity={1} 
        color="#aa66ff" 
        distance={80} 
        angle={0.5}
        penumbra={0.8}
      />
      
      {/* Ground plane - much larger for zoomed out view */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.025, 0]} 
        receiveShadow
        name="ground"
        onClick={handleClick}
      >
        <planeGeometry args={[200, 200]} />
        <shadowMaterial opacity={0.4} />
        <meshStandardMaterial 
          color="#2b1b29" 
          roughness={1} 
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Moving platforms for climbing - spiral pattern */}
      <MovingPlatform 
        position={[0, 1, 0]} 
        size={[5, 0.3, 5]} 
        color="#ff88cc" 
        amplitude={0.3} 
        speed={0.8} 
        phase={0}
      />
      <MovingPlatform 
        position={[10, 1, 10]} 
        size={[4, 0.3, 4]} 
        color="#ff77dd" 
        amplitude={0.5} 
        speed={0.7} 
        phase={1.5}
      />
      <MovingPlatform 
        position={[-10, 1, 10]} 
        size={[4, 0.3, 4]} 
        color="#ff66aa" 
        amplitude={0.4} 
        speed={0.9} 
        phase={2.3}
      />
      <MovingPlatform 
        position={[10, 1, -10]} 
        size={[4, 0.3, 4]} 
        color="#ff99bb" 
        amplitude={0.3} 
        speed={1.1} 
        phase={3.1}
      />
      <MovingPlatform 
        position={[-10, 1, -10]} 
        size={[4, 0.3, 4]} 
        color="#ff55aa" 
        amplitude={0.6} 
        speed={0.6} 
        phase={4.2}
      />
      <MovingPlatform 
        position={[20, 1, 0]} 
        size={[3, 0.3, 3]} 
        color="#ff44bb" 
        amplitude={0.5} 
        speed={0.9} 
        phase={5.4}
      />
      <MovingPlatform 
        position={[-20, 1, 0]} 
        size={[3, 0.3, 3]} 
        color="#ff33cc" 
        amplitude={0.4} 
        speed={1.1} 
        phase={6.7}
      />
      <MovingPlatform 
        position={[0, 1, 20]} 
        size={[3, 0.3, 3]} 
        color="#ff22dd" 
        amplitude={0.3} 
        speed={0.7} 
        phase={7.9}
      />
      <MovingPlatform 
        position={[0, 1, -20]} 
        size={[3, 0.3, 3]} 
        color="#ff11ee" 
        amplitude={0.5} 
        speed={0.8} 
        phase={8.6}
      />
      
      {/* Character */}
      <group 
        ref={characterRef} 
        position={[positionRef.current.x, positionRef.current.y, positionRef.current.z]}
      >
        <pointLight 
          position={[0, 2, 0]} 
          intensity={1.5} 
          color="#ffffff" 
          distance={8}
        />
        <Suspense fallback={
          <mesh castShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="#aaeeff" />
          </mesh>
        }>
          <BoneModel scale={0.05} />
        </Suspense>
      </group>
      
      {/* Character controller */}
      <CharacterController 
        position={positionRef.current}
        onPositionChange={setCharacterPosition}
        teleportTarget={teleportTarget}
      />
      
      {/* Instructions */}
      <Instructions show={showInstructions} />
      
      {/* Environment */}
      <Environment preset="sunset" />
      
      {/* Lungs model - positioned lower */}
      <Suspense fallback={null}>
        <mesh position={[0, -50, 0]} rotation={[0, Math.PI / 2, 0]} scale={3.0}>
          <boxGeometry args={[20, 30, 10]} />
          <meshStandardMaterial 
            color="#ff6699" 
            emissive="#ff3366"
            emissiveIntensity={0.5}
          />
        </mesh>
      </Suspense>
    </>
  );
}

// Instructions component
function Instructions({ show }) {
  console.log("RENDERING Instructions COMPONENT");
  
  if (!show) return null;
  
  return (
    <Html position={[0, 10, 0]} center>
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '15px',
        borderRadius: '10px',
        width: '400px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        pointerEvents: 'none',
        boxShadow: '0 0 20px rgba(255, 102, 204, 0.5)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '22px', color: '#ff66cc' }}>
          Game Instructions
        </h3>
        <p>Use WASD or Arrow Keys to move around</p>
        <p>Camera is fixed at a 90-degree angle</p>
        <p>Explore the scene from this bird's eye perspective</p>
        <p>Jump on platforms by pressing SPACE</p>
      </div>
    </Html>
  );
}

// Teleport marker component
function TeleportMarker({ position }) {
  const markerRef = useRef();
  const beamRef = useRef();
  const ringRef = useRef();
  
  // Animate the marker
  useFrame((state) => {
    if (markerRef.current) {
      // Pulse the marker
      const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
      markerRef.current.scale.set(scale, scale, scale);
    }
    
    if (beamRef.current) {
      // Rotate the beam
      beamRef.current.rotation.y += 0.02;
    }
    
    if (ringRef.current) {
      // Expand and fade out the ring
      const time = state.clock.elapsedTime % 2; // 2-second cycle
      const scale = 1 + time * 2; // Expand to 3x size
      const opacity = 1 - (time / 2); // Fade out from 1 to 0
      
      ringRef.current.scale.set(scale, scale, scale);
      ringRef.current.material.opacity = opacity;
    }
  });
  
  return (
    <group position={position}>
      {/* Main marker */}
      <mesh ref={markerRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial color="#ff66cc" transparent opacity={0.8} />
      </mesh>
      
      {/* Expanding ring */}
      <mesh ref={ringRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.55, 32]} />
        <meshBasicMaterial color="#ff66cc" transparent opacity={0.5} />
      </mesh>
      
      {/* Vertical beam */}
      <mesh ref={beamRef} position={[0, 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 4, 8]} />
        <meshBasicMaterial color="#ff66cc" transparent opacity={0.3} />
      </mesh>
      
      {/* Bottom glow */}
      <pointLight position={[0, 0.2, 0]} color="#ff66cc" intensity={2} distance={3} />
    </group>
  );
}

// 3D Character controller with camera-relative movement
function CharacterController({ position, onPositionChange, teleportTarget }) {
  const { camera } = useThree();
  const [keys, setKeys] = useState({ forward: false, backward: false, left: false, right: false });
  const [isJumping, setIsJumping] = useState(false);
  
  // Set up keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setKeys(prev => ({ ...prev, forward: true }));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setKeys(prev => ({ ...prev, backward: true }));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setKeys(prev => ({ ...prev, left: true }));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setKeys(prev => ({ ...prev, right: true }));
      } else if (e.key === ' ') {
        setIsJumping(true);
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setKeys(prev => ({ ...prev, forward: false }));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setKeys(prev => ({ ...prev, backward: false }));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setKeys(prev => ({ ...prev, left: false }));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setKeys(prev => ({ ...prev, right: false }));
      } else if (e.key === ' ') {
        setIsJumping(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Character movement
  useFrame(() => {
    let newX = position.x;
    let newZ = position.z;
    
    // Movement speed
    const moveSpeed = 0.1;
    
    // Calculate movement based on key presses and camera rotation
    if (keys.forward) {
      // In rotated view (90 degrees), forward is +X
      newX += moveSpeed;
    }
    if (keys.backward) {
      // In rotated view (90 degrees), backward is -X
      newX -= moveSpeed;
    }
    if (keys.left) {
      // In rotated view (90 degrees), left is +Z
      newZ += moveSpeed;
    }
    if (keys.right) {
      // In rotated view (90 degrees), right is -Z
      newZ -= moveSpeed;
    }
    
    // Update position if changed
    if (newX !== position.x || newZ !== position.z) {
      onPositionChange({
        x: newX,
        y: position.y,
        z: newZ
      });
    }
    
    // Handle teleportation target
    if (teleportTarget) {
      onPositionChange({
        x: teleportTarget.x,
        y: teleportTarget.y,
        z: teleportTarget.z
      });
    }
  });
  
  return null; // This is a logic component, no visual elements
} 