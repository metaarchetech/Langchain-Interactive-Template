import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SceneLoader } from '../systems/SceneLoader';
import { TwinManager } from '../systems/TwinManager';

// SINGLETON INSTANCE STORAGE
// 這是為了在 React Strict Mode 下保證絕對唯一性
const SINGLETON = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    twinManager: new TwinManager(),
    objectMap: new Map(),
    requestID: null,
    heartbeatBox: null
};

/**
 * 終極版 AssetPipelineTest (Window Singleton Edition)
 */
export default function AssetPipelineTest() {
    const mountRef = useRef(null);
    const [loadedIds, setLoadedIds] = useState([]);
    const [status, setStatus] = useState('Initializing...');
    const [sceneCount, setSceneCount] = useState(0); 

    const simulateBackendUpdate = () => {
        if (loadedIds.length === 0) return;
        
        const jointIds = ['Robot_Axis_1', 'Robot_Axis_2', 'Robot_Axis_3', 'Robot_Axis_4', 'Robot_Axis_5', 'Robot_Axis_6'];
        
        const availableRobots = jointIds.filter(id => loadedIds.includes(id));
        
        // Randomly decide to move a joint OR toggle gripper (30% chance)
        const isGripperAction = Math.random() < 0.3;
        let targetId, rotation, position, activeColor, defaultColor;

        if (isGripperAction) {
            // Toggle Gripper
            const isOpen = Math.random() > 0.5;
            const clawOffset = isOpen ? 0.35 : 0.15; // Open vs Closed Y-position
            
            // We need to send updates for BOTH claws
            const payloadGripper = {
                timestamp: Date.now(),
                updates: [
                    {
                        id: "Robot_Claw_L",
                        transform: { position: [0.3, clawOffset, 0] }, // Local Y move
                        material: { colorHex: '#ff0000' } // Flash Red for action
                    },
                    {
                        id: "Robot_Claw_R",
                        transform: { position: [0.3, -clawOffset, 0] }, // Local Y move (negative)
                        material: { colorHex: '#ff0000' }
                    }
                ]
            };
            SINGLETON.twinManager.processPayload(payloadGripper);
            setStatus(`Gripper ${isOpen ? 'OPEN' : 'CLOSE'}`);

            // Revert color
            setTimeout(() => {
                SINGLETON.twinManager.processPayload({
                    timestamp: Date.now(),
                    updates: [
                        { id: "Robot_Claw_L", material: { colorHex: '#111111' } }, // Back to Black
                        { id: "Robot_Claw_R", material: { colorHex: '#111111' } }
                    ]
                });
            }, 500);
            return;
        }

        // Standard Joint Move
        targetId = availableRobots.length > 0 
            ? availableRobots[Math.floor(Math.random() * availableRobots.length)]
            : loadedIds[Math.floor(Math.random() * loadedIds.length)];

        if (!targetId) return;
        
        const angle = (Math.random() - 0.5) * Math.PI;
        activeColor = '#00ff00'; 
        defaultColor = '#ffffff';

        rotation = [0, 0, 0];
        if (targetId.includes('Axis_1')) rotation = [0, angle, 0];
        else if (targetId.includes('Axis_4') || targetId.includes('Axis_6')) rotation = [angle, 0, 0];
        else rotation = [0, 0, angle]; 

        // 1. Send Green Flash
        const payloadGreen = {
            timestamp: Date.now(),
            updates: [
                {
                    id: targetId,
                    transform: { rotation: rotation },
                    material: { colorHex: activeColor } 
                }
            ]
        };
        SINGLETON.twinManager.processPayload(payloadGreen);
        setStatus(`Moved ${targetId}`);

        // 2. Revert to White after 500ms
        setTimeout(() => {
            const payloadWhite = {
                timestamp: Date.now(),
                updates: [
                    {
                        id: targetId,
                        // No transform update, just color
                        material: { colorHex: defaultColor } 
                    }
                ]
            };
            SINGLETON.twinManager.processPayload(payloadWhite);
        }, 500);
    };

    useEffect(() => {
        if (!mountRef.current) return;

        // --- INIT SINGLETON IF NOT EXISTS ---
        if (!SINGLETON.renderer) {
            console.log("Creating NEW Singleton Instance...");
            
            const width = mountRef.current.clientWidth || window.innerWidth;
            const height = mountRef.current.clientHeight || window.innerHeight;
            
            // Scene
            SINGLETON.scene = new THREE.Scene();
            SINGLETON.scene.background = new THREE.Color(0x222222);

            // Camera
            SINGLETON.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
            SINGLETON.camera.position.set(8, 8, 12);
            SINGLETON.camera.lookAt(0, 2, 0);

            // Renderer
            SINGLETON.renderer = new THREE.WebGLRenderer({ antialias: true });
            SINGLETON.renderer.setSize(width, height);

            // Controls
            SINGLETON.controls = new OrbitControls(SINGLETON.camera, SINGLETON.renderer.domElement);
            SINGLETON.controls.enableDamping = true;
            SINGLETON.controls.target.set(0, 2, 0);

            // Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Increased intensity for whiter look
            SINGLETON.scene.add(ambientLight);
            const keyLight = new THREE.DirectionalLight(0xffffff, 1.5); // Brighter key light
            keyLight.position.set(5, 10, 7);
            SINGLETON.scene.add(keyLight);
            const rimLight = new THREE.DirectionalLight(0xffffff, 1.0); // White rim light instead of blue
            rimLight.position.set(-5, 5, -5);
            SINGLETON.scene.add(rimLight);
            
            SINGLETON.scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x333333));
            SINGLETON.scene.add(new THREE.AxesHelper(2));

            // [Removed Heartbeat Box]

            // --- ROBOT GENERATION ---
            const sceneGroup = new THREE.Group();
            sceneGroup.name = "Robot_Scene_Local";
            
            // White Industrial Style (Ceramic/Plastic look)
            const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
            const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.1 });

            // Refined Geometry (Slimmer)
            // Base
            const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 0.8, 32), matWhite);
            base.position.y = 0.4; base.name = "Static_Base"; sceneGroup.add(base);
            // Axis 1
            const axis1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 32), matWhite);
            axis1.position.y = 0.6; axis1.name = "Robot_Axis_1"; base.add(axis1);
            // Axis 2 (Shoulder)
            const axis2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.2), matWhite);
            axis2.position.y = 0.8; axis2.name = "Robot_Axis_2"; axis1.add(axis2);
            // Link 2 (Upper Arm) - Slimmer
            const link2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.5, 0.6), matWhite);
            link2.position.y = 2; axis2.add(link2);
            // Axis 3 (Elbow)
            const axis3 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 32), matWhite);
            axis3.rotation.z = Math.PI / 2; axis3.position.y = 2; axis3.name = "Robot_Axis_3"; link2.add(axis3);
            // Link 3 (Forearm)
            const link3 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.5), matWhite);
            link3.position.x = 1.5; axis3.add(link3);
            // Axis 4 (Wrist 1)
            const axis4 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.8, 32), matWhite);
            axis4.rotation.z = -Math.PI / 2; axis4.position.x = 1.5; axis4.name = "Robot_Axis_4"; link3.add(axis4);
            // Axis 5 (Wrist 2)
            const axis5 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), matWhite);
            axis5.position.x = 0.5; axis5.name = "Robot_Axis_5"; axis4.add(axis5);
            // Axis 6 (Flange)
            const axis6 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32), matBlack);
            axis6.rotation.z = Math.PI / 2; axis6.position.x = 0.4; axis6.name = "Robot_Axis_6"; axis5.add(axis6);

            // --- GRIPPER SYSTEM ---
            // Gripper Base (Attached to Axis 6)
            const gripperBase = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), matBlack);
            gripperBase.position.x = 0.1; // Stick out slightly
            // Rotate 90 deg to align with Z-axis (vertical relative to ground when arm is flat)
            // Actually Axis 6 is rotating X locally (flange rotation).
            // Let's just attach it.
            axis6.add(gripperBase);

            // Left Finger
            const clawL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), matBlack);
            clawL.position.set(0.3, 0.15, 0); // Start Closed
            clawL.name = "Robot_Claw_L";
            axis6.add(clawL);

            // Right Finger
            const clawR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), matBlack);
            clawR.position.set(0.3, -0.15, 0); // Start Closed
            clawR.name = "Robot_Claw_R";
            axis6.add(clawR);

            // Build Map
            const localMap = new Map();
            sceneGroup.traverse((child) => {
                if (child.isMesh && child.name && !child.name.startsWith('Static_')) {
                    localMap.set(child.name, child);
                }
            });
            SINGLETON.objectMap = localMap;
            setLoadedIds(Array.from(localMap.keys()));

            sceneGroup.scale.set(0.8, 0.8, 0.8);
            SINGLETON.scene.add(sceneGroup);
            console.log("DEBUG: Added SYNC ROBOT to SINGLETON SCENE.");
        } else {
            console.log("Reusing Existing Singleton Instance.");
            // Restore map state if needed
             setLoadedIds(Array.from(SINGLETON.objectMap.keys()));
        }

        // --- ATTACH TO DOM ---
        // 這是關鍵：每次 Mount 都把同一個 Renderer 的 Canvas 插進去
        mountRef.current.appendChild(SINGLETON.renderer.domElement);

        // --- START LOOP (If not running) ---
        if (!SINGLETON.requestID) {
            const animate = () => {
                SINGLETON.requestID = requestAnimationFrame(animate);
                if (SINGLETON.controls) SINGLETON.controls.update();
                
                if (SINGLETON.scene && SINGLETON.camera && SINGLETON.renderer) {
                    // Heartbeat removed
                    // Twin Update
                    SINGLETON.twinManager.update(SINGLETON.objectMap);
                    // Render
                    SINGLETON.renderer.render(SINGLETON.scene, SINGLETON.camera);
                }
            };
            animate();
            console.log("Animation Loop Started.");
        }

        const debugInterval = setInterval(() => {
            if (SINGLETON.scene) setSceneCount(SINGLETON.scene.children.length);
        }, 500);

        // --- CLEANUP ---
        return () => {
            clearInterval(debugInterval);
            
            // 注意：在 Singleton 模式下，我們不銷毀 Renderer 和 Scene！
            // 我們只把 Canvas 從 DOM 移除，讓下一次 Mount 可以再插回來。
            if (mountRef.current && SINGLETON.renderer) {
                // mountRef.current.innerHTML = ''; // 不要用 innerHTML=''，這樣會把 Canvas 殺掉
                if (mountRef.current.contains(SINGLETON.renderer.domElement)) {
                    mountRef.current.removeChild(SINGLETON.renderer.domElement);
                }
            }
            
            // 也不取消 Loop，讓它在背景繼續跑 (或者你可以暫停它，但保持 Scene 活著)
            // 為了最穩定的體驗，我們這裡讓它繼續跑，這樣切換回來時無縫接軌。
        };
    }, []); 

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', flexDirection: 'row', overflow: 'hidden' }}>
            <div ref={mountRef} style={{ width: 'calc(100vw - 300px)', height: '100vh', background: '#111' }} />
            <div style={{ width: '300px', background: '#222', color: '#fff', padding: '20px', zIndex: 10 }}>
                <h2 style={{ marginTop: 0 }}>Digital Twin Core</h2>
                <div style={{ marginBottom: '10px', color: status.includes('Error') ? '#ff4444' : '#44ff44' }}>
                    Status: {status}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>
                    Scene Objects: {sceneCount}
                </div>
                <button 
                    onClick={simulateBackendUpdate}
                    style={{ width: '100%', padding: '10px', background: '#007acc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Simulate Move
                </button>
                <h3>Object Index</h3>
                <ul style={{ paddingLeft: '20px', fontFamily: 'monospace', fontSize: '12px', color: '#ccc' }}>
                    {loadedIds.map(id => <li key={id}>{id}</li>)}
                </ul>
            </div>
        </div>
    );
}
