import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SceneLoader } from '../systems/SceneLoader';
import { TwinManager } from '../systems/TwinManager';

// SINGLETON INSTANCE STORAGE
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

// --- SHOW MODE ANIMATION (Phantom Industrial Cycle) ---
// Key Poses (Refined based on User Feedback)
const POSE_HOME        = { Robot_Axis_1: 0, Robot_Axis_2: -0.3, Robot_Axis_3: 2.25, Robot_Axis_4: 0, Robot_Axis_5: 1.5, Robot_Axis_6: 0 }; // High Ready
const POSE_PICK_HOVER  = { Robot_Axis_1: Math.PI/4, Robot_Axis_2: 0.0, Robot_Axis_3: 2.0, Robot_Axis_4: 0, Robot_Axis_5: 1.5, Robot_Axis_6: 0 }; 
const POSE_PICK        = { Robot_Axis_1: Math.PI/4, Robot_Axis_2: 1.15, Robot_Axis_3: 2.9, Robot_Axis_4: 0, Robot_Axis_5: 1.5, Robot_Axis_6: 0 }; // Left-Bottom (3,3)
const POSE_PLACE_HOVER = { Robot_Axis_1: 3*Math.PI/4, Robot_Axis_2: 0.0, Robot_Axis_3: 2.0, Robot_Axis_4: 0, Robot_Axis_5: 1.5, Robot_Axis_6: 0 };
const POSE_PLACE       = { Robot_Axis_1: 3*Math.PI/4, Robot_Axis_2: 1.15, Robot_Axis_3: 2.9, Robot_Axis_4: 0, Robot_Axis_5: 1.5, Robot_Axis_6: 0 }; // Left-Top (-3,3)

const SHOW_SEQUENCE = [
    { time: 0, label: "System Idle", targets: POSE_HOME, gripper: "OPEN", action: "RESET_BOX" },
    { time: 1500, label: "Approach Source", targets: POSE_PICK_HOVER, gripper: "OPEN" },
    { time: 3000, label: "Acquiring Target", targets: POSE_PICK, gripper: "OPEN" },
    { time: 4000, label: "Gripping...", targets: POSE_PICK, gripper: "CLOSE", action: "ATTACH_BOX" },
    { time: 5000, label: "Lifting Payload", targets: POSE_PICK_HOVER, gripper: "CLOSE" },
    { time: 6500, label: "Transit to Dest", targets: POSE_PLACE_HOVER, gripper: "CLOSE" },
    { time: 8000, label: "Positioning...", targets: POSE_PLACE, gripper: "CLOSE" },
    { time: 9000, label: "Releasing...", targets: POSE_PLACE, gripper: "OPEN", action: "DETACH_BOX" },
    { time: 10000, label: "Clearance", targets: POSE_PLACE_HOVER, gripper: "OPEN" },
    { time: 11500, label: "Cycle Complete", targets: POSE_HOME, action: "LOOP_SEQUENCE" }
];

// --- Industrial Dashboard Components ---
const AxisGauge = ({ label, value, status }) => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '11px' }}>
        <div style={{ width: '30px', color: '#666' }}>{label}</div>
        <div style={{ flex: 1, background: '#e0e0e0', height: '4px', borderRadius: '2px', margin: '0 8px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '50%', width: '2px', height: '8px', background: '#999', top: '-2px' }} />
            <div style={{ 
                width: `${Math.min(Math.abs(value) / 180 * 50, 50)}%`, 
                height: '100%', 
                background: status === 'moving' ? '#00cc66' : '#666',
                borderRadius: '2px',
                marginLeft: value >= 0 ? '50%' : `calc(50% - ${Math.min(Math.abs(value) / 180 * 50, 50)}%)`,
                transition: 'all 0.1s'
            }} />
        </div>
        <div style={{ width: '40px', textAlign: 'right', fontFamily: 'monospace', color: status === 'moving' ? '#000' : '#999' }}>
            {value.toFixed(1)}°
        </div>
    </div>
);

const ControlSlider = ({ label, value, onChange }) => {
    // Value is -3.14 to 3.14
    // Map to 0-100% for display
    const percentage = Math.min(Math.abs(value) / 3.14 * 50, 50);
    const marginLeft = value >= 0 ? '50%' : `calc(50% - ${percentage}%)`;
    
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '11px', position: 'relative', height: '20px' }}>
            <div style={{ width: '30px', color: '#666' }}>{label}</div>
            
            {/* Visual Track */}
            <div style={{ flex: 1, background: '#e0e0e0', height: '4px', borderRadius: '2px', margin: '0 8px', position: 'relative' }}>
                {/* Center Marker */}
                <div style={{ position: 'absolute', left: '50%', width: '2px', height: '8px', background: '#999', top: '-2px', zIndex: 1 }} />
                {/* Value Bar */}
                <div style={{ 
                    width: `${percentage}%`, 
                    height: '100%', 
                    background: '#00cc66',
                    borderRadius: '2px',
                    marginLeft: marginLeft,
                    transition: 'width 0.05s, margin-left 0.05s',
                    position: 'absolute',
                    top: 0
                }} />
            </div>

            {/* Invisible Input Overlay for Interaction */}
            <input 
                type="range"
                min="-3.14"
                max="3.14"
                step="0.01"
                value={value}
                onChange={onChange}
                style={{
                    position: 'absolute',
                    left: '38px', // Label width + gap
                    right: '40px', // Value width
                    top: 0,
                    bottom: 0,
                    width: 'calc(100% - 78px)',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    margin: 0,
                    zIndex: 2
                }}
            />

            <div style={{ width: '40px', textAlign: 'right', fontFamily: 'monospace', color: '#111' }}>
                {(value * 180 / Math.PI).toFixed(0)}°
            </div>
        </div>
    );
};

