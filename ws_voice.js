import React, { useState, useEffect, useRef } from 'react';

const VoiceSurveyApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(50);
  const [timeRemaining, setTimeRemaining] = useState('2 min');
  const [currentMessage, setCurrentMessage] = useState('Thank you for taking time today. I would like take 5 mins of your time to get your thoughts about Pollvault.');
  const [audioLevel, setAudioLevel] = useState(0);
  const [surveyCode, setSurveyCode] = useState('DEMO123');
  const [responderId, setResponderId] = useState('');
  
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioChunksRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Audio visualization bars
  const [audioBars, setAudioBars] = useState(Array(12).fill(0));

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      backgroundColor: '#2d2d2d'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    input: {
      backgroundColor: '#4a4a4a',
      padding: '8px 12px',
      borderRadius: '4px',
      border: 'none',
      color: 'white',
      fontSize: '14px'
    },
    button: {
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px'
    },
    buttonHover: {
      backgroundColor: '#2563eb'
    },
    closeButton: {
      padding: '8px',
      backgroundColor: 'transparent',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      borderRadius: '4px',
      fontSize: '20px'
    },
    progressContainer: {
      padding: '16px 24px'
    },
    progressWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    progressBar: {
      flex: 1,
      backgroundColor: '#4a4a4a',
      borderRadius: '10px',
      height: '8px',
      overflow: 'hidden'
    },
    progressFill: {
      backgroundColor: '#fbbf24',
      height: '100%',
      borderRadius: '10px',
      transition: 'width 0.3s ease'
    },
    progressText: {
      color: '#fbbf24',
      fontWeight: 'bold'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      gap: '32px'
    },
    messageContainer: {
      textAlign: 'center',
      maxWidth: '400px'
    },
    message: {
      fontSize: '18px',
      lineHeight: '1.6'
    },
    audioVisualization: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '4px',
      height: '80px'
    },
    audioBar: {
      width: '12px',
      borderRadius: '6px',
      background: 'linear-gradient(to top, #8b5cf6, #3b82f6)',
      transition: 'all 0.1s ease'
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px'
    },
    controlButton: {
      padding: '12px',
      backgroundColor: '#4a4a4a',
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
      color: 'white',
      fontSize: '16px',
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    mainButton: {
      padding: '24px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      fontSize: '32px',
      width: '96px',
      height: '96px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    },
    mainButtonActive: {
      backgroundColor: 'white',
      color: '#1a1a1a'
    },
    mainButtonInactive: {
      backgroundColor: '#4a4a4a',
      color: '#9ca3af'
    },
    testControls: {
      display: 'flex',
      gap: '8px',
      marginTop: '32px'
    },
    testButton: {
      padding: '8px 16px',
      backgroundColor: '#4a4a4a',
      border: 'none',
      borderRadius: '4px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px'
    },
    statusBar: {
      padding: '16px',
      backgroundColor: '#2d2d2d',
      textAlign: 'center',
      fontSize: '14px',
      color: '#9ca3af'
    },
    connected: {
      color: '#10b981'
    },
    recording: {
      animation: 'pulse 1s infinite'
    }
  };

  useEffect(() => {
    // Generate random responder ID
    setResponderId(`resp_${Math.random().toString(36).substring(2, 15)}`);
    
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      const wsUrl = `ws://localhost:8002/survey/voice/${surveyCode}?responder_id=${responderId}`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };
      
      wsRef.current.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          // Handle audio data
          const audioBlob = new Blob([event.data], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
          
          // Animate audio bars when receiving audio
          animateAudioBars();
        } else {
          // Handle JSON messages
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          if (data.content) {
            setCurrentMessage(data.content);
          }
          
          // Update progress based on message type
          if (data.type === 'question' || data.type === 'audio_question') {
            // Simulate progress
            setProgress(prev => Math.min(prev + 10, 100));
          }
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    stopRecording();
    setIsConnected(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 64;
      
      // Start visualization
      visualizeAudio();
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendAudioData(audioBlob);
        audioChunksRef.current = [];
      };
      
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsRecording(false);
    setIsPaused(false);
    setAudioBars(Array(12).fill(0));
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const sendAudioData = (audioBlob) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      audioBlob.arrayBuffer().then(buffer => {
        wsRef.current.send(buffer);
      });
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const animate = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Create bars based on frequency data
      const bars = [];
      const barCount = 12;
      const step = Math.floor(bufferLength / barCount);
      
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255;
        bars.push(value);
      }
      
      setAudioBars(bars);
      setAudioLevel(Math.max(...bars));
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const animateAudioBars = () => {
    // Simulate audio visualization when receiving audio
    let frame = 0;
    const animate = () => {
      const bars = Array(12).fill(0).map(() => 
        Math.random() * 0.8 + 0.2
      );
      setAudioBars(bars);
      
      frame++;
      if (frame < 30) { // Animate for about 1 second
        setTimeout(() => requestAnimationFrame(animate), 33);
      } else {
        setAudioBars(Array(12).fill(0));
      }
    };
    animate();
  };

  const sendTextMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text_message',
        content: message
      }));
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <input
            type="text"
            value={surveyCode}
            onChange={(e) => setSurveyCode(e.target.value)}
            style={styles.input}
            placeholder="Survey Code"
          />
          <input
            type="text"
            value={responderId}
            onChange={(e) => setResponderId(e.target.value)}
            style={styles.input}
            placeholder="Responder ID"
          />
          {!isConnected ? (
            <button
              onClick={connect}
              style={styles.button}
            >
              Connect
            </button>
          ) : (
            <span style={styles.connected}>Connected</span>
          )}
        </div>
        <button
          onClick={disconnect}
          style={styles.closeButton}
        >
          ✕
        </button>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressWrapper}>
          <div style={styles.progressBar}>
            <div 
              style={{...styles.progressFill, width: `${progress}%`}}
            />
          </div>
          <span style={styles.progressText}>{progress}% • {timeRemaining}</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Message */}
        <div style={styles.messageContainer}>
          <p style={styles.message}>
            {currentMessage}
          </p>
        </div>

        {/* Audio Visualization */}
        <div style={styles.audioVisualization}>
          {audioBars.map((bar, index) => (
            <div
              key={index}
              style={{
                ...styles.audioBar,
                height: `${Math.max(bar * 60, 4)}px`,
                opacity: bar > 0 ? 1 : 0.3
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          {/* Text Speed */}
          <button style={styles.controlButton}>
            Aa
          </button>

          {/* Skip */}
          <button style={styles.controlButton}>
            ⏭
          </button>

          {/* Main Record/Pause Button */}
          <button
            onClick={() => {
              if (!isConnected) return;
              
              if (isRecording) {
                if (isPaused) {
                  resumeRecording();
                } else {
                  pauseRecording();
                }
              } else {
                startRecording();
              }
            }}
            disabled={!isConnected}
            style={{
              ...styles.mainButton,
              ...(isConnected ? styles.mainButtonActive : styles.mainButtonInactive),
              ...(isRecording && !isPaused ? styles.recording : {})
            }}
          >
            {isRecording ? (
              isPaused ? '▶' : '⏸'
            ) : (
              '🎤'
            )}
          </button>

          {/* Restart */}
          <button 
            onClick={() => {
              stopRecording();
              setProgress(0);
              setCurrentMessage("Ready to start...");
            }}
            style={styles.controlButton}
          >
            ↻
          </button>

          {/* Stop Recording */}
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            style={{
              ...styles.controlButton,
              backgroundColor: isRecording ? '#dc2626' : '#4a4a4a'
            }}
          >
            ⏹
          </button>
        </div>

        {/* Test Controls */}
        <div style={styles.testControls}>
          <button
            onClick={() => sendTextMessage("Hello")}
            disabled={!isConnected}
            style={{
              ...styles.testButton,
              opacity: isConnected ? 1 : 0.5,
              cursor: isConnected ? 'pointer' : 'not-allowed'
            }}
          >
            Send "Hello"
          </button>
          <button
            onClick={() => sendTextMessage("Skip")}
            disabled={!isConnected}
            style={{
              ...styles.testButton,
              opacity: isConnected ? 1 : 0.5,
              cursor: isConnected ? 'pointer' : 'not-allowed'
            }}
          >
            Send "Skip"
          </button>
          <button
            onClick={() => sendTextMessage("Help")}
            disabled={!isConnected}
            style={{
              ...styles.testButton,
              opacity: isConnected ? 1 : 0.5,
              cursor: isConnected ? 'pointer' : 'not-allowed'
            }}
          >
            Send "Help"
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        {isConnected ? (
          <span style={styles.connected}>
            Connected to survey • {isRecording ? 'Recording...' : 'Ready'}
          </span>
        ) : (
          <span>Not connected</span>
        )}
      </div>

      {/* Add pulse animation via CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default VoiceSurveyApp;