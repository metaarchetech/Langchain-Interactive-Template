import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * ThreeBackground Component
 * 
 * 3D audio-reactive sphere with gradient colors using Three.js
 * - Noise-distorted sphere with customizable gradient colors
 * - Audio-reactive animations that respond to sound
 * - Mouse interaction: middle button drag to rotate with damping, scroll to zoom
 * - Smooth damping effect for natural rotation feel
 * - Pauses when window loses focus (performance optimization)
 * - Gracefully degrades if WebGL is not supported
 * 
 * Future expansion: Can be refactored to support multiple scenes
 * by extracting sphere logic to three/scenes/
 */
function ThreeBackground({ 
  audioIntensity = 0,
  colorTop = { r: 102, g: 153, b: 255 },
  colorBottom = { r: 255, g: 51, b: 153 },
  shapeParams = {
    noiseScale: 0.3,
    baseStrength: 4.0,
    audioBoost: 19,
    animSpeed: 0.01
  },
  displayMode = 'mesh' // 'mesh' or 'particles'
}) {
  // ===== 1. State & Refs =====
  const mountRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const audioIntensityRef = useRef(0);
  const shapeParamsRef = useRef(shapeParams);
  const colorTopRef = useRef(colorTop);
  const colorBottomRef = useRef(colorBottom);
  
  // Store refs for cleanup
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const animationIdRef = useRef(null);
  const isPausedRef = useRef(false);
  
  // Mouse interaction refs
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const sphereRotationRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0 }); // For damping effect

  // Update refs when props change
  useEffect(() => {
    audioIntensityRef.current = audioIntensity;
  }, [audioIntensity]);

  useEffect(() => {
    shapeParamsRef.current = shapeParams;
  }, [shapeParams]);

  useEffect(() => {
    colorTopRef.current = colorTop;
    colorBottomRef.current = colorBottom;
    
    // Update vertex colors when colors change
    if (particlesRef.current && particlesRef.current.geometry) {
      const geometry = particlesRef.current.geometry;
      const positionAttribute = geometry.attributes.position;
      const colors = [];
      
      for (let i = 0; i < positionAttribute.count; i++) {
        const y = positionAttribute.getY(i);
        const normalizedY = (y / 25 + 1) / 2;
        
        const r = (colorBottom.r + (colorTop.r - colorBottom.r) * normalizedY) / 255;
        const g = (colorBottom.g + (colorTop.g - colorBottom.g) * normalizedY) / 255;
        const b = (colorBottom.b + (colorTop.b - colorBottom.b) * normalizedY) / 255;
        
        colors.push(r, g, b);
      }
      
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.attributes.color.needsUpdate = true;
    }
  }, [colorTop, colorBottom]);

  useEffect(() => {
    console.log('ThreeBackground mounting...');
    
    // ===== 2. WebGL Support Detection =====
    const checkWebGLSupport = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
      } catch (e) {
        return false;
      }
    };

    if (!checkWebGLSupport()) {
      console.warn('WebGL not supported, falling back to solid background');
      setHasWebGL(false);
      return;
    }
    
    // Clear mount point
    if (mountRef.current) {
      mountRef.current.innerHTML = '';
    }

    // ===== 3. Scene Initialization =====
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    camera.position.z = 100;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true // Transparent background
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // Attach renderer to DOM
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // ===== Lighting Setup =====
    // Main directional light (key light) - neutral white
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.5);
    keyLight.position.set(40, 60, 40);
    scene.add(keyLight);

    // Fill light (warm white from top)
    const fillLight = new THREE.DirectionalLight(0xfff8f0, 2.5);
    fillLight.position.set(-40, 40, -30);
    scene.add(fillLight);

    // Rim light (neutral white from bottom)
    const rimLight = new THREE.DirectionalLight(0xffffff, 3.0);
    rimLight.position.set(0, -40, -60);
    scene.add(rimLight);

    // Ambient light (neutral warm ambient)
    const ambientLight = new THREE.AmbientLight(0xfff8f5, 2.0);
    scene.add(ambientLight);
    
    // Add point light (warm glow)
    const pointLight = new THREE.PointLight(0xfffaf0, 3.5, 100);
    pointLight.position.set(0, 0, 50);
    scene.add(pointLight);

    // ===== 4. Create Noise-Distorted Sphere with Gradient Material =====
    // Create sphere with high detail for smooth surface
    const sphereGeometry = new THREE.SphereGeometry(25, 64, 64);
    
    let sphere;
    
    if (displayMode === 'particles') {
      // === PARTICLES MODE ===
      const sphereMaterial = new THREE.PointsMaterial({
        size: 0.4, // Particle size
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      
      sphere = new THREE.Points(sphereGeometry, sphereMaterial);
    } else {
      // === MESH MODE (Default) ===
      // Use MeshStandardMaterial for realistic matte surface
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0xaa88ff, // Base purple-pink
        metalness: 0.0,
        roughness: 0.8, // Very matte surface
        transparent: true,
        opacity: 0.85, // Less transparent, more solid
        emissive: 0x4433aa, // Subtle inner glow
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide,
        vertexColors: true // Enable vertex colors
      });
      
      sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    }
    
    // Add gradient effect with vertex colors
    const colors = [];
    const positionAttribute = sphereGeometry.attributes.position;
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const y = positionAttribute.getY(i);
      const normalizedY = (y / 25 + 1) / 2; // Normalize to 0-1
      
      // Blue (top) to Pink (bottom) gradient - more vibrant
      const r = (colorBottomRef.current.r + (colorTopRef.current.r - colorBottomRef.current.r) * normalizedY) / 255;
      const g = (colorBottomRef.current.g + (colorTopRef.current.g - colorBottomRef.current.g) * normalizedY) / 255;
      const b = (colorBottomRef.current.b + (colorTopRef.current.b - colorBottomRef.current.b) * normalizedY) / 255;
      
      colors.push(r, g, b);
    }
    
    sphereGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Store original positions for noise calculation
    const originalPositions = new Float32Array(positionAttribute.count * 3);
    for (let i = 0; i < positionAttribute.count; i++) {
      originalPositions[i * 3] = positionAttribute.getX(i);
      originalPositions[i * 3 + 1] = positionAttribute.getY(i);
      originalPositions[i * 3 + 2] = positionAttribute.getZ(i);
    }
    
    // Store in userData for animation access
    sphere.userData.originalPositions = originalPositions;
    sphere.userData.positionAttribute = positionAttribute;
    
    scene.add(sphere);
    particlesRef.current = sphere;

    // ===== 5. Animation Loop with Noise =====
    console.log('Starting animation loop...');
    let time = 0;
    
    // Simple 3D noise function (Perlin-like)
    const noise3D = (x, y, z) => {
      // Simplified noise using sine waves with higher frequency
      return Math.sin(x * 0.8 + time) * 
             Math.cos(y * 0.8 + time * 0.7) * 
             Math.sin(z * 0.8 + time * 0.5);
    };
    
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Dynamic time increment based on audio and params
      const audioSpeedBoost = 1 + (audioIntensityRef.current * 1.5);
      time += shapeParamsRef.current.animSpeed * audioSpeedBoost;
      
      // Apply damping effect to rotation velocity
      const damping = 0.95; // Higher = less friction (0.9-0.98 range)
      
      if (isDraggingRef.current) {
        // When dragging, apply velocity directly
        sphereRotationRef.current.x += rotationVelocityRef.current.x;
        sphereRotationRef.current.y += rotationVelocityRef.current.y;
      } else {
        // When not dragging, apply velocity with damping
        sphereRotationRef.current.x += rotationVelocityRef.current.x;
        sphereRotationRef.current.y += rotationVelocityRef.current.y;
        
        // Reduce velocity over time (damping/friction)
        rotationVelocityRef.current.x *= damping;
        rotationVelocityRef.current.y *= damping;
        
        // Add subtle auto-rotation when velocity is very low
        if (Math.abs(rotationVelocityRef.current.y) < 0.001) {
          rotationVelocityRef.current.y += 0.003;
        }
      }
      
      // Apply rotation to sphere
      sphere.rotation.x = sphereRotationRef.current.x;
      sphere.rotation.y = sphereRotationRef.current.y;
      
      // Apply noise distortion to vertices
      const positionAttribute = sphere.userData.positionAttribute;
      const originalPositions = sphere.userData.originalPositions;
      
      for (let i = 0; i < positionAttribute.count; i++) {
        const i3 = i * 3;
        
        // Get original position
        const x = originalPositions[i3];
        const y = originalPositions[i3 + 1];
        const z = originalPositions[i3 + 2];
        
        // Calculate noise value with configurable frequency
        const scale = shapeParamsRef.current.noiseScale;
        const noiseValue = noise3D(x * scale, y * scale, z * scale);
        
        // Apply noise displacement with configurable parameters
        const baseStrength = shapeParamsRef.current.baseStrength;
        const audioBoost = 1 + (audioIntensityRef.current * shapeParamsRef.current.audioBoost);
        const displacement = noiseValue * baseStrength * audioBoost;
        
        // Calculate direction from center
        const length = Math.sqrt(x * x + y * y + z * z);
        const nx = x / length;
        const ny = y / length;
        const nz = z / length;
        
        // Set new position
        positionAttribute.setXYZ(
          i,
          x + nx * displacement,
          y + ny * displacement,
          z + nz * displacement
        );
      }
      
      // Mark geometry for update
      positionAttribute.needsUpdate = true;
      
      renderer.render(scene, camera);
    };
    
    animate();
    console.log('Animation loop started');

    // ===== 6. Responsive Window Resize =====
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // ===== 7. Pause Animation on Window Blur (Performance) =====
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPausedRef.current = true;
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
      } else {
        isPausedRef.current = false;
        animate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ===== 8. Mouse Interaction =====
    const handleMouseDown = (event) => {
      // Only respond to middle mouse button (scroll wheel button)
      if (event.button !== 1) return;
      
      event.preventDefault();
      isDraggingRef.current = true;
      setIsDragging(true);
      previousMousePositionRef.current = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseMove = (event) => {
      if (!isDraggingRef.current) return;

      const deltaX = event.clientX - previousMousePositionRef.current.x;
      const deltaY = event.clientY - previousMousePositionRef.current.y;

      // Update rotation velocity for smooth damping
      const sensitivity = 0.005;
      rotationVelocityRef.current.x = deltaY * sensitivity;
      rotationVelocityRef.current.y = deltaX * sensitivity;

      previousMousePositionRef.current = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseUp = (event) => {
      // Only respond to middle mouse button
      if (event.button !== 1) return;
      
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    const handleWheel = (event) => {
      event.preventDefault();
      
      // Adjust camera zoom (Z position)
      if (cameraRef.current) {
        const zoomSpeed = 0.05; // Reduced from 0.1 for more subtle zooming
        const newZ = cameraRef.current.position.z + event.deltaY * zoomSpeed;
        
        // Limit zoom range (80 to 120) - Narrower range for subtler effect
        cameraRef.current.position.z = Math.max(80, Math.min(120, newZ));
      }
    };

    // Prevent default middle mouse button behavior (auto-scroll)
    const preventMiddleClick = (event) => {
      if (event.button === 1) {
        event.preventDefault();
        return false;
      }
    };
    
    // Add event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('auxclick', preventMiddleClick); // Prevent middle click default
    window.addEventListener('wheel', handleWheel, { passive: false });

    // ===== 9. Cleanup on Unmount =====
    return () => {
      console.log('ThreeBackground unmounting, cleaning up...');
      
      // Cancel animation FIRST
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }

      // Remove event listeners
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('auxclick', preventMiddleClick);
      window.removeEventListener('wheel', handleWheel);

      // Dispose Three.js resources
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (mountRef.current && rendererRef.current.domElement) {
          try {
            mountRef.current.removeChild(rendererRef.current.domElement);
          } catch (e) {
            console.warn('Could not remove renderer DOM element:', e);
          }
        }
      }

      if (particlesRef.current) {
        if (particlesRef.current.geometry) {
          particlesRef.current.geometry.dispose();
        }
        if (particlesRef.current.material) {
          particlesRef.current.material.dispose();
        }
      }

      // Clear refs
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      particlesRef.current = null;
      
      console.log('Cleanup complete');
    };
  }, [displayMode]);

  // ===== 9. Fallback Render (No WebGL) =====
  if (!hasWebGL) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
          zIndex: 0
        }}
      />
    );
  }

  // ===== 10. Main Render =====
  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    />
  );
}

export default ThreeBackground;

// TODO: Future expansion - Extract sphere logic to three/scenes/NoiseSphere.js
// TODO: Future expansion - Add scene switching capability
// TODO: Future expansion - Add quality settings (vertex density adjustment)

