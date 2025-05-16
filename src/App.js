import React, { useState, useEffect, useRef } from "react";
import "./App.css";


function App() {
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-GB", { hour12: false }));
  const [prediction, setPrediction] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [autoStop, setAutoStop] = useState(false);
  const videoRef = useRef(null);
  const lastLoopTimeRef = useRef(0);
  const triggeredRef = useRef({ first: false, second: false });
  const isDemo = false;
  const presentation = true;
  const logEndRef = useRef(null);


  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatDateTime = date =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ` +
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  

  const [demoLog, setDemoLog] = useState(() => {
    const types = ["Fallen Before", "Fallen After", "No Lid", "Bad Lid"];
    const initial = [];
  
    let baseTime = new Date(2025, 3, 1, 13, 0, 0); // Start May 1, 2024 at 13:00
  
    const formatDateTime = date =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ` +
      `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  
    for (let i = 0; i < 20; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const paddedType = type.padEnd(14);
  
      const detected = new Date(baseTime);
      baseTime.setDate(baseTime.getDate() + 1); // Advance 1 day
      baseTime.setMinutes(baseTime.getMinutes() + Math.floor(Math.random() * 10) + 1); // Add 1–10 minutes
      baseTime.setSeconds(baseTime.getSeconds() + Math.floor(Math.random() * 60));     // Add 0–59 seconds
  
      initial.push(`${paddedType} ${formatDateTime(detected)}`);
    }
  
    return initial;
  });
  
  
  const addDemoLine = (type, detected, fixed) => {
    const paddedType = type.padEnd(14);
    const line = `${paddedType} ${detected}`;
    setDemoLog(prev => [...prev, line]);
  };

  // Update the time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (presentation || isDemo) {
      scrollToBottom();
    }
  }, [demoLog]);

  useEffect(() => {
    if (!presentation) return;
  
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;
  
      const currentTime = video.currentTime;
  
      // Loop detected
      if (currentTime < lastLoopTimeRef.current) {
        triggeredRef.current = { first: false, second: false };
      }
  
      lastLoopTimeRef.current = currentTime;
  
      // First anomaly
      if (currentTime >= 21 && !triggeredRef.current.first) {
        const now = new Date();
        const detected = formatDateTime(now);
        addDemoLine("Fallen Before", detected);
        triggeredRef.current.first = true;
      }
  
      // Second anomaly
      if (currentTime >= 40 && !triggeredRef.current.second) {
        const now = new Date();
        const detected = formatDateTime(now);
        addDemoLine("No Lid", detected);
        triggeredRef.current.second = true;
      }
    }, 500); // Check every 500ms
  
    return () => clearInterval(interval);
  }, [presentation]);
  
  

  // Poll prediction every 2 seconds
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const response = await fetch("http://localhost:5000/predict");
        const data = await response.json();

        // Only update UI if a valid prediction exists
        if (data.prediction && data.prediction !== "No Anomaly") {
          setPrediction(data.prediction);
          setTimestamp(data.timestamp);
        }
      } catch (error) {
        console.error("Error fetching prediction:", error);
      }
    };

    const interval = setInterval(fetchPrediction, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleAutoStop = () => {
    setAutoStop(prev => !prev);
    console.log("AutoStop is now", !autoStop ? "ON" : "OFF");
  };

  return (
    <div className="app-container">
      {isDemo && (
        <div className="demo-banner">
          This is a demo version that due to lab restriction does not allow controlling the system
        </div>
      )}
      <div className="header">
        <div className="clock">{time}</div>
        <h1 className="title">Real-Time Anomaly Detection</h1>
        <img src={`${process.env.PUBLIC_URL}/images/Logo_HHN.png`} alt="Logo" className="small-image" />
      </div>

      <div className="main-content">
        <div className="live-container">
          {presentation ? (
            <video
              ref={videoRef}
              src="/video1.mp4"
              className="live-stream"
              controls
              autoPlay
              loop
              muted
            />
          ) : (
            <img
              src="http://localhost:5000/video"
              alt="Live Stream"
              className="live-stream"
            />
          )}
        </div>

        <div className="right-panel">
          <div className="controls-bar">
            <div className="spacer" />
            <div className="controls-title">Controls</div>
            <div className="controls-button">
              <button className={`btn btn-small ${autoStop ? "btn-green" : "btn-red"}`} onClick={toggleAutoStop}>
                AutoStop: {autoStop ? "ON" : "OFF"}
              </button>
            </div>
          </div>
          <button className="btn btn-green" onClick={() => console.log("Start clicked")}>
            START
          </button>
          <button className="btn btn-red" onClick={() => console.log("Stop clicked")}>
            STOP
          </button>
          <div className="info-box">
            {isDemo || presentation ? (
              <div className="log-list">
                {demoLog.map((line, idx) => (
                  <pre key={idx}>{line}</pre>
                ))}
                <div ref={logEndRef} />
              </div>
            ) : (
              <>
                <p><strong>Latest Prediction:</strong> {prediction || "Loading..."}</p>
                <p><strong>Timestamp:</strong> {timestamp}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
