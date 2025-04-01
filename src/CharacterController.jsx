import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';

function CharacterController({ modelPath, position = [0, 0, 0], scale = 0.01 }) {
  const group = useRef();
  const { camera } = useThree();
  
  // Load character model
  const model = useFBX(modelPath);
  
  // Set up keyboard controls
  const [subscribeKeys, getKeys] = useKeyboardControls();
  
  // Character state
  const currentVelocity = useRef([0, 0, 0]);
  const isMoving = useRef(false);
  
  // Initialize character
  useEffect(() => {
    if (model) {
      // Set up shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add model to group
      group.current.add(model);
    }
    
    // Log available animations when we add them later
    console.log("Character model loaded. Ready for animations.");
    
    return () => {
      // Clean up
    };
  }, [model]);
  
  // Handle movement
  useFrame((state, delta) => {
    if (!group.current) return;
    
    // Get keyboard input
    const { forward, backward, left, right } = getKeys();
    
    // Calculate movement direction
    const moveX = (right ? 1 : 0) - (left ? 1 : 0);
    const moveZ = (backward ? 1 : 0) - (forward ? 1 : 0);
    
    // Movement speed
    const speed = 2;
    
    // Update velocity with some smoothing
    currentVelocity.current[0] = THREE.MathUtils.lerp(
      currentVelocity.current[0],
      moveX * speed * delta,
      0.15
    );
    
    currentVelocity.current[2] = THREE.MathUtils.lerp(
      currentVelocity.current[2],
      moveZ * speed * delta,
      0.15
    );
    
    // Apply movement
    group.current.position.x += currentVelocity.current[0];
    group.current.position.z += currentVelocity.current[2];
    
    // Rotate character to face movement direction
    if (moveX !== 0 || moveZ !== 0) {
      const angle = Math.atan2(moveX, moveZ);
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        angle,
        0.15
      );
      
      // Track if character is moving
      isMoving.current = true;
    } else {
      isMoving.current = false;
    }
    
    // This is where we'll handle animations later
    // For now, just log the movement state when it changes
    if (isMoving.current) {
      // Will play walk animation
      console.log("Character is moving - would play walk animation");
    } else {
      // Will play idle animation
      console.log("Character is idle - would play idle animation");
    }
    
    // Optional: Make camera follow the character
    // Uncomment this if you want the camera to follow
    /*
    camera.position.x = group.current.position.x;
    camera.position.z = group.current.position.z + 5;
    camera.lookAt(group.current.position);
    */
  });
  
  return <group ref={group} position={position} scale={scale} />;
}

export default CharacterController; 