# Langchain Interactive Template

A modern AI assistant template featuring voice interaction, 3D audio-reactive visualization, and LangChain integration.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-19.2.0-blue.svg)

## 🌟 Features

- 🎙️ **Voice Interaction**: Speech-to-text input and text-to-speech output
- 🎨 **3D Visualization**: Audio-reactive noise-distorted sphere with customizable gradient colors
- 🎮 **Interactive Controls**: Middle mouse button to rotate with smooth damping, scroll to zoom
- 🤖 **LangChain Integration**: Smart agent with tool calling capabilities
- ⚙️ **Real-time Controls**: Adjust colors, lighting, and shape parameters on the fly
- 🎯 **Modern UI**: Low-saturation blue and pink color scheme

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API Key

### Backend Setup

```bash
cd visus-starter/backend
pip install -r requirements.txt

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# Start the server
uvicorn server:app --reload
```

### Frontend Setup

```bash
cd visus-starter/frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to see the app in action!

## 🎮 Usage

### Interaction

- **Text Input**: Type your message and press Enter
- **Voice Input**: Hold the microphone button to speak
- **3D Controls**: 
  - Middle mouse button + drag to rotate the sphere
  - Scroll to zoom in/out
  - Click "Visual Controls" to adjust colors and parameters

### Example Commands

- "Turn on the light"
- "Change the light to warm color"
- "Add a meeting to my schedule"

## 🛠️ Tech Stack

### Backend
- **FastAPI**: High-performance API server
- **LangGraph**: Stateful multi-agent framework
- **LangChain**: LLM integration with OpenAI GPT-4o
- **OpenAI TTS**: Text-to-speech synthesis

### Frontend
- **React**: UI framework
- **Three.js**: 3D graphics and animation
- **Web Speech API**: Browser-native speech recognition
- **Web Audio API**: Real-time audio analysis
- **Vite**: Fast development server

## 📁 Project Structure

```
.
├── visus-starter/
│   ├── backend/          # FastAPI server & LangChain agent
│   │   ├── agent.py      # LangGraph agent logic
│   │   ├── server.py     # FastAPI endpoints
│   │   ├── tools.py      # Agent tools
│   │   └── config.py     # Configuration
│   └── frontend/         # React application
│       └── src/
│           ├── App.jsx           # Main app component
│           └── components/
│               ├── ThreeBackground.jsx  # 3D visualization
│               └── VisualControls.jsx   # UI controls
├── .vscode/
│   └── settings.json     # IDE color theme (low-saturation blue/pink)
└── .gitignore
```

## 🎨 IDE Theme

The project includes a custom VS Code theme with low-saturation blue and pink colors. The theme is automatically applied when you open the workspace.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

MIT License - feel free to use this template for your projects!

## 🔗 Links

- [Repository](https://github.com/metaarchetech/Langchain-Interactive-Template)
- [Documentation](visus-starter/README.md)

## 💡 Future Enhancements

- [ ] Support for multiple 3D scenes
- [ ] Custom voice models
- [ ] Multi-language support
- [ ] Mobile responsive design
- [ ] Docker deployment

---

Made with ❤️ by MetaArcheTech

