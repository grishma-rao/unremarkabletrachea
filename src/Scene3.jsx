import React, { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Html, useFBX } from '@react-three/drei';
import { KeyboardControlsWrapper } from './KeyboardControls';
import CharacterController from './CharacterController';
import LoadingScreen from './LoadingScreen';
import * as THREE from 'three';

// Undulating Ground component
function UndulatingGround() {
  const meshRef = useRef();
  const geometryRef = useRef();
  
  // Create the ground geometry with higher resolution for smoother waves
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(50, 50, 64, 64);
    return geo;
  }, []);
  
  // Set up the initial vertex displacement
  useEffect(() => {
    if (geometryRef.current) {
      const positionAttribute = geometryRef.current.attributes.position;
      const vertex = new THREE.Vector3();
      
      // Apply displacement to each vertex
      for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        
        // Create wave pattern using sine functions
        const x = vertex.x;
        const z = vertex.y; // y in buffer is z in world (due to rotation)
        
        // Combine multiple sine waves for more organic feel
        const displacement = 
          Math.sin(x * 0.2) * 0.5 + 
          Math.sin(z * 0.3) * 0.5 + 
          Math.sin(x * 0.1 + z * 0.2) * 0.3;
          
        // Apply displacement to vertex y (will be -y in world space after rotation)
        vertex.z = displacement;
        
        // Write back to buffer
        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      
      positionAttribute.needsUpdate = true;
      geometryRef.current.computeVertexNormals();
    }
  }, []);
  
  // Animate the waves
  useFrame((state) => {
    if (geometryRef.current) {
      const time = state.clock.getElapsedTime() * 0.2;
      const positionAttribute = geometryRef.current.attributes.position;
      const vertex = new THREE.Vector3();
      
      for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        
        const x = vertex.x;
        const z = vertex.y; // y in buffer is z in world (due to rotation)
        
        // Time-based animation of the waves
        const displacement = 
          Math.sin(x * 0.2 + time) * 0.5 + 
          Math.sin(z * 0.3 + time * 0.7) * 0.5 + 
          Math.sin(x * 0.1 + z * 0.2 + time * 0.5) * 0.3;
          
        vertex.z = displacement;
        
        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      
      positionAttribute.needsUpdate = true;
      geometryRef.current.computeVertexNormals();
    }
  });
  
  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -1, 0]} 
      receiveShadow
    >
      <bufferGeometry ref={geometryRef} {...geometry} />
      <meshStandardMaterial 
        color="#303030" 
        wireframe={false} 
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
}

