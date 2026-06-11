import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, FileDown, Activity, Play, Pause, RefreshCcw, Grid } from 'lucide-react';
import { BiomechanicsTracker } from '../utils/biomechanics';
import LiveAnalysisGraph from '../components/LiveAnalysisGraph';
import ParameterTrendChart from '../components/ParameterTrendChart';
import { SPORTS_CONFIG } from '../utils/sportsConfig';
import SportSelector from '../components/SportSelector';
import ParameterSelector from '../components/ParameterSelector';
import MultiParameterView from '../components/MultiParameterView';
import ComparisonView from './ComparisonView';
import { GitCompare } from 'lucide-react';

const AnalysisPage = ({ onBack }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [csvUrl, setCsvUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isMPLoaded, setIsMPLoaded] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [showDataTable, setShowDataTable] = useState(false);
  const [videoAspect, setVideoAspect] = useState(16 / 9);
  const [activeConfig, setActiveConfig] = useState(SPORTS_CONFIG);
  const [selectedSport, setSelectedSport] = useState('RUNNING');
  const [selectedParam, setSelectedParam] = useState(null); // Default to null for modal
  const [showChartModal, setShowChartModal] = useState(false);
  const [viewMode, setViewMode] = useState('MAIN'); // 'MAIN' or 'DASHBOARD'
  const [tick, setTick] = useState(0); // Used to force refresh dashboard

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(new BiomechanicsTracker(selectedSport));
  const poseRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    const handleConfigUpdate = () => {
      // Re-fetch the live config from the updated global object
      setActiveConfig({ ...SPORTS_CONFIG });
      
      // Safety check: If current sport was deleted, switch to the first one available
      if (!SPORTS_CONFIG[selectedSport]) {
        const firstKey = Object.keys(SPORTS_CONFIG)[0];
        setSelectedSport(firstKey);
        setSelectedParam(SPORTS_CONFIG[firstKey].metrics[0].key);
        trackerRef.current = new BiomechanicsTracker(firstKey);
      } else {
        // If current sport still exists, ensure selected metric exists too
        const currentMetrics = SPORTS_CONFIG[selectedSport].metrics;
        if (!currentMetrics.find(m => m.key === selectedParam)) {
          setSelectedParam(currentMetrics[0].key);
        }
      }
    };
    window.addEventListener('sports_config_updated', handleConfigUpdate);
    return () => window.removeEventListener('sports_config_updated', handleConfigUpdate);
  }, [selectedSport, selectedParam]);

  useEffect(() => {
    // Initialize MediaPipe Pose from Global Scope
    if (!window.Pose) {
      console.error("AI Engine not loaded yet. Retrying in 1s...");
      setTimeout(() => window.location.reload(), 1000);
      return;
    }

    poseRef.current = new window.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
    });

    poseRef.current.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    poseRef.current.onResults((results) => {
      if (!results.poseLandmarks || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw landmarks using global drawing utilities
      if (window.drawConnectors) {
        window.drawConnectors(ctx, results.poseLandmarks, [
          [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Upper body
          [11, 23], [12, 24], [23, 24], // Torso
          [23, 25], [25, 27], [24, 26], [26, 28], // Legs
          [27, 29], [27, 31], [29, 31], [28, 30], [28, 32], [30, 32] // Feet
        ], { color: '#00e5ff', lineWidth: 4 });
      }
      
      if (window.drawLandmarks) {
        window.drawLandmarks(ctx, results.poseLandmarks, {
          color: '#ff0070',
          lineWidth: 2,
          radius: 4,
        });
      }

      // Overlay status
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 20px Outfit';
      ctx.fillText('● AI ANALYZING', 20, 40);

      // Update metrics with frame number for accuracy
      const frameNum = videoRef.current ? Math.round(videoRef.current.currentTime * 30) : 0;
      const currentMetrics = trackerRef.current.update(
        results.poseLandmarks, 
        videoRef.current ? videoRef.current.currentTime : 0,
        frameNum
      );
      
      if (currentMetrics) {
        setMetrics(currentMetrics);
        setFrameCount(trackerRef.current.history.length);
        setTick(t => t + 1);
      }

      ctx.restore();
    });

    // Initialize Pose
    const initPose = async () => {
      try {
        await poseRef.current.initialize();
        console.log("MediaPipe Pose initialized successfully");
        setIsMPLoaded(true);
      } catch (err) {
        console.warn("Pose initialize error (common with HMR):", err.message);
        // We don't mark as failed because it often works anyway on first .send()
        if (!isMPLoaded) setIsMPLoaded(true); 
      }
    };

    initPose();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (poseRef.current) poseRef.current.close();
    };
  }, []);

  // Handle parameter selection -> open modal (HIDDEN FOR NOW)
  const handleParamSelect = (paramKey) => {
    setSelectedParam(paramKey);
    // setShowChartModal(true); // Commented out to hide popup
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("File selected:", file.name, file.type);
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      setCsvUrl(null);
      setMetrics(null);
      setFrameCount(0);
      setIsAnalyzing(false);
      setProgress(0);
      setShowDataTable(false);
      trackerRef.current = new BiomechanicsTracker(selectedSport);
      
      // Delay to ensure videoRef is available
      setTimeout(() => {
        if (videoRef.current) videoRef.current.load();
      }, 100);
    }
  };

  const onVideoLoad = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const aspect = video.videoWidth / video.videoHeight;
      setVideoAspect(aspect);
      
      // Set internal resolution to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log(`Video loaded: ${video.videoWidth}x${video.videoHeight}, Aspect: ${aspect}`);
    }
  };

  const startAnalysis = async () => {
    if (!videoRef.current) return;
    setIsAnalyzing(true);
    videoRef.current.play();
    
    const analyzeFrame = async () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        try {
          await poseRef.current.send({ image: videoRef.current });
        } catch (err) {
          console.error("Frame processing error:", err);
        }
        
        if (videoRef.current) {
          setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
          requestRef.current = requestAnimationFrame(analyzeFrame);
        }
      } else if (videoRef.current?.ended) {
        stopAnalysis();
      }
    };
    
    requestRef.current = requestAnimationFrame(analyzeFrame);
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    if (videoRef.current) videoRef.current.pause();
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    // Clear canvas when analysis stops
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    // Set metrics to final average summary
    const summary = trackerRef.current.getSessionSummary();
    if (summary) {
      setMetrics(summary);
    }

    // Generate CSV
    const csvContent = trackerRef.current.generateCSV(currentSportConfig);
    if (trackerRef.current.history.length > 0) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      setCsvUrl(url);
    } else {
      console.warn("No data collected during analysis.");
    }
  };

  const resetAnalysis = () => {
    setVideoFile(null);
    setCsvUrl(null);
    setMetrics(null);
    setFrameCount(0);
    setShowDataTable(false);
    setIsAnalyzing(false);
    setProgress(0);
    trackerRef.current = new BiomechanicsTracker(selectedSport);
  };

  const currentSportConfig = activeConfig[selectedSport];


  return (
    <div className="max-width-container" style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Waveform Dashboard View (Overlay) */}
      <div style={{ display: viewMode === 'DASHBOARD' ? 'block' : 'none', width: '100%', height: '100%' }}>
        <MultiParameterView 
          history={[...trackerRef.current.history]} 
          metrics={metrics}
          sportConfig={currentSportConfig} 
          onBack={() => setViewMode('MAIN')} 
          tick={tick}
        />
      </div>

      {/* Shared Toolbar for MAIN and COMPARE views */}
      {(viewMode === 'MAIN' || viewMode === 'COMPARE') && (
        <div className="max-width-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <button onClick={onBack} style={{ 
            background: 'none', 
            border: 'none', 
            color: 'rgba(255,255,255,0.6)', 
            padding: '8px 0',
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer',
            fontSize: 'clamp(0.8rem, 3vw, 0.9rem)'
          }}>
            <ArrowLeft size={18} /> Back
          </button>

        <div style={{ display: 'flex', gap: '8px', zIndex: 50, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          
          <SportSelector 
            value={selectedSport} 
            onChange={(val) => {
              setSelectedSport(val);
              setSelectedParam(activeConfig[val].metrics[0].key);
              trackerRef.current = new BiomechanicsTracker(val);
              if (val !== 'RUNNING' && viewMode === 'COMPARE') {
                setViewMode('MAIN');
              }
            }}
            config={activeConfig}
          /> 
          {/* 
          <ParameterSelector 
            metrics={currentSportConfig.metrics} 
            value={selectedParam || currentSportConfig.metrics[0].key} 
            onChange={handleParamSelect} 
            sportConfig={currentSportConfig} 
          />
          */}

          <button 
            onClick={() => setViewMode('DASHBOARD')}
            style={{ 
              background: 'rgba(0, 229, 255, 0.05)', 
              border: '1px solid rgba(0, 229, 255, 0.2)', 
              color: 'var(--primary)', 
              padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 20px)', 
              borderRadius: '10px', 
              fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            className="hover-fade"
          >
            <Grid size={16} /> Dashboard
          </button>

          {selectedSport === 'RUNNING' && (
            <button 
              onClick={() => setViewMode(viewMode === 'COMPARE' ? 'MAIN' : 'COMPARE')}
              style={{ 
                background: viewMode === 'COMPARE' ? 'rgba(255, 179, 0, 0.2)' : 'rgba(255, 179, 0, 0.05)', 
                border: viewMode === 'COMPARE' ? '1px solid #ffb300' : '1px solid rgba(255, 179, 0, 0.2)', 
                color: '#ffb300', 
                padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 20px)', 
                borderRadius: '10px', 
                fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              className="hover-fade"
            >
              <GitCompare size={16} /> {viewMode === 'COMPARE' ? 'Close' : 'Compare'}
            </button>
          )}

          <button 
            onClick={resetAnalysis}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: 'rgba(255,255,255,0.8)', 
              padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 20px)', 
              borderRadius: '10px', 
              fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)',
              fontWeight: 500,
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            className="hover-fade"
          >
            <RefreshCcw size={16} /> New
          </button>
          </div>
        </div>
      )}

      {/* Comparison View */}
      <div style={{ display: viewMode === 'COMPARE' ? 'block' : 'none', width: '100%', flex: 1 }}>
        {selectedSport === 'RUNNING' && <ComparisonView />}
      </div>

      {/* Main Analysis View */}
      <div style={{ display: viewMode === 'MAIN' ? 'flex' : 'none', flexDirection: 'column', width: '100%' }}>
        <div className="analysis-vertical-flow" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Top Split Section: Video vs Graph */}
        <div className="analysis-grid">
          {/* Left: Video Section */}
          <section className="video-section">
            <div className="glass-card" style={{ padding: 'clamp(12px, 3vw, 16px)', flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '3px', height: '16px', background: 'var(--primary)' }}></div>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '1px' }}>AI VISION</h3>
              </div>
              
              <div className={`video-container-wrapper ${videoAspect < 1 ? 'portrait' : ''}`} style={{ 
                aspectRatio: videoAspect || '16/9',
                maxHeight: videoAspect < 1 ? '450px' : 'none'
              }}>
                {!videoFile ? (
                  <div style={{ padding: '40px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload size={48} style={{ marginBottom: '16px', color: 'var(--primary)' }} />
                    <label className="glow-btn" style={{ cursor: 'pointer', padding: '12px 32px' }}>
                       <span>Browse Video</span>
                      <input type="file" style={{ display: 'none' }} accept="video/*" onChange={handleFileUpload} />
                    </label>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      src={videoFile} 
                      playsInline 
                      muted 
                      style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }} 
                      onLoadedMetadata={onVideoLoad} 
                    />
                    <canvas 
                      ref={canvasRef} 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} 
                    />
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Right: Graph Section */}
          <section className="graph-section">
            <div className="glass-card" style={{ padding: 'clamp(16px, 4vw, 24px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '3px', height: '16px', background: 'var(--primary)' }}></div>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '1px' }}>BIOMETRIC RADAR</h3>
              </div>
              
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', minHeight: '280px' }}>
                {(isAnalyzing || progress === 100) && trackerRef.current.history.length > 0 ? (
                  <LiveAnalysisGraph 
                    history={[...trackerRef.current.history]} 
                    sportConfig={currentSportConfig} 
                    isFinished={progress === 100 && !isAnalyzing}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', textAlign: 'center' }}>
                    <Activity size={48} style={{ marginBottom: '16px', opacity: 0.5 }} className={isAnalyzing ? "spinning" : ""} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                      {progress === 0 && !isAnalyzing ? 'Ready for Bio-Metric Stream' : 
                       progress > 0 && progress < 100 ? 'Processing Engine Data...' : 'Analysis Complete'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* AI Controls Section (Separate Bar) */}
        {videoFile && (
          <div className="glass-card" style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
            <div style={{ flex: '1 0 220px' }}>
              {!isAnalyzing ? (
                <button onClick={startAnalysis} className="glow-btn" style={{ width: '100%', minWidth: 'unset' }}>
                  <Play size={18} fill="currentColor" /> Start AI Analysis
                </button>
              ) : (
                <button onClick={stopAnalysis} style={{ width: '100%', background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', color: '#ff6b6b', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 700, transition: 'all 0.2s' }}>
                  <Pause size={18} fill="#ff6b6b" /> Stop tracking
                </button>
              )}
            </div>
            
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.5px' }}>
                <span>ENGINE: {isAnalyzing ? 'TRACKING' : 'READY'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${progress}%` }} 
                   style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', boxShadow: '0 0 10px var(--primary)' }} 
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Live Metrics Section */}
        <section className="metrics-grid-section">
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity color="var(--primary)" size={20} />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Real-Time Biometrics</h3>
              </div>
            </div>
            <div className="metrics-row" style={{ marginBottom: '16px' }}>
              {currentSportConfig.metrics.map((m, i) => {
                const val = metrics ? metrics[m.key] : null;
                const isMistake = metrics && !metrics.isSummary && (
                  (m.min !== undefined && val < m.min) || 
                  (m.max !== undefined && val > m.max)
                );

                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedParam(m.key)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '12px', 
                      background: selectedParam === m.key ? `rgba(${selectedSport === 'RUNNING' ? '0, 229, 255' : '74, 222, 128'}, 0.1)` : 'rgba(255,255,255,0.02)', 
                      borderRadius: '12px', 
                      border: '1px solid',
                      borderColor: selectedParam === m.key ? currentSportConfig.primaryColor : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: selectedParam === m.key ? 'scale(1.02)' : 'scale(1)',
                      position: 'relative'
                    }}
                  >
                    <span style={{ color: selectedParam === m.key ? 'white' : 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: selectedParam === m.key ? 600 : 400, display: 'flex', flexDirection: 'column' }}>
                      {m.label}
                      {metrics?.isSummary && !['step_count', 'cadence'].includes(m.key) && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--primary)', opacity: 0.8 }}>SESSION AVG</span>
                      )}
                    </span>
                    <span style={{ fontWeight: 700, color: isMistake ? '#ff4444' : currentSportConfig.primaryColor, fontSize: '1.1rem' }}>
                      {metrics ? (typeof val === 'number' ? 
                        (m.unit === 'm' || m.unit === 'm/s' ? val.toFixed(2) :
                         m.key === 'stride_width' ? val.toFixed(3) : 
                         m.key === 'time_sec' ? val.toFixed(2) : 
                         Math.round(val)) : val) : '--'}
                      {m.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Action & Results Section */}
        <section className="actions-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>


          <AnimatePresence>
            {csvUrl && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '32px', width: '100%', textAlign: 'center', background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05), rgba(112, 0, 255, 0.05))', borderColor: 'var(--primary)' }}>
                <h3 style={{ margin: '0 0 8px' }}>Analysis Processing Complete</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>Captured {frameCount} high-fidelity tracking points.</p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <a href={csvUrl} download="biomechanics_results.csv" className="glow-btn" style={{ textDecoration: 'none', padding: '16px 40px' }}><FileDown size={18} /> Export CSV Data</a>
                  <button onClick={() => setShowDataTable(!showDataTable)} style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '16px 40px', borderRadius: '12px', cursor: 'pointer' }}>{showDataTable ? 'Hide Data' : 'Preview Data'}</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showDataTable && trackerRef.current.history.length > 0 && (
            <div className="glass-card" style={{ padding: '24px', width: '100%', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '12px' }}>Time (s)</th>
                    {currentSportConfig.metrics.slice(0, 4).map(m => (
                      <th key={m.key} style={{ padding: '12px' }}>{m.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trackerRef.current.history.slice(0, 50).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 12px' }}>{row.time_sec.toFixed(2)}s</td>
                      {currentSportConfig.metrics.slice(0, 4).map(m => (
                        <td key={m.key} style={{ padding: '10px 12px' }}>
                          {typeof row[m.key] === 'number' ? (
                            m.unit === 'm' || m.unit === 'm/s' ? row[m.key].toFixed(2) : 
                            m.key === 'stride_width' ? row[m.key].toFixed(3) :
                            Math.round(row[m.key])
                          ) : '--'}{m.unit}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
