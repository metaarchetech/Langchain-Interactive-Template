import React, { useState, useRef, useEffect } from 'react';
import ThreeBackground from './components/ThreeBackground';
import VisualControls from './components/VisualControls';
import AssetPipelineTest from './components/AssetPipelineTest';

function App() {
  // Dev Mode State
  const [isDebugMode, setIsDebugMode] = useState(false);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: '你好！我是 Francis，您的 AI 助手。有什麼我可以幫您的嗎？' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioIntensity, setAudioIntensity] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [displayMode, setDisplayMode] = useState('particles'); // Default to particles
  
  // Visual control states
  const [colorTop, setColorTop] = useState({ r: 0, g: 255, b: 150 }); // Green
  const [colorBottom, setColorBottom] = useState({ r: 150, g: 0, b: 255 }); // Purple
  const [shapeParams, setShapeParams] = useState({
    noiseScale: 0.3,
    baseStrength: 4.0,
    audioBoost: 19,
    animSpeed: 0.01
  });
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null); // Timer to detect silence
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Check if Web Speech API is supported
  const isSpeechRecognitionSupported = 
    'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSpeechRecognitionSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'zh-TW';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update input with interim or final transcript
      setInput(finalTranscript || interimTranscript);

      // Reset silence timer on every result
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      // If we have some transcript, set a timer to auto-stop after silence
      if (finalTranscript || interimTranscript) {
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            console.log('Silence detected, stopping recording...');
            recognitionRef.current.stop();
          }
        }, 800); // 0.8 seconds silence timeout
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      
      if (event.error === 'not-allowed') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Microphone access denied. Please enable microphone permissions.'
        }]);
      } else if (event.error === 'no-speech') {
        // Silent error, just stop recording
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Voice recognition error: ${event.error}`
        }]);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isSpeechRecognitionSupported]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);

    try {
      // Connect to Backend API
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: messageText }),
      });

      const data = await response.json();

      // Add AI Response to Chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply
      }]);

      // Play Audio if available with visualization
      if (data.audio) {
        try {
          const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
          
          // Setup audio analysis
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          
          const audioContext = audioContextRef.current;
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;
          
          const source = audioContext.createMediaElementSource(audio);
          source.connect(analyser);
          analyser.connect(audioContext.destination);
          
          // Analyze audio in real-time
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateIntensity = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioIntensity(average / 255); // Normalize to 0-1
            
            if (!audio.paused) {
              requestAnimationFrame(updateIntensity);
            } else {
              setAudioIntensity(0);
            }
          };
          
          audio.onplay = () => updateIntensity();
          audio.onended = () => setAudioIntensity(0);
          
          await audio.play();
          console.log("Playing audio response with visualization");
        } catch (audioError) {
          console.error("Audio playback failed:", audioError);
          setAudioIntensity(0);
        }
      }

      setIsLoading(false);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error: Could not connect to server.'
      }]);
      setIsLoading(false);
    }
  };

  // Voice Recording Handlers
  const startRecording = () => {
    if (!recognitionRef.current || isLoading) return;
    
    try {
      setIsRecording(true);
      setInput('');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setTimeout(() => {
        if (input.trim()) {
          handleSend();
        }
      }, 300);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
    }
  };

  const handleMouseDown = () => {
    startRecording();
  };

  const handleMouseUp = () => {
    stopRecording();
  };

  const handleMouseLeave = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  // Render Dev Mode if active
  if (isDebugMode) {
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#fff' }}>
        <button 
          onClick={() => setIsDebugMode(false)}
          style={{
            position: 'absolute', 
            top: 10, 
            right: 10, 
            zIndex: 9999,
            background: 'transparent',
            color: '#111',
            border: '1px solid #333',
            padding: '5px 10px',
            cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.target.style.borderColor = '#00cc66'; e.target.style.color = '#00cc66'; }}
          onMouseOut={(e) => { e.target.style.borderColor = '#333'; e.target.style.color = '#111'; }}
        >
          Exit Dev Mode
        </button>
        <AssetPipelineTest />
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'transparent',
      color: '#111',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Three.js 3D Background */}
      <ThreeBackground 
        audioIntensity={audioIntensity}
        colorTop={colorTop}
        colorBottom={colorBottom}
        shapeParams={shapeParams}
        displayMode={displayMode}
      />

      {/* Title */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '4px',
        padding: '12px 20px',
        zIndex: 10,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px',
        color: '#111',
        fontWeight: '500',
        letterSpacing: '0.5px',
        pointerEvents: 'auto'
      }}>
        Langchain Interactive Template
        <button 
            onClick={() => setIsDebugMode(true)}
            style={{
                marginLeft: '10px',
                background: 'transparent',
                border: '1px solid #999',
                color: '#666',
                cursor: 'pointer',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '2px',
                transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.target.style.borderColor = '#00cc66'; e.target.style.color = '#00cc66'; }}
            onMouseOut={(e) => { e.target.style.borderColor = '#999'; e.target.style.color = '#666'; }}
        >
            DEV
        </button>
      </div>

      {/* Visual Controls */}
      <VisualControls
        colorTop={colorTop}
        colorBottom={colorBottom}
        onColorTopChange={setColorTop}
        onColorBottomChange={setColorBottom}
        shapeParams={shapeParams}
        onShapeParamsChange={setShapeParams}
        isVisible={controlsVisible}
        onToggle={() => setControlsVisible(!controlsVisible)}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
      />

      {/* Chat Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        paddingBottom: '120px',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 5,
        pointerEvents: 'none' // Allow clicks to pass through to 3D background
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '70%',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            pointerEvents: 'auto' // Re-enable clicks for messages
          }}>
            <div style={{
              fontSize: '11px',
              color: '#666',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              {msg.role === 'user' ? 'You' : 'Francis'}
            </div>
            <div style={{
              padding: '12px 16px',
              borderRadius: '4px',
              background: msg.role === 'user' ? 'rgba(245, 245, 245, 0.6)' : 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(16px)',
              border: '1px solid #e0e0e0',
              color: '#111',
              lineHeight: '1.5',
              boxShadow: 'none'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', color: '#999', fontSize: '13px' }}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid #eee',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
        zIndex: 5,
        pointerEvents: 'auto'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '800px',
          display: 'flex',
          gap: '10px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.3)',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #e0e0e0',
            boxShadow: 'none'
          }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isRecording && handleSend()}
            placeholder={isRecording ? "Listening..." : "Type a message..."}
            disabled={isRecording}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#111',
              outline: 'none',
              padding: '0 10px',
              fontSize: '14px',
              fontFamily: 'JetBrains Mono, monospace'
            }}
          />
          
          {/* Microphone Button */}
          {isSpeechRecognitionSupported && (
            <button
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              disabled={isLoading}
              style={{
                background: 'transparent',
                color: isRecording ? '#ff4444' : '#111',
                border: isRecording ? '1px solid #ff4444' : '1px solid #ccc',
                padding: '10px 16px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
                opacity: isLoading ? 0.5 : 1,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '16px',
                animation: isRecording ? 'pulse 1.5s ease-in-out infinite' : 'none',
                userSelect: 'none'
              }}
              title="Hold to speak"
            >
              {isRecording ? '●' : '🎤'}
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={isLoading || isRecording}
            style={{
              background: 'transparent',
              color: '#111',
              border: '1px solid #ccc',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: (isLoading || isRecording) ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s',
              opacity: (isLoading || isRecording) ? 0.5 : 1,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px'
            }}
            onMouseOver={(e) => { if(!isLoading && !isRecording) { e.target.style.borderColor = '#00cc66'; e.target.style.color = '#00cc66'; } }}
            onMouseOut={(e) => { if(!isLoading && !isRecording) { e.target.style.borderColor = '#ccc'; e.target.style.color = '#111'; } }}
          >
            Send
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
