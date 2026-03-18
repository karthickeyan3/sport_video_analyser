import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Plus, Trash2, Settings, 
  ChevronRight, Activity, CheckCircle2, RotateCcw
} from 'lucide-react';
import { SPORTS_CONFIG, updateSportsConfig } from '../utils/sportsConfig';



const AVAILABLE_AI_KEYS = [
  { value: 'knee_angle_r', label: 'Knee Angle (R)' },
  { value: 'knee_angle_l', label: 'Knee Angle (L)' },
  { value: 'hip_angle_r', label: 'Hip Angle (R)' },
  { value: 'hip_angle_l', label: 'Hip Angle (L)' },
  { value: 'elbow_angle_r', label: 'Elbow Angle (R)' },
  { value: 'elbow_angle_l', label: 'Elbow Angle (L)' },
  { value: 'arm_swing_r', label: 'Arm Swing (R)' },
  { value: 'arm_swing_l', label: 'Arm Swing (L)' },
  { value: 'ankle_angle_r', label: 'Ankle Angle (R)' },
  { value: 'ankle_angle_l', label: 'Ankle Angle (L)' },
  { value: 'body_lean', label: 'Body Lean' },
  { value: 'v_velocity', label: 'Vertical Velocity' },
  { value: 'vert_osc', label: 'Vertical Oscillation' },
  { value: 'stride_width', label: 'Stride Width' },
  { value: 'cadence', label: 'Cadence' },
  { value: 'step_count', label: 'Step Count' }
];

