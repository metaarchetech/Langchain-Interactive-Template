import datetime
import asyncio
import json
import time
from langchain_core.tools import tool
from system_state import STATE
from connection import manager

@tool
async def control_scene(target_id: str, x: float = None, y: float = None, z: float = None, color: str = None):
    """
    控制 3D 場景中的物件。
    Args:
        target_id: 目標物件 ID，可選值: 'Robot_Arm_01', 'Sensor_Temp_A', 'AGV_Unit_05'。
        x, y, z: (Optional) 目標位置座標。建議範圍 x: -8~8, y: 0~5, z: -8~8。
        color: (Optional) 目標顏色，請使用 Hex 格式 (例如 '#FF0000')。
    """
    try:
        # 建構符合 TwinUpdatePayload 格式的 JSON
        payload = {
            "timestamp": int(time.time() * 1000),
            "updates": []
        }

        update_item = {
            "id": target_id,
            "transform": {},
            "material": {}
        }

        # 處理位置
        if x is not None and y is not None and z is not None:
            update_item["transform"]["position"] = [x, y, z]
        
        # 處理顏色
        if color:
            update_item["material"]["colorHex"] = color

        payload["updates"].append(update_item)
        
        # 轉成 JSON 字串並透過 WebSocket 廣播
        await manager.broadcast(json.dumps(payload))
        
        return f"已發送指令控制 {target_id}: 位置=({x},{y},{z}), 顏色={color}"
    except Exception as e:
        return f"控制場景失敗: {e}"

@tool
def control_light(status: str, color: str = "white"):
    """
    控制燈光開關與顏色。
    Args:
        status: 'on' 開啟 或 'off' 關閉
        color: 顏色 (如 'white', 'warm', 'red')
    """
    STATE["light"] = status
    STATE["color"] = color
    return f"燈光已切換為 {status}，顏色：{color}。"

@tool
def add_schedule(content: str):
    """新增行程到行事曆 (例如 '明天早上開會')"""
    STATE["schedule"].append(content)
    return f"已新增行程：{content}"

@tool
def get_time():
    """獲取系統當前時間"""
    return datetime.datetime.now().strftime("%H:%M")

ALL_TOOLS = [control_light, add_schedule, get_time, control_scene]