const TelemetryPanel = ({ axisData, gripperStatus, systemStatus }) => (
    <div style={{ background: 'rgba(255,255,255,0.4)', padding: '15px', borderRadius: '4px', border: '1px solid #e0e0e0', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <span style={{ fontWeight: 'bold', color: '#111' }}>R-2000iC Status</span>
            <span style={{ 
                color: systemStatus === 'AUTO_CYCLE' ? '#00cc66' : (systemStatus === 'MANUAL' ? '#0088ff' : '#ffaa00'), 
                fontSize: '10px', 
                padding: '2px 6px', 
                border: `1px solid ${systemStatus === 'AUTO_CYCLE' ? '#00cc66' : (systemStatus === 'MANUAL' ? '#0088ff' : '#ffaa00')}`, 
                borderRadius: '2px' 
            }}>
                {systemStatus}
            </span>
        </div>
        <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#999', fontSize: '10px', marginBottom: '5px', textTransform: 'uppercase' }}>Joint Telemetry</div>
            {axisData.map((axis, i) => (
                <AxisGauge key={i} label={`J${i+1}`} value={axis.angle} status={axis.status} />
            ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', border: '1px solid #eee' }}>
                <div style={{ color: '#999', fontSize: '10px' }}>GRIPPER</div>
                <div style={{ color: gripperStatus === 'OPEN' ? '#00cc66' : '#ffaa00', fontWeight: 'bold' }}>
                    {gripperStatus}
                </div>
            </div>
            <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', border: '1px solid #eee' }}>
                <div style={{ color: '#999', fontSize: '10px' }}>LOAD</div>
                <div style={{ color: '#111', fontWeight: 'bold' }}>0%</div>
            </div>
        </div>
    </div>
);

export default function AssetPipelineTest() {
    const mountRef = useRef(null);
    const isPlayingRef = useRef(false);
    const timerRefs = useRef([]); // Store active timers

    const clearAllTimers = () => {
        timerRefs.current.forEach(id => clearTimeout(id));
        timerRefs.current = [];
    };

    const [loadedIds, setLoadedIds] = useState([]);
    const [status, setStatus] = useState('Initializing...');
    const [sceneCount, setSceneCount] = useState(0); 
    
    const [axisData, setAxisData] = useState([
        { angle: 0, status: 'idle' }, { angle: 0, status: 'idle' },
        { angle: 0, status: 'idle' }, { angle: 0, status: 'idle' },
        { angle: 0, status: 'idle' }, { angle: 0, status: 'idle' }
    ]);
    const [gripperStatus, setGripperStatus] = useState('CLOSED');
    const [systemStatus, setSystemStatus] = useState('IDLE');

    // Manual Override State
    const [manualPose, setManualPose] = useState({
        Robot_Axis_1: 0,
        Robot_Axis_2: -0.2,
        Robot_Axis_3: 1.0,
        Robot_Axis_4: 0,
        Robot_Axis_5: 1.5,
        Robot_Axis_6: 0
    });
    const [isManualMode, setIsManualMode] = useState(false);

    const handleManualChange = (axis, value) => {
        // Interrupt Auto Cycle if running
        if (isPlayingRef.current) {
            isPlayingRef.current = false;
            clearAllTimers();
            // setSystemStatus will be updated below to MANUAL
        }

        const val = parseFloat(value);
        const newPose = { ...manualPose, [axis]: val };
        setManualPose(newPose);
        setIsManualMode(true);
        setSystemStatus('MANUAL');

        // Direct drive
        const updates = Object.entries(newPose).map(([id, angle]) => {
            let rotation = [0, 0, 0];
            if (id.includes('Axis_1')) rotation = [0, angle, 0];
            else if (id.includes('Axis_4') || id.includes('Axis_6')) rotation = [angle, 0, 0];
            else rotation = [0, 0, angle]; 
            return { id, transform: { rotation } };
        });
        SINGLETON.twinManager.processPayload({ timestamp: Date.now(), updates });
    };

    const runShowMode = () => {
        if (loadedIds.length === 0) return;
        setIsManualMode(false);
        setSystemStatus('AUTO_CYCLE');
        isPlayingRef.current = true;
        clearAllTimers(); // Safety clear
        
        const playSequence = () => {
            if (isManualMode || !isPlayingRef.current) return;

            SHOW_SEQUENCE.forEach(step => {
                const id = setTimeout(() => {
                    if (!isPlayingRef.current) return;
                    setStatus(step.label);
                    
                    if (step.targets) {
                        const updates = Object.entries(step.targets).map(([id, angle]) => {
                            let rotation = [0, 0, 0];
                            if (id.includes('Axis_1')) rotation = [0, angle, 0];
                            else if (id.includes('Axis_4') || id.includes('Axis_6')) rotation = [angle, 0, 0];
                            else rotation = [0, 0, angle]; 
                            return { id, transform: { rotation } };
                        });
                        SINGLETON.twinManager.processPayload({ timestamp: Date.now(), updates });
                    }

                    if (step.action === "ATTACH_BOX") {
                        const box = SINGLETON.objectMap.get("Target_Box");
                        const gripper = SINGLETON.objectMap.get("Robot_Axis_6");
                        if (box && gripper) {
                            box.visible = true; // Show box
                            gripper.attach(box);
                            box.position.set(0.4, 0, 0); // Snap to Gripper Center
                        }
                    }

                    if (step.action === "DETACH_BOX") {
                        const box = SINGLETON.objectMap.get("Target_Box");
                        if (box && SINGLETON.scene) {
                            SINGLETON.scene.attach(box); // Detach to World (stay in place)
                        }
                    }

                    if (step.action === "RESET_BOX") {
                        const box = SINGLETON.objectMap.get("Target_Box");
                        if (box) {
                            box.visible = false; // Hide box for next cycle
                        }
                    }

                    if (step.action === "LOOP_SEQUENCE") {
                        if (isPlayingRef.current) {
                            const loopId = setTimeout(playSequence, 1000); 
                            timerRefs.current.push(loopId);
                        }
                    }

                }, step.time);
                timerRefs.current.push(id);
            });
        };

        playSequence();
    };

    const toggleAutoCycle = () => {
        if (isPlayingRef.current) {
            isPlayingRef.current = false;
            setSystemStatus('IDLE');
            clearAllTimers(); // Force Stop All
        } else {
            runShowMode();
        }
    };

    const lastAnglesRef = useRef([0,0,0,0,0,0]);
    useEffect(() => {
        const telemetryInterval = setInterval(() => {
            if (!SINGLETON.objectMap || SINGLETON.objectMap.size === 0) return;
            const newAxisData = [];
            const joints = ['Robot_Axis_1', 'Robot_Axis_2', 'Robot_Axis_3', 'Robot_Axis_4', 'Robot_Axis_5', 'Robot_Axis_6'];
            joints.forEach((id, index) => {
                const obj = SINGLETON.objectMap.get(id);
                if (obj) {
                    let angle = 0;
                    const euler = new THREE.Euler().setFromQuaternion(obj.quaternion);
                    if (index === 0) angle = euler.y;
                    else if (index === 3 || index === 5) angle = euler.x;
                    else angle = euler.z;
                    const deg = (angle * 180 / Math.PI);
                    const delta = Math.abs(deg - lastAnglesRef.current[index]);
                    const isMoving = delta > 0.1;
                    lastAnglesRef.current[index] = deg;
                    newAxisData.push({ angle: deg, status: isMoving ? 'moving' : 'idle' });
                } else {
                    newAxisData.push({ angle: 0, status: 'offline' });
                }
            });
            setAxisData(newAxisData);
        }, 100);
        return () => clearInterval(telemetryInterval);
    }, []);

    useEffect(() => {
        if (!mountRef.current) return;

        if (!SINGLETON.renderer) {
            const width = mountRef.current.clientWidth || window.innerWidth;
            const height = mountRef.current.clientHeight || window.innerHeight;
            SINGLETON.scene = new THREE.Scene();
            SINGLETON.scene.background = new THREE.Color(0xffffff); // White background
            SINGLETON.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
            SINGLETON.camera.position.set(8, 8, 12);
            SINGLETON.camera.lookAt(0, 2, 0);
            SINGLETON.renderer = new THREE.WebGLRenderer({ antialias: true });
            SINGLETON.renderer.setSize(width, height);
            SINGLETON.controls = new OrbitControls(SINGLETON.camera, SINGLETON.renderer.domElement);
            SINGLETON.controls.enableDamping = true;
            SINGLETON.controls.target.set(0, 2, 0);

            const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
            SINGLETON.scene.add(ambientLight);
            const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
            keyLight.position.set(5, 10, 7);
            SINGLETON.scene.add(keyLight);
            const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
            rimLight.position.set(-5, 5, -5);
            SINGLETON.scene.add(rimLight);
            SINGLETON.scene.add(new THREE.GridHelper(20, 20, 0xdddddd, 0xeeeeee)); // Lighter Grid
            SINGLETON.scene.add(new THREE.AxesHelper(2));

            const sceneGroup = new THREE.Group(); // Define sceneGroup BEFORE using it

            // --- SCENE OBJECTS: Box Only (No Platforms) ---
            const matBox = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.6, metalness: 0.1 });

            // Target Box (Hidden initially, appears on attach)
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), matBox);
            box.name = "Target_Box";
            box.visible = false; // Hide initially
            sceneGroup.add(box);

            // --- ROBOT ARM GENERATION (Hardcoded for testing) ---
            sceneGroup.name = "Robot_Scene_Local";
            const matWhite = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.1 }); // Light Grey Material
            const matBlack = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.1 }); // Dark Grey Material

            const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 0.8, 32), matWhite);
            base.position.y = 0.4; base.name = "Static_Base"; sceneGroup.add(base);
            const axis1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 32), matWhite);
            axis1.position.y = 0.6; axis1.name = "Robot_Axis_1"; base.add(axis1);
            const axis2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.2), matWhite);
            axis2.position.y = 0.8; axis2.name = "Robot_Axis_2"; axis1.add(axis2);
            const link2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.5, 0.6), matWhite);
            link2.position.y = 2; axis2.add(link2);
            const axis3 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 32), matWhite);
            axis3.rotation.z = Math.PI / 2; axis3.position.y = 2; axis3.name = "Robot_Axis_3"; link2.add(axis3);
            const link3 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.5), matWhite);
            link3.position.x = 1.5; axis3.add(link3);
            const axis4 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.8, 32), matWhite);
            axis4.rotation.z = -Math.PI / 2; axis4.position.x = 1.5; axis4.name = "Robot_Axis_4"; link3.add(axis4);
            const axis5 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), matWhite);
            axis5.position.x = 0.5; axis5.name = "Robot_Axis_5"; axis4.add(axis5);
            const axis6 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32), matBlack);
            axis6.rotation.z = Math.PI / 2; axis6.position.x = 0.4; axis6.name = "Robot_Axis_6"; axis5.add(axis6);

            const gripperBase = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), matBlack);
            gripperBase.position.x = 0.1; 
            axis6.add(gripperBase);
            const clawL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), matBlack);
            clawL.position.set(0.3, 0.15, 0); 
            clawL.name = "Robot_Claw_L";
            axis6.add(clawL);
            const clawR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), matBlack);
            clawR.position.set(0.3, -0.15, 0); 
            clawR.name = "Robot_Claw_R";
            axis6.add(clawR);

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
             setLoadedIds(Array.from(SINGLETON.objectMap.keys()));
        }

        mountRef.current.appendChild(SINGLETON.renderer.domElement);

        if (!SINGLETON.requestID) {
            const animate = () => {
                SINGLETON.requestID = requestAnimationFrame(animate);
                if (SINGLETON.controls) SINGLETON.controls.update();
                
                if (SINGLETON.scene && SINGLETON.camera && SINGLETON.renderer) {
                    SINGLETON.twinManager.update(SINGLETON.objectMap);
                    SINGLETON.renderer.render(SINGLETON.scene, SINGLETON.camera);
                }
            };
            animate();
            console.log("Animation Loop Started.");
        }

            // Add Resize Listener
            const handleResize = () => {
                if (mountRef.current && SINGLETON.camera && SINGLETON.renderer) {
                    const width = mountRef.current.clientWidth;
                    const height = mountRef.current.clientHeight;
                    SINGLETON.camera.aspect = width / height;
                    SINGLETON.camera.updateProjectionMatrix();
                    SINGLETON.renderer.setSize(width, height);
                }
            };
            window.addEventListener('resize', handleResize);

            const debugInterval = setInterval(() => {
                if (SINGLETON.scene) setSceneCount(SINGLETON.scene.children.length);
            }, 500);

            return () => {
                window.removeEventListener('resize', handleResize);
                clearInterval(debugInterval);
                clearAllTimers(); // Force stop all sequences on unmount
                isPlayingRef.current = false; // Reset playing flag
                if (SINGLETON.twinManager) {
                    SINGLETON.twinManager.reset(); // Stop interpolation immediately
                }

                if (mountRef.current && SINGLETON.renderer) {
                    if (mountRef.current.contains(SINGLETON.renderer.domElement)) {
                        mountRef.current.removeChild(SINGLETON.renderer.domElement);
                    }
                }
            };
    }, []); 

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#ffffff', position: 'relative' }}>
            {/* Full Screen Canvas Layer */}
            <div ref={mountRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#ffffff', zIndex: 0 }} />
            
            {/* Floating UI Overlay Layer */}
            <div style={{ 
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '350px',
                maxHeight: 'calc(100vh - 40px)',
                background: 'rgba(255,255,255,0.4)', 
                color: '#111', 
                padding: '20px', 
                zIndex: 10, 
                overflowY: 'auto', 
                border: '1px solid #ccc',
                borderRadius: '8px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
            }}>
                <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: 'bold' }}>Digital Twin Core</h2>
                <TelemetryPanel axisData={axisData} gripperStatus={gripperStatus} systemStatus={systemStatus} />
                
                {/* Manual Controls */}
                <div style={{ margin: '20px 0', padding: '10px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', border: '1px solid #eee' }}>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>POSE DESIGNER</div>
                    {['Robot_Axis_1', 'Robot_Axis_2', 'Robot_Axis_3', 'Robot_Axis_4', 'Robot_Axis_5', 'Robot_Axis_6'].map((axis, i) => (
                        <ControlSlider
                            key={axis}
                            label={`J${i+1}`}
                            value={manualPose[axis]}
                            onChange={(e) => handleManualChange(axis, e.target.value)}
                        />
                    ))}
                </div>

                <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px', marginTop: '10px' }}>
                    Scene Objects: {sceneCount}
                </div>
                <button 
                    onClick={toggleAutoCycle}
                    style={{ 
                        width: '100%', 
                        padding: '10px', 
                        background: 'transparent', 
                        color: systemStatus === 'AUTO_CYCLE' ? '#ff4444' : '#111', 
                        border: systemStatus === 'AUTO_CYCLE' ? '1px solid #ff4444' : '1px solid #333', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: 'bold'
                    }}
                    onMouseOver={(e) => { 
                        if (systemStatus !== 'AUTO_CYCLE') {
                            e.target.style.borderColor = '#00cc66'; 
                            e.target.style.color = '#00cc66'; 
                        }
                    }}
                    onMouseOut={(e) => { 
                        if (systemStatus === 'AUTO_CYCLE') {
                            e.target.style.borderColor = '#ff4444'; 
                            e.target.style.color = '#ff4444';
                        } else {
                            e.target.style.borderColor = '#333'; 
                            e.target.style.color = '#111'; 
                        }
                    }}
                >
                    {systemStatus === 'AUTO_CYCLE' ? 'STOP AUTO CYCLE' : 'START AUTO CYCLE'}
                </button>
                <h3 style={{ fontSize: '14px', marginTop: '20px', fontWeight: 'bold' }}>Object Index</h3>
                <ul style={{ paddingLeft: '20px', fontFamily: 'monospace', fontSize: '10px', color: '#666' }}>
                    {loadedIds.map(id => <li key={id}>{id}</li>)}
                </ul>
            </div>
        </div>
    );
}
