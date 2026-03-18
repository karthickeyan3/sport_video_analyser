import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Download } from 'lucide-react';
import DownloadLineGraph from './DownloadLineGraph';

const MetricWaveformCard = ({ history, metrics, metric, sportConfig }) => {
  const { key, label, unit } = metric;
  const themeColor = sportConfig?.primaryColor || '#00e5ff';
  const isSummary = metrics?.isSummary;
  const metricConfig = useMemo(() => sportConfig?.metrics?.find(m => m.key === key), [sportConfig, key]);

  const chartData = useMemo(() => {
    if (!history || history.length < 2) return null;
    
    // Last 150 points for the waveform
    const data = history.slice(-150);
    const values = data.map(d => d[key] || 0);
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    const paddedMin = min - range * 0.25;
    const paddedMax = max + range * 0.25;
    const paddedRange = paddedMax - paddedMin || 1;

    const width = 400;
    const height = 120;
    
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (( (d[key] || 0) - paddedMin) / paddedRange) * height;
      return `${x},${y}`;
    }).join(' ');

    const current = isSummary ? metrics[key] : values[values.length - 1];
    
    // Mistake detection for current value (only during live analysis)
    let isCurrentMistake = false;
    if (metricConfig && !isSummary) {
      if (metricConfig.min !== undefined && current < metricConfig.min) isCurrentMistake = true;
      if (metricConfig.max !== undefined && current > metricConfig.max) isCurrentMistake = true;
    }

    return { points, current, isCurrentMistake, width, height, paddedMin, paddedRange };
  }, [history, key, isSummary, metrics, sportConfig, metricConfig]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}
      whileHover={{ y: -5, borderColor: `${themeColor}66` }}
      className="glass-card"
      style={{ 
        padding: '32px', 
        background: 'linear-gradient(135deg, rgba(20, 21, 26, 0.95) 0%, rgba(10, 11, 14, 0.98) 100%)', 
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        minHeight: '260px',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Accent */}
      <div style={{ 
        position: 'absolute', 
        top: '-50px', 
        right: '-50px', 
        width: '150px', 
        height: '150px', 
        background: themeColor, 
        filter: 'blur(100px)', 
        opacity: 0.05,
        pointerEvents: 'none'
      }}></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', background: `${themeColor}15` }}>
              <Activity size={14} color={themeColor} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Bio-Analysis
            </span>
          </div>
          <h4 style={{ margin: 0, fontSize: '1.4rem', color: 'white', fontWeight: 800, letterSpacing: '-0.2px' }}>{label}</h4>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <span style={{ 
            display: 'block', 
            color: isSummary ? themeColor : 'rgba(255,255,255,0.3)', 
            fontSize: '0.65rem', 
            fontWeight: 900, 
            letterSpacing: '1px', 
            marginBottom: '4px',
            visibility: isSummary && ['step_count', 'cadence', 'total_steps'].includes(key) ? 'hidden' : 'visible'
          }}>
            {isSummary ? 'SESSION AVG' : 'REAL-TIME'}
          </span>
          <span style={{ color: chartData?.isCurrentMistake ? '#ff4444' : 'white', fontWeight: 900, fontSize: '2.2rem', display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '4px', letterSpacing: '-1px' }}>
            {chartData ? (
              typeof chartData.current === 'number' ? (
                unit === 'm' || unit === 'm/s' ? chartData.current.toFixed(2) :
                key === 'stride_width' ? chartData.current.toFixed(3) :
                Math.round(chartData.current)
              ) : chartData.current
            ) : '--'}
            <span style={{ fontSize: '1rem', color: chartData?.isCurrentMistake && !isSummary ? '#ff4444' : themeColor, fontWeight: 700, opacity: 0.8 }}>{unit}</span>
          </span>
        </div>
      </div>

      <div style={{ 
        position: 'relative', 
        height: '110px', 
        width: '100%', 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '16px', 
        padding: '8px',
        border: '1px solid rgba(255,255,255,0.03)',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
      }}>
        {chartData ? (
          <svg 
            viewBox={`0 0 ${chartData.width} ${chartData.height}`} 
            style={{ width: '100%', height: '100%', overflow: 'visible' }} 
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`grad-${key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={themeColor} stopOpacity="0.4" />
                <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Safe Zone Highlighting */}
            {metricConfig && metricConfig.min !== undefined && metricConfig.max !== undefined && (
              <rect
                x="0"
                y={Math.max(0, chartData.height - ((metricConfig.max - chartData.paddedMin) / chartData.paddedRange) * chartData.height)}
                width={chartData.width}
                height={Math.max(0, ((metricConfig.max - metricConfig.min) / chartData.paddedRange) * chartData.height)}
                fill="rgba(255, 255, 255, 0.03)"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="4 4"
              />
            )}
            
            {/* Area Fill */}
            <motion.polyline 
              points={`${chartData.points} ${chartData.width},${chartData.height} 0,${chartData.height}`} 
              fill={`url(#grad-${key})`} 
              transition={{ duration: 0.2 }}
            />
            
            {/* Line */}
            <motion.polyline 
              points={chartData.points} 
              fill="none" 
              stroke={chartData.isCurrentMistake && !isSummary ? '#ff4444' : themeColor} 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              transition={{ duration: 0.2 }}
            />
          </svg>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px' }}>SYNCHRONIZING...</span>
          </div>
        )}
      </div>

      {/* ADDITIONAL FEATURE: DOWNLOAD CHART (Easy to comment out) 
      {history.length > 0 && (
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
          <DownloadLineGraph 
            history={history} 
            metric={metric} 
            sportConfig={sportConfig} 
            mode="SINGLE"
          />
        </div>
      )}
      */}
    </motion.div>
  );
};

export default MetricWaveformCard;
