import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Layout } from 'lucide-react';
import MetricWaveformCard from './MetricWaveformCard';
import DownloadLineGraph from './DownloadLineGraph';

const MultiParameterView = ({ history, metrics, sportConfig, onBack, tick }) => {
  const themeColor = sportConfig?.primaryColor || '#00e5ff';

  return (
    <div className="dashboard-overlay" style={{ 
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      padding: '40px 32px',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(circle at 20% 20%, rgba(0, 229, 255, 0.03) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(112, 0, 255, 0.03) 0%, transparent 40%)'
    }}>
      <header style={{ 
        maxWidth: '1400px', 
        width: '100%', 
        margin: '0 auto 48px auto',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button 
            onClick={onBack} 
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              color: 'rgba(255,255,255,0.7)', 
              padding: '12px 20px',
              borderRadius: '14px',
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            className="hover-glow"
          >
            <ArrowLeft size={18} /> Back to Analysis
          </button>
          
          <div style={{ paddingLeft: '24px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '4px', height: '18px', borderRadius: '2px', background: themeColor }}></div>
              <h2 style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', fontWeight: 800 }}>LIVE TELEMETRY</h2>
            </div>
            <h1 style={{ margin: 0, fontSize: '2.4rem', color: 'white', fontWeight: 900, letterSpacing: '-0.5px' }}>
              {sportConfig.name} <span style={{ opacity: 0.3, fontWeight: 300, fontStyle: 'italic' }}>Dashboard</span>
            </h1>
          </div>
        </div>

        {/* ADDITIONAL FEATURE: DOWNLOAD OVERALL TELEMETRY (Easy to comment out) 
        {history.length > 0 && (
          <DownloadLineGraph 
            history={history} 
            sportConfig={sportConfig} 
            mode="ALL"
          />
        )}
        */}
      </header>

      <motion.div 
        layout
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '32px',
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          paddingBottom: '60px'
        }}
      >
        {sportConfig.metrics.map((metric) => (
          <MetricWaveformCard 
            key={metric.key} 
            history={history} 
            metrics={metrics}
            metric={metric} 
            sportConfig={sportConfig} 
          />
        ))}
      </motion.div>

      {history.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', opacity: 0.2 }}>
            <Layout size={80} style={{ marginBottom: '24px', color: 'white' }} />
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>Establishing Bio-Stream Connection...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiParameterView;
