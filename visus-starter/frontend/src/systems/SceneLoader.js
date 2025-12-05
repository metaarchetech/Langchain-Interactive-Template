import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

/**
 * 負責載入 GLB 模型並建立 ID 索引
 */
export class SceneLoader {
    constructor() {
        this.loader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        
        // 設定 Draco 解碼器路徑 (位於 public/draco/)
        this.dracoLoader.setDecoderPath('/draco/');
        this.dracoLoader.setDecoderConfig({ type: 'js' });
        
        this.loader.setDRACOLoader(this.dracoLoader);
        
        // 用於儲存 ID -> Object3D 的對照表
        this.objectMap = new Map();
    }

    /**
     * 載入 GLB 檔案
     */
    async load(url) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (gltf) => {
                    const scene = gltf.scene;
                    this.indexScene(scene);
                    console.log(`Loaded ${url}. Indexed ${this.objectMap.size} objects.`);
                    resolve({ scene, map: this.objectMap });
                },
                undefined,
                (error) => {
                    console.error('An error happened while loading GLB:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * 建立一個程序化的 6 軸機械手臂
     */
    async loadMockScene() {
        const scene = new THREE.Group();
        scene.name = "Robot_Scene";

        // 使用 MeshBasicMaterial 確保一定看得到 (排除光照問題)
        const matGrey = new THREE.MeshBasicMaterial({ color: 0x999999 });
        const matOrange = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const matMetal = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
        const matBlack = new THREE.MeshBasicMaterial({ color: 0x111111 });

        // 0. 地板 (移除)
        // const floor = ...

        // --- 機械手臂結構 ---
        // 1. Base (底座) - 不動
        const baseGeo = new THREE.CylinderGeometry(1.5, 2, 1, 32);
        const base = new THREE.Mesh(baseGeo, matGrey);
        base.position.y = 0.5;
        base.name = "Static_Base";
        scene.add(base);

        // 2. Axis 1 (腰部旋轉) - Rotates Y
        const axis1Geo = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 32);
        const axis1 = new THREE.Mesh(axis1Geo, matOrange);
        axis1.position.y = 0.75; // 相對於 Base 頂部
        axis1.name = "Robot_Axis_1";
        base.add(axis1); // 親子關係

        // 3. Axis 2 (大臂關節) - Rotates Z
        const shoulderGeo = new THREE.BoxGeometry(1.5, 1.5, 2);
        const axis2 = new THREE.Mesh(shoulderGeo, matOrange);
        axis2.position.y = 1.0; 
        axis2.name = "Robot_Axis_2";
        axis1.add(axis2);

        // Link 2 (大臂) - 視覺裝飾
        const link2Geo = new THREE.BoxGeometry(0.8, 4, 0.8);
        const link2 = new THREE.Mesh(link2Geo, matOrange);
        link2.position.y = 2; // 往上延伸
        axis2.add(link2);

        // 4. Axis 3 (小臂關節) - Rotates Z (位於大臂頂端)
        const elbowGeo = new THREE.CylinderGeometry(1, 1, 2, 32);
        const axis3 = new THREE.Mesh(elbowGeo, matOrange);
        axis3.rotation.z = Math.PI / 2; // 橫向圓柱
        axis3.position.y = 2; // 相對於大臂中心
        axis3.name = "Robot_Axis_3";
        link2.add(axis3);

        // Link 3 (小臂)
        const link3Geo = new THREE.BoxGeometry(3, 0.6, 0.6);
        const link3 = new THREE.Mesh(link3Geo, matOrange);
        link3.position.x = 1.5; // 往橫向延伸 (因為 Axis 3 轉了，這裡的座標系要小心)
        // 為了簡化，我們把 link3 作為 axis3 的子物件
        // 如果 axis3 轉了，link3 也會轉
        // 但 axis3 本身是橫著的 cylinder，轉 Z 軸 = 舉起手臂
        // 這裡調整一下結構：
        // Axis3 本身是關節點。
        axis3.add(link3);

        // 5. Axis 4 (手腕旋轉) - Rotates X (位於小臂末端)
        const wrist1Geo = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        const axis4 = new THREE.Mesh(wrist1Geo, matMetal);
        axis4.rotation.z = -Math.PI / 2; // 轉回來
        axis4.position.x = 1.5; // 小臂末端
        axis4.name = "Robot_Axis_4";
        link3.add(axis4);

        // 6. Axis 5 (手腕擺動) - Rotates Z
        const wrist2Geo = new THREE.BoxGeometry(0.6, 0.8, 0.6);
        const axis5 = new THREE.Mesh(wrist2Geo, matMetal);
        axis5.position.x = 0.6;
        axis5.name = "Robot_Axis_5";
        axis4.add(axis5);

        // 7. Axis 6 (法蘭旋轉) - Rotates X
        const flangeGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 32);
        const axis6 = new THREE.Mesh(flangeGeo, matBlack);
        axis6.rotation.z = Math.PI / 2;
        axis6.position.x = 0.5;
        axis6.name = "Robot_Axis_6";
        axis5.add(axis6);

        // End Effector (夾爪) - 視覺裝飾
        const claw1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), matMetal);
        claw1.position.set(0.2, 0.3, 0);
        axis6.add(claw1);
        const claw2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), matMetal);
        claw2.position.set(0.2, -0.3, 0);
        axis6.add(claw2);


        // 建立索引
        this.indexScene(scene);
        
        // 調整初始姿勢
        // axis2.rotation.z = -0.5;
        // axis3.rotation.z = 1.0;

        console.log("Robot Arm Generated.");
        return Promise.resolve({ scene, map: this.objectMap });
    }

    /**
     * 遞迴遍歷場景圖，將有 name 的物件加入 Map
     * 排除名稱以 "Static_" 開頭的物件
     */
    indexScene(root) {
        root.traverse((child) => {
            if (child.isMesh && child.name) {
                // Filter: 忽略靜態物件
                if (child.name.startsWith('Static_')) {
                    return;
                }

                this.objectMap.set(child.name, child);
            }
        });
    }

    getObject(id) {
        return this.objectMap.get(id);
    }

    dispose() {
        this.objectMap.clear();
        this.dracoLoader.dispose();
    }
}
