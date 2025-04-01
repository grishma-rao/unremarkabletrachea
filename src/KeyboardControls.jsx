import { KeyboardControls } from '@react-three/drei';
import React from 'react';

// Define controls map
export const controls = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
  jump: 'jump',
};

// Keyboard Controls wrapper component
export function KeyboardControlsWrapper({ children }) {
  return (
    <KeyboardControls
      map={[
        { name: controls.forward, keys: ['ArrowUp', 'w', 'W'] },
        { name: controls.backward, keys: ['ArrowDown', 's', 'S'] },
        { name: controls.left, keys: ['ArrowLeft', 'a', 'A'] },
        { name: controls.right, keys: ['ArrowRight', 'd', 'D'] },
        { name: controls.jump, keys: ['Space'] },
      ]}
    >
      {children}
    </KeyboardControls>
  );
} 