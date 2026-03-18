# AI Biomechanics: Sport-Specific Calibration & Logic Guide

This guide explains the exact mathematical algorithms used to calculate biomechanical parameters for each sport in the platform.

---

## 1. General Mathematical Foundation (Global)

Across all sports, three primary geometric functions form the foundation of our analysis:

### A. The 3-Point Angle Algorithm
Used for Knees, Elbows, and Hips.
- **Formula**: $\theta = |\text{atan2}(c.y - b.y, c.x - b.x) - \text{atan2}(a.y - b.y, a.x - b.x)|$
- **Processing**: We normalize this to degrees. If the result is $> 180^\circ$, we use $360 - \theta$. This ensures we always measure the "inner" joint angle.

### B. Torso-Normalized Scaling (m/s & Meters)
To convert pixel movement into real-world units:
1. We calculate the pixel distance $D_p$ between the shoulders and hips center.
2. We assume a standard adult torso height $H_a = 0.52$ meters.
3. **Scale Factor**: $S = H_a / D_p$ (meters per pixel).
4. All velocities are calculated as: $V = \frac{\Delta \text{distance} \times S \times \text{FPS}}{\Delta \text{frames}}$

---

## 2. Sport-Specific Parameter Logic

### 🏃 Running
*   **Vertical Oscillation**: The vertical range of motion of the Hip Center. It measures efficiency (lower bounce is usually better).
*   **Stride Width**: Horizontal distance between ankles, scaled to cm.
*   **Cadence**: Calculated by detecting "Foot Strikes" (when ankle vertical velocity reaches a local maximum/plateau at the bottom).

### ⚽ Soccer
*   **Kicking Speed (v_velocity)**: For Soccer, this is re-mapped from body speed to **Foot Velocity**. It tracks the peak speed of the ankle landmark during the shooting phase.
*   **Shooting Lean**: Measures the angle of the Spine (Shoulder-Hip) relative to the vertical axis.
*   **Balance Arm**: Tracks the extension of the non-kicking arm for stability during a strike.

### 🏀 Basketball
*   **Release Angle (elbow_angle)**: Specifically monitors the elbow of the shooting arm at the peak of the jump.
*   **Jump Lift Speed**: Measures the vertical velocity of the hips during the "upward" phase of a jump.
*   **Jump Load**: The minimum knee angle reached during the squat phase before jumping.

### 🎾 Tennis
*   **Service Reach**: The angle between the shoulder-hip line and the arm-wrist line. Aiming for $180^\circ$ at the contact point.
*   **Hip Pivot**: The rotational alignment of the hips relative to the court (X-axis displacement).

### 🚴 Cycling
*   **Pedal RPM (Cadence)**: Since a full crank rotation consists of two leg extensions, we divide the foot-strike detection frequency by 2.
*   **Extension Profile**: Specifically monitors the knee angle at the 6 o'clock pedal position (target: $140^\circ - 150^\circ$).

---

## 3. Visualization Algorithms

### A. The Waveform (Line Graph)
- **Data Window**: Last 150 data points (~5 seconds of video).
- **Auto-Scaling**: The Y-axis $range$ is dynamically calculated based on the data in the window: $Y = \text{height} - \frac{(\text{value} - \text{min})}{\text{range}} \times \text{height}$.
- **Safe Zone**: A transparent "corridor" is rendered behind the line using the `min` and `max` values from the **Admin Panel**. If the line exits this corridor, it turns **Bright Red**.

### B. The Performance Radar (Hexagon)
The radar converts raw physical data into a normalized **0-100 Performance Score**:

1.  **SYMMETRY**: $100 - |AvgLeftKnee/Hip - AvgRightKnee/Hip| \times 2$.
2.  **POWER**: A composite score of the peak velocity $(v)$ and joint extension range $(e)$.
3.  **EFFICIENCY**: Inversely proportional to Vertical Oscillation. Higher bounce = Lower efficiency score.
4.  **POSTURE/ALIGNMENT**: $100 - |\text{CurrentLean} - \text{IdealLean}| \times \text{sensitivity\_factor}$.

---

*All parameters mentioned above can be customized via the Admin Console in the `Identity Settings` and `Biometric Parameters` sections.*
