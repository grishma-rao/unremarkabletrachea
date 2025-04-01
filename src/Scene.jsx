import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import FBXModel from './FBXModel';
import CharacterController from './CharacterController';
import LoadingScreen from './LoadingScreen';
import { KeyboardControlsWrapper } from './KeyboardControls';

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