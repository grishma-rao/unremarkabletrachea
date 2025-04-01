import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, useFBX, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
// Import sound conditionally to avoid errors if file doesn't exist
let ascensionSound;
try {
  ascensionSound = require('./sounds/ascension.mp3').default;
} catch (e) {
  console.log("Ascension sound file not found, using fallback");
  // You can provide a URL to a sound file hosted online as fallback
  // ascensionSound = "https://example.com/fallback-sound.mp3";
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
      position={[0, -15, 0]}
      scale={1.0}
      rotation={[0, Math.PI / 2, 0]}
    />
  );
}

// Starry Night Sky background
function StarrySky() {
  return (
    <>
      <color attach="background" args={['#1a0011']} />
      <Stars 
        radius={100} 
        depth={50} 
        count={5000} 
        factor={4} 
        saturation={0.5}
        fade 
        speed={1} 
        color="#ff9ee8"
      />
      <fog attach="fog" args={['#2a0022', 15, 25]} />
    </>
  );
}

// Character component
function Character({ position, isJumping }) {
  const fbx = useFBX('/models/character.fbx');
  const modelRef = useRef();
  
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, []);

  return (
    <group position={position}>
      {/* Pink glow effect */}
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
      
      {/* Character model */}
      <primitive 
        ref={modelRef}
        object={fbx} 
        scale={0.01}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}

