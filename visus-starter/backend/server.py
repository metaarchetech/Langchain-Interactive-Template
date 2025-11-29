from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from agent import app_graph
from system_state import STATE
from openai import OpenAI
import base64
import os
from config import OPENAI_API_KEY

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

# 初始化 OpenAI Client (用於 TTS)
client = OpenAI(api_key=OPENAI_API_KEY)

class ChatRequest(BaseModel):
    text: str

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    print(f"收到指令: {req.text}")
    
    # 1. 執行 LangGraph 獲取文字回應
    result = app_graph.invoke({"messages": [HumanMessage(content=req.text)]})
    ai_response = result["messages"][-1].content
    print(f"AI 回應: {ai_response}")

    # 2. 生成語音 (TTS)
    audio_base64 = None
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="nova", # 女性聲音，親切感
            input=ai_response
        )
        # 將二進制音頻轉換為 base64 字符串
        audio_base64 = base64.b64encode(response.content).decode('utf-8')
        print("語音生成成功")
    except Exception as e:
        print(f"語音生成失敗: {e}")

    # 3. 回傳：AI 回答 + 語音 + 最新系統狀態
    return {
        "reply": ai_response,
        "audio": audio_base64, # Base64 編碼的 MP3
        "state": STATE
    }

# 啟動: uvicorn server:app --reload
