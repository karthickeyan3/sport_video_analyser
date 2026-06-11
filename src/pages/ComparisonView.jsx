import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Activity, Play, Pause, RefreshCcw, FileDown } from 'lucide-react';
import { BiomechanicsTracker } from '../utils/biomechanics';
import { SPORTS_CONFIG } from '../utils/sportsConfig';
import LiveAnalysisGraph from '../components/LiveAnalysisGraph';
import OverlayLineChart from '../components/OverlayLineChart';

const VideoAnalysisSection = ({
  title,
  type, // 'elite' or 'user'
  videoFile,
  isAnalyzing,
  progress,
  history,
  metricConfig,
  currentSportConfig,
  onUpload,
  onStart,
  onStop,
  onReset,
  onVideoLoad,
  videoRef,
  canvasRef,
  themeColor,
  isBothUploaded
}) => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '16px', background: themeColor }}></div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: themeColor, textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</h3>
          </div>
          <button onClick={onReset} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCcw size={14} /> Reset
          </button>
        </div>

        <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!videoFile ? (
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={48} style={{ marginBottom: '16px', color: themeColor }} />
              <label className="glow-btn" style={{ cursor: 'pointer', padding: '12px 24px', background: type === 'elite' ? 'linear-gradient(135deg, #ffb300, #ff8f00)' : undefined }}>
                <span>Upload {type === 'elite' ? 'Benchmark' : 'Your Run'}</span>
                <input type="file" style={{ display: 'none' }} accept="video/*" onChange={onUpload} />
              </label>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                src={videoFile} 
                playsInline 
                muted 
                onLoadedMetadata={onVideoLoad}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
              <canvas 
                ref={canvasRef} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} 
              />
            </>
          )}
        </div>

        {videoFile && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!isAnalyzing ? (
              !isBothUploaded && (
                <button onClick={onStart} className="glow-btn" style={{ padding: '10px 20px', fontSize: '0.9rem', flex: '0 0 auto', background: type === 'elite' ? 'linear-gradient(135deg, #ffb300, #ff8f00)' : undefined }}>
                  <Play size={16} fill="white" /> Analyze
                </button>
              )
            ) : (
              <button onClick={onStop} style={{ background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', color: '#ff6b6b', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, flex: '0 0 auto' }}>
                <Pause size={16} fill="#ff6b6b" /> Stop
              </button>
            )}
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                <span>{isAnalyzing ? 'TRACKING ACTIVE' : 'SYSTEM READY'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${progress}%` }} 
                  style={{ height: '100%', background: themeColor, boxShadow: `0 0 10px ${themeColor}` }} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
         <h4 style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>{title} Signature</h4>
         {history.length > 0 ? (
           <LiveAnalysisGraph 
             history={history} 
             sportConfig={currentSportConfig} 
             isFinished={!!videoFile && !isAnalyzing}
           />
         ) : (
           <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)' }}>
             <Activity size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
             <p style={{ fontSize: '0.85rem' }}>No data yet.</p>
           </div>
         )}
      </div>
    </div>
  );
};

const ComparisonPage = ({ onBack }) => {
  // Only Running implemented initially as per requirements
  const selectedSport = 'RUNNING';
  const currentSportConfig = SPORTS_CONFIG[selectedSport];
  
  const [selectedParam, setSelectedParam] = useState(currentSportConfig.metrics[0].key);

  // States for Elite
  const [eliteVideoFile, setEliteVideoFile] = useState(null);
  const [isAnalyzingElite, setIsAnalyzingElite] = useState(false);
  const [eliteProgress, setEliteProgress] = useState(0);
  const [eliteHistory, setEliteHistory] = useState([]);
  
  // States for User
  const [userVideoFile, setUserVideoFile] = useState(null);
  const [isAnalyzingUser, setIsAnalyzingUser] = useState(false);
  const [userProgress, setUserProgress] = useState(0);
  const [userHistory, setUserHistory] = useState([]);

  // Refs
  const eliteVideoRef = useRef(null);
  const eliteCanvasRef = useRef(null);
  const eliteTrackerRef = useRef(new BiomechanicsTracker(selectedSport));
  const elitePoseRef = useRef(null);
  const eliteRequestRef = useRef(null);

  const userVideoRef = useRef(null);
  const userCanvasRef = useRef(null);
  const userTrackerRef = useRef(new BiomechanicsTracker(selectedSport));
  const userPoseRef = useRef(null);
  const userRequestRef = useRef(null);

  useEffect(() => {
    if (!window.Pose) {
      console.error("AI Engine not loaded. Retrying in 1s...");
      setTimeout(() => window.location.reload(), 1000);
      return;
    }

    // Initialize both independent Pose instances
    const initPose = async (poseRef, isElite) => {
      poseRef.current = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });
      poseRef.current.setOptions({
        modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
      });

      poseRef.current.onResults((results) => {
        const canvas = isElite ? eliteCanvasRef.current : userCanvasRef.current;
        const video = isElite ? eliteVideoRef.current : userVideoRef.current;
        const tracker = isElite ? eliteTrackerRef.current : userTrackerRef.current;
        
        if (!canvas || !results.poseLandmarks) return;
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const color = isElite ? '#ffb300' : '#00e5ff';

        if (window.drawConnectors) {
          window.drawConnectors(ctx, results.poseLandmarks, [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            [11, 23], [12, 24], [23, 24],
            [23, 25], [25, 27], [24, 26], [26, 28],
            [27, 29], [27, 31], [29, 31], [28, 30], [28, 32], [30, 32]
          ], { color: color, lineWidth: 3 });
        }
        if (window.drawLandmarks) {
          window.drawLandmarks(ctx, results.poseLandmarks, { color: 'white', lineWidth: 1, radius: 2 });
        }

        const frameNum = video ? Math.round(video.currentTime * 30) : 0;
        tracker.update(results.poseLandmarks, video ? video.currentTime : 0, frameNum);
        
        if (isElite) setEliteHistory([...tracker.history]);
        else setUserHistory([...tracker.history]);

        ctx.restore();
      });

      try { await poseRef.current.initialize(); } catch (e) { }
    };

    initPose(elitePoseRef, true);
    initPose(userPoseRef, false);

    return () => {
      if (eliteRequestRef.current) cancelAnimationFrame(eliteRequestRef.current);
      if (userRequestRef.current) cancelAnimationFrame(userRequestRef.current);
      if (elitePoseRef.current) elitePoseRef.current.close();
      if (userPoseRef.current) userPoseRef.current.close();
    };
  }, []);

  const handleUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    
    if (type === 'elite') {
      setEliteVideoFile(url);
      eliteTrackerRef.current = new BiomechanicsTracker(selectedSport);
      setEliteHistory([]);
      setEliteProgress(0);
      setIsAnalyzingElite(false);
    } else {
      setUserVideoFile(url);
      userTrackerRef.current = new BiomechanicsTracker(selectedSport);
      setUserHistory([]);
      setUserProgress(0);
      setIsAnalyzingUser(false);
    }
  };

  const handleVideoLoad = (type) => {
    if (type === 'elite' && eliteVideoRef.current && eliteCanvasRef.current) {
      eliteCanvasRef.current.width = eliteVideoRef.current.videoWidth;
      eliteCanvasRef.current.height = eliteVideoRef.current.videoHeight;
    } else if (type === 'user' && userVideoRef.current && userCanvasRef.current) {
      userCanvasRef.current.width = userVideoRef.current.videoWidth;
      userCanvasRef.current.height = userVideoRef.current.videoHeight;
    }
  };

  const startAnalysis = async (type) => {
    const isElite = type === 'elite';
    const videoRef = isElite ? eliteVideoRef : userVideoRef;
    const poseRef = isElite ? elitePoseRef : userPoseRef;
    const setProgress = isElite ? setEliteProgress : setUserProgress;
    const setAnalyzing = isElite ? setIsAnalyzingElite : setIsAnalyzingUser;
    const requestRef = isElite ? eliteRequestRef : userRequestRef;
    const canvasRef = isElite ? eliteCanvasRef : userCanvasRef;

    if (!videoRef.current) return;
    setAnalyzing(true);

    if (canvasRef.current && videoRef.current) {
       canvasRef.current.width = videoRef.current.videoWidth;
       canvasRef.current.height = videoRef.current.videoHeight;
    }

    videoRef.current.play().then(() => {
      const analyzeFrame = async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
          if (videoRef.current?.ended) stopAnalysis(type);
          return;
        }

        try {
          // Double check ref before sending
          if (poseRef.current && videoRef.current) {
            await poseRef.current.send({ image: videoRef.current });
          }
        } catch (err) {
          console.error(`AI Frame processing error (${type}):`, err);
        }
        
        if (videoRef.current && !videoRef.current.paused) {
          setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
          requestRef.current = requestAnimationFrame(analyzeFrame);
        }
      };
      
      requestRef.current = requestAnimationFrame(analyzeFrame);
    }).catch(err => {
      console.error("Video play failed:", err);
      setAnalyzing(false);
    });
  };

  const stopAnalysis = (type) => {
    const isElite = type === 'elite';
    if (isElite) {
      setIsAnalyzingElite(false);
      if (eliteVideoRef.current) eliteVideoRef.current.pause();
      if (eliteRequestRef.current) cancelAnimationFrame(eliteRequestRef.current);
      // Clear skeleton
      if (eliteCanvasRef.current) {
        const ctx = eliteCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, eliteCanvasRef.current.width, eliteCanvasRef.current.height);
      }
    } else {
      setIsAnalyzingUser(false);
      if (userVideoRef.current) userVideoRef.current.pause();
      if (userRequestRef.current) cancelAnimationFrame(userRequestRef.current);
      // Clear skeleton
      if (userCanvasRef.current) {
        const ctx = userCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, userCanvasRef.current.width, userCanvasRef.current.height);
      }
    }
  };

  const clearSection = (type) => {
    if (type === 'elite') {
      setEliteVideoFile(null);
      setEliteHistory([]);
      eliteTrackerRef.current = new BiomechanicsTracker(selectedSport);
      setEliteProgress(0);
      setIsAnalyzingElite(false);
    } else {
      setUserVideoFile(null);
      setUserHistory([]);
      userTrackerRef.current = new BiomechanicsTracker(selectedSport);
      setUserProgress(0);
      setIsAnalyzingUser(false);
    }
  };

  const downloadComparisonCSV = () => {
    if (eliteHistory.length === 0 && userHistory.length === 0) return;

    const metrics = currentSportConfig.metrics;
    
    // Header
    const headers = ['Relative Time (s)'];
    metrics.forEach(m => {
      headers.push(`${m.label} (Elite)`);
      headers.push(`${m.label} (User)`);
      headers.push(`${m.label} Diff`);
    });
    
    const csvRows = [headers.join(',')];
    
    // We align by sequence index or duration, starting from 0.0s for both
    const step = 1/30; // 30fps steps
    const eliteStart = eliteHistory.length > 0 ? eliteHistory[0].time_sec : 0;
    const userStart = userHistory.length > 0 ? userHistory[0].time_sec : 0;
    
    const eliteDuration = eliteHistory.length > 0 ? (eliteHistory[eliteHistory.length-1].time_sec - eliteStart) : 0;
    const userDuration = userHistory.length > 0 ? (userHistory[userHistory.length-1].time_sec - userStart) : 0;
    const maxDuration = Math.max(eliteDuration, userDuration);

    for (let t = 0; t <= maxDuration; t += step) {
      // Find closest data points based on relative time
      const eliteRelTime = t + eliteStart;
      const userRelTime = t + userStart;

      const eliteData = eliteHistory.find(h => Math.abs(h.time_sec - eliteRelTime) < (step / 2 + 0.001));
      const userData = userHistory.find(h => Math.abs(h.time_sec - userRelTime) < (step / 2 + 0.001));
      
      if (!eliteData && !userData) continue;
      
      const row = [t.toFixed(3)];
      metrics.forEach(m => {
        const eVal = eliteData ? eliteData[m.key] : null;
        const uVal = userData ? userData[m.key] : null;
        
        row.push(eVal !== null ? eVal.toFixed(4) : '');
        row.push(uVal !== null ? uVal.toFixed(4) : '');
        
        if (eVal !== null && uVal !== null) {
          row.push((uVal - eVal).toFixed(4));
        } else {
          row.push('');
        }
      });
      csvRows.push(row.join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `comparative_analysis_${currentSportConfig.name.toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startDualAnalysis = async () => {
    // Start Elite first
    await startAnalysis('elite');
    // Stagger slightly to avoid MediaPipe competition
    setTimeout(async () => {
      await startAnalysis('user');
    }, 150);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Start Analysis Button (Common) */}
      {eliteVideoFile && userVideoFile && !isAnalyzingElite && !isAnalyzingUser && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <button 
            onClick={startDualAnalysis}
            className="glow-btn pulse-primary" 
            style={{ padding: '16px 48px', borderRadius: '100px', fontSize: '1.1rem', fontWeight: 800, gap: '12px' }}
          >
            <Play fill="currentColor" size={24} /> Start Dual Analysis
          </button>
        </div>
      )}

      {/* Split Videos & Radar Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        <VideoAnalysisSection
          title="Elite Benchmark"
          type="elite"
          videoFile={eliteVideoFile}
          isAnalyzing={isAnalyzingElite}
          progress={eliteProgress}
          history={eliteHistory}
          metricConfig={currentSportConfig.metrics[0]}
          currentSportConfig={currentSportConfig}
          onUpload={(e) => handleUpload(e, 'elite')}
          onStart={() => startAnalysis('elite')}
          onStop={() => stopAnalysis('elite')}
          onReset={() => clearSection('elite')}
          onVideoLoad={() => handleVideoLoad('elite')}
          videoRef={eliteVideoRef}
          canvasRef={eliteCanvasRef}
          themeColor="#ffb300"
          isBothUploaded={!!(eliteVideoFile && userVideoFile)}
        />

        <VideoAnalysisSection
          title="User Analysis"
          type="user"
          videoFile={userVideoFile}
          isAnalyzing={isAnalyzingUser}
          progress={userProgress}
          history={userHistory}
          metricConfig={currentSportConfig.metrics[0]}
          currentSportConfig={currentSportConfig}
          onUpload={(e) => handleUpload(e, 'user')}
          onStart={() => startAnalysis('user')}
          onStop={() => stopAnalysis('user')}
          onReset={() => clearSection('user')}
          onVideoLoad={() => handleVideoLoad('user')}
          videoRef={userVideoRef}
          canvasRef={userCanvasRef}
          themeColor="var(--primary)"
          isBothUploaded={!!(eliteVideoFile && userVideoFile)}
        />
      </div>

      {/* Metric Overlay Selector and Graph */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Select Metric to Compare Over Time</h4>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
              {currentSportConfig.metrics.map(m => (
                <button
                  key={m.key}
                  onClick={() => setSelectedParam(m.key)}
                  style={{
                    background: selectedParam === m.key ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedParam === m.key ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                    color: selectedParam === m.key ? 'white' : 'rgba(255,255,255,0.5)',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {(eliteHistory.length > 0 || userHistory.length > 0) && (
            <button 
              onClick={downloadComparisonCSV}
              className="glow-btn pulse-primary" 
              style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem' }}
            >
              <FileDown size={18} /> Export Comparison CSV
            </button>
          )}
        </div>

        <OverlayLineChart 
          userHistory={userHistory} 
          eliteHistory={eliteHistory} 
          selectedParam={selectedParam} 
          sportConfig={currentSportConfig} 
        />
      </div>
    </div>
  );
};

export default ComparisonPage;
