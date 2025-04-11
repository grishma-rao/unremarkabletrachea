import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import FBXModel from './FBXModel';
import CharacterController from './CharacterController';
import LoadingScreen from './LoadingScreen';
import { KeyboardControlsWrapper } from './KeyboardControls';
import { useFBX } from '@react-three/fiber';

function FBXModel({ path, position = [0, 0, 0], scale = 0.01, rotation = [0, 0, 0] }) {
  const fbx = useFBX(path);
  const modelRef = useRef();
  
  useEffect(() => {
    if (modelRef.current) {
      console.log(`FBX model loaded: ${path}`);
      
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

// Trachea Model component
function TracheaFBXModel() {
  const [error, setError] = useState(null);
  const fbx = useFBX('/models/trachea.fbx');
  const modelRef = useRef();
  
  useEffect(() => {
    try {
      if (modelRef.current) {
        console.log('🚀 Attempting to load trachea model...');
        console.log('Model object:', fbx);
        
        modelRef.current.traverse((child) => {
          if (child.isMesh) {
            console.log('Found mesh:', child.name);
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        console.log('✅ Trachea model successfully loaded and configured!');
        console.log('Model details:', {
          position: modelRef.current.position,
          rotation: modelRef.current.rotation,
          scale: modelRef.current.scale,
          children: modelRef.current.children.length
        });
      }
    } catch (err) {
      console.error('❌ Error loading trachea model:', err);
      setError(err.message);
    }
  }, [fbx]);
  
  if (error) {
    console.error('Trachea model error:', error);
    return null;
  }
  
  return (
    <primitive 
      ref={modelRef}
      object={fbx} 
      position={[0, 2, -5]}
      scale={0.01}
      rotation={[0, Math.PI / 2, 0]}
    />
  );
}

function Scene() {
  return (
    <KeyboardControlsWrapper>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas 
          camera={{ position: [0, 5, 10], fov: 60 }}
          shadows
        >
          {/* Basic lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1} 
            castShadow 
          />
          
          {/* 3D content */}
          <Suspense fallback={<LoadingScreen />}>
            {/* Character with movement controls */}
            <CharacterController 
              modelPath="/models/character.fbx"
              position={[0, 0, 0]} 
              scale={0.01}
            />
            
            {/* Other models */}
            <FBXModel 
              path="/models/bg1_plane.fbx" 
              position={[2, 0, 1]} 
              scale={0.02}
            />
            
            {/* Trachea model */}
            <TracheaFBXModel />
            
            {/* Add a grid for reference */}
            <Grid infiniteGrid cellSize={1} cellThickness={0.6} sectionSize={5} />
            
            {/* Environment lighting */}
            <Environment preset="sunset" />
          </Suspense>
          
          {/* Camera controls */}
          <OrbitControls />
        </Canvas>
      </div>
    </KeyboardControlsWrapper>
  );
}

export default Scene; 