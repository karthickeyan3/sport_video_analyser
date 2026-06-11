import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

const OverlayLineChart = ({ userHistory, eliteHistory, selectedParam, sportConfig }) => {
  const metricConfig = useMemo(() => 
    sportConfig?.metrics?.find(m => m.key === selectedParam),
    [sportConfig, selectedParam]
  );

  const chartData = useMemo(() => {
    const userVals = (userHistory || []).slice(-150).map(d => d[selectedParam] || 0);
    const eliteVals = (eliteHistory || []).slice(-150).map(d => d[selectedParam] || 0);

    const allVals = [...userVals, ...eliteVals];
    if (allVals.length === 0) return null;

    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    const rawRange = max - min;
    const range = rawRange === 0 ? 1 : rawRange;

    const paddedMin = min - range * 0.15;
    const paddedMax = max + range * 0.15;
    const paddedRange = paddedMax - paddedMin || 1;

    const width = 800;
    const height = 220;
    const padding = { top: 40, right: 20, bottom: 40, left: 20 };

    const generatePoints = (dataVals) => {
      if (!dataVals || dataVals.length === 0) return '';
      if (dataVals.length === 1) dataVals = [dataVals[0], dataVals[0]]; // Draw a line even if just 1 point
      return dataVals.map((val, i) => {
        const x = padding.left + (i / (dataVals.length - 1)) * (width - padding.left - padding.right);
        const y = height - padding.bottom - ((val - paddedMin) / paddedRange) * (height - padding.top - padding.bottom);
        return `${x},${y}`;
      }).join(' ');
    };

    const userPoints = generatePoints(userVals);
    const elitePoints = generatePoints(eliteVals);

    const userCurrent = userVals[userVals.length - 1] ?? '--';
    const eliteCurrent = eliteVals[eliteVals.length - 1] ?? '--';

    const userFull = (userHistory || []).map(d => d[selectedParam] || 0);
    const userAvg = userFull.length > 0 ? userFull.reduce((a, b) => a + b, 0) / userFull.length : '--';

    const eliteFull = (eliteHistory || []).map(d => d[selectedParam] || 0);
    const eliteAvg = eliteFull.length > 0 ? eliteFull.reduce((a, b) => a + b, 0) / eliteFull.length : '--';

    return { userPoints, elitePoints, width, height, min, max, userCurrent, eliteCurrent, userAvg, eliteAvg };
  }, [userHistory, eliteHistory, selectedParam]);

  if (!chartData) return (
    <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)' }}>
       <p style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px' }}>NO DATA AVAILABLE YET...</p>
    </div>
  );

  const themeColor = sportConfig?.primaryColor || 'var(--primary)';
  const matchColor = '#ffb300'; // Color for Elite benchmark

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card"
      style={{ padding: '24px', background: 'rgba(10, 10, 15, 0.8)', border: `1px solid ${themeColor}33`, marginTop: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Activity size={14} color={themeColor} />
            <span style={{ color: themeColor, fontWeight: 800, fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Side-by-Side Reference Overlay
            </span>
          </div>
          <h4 style={{ margin: 0, fontSize: '1.4rem', color: 'white', fontWeight: 800 }}>{metricConfig?.label || selectedParam} Comparison</h4>
        </div>
        
        <div style={{ textAlign: 'right', display: 'flex', gap: '32px' }}>
          <div>
            <span style={{ display: 'block', color: matchColor, fontSize: '0.7rem', fontWeight: 700 }}>ELITE AVG</span>
            <span style={{ color: matchColor, fontWeight: 800, fontSize: '1.6rem' }}>
              {typeof chartData.eliteAvg === 'number' ? chartData.eliteAvg.toFixed(2) : '--'}
              <span style={{ fontSize: '0.9rem', marginLeft: '4px' }}>{metricConfig?.unit || ''}</span>
            </span>
          </div>
          <div>
            <span style={{ display: 'block', color: themeColor, fontSize: '0.7rem', fontWeight: 700 }}>YOUR AVG</span>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.6rem' }}>
              {typeof chartData.userAvg === 'number' ? chartData.userAvg.toFixed(2) : '--'}
              <span style={{ fontSize: '0.9rem', color: themeColor, marginLeft: '4px' }}>{metricConfig?.unit || ''}</span>
            </span>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', height: '220px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '10px' }}>
        {/* Legend */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: '16px', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <div style={{ width: '12px', height: '4px', background: matchColor, borderRadius: '2px' }}></div>
             <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>ELITE BENCHMARK</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <div style={{ width: '12px', height: '4px', background: themeColor, borderRadius: '2px' }}></div>
             <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>YOUR RUN</span>
          </div>
        </div>

        <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
          {/* ELITE LINE */}
          {chartData.elitePoints && (
            <motion.polyline points={chartData.elitePoints} fill="none" stroke={matchColor} strokeWidth="3" strokeLinecap="round" opacity={0.6} />
          )}
          {/* USER LINE */}
          {chartData.userPoints && (
            <motion.polyline points={chartData.userPoints} fill="none" stroke={themeColor} strokeWidth="4" strokeLinecap="round" />
          )}
        </svg>
      </div>
    </motion.div>
  );
};

export default OverlayLineChart;
