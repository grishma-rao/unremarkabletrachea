import React, { useState, useEffect, useRef, useMemo, Suspense, createRef } from 'react';
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
        radius={100} 
        depth={50} 
        count={5000} 
        factor={4} 
        saturation={0.5}
        fade 
        speed={1} 
        color="#ff9ee8"  // Pink-tinted stars
      />
      
      {/* Optional fog for depth */}
      <fog attach="fog" args={['#2a0022', 30, 90]} />
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
function LungsModel() {
  const fbx = useFBX('/models/lungs_breathing.fbx');
  const modelRef = useRef();
  const mixerRef = useRef();
  
  useEffect(() => {
    if (modelRef.current) {
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
    }
  }, []);
  
  // Update animation mixer on each frame
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });
  
  return (
    <primitive 
      ref={modelRef}
      object={fbx} 
      position={[0, 4, 0]}
      scale={1.0}
      rotation={[0, Math.PI / 2, 0]}
    />
  );
}

// Character FBX Model component
function CharacterFBXModel({ path, position = [0, 0, 0], scale = 0.01, rotation = [0, 0, 0] }) {
  const fbx = useFBX(path);
  const modelRef = useRef();
  
  useEffect(() => {
    if (modelRef.current) {
      console.log(`Character FBX model loaded: ${path}`);
      
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
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
      rotation={rotation}
    />
  );
}

// Door Model component with portal functionality
function DoorModel({ portalActive }) {
  const fbx = useFBX('/models/door.fbx');
  const modelRef = useRef();
  const { scene } = useThree();
  
  // Portal effect elements
  const portalLightRef = useRef();
  const portalRingRef = useRef();
  const particlesRefs = useMemo(() => Array(15).fill(0).map(() => createRef()), []);
  
  // Helper refs for animation
  const timeRef = useRef(0);
  
  useEffect(() => {
    if (modelRef.current) {
      console.log('Door FBX model loaded');
      
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Add user data to enable collision detection
          child.userData.isPortal = true;
          
          // Add a subtle glow to the door material
          if (child.material) {
            child.material = new THREE.MeshStandardMaterial({
              color: child.material.color || 0xaaaaaa,
              emissive: new THREE.Color('#9966ff'),
              emissiveIntensity: 0.2,
              metalness: 0.8,
              roughness: 0.2
            });
          }
        }
      });
      
      // Add door and its collision data to scene user data for easy access
      scene.userData.doorPosition = new THREE.Vector3(-30, 0, 5);
      scene.userData.doorRadius = 7; // Radius for portal activation - adjusted to 7 units
    }
  }, [scene, fbx]);
  
  // Animate portal effects
  useFrame((state) => {
    timeRef.current = state.clock.elapsedTime;
    
    if (portalLightRef.current) {
      // Pulsate the light intensity
      portalLightRef.current.intensity = portalActive ? 
        3 + Math.sin(state.clock.elapsedTime * 3) * 1 : // More intense when active
        1 + Math.sin(state.clock.elapsedTime * 2) * 0.3; // Subtler when inactive
        
      // Change color based on portal state
      portalLightRef.current.color.set(portalActive ? '#9966ff' : '#6644aa');
    }
    
    if (portalRingRef.current) {
      // Rotate the portal ring
      portalRingRef.current.rotation.z += portalActive ? 0.03 : 0.01;
      
      // Scale the ring based on portal state
      const scale = portalActive ? 
        1 + Math.sin(state.clock.elapsedTime * 2) * 0.1 : // Breathe when active
        0.8;
      portalRingRef.current.scale.set(scale, scale, scale);
    }
    
    // Animate particles
    particlesRefs.forEach((particleRef, i) => {
      if (particleRef.current) {
        // Only animate particles when portal is active
        if (portalActive) {
          // Update particle positions
          const time = state.clock.elapsedTime + i;
          particleRef.current.position.x = Math.sin(time * 0.5 + i) * (1.5 + i * 0.1);
          particleRef.current.position.y = Math.cos(time * 0.6 + i) * (1.5 + i * 0.1);
          particleRef.current.position.z = Math.sin(time * 0.7) * 0.3;
          
          // Make particles pulse
          const scale = 0.2 + Math.sin(time * 2) * 0.1;
          particleRef.current.scale.set(scale, scale, scale);
          
          // Make them visible
          particleRef.current.visible = true;
        } else {
          // Hide particles when portal is inactive
          particleRef.current.visible = false;
        }
      }
    });
  });
  
  return (
    <group>
      <primitive 
        ref={modelRef}
        object={fbx} 
        position={[-30, 7, 5]}
        scale={0.002}
        rotation={[0, Math.PI / 2, 0]}
      />
      
      {/* Portal light */}
      <pointLight 
        ref={portalLightRef}
        position={[-30, 7, 5]} 
        color="#6644aa" 
        intensity={1.5} 
        distance={portalActive ? 15 : 8}
        castShadow={portalActive}
      />
      
      {/* Portal effect */}
      <group position={[-30, 7, 5]} rotation={[0, Math.PI / 2, 0]}>
        {/* Outer ring */}
        <mesh ref={portalRingRef}>
          <torusGeometry args={[2.2, 0.2, 16, 32]} />
          <meshStandardMaterial 
            color={portalActive ? "#9966ff" : "#441188"} 
            emissive={portalActive ? "#5500ff" : "#220044"}
            emissiveIntensity={portalActive ? 1 : 0.3}
          />
        </mesh>
        
        {/* Inner disc */}
        <mesh position={[0, 0, -0.1]}>
          <circleGeometry args={[2, 32]} />
          <meshBasicMaterial 
            color="#220033" 
            transparent 
            opacity={portalActive ? 0.8 : 0.3}
          />
        </mesh>
        
        {/* Portal particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <mesh 
            key={i} 
            ref={particlesRefs[i]}
            position={[
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 0.5
            ]}
            scale={0.2}
            visible={portalActive}
          >
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial 
              color={`hsl(${260 + i * 5}, 80%, ${60 + i * 2}%)`} 
              transparent 
              opacity={0.7 + Math.random() * 0.3}
            />
          </mesh>
        ))}
        
        {/* Instructions when active */}
        {portalActive && (
          <Html position={[0, -3, 0]} center>
            <div style={{
              color: 'white',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '5px 10px',
              borderRadius: '3px',
              fontSize: '12px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap'
            }}>
              Press [E] to travel
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

// Ship Model component
function ShipModel() {
  const fbx = useFBX('/models/ship.fbx');
  const modelRef = useRef();
  
  useEffect(() => {
    if (modelRef.current) {
      console.log('Ship FBX model loaded');
      
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, []);
  
  return (
    <primitive 
      ref={modelRef}
      object={fbx} 
      position={[-20, 0, 5]}
      scale={0.001}
      rotation={[0, Math.PI / 2, 0]}
    />
  );
}

// Main component
export default function Scene5() {
  console.log("RENDERING Scene5 COMPONENT");
  
  // State for character position
  const [characterPosition, setCharacterPosition] = useState({ x: 0, y: 0, z: 0 });
  
  // State for inventory
  const [inventory, setInventory] = useState([]);
  
  // State for showing instructions
  const [showInstructions, setShowInstructions] = useState(false);
  
  // State for total bones collected from previous scene
  const [previousBones, setPreviousBones] = useState(0);
  
  // State for portal activation
  const [portalActive, setPortalActive] = useState(false);
  
  // Game state and timer (for persistence between scenes)
  const [gameState, setGameState] = useState('playing'); // Changed default from 'ready' to 'playing'
  const [timer, setTimeRemaining] = useState(60);
  
  // State for bone fragments
  const [bones, setBones] = useState([
    { id: 1, position: [15, 0, 15], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 2, position: [-15, 0, 15], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 3, position: [15, 0, -15], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 4, position: [-15, 0, -15], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 5, position: [0, 0, 20], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 6, position: [10, 0, -10], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 7, position: [-10, 0, 10], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 8, position: [20, 0, 0], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 9, position: [-20, 0, 0], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 10, position: [0, 0, -20], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    // Additional bones
    { id: 11, position: [8, 0, 18], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 12, position: [-18, 0, 8], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 13, position: [12, 0, -5], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 14, position: [-5, 0, -12], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 15, position: [18, 0, 5], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 16, position: [-8, 0, -18], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 17, position: [5, 0, 22], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 18, position: [-22, 0, -5], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 19, position: [16, 0, -16], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false },
    { id: 20, position: [-16, 0, 16], rotation: [0, Math.random() * Math.PI * 2, 0], scale: 0.01, collectProgress: 0, collected: false }
  ]);
  
  // State for teleportation target
  const [teleportTarget, setTeleportTarget] = useState(null);
  
  // State for camera reset
  const [resetCamera, setResetCamera] = useState(false);
  
  useEffect(() => {
    console.log("Scene5 mounted");
    
    // Get the bone count from previous scene from sessionStorage
    const storedBoneCount = sessionStorage.getItem('totalCollectedBones');
    if (storedBoneCount) {
      const boneCount = parseInt(storedBoneCount);
      console.log("Retrieved stored bone count:", boneCount);
      setPreviousBones(boneCount);
    }
    
    // Get the game state and timer from sessionStorage
    const storedGameState = sessionStorage.getItem('gameState');
    const storedTimeRemaining = sessionStorage.getItem('timeRemaining');
    
    if (storedGameState === 'playing' && storedTimeRemaining) {
      console.log(`Retrieved stored game state: ${storedGameState}, time remaining: ${storedTimeRemaining}`);
      setGameState('playing');
      setTimeRemaining(parseInt(storedTimeRemaining));
      // Don't show instructions when coming in with a saved state
      setShowInstructions(false);
    }
  }, []);
  
  // Timer effect
  useEffect(() => {
    let timerInterval;
    
    if (gameState === 'playing') {
      timerInterval = setInterval(() => {
        setTimeRemaining(prev => {
          // Save timer to sessionStorage on each tick for real-time persistence
          const newTime = prev <= 1 ? 0 : prev - 1;
          sessionStorage.setItem('timeRemaining', newTime.toString());
          
          if (newTime <= 0) {
            // Game over
            clearInterval(timerInterval);
            setGameState('finished');
            // Clear game state in storage since game is over
            sessionStorage.removeItem('gameState');
            
            // Navigate to Scene 6 when timer expires
            navigateToScene6();
            
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [gameState]);
  
  // Function to update total bone count when new bones are collected
  useEffect(() => {
    if (inventory.length > 0) {
      const newTotal = previousBones + inventory.length;
      sessionStorage.setItem('totalCollectedBones', newTotal.toString());
      console.log(`Updated total bone count: ${newTotal} (previous: ${previousBones} + current: ${inventory.length})`);
    }
  }, [inventory.length, previousBones]);
  
  // Function to navigate to Scene4
  const navigateToScene4 = () => {
    // Save the current bone count to sessionStorage before navigating
    const totalCount = previousBones + inventory.length;
    sessionStorage.setItem('totalCollectedBones', totalCount.toString());
    console.log(`Navigating to Scene4 with total bone count: ${totalCount}`);
    
    // Save the game state and timer to sessionStorage for persistence
    if (gameState === 'playing') {
      sessionStorage.setItem('gameState', gameState);
      sessionStorage.setItem('timeRemaining', timer.toString());
      console.log(`Saved game state: ${gameState}, time remaining: ${timer}`);
    }
    
    // Navigate to Scene 4
    try {
      // Try to find the button in the parent App component and click it
      const buttons = document.querySelectorAll('button');
      const scene4Button = Array.from(buttons).find(button => 
        button.textContent.includes('Scene 4') || button.textContent.includes('scene4')
      );
      
      if (scene4Button) {
        console.log('Found Scene 4 button, clicking it');
        scene4Button.click();
      } else {
        // Use the state-based approach
        console.log('No Scene 4 button found, trying window.setCurrentScene');
        if (window.parent && window.parent.setCurrentScene) {
          window.parent.setCurrentScene('scene4');
        } else if (window.setCurrentScene) {
          window.setCurrentScene('scene4');
        } else {
          console.log('Falling back to hash navigation');
          window.location.hash = 'scene4';
        }
      }
    } catch (e) {
      console.error('Error navigating to Scene 4:', e);
      // Emergency fallback
      window.location.hash = 'scene4';
    }
  };
  
  // Function to navigate to Scene6 after game over
  const navigateToScene6 = () => {
    // Save the current bone count to sessionStorage
    const totalCount = previousBones + inventory.length;
    sessionStorage.setItem('totalCollectedBones', totalCount.toString());
    console.log(`Navigating to Scene6 with total bone count: ${totalCount}`);
    
    // Clear game state since the game is over
    sessionStorage.removeItem('gameState');
    sessionStorage.removeItem('timeRemaining');
    
    // Navigate to Scene 6
    try {
      // Try to find the button in the parent App component and click it
      const buttons = document.querySelectorAll('button');
      const scene6Button = Array.from(buttons).find(button => 
        button.textContent.includes('Scene 6') || button.textContent.includes('scene6')
      );
      
      if (scene6Button) {
        console.log('Found Scene 6 button, clicking it');
        scene6Button.click();
      } else {
        // Use the state-based approach
        console.log('No Scene 6 button found, trying window.setCurrentScene');
        if (window.parent && window.parent.setCurrentScene) {
          window.parent.setCurrentScene('scene6');
        } else if (window.setCurrentScene) {
          window.setCurrentScene('scene6');
        } else {
          console.log('Falling back to hash navigation');
          window.location.hash = 'scene6';
        }
      }
    } catch (e) {
      console.error('Error navigating to Scene 6:', e);
      // Emergency fallback
      window.location.hash = 'scene6';
    }
  };
  
  const handlePositionChange = (newPosition) => {
    console.log("Character position changed:", newPosition);
    setCharacterPosition(newPosition);
    
    // Clear teleport target when position is updated
    // This ensures we don't get stuck in teleport mode
    setTeleportTarget(null);
  };
  
  const toggleInstructions = () => {
    setShowInstructions(prev => !prev);
  };
  
  const handleResetCamera = () => {
    setResetCamera(true);
    // Reset flag after a short delay to allow the camera controls to detect the change
    setTimeout(() => setResetCamera(false), 100);
  };
  
  // Format time function
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Function to start game
  const startGame = () => {
    // If the game already has a saved timer from Scene4, don't reset it
    const storedTimeRemaining = sessionStorage.getItem('timeRemaining');
    
    if (!storedTimeRemaining) {
      // No saved timer, start fresh with 60 seconds
      setTimeRemaining(60);
    }
    // Always set game state to playing
    setGameState('playing');
    
    // Save the game state to sessionStorage
    sessionStorage.setItem('gameState', 'playing');
  };
  
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas shadows camera={{ position: [-17.5, 6, 30], fov: 50 }}>
        <StarrySky />
        <Scene 
          bones={bones} 
          setBones={setBones} 
          characterPosition={characterPosition} 
          setCharacterPosition={handlePositionChange}
          inventory={inventory}
          setInventory={setInventory}
          showInstructions={showInstructions}
          teleportTarget={teleportTarget}
          setTeleportTarget={setTeleportTarget}
          resetCamera={resetCamera}
          portalActive={portalActive}
          setPortalActive={setPortalActive}
          navigateToScene4={navigateToScene4}
          navigateToScene6={navigateToScene6}
          gameState={gameState}
        />
        <ShipModel />
      </Canvas>
      
      {/* Portal activation message */}
      {portalActive && (
        <div style={{
          position: 'absolute',
          bottom: '50%',
          left: '50%',
          transform: 'translate(-50%, 50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '20px 30px',
          borderRadius: '5px',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(153, 102, 255, 0.7)',
          animation: 'pulse 1.5s infinite',
          zIndex: 10000
        }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#9966ff' }}>Portal Activated!</h2>
          <p>Press [E] to return to the Respiratory Zone</p>
          {gameState === 'playing' && (
            <p style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
              Your timer and collected bones will carry over
            </p>
          )}
          {/* Mobile-friendly touch button */}
          <button
            onClick={navigateToScene4}
            style={{
              background: 'linear-gradient(135deg, #9966ff, #6633cc)',
              color: 'white',
              border: 'none',
              padding: '12px 25px',
              borderRadius: '30px',
              fontSize: '16px',
              fontWeight: 'bold',
              margin: '15px auto 5px auto',
              display: 'block',
              boxShadow: '0 0 15px rgba(153, 102, 255, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(153, 102, 255, 0.7)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(153, 102, 255, 0.5)';
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Enter Portal
          </button>
        </div>
      )}
      
      {/* Add CSS for animation */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: translate(-50%, 50%) scale(1); }
            50% { transform: translate(-50%, 50%) scale(1.05); }
            100% { transform: translate(-50%, 50%) scale(1); }
          }
        `}
      </style>
      
      {/* Previous bones count display */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        boxShadow: '0 0 10px rgba(255, 102, 204, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '5px' }}>
          Bones from Respiratory Zone
        </div>
        <div style={{ 
          fontSize: '20px', 
          fontWeight: 'bold',
          color: '#ff66cc'
        }}>
          {previousBones}
        </div>
      </div>
      
      {/* Inventory display */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '15px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif',
        minWidth: '200px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{ margin: '0', fontSize: '16px' }}>Total Bones:</h3>
          <span style={{ 
            fontWeight: 'bold',
            color: '#ff66cc',
            fontSize: '18px'
          }}>
            {previousBones + inventory.length}
          </span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '14px',
          opacity: 0.9
        }}>
          <span>Current Area:</span>
          <span>{inventory.length}/{bones.length}</span>
        </div>
        
        {inventory.length > 0 ? (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '5px', 
            maxHeight: '100px', 
            overflowY: 'auto',
            marginTop: '10px'
          }}>
            {inventory.map(item => (
              <div key={item.id} style={{ 
                background: 'rgba(255, 102, 204, 0.3)', 
                padding: '3px 6px', 
                borderRadius: '3px'
              }}>
                #{item.id}
              </div>
            ))}
          </div>
        ) : <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>No bones collected yet in this area</div>}
      </div>
      
      {/* Instructions toggle button */}
      <button 
        onClick={toggleInstructions}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #ff66cc, #9966ff)',
          color: 'white',
          border: 'none',
          padding: '8px 15px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 3px 8px rgba(255, 102, 204, 0.7)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        }}
      >
        {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
      </button>
      
      {/* Camera reset button */}
      <button 
        onClick={handleResetCamera}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'linear-gradient(135deg, #ff66cc, #9966ff)',
          color: 'white',
          border: 'none',
          padding: '8px 15px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 3px 8px rgba(255, 102, 204, 0.7)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        }}
      >
        <span style={{ marginRight: '5px' }}>Reset Camera</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="white"/>
        </svg>
      </button>
    </div>
  );
}

// Scene component
function Scene({ bones, setBones, characterPosition, setCharacterPosition, inventory, setInventory, showInstructions, teleportTarget, setTeleportTarget, resetCamera, portalActive, setPortalActive, navigateToScene4, navigateToScene6, gameState }) {
  console.log("RENDERING Scene COMPONENT", { characterPosition, bonesCount: bones.length, inventoryCount: inventory.length });
  
  // Position ref for proximity detection
  const positionRef = useRef(characterPosition);
  const { camera, raycaster, gl, scene } = useThree();
  const groundRef = useRef();
  const orbitControlsRef = useRef();
  // Create portal active ref before it's used
  const portalActiveRef = useRef(false);
  
  // Initial camera position for reset
  const initialCameraPosition = useMemo(() => ({
    position: new THREE.Vector3(-17.5, 6, 30),
    target: new THREE.Vector3(0, 0, 0)
  }), []);
  
  // Update position ref when props change
  useEffect(() => {
    positionRef.current = characterPosition;
  }, [characterPosition]);
  
  // Set up bone collected event listener for playing sound
  useEffect(() => {
    const handleBoneCollected = () => {
      console.log("Bone collected event received, playing sound");
      playCollectSound();
    };
    
    window.addEventListener('bone-collected', handleBoneCollected);
    
    return () => {
      window.removeEventListener('bone-collected', handleBoneCollected);
    };
  }, []);
  
  // Handle camera reset
  useEffect(() => {
    if (resetCamera && orbitControlsRef.current) {
      console.log("Resetting camera to initial position");
      
      // Reset camera position
      camera.position.copy(initialCameraPosition.position);
      
      // Reset orbit controls target
      orbitControlsRef.current.target.copy(initialCameraPosition.target);
      
      // Update controls
      orbitControlsRef.current.update();
    }
  }, [resetCamera, camera, initialCameraPosition]);
  
  // Set up click handler for teleportation
  useEffect(() => {
    const handleClick = (event) => {
      // Calculate mouse position in normalized device coordinates
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);
      
      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      // Find the first intersection with the ground
      for (let i = 0; i < intersects.length; i++) {
        const intersect = intersects[i];
        const object = intersect.object;
        
        // Check if we hit the ground or a ground-like object
        // Look up through parent hierarchy to check for userData.isGround property
        let current = object;
        let isGround = false;
        
        while (current) {
          if (current.userData && current.userData.isGround) {
            isGround = true;
            break;
          }
          current = current.parent;
        }
        
        // Also check if this is our ground reference
        if (isGround || (groundRef.current && object === groundRef.current)) {
          const point = intersect.point;
          console.log("Teleport target:", point);
          
          // Set teleport target
          setTeleportTarget({
            x: point.x,
            z: point.z
          });
          
          break;
        }
      }
    };
    
    // Add click event listener
    gl.domElement.addEventListener('click', handleClick);
    
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [camera, raycaster, gl, scene, setTeleportTarget]);
  
  // Proximity detection for bone collection and portal activation
  useEffect(() => {
    console.log("Setting up proximity detection");
    const proximityThreshold = 2; // Distance threshold for collection
    const collectStep = 0.04; // Collection speed - increased from 0.01 to 0.04 for faster collection
    const portalThreshold = 7; // Distance threshold for portal activation - adjusted to 7 units
    
    // Check for portal proximity and bone collection
    const checkInterval = setInterval(() => {
      const currentPosition = positionRef.current;
      
      // Check proximity to door/portal
      if (scene.userData.doorPosition) {
        const doorPos = scene.userData.doorPosition;
        const dx = doorPos.x - currentPosition.x;
        const dz = doorPos.z - currentPosition.z;
        const distanceToDoor = Math.sqrt(dx * dx + dz * dz);
        
        // Set portal active state based on proximity
        if (distanceToDoor < portalThreshold && !portalActiveRef.current) {
          console.log("Portal activated! Distance to door:", distanceToDoor);
          setPortalActive(true);
          portalActiveRef.current = true;
        } else if (distanceToDoor >= portalThreshold && portalActiveRef.current) {
          console.log("Portal deactivated. Distance to door:", distanceToDoor);
          setPortalActive(false);
          portalActiveRef.current = false;
        }
      }
      
      // Only process bone collection if the game is in playing state
      if (gameState !== 'playing') return;
      
      setBones(prevBones => {
        let bonesUpdated = false;
        
        const newBones = prevBones.map(bone => {
          if (bone.collected) return bone;
          
          // Calculate distance between character and bone
          const dx = bone.position[0] - currentPosition.x;
          const dz = bone.position[2] - currentPosition.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance < proximityThreshold) {
            console.log(`Bone ${bone.id} in proximity, distance:`, distance);
            // Character is close to bone, increase progress
            const newProgress = Math.min(1, bone.collectProgress + collectStep);
            
            // If progress complete, mark as collected
            if (newProgress >= 1 && bone.collectProgress < 1) {
              // Add to inventory
              setInventory(prev => {
                if (!prev.some(item => item.id === bone.id)) {
                  console.log(`Bone ${bone.id} collected! Dispatching event.`);
                  
                  // Dispatch bone collected event with a slight delay to ensure it's not missed
                  setTimeout(() => {
                    const boneCollectedEvent = new CustomEvent('bone-collected', {
                      detail: { boneId: bone.id }
                    });
                    window.dispatchEvent(boneCollectedEvent);
                    console.log("bone-collected event dispatched for bone", bone.id);
                  }, 10);
                  
                  return [...prev, { id: bone.id, type: 'bone', timestamp: Date.now() }];
                }
                return prev;
              });
              
              bonesUpdated = true;
              return { ...bone, collectProgress: 1, collected: true };
            }
            
            if (newProgress !== bone.collectProgress) {
              console.log(`Bone ${bone.id} progress updated:`, newProgress);
              bonesUpdated = true;
              return { ...bone, collectProgress: newProgress };
            }
          } else if (bone.collectProgress > 0) {
            // Character moved away, decrease progress
            const newProgress = Math.max(0, bone.collectProgress - collectStep * 2);
            
            if (newProgress !== bone.collectProgress) {
              console.log(`Bone ${bone.id} progress decreased:`, newProgress);
              bonesUpdated = true;
              return { ...bone, collectProgress: newProgress };
            }
          }
          
          return bone;
        });
        
        return bonesUpdated ? newBones : prevBones;
      });
    }, 50); // Check every 50ms
    
    // Set up keyboard listener for portal activation
    const handleKeyPress = (e) => {
      if (e.key.toLowerCase() === 'e' && portalActiveRef.current) {
        console.log("Portal entry key pressed!");
        navigateToScene4();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [setBones, setInventory, scene, setPortalActive, navigateToScene4]);
  
  return (
    <>
      <StarrySky />
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} castShadow />
      <DoorModel portalActive={portalActive} />
      {/* Lighting */}
      <ambientLight intensity={0.1} color="#ff66cc" />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        color="#ffffff" 
      />
      
      {/* Add some point lights for dramatic effect */}
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#ff66aa" distance={10} />
      <pointLight position={[5, 2, 5]} intensity={0.2} color="#cc66ff" distance={8} />
      <pointLight position={[-5, 2, -5]} intensity={0.2} color="#ff99cc" distance={8} />
      
      {/* FBX Background */}
      <Suspense fallback={
        <mesh 
          ref={groundRef}
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]} 
          receiveShadow
          userData={{ isGround: true }}
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      }>
        <group>
          <BackgroundFBXModel 
            path="/models/harbor.fbx" 
            position={[0, -0.01, 0]} 
            scale={0.01} 
            rotation={[0, 0, 0]} 
          />
          {/* Invisible ground plane for teleportation */}
          <mesh 
            ref={groundRef}
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, 0]} 
            visible={false}
            userData={{ isGround: true }}
          >
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </group>
      </Suspense>
      
      {/* Teleport marker */}
      {teleportTarget && (
        <TeleportMarker position={[teleportTarget.x, 0, teleportTarget.z]} />
      )}
      
      {/* Character */}
      <CharacterController 
        position={characterPosition} 
        onPositionChange={setCharacterPosition}
        teleportTarget={teleportTarget}
      />
      
      {/* Bones */}
      {bones.map(bone => (
        <CollectibleBone
          key={bone.id}
          id={bone.id}
          position={bone.position}
          rotation={bone.rotation}
          scale={bone.scale}
          collectProgress={bone.collectProgress}
          collected={bone.collected}
          characterPosition={characterPosition}
        />
      ))}
      
      {/* Instructions */}
      <Instructions show={showInstructions} />
      
      {/* Environment lighting */}
      <Environment preset="night" />
      
      {/* Camera controls */}
      <OrbitControls 
        ref={orbitControlsRef}
        enablePan={true}
        maxPolarAngle={Math.PI - 0.1}
        minDistance={1}
        maxDistance={70}
        enableDamping={true}
        dampingFactor={0.1}
      />
    </>
  );
}

// Instructions component
function Instructions({ show }) {
  console.log("RENDERING Instructions COMPONENT");
  
  if (!show) return null;
  
  return (
    <Html position={[0, 2, 0]} center>
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '350px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        pointerEvents: 'none',
        boxShadow: '0 0 15px rgba(255, 102, 204, 0.5)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#ff66cc', fontSize: '22px' }}>Alveolar Harbor</h3>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '15px'
        }}>
          <p style={{ margin: '0', fontSize: '16px' }}>Continue your bone collection journey!</p>
          
          {/* Movement controls instruction */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '10px',
            margin: '10px 0',
            padding: '8px',
            fontSize: '14px'
          }}>
            <span style={{ fontWeight: 'bold' }}>WASD</span>
            <span>or</span>
            <span style={{ fontWeight: 'bold' }}>Arrow Keys</span>
            <span>to move</span>
          </div>
          
          {/* Teleport instruction */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '10px',
            background: 'rgba(255, 102, 204, 0.15)',
            padding: '8px',
            borderRadius: '5px'
          }}>
            <span style={{ fontWeight: 'bold' }}>Click</span>
            <span>anywhere to teleport</span>
          </div>
          
          {/* Bone collection instruction */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '10px',
            background: 'rgba(255, 102, 204, 0.15)',
            padding: '8px',
            borderRadius: '5px',
            marginTop: '10px'
          }}>
            <span>Stand near bones to collect them</span>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: 'rgba(153, 102, 255, 0.2)', 
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          Your collection from the previous area has been saved
        </div>
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
  const characterRef = useRef();
  const keysRef = useRef({});
  const speed = 0.1;
  const teleportingRef = useRef(false);
  const teleportStartPosRef = useRef(null);
  const teleportProgressRef = useRef(0);
  const teleportDurationRef = useRef(30); // frames for teleport animation
  const { camera } = useThree();
  
  // Jump state
  const jumpingRef = useRef(false);
  const jumpProgressRef = useRef(0);
  const jumpDurationRef = useRef(40); // frames for jump animation
  const jumpHeightRef = useRef(1.5); // maximum jump height
  
  // Set up keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default behavior for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'x'].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Initialize character position
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.position.set(position.x, position.y, position.z);
    }
  }, []);
  
  // Handle teleport target changes
  useEffect(() => {
    if (teleportTarget && characterRef.current) {
      console.log("Starting teleport to:", teleportTarget);
      teleportingRef.current = true;
      teleportStartPosRef.current = {
        x: characterRef.current.position.x,
        y: characterRef.current.position.y,
        z: characterRef.current.position.z
      };
      teleportProgressRef.current = 0;
    }
  }, [teleportTarget]);
  
  // Update position based on keys pressed or teleport
  useFrame(() => {
    if (!characterRef.current) return;
    
    // Handle teleportation animation
    if (teleportingRef.current && teleportTarget) {
      teleportProgressRef.current += 1;
      
      const progress = Math.min(teleportProgressRef.current / teleportDurationRef.current, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      
      const startPos = teleportStartPosRef.current;
      const newX = startPos.x + (teleportTarget.x - startPos.x) * easeProgress;
      const newZ = startPos.z + (teleportTarget.z - startPos.z) * easeProgress;
      
      // Update position
      characterRef.current.position.x = newX;
      characterRef.current.position.z = newZ;
      
      // Add a small jump arc to teleportation
      const jumpHeight = Math.sin(progress * Math.PI) * 0.5;
      characterRef.current.position.y = position.y + jumpHeight;
      
      // Calculate rotation to face teleport direction
      const dx = teleportTarget.x - startPos.x;
      const dz = teleportTarget.z - startPos.z;
      if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
        const angle = Math.atan2(dx, dz);
        characterRef.current.rotation.y = angle;
      }
      
      // Teleport complete
      if (progress >= 1) {
        teleportingRef.current = false;
        // Reset Y position to ground level
        characterRef.current.position.y = position.y;
        onPositionChange({
          x: teleportTarget.x,
          y: position.y,
          z: teleportTarget.z
        });
      }
      
      return;
    }
    
    // Check for jump key press (X)
    if (keysRef.current['x'] && !jumpingRef.current && !teleportingRef.current) {
      jumpingRef.current = true;
      jumpProgressRef.current = 0;
      console.log("Jump started");
    }
    
    // Handle jump animation
    if (jumpingRef.current) {
      jumpProgressRef.current += 1;
      
      const progress = jumpProgressRef.current / jumpDurationRef.current;
      
      if (progress <= 1) {
        // Sine curve for smooth up and down motion
        const jumpHeight = Math.sin(progress * Math.PI) * jumpHeightRef.current;
        characterRef.current.position.y = position.y + jumpHeight;
      } else {
        // Jump complete
        jumpingRef.current = false;
        characterRef.current.position.y = position.y;
        console.log("Jump completed");
      }
    }
    
    // Handle keyboard movement when not teleporting
    let moved = false;
    
    // Get current position
    const currentX = characterRef.current.position.x;
    const currentZ = characterRef.current.position.z;
    
    // Calculate camera-relative movement directions
    // Extract camera direction (ignoring y component for ground movement)
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    // Calculate camera right vector (perpendicular to direction)
    const cameraRight = new THREE.Vector3(-cameraDirection.z, 0, cameraDirection.x);
    
    // Initialize movement vector
    let moveX = 0;
    let moveZ = 0;
    
    // Apply input based on camera orientation
    if (keysRef.current['arrowup'] || keysRef.current['w']) {
      // Move forward in camera direction
      moveX += cameraDirection.x * speed;
      moveZ += cameraDirection.z * speed;
      moved = true;
    }
    if (keysRef.current['arrowdown'] || keysRef.current['s']) {
      // Move backward from camera direction
      moveX -= cameraDirection.x * speed;
      moveZ -= cameraDirection.z * speed;
      moved = true;
    }
    if (keysRef.current['arrowleft'] || keysRef.current['a']) {
      // Move left from camera perspective
      moveX -= cameraRight.x * speed;
      moveZ -= cameraRight.z * speed;
      moved = true;
    }
    if (keysRef.current['arrowright'] || keysRef.current['d']) {
      // Move right from camera perspective
      moveX += cameraRight.x * speed;
      moveZ += cameraRight.z * speed;
      moved = true;
    }
    
    // Calculate new position
    let newX = currentX + moveX;
    let newZ = currentZ + moveZ;
    
    // Update position
    characterRef.current.position.x = newX;
    characterRef.current.position.z = newZ;
    
    // Update rotation based on movement direction if moved
    if (moved && (Math.abs(moveX) > 0.001 || Math.abs(moveZ) > 0.001)) {
      // Calculate angle from movement direction
      const angle = Math.atan2(moveX, moveZ);
      characterRef.current.rotation.y = angle;
      
      // Notify position change
      onPositionChange({
        x: newX,
        y: position.y,
        z: newZ
      });
    }
  });
  
  return (
    <group ref={characterRef} position={[position.x, position.y, position.z]}>
      {/* Multiple layers of glowing spheres for a softer effect */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial 
          color="#ff66cc"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial 
          color="#ff66cc"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#ff66cc"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>
      
      <Suspense fallback={
        <mesh castShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="skyblue" />
        </mesh>
      }>
        <CharacterFBXModel 
          path="/models/character.fbx" 
          scale={0.01} 
          rotation={[0, Math.PI, 0]} // Adjust rotation as needed for your model
        />
      </Suspense>
      
      {/* Optional collision helper - can be hidden in production */}
      <mesh visible={false}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial color="red" wireframe={true} />
      </mesh>
    </group>
  );
}

// 3D Bone component with reset on angle change
function CollectibleBone({ id, position, rotation = [0, 0, 0], scale = 0.01, collectProgress, collected, characterPosition }) {
  console.log(`RENDERING CollectibleBone ${id} COMPONENT`, { position, collectProgress, collected });
  
  const boneRef = useRef();
  const boxRef = useRef();
  const progressRef = useRef();
  
  // Get camera for angle calculations
  const { camera } = useThree();
  
  // State for visibility and angle
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCorrectAngle, setIsCorrectAngle] = useState(false);
  
  // Refs for movement detection
  const lastPositionRef = useRef(characterPosition);
  const isMovingRef = useRef(false);
  const movementTimerRef = useRef(null);
  
  // Ref to track if collection has started
  const collectionStartedRef = useRef(false);
  
  // Calculate a unique floating speed and height based on id
  const floatSpeed = 0.0008 + (id * 0.0001);
  const floatHeight = 0.15 + (id * 0.02);
  
  // Define the correct viewing angle for this bone
  const correctAngle = useMemo(() => {
    return new THREE.Vector3(
      Math.sin(id * 0.7) * 0.8, 
      0.3, 
      Math.cos(id * 0.7) * 0.8
    ).normalize();
  }, [id]);
  
  // Load bone model
  const boneFbx = useFBX('/models/bonefragment.fbx');
  const boneModel = React.useMemo(() => boneFbx.clone(), [boneFbx]);
  
  // Set up shadows and materials
  useEffect(() => {
    console.log(`Setting up bone ${id} model`);
    if (boneModel) {
      boneModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          if (child.material) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xd0d0d0,
              roughness: 0.8,
              metalness: 0.1
            });
          }
        }
      });
    }
  }, [boneModel, id]);
  
  // Track if collection has started
  useEffect(() => {
    if (collectProgress > 0) {
      console.log(`Bone ${id} collection started`);
      collectionStartedRef.current = true;
    }
  }, [collectProgress, id]);
  
  // Detect character movement
  useEffect(() => {
    if (!characterPosition || !lastPositionRef.current) {
      lastPositionRef.current = { ...characterPosition };
      return;
    }
    
    const dx = characterPosition.x - lastPositionRef.current.x;
    const dz = characterPosition.z - lastPositionRef.current.z;
    const movementDelta = Math.sqrt(dx * dx + dz * dz);
    
    if (movementDelta > 0.01) {
      console.log(`Character moving near bone ${id}, delta:`, movementDelta);
      isMovingRef.current = true;
      
      if (movementTimerRef.current) {
        clearTimeout(movementTimerRef.current);
      }
      
      movementTimerRef.current = setTimeout(() => {
        isMovingRef.current = false;
        
        // Check if character is near this bone
        const boneX = position[0];
        const boneZ = position[2];
        const charX = characterPosition.x;
        const charZ = characterPosition.z;
        
        const distanceSquared = (boneX - charX) * (boneX - charX) + (boneZ - charZ) * (boneZ - charZ);
        const proximityThreshold = 2;
        
        console.log(`Bone ${id} distance check:`, Math.sqrt(distanceSquared), "threshold:", proximityThreshold);
        
        // Only set revealed if collection has started or character is nearby
        if (collectionStartedRef.current || distanceSquared < proximityThreshold * proximityThreshold) {
          console.log(`Revealing bone ${id}`);
          setIsRevealed(true);
        }
      }, 100);
    }
    
    lastPositionRef.current = { ...characterPosition };
  }, [characterPosition, position, id]);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (movementTimerRef.current) {
        clearTimeout(movementTimerRef.current);
      }
    };
  }, []);
  
  // Frame counter to reduce updates
  const frameCounter = useRef(0);
  
  useFrame(() => {
    if (collected) return;
    
    // Common floating animation
    const yPos = Math.sin(Date.now() * floatSpeed) * floatHeight + 0.5;
    
    // Update positions
    if (boneRef.current) {
      boneRef.current.position.y = yPos;
      boneRef.current.rotation.y += 0.005;
    }
    
    if (boxRef.current) {
      boxRef.current.position.y = yPos;
      boxRef.current.rotation.y += 0.005;
    }
    
    if (progressRef.current) {
      progressRef.current.position.y = yPos - 0.3;
      progressRef.current.visible = collectProgress > 0;
    }
    
    // Only check viewing angle if not moving
    if (!isMovingRef.current) {
      // Calculate viewing angle
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      cameraDirection.negate(); // Camera looks in negative Z, we need positive
      
      // Calculate dot product to determine if viewing from correct angle
      const dotProduct = cameraDirection.dot(correctAngle);
      const threshold = 0.7;
      
      // Determine if we're at the correct angle
      const newIsCorrectAngle = dotProduct > threshold;
      
      // Update less frequently to reduce re-renders
      frameCounter.current += 1;
      if (frameCounter.current % 30 === 0) {
        // If angle changed, update state
        if (newIsCorrectAngle !== isCorrectAngle) {
          console.log(`Bone ${id} angle changed to:`, newIsCorrectAngle ? "correct" : "incorrect", "dot:", dotProduct);
          setIsCorrectAngle(newIsCorrectAngle);
          
          // If collection hasn't started, update revealed state based on angle
          if (!collectionStartedRef.current) {
            console.log(`Bone ${id} revealed state updated to:`, newIsCorrectAngle);
            setIsRevealed(newIsCorrectAngle);
          }
        }
      }
    }
    
    // Update visibility based on revealed state
    // Ensure they're never simultaneously visible
    if (boneRef.current && boxRef.current) {
      if (isRevealed) {
        boneRef.current.visible = true;
        boxRef.current.visible = false;
      } else {
        boneRef.current.visible = false;
        boxRef.current.visible = true;
      }
    }
  });
  
  if (collected) return null;
  
  // Create distinct colors for boxes based on ID
  const boxColor = new THREE.Color(`hsl(${id * 60}, 70%, 50%)`);
  
  // Create different geometric shapes based on ID
  const getGeometricShape = () => {
    switch (id % 5) {
      case 0:
        return <dodecahedronGeometry args={[1, 0]} />;
      case 1:
        return <coneGeometry args={[0.5, 1, 8]} />;
      case 2:
        return <octahedronGeometry args={[1, 0]} />;
      case 3:
        return <torusGeometry args={[0.5, 0.2, 8, 16]} />;
      case 4:
        return <icosahedronGeometry args={[1, 0]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };
  
  return (
    <group position={position} rotation={rotation}>
      {/* Bone model - initially hidden */}
      <group ref={boneRef} scale={scale} visible={false}>
        <primitive object={boneModel} />
      </group>
      
      {/* Geometric shape placeholder - initially visible */}
      <mesh 
        ref={boxRef}
        scale={[scale * 100, scale * 100, scale * 100]}
        visible={!collected}
      >
        {getGeometricShape()}
        <meshStandardMaterial 
          color={boxColor}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      
      {/* Progress indicator - show when collecting or collected */}
      <group ref={progressRef} position={[0, 3, 0]} rotation={[0, 0, 0]} visible={collectProgress > 0}>
        {/* Background circle */}
        <mesh>
          <ringGeometry args={[1.2, 1.5, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.3} />
        </mesh>
        
        {/* Progress arc */}
        <mesh>
          <ringGeometry args={[1.2, 1.5, 32, 1, 0, collectProgress * Math.PI * 2]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
      </group>
    </group>
  );
} 