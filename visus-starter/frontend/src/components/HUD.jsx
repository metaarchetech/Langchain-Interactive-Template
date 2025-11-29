import React, { useState } from 'react';

const colorMap = { white: '#fff', warm: '#ffcc00', red: '#ff4444', blue: '#4444ff' };

export default function HUD({ systemState, isExpanded, onToggle }) {
  const isLightOn = systemState.light === 'on';
  const displayColor = colorMap[systemState.color] || '#fff';

  const panelStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '250px',
    padding: '20px',
    borderRadius: '4px',
    color: 'white',
    background: 'rgba(10, 10, 10, 0.85)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: 'none',
    transition: 'all 0.3s ease',
    zIndex: 10,
    fontFamily: 'JetBrains Mono, monospace'
  };

  const lightStyle = {
    width: '60px',
    height: '60px',
    borderRadius: '4px',
    margin: '0 auto 10px',
    background: isLightOn ? displayColor : '#1a1a1a',
    boxShadow: isLightOn ? `0 0 20px ${displayColor}` : 'none',
    border: '1px solid rgba(255,255,255,0.2)',
    transition: 'all 0.5s ease'
  };

  const titleStyle = {
    marginTop: 0,
    borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.2)' : 'none',
    paddingBottom: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '400'
  };

  return (
    <div style={panelStyle}>
      <h3 style={titleStyle} onClick={onToggle}>
        Smart Hub
      </h3>
      
      {isExpanded && (
        <>
          {/* Light Section */}
          <div style={{textAlign:'center', margin:'20px 0'}}>
            <div style={lightStyle} />
            <div style={{fontSize:'13px'}}>{isLightOn ? "LIGHT ON" : "LIGHT OFF"}</div>
            <div style={{fontSize:'11px', opacity:0.7}}>{systemState.color.toUpperCase()}</div>
          </div>

          {/* Schedule Section */}
          <div style={{marginTop:'20px', borderTop:'1px solid rgba(255,255,255,0.2)', paddingTop:'10px'}}>
            <h4 style={{margin:'0 0 10px 0', fontSize:'13px'}}>Schedule</h4>
            <ul style={{paddingLeft:'20px', fontSize:'12px', margin:0}}>
              {systemState.schedule.length === 0 ? <li style={{opacity:0.5}}>No events</li> : 
                systemState.schedule.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
