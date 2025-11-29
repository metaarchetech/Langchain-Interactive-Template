import datetime
from langchain_core.tools import tool
from system_state import STATE

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

ALL_TOOLS = [control_light, add_schedule, get_time]
