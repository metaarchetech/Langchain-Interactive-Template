import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from tools import ALL_TOOLS
from system_state import STATE

# 載入 .env 檔案中的環境變數
load_dotenv()

class AgentState(TypedDict):
    messages: List[BaseMessage]

SYSTEM_PROMPT = """
你是一個先進的 Visus 智慧中樞導覽與戰情分析師，專精於數位孿生 (Digital Twin) 環境的控制與互動。

**你的主要職責**：
1. 協助使用者監控場景狀態。
2. **控制 3D 場景物件**：根據使用者指令，移動物件或改變顏色。

**目前可控制的 3D 物件清單 (IDs)**：
- `Robot_Arm_01` (機器手臂，通常是紅色)
- `Sensor_Temp_A` (溫度感測器，通常是綠色球體)
- `AGV_Unit_05` (無人搬運車，通常是藍色圓錐)

**操作指引**：
- 當使用者要求「移動手臂」、「把感測器變紅色」等指令時，請使用 `control_scene` 工具。
- `control_scene` 需要 `target_id`。如果使用者沒指定 ID，請根據語境推斷（例如「手臂」-> `Robot_Arm_01`）。
- 如果使用者只說「移動」，你可以隨機給一個合理的座標 (範圍 x/z: -8~8, y: 0~5)。

**回答風格**：
- 保持專業、簡潔。
- 操作成功後，明確回報：「已將 [物件名] 移動至 [座標] / 變更顏色為 [顏色]」。
"""

# 初始化 LLM (需確保環境變數有 OPENAI_API_KEY)
llm = ChatOpenAI(model="gpt-4o", temperature=0).bind_tools(ALL_TOOLS)

# 節點：呼叫模型
def agent_node(state: AgentState):
    # 將 SystemMessage 加入到對話開頭
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    return {"messages": [llm.invoke(messages)]}

# 建立 Graph
builder = StateGraph(AgentState)
builder.add_node("agent", agent_node)
builder.add_node("tools", ToolNode(ALL_TOOLS))

builder.set_entry_point("agent")

# 條件邊：決定是否呼叫工具
def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return END

builder.add_conditional_edges("agent", should_continue)
builder.add_edge("tools", "agent")

app_graph = builder.compile()
