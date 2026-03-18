import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

const CoachingPanel = ({ metrics, sessionSummary, sportConfig }) => {
  const insights = useMemo(() => {
    const list = [];
    if (!metrics && !sessionSummary) return list;

    const data = sessionSummary || metrics;
    const isSession = !!sessionSummary;

    // 1. Symmetry Check
    if (data.knee_asymmetry !== undefined) {
      if (data.knee_asymmetry > 8) {
        list.push({
          type: 'warning',
          icon: <AlertTriangle size={16} />,
          title: 'High Knee Asymmetry',
          text: `Your right and left knee extension differ by ${Math.round(data.knee_asymmetry)}°. Focus on balanced leg drive.`,
          color: '#ff4444'
        });
      } else if (data.knee_asymmetry < 3 && isSession) {
        list.push({
          type: 'success',
          icon: <CheckCircle2 size={16} />,
          title: 'Excellent Symmetry',
          text: 'Superb balance detected between your left and right limb extensions.',
          color: '#4ade80'
        });
      }
    }

    // 2. Consistency Check (Standard Deviation)
    if (data.knee_angle_r_std !== undefined) {
      if (data.knee_angle_r_std > 5) {
        list.push({
          type: 'info',
          icon: <TrendingUp size={16} />,
          title: 'Rhythm Consistency',
          text: 'High variability in knee angles. Work on maintaining a steady metabolic rhythm.',
          color: 'var(--primary)'
        });
      }
    }

    // 3. Sport-Specific Insights
    if (sportConfig.name === 'Running' || sportConfig.name === 'Cycling') {
      const cadence = data.cadence || 0;
      if (cadence > 0 && cadence < 160 && sportConfig.name === 'Running') {
        list.push({
          type: 'info',
          icon: <Lightbulb size={16} />,
          title: 'Increase Cadence',
          text: 'Shortening your stride and increasing steps per minute can reduce injury risk.',
          color: '#facc15'
        });
      }
    }

    // 4. Power/Speed Insight
    if (data.speed > 8) {
      list.push({
        type: 'success',
        icon: <TrendingUp size={16} />,
        title: 'Elite Velocity',
        text: `Maintaining ${data.speed.toFixed(1)} m/s puts you in the top tier of performance.`,
        color: '#a855f7'
      });
    }

    // Default message if empty
    if (list.length === 0) {
      list.push({
        type: 'neutral',
        icon: <Activity size={16} />,
        title: 'Analyzing Form...',
        text: 'Continue the movement to generate personalized AI coaching feedback.',
        color: 'rgba(255,255,255,0.4)'
      });
    }

    return list.slice(0, 3); // Top 3 insights
  }, [metrics, sessionSummary, sportConfig]);

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Lightbulb size={18} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, letterSpacing: '1px', color: 'white' }}>AI COACHING INSIGHTS</h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <AnimatePresence mode="popLayout">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card"
              style={{ 
                padding: '16px', 
                borderLeft: `4px solid ${insight.color}`,
                background: 'rgba(255,255,255,0.02)',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start'
              }}
            >
              <div style={{ 
                padding: '8px', 
                background: `${insight.color}15`, 
                borderRadius: '8px',
                color: insight.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {insight.icon}
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: insight.color }}>{insight.title}</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{insight.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Internal icon helper to avoid import issues
const Activity = ({ size, color, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || "currentColor"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export default CoachingPanel;