// Improved Starry Background component
function StarryBackground() {
  const starsRef = useRef();
  const stars = useMemo(() => {
    const stars = [];
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 1000;
      const y = (Math.random() - 0.5) * 1000;
      const z = -Math.random() * 1000 - 100; // Push stars backward and ensure they're behind the camera
      const size = Math.random() * 0.3 + 0.1; // Vary star sizes
      const brightness = Math.random() * 0.5 + 0.5; // Vary star brightness
      stars.push({ x, y, z, size, brightness });
    }
    return stars;
  }, []);

  // Stars no longer rotate
  // useFrame(() => {
  //   if (starsRef.current) {
  //     starsRef.current.rotation.y += 0.0002;
  //   }
  // });

  // Use points for more efficient star rendering
  const positions = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    
    for (let i = 0; i < stars.length; i++) {
      const i3 = i * 3;
      positions[i3] = stars[i].x;
      positions[i3 + 1] = stars[i].y;
      positions[i3 + 2] = stars[i].z;
      
      // Add slight color variation
      const brightness = stars[i].brightness;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness;
      
      sizes[i] = stars[i].size;
    }
    
    return { positions, colors, sizes };
  }, [stars]);

  return (
    <group ref={starsRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={stars.length}
            array={positions.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={stars.length}
            array={positions.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.5}
          sizeAttenuation={true}
          vertexColors
          transparent
          alphaTest={0.01}
          fog={false}
        />
      </points>
    </group>
  );
}

// Text animation component
function AnimatedText({ startAnimation }) {
  const [textIndex, setTextIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const textRef = useRef();
  
  const textLines = [
    "A strong feeling is pulling you now into the light",
    "Like feral creatures dragging you forward",
    "Acknowledge that",
    "Something has broken here"
  ];
  
  useEffect(() => {
    if (startAnimation) {
      setVisible(true);
      
      // Animate through text lines
      const interval = setInterval(() => {
        setTextIndex(prev => {
          if (prev < textLines.length - 1) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 4000); // Show each line for 4 seconds
      
      return () => clearInterval(interval);
    }
  }, [startAnimation]);
  
  useFrame(() => {
    if (textRef.current && visible) {
      // Subtle floating animation
      textRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.05 + 2;
    }
  });
  
  if (!visible) return null;
  
  return (
    <group ref={textRef} position={[0, 2, 0]}>
      <Text
        color="white"
        fontSize={0.3}
        maxWidth={5}
        lineHeight={1.5}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
      >
        {textLines[textIndex]}
      </Text>
    </group>
  );
}

// Character model component that appears after landing
function StaticCharacter({ isRibsScene }) {
  const fbx = useFBX('/models/character.fbx');
  const characterRef = useRef();
  
  // Position the character closer to camera in ribs scene
  const characterPosition = isRibsScene ? [0, 0, 6] : [0, 0, 0];
  
  // Adjust character rotation based on scene
  const characterRotation = isRibsScene ? [0, 0, 0] : [0, Math.PI, 0];
  
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, []);

  return (
    <group position={characterPosition}>
      {/* Pink glow effect */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial 
          color="#ff66cc"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#ff66cc"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Character model */}
      <primitive 
        ref={characterRef}
        object={fbx} 
        scale={0.01}
        position={[0, 0, 0]}
        rotation={characterRotation}
      />
    </group>
  );
}

// Placeholder for capsule landing animation
function CapsuleLanding({ onAnimationComplete }) {
  const capsuleRef = useRef();
  const [animationStarted, setAnimationStarted] = useState(false);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  
  useEffect(() => {
    // Start animation after a delay
    const timer = setTimeout(() => {
      setAnimationStarted(true);
      
      // Notify parent when animation completes
      const completionTimer = setTimeout(() => {
        setAnimationCompleted(true);
        onAnimationComplete();
      }, 5000); // Animation duration
      
      return () => clearTimeout(completionTimer);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);
  
  useFrame(() => {
    if (capsuleRef.current && animationStarted && !animationCompleted) {
      // Simple placeholder animation
      // Replace this with your actual FBX animation when ready
      if (capsuleRef.current.position.y > 0) {
        capsuleRef.current.position.y -= 0.05;
      }
    }
  });
  
  return (
    <mesh ref={capsuleRef} position={[0, 10, 0]}>
      <capsuleGeometry args={[1, 2, 4, 8]} />
      <meshStandardMaterial color="silver" />
    </mesh>
  );
}

// Ribs Model component with simplified animation handling
function RibsModel({ onAnimationComplete }) {
  // Force the FBX to reload if it's not animating correctly
  const fbx = useFBX('/models/flying_ribs.fbx', true);
  const modelRef = useRef();
  const [startAnimation, setStartAnimation] = useState(false);
  const mixerRef = useRef();
  
  // Update animation mixer each frame
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });
  
  useEffect(() => {
    if (modelRef.current) {
      console.log('Ribs FBX model loaded');
      
      // Set up model properties
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Create animation mixer
      mixerRef.current = new THREE.AnimationMixer(modelRef.current);
      
      // Wait 2 seconds before playing the animation
      const animationStartTimer = setTimeout(() => {
        console.log('Starting animation after 2-second delay');
        setStartAnimation(true);
        
        if (fbx.animations && fbx.animations.length > 0) {
          try {
            const clip = fbx.animations[0];
            
            // Create and play the animation action
            const action = mixerRef.current.clipAction(clip);
            action.reset();
            action.setLoop(THREE.LoopOnce); // Set to play only once
            action.clampWhenFinished = true; // Keep final pose when finished
            action.play();
            
            // Listen for animation completion
            const onFinished = (e) => {
              if (e.action === action) {
                console.log('Animation complete, starting zoom-out');
                onAnimationComplete();
                mixerRef.current.removeEventListener('finished', onFinished);
              }
            };
            
            mixerRef.current.addEventListener('finished', onFinished);
            
            // As a fallback, still use a timer to ensure completion
            const completeTimer = setTimeout(() => {
              console.log('Animation completion timeout reached, starting zoom-out');
              onAnimationComplete();
            }, 8000); // Allow more time for full animation to complete
            
            return () => {
              clearTimeout(completeTimer);
              if (mixerRef.current) {
                mixerRef.current.removeEventListener('finished', onFinished);
              }
            };
          } catch (error) {
            console.error('Error playing animation:', error);
            // Even if animation fails, trigger completion after a delay
            const fallbackTimer = setTimeout(() => {
              onAnimationComplete();
            }, 5000);
            return () => clearTimeout(fallbackTimer);
          }
        } else {
          console.log('No animations found, using static display');
          // Even with no animations, trigger completion after a delay
          const noAnimTimer = setTimeout(() => {
            onAnimationComplete();
          }, 5000);
          return () => clearTimeout(noAnimTimer);
        }
      }, 2000);

      return () => {
        clearTimeout(animationStartTimer);
        if (mixerRef.current) {
          mixerRef.current.stopAllAction();
        }
      };
    }
  }, [fbx, onAnimationComplete]);
  
  return (
    <primitive 
      ref={modelRef}
      object={fbx} 
      position={[0, 0.1, 0]}
      scale={0.6}
      rotation={[-Math.PI/2, Math.PI * 2, 0]}
    />
  );
}

// Skip Intro Button component
function SkipIntroButton({ onClick }) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999
    }}>
      <button
        onClick={onClick}
        style={{
          padding: '10px 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          border: '1px solid white',
          borderRadius: '5px',
          cursor: 'pointer',
          fontFamily: 'Arial',
          fontSize: '14px',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          e.currentTarget.style.borderColor = '#ffffff';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          e.currentTarget.style.borderColor = 'white';
        }}
      >
        Skip Intro
      </button>
    </div>
  );
}

// Next Scene Button component with glow effect
function NextSceneButton({ onClick }) {
  const [hover, setHover] = useState(false);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      // Glow effect
      boxShadow: hover 
        ? '0 0 25px 10px rgba(255, 105, 180, 0.7), 0 0 10px 2px rgba(255, 255, 255, 0.9)' 
        : '0 0 15px 5px rgba(255, 105, 180, 0.5), 0 0 5px 1px rgba(255, 255, 255, 0.7)',
      borderRadius: '30px',
      transition: 'all 0.3s ease'
    }}>
      <button
        onClick={onClick}
        onMouseOver={() => setHover(true)}
        onMouseOut={() => setHover(false)}
        style={{
          padding: '12px 30px',
          backgroundColor: hover ? 'rgba(255, 105, 180, 0.9)' : 'rgba(255, 105, 180, 0.7)',
          color: 'white',
          border: hover ? '2px solid white' : '1px solid rgba(255, 255, 255, 0.7)',
          borderRadius: '30px',
          cursor: 'pointer',
          fontFamily: 'Arial',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          transform: hover ? 'scale(1.05)' : 'scale(1)',
          textShadow: '0 0 5px white'
        }}
      >
        Can you repair the damage?
      </button>
    </div>
  );
}

