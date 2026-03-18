import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, Activity, Zap } from 'lucide-react';
import DownloadLineGraph from './DownloadLineGraph';

const ParameterTrendChart = ({ history, selectedParam, label, sportConfig }) => {
  const metricConfig = useMemo(() => 
    sportConfig?.metrics?.find(m => m.key === selectedParam),
    [sportConfig, selectedParam]
  );

  const chartData = useMemo(() => {
    if (!history || history.length < 2) return null;
    
    const data = history.slice(-150);
    const values = data.map(d => d[selectedParam] || 0);
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const rawRange = max - min;
    const range = rawRange === 0 ? 1 : rawRange;
    
    const fullValues = history.map(d => d[selectedParam] || 0);
    const avg = fullValues.reduce((a, b) => a + b, 0) / history.length;
    
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const variance = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);

    const paddedMin = min - range * 0.15;
    const paddedMax = max + range * 0.15;
    const paddedRange = paddedMax - paddedMin || 1;

    const width = 800;
    const height = 220;
    const padding = { top: 40, right: 20, bottom: 40, left: 20 };
    
    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * (width - padding.left - padding.right);
      const y = height - padding.bottom - ((d[selectedParam] - paddedMin) / paddedRange) * (height - padding.top - padding.bottom);
      return `${x},${y}`;
    }).join(' ');

    const current = values[values.length - 1];
    let isCurrentMistake = false;
    if (metricConfig) {
      if (metricConfig.min !== undefined && current < metricConfig.min) isCurrentMistake = true;
      if (metricConfig.max !== undefined && current > metricConfig.max) isCurrentMistake = true;
    }

    return { points, width, height, min, max, current, isCurrentMistake, avg, variance };
  }, [history, selectedParam, sportConfig, metricConfig]);

  const activeInsight = useMemo(() => {
    return sportConfig?.insights?.[selectedParam] || { title: label, desc: 'Real-time biomechanical telemetry.' };
  }, [selectedParam, sportConfig, label]);

  if (!chartData) return (
    <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', gap: '12px' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: sportConfig?.primaryColor || 'var(--primary)', animation: 'pulse 1.5s infinite' }}></div>
      <p style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px' }}>WAITING FOR DATA...</p>
    </div>
  );

  const themeColor = sportConfig?.primaryColor || 'var(--primary)';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card"
      style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px', background: 'rgba(10, 10, 15, 0.8)', border: `1px solid ${themeColor}33` }}
    >
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Activity size={14} color={themeColor} />
              <span style={{ color: themeColor, fontWeight: 800, fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Waveform Analysis
              </span>
            </div>
            <h4 style={{ margin: 0, fontSize: '1.6rem', color: 'white', fontWeight: 800 }}>{activeInsight.title}</h4>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', color: chartData?.isCurrentMistake ? '#ff4444' : themeColor, fontSize: '0.7rem', fontWeight: 700 }}>CURR. VALUE</span>
            <motion.span style={{ color: chartData?.isCurrentMistake ? '#ff4444' : 'white', fontWeight: 800, fontSize: '2rem' }}>
              {typeof chartData.current === 'number' ? (selectedParam === 'stride_width' ? chartData.current.toFixed(3) : Math.round(chartData.current)) : '--'}
              <span style={{ fontSize: '1rem', color: chartData?.isCurrentMistake ? '#ff4444' : themeColor, marginLeft: '4px' }}>{metricConfig?.unit || ''}</span>
            </motion.span>
          </div>
        </div>

        <div style={{ position: 'relative', height: '220px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '10px' }}>
          <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={themeColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={themeColor} stopOpacity="1" />
              </linearGradient>
              <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={themeColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.polyline points={`${chartData.points} 800,220 0,220`} fill="url(#areaGrad)" />
            <motion.polyline points={chartData.points} fill="none" stroke="url(#lineGrad)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '40px' }}>
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: themeColor }}>
            <Info size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{sportConfig?.name.toUpperCase()} INSIGHTS</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            {activeInsight.desc}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div style={{ 
              padding: '16px', 
              background: (metricConfig?.min !== undefined && chartData.avg < metricConfig.min) || (metricConfig?.max !== undefined && chartData.avg > metricConfig.max) ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)', 
              borderRadius: '12px', 
              textAlign: 'center',
              border: (metricConfig?.min !== undefined && chartData.avg < metricConfig.min) || (metricConfig?.max !== undefined && chartData.avg > metricConfig.max) ? '1px solid #ff4444' : '1px solid transparent'
            }}>
              <span style={{ display: 'block', fontSize: '0.65rem', color: (metricConfig?.min !== undefined && chartData.avg < metricConfig.min) || (metricConfig?.max !== undefined && chartData.avg > metricConfig.max) ? '#ff4444' : 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: '4px' }}>SESSION AVG</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: (metricConfig?.min !== undefined && chartData.avg < metricConfig.min) || (metricConfig?.max !== undefined && chartData.avg > metricConfig.max) ? '#ff4444' : 'white' }}>
                {Math.round(chartData.avg)}
                {metricConfig?.unit || ''}
              </span>
            </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: `${themeColor}11`, borderRadius: '12px' }}>
            <Zap size={16} color={themeColor} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: themeColor }}>
               Analyzing {sportConfig?.name} form factors
            </span>
          </div>
          
          {/* ADDITIONAL FEATURE: DOWNLOAD CHART (Easy to comment out) 
          <DownloadLineGraph 
            history={history} 
            metric={sportConfig.metrics.find(m => m.key === selectedParam)} 
            sportConfig={sportConfig} 
            label={label}
            mode="SINGLE"
          />
          */}
        </div>
      </div>
    </motion.div>
  );
};

export default ParameterTrendChart;
