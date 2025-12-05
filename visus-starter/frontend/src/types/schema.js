/**
 * @fileoverview 定義數位雙生系統的前後端通訊協議
 * 雖然這是 JS 檔案，但使用 JSDoc 來模擬 Type 定義
 */

/**
 * 單個 3D 物件的目標狀態
 * @typedef {Object} TwinObjectState
 * @property {string} id - 對應 GLB 中的 Object Name (唯一識別碼)
 * @property {boolean} [visible] - 是否顯示
 * @property {Object} [transform] - 位置與旋轉
 * @property {number[]} [transform.position] - [x, y, z]
 * @property {number[]} [transform.rotation] - [x, y, z] (Euler angles in degrees or radians)
 * @property {number[]} [transform.scale] - [x, y, z]
 * @property {Object} [material] - 材質屬性
 * @property {string} [material.colorHex] - e.g. "#FF0000"
 * @property {number} [material.emissiveIntensity] - 發光強度
 */

/**
 * 後端傳送的完整更新封包
 * @typedef {Object} TwinUpdatePayload
 * @property {number} timestamp - 伺服器時間戳記
 * @property {string} [eventId] - 事件追蹤 ID
 * @property {TwinObjectState[]} updates - 批量更新列表
 */

export const SCHEMA_VERSION = "1.0.0";

// 範例 Payload
export const EXAMPLE_PAYLOAD = {
    timestamp: 1715432100,
    eventId: "evt_001",
    updates: [
        {
            id: "Robot_Arm_01",
            transform: {
                rotation: [0, 90, 0] // Rotate 90 degrees on Y
            },
            material: {
                colorHex: "#FF0000" // Alert color
            }
        }
    ]
};

