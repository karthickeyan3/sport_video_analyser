export const calculateAngle = (a, b, c) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }

  return angle;
};

export const calculateDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const calculateBodyLean = (shoulder, hip) => {
  const dy = hip.y - shoulder.y;
  const dx = hip.x - shoulder.x;
  return Math.abs(Math.atan2(dx, dy) * (180.0 / Math.PI));
};

export const calculateArmSwing = (shoulder, elbow, wrist) => {
  // Angle at elbow
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);

  // Arm swing from shoulder (angle relative to vertical)
  const shoulderVertical = { x: shoulder.x, y: shoulder.y - 0.1 };
  const armSwingAngle = calculateAngle(shoulderVertical, shoulder, elbow);

  return { elbowAngle, armSwingAngle };
};

export class BiomechanicsTracker {
  constructor(sport = 'RUNNING') {
    this.sport = sport;
    this.history = [];
    this.previousHipCenter = null;
    this.fps = 30;

    // Joint histories for strike detection
    this.ankleHistoryR = [];
    this.ankleHistoryL = [];

    // Stride tracking
    this.stepCount = 0;
    this.lastFootStrikeFrame = null;
    this.cadence = 0;

    // Peak tracking (ROM)
    this.peakKneeFlexR = 180;
    this.peakKneeFlexL = 180;
    this.peakHipExtR = 0;
    this.peakHipExtL = 0;
  }

  detectFootStrike(history, threshold = 0.001) {
    if (history.length < 5) return false;
    const recent = history.slice(-5);
    const velocity = [];
    for (let i = 0; i < recent.length - 1; i++) {
      velocity.push(recent[i + 1] - recent[i]);
    }

    if (velocity.length >= 2) {
      if (velocity[velocity.length - 2] > threshold && Math.abs(velocity[velocity.length - 1]) < threshold) {
        return true;
      }
    }
    return false;
  }

  update(landmarks, timeSec, frameNum) {
    if (!landmarks) return null;

    const getLM = (idx) => ({ x: landmarks[idx].x, y: landmarks[idx].y });

    // Extraction
    const rShoulder = getLM(12);
    const rHip = getLM(24);
    const rKnee = getLM(26);
    const rAnkle = getLM(28);
    const rFootIndex = getLM(32);
    const rElbow = getLM(14);
    const rWrist = getLM(16);

    const lShoulder = getLM(11);
    const lHip = getLM(23);
    const lKnee = getLM(25);
    const lAnkle = getLM(27);
    const lFootIndex = getLM(31);
    const lElbow = getLM(13);
    const lWrist = getLM(15);

    // 1. Joint Angles
    const kneeAngleR = calculateAngle(rHip, rKnee, rAnkle);
    const kneeAngleL = calculateAngle(lHip, lKnee, lAnkle);
    const hipAngleR = calculateAngle(rShoulder, rHip, rKnee);
    const hipAngleL = calculateAngle(lShoulder, lHip, lKnee);
    const ankleAngleR = calculateAngle(rKnee, rAnkle, rFootIndex);
    const ankleAngleL = calculateAngle(lKnee, lAnkle, lFootIndex);

    // 2. Peak Tracking (ROM logic from Python)
    this.peakKneeFlexR = Math.min(this.peakKneeFlexR, kneeAngleR);
    this.peakKneeFlexL = Math.min(this.peakKneeFlexL, kneeAngleL);
    this.peakHipExtR = Math.max(this.peakHipExtR, hipAngleR);
    this.peakHipExtL = Math.max(this.peakHipExtL, hipAngleL);

    // 3. Arm Swing
    const armR = calculateArmSwing(rShoulder, rElbow, rWrist);
    const armL = calculateArmSwing(lShoulder, lElbow, lWrist);

    // 4. Body Mechanics & Scaling
    const shoulderCenter = { x: (rShoulder.x + lShoulder.x) / 2, y: (rShoulder.y + lShoulder.y) / 2 };
    const hipCenter = { x: (rHip.x + lHip.x) / 2, y: (rHip.y + lHip.y) / 2 };
    const bodyLean = calculateBodyLean(shoulderCenter, hipCenter);
    
    // TORSO-BASED SCALING (Critical for "Legit" Meters)
    const torsoHeightNorm = Math.sqrt(Math.pow(shoulderCenter.x - hipCenter.x, 2) + Math.pow(shoulderCenter.y - hipCenter.y, 2));
    const meterScale = 0.52 / (torsoHeightNorm || 0.1); // Torso approx 0.52m for adults
    
    // Vertical Oscillation Range
    if (!this.oscHistory) this.oscHistory = [];
    this.oscHistory.push(hipCenter.y);
    if (this.oscHistory.length > 30) this.oscHistory.shift();
    const verticalOscillation = (Math.max(...this.oscHistory) - Math.min(...this.oscHistory)) * meterScale;

    // 5. Strike Detection & Cadence
    this.ankleHistoryR.push(rAnkle.y);
    this.ankleHistoryL.push(lAnkle.y);
    if (this.ankleHistoryR.length > 10) this.ankleHistoryR.shift();
    if (this.ankleHistoryL.length > 10) this.ankleHistoryL.shift();

    if (this.detectFootStrike(this.ankleHistoryR) || this.detectFootStrike(this.ankleHistoryL)) {
      this.stepCount++;
      if (this.lastFootStrikeFrame !== null) {
        const strideTime = (frameNum - this.lastFootStrikeFrame) / this.fps;
        if (strideTime > 0.1) { // Filter noise
          this.cadence = 60 / strideTime;
          if (this.sport === 'CYCLING') this.cadence = this.cadence / 2; // RPM vs SPM
        }
      }
      this.lastFootStrikeFrame = frameNum;
    }

    let hVelocity = 0;
    let vVelocity = 0;
    let speed = 0;
    if (this.previousHipCenter) {
      const dx = (hipCenter.x - this.previousHipCenter.x) * meterScale;
      const dy = (hipCenter.y - this.previousHipCenter.y) * meterScale;
      hVelocity = Math.abs(dx * this.fps);
      vVelocity = Math.abs(dy * this.fps);
      speed = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) * this.fps;
    }

