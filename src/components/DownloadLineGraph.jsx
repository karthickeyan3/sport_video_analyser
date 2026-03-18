import React from 'react';
import { Download } from 'lucide-react';

const DownloadLineGraph = ({ history, metrics, sportConfig, metric, mode = 'SINGLE' }) => {
  const downloadGraph = () => {
    if (!history || history.length < 2) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 1600;
    const height = 900;
    const padding = { top: 120, right: 100, bottom: 100, left: 100 };
    
    canvas.width = width;
    canvas.height = height;

    // High quality background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
    
    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridSpacing = 50;
    for (let x = 0; x <= width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const themeColor = sportConfig?.primaryColor || '#00e5ff';
    
    if (mode === 'SINGLE' && metric) {
      drawMetric(ctx, history, metric, themeColor, width, height, padding, sportConfig);
    } else if (mode === 'ALL') {
      drawAllMetrics(ctx, history, sportConfig, width, height, padding);
    }

    // Watermark & Brand
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '800 18px Inter, sans-serif';
    ctx.fillText('SPORT VIDEO ANALYSER AI', padding.left, height - 40);
    
    const timestamp = new Date().toLocaleString();
    ctx.font = '500 14px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Generated: ${timestamp}`, width - padding.right, height - 40);

    // Download
    const fileName = mode === 'SINGLE' 
      ? `${sportConfig.name.toLowerCase()}_${metric.key}_analysis.png`
      : `${sportConfig.name.toLowerCase()}_full_telemery.png`;
      
    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const drawMetric = (ctx, history, metric, color, width, height, padding, sportConfig) => {
    const values = history.map(d => d[metric.key] || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const paddedMin = min - range * 0.1;
    const paddedMax = max + range * 0.1;
    const paddedRange = paddedMax - paddedMin || 1;

    // Draw Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Data Line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    history.forEach((d, i) => {
      const x = padding.left + (i / (history.length - 1)) * (width - padding.left - padding.right);
      const y = height - padding.bottom - (((d[metric.key] || 0) - paddedMin) / paddedRange) * (height - padding.top - padding.bottom);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Gradient Area
    const pathEnd = padding.left + (history.length - 1) / (history.length - 1) * (width - padding.left - padding.right);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, `${color}33`);
    gradient.addColorStop(1, `${color}00`);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Labels
    ctx.fillStyle = 'white';
    ctx.font = '800 42px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(metric.label.toUpperCase(), padding.left, 70);
    
    ctx.fillStyle = color;
    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillText(`${sportConfig.name} BIOMECHANICS REPORT`, padding.left, 100);

    // Y-Axis Labels
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (i / 4) * (height - padding.top - padding.bottom);
        const val = paddedMax - (i / 4) * paddedRange;
        ctx.fillText(val.toFixed(1) + (metric.unit || ''), padding.left - 15, y + 5);
    }
  };

  const drawAllMetrics = (ctx, history, sportConfig, width, height, padding) => {
    const metrics = sportConfig.metrics;
    const colors = ['#00e5ff', '#ff0070', '#7000ff', '#00ff70', '#ffb000', '#0070ff'];
    
    ctx.fillStyle = 'white';
    ctx.font = '800 42px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${sportConfig.name} OVERALL TELEMETRY`, padding.left, 70);

    // Legend
    let legendX = padding.left;
    metrics.forEach((m, i) => {
        const color = colors[i % colors.length];
        ctx.fillStyle = color;
        ctx.fillRect(legendX, 105, 12, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '600 14px Inter, sans-serif';
        ctx.fillText(m.label, legendX + 20, 116);
        legendX += ctx.measureText(m.label).width + 50;
    });

    // We normalize all to 0-100% for overall comparison or just stack them
    metrics.forEach((m, i) => {
        const color = colors[i % colors.length];
        const values = history.map(d => d[m.key] || 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;

        history.forEach((d, j) => {
            const x = padding.left + (j / (history.length - 1)) * (width - padding.left - padding.right);
            const val = ((d[m.key] || 0) - min) / range;
            const y = height - padding.bottom - val * (height - padding.top - padding.bottom);
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    });
    ctx.globalAlpha = 1.0;
  };

  return (
    <button 
      onClick={downloadGraph}
      className="hover-fade"
      title={mode === 'ALL' ? "Download Overall Analytics Map" : `Download ${metric?.label} Graph`}
      style={{
        background: mode === 'ALL' ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${mode === 'ALL' ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255,255,255,0.1)'}`,
        color: mode === 'ALL' ? '#00e5ff' : 'white',
        padding: '10px 18px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 700,
        transition: 'all 0.2s ease',
        boxShadow: mode === 'ALL' ? '0 4px 12px rgba(0, 229, 255, 0.1)' : 'none'
      }}
    >
      <Download size={16} /> 
      {mode === 'ALL' ? 'Export Telemetry Graph' : 'Download Chart'}
    </button>
  );
};

export default DownloadLineGraph;
