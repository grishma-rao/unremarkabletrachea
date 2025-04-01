import React, { useEffect, useState, useRef } from 'react';
import './styles.css';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useFBX, OrbitControls, Text } from '@react-three/drei';

// Green glowing portal component
function VibeVersePortal() {
  const portalRef = useRef();
  const ringRef = useRef();
  const textRef = useRef();
  const [playerNear, setPlayerNear] = useState(false);
  const [portalHovered, setPortalHovered] = useState(false);
  
  // Handle portal click/enter
  const handlePortalEnter = () => {
    const username = "unremarkabletrachea_player"; // Could be made dynamic
    const color = "gold"; // Using our gold theme
    const speed = "3"; // Average speed
    const ref = window.location.href; // Current game URL
    
    // Construct portal URL with parameters
    const portalUrl = `http://portal.pieter.com/?username=${username}&color=${color}&speed=${speed}&ref=${encodeURIComponent(ref)}`;
    
    // Redirect to the portal
    window.location.href = portalUrl;
  };
  
  // Portal glow effect
  useFrame(({ clock }) => {
    if (portalRef.current) {
      // Pulsing glow effect
      const t = clock.getElapsedTime();
      const intensity = 1 + Math.sin(t * 2) * 0.3;
      
      // Update portal material emissive intensity
      if (portalRef.current.material) {
        portalRef.current.material.emissiveIntensity = intensity * (portalHovered ? 1.5 : 1);
      }
      
      // Rotate the ring
      if (ringRef.current) {
        ringRef.current.rotation.z += 0.01;
      }
      
      // Animate the text
      if (textRef.current) {
        textRef.current.position.y = 1.8 + Math.sin(t * 1.5) * 0.1;
      }
    }
  });
  
  return (
    <group position={[6, 0, 0]}>
      {/* Portal disc */}
      <mesh 
        ref={portalRef}
        rotation={[0, -Math.PI / 2, 0]}
        onClick={handlePortalEnter}
        onPointerOver={() => setPortalHovered(true)}
        onPointerOut={() => setPortalHovered(false)}
      >
        <circleGeometry args={[1.5, 32]} />
        <meshStandardMaterial 
          color="#003300"
          emissive="#00ff00"
          emissiveIntensity={1}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* Outer ring */}
      <mesh ref={ringRef} rotation={[0, -Math.PI / 2, 0]}>
        <torusGeometry args={[1.5, 0.2, 16, 100]} />
        <meshStandardMaterial 
          color="#004400"
          emissive="#00ff00"
          emissiveIntensity={1.2}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      
      {/* Portal label */}
      <group ref={textRef} position={[0, 1.8, 0]}>
        <Text
          position={[0, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#00ff00"
        >
          Vibeverse Portal
        </Text>
      </group>
      
      {/* Portal particles */}
      <PortalParticles />
    </group>
  );
}

// Portal particles effect
function PortalParticles() {
  const { scene } = useThree();
  const particlesRef = useRef();
  
  useEffect(() => {
    const particleCount = 200;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Create particles around the portal
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 0.7;
      
      positions[i * 3] = 0; // x (depth into portal)
      positions[i * 3 + 1] = Math.sin(angle) * radius; // y
      positions[i * 3 + 2] = Math.cos(angle) * radius; // z
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Green particle material with glow
    const material = new THREE.PointsMaterial({
      color: 0x00ff00,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    // Create points system
    const particleSystem = new THREE.Points(particles, material);
    particlesRef.current = particleSystem;
    scene.add(particleSystem);
    
    return () => {
      scene.remove(particleSystem);
    };
  }, [scene]);
  
  // Animate particles
  useFrame(({ clock }) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      const time = clock.getElapsedTime();
      
      for (let i = 0; i < positions.length; i += 3) {
        // Swirl particles around the portal
        const i3 = i / 3;
        const angle = time * 0.5 + i3 * 0.01;
        const radius = 1.5 + Math.sin(time * 0.7 + i3 * 0.1) * 0.3;
        
        // Move particles slightly in and out of the portal (x-axis)
        positions[i] = Math.sin(time * 0.3 + i3 * 0.05) * 0.2;
        
        // Rotate particles around portal
        positions[i + 1] = Math.sin(angle) * radius;
        positions[i + 2] = Math.cos(angle) * radius;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return null;
}

// Static Character component
function StaticCharacter({ isRibsScene }) {
  const characterRef = useRef();
  const fbx = useFBX('/models/character.fbx');
  const [loaded, setLoaded] = useState(false);

  // Position the character based on the scene state
  const position = isRibsScene ? [0, -1, 3] : [0, -1, 1]; 

  useEffect(() => {
    if (fbx) {
      setLoaded(true);
      // Set up character model
      characterRef.current = fbx;
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [fbx]);

  return (
    <primitive 
      object={fbx} 
      position={position} 
      scale={0.007} 
      rotation={[0, Math.PI, 0]}
    />
  );
}

// Bone repair animation component
function BoneRepairAnimation({ onAnimationComplete }) {
  const ribsRef = useRef();
  const mixerRef = useRef();
  const fbx = useFBX('/models/flying_ribs.fbx');
  const [loaded, setLoaded] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    if (fbx) {
      setLoaded(true);
      // Set up ribs model
      ribsRef.current = fbx;
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Apply glowing effect to bones
          child.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffa500,
            emissiveIntensity: 0.5,
            metalness: 0.2,
            roughness: 0.3
          });
        }
      });

      // Set up animation mixer
      const mixer = new THREE.AnimationMixer(fbx);
      mixerRef.current = mixer;
      
      // Start animation after 2 seconds
      const timer = setTimeout(() => {
        console.log("Starting reverse animation after 2-second delay");
        setAnimationStarted(true);
        
        if (fbx.animations.length > 0) {
          // Get the animation clip
          const clip = fbx.animations[0];
          
          // Create action and set it to play in reverse
          const action = mixer.clipAction(clip);
          action.timeScale = -1; // Play in reverse
          action.clampWhenFinished = true;
          action.setLoop(THREE.LoopOnce);
          
          // Set time to end of animation so it plays from end to beginning
          action.time = clip.duration;
          action.play();
          
          // Listen for animation completion
          const onFinished = (e) => {
            if (e.action === action) {
              console.log("Reverse animation completed");
              if (onAnimationComplete) {
                onAnimationComplete();
              }
              mixer.removeEventListener('finished', onFinished);
            }
          };
          
          mixer.addEventListener('finished', onFinished);
        } else {
          console.warn("No animations found in flying_ribs.fbx");
          // Call completion after a delay even if no animation found
          setTimeout(onAnimationComplete, 3000);
        }
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        if (mixerRef.current) {
          mixerRef.current.stopAllAction();
        }
      };
    }
  }, [fbx, onAnimationComplete]);

  // Update animation on each frame
  useFrame((state, delta) => {
    if (mixerRef.current && animationStarted) {
      mixerRef.current.update(delta);
    }
  });

  return (
    <primitive 
      object={fbx} 
      position={[0, -1, 0]} 
      scale={0.6} 
      rotation={[-Math.PI/2, Math.PI * 2, 0]}
    />
  );
}

// Healing particles effect
function HealingParticles() {
  const { scene } = useThree();
  const particlesRef = useRef();
  
  useEffect(() => {
    // Create particle system
    const particleCount = 1000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Create particles in a sphere around the character/ribs
      const radius = 2 + Math.random() * 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) - 1; // centered at y = -1
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Particle material with glow effect - changed to gold
    const material = new THREE.PointsMaterial({
      color: 0xffd700, // Gold color
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    // Create points system
    const particleSystem = new THREE.Points(particles, material);
    particlesRef.current = particleSystem;
    scene.add(particleSystem);
    
    return () => {
      scene.remove(particleSystem);
    };
  }, [scene]);
  
  // Animate particles
  useFrame(({ clock }) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      const time = clock.getElapsedTime();
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        
        // Spiral motion
        const angle = time * 0.5 + i * 0.01;
        positions[i] = x * Math.cos(angle * 0.1) - z * Math.sin(angle * 0.1);
        positions[i + 2] = x * Math.sin(angle * 0.1) + z * Math.cos(angle * 0.1);
        
        // Pulsing movement
        positions[i + 1] = y + Math.sin(time + i * 0.1) * 0.05;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return null;
}

// Main scene component
function FinalScene() {
  const [isRibsScene, setIsRibsScene] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [message, setMessage] = useState('');
  const cameraPositionRef = useRef([0, 0, 7]);
  const cameraFovRef = useRef(60);
  
  // Check if coming from a portal
  useEffect(() => {
    // Check URL for portal=true parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('portal') === 'true') {
      // User came through a portal, start repairs immediately
      startRepair();
    }
  }, []);
  
  // Start the bone repair sequence
  const startRepair = () => {
    setShowStartButton(false);
    setIsRibsScene(true);
    setMessage('Repairing bones...');
    // Widen the view by increasing FOV and adjusting camera position
    cameraFovRef.current = 75;
    cameraPositionRef.current = [0, 0, 10];
  };
  
  // Handle animation completion
  const handleAnimationComplete = () => {
    setMessage('Bone repair complete! Your bones are shining like gold.');
    setShowCompletionMessage(true);
  };
  
  // Reset the game
  const resetGame = () => {
    // Navigate to the first scene
    const firstSceneButton = document.getElementById('scene1');
    if (firstSceneButton) {
      firstSceneButton.click();
    } else {
      console.warn('Scene 1 button not found');
      // Fallback navigation
      window.location.href = '/';
    }
  };

  // Camera controller to update camera settings when scene changes
  function CameraController() {
    const { camera } = useThree();
    
    useEffect(() => {
      camera.position.set(...cameraPositionRef.current);
      camera.fov = cameraFovRef.current;
      camera.updateProjectionMatrix();
    }, [camera, isRibsScene]);
    
    return null;
  }
  
  return (
    <div className="scene-container">
      <Canvas
        camera={{ position: cameraPositionRef.current, fov: cameraFovRef.current }}
        shadows
      >
        {/* Camera controller */}
        <CameraController />
        
        {/* Scene lighting */}
        <ambientLight intensity={2} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={10} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
        />
        <pointLight position={[0, 0, 3]} intensity={50} color="#ffd700" />
        <pointLight position={[6, 0, 0]} intensity={5} color="#00ff00" />
        
        {/* Characters and animations */}
        <StaticCharacter isRibsScene={isRibsScene} />
        {isRibsScene && (
          <>
            <BoneRepairAnimation onAnimationComplete={handleAnimationComplete} />
            <HealingParticles />
          </>
        )}
        
        {/* Vibeverse Portal */}
        <VibeVersePortal />
        
        {/* Background and environment */}
        <color attach="background" args={['#000511']} />
        <fog attach="fog" args={['#000511', 5, 15]} />
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={true} 
          enablePan={false}
          minDistance={4}
          maxDistance={15}
          target={[0, -1, 0]}
        />
      </Canvas>
      
      {/* UI Elements */}
      {showStartButton && (
        <div className="centered-button">
          <button 
            className="start-button gold-theme"
            onClick={startRepair}
          >
            Begin Bone Repairs
          </button>
        </div>
      )}
      
      {message && !showCompletionMessage && (
        <div className="message-overlay gold-theme">
          <p>{message}</p>
        </div>
      )}
      
      {showCompletionMessage && (
        <div className="completion-message gold-theme">
          <p style={{ 
            fontSize: '22px', 
            margin: '0 0 25px 0',
            lineHeight: '1.8',
            color: '#ffd700',
            textAlign: 'center'
          }}>
            Your bones are healed.<br />
            A madness appears in the sky.
          </p>
          <button 
            className="return-button gold-theme"
            onClick={resetGame}
          >
            Begin Again
          </button>
        </div>
      )}
      
      {/* Portal instruction overlay */}
      {showCompletionMessage && (
        <div className="portal-instruction">
          <p>Or enter the <span className="green-text">Vibeverse Portal</span> to continue your journey</p>
        </div>
      )}
    </div>
  );
}

export default FinalScene;