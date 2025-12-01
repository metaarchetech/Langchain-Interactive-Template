import React from 'react';

/**
 * VisualControls Component
 * 
 * Minimalist control panel for adjusting sphere visual parameters
 * - Dual color gradient (RGB sliders)
 * - 4 shape parameters
 * - Horizontal sliders with clean design
 */
function VisualControls({ 
  colorTop, 
  colorBottom, 
  onColorTopChange, 
  onColorBottomChange,
  shapeParams,
  onShapeParamsChange,
  isVisible,
  onToggle,
  displayMode,
  onDisplayModeChange
}) {
  
  const sliderStyle = {
    flex: 1,
    height: '2px',
    background: 'rgba(255,255,255,0.2)',
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer'
  };
  
  const containerStyle = {
    position: 'absolute',
    top: '75px',
    right: '20px',
    width: '250px',
    background: 'rgba(10, 10, 10, 0.9)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '4px',
    padding: '20px',
    zIndex: 10,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '11px',
    color: 'white',
    transition: 'all 0.3s ease'
  };

  const sectionStyle = {
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px'
  };

  const labelStyle = {
    minWidth: '70px',
    opacity: 0.7,
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    flexShrink: 0
  };

  const valueStyle = {
    minWidth: '30px',
    textAlign: 'right',
    opacity: 0.5,
    fontSize: '9px',
    flexShrink: 0
  };

  const toggleButtonStyle = {
    background: 'transparent',
    border: 'none',
    borderBottom: isVisible ? '1px solid rgba(255,255,255,0.2)' : 'none',
    color: 'white',
    padding: '0 0 10px 0',
    cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '14px',
    transition: 'all 0.2s',
    marginBottom: isVisible ? '15px' : '0',
    width: '100%',
    textAlign: 'left',
    fontWeight: '400'
  };

  const rgbSliderStyle = {
    flex: 1,
    height: '2px',
    background: 'rgba(255,255,255,0.2)',
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer'
  };

  const colorRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px'
  };

  const buttonStyle = (isActive) => ({
    flex: 1,
    padding: '6px 0',
    background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '2px',
    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '10px',
    transition: 'all 0.2s'
  });

  return (
    <div style={containerStyle}>
      <button 
        onClick={onToggle}
        style={toggleButtonStyle}
      >
        Visual Controls
      </button>

      {isVisible && (
        <>
          {/* Display Mode Section */}
          <div style={sectionStyle}>
            <div style={{...labelStyle, marginBottom: '10px'}}>DISPLAY MODE</div>
            <div style={{display: 'flex', gap: '5px'}}>
              <button 
                style={buttonStyle(displayMode === 'mesh')}
                onClick={() => onDisplayModeChange('mesh')}
              >
                SOLID
              </button>
              <button 
                style={buttonStyle(displayMode === 'particles')}
                onClick={() => onDisplayModeChange('particles')}
              >
                PARTICLES
              </button>
            </div>
          </div>

          {/* Color Gradient Section */}
          <div style={sectionStyle}>
            <div style={{...labelStyle, marginBottom: '10px'}}>COLOR GRADIENT</div>
            
            {/* Top Color */}
            <div style={{marginBottom: '10px'}}>
              <div style={{...labelStyle, marginBottom: '5px', opacity: 0.5, fontSize: '9px'}}>Top</div>
              <div style={colorRowStyle}>
                <span style={{minWidth: '12px', fontSize: '9px', opacity: 0.7}}>R</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={colorTop.r}
                  onChange={(e) => onColorTopChange({...colorTop, r: parseInt(e.target.value)})}
                  style={rgbSliderStyle}
                />
                <span style={{minWidth: '28px', textAlign: 'right', fontSize: '9px', opacity: 0.5}}>{colorTop.r}</span>
              </div>
              <div style={colorRowStyle}>
                <span style={{minWidth: '12px', fontSize: '9px', opacity: 0.7}}>G</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={colorTop.g}
                  onChange={(e) => onColorTopChange({...colorTop, g: parseInt(e.target.value)})}
                  style={rgbSliderStyle}
                />
                <span style={{minWidth: '28px', textAlign: 'right', fontSize: '9px', opacity: 0.5}}>{colorTop.g}</span>
              </div>
              <div style={colorRowStyle}>
                <span style={{minWidth: '12px', fontSize: '9px', opacity: 0.7}}>B</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={colorTop.b}
                  onChange={(e) => onColorTopChange({...colorTop, b: parseInt(e.target.value)})}
                  style={rgbSliderStyle}
                />
                <span style={{minWidth: '28px', textAlign: 'right', fontSize: '9px', opacity: 0.5}}>{colorTop.b}</span>
              </div>
              <div style={{
                width: '100%',
                height: '15px',
                background: `rgb(${colorTop.r}, ${colorTop.g}, ${colorTop.b})`,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '2px',
                marginTop: '5px'
              }} />
            </div>

            {/* Bottom Color */}
            <div>
              <div style={{...labelStyle, marginBottom: '5px', opacity: 0.5, fontSize: '9px'}}>Bottom</div>
              <div style={colorRowStyle}>
                <span style={{minWidth: '12px', fontSize: '9px', opacity: 0.7}}>R</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={colorBottom.r}
                  onChange={(e) => onColorBottomChange({...colorBottom, r: parseInt(e.target.value)})}
                  style={rgbSliderStyle}
                />
                <span style={{minWidth: '28px', textAlign: 'right', fontSize: '9px', opacity: 0.5}}>{colorBottom.r}</span>
              </div>
              <div style={colorRowStyle}>
                <span style={{minWidth: '12px', fontSize: '9px', opacity: 0.7}}>G</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={colorBottom.g}
                  onChange={(e) => onColorBottomChange({...colorBottom, g: parseInt(e.target.value)})}
                  style={rgbSliderStyle}
                />
                <span style={{minWidth: '28px', textAlign: 'right', fontSize: '9px', opacity: 0.5}}>{colorBottom.g}</span>
              </div>
              <div style={colorRowStyle}>
                <span style={{minWidth: '12px', fontSize: '9px', opacity: 0.7}}>B</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={colorBottom.b}
                  onChange={(e) => onColorBottomChange({...colorBottom, b: parseInt(e.target.value)})}
                  style={rgbSliderStyle}
                />
                <span style={{minWidth: '28px', textAlign: 'right', fontSize: '9px', opacity: 0.5}}>{colorBottom.b}</span>
              </div>
              <div style={{
                width: '100%',
                height: '15px',
                background: `rgb(${colorBottom.r}, ${colorBottom.g}, ${colorBottom.b})`,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '2px',
                marginTop: '5px'
              }} />
            </div>
          </div>

          {/* Shape Parameters Section */}
          <div>
            <div style={{...labelStyle, marginBottom: '10px'}}>SHAPE PARAMETERS</div>
            
            {/* Noise Scale */}
            <div style={rowStyle}>
              <span style={labelStyle}>Noise Scale</span>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.01"
                value={shapeParams.noiseScale}
                onChange={(e) => onShapeParamsChange({...shapeParams, noiseScale: parseFloat(e.target.value)})}
                style={sliderStyle}
              />
              <span style={valueStyle}>{shapeParams.noiseScale.toFixed(2)}</span>
            </div>

            {/* Base Strength */}
            <div style={rowStyle}>
              <span style={labelStyle}>Base Strength</span>
              <input
                type="range"
                min="0"
                max="8"
                step="0.1"
                value={shapeParams.baseStrength}
                onChange={(e) => onShapeParamsChange({...shapeParams, baseStrength: parseFloat(e.target.value)})}
                style={sliderStyle}
              />
              <span style={valueStyle}>{shapeParams.baseStrength.toFixed(1)}</span>
            </div>

            {/* Audio Boost */}
            <div style={rowStyle}>
              <span style={labelStyle}>Audio Boost</span>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={shapeParams.audioBoost}
                onChange={(e) => onShapeParamsChange({...shapeParams, audioBoost: parseInt(e.target.value)})}
                style={sliderStyle}
              />
              <span style={valueStyle}>{shapeParams.audioBoost}x</span>
            </div>

            {/* Animation Speed */}
            <div style={rowStyle}>
              <span style={labelStyle}>Anim Speed</span>
              <input
                type="range"
                min="0.001"
                max="0.05"
                step="0.001"
                value={shapeParams.animSpeed}
                onChange={(e) => onShapeParamsChange({...shapeParams, animSpeed: parseFloat(e.target.value)})}
                style={sliderStyle}
              />
              <span style={valueStyle}>{(shapeParams.animSpeed * 1000).toFixed(0)}</span>
            </div>
          </div>
        </>
      )}

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          cursor: pointer;
          border-radius: 50%;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: white;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
    </div>
  );
}

export default VisualControls;