// Main Scene4 component with camera controller for zoom effect
function Scene4() {
  const [sceneState, setSceneState] = useState('capsule-landing');
  const [showNextButton, setShowNextButton] = useState(false);
  const [zoomingOut, setZoomingOut] = useState(false);
  const [characterVisible, setCharacterVisible] = useState(false);
  
  const handleCapsuleAnimationComplete = () => {
    // Show character first, then start text animation
    setCharacterVisible(true);
    setSceneState('text-animation');
    
    // Transition to ribs animation after text
    setTimeout(() => {
      setSceneState('ribs-animation');
    }, 16000); // 4 seconds per line of text
  };

  const handleSkipIntro = () => {
    setCharacterVisible(true);
    setSceneState('ribs-animation');
  };
  
  const handleAnimationComplete = () => {
    console.log('Animation complete, starting zoom-out');
    setZoomingOut(true);
    
    // Show button after zoom completes
    setTimeout(() => {
      console.log('Zoom-out complete, showing next button');
      setShowNextButton(true);
    }, 2000); // Show button after 2 seconds of zoom
  };
  
  const handleNextScene = () => {
    // Navigate to Scene 4 (as per your App.js)
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
      console.error('Error navigating to next scene:', e);
      // Emergency fallback
      window.location.hash = 'scene4';
    }
  };
  
  // Camera zoom effect controller
  const CameraController = () => {
    const { camera } = useThree();
    
    // Handle zoom out effect
    useFrame(() => {
      if (zoomingOut && camera) {
        // Dramatically pull camera back
        if (camera.position.z < 30) {
          camera.position.z += 0.7;
          camera.position.y += 0.3;
        }
      }
    });
    
    return null;
  };
  
  return (
    <KeyboardControlsWrapper>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        {/* Skip Intro Button */}
        {sceneState === 'text-animation' && (
          <SkipIntroButton onClick={handleSkipIntro} />
        )}
        
        {/* Next Scene Button (appears after zoom) */}
        {showNextButton && (
          <NextSceneButton onClick={handleNextScene} />
        )}
        
        <Canvas 
          camera={{ position: [0, 5, 10], fov: 60 }}
          shadows
        >
          {/* Camera controller for zoom effect */}
          <CameraController />
          
          {/* Clear background to make stars more visible */}
          <color attach="background" args={['#000000']} />
          
          {/* Starry Background - ensure it's outside Suspense for immediate visibility */}
          <StarryBackground />

          {/* Scene content */}
          <Suspense fallback={<LoadingScreen />}>
            {/* Undulating Ground */}
            <UndulatingGround />
            
            {/* Capsule landing animation */}
            {sceneState === 'capsule-landing' && (
              <CapsuleLanding onAnimationComplete={handleCapsuleAnimationComplete} />
            )}
            
            {/* Show character after capsule lands and keep visible during text and ribs animations */}
            {characterVisible && sceneState !== 'capsule-landing' && (
              <StaticCharacter isRibsScene={sceneState === 'ribs-animation'} />
            )}
            
            {/* Text animation */}
            <AnimatedText startAnimation={sceneState === 'text-animation' || sceneState === 'ribs-animation'} />
            
            {/* Ribs animation */}
            {sceneState === 'ribs-animation' && (
              <RibsModel onAnimationComplete={handleAnimationComplete} />
            )}
          </Suspense>

          {/* Lighting - reduced intensity for better star visibility */}
          <ambientLight intensity={0.3} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={0.8} 
            castShadow 
          />
          
          {/* Environment lighting */}
          <Environment preset="night" />
          
          {/* Camera controls - disabled during zoom effect */}
          <OrbitControls enabled={sceneState === 'ribs-animation' && !zoomingOut} />
        </Canvas>
      </div>
    </KeyboardControlsWrapper>
  );
}

export default Scene4;