from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from agent import app_graph
from system_state import STATE
from openai import OpenAI
import base64
import json
import asyncio
import os
from config import OPENAI_API_KEY
from connection import manager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

# 初始化 OpenAI Client (用於 TTS)
client = OpenAI(api_key=OPENAI_API_KEY)

class TTSRequest(BaseModel):
    text: str

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    print(f"收到指令: {req.text}")
    
    # 1. 執行 LangGraph 獲取文字回應
    result = app_graph.invoke({"messages": [HumanMessage(content=req.text)]})
    ai_response = result["messages"][-1].content
    print(f"AI 回應: {ai_response}")

    # 2. 僅回傳文字和狀態 (不生成語音)
    return {
        "reply": ai_response,
        "state": STATE
    }

@app.post("/tts")
async def tts_endpoint(req: TTSRequest):
    print(f"收到 TTS 請求: {req.text[:20]}...")
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="nova",
            input=req.text
        )
        # 回傳 Base64 音訊
        audio_base64 = base64.b64encode(response.content).decode('utf-8')
        return {"audio": audio_base64}
    except Exception as e:
        print(f"TTS 生成失敗: {e}")
        return {"error": str(e)}

@app.websocket("/ws/omniverse")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Here we can handle messages FROM Omniverse if needed
            # For now, we just print them
            print(f"Message from Omniverse: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# 啟動: uvicorn server:app --reload
