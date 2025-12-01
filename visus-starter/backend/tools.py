import datetime
import asyncio
from langchain_core.tools import tool
from system_state import STATE
from connection import manager

@tool
async def control_omniverse(command: str, parameters: str = "{}"):
    """
    Send a command to control the NVIDIA Omniverse scene.
    Args:
        command: The action to perform (e.g., 'move', 'rotate', 'scale', 'create', 'delete').
        parameters: JSON string of parameters for the command (e.g., '{"prim_path": "/World/Cube", "x": 10, "y": 0, "z": 0}').
    """
    try:
        message = {
            "command": command,
            "parameters": parameters
        }
        # Note: In a real sync environment we might need a helper to run async code,
        # but LangChain supports async tools.
        await manager.broadcast(message)
        return f"Sent command to Omniverse: {command} with params {parameters}"
    except Exception as e:
        return f"Failed to send command to Omniverse: {e}"

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

ALL_TOOLS = [control_light, add_schedule, get_time, control_omniverse]
