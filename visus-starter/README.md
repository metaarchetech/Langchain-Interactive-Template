# Project Visus: 3D AI Smart Hub
3D AI 智慧中樞

## Overview
Project Visus is a complete AI assistant template featuring voice interaction, 3D visualization, and real-time audio-reactive effects.

中文（大綱）：完整的 AI 助手範本，包含語音互動、3D 視覺化、即時音訊反應效果。

### Key Features
- **Voice Interaction**: Speech-to-text input (Web Speech API) + Text-to-speech output (OpenAI TTS)
- **3D Visualization**: Audio-reactive noise-distorted sphere with gradient materials
- **Real-time Controls**: Adjustable colors, lighting, and shape parameters
- **Smart Hub**: System state monitoring with collapsible UI
- **LangGraph Agent**: Multi-step reasoning with tool calling capabilities

中文（大綱）：語音互動、3D 音訊視覺化、即時參數控制、智能代理推理。

## Directory Structure
- `backend/`: Contains the FastAPI server and LangGraph agent logic.
- `frontend/`: Contains the React application for the UI experience.
中文（大綱）：`backend/` 放後端與智能代理；`frontend/` 放 React UI。

## Setup Instructions

### Backend
1. Navigate to `backend/`.
2. Create a virtual environment (optional but recommended).
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create `backend/.env` and set your OpenAI key:
   ```bash
   # in the backend folder, create a .env file with:
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
   ```
   You can use `backend/ENV.example` as a reference.
5. Run the server:
   ```bash
   uvicorn server:app --reload
   ```
中文（大綱）：進入 backend → 安裝套件 → 設定 `.env` 金鑰 → 啟動伺服器。

Troubleshooting:
- If you see 401 Authentication errors, double-check that `OPENAI_API_KEY` in `backend/.env` is a real key (starts with `sk-`) and not a placeholder like `your_openai_api_key_here`. After changes, restart the server.
中文（大綱）：若遇到 401，檢查 `.env` 是否為真實 `sk-` 金鑰並重啟。

### Frontend
1. Navigate to `frontend/`.
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
中文（大綱）：進入 frontend → npm install → npm run dev，UI 直接串接本地後端。

## Usage

### Basic Interaction
1. Open the frontend URL (usually http://localhost:5173 or 5174).
2. Allow microphone access when prompted.
3. **Text Input**: Type your message and press Enter or click Send.
4. **Voice Input**: Hold the microphone button and speak, release to send.
5. The AI will respond with text and voice, and the 3D sphere will react to the audio.

中文（大綱）：開啟前端 → 允許麥克風 → 文字輸入或按住麥克風說話 → AI 回應並驅動視覺效果。

### Visual Controls
- Click **"Smart Hub"** title to collapse/expand system status.
- Click **"Visual Controls"** title to collapse/expand parameter controls.
- Adjust RGB sliders to change sphere gradient colors.
- Tune shape parameters (noise scale, strength, audio boost, animation speed).

中文（大綱）：點擊標題收合面板；調整 RGB 滑桿改變漸層顏色；調整形狀參數控制視覺效果。

### Example Commands
- "Turn on the light"
- "Change the light to warm color"
- "Turn off the light"
- "Add a meeting to my schedule"

中文（大綱）：可以控制燈光開關、顏色、排程等功能。

## Digital Twin System (New Feature)

This project now includes a robust Digital Twin rendering pipeline designed to visualize industrial assets (e.g., robot arms) controlled by AI.

### Architecture
- **SceneLoader**: Handles GLB asset loading, Draco compression decoding, and Scene Graph traversal to build an ID-based object map (`frontend/src/systems/SceneLoader.js`).
- **TwinManager**: Manages state synchronization between Backend (AI) and Frontend (3D). Implements smooth interpolation (Lerp/Slerp) for position, rotation, scale, and color updates (`frontend/src/systems/TwinManager.js`).
- **AssetPipelineTest**: A dedicated test environment that implements a **Singleton Pattern** to ensure Three.js stability within React Strict Mode. It demonstrates a procedurally generated 6-axis robot arm with active gripper animation.

> **How to Access**: Click the hidden "DEV" button in the top-right corner of the UI (next to the title) to toggle the Digital Twin debug view.

### Key Technical Solutions
- **React Strict Mode Compatibility**: Uses a global Singleton instance for Scene/Renderer to prevent double-initialization issues common in React 18 development.
- **Synchronous Asset Generation**: Ensures 3D objects are created and added to the scene graph synchronously to avoid "zombie object" issues during hot reloads.
- **Hybrid Control**: Supports both "Teleport" (instant) and "Smooth" (interpolated) motion modes.

中文（大綱）：新增數位孿生系統，包含 SceneLoader（資產加載）、TwinManager（狀態同步與補間）、AssetPipelineTest（單例模式測試環境）。解決了 React Strict Mode 下的重複渲染問題，並展示了六軸機械手臂的即時控制與夾爪動畫。

## Technical Stack

### Backend
- **FastAPI**: High-performance API server
- **LangGraph**: Stateful multi-agent framework
- **LangChain**: LLM integration (OpenAI GPT-4o)
- **OpenAI TTS**: Text-to-speech (Nova voice)

### Frontend
- **React**: UI framework
- **Three.js**: 3D graphics and animation
- **Web Speech API**: Browser-native speech recognition (free)
- **Web Audio API**: Real-time audio analysis for visualization
- **Vite**: Fast development server

中文（大綱）：後端用 FastAPI + LangGraph；前端用 React + Three.js；語音用瀏覽器原生 API（免費）。

## Architecture Highlights

### Logic-Interface Separation
- Backend handles all AI reasoning and state management
- Frontend focuses on presentation and user interaction
- Clean API contract between layers

### Extensibility
- Easy to add new tools (see `backend/tools.py`)
- Easy to add new 3D scenes (see `frontend/src/components/ThreeBackground.jsx`)
- Easy to integrate other LLM providers (Grok, Claude, etc.)

### Performance
- Audio-reactive animations pause when window loses focus
- WebGL fallback for unsupported browsers
- Efficient particle/vertex updates

中文（大綱）：邏輯介面分離、易於擴展、性能優化。
