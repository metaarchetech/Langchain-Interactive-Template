import * as THREE from 'three';

/**
 * 負責管理 3D 物件的狀態補間 (Interpolation)
 * 接收後端指令 -> 設定目標值 -> 每幀 Lerp 更新
 */
export class TwinManager {
    constructor() {
        // 儲存每個 ID 對應的目標狀態
        // Map<id, TwinObjectState>
        this.targets = new Map();
        
        // 補間速度係數 (0.0 ~ 1.0)
        // 數值越小越平滑但延遲越高，數值越大反應越快但可能生硬
        this.lerpFactor = 0.1; 
    }

    /**
     * 處理來自後端的更新封包
     * @param {import('../types/schema').TwinUpdatePayload} payload 
     */
    processPayload(payload) {
        if (!payload || !payload.updates) return;

        console.log(`[TwinManager] Received updates for ${payload.updates.length} objects`);

        payload.updates.forEach(state => {
            // 將新的目標狀態存入 Map
            // 我們只更新有變動的欄位 (Merge logic)
            const currentTarget = this.targets.get(state.id) || {};
            
            this.targets.set(state.id, {
                ...currentTarget,
                ...state,
                // 如果有 transform，需要深層合併
                transform: { ...currentTarget.transform, ...state.transform },
                material: { ...currentTarget.material, ...state.material }
            });
        });
    }

    /**
     * 在 Render Loop 中呼叫，執行補間更新
     * @param {Map<string, THREE.Object3D>} objectMap - 來自 SceneLoader 的索引表
     */
    update(objectMap) {
        this.targets.forEach((targetState, id) => {
            const object = objectMap.get(id);
            if (!object) {
                console.warn(`[TwinManager] Object ID ${id} not found in scene map!`);
                return;
            }

            // Debug trace for one specific object
            if (id === 'Robot_Arm_01' && Math.random() < 0.01) {
                // console.log(`Updating ${id} position to`, targetState.transform?.position);
            }

            // 1. 處理位置 (Position)
            if (targetState.transform?.position) {
                const [tx, ty, tz] = targetState.transform.position;
                const targetVector = new THREE.Vector3(tx, ty, tz);
                
                // Debug: Check distance before lerp
                const dist = object.position.distanceTo(targetVector);
                if (dist > 0.01 && Math.random() < 0.05) {
                   console.log(`[TwinManager] ${id} moving... dist=${dist.toFixed(2)}`);
                }

                object.position.lerp(targetVector, this.lerpFactor);
            }

            // 2. 處理旋轉 (Rotation)
            if (targetState.transform?.rotation) {
                const [rx, ry, rz] = targetState.transform.rotation;
                // 轉換為 Quaternion 進行平滑旋轉 (Slerp)
                const targetEuler = new THREE.Euler(rx, ry, rz);
                const targetQuaternion = new THREE.Quaternion().setFromEuler(targetEuler);
                object.quaternion.slerp(targetQuaternion, this.lerpFactor);
            }
            
            // 3. 處理縮放 (Scale)
            if (targetState.transform?.scale) {
                const [sx, sy, sz] = targetState.transform.scale;
                object.scale.lerp(new THREE.Vector3(sx, sy, sz), this.lerpFactor);
            }

            // 4. 處理材質顏色 (Color)
            if (targetState.material?.colorHex && object.material) {
                const targetColor = new THREE.Color(targetState.material.colorHex);
                
                // [Auto-Clone Material] 如果材質是共用的，第一次修改顏色時進行 Clone
                // 這樣才不會一變全變 (e.g. 所有綠色零件一起變色)
                if (!object.userData.isMaterialCloned) {
                    object.material = object.material.clone();
                    object.userData.isMaterialCloned = true;
                    // console.log(`[TwinManager] Cloned material for ${id}`);
                }

                if (object.material.color) {
                    object.material.color.lerp(targetColor, this.lerpFactor);
                }
            }

            // 5. 處理發光 (Emissive)
            if (targetState.material?.emissive !== undefined && object.material) {
                // 這裡簡單假設 emissiveIntensity
                 if (object.material.emissiveIntensity !== undefined) {
                    object.material.emissiveIntensity = THREE.MathUtils.lerp(
                        object.material.emissiveIntensity, 
                        targetState.material.emissive, 
                        this.lerpFactor
                    );
                 }
            }
            
            // 6. 可見性 (Visibility) - 直接切換，不補間
            if (targetState.visible !== undefined) {
                object.visible = targetState.visible;
            }
        });
    }
    
    /**
     * 清除所有狀態
     */
    reset() {
        this.targets.clear();
    }
}

