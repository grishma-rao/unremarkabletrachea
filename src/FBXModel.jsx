import React, { useRef, useEffect } from 'react';
import { useFBX } from '@react-three/drei';

function FBXModel({ path, position = [0, 0, 0], scale = 1, rotation = [0, 0, 0] }) {
  const fbx = useFBX(path);
  const modelRef = useRef();
  
  // Process the model when it's loaded
  useEffect(() => {
    if (modelRef.current) {
      console.log(`FBX model loaded: ${path}`);
      
      // Process all meshes in the model
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

export default FBXModel; 