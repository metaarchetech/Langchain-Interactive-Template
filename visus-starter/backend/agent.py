from typing import TypedDict, Annotated, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from tools import ALL_TOOLS
import os
from config import OPENAI_API_KEY

# Ensure the validated key is present in process env for downstream clients
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

# 定義狀態
class AgentState(TypedDict):
    messages: List[BaseMessage]

# 初始化 LLM (需確保環境變數有 OPENAI_API_KEY)
llm = ChatOpenAI(model="gpt-4o", temperature=0).bind_tools(ALL_TOOLS)

# 節點：呼叫模型
def agent_node(state: AgentState):
    return {"messages": [llm.invoke(state["messages"])]}

# 節點：路由判斷
def router(state: AgentState):
    if state["messages"][-1].tool_calls:
        return "tools"
    return END

# 建構圖表
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(ALL_TOOLS))

workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", router)
workflow.add_edge("tools", "agent")

app_graph = workflow.compile()