    // Sport-Specific Special Logic: Soccer Kicking Speed (Foot Speed)
    let footVelocity = 0;
    if (this.previousAnkleR) {
        const dvR = Math.sqrt(Math.pow(rAnkle.x-this.previousAnkleR.x, 2) + Math.pow(rAnkle.y-this.previousAnkleR.y, 2));
        const dvL = Math.sqrt(Math.pow(lAnkle.x-this.previousAnkleL.x, 2) + Math.pow(lAnkle.y-this.previousAnkleL.y, 2));
        footVelocity = Math.max(dvR, dvL) * this.fps * meterScale;
    }
    this.previousHipCenter = hipCenter;
    this.previousAnkleR = rAnkle;
    this.previousAnkleL = lAnkle;

    const strideWidth = Math.abs(rAnkle.x - lAnkle.x) * meterScale * 100; // in cm

    const metrics = {
      frame: frameNum,
      time_sec: timeSec,
      knee_angle_r: kneeAngleR,
      knee_angle_l: kneeAngleL,
      hip_angle_r: hipAngleR,
      hip_angle_l: hipAngleL,
      ankle_angle_r: ankleAngleR,
      ankle_angle_l: ankleAngleL,
      body_lean: bodyLean,
      stride_width: strideWidth,
      step_count: this.stepCount,
      elbow_angle_r: armR.elbowAngle,
      elbow_angle_l: armL.elbowAngle,
      arm_swing_r: armR.armSwingAngle,
      arm_swing_l: armL.armSwingAngle,
      vert_osc: verticalOscillation,
      v_velocity: this.sport === 'SOCCER' ? footVelocity : vVelocity,
      h_velocity: hVelocity,
      speed: speed,
      cadence: this.cadence,
      knee_asymmetry: Math.abs(kneeAngleR - kneeAngleL)
    };

    this.history.push(metrics);
    return metrics;
  }

  getSessionSummary() {
    if (this.history.length === 0) return null;

    const summary = {
      isSummary: true,
      step_count: this.stepCount,
      cadence: this.cadence,
      v_velocity: 0,
      h_velocity: 0,
      speed: 0, // Initialize speed in summary
      vert_osc: 0
    };

    const keysToAverage = [
      'knee_angle_r', 'knee_angle_l', 'hip_angle_r', 'hip_angle_l',
      'ankle_angle_r', 'ankle_angle_l', 'body_lean', 'stride_width',
      'elbow_angle_r', 'elbow_angle_l', 'arm_swing_r', 'arm_swing_l',
      'v_velocity', 'h_velocity', 'vert_osc', 'speed'
    ];

    keysToAverage.forEach(key => {
      const vals = this.history.map(h => h[key]).filter(v => v !== undefined);
      if (vals.length === 0) {
        summary[key] = 0;
        return;
      }
      const sum = vals.reduce((acc, curr) => acc + curr, 0);
      summary[key] = sum / vals.length;
      
      // Calculate standard deviation for consistency (especially for running)
      if (['knee_angle_r', 'knee_angle_l', 'stride_width'].includes(key)) {
        const avg = summary[key];
        const squareDiffs = vals.map(v => Math.pow(v - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / vals.length;
        summary[`${key}_std`] = Math.sqrt(avgSquareDiff);
      }
    });

    // ⚖️ Gait Symmetry & Asymmetry Analysis
    if (summary.knee_angle_r && summary.knee_angle_l) {
      summary.knee_asymmetry = Math.abs(summary.knee_angle_r - summary.knee_angle_l);
      summary.symmetry_score = Math.max(0, 100 - summary.knee_asymmetry * 2.5);
    }
    
    if (summary.hip_angle_r && summary.hip_angle_l) {
      summary.hip_asymmetry = Math.abs(summary.hip_angle_r - summary.hip_angle_l);
    }

    if (summary.arm_swing_r && summary.arm_swing_l) {
      summary.arm_asymmetry = Math.abs(summary.arm_swing_r - summary.arm_swing_l);
    }

    return summary;
  }

  generateCSV(sportConfig) {
    if (!sportConfig || !sportConfig.metrics) return "";

    // Headers: Frame, Time, and then all sport-specific metric labels
    const baseHeaders = ['frame', 'time_sec'];
    const metricKeys = sportConfig.metrics.map(m => m.key);
    const displayHeaders = ['Frame', 'Time (s)', ...sportConfig.metrics.map(m => `${m.label} (${m.unit || 'n/a'})`)];

    const csvRows = [displayHeaders.join(',')];

    for (const row of this.history) {
      const values = [
        row.frame,
        row.time_sec.toFixed(3)
      ];

      metricKeys.forEach(key => {
        const val = row[key];
        values.push(typeof val === 'number' ? val.toFixed(4) : (val === undefined ? '' : val));
      });

      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}
