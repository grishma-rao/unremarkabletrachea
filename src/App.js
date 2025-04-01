import React, { useState } from 'react';
import Scene4_PerspectivePuzzle from './Scene4_Experimental.jsx';
import NewScene5 from './new_scene6.jsx';
import Scene5 from './Scene5.jsx';
import FinalScene from './FinalScene.jsx';

// Import Scene3 if it exists, otherwise use a placeholder
let Scene3;
try {
  Scene3 = require('./Scene3.jsx').default;
} catch (e) {
  Scene3 = () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#1a0011' 
    }}>
      <h1 style={{ color: 'white' }}>Scene3 is not available</h1>
    </div>
  );
}

function App() {
  // Set Scene3 as the default scene
  const [currentScene, setCurrentScene] = useState('scene3');

  // Render the current scene
  const renderScene = () => {
    if (currentScene === 'scene3') {
      return <Scene3 />;
    } else if (currentScene === 'scene5') {
      return <NewScene5 />;
    } else if (currentScene === 'scene5_bones') {
      return <Scene5 />;
    } else if (currentScene === 'scene6') {
      return <NewScene5 />;
    } else if (currentScene === 'finalScene') {
      return <FinalScene />;
    }
    return <Scene4_PerspectivePuzzle />;
  };

  return (
    <div className="App">
      {/* Hidden buttons for programmatic navigation */}
      <div style={{ display: 'none' }}>
        <button
          id="scene1"
          onClick={() => setCurrentScene('scene3')}
        >
          Scene 3
        </button>
        <button
          id="scene4"
          onClick={() => setCurrentScene('scene4')}
        >
          Scene 4
        </button>
        <button
          id="scene5"
          onClick={() => setCurrentScene('scene5_bones')}
        >
          Scene 5
        </button>
        <button
          id="scene6"
          onClick={() => setCurrentScene('scene6')}
        >
          Scene 6
        </button>
        <button
          id="finalScene"
          onClick={() => setCurrentScene('finalScene')}
        >
          Final Scene
        </button>
      </div>
      
      {/* Render the selected scene */}
      {renderScene()}
    </div>
  );
}

export default App;
