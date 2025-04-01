import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Scene1 from './Scene1';
import Scene2 from './Scene2';
import Scene3 from './Scene3';
import Scene4 from './Scene4';
import Scene5 from './Scene5';

function App() {
  return (
    <Router>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scene1" element={<Scene1 />} />
          <Route path="/scene2" element={<Scene2 />} />
          <Route path="/scene3" element={<Scene3 />} />
          <Route path="/scene4" element={<Scene4 />} />
          <Route path="/scene5" element={<Scene5 />} />
        </Routes>
      </div>
    </Router>
  );
}

// Home component with navigation links
function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%',
      gap: '20px',
      padding: '20px'
    }}>
      <h1>Scene Navigation</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link to="/scene1" style={linkStyle}>Scene 1</Link>
        <Link to="/scene2" style={linkStyle}>Scene 2</Link>
        <Link to="/scene3" style={linkStyle}>Scene 3</Link>
        <Link to="/scene4" style={linkStyle}>Scene 4</Link>
        <Link to="/scene5" style={linkStyle}>Scene 5 - Bone Collection Game</Link>
      </div>
    </div>
  );
}

// Style for links to make them more visible
const linkStyle = {
  padding: '10px 20px',
  background: '#333',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '5px',
  textAlign: 'center'
};

export default App; 