const AdminPage = ({ onBack }) => {
  const [config, setConfig] = useState(JSON.parse(JSON.stringify(SPORTS_CONFIG)));
  const [selectedSportKey, setSelectedSportKey] = useState(Object.keys(SPORTS_CONFIG)[0]);
  const [saveStatus, setSaveStatus] = useState('idle');

  const currentSport = config[selectedSportKey];

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      updateSportsConfig(config);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 800);
  };

  const updateSportField = (field, value) => {
    setConfig({
      ...config,
      [selectedSportKey]: { ...currentSport, [field]: value }
    });
  };

  const handleMetricUpdate = (index, field, value) => {
    const newMetrics = [...currentSport.metrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    updateSportField('metrics', newMetrics);
  };

  const addMetric = () => {
    const newMetrics = [...currentSport.metrics, { key: 'knee_angle_r', label: 'New Metric', unit: '°', min: 0, max: 180 }];
    updateSportField('metrics', newMetrics);
  };

  const removeMetric = (index) => {
    const newMetrics = currentSport.metrics.filter((_, i) => i !== index);
    updateSportField('metrics', newMetrics);
  };

  const addNewSport = () => {
    const newKey = `NEW_SPORT_${Date.now()}`;
    const newKeyClean = `SPORT_${Date.now()}`;
    const newSport = {
      name: 'New Sport',
      primaryColor: '#00e5ff',
      metrics: [
        { key: 'knee_angle_r', label: 'Knee Flexion (Right)', unit: '°', min: 140, max: 175 },
        { key: 'knee_angle_l', label: 'Knee Flexion (Left)', unit: '°', min: 140, max: 175 },
        { key: 'hip_angle_r', label: 'Hip Extension (Right)', unit: '°', min: 150, max: 180 },
        { key: 'body_lean', label: 'Postural Lean', unit: '°', min: 0, max: 15 },
        { key: 'v_velocity', label: 'Movement Speed', unit: 'm/s', min: 5, max: 15 },
        { key: 'arm_swing_r', label: 'Arm Extension (Right)', unit: '°', min: 90, max: 160 }
      ],
      radarLabels: ['POWER', 'SPEED', 'FORM', 'ACCURACY', 'BALANCE', 'STABILITY'],
      insights: {}
    };
    setConfig({ ...config, [newKeyClean]: newSport });
    setSelectedSportKey(newKeyClean);
  };

  const deleteSport = (keyToDelete, e) => {
    e.stopPropagation();
    if (Object.keys(config).length <= 1) return;
    if (window.confirm(`Are you sure you want to delete "${config[keyToDelete].name}"? All parameters for this sport will be lost.`)) {
      const newConfig = { ...config };
      delete newConfig[keyToDelete];
      setConfig(newConfig);
      if (selectedSportKey === keyToDelete) {
        setSelectedSportKey(Object.keys(newConfig)[0]);
      }
    }
  };

  return (
    <div className="admin-layout" style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: '#0a0b0e', 
      color: 'white',
      flexWrap: 'wrap'
    }}>
      {/* Sidebar */}
      <div className="admin-sidebar" style={{ 
        width: '300px', 
        borderRight: '1px solid rgba(255,255,255,0.05)', 
        padding: '32px', 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: '280px',
        flex: '1 0 300px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ padding: '10px', background: 'var(--primary)', borderRadius: '12px' }}>
            <Settings size={20} color="#050505" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Admin Console</h2>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Global Settings</p>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>SPORTS CATEGORIES</p>
          {Object.entries(config).map(([key, sport]) => (
            <div
              key={key}
              onClick={() => setSelectedSportKey(key)}
              className={`admin-nav-item ${selectedSportKey === key ? 'active' : ''}`}
            >
              <span className="sport-name">{sport.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={(e) => deleteSport(key, e)}
                  className="delete-btn"
                  title="Delete Sport"
                >
                  <Trash2 size={14} />
                </button>
                {selectedSportKey === key && <ChevronRight size={16} />}
              </div>
            </div>
          ))}
          <button 
            onClick={addNewSport}
            style={{ 
              marginTop: '12px',
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 16px', 
              color: 'var(--primary)', 
              background: 'none', 
              border: '1px dashed rgba(0, 229, 255, 0.3)', 
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> Add New Sport
          </button>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
          <button 
            onClick={onBack}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              background: 'none', 
              border: 'none', 
              color: 'rgba(255,255,255,0.4)', 
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <ArrowLeft size={18} /> Exit Admin
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-main" style={{ 
        flex: '1 1 600px', 
        padding: '40px', 
        overflowY: 'auto',
        maxWidth: '100%'
      }}>
        {currentSport ? (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              marginBottom: '40px',
              flexWrap: 'wrap',
              gap: '24px'
            }}>
              <div>
                <h1 style={{ margin: '0 0 8px', fontSize: '2rem', fontWeight: 900 }}>Configure {currentSport.name}</h1>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)' }}>Define biomechanical thresholds and parameters.</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                style={{
                  background: saveStatus === 'success' ? '#10b981' : 'var(--primary)',
                  color: '#050505',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                {saveStatus === 'saving' ? <RotateCcw className="spinning" size={18} /> : 
                 saveStatus === 'success' ? <CheckCircle2 size={18} /> : <Save size={18} />}
                {saveStatus === 'saving' ? 'Saving...' : 
                 saveStatus === 'success' ? 'Changes Saved' : 'Save Changes'}
              </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 24px', fontSize: '1.1rem', color: 'var(--primary)', letterSpacing: '2px', fontWeight: 900 }}>IDENTITY SETTINGS</h3>
                <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
                  <div style={{ width: '300px' }}>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', marginBottom: '10px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>SPORT NAME</label>
                    <input 
                      type="text" 
                      value={currentSport.name}
                      onChange={(e) => updateSportField('name', e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '14px 18px', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '14px', 
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: 600,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      className="input-focus"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', marginBottom: '10px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>THEME</label>
                    <div style={{ 
                      height: '44px', 
                      width: '44px', 
                      position: 'relative',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '50%',
                      padding: '3px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      <input 
                        type="color" 
                        value={currentSport.primaryColor}
                        onChange={(e) => updateSportField('primaryColor', e.target.value)}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          border: 'none',
                          background: 'none', 
                          cursor: 'pointer',
                          borderRadius: '50%',
                          padding: '0',
                          overflow: 'hidden',
                          display: 'block',
                          appearance: 'none',
                          WebkitAppearance: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>BIOMETRIC PARAMETERS</h3>
                <button onClick={addMetric} style={{ padding: '8px 16px', background: 'rgba(0,229,255,0.1)', color: 'var(--primary)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} /> Add Parameter
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '800px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1.5fr 1.5fr 0.8fr 1fr 1fr 50px', 
                  gap: '16px', 
                  padding: '0 16px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase'
                }}>
                  <span>AI Data Key</span>
                  <span>Display Label</span>
                  <span>Unit</span>
                  <span style={{ color: '#4ade80' }}>Min Valid</span>
                  <span style={{ color: '#f87171' }}>Max Valid</span>
                  <span></span>
                </div>

                {currentSport.metrics.map((metric, idx) => (
                  <div key={idx} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1.5fr 1.5fr 0.8fr 1fr 1fr 50px', 
                    gap: '16px', 
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxSizing: 'border-box'
                  }}>
                    <select 
                      value={metric.key}
                      onChange={(e) => handleMetricUpdate(idx, 'key', e.target.value)}
                      style={{ 
                        width: '100%', 
                        boxSizing: 'border-box', 
                        background: '#1c1e24', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        color: 'white', 
                        padding: '8px', 
                        borderRadius: '8px', 
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="" disabled>Select Key</option>
                      {AVAILABLE_AI_KEYS.map(key => (
                        <option key={key.value} value={key.value} style={{ background: '#1c1e24' }}>
                          {key.value}
                        </option>
                      ))}
                    </select>

                    <input 
                      type="text" 
                      value={metric.label}
                      onChange={(e) => handleMetricUpdate(idx, 'label', e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', background: '#1c1e24', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '8px', fontSize: '0.85rem' }}
                    />

                    <input 
                      type="text" 
                      value={metric.unit}
                      onChange={(e) => handleMetricUpdate(idx, 'unit', e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', background: '#1c1e24', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '8px', fontSize: '0.85rem' }}
                    />

                    <input 
                      type="number" 
                      value={metric.min}
                      onChange={(e) => handleMetricUpdate(idx, 'min', parseFloat(e.target.value))}
                      style={{ width: '100%', boxSizing: 'border-box', background: '#1c1e24', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '8px', fontSize: '0.85rem' }}
                    />

                    <input 
                      type="number" 
                      value={metric.max}
                      onChange={(e) => handleMetricUpdate(idx, 'max', parseFloat(e.target.value))}
                      style={{ width: '100%', boxSizing: 'border-box', background: '#1c1e24', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '8px', fontSize: '0.85rem' }}
                    />

                    <button 
                      onClick={() => removeMetric(idx)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.5)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
            Select a sport to configure or add a new one.
          </div>
        )}
      </div>

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .admin-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
          .admin-main {
            padding: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPage;