// Platform component with animation
function Platform({ position, size, speed = 0, phase = 0 }) {
  const meshRef = useRef();
  const startY = position[1];
  
  useFrame(({ clock }) => {
    if (meshRef.current && speed > 0) {
      meshRef.current.position.y = startY + Math.sin(clock.elapsedTime * speed + phase) * 2;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial 
        color="#ff88aa"
        metalness={0.1}
        roughness={0.5}
        emissive="#ff88aa"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

// Camera controller component to handle transitions
function CameraController({ cameraPosition, orbitControlsRef, initialZoomCompleted }) {
  const { camera } = useThree();
  
  useFrame(() => {
    // Update position during animations
    if (initialZoomCompleted.current) {
      camera.position.x = cameraPosition[0];
      camera.position.y = cameraPosition[1]; // Also update Y position
    }
  });
  
  return null;
}

// Add a SparkleParticles component for the ascension effect
function SparkleParticles({ count = 100, visible = false }) {
  const sparklesRef = useRef();
  const points = useMemo(() => {
    const temp = [];
    // Create a cylinder of particles around the character
    for (let i = 0; i < count; i++) {
      // Cylindrical coordinates
      const radius = 5 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const y = -10 + Math.random() * 30; // Span from ground to lung height
      
      // Convert to cartesian
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);
      
      temp.push(new THREE.Vector3(x, y, z));
    }
    return temp;
  }, [count]);
  
  // Animate sparkles
  useFrame(({ clock }) => {
    if (!sparklesRef.current || !visible) return;
    
    const elapsedTime = clock.getElapsedTime();
    const positions = sparklesRef.current.geometry.attributes.position.array;
    
    for (let i = 0; i < points.length; i++) {
      const i3 = i * 3;
      
      // Spiral upward movement
      const point = points[i];
      const angle = elapsedTime * 0.5 + i * 0.01;
      const radius = 5 + Math.sin(elapsedTime * 0.5 + i * 0.1) * 2;
      
      positions[i3] = point.x + Math.cos(angle + point.y * 0.1) * radius * 0.2;
      positions[i3 + 1] = point.y + elapsedTime * 1.5 % 30; // Loop vertically
      positions[i3 + 2] = point.z + Math.sin(angle + point.y * 0.1) * radius * 0.2;
    }
    
    sparklesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={sparklesRef} visible={visible}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.length * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        color="#ff99cc" 
        transparent 
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Main game component
function Game() {
  const [position, setPosition] = useState([0, -9, 0]);
  const [velocity, setVelocity] = useState([0, 0, 0]);
  const [isJumping, setIsJumping] = useState(false);
  const [onGround, setOnGround] = useState(true);
  const keysPressed = useRef({});
  const positionRef = useRef([0, -9, 0]);
  const velocityRef = useRef([0, 0, 0]);
  const cameraRef = useRef();

  // Game constants
  const GRAVITY = 0.05;
  const JUMP_FORCE = 0.8;
  const MOVE_SPEED = 0.15;

  // Platform definitions
  const platforms = [
    { position: [0, -10, 0], size: [10, 0.5, 4], speed: 0 },          // Ground
    { position: [4, -7, 0], size: [3, 0.5, 3], speed: 1, phase: 0 }, // Moving platform 1
    { position: [-4, -4, 0], size: [3, 0.5, 3], speed: 1, phase: 2 }, // Moving platform 2
    { position: [4, -1, 0], size: [3, 0.5, 3], speed: 1, phase: 4 },  // Moving platform 3
    { position: [-4, 2, 0], size: [3, 0.5, 3], speed: 1, phase: 6 }, // Moving platform 4
  ];

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Check platform collisions
  const checkPlatformCollisions = (pos, vel) => {
    for (let platform of platforms) {
      // Get current platform Y position (accounting for animation)
      const platformY = platform.speed > 0 
        ? platform.position[1] + Math.sin(Date.now() * 0.001 * platform.speed + platform.phase) * 2
        : platform.position[1];

      // Calculate platform boundaries
      const platformTop = platformY + platform.size[1] / 2;
      const platformBottom = platformY - platform.size[1] / 2;
      const platformLeft = platform.position[0] - platform.size[0] / 2;
      const platformRight = platform.position[0] + platform.size[0] / 2;
      const platformFront = platform.position[2] - platform.size[2] / 2;
      const platformBack = platform.position[2] + platform.size[2] / 2;

      // Character bounds (considering character radius of 0.5)
      const charBottom = pos[1] - 0.5;
      const charTop = pos[1] + 0.5;

      // Horizontal collision check
      const withinX = pos[0] >= platformLeft - 0.5 && pos[0] <= platformRight + 0.5;
      const withinZ = pos[2] >= platformFront - 0.5 && pos[2] <= platformBack + 0.5;

      // Vertical collision check
      const abovePlatform = charBottom >= platformTop - 0.1; // Small tolerance
      const belowTop = charBottom <= platformTop + 0.5; // Landing tolerance
      const fallingOrStanding = vel[1] <= 0.01; // Include standing on platform

      // Debug collision checks
      if (withinX && withinZ) {
        console.log('Within platform horizontal bounds:', {
          platformY,
          charBottom,
          platformTop,
          abovePlatform,
          belowTop,
          velocity: vel[1]
        });
      }

      // Check for valid landing collision
      if (withinX && withinZ && abovePlatform && belowTop && fallingOrStanding) {
        console.log('Landing on platform at height:', platformTop);
        return {
          collision: true,
          y: platformTop + 0.5 // Position character on top of platform
        };
      }
    }
    return { collision: false };
  };

  // Game loop
  useFrame(({ camera }) => {
    let moveX = 0;
    let moveZ = 0;
    let currentVelocity = [...velocityRef.current];
    let currentPosition = [...positionRef.current];

    // Get camera's forward and right vectors
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(camera.up, cameraDirection).normalize();

    // Calculate movement direction based on camera orientation
    if (keysPressed.current['a'] || keysPressed.current['arrowleft']) {
      moveX -= cameraRight.x * MOVE_SPEED;
      moveZ -= cameraRight.z * MOVE_SPEED;
    }
    if (keysPressed.current['d'] || keysPressed.current['arrowright']) {
      moveX += cameraRight.x * MOVE_SPEED;
      moveZ += cameraRight.z * MOVE_SPEED;
    }
    if (keysPressed.current['w'] || keysPressed.current['arrowup']) {
      moveX += cameraDirection.x * MOVE_SPEED;
      moveZ += cameraDirection.z * MOVE_SPEED;
    }
    if (keysPressed.current['s'] || keysPressed.current['arrowdown']) {
      moveX -= cameraDirection.x * MOVE_SPEED;
      moveZ -= cameraDirection.z * MOVE_SPEED;
    }

    // Handle jump input
    if (keysPressed.current['x'] && onGround) {
      currentVelocity[1] = JUMP_FORCE;
      setOnGround(false);
      setIsJumping(true);
      console.log("Jumping! Initial velocity:", JUMP_FORCE);
    }

    // Apply gravity if not on ground
    if (!onGround) {
      currentVelocity[1] -= GRAVITY;
    }

    // Update position
    currentPosition[0] += moveX;
    currentPosition[1] += currentVelocity[1];
    currentPosition[2] += moveZ;

    // Check collisions
    const collision = checkPlatformCollisions(currentPosition, currentVelocity);

    if (collision.collision) {
      // Land on platform
      currentPosition[1] = collision.y;
      currentVelocity[1] = 0;
      setOnGround(true);
      setIsJumping(false);
      console.log("Landed on platform!");
    } else if (currentPosition[1] <= -10) {
      // Land on ground
      currentPosition[1] = -10;
      currentVelocity[1] = 0;
      setOnGround(true);
      setIsJumping(false);
    } else if (currentPosition[1] > -10) {
      // If we're above ground and not on a platform, we're in the air
      setOnGround(false);
    }

    // Reset if fallen too far
    if (currentPosition[1] < -15) {
      currentPosition = [0, -9, 0];
      currentVelocity = [0, 0, 0];
      setOnGround(true);
      setIsJumping(false);
    }

    // Update refs and state
    positionRef.current = currentPosition;
    velocityRef.current = currentVelocity;
    setPosition(currentPosition);
    setVelocity(currentVelocity);

    // Update camera target to follow character
    if (cameraRef.current) {
      cameraRef.current.target.set(currentPosition[0], currentPosition[1], currentPosition[2]);
      cameraRef.current.update();
    }
  });

  return (
    <>
      <Character position={positionRef.current} isJumping={isJumping} />
      {platforms.map((platform, index) => (
        <Platform 
          key={index}
          position={platform.position}
          size={platform.size}
          speed={platform.speed}
          phase={platform.phase}
        />
      ))}
    </>
  );
}

// Main component
function NewScene5() {
  const [cameraPosition, setCameraPosition] = useState([50, 5, 0]);
  const [showMessage, setShowMessage] = useState(false);
  const [jumpCount, setJumpCount] = useState(0);
  const [ascendingCamera, setAscendingCamera] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const cameraRef = useRef();
  const initialZoomCompleted = useRef(false);
  
  // Camera zoom effect after 4 seconds - only along X axis
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Starting camera zoom in");
      initialZoomCompleted.current = true;
      
      // Animate the camera position
      let startPosition = [...cameraPosition];
      let targetPosition = [20, 5, 0]; // Only zoom in along X axis
      let progress = 0;
      const duration = 2000; // 2 seconds for the transition
      
      const animate = (timestamp) => {
        if (!initialZoomCompleted.current) return;
        
        progress += 16; // Approx 60fps
        const t = Math.min(progress / duration, 1);
        // Ease in-out function
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        
        // Only change the X coordinate
        const newX = startPosition[0] + (targetPosition[0] - startPosition[0]) * ease;
        const newY = startPosition[1];
        const newZ = startPosition[2];
        
        setCameraPosition([newX, newY, newZ]);
        
        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          console.log("Camera zoom completed");
          // Show message after zoom is complete
          setShowMessage(true);
        }
      };
      
      requestAnimationFrame(animate);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [cameraPosition]);
  
  // Track X key presses for jumping
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only count X key presses after the message is shown
      if (showMessage && (e.key === 'x' || e.key === 'X')) {
        setJumpCount(prevCount => {
          const newCount = prevCount + 1;
          console.log(`Jump count: ${newCount}`);
          
          // Start camera ascension after 15 jumps
          if (newCount >= 15 && !ascendingCamera) {
            setAscendingCamera(true);
          }
          
          return newCount;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMessage, ascendingCamera]);
  
  // Update the existing effect that handles camera and ascending
  useEffect(() => {
    if (ascendingCamera) {
      const startTime = Date.now();
      const duration = 5000; // 5 seconds
      
      // Play the ascension sound if available
      let audio;
      if (ascensionSound) {
        audio = new Audio(ascensionSound);
        audio.volume = 0.7;
        audio.play().catch(e => console.log("Audio play failed:", e));
      }
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (cameraRef.current) {
          // Only adjust the polar angle to look up, keep original azimuthal angle
          const currentAzimuthal = cameraRef.current.getAzimuthalAngle();
          cameraRef.current.setPolarAngle(Math.PI / 2 - (progress * (Math.PI / 4)));
          cameraRef.current.update();
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Show success message when camera reaches final rotation
          setShowSuccessMessage(true);
        }
      };
      
      animate();
      
      // Clean up audio when component unmounts
      return () => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      };
    }
  }, [ascendingCamera]);
  
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ 
        position: cameraPosition, 
        fov: 60
      }}>
        <StarrySky />
        {/* Ground plane */}
        <mesh 
          position={[0, -10, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial 
            color="#ff88aa"
            metalness={0.1}
            roughness={0.5}
            emissive="#ff88aa"
            emissiveIntensity={0.2}
            transparent
            opacity={0.1}
          />
        </mesh>
        <LungsModel />
        <Game />
        <SparkleParticles visible={ascendingCamera} />
        <OrbitControls 
          ref={cameraRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2}
          target={[0, -10, 0]} // Point directly at the center of the lungs
          enableDamping={true}
          dampingFactor={0.1}
        />
        
        {/* Custom camera control to sync with our managed camera position */}
        <CameraController 
          cameraPosition={cameraPosition} 
          orbitControlsRef={cameraRef}
          initialZoomCompleted={initialZoomCompleted}
        />
        {/* Lighting */}
        <ambientLight intensity={10} />
        <pointLight position={[0, -25, 15]} intensity={5000} color="#ffffff" />
        <pointLight position={[0, -30, 15]} intensity={5000} color="#ffffff" />
        <pointLight position={[0, -35, 15]} intensity={5000} color="#ffffff" />
        <pointLight position={[0, -40, 15]} intensity={5000} color="#ffffff" />
        <pointLight position={[0, -45, 15]} intensity={5000} color="#ffffff" />
        <pointLight position={[5, -30, 15]} intensity={5000} color="#ffffff" />
        <pointLight position={[-5, -30, 15]} intensity={5000} color="#ffffff" />
        <pointLight position={[0, -30, 20]} intensity={5000} color="#ffffff" />
        <pointLight position={[0, -30, 10]} intensity={5000} color="#ffffff" />
        <directionalLight 
          position={[0, -20, 15]} 
          intensity={1000} 
          color="#ffffff"
          castShadow
        />
        {/* Origin light */}
        <pointLight 
          position={[25, 5, 0]} 
          intensity={8000} 
          color="#ffbbdd"
        />
      </Canvas>
      
      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '15px',
        borderRadius: '5px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Controls:</h3>
        <p style={{ margin: '5px 0' }}>WASD / Arrows: Move</p>
        <p style={{ margin: '5px 0' }}>X: Jump</p>
        <p style={{ margin: '5px 0' }}>Mouse: Rotate View</p>
        <p style={{ margin: '5px 0' }}>Scroll: Zoom</p>
        <p style={{ margin: '5px 0' }}>Right Click + Drag: Pan</p>
      </div>
      
      {/* Game progression message */}
      {showMessage && !showSuccessMessage && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px 30px',
          borderRadius: '8px',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          maxWidth: '800px',
          boxShadow: '0 0 20px rgba(255, 102, 204, 0.6)',
          animation: 'fadeIn 1s ease-in-out',
          zIndex: 1000
        }}>
          <p style={{ 
            fontSize: '18px', 
            margin: 0,
            lineHeight: '1.5',
            color: '#ffccee',
            fontWeight: 'bold'
          }}>
            With all the bones you've collected, jump up by pressing X, ascend into the lungs to start your repairs!
          </p>
          
          {/* Ascension message */}
          {ascendingCamera && (
            <p style={{ 
              fontSize: '16px', 
              margin: '10px 0 0 0',
              color: '#9966ff',
              fontWeight: 'bold',
              animation: 'pulse 1.5s infinite'
            }}>
              Ascending into the lungs...
            </p>
          )}
        </div>
      )}
      
      {/* Success message */}
      {showSuccessMessage && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '30px 40px',
          borderRadius: '12px',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          maxWidth: '800px',
          boxShadow: '0 0 30px rgba(155, 89, 182, 0.8)',
          animation: 'fadeInScale 1s ease-out',
          zIndex: 1001
        }}>
          <h2 style={{ 
            fontSize: '28px', 
            margin: '0 0 20px 0',
            color: '#9b59b6',
            fontWeight: 'bold'
          }}>
            You can almost breathe again
          </h2>
          <button
            onClick={() => {
              // Navigate to final scene
              const finalSceneButton = document.getElementById('finalScene');
              if (finalSceneButton) {
                finalSceneButton.click();
              } else {
                console.warn('Final scene button not found');
                // Fallback navigation
                window.location.href = '/finalScene';
              }
            }}
            style={{
              padding: '12px 25px',
              backgroundColor: 'rgba(155, 89, 182, 0.7)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '30px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '20px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(155, 89, 182, 0.9)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(155, 89, 182, 0.7)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Start Repairing Bones
          </button>
        </div>
      )}
      
      {/* Add animation for the message */}
      <style>
        {`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translate(-50%, 20px); }
            100% { opacity: 1; transform: translate(-50%, 0); }
          }
          
          @keyframes pulse {
            0% { opacity: 0.7; }
            50% { opacity: 1; }
            100% { opacity: 0.7; }
          }
          
          @keyframes fadeInScale {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}
      </style>
    </div>
  );
}

export default NewScene5; 