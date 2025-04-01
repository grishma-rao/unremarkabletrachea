import React from 'react';
import { Html } from '@react-three/drei';

function LoadingScreen() {
  return (
    <Html center>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '20px',
        borderRadius: '8px',
        fontSize: '2rem'
      }}>
        Loading 3D Models...
      </div>
    </Html>
  );
}

export default LoadingScreen; 