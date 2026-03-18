const DEFAULT_SPORTS_CONFIG = {
  RUNNING: {
    name: 'Running',
    icon: 'Activity',
    primaryColor: '#00e5ff',
    metrics: [
      { key: 'knee_angle_r', label: 'Knee Flexion (Right)', unit: '°', min: 140, max: 175 },
      { key: 'knee_angle_l', label: 'Knee Flexion (Left)', unit: '°', min: 140, max: 175 },
      { key: 'hip_angle_r', label: 'Hip Extension (Right)', unit: '°', min: 150, max: 180 },
      { key: 'hip_angle_l', label: 'Hip Extension (Left)', unit: '°', min: 150, max: 180 },
      { key: 'body_lean', label: 'Forward Lean', unit: '°', min: 0, max: 15 },
      { key: 'stride_width', label: 'Stride Width', unit: 'cm', min: 5, max: 25 },
      { key: 'cadence', label: 'Running Cadence', unit: 'SPM', min: 150, max: 200 },
      { key: 'vert_osc', label: 'Vertical Bounce', unit: 'm', min: 0.04, max: 0.12 },
      { key: 'step_count', label: 'Total Steps', unit: '' }
    ],
    radarLabels: ['SYMMETRY', 'DRIVE', 'POWER', 'CADENCE', 'EFFICIENCY', 'POSTURE'],
    insights: {
      knee_angle_r: { title: 'Knee Flexion (Right)', desc: 'Focus on flexion at mid-stance. Optimal: 160-170°.' },
      knee_angle_l: { title: 'Knee Flexion (Left)', desc: 'Compare with right side for symmetry. Optimal: 160-170°.' },
      body_lean: { title: 'Running Posture', desc: '8-10° forward lean minimizes braking forces.' }
    }
  },
  SOCCER: {
    name: 'Soccer',
    icon: 'Shuffle',
    primaryColor: '#4ade80',
    metrics: [
      { key: 'knee_angle_r', label: 'Knee Extension (Right)', unit: '°', min: 150, max: 180 },
      { key: 'knee_angle_l', label: 'Knee Extension (Left)', unit: '°', min: 150, max: 180 },
      { key: 'hip_angle_r', label: 'Hip Power Load (Right)', unit: '°', min: 80, max: 160 },
      { key: 'hip_angle_l', label: 'Hip Power Load (Left)', unit: '°', min: 80, max: 160 },
      { key: 'v_velocity', label: 'Kicking Speed', unit: 'm/s', min: 20, max: 35 },
      { key: 'body_lean', label: 'Shooting Lean', unit: '°', min: -5, max: 15 },
      { key: 'arm_swing_r', label: 'Balance Arm (Right)', unit: '°', min: 90, max: 160 },
      { key: 'arm_swing_l', label: 'Balance Arm (Left)', unit: '°', min: 90, max: 160 },
      { key: 'ankle_angle_r', label: 'Ankle Stability (Right)', unit: '°', min: 100, max: 150 },
      { key: 'ankle_angle_l', label: 'Ankle Stability (Left)', unit: '°', min: 100, max: 150 }
    ],
    radarLabels: ['POWER', 'ACCURACY', 'BALANCE', 'STABILITY', 'FLUIDITY', 'CORE'],
    insights: {
      v_velocity: { title: 'Kicking Velocity', desc: 'Measures foot speed at impact. Higher velocity = more power.' },
      body_lean: { title: 'Shooting Posture', desc: 'Leaning back adds height; leaning forward keeps the shot low.' },
      knee_angle_r: { title: 'Knee Extension', desc: 'Full extension at impact maximizes shot power.' }
    }
  },
  TENNIS: {
    name: 'Tennis',
    icon: 'Target',
    primaryColor: '#facc15',
    metrics: [
      { key: 'arm_swing_r', label: 'Service Reach (Right)', unit: '°', min: 150, max: 180 },
      { key: 'arm_swing_l', label: 'Service Reach (Left)', unit: '°', min: 150, max: 180 },
      { key: 'elbow_angle_r', label: 'Elbow Position (Right)', unit: '°', min: 100, max: 160 },
      { key: 'elbow_angle_l', label: 'Elbow Position (Left)', unit: '°', min: 100, max: 160 },
      { key: 'knee_angle_r', label: 'Knee Load (Right)', unit: '°', min: 110, max: 160 },
      { key: 'knee_angle_l', label: 'Knee Load (Left)', unit: '°', min: 110, max: 160 },
      { key: 'hip_angle_r', label: 'Hip Pivot (Right)', unit: '°', min: 120, max: 170 },
      { key: 'hip_angle_l', label: 'Hip Pivot (Left)', unit: '°', min: 120, max: 170 },
      { key: 'body_lean', label: 'Lateral Body Tilt', unit: '°', min: 0, max: 20 }
    ],
    radarLabels: ['REACH', 'POWER', 'LOAD', 'TIMING', 'ROTATION', 'STABILITY'],
    insights: {
      arm_swing_r: { title: 'Service Extension', desc: 'Full extension at contact point maximizes serve height.' },
      knee_angle_r: { title: 'Leg Drive', desc: 'Percentage of power generated from the lower body load.' }
    }
  },
  CYCLING: {
    name: 'Cycling',
    icon: 'RotateCcw',
    primaryColor: '#38bdf8',
    metrics: [
      { key: 'knee_angle_r', label: 'Knee Extension (Right)', unit: '°', min: 140, max: 155 },
      { key: 'knee_angle_l', label: 'Knee Extension (Left)', unit: '°', min: 140, max: 155 },
      { key: 'hip_angle_r', label: 'Hip Movement (Right)', unit: '°', min: 60, max: 110 },
      { key: 'hip_angle_l', label: 'Hip Movement (Left)', unit: '°', min: 60, max: 110 },
      { key: 'ankle_angle_r', label: 'Ankle Angle (Right)', unit: '°', min: 80, max: 120 },
      { key: 'ankle_angle_l', label: 'Ankle Angle (Left)', unit: '°', min: 80, max: 120 },
      { key: 'body_lean', label: 'Aerodynamic Lean', unit: '°', min: 15, max: 45 },
      { key: 'cadence', label: 'Pedal RPM', unit: 'RPM', min: 75, max: 100 }
    ],
    radarLabels: ['AERO', 'EFFICIENCY', 'SMOOTHNESS', 'CADENCE', 'POWER', 'RANGE'],
    insights: {
      knee_angle_r: { title: 'Saddle Height', desc: 'Optimal extension at bottom of stroke is 140-150°.' },
      cadence: { title: 'Pedaling Rhythm', desc: 'Higher cadence (85-95) reduces muscle fatigue vs mashing.' }
    }
  },
  BASKETBALL: {
    name: 'Basketball',
    icon: 'Zap',
    primaryColor: '#fb923c',
    metrics: [
      { key: 'elbow_angle_r', label: 'Release Angle (Right)', unit: '°', min: 85, max: 115 },
      { key: 'elbow_angle_l', label: 'Release Angle (Left)', unit: '°', min: 85, max: 115 },
      { key: 'v_velocity', label: 'Jump Lift Speed', unit: 'm/s', min: 3, max: 7 },
      { key: 'arm_swing_r', label: 'Arm Extension (Right)', unit: '°', min: 140, max: 180 },
      { key: 'arm_swing_l', label: 'Arm Extension (Left)', unit: '°', min: 140, max: 180 },
      { key: 'knee_angle_r', label: 'Jump Load (Right)', unit: '°', min: 100, max: 160 },
      { key: 'knee_angle_l', label: 'Jump Load (Left)', unit: '°', min: 100, max: 160 },
      { key: 'hip_angle_r', label: 'Pivot Alignment (Right)', unit: '°', min: 140, max: 180 },
      { key: 'hip_angle_l', label: 'Pivot Alignment (Left)', unit: '°', min: 140, max: 180 }
    ],
    radarLabels: ['LIFT', 'RELEASE', 'ALIGNMENT', 'POWER', 'FLUIDITY', 'BALANCE'],
    insights: {
      elbow_angle_r: { title: 'Shooting Pocket', desc: 'A 90° elbow angle at set point ensures consistent release.' },
      v_velocity: { title: 'Explosiveness', desc: 'Measures vertical displacement speed during the jump.' }
    }
  }
};

const getStoredConfig = () => {
  const stored = localStorage.getItem('SPORTS_CONFIG');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_SPORTS_CONFIG;
    }
  }
  return DEFAULT_SPORTS_CONFIG;
};

export let SPORTS_CONFIG = getStoredConfig();

export const updateSportsConfig = (newConfig) => {
  SPORTS_CONFIG = newConfig;
  localStorage.setItem('SPORTS_CONFIG', JSON.stringify(newConfig));
  window.dispatchEvent(new Event('sports_config_updated'));
};
