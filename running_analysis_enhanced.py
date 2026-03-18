import cv2
import mediapipe as mp
import numpy as np
import math
import csv
from collections import deque

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    
    if angle > 180.0:
        angle = 360-angle
        
    return angle

def calculate_distance(point1, point2):
    """Calculate Euclidean distance between two points"""
    return math.sqrt((point2[0] - point1[0])**2 + (point2[1] - point1[1])**2)

def calculate_velocity(current_pos, previous_pos, fps):
    """Calculate velocity between two positions"""
    if previous_pos is None:
        return 0
    distance = calculate_distance(current_pos, previous_pos)
    return distance * fps  # pixels per second

def calculate_body_lean(shoulder, hip):
    """Calculate forward lean angle of torso"""
    # Calculate angle from vertical
    dy = hip[1] - shoulder[1]
    dx = hip[0] - shoulder[0]
    angle = math.degrees(math.atan2(abs(dx), abs(dy)))
    return angle

def detect_foot_strike(ankle_y_history, threshold=0.001):
    """Detect foot strike event based on ankle position change"""
    if len(ankle_y_history) < 5:
        return False
    
    # Check if ankle is moving downward and then stabilizes
    recent = list(ankle_y_history)[-5:]
    velocity = [recent[i+1] - recent[i] for i in range(len(recent)-1)]
    
    # Foot strike when vertical velocity changes from positive to near zero
    if len(velocity) >= 2:
        if velocity[-2] > threshold and abs(velocity[-1]) < threshold:
            return True
    return False

def calculate_arm_swing(shoulder, elbow, wrist):
    """Calculate arm swing angle and range"""
    # Angle at elbow
    elbow_angle = calculate_angle(shoulder, elbow, wrist)
    
    # Arm swing from shoulder
    shoulder_vertical = [shoulder[0], shoulder[1] - 0.1]  # Point above shoulder
    arm_swing_angle = calculate_angle(shoulder_vertical, shoulder, elbow)
    
    return elbow_angle, arm_swing_angle

class BiomechanicsTracker:
    """Track comprehensive running biomechanics"""
    
    def __init__(self, fps):
        self.fps = fps
        
        # Joint angle tracking
        self.knee_angles_r = []
        self.knee_angles_l = []
        self.hip_angles_r = []
        self.hip_angles_l = []
        self.ankle_angles_r = []
        self.ankle_angles_l = []
        self.elbow_angles_r = []
        self.elbow_angles_l = []
        
        # Biomechanics metrics
        self.body_lean_angles = []
        self.stride_lengths = []
        self.stride_widths = []
        self.flight_times = []
        self.contact_times = []
        self.vertical_oscillations = []
        self.arm_swing_angles_r = []
        self.arm_swing_angles_l = []
        self.cadence_data = []
        
        # Position tracking
        self.previous_hip_center = None
        self.previous_ankle_r = None
        self.previous_ankle_l = None
        self.ankle_y_history_r = deque(maxlen=10)
        self.ankle_y_history_l = deque(maxlen=10)
        
        # Stride tracking
        self.step_count = 0
        self.last_foot_strike = None
        self.is_in_flight = False
        self.flight_start = None
        self.contact_start = None
        
        # Peak tracking for ROM
        self.peak_knee_flexion_r = float('inf')
        self.peak_knee_flexion_l = float('inf')
        self.peak_hip_extension_r = 0
        self.peak_hip_extension_l = 0
        
        # Asymmetry tracking
        self.ground_contact_r = []
        self.ground_contact_l = []
        
        # Speed and pace
        self.horizontal_velocities = []
        self.vertical_velocities = []

    def update(self, landmarks, frame_num):
        """Update all biomechanics metrics"""
        
        try:
            # Extract all relevant landmarks
            # Right side
            r_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                         landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            r_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
                    landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
            r_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
            r_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x,
                      landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
            r_heel = [landmarks[mp_pose.PoseLandmark.RIGHT_HEEL.value].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_HEEL.value].y]
            r_foot_index = [landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value].x,
                           landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value].y]
            r_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                      landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            r_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                      landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
            
            # Left side
            l_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                         landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            l_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
            l_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
            l_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                      landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
            l_heel = [landmarks[mp_pose.PoseLandmark.LEFT_HEEL.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_HEEL.value].y]
            l_foot_index = [landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value].x,
                           landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value].y]
            l_elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                      landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            l_wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                      landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            
            # Center points
            hip_center = [(r_hip[0] + l_hip[0])/2, (r_hip[1] + l_hip[1])/2]
            shoulder_center = [(r_shoulder[0] + l_shoulder[0])/2, 
                             (r_shoulder[1] + l_shoulder[1])/2]
            
            # === JOINT ANGLES ===
            # Knee angles
            knee_angle_r = calculate_angle(r_hip, r_knee, r_ankle)
            knee_angle_l = calculate_angle(l_hip, l_knee, l_ankle)
            self.knee_angles_r.append(knee_angle_r)
            self.knee_angles_l.append(knee_angle_l)
            
            # Track peak knee flexion (minimum angle)
            self.peak_knee_flexion_r = min(self.peak_knee_flexion_r, knee_angle_r)
            self.peak_knee_flexion_l = min(self.peak_knee_flexion_l, knee_angle_l)
            
            # Hip angles
            hip_angle_r = calculate_angle(r_shoulder, r_hip, r_knee)
            hip_angle_l = calculate_angle(l_shoulder, l_hip, l_knee)
            self.hip_angles_r.append(hip_angle_r)
            self.hip_angles_l.append(hip_angle_l)
            
            # Track peak hip extension (maximum angle)
            self.peak_hip_extension_r = max(self.peak_hip_extension_r, hip_angle_r)
            self.peak_hip_extension_l = max(self.peak_hip_extension_l, hip_angle_l)
            
            # Ankle angles
            ankle_angle_r = calculate_angle(r_knee, r_ankle, r_foot_index)
            ankle_angle_l = calculate_angle(l_knee, l_ankle, l_foot_index)
            self.ankle_angles_r.append(ankle_angle_r)
            self.ankle_angles_l.append(ankle_angle_l)
            
            # Arm swing
            elbow_angle_r, arm_swing_r = calculate_arm_swing(r_shoulder, r_elbow, r_wrist)
            elbow_angle_l, arm_swing_l = calculate_arm_swing(l_shoulder, l_elbow, l_wrist)
            self.elbow_angles_r.append(elbow_angle_r)
            self.elbow_angles_l.append(elbow_angle_l)
            self.arm_swing_angles_r.append(arm_swing_r)
            self.arm_swing_angles_l.append(arm_swing_l)
            
            # === BODY MECHANICS ===
            # Body lean
            body_lean = calculate_body_lean(shoulder_center, hip_center)
            self.body_lean_angles.append(body_lean)
            
            # Vertical oscillation (hip height variation)
            self.vertical_oscillations.append(hip_center[1])
            
            # === STRIDE MECHANICS ===
            # Stride length (horizontal hip displacement)
            if self.previous_hip_center is not None:
                stride_length = abs(hip_center[0] - self.previous_hip_center[0])
                self.stride_lengths.append(stride_length)
                
                # Horizontal velocity
                h_velocity = calculate_velocity(hip_center, self.previous_hip_center, self.fps)
                self.horizontal_velocities.append(h_velocity)
                
                # Vertical velocity
                v_velocity = (hip_center[1] - self.previous_hip_center[1]) * self.fps
                self.vertical_velocities.append(abs(v_velocity))
            
            # Stride width (lateral distance between feet)
            stride_width = abs(r_ankle[0] - l_ankle[0])
            self.stride_widths.append(stride_width)
            
            # === FOOT STRIKE DETECTION ===
            self.ankle_y_history_r.append(r_ankle[1])
            self.ankle_y_history_l.append(l_ankle[1])
            
            # Detect foot strikes
            if detect_foot_strike(self.ankle_y_history_r):
                self.step_count += 1
                self.ground_contact_r.append(frame_num)
                if self.last_foot_strike is not None:
                    # Calculate cadence for this stride
                    stride_time = (frame_num - self.last_foot_strike) / self.fps
                    if stride_time > 0:
                        instantaneous_cadence = 60 / stride_time
                        self.cadence_data.append(instantaneous_cadence)
                self.last_foot_strike = frame_num
            
            if detect_foot_strike(self.ankle_y_history_l):
                self.step_count += 1
                self.ground_contact_l.append(frame_num)
            
            # Update previous positions
            self.previous_hip_center = hip_center
            self.previous_ankle_r = r_ankle
            self.previous_ankle_l = l_ankle
            
            # Return current metrics for display
            return {
                'knee_angle_r': knee_angle_r,
                'knee_angle_l': knee_angle_l,
                'hip_angle_r': hip_angle_r,
                'hip_angle_l': hip_angle_l,
                'ankle_angle_r': ankle_angle_r,
                'ankle_angle_l': ankle_angle_l,
                'body_lean': body_lean,
                'stride_width': stride_width,
                'step_count': self.step_count
            }
            
        except Exception as e:
            print(f"Error updating metrics: {e}")
            return None

    def get_summary(self, video_duration):
        """Generate comprehensive biomechanics summary"""
        summary = {}
        
        # Joint angles
        if self.knee_angles_r:
            summary['knee_r'] = {
                'avg': np.mean(self.knee_angles_r),
                'min': np.min(self.knee_angles_r),
                'max': np.max(self.knee_angles_r),
                'rom': np.max(self.knee_angles_r) - np.min(self.knee_angles_r),
                'std': np.std(self.knee_angles_r)
            }
        
        if self.knee_angles_l:
            summary['knee_l'] = {
                'avg': np.mean(self.knee_angles_l),
                'min': np.min(self.knee_angles_l),
                'max': np.max(self.knee_angles_l),
                'rom': np.max(self.knee_angles_l) - np.min(self.knee_angles_l),
                'std': np.std(self.knee_angles_l)
            }
        
        if self.hip_angles_r:
            summary['hip_r'] = {
                'avg': np.mean(self.hip_angles_r),
                'min': np.min(self.hip_angles_r),
                'max': np.max(self.hip_angles_r),
                'rom': np.max(self.hip_angles_r) - np.min(self.hip_angles_r)
            }
        
        if self.hip_angles_l:
            summary['hip_l'] = {
                'avg': np.mean(self.hip_angles_l),
                'min': np.min(self.hip_angles_l),
                'max': np.max(self.hip_angles_l),
                'rom': np.max(self.hip_angles_l) - np.min(self.hip_angles_l)
            }
        
        if self.ankle_angles_r:
            summary['ankle_r'] = {
                'avg': np.mean(self.ankle_angles_r),
                'min': np.min(self.ankle_angles_r),
                'max': np.max(self.ankle_angles_r),
                'rom': np.max(self.ankle_angles_r) - np.min(self.ankle_angles_r)
            }
        
        if self.ankle_angles_l:
            summary['ankle_l'] = {
                'avg': np.mean(self.ankle_angles_l),
                'min': np.min(self.ankle_angles_l),
                'max': np.max(self.ankle_angles_l),
                'rom': np.max(self.ankle_angles_l) - np.min(self.ankle_angles_l)
            }
        
        # Arm swing
        if self.arm_swing_angles_r:
            summary['arm_swing_r'] = {
                'avg': np.mean(self.arm_swing_angles_r),
                'range': np.max(self.arm_swing_angles_r) - np.min(self.arm_swing_angles_r)
            }
        
        if self.arm_swing_angles_l:
            summary['arm_swing_l'] = {
                'avg': np.mean(self.arm_swing_angles_l),
                'range': np.max(self.arm_swing_angles_l) - np.min(self.arm_swing_angles_l)
            }
        
        # Body mechanics
        if self.body_lean_angles:
            summary['body_lean'] = {
                'avg': np.mean(self.body_lean_angles),
                'min': np.min(self.body_lean_angles),
                'max': np.max(self.body_lean_angles)
            }
        
        if self.vertical_oscillations:
            summary['vertical_oscillation'] = {
                'range': np.max(self.vertical_oscillations) - np.min(self.vertical_oscillations),
                'std': np.std(self.vertical_oscillations)
            }
        
        # Stride mechanics
        if self.stride_lengths:
            summary['stride'] = {
                'avg_length': np.mean(self.stride_lengths),
                'consistency': np.std(self.stride_lengths),
                'avg_width': np.mean(self.stride_widths) if self.stride_widths else 0
            }
        
        # Cadence
        if video_duration > 0 and self.step_count > 0:
            summary['cadence'] = {
                'steps': self.step_count,
                'avg_spm': (self.step_count / video_duration) * 60,
                'instantaneous_avg': np.mean(self.cadence_data) if self.cadence_data else 0
            }
        
        # Asymmetry analysis
        if len(self.ground_contact_r) > 1 and len(self.ground_contact_l) > 1:
            summary['asymmetry'] = {
                'right_contacts': len(self.ground_contact_r),
                'left_contacts': len(self.ground_contact_l),
                'balance': abs(len(self.ground_contact_r) - len(self.ground_contact_l))
            }
        
        # Velocity
        if self.horizontal_velocities:
            summary['velocity'] = {
                'horizontal_avg': np.mean(self.horizontal_velocities),
                'vertical_avg': np.mean(self.vertical_velocities) if self.vertical_velocities else 0
            }
        
        return summary

def analyze_running_video(video_path, export_csv=True):
    """Analyze running video and extract comprehensive biomechanics metrics"""
    
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"Error: Could not open video file: {video_path}")
        print("Please check:")
        print("  1. File path is correct")
        print("  2. Video file exists")
        print("  3. Video format is supported (mp4, avi, mov)")
        return
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    print(f"Video Properties:")
    print(f"  Resolution: {width}x{height}")
    print(f"  FPS: {fps}")
    print(f"  Total frames: {frame_count}")
    print(f"  Duration: {frame_count/fps:.2f} seconds")
    print("\n🏃 Analyzing comprehensive biomechanics...\n")
    
    # Initialize biomechanics tracker
    tracker = BiomechanicsTracker(fps)
    
    # CSV data storage
    csv_data = []
    
    # Initialize MediaPipe Pose
    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as pose:
        
        frame_num = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_num += 1
            
            # Convert to RGB
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            
            # Process with MediaPipe
            results = pose.process(image)
            
            # Convert back to BGR
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            
            if results.pose_landmarks:
                # Draw pose
                mp_drawing.draw_landmarks(
                    image, 
                    results.pose_landmarks, 
                    mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
                )
                
                # Update biomechanics
                metrics = tracker.update(results.pose_landmarks.landmark, frame_num)
                
                if metrics:
                    # Store for CSV
                    csv_row = {
                        'frame': frame_num,
                        'time_sec': frame_num / fps,
                        **metrics
                    }
                    csv_data.append(csv_row)
                    
                    # Display on frame
                    h, w, _ = image.shape
                    cv2.rectangle(image, (5, 5), (400, 200), (0, 0, 0), -1)
                    
                    y_offset = 25
                    cv2.putText(image, f'Right Knee: {int(metrics["knee_angle_r"])}°', 
                               (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                    y_offset += 20
                    cv2.putText(image, f'Left Knee: {int(metrics["knee_angle_l"])}°', 
                               (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                    y_offset += 20
                    cv2.putText(image, f'Right Hip: {int(metrics["hip_angle_r"])}°', 
                               (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 100), 1)
                    y_offset += 20
                    cv2.putText(image, f'Body Lean: {metrics["body_lean"]:.1f}°', 
                               (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 255, 255), 1)
                    y_offset += 20
                    cv2.putText(image, f'Steps: {metrics["step_count"]}', 
                               (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                    y_offset += 20
                    cv2.putText(image, f'Frame: {frame_num}/{frame_count}', 
                               (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    y_offset += 20
                    cv2.putText(image, f'Progress: {int(frame_num/frame_count*100)}%', 
                               (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Display
            display_width = 1280
            if image.shape[1] > display_width:
                scale = display_width / image.shape[1]
                image = cv2.resize(image, None, fx=scale, fy=scale)
            
            cv2.imshow('Biomechanics Analysis - Press Q to quit, P to pause', image)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                print("\nAnalysis stopped by user.")
                break
            elif key == ord('p'):
                print("Paused. Press any key to continue...")
                cv2.waitKey(0)
        
        cap.release()
        cv2.destroyAllWindows()
        
        # Get comprehensive summary
        video_duration = frame_count / fps
        summary = tracker.get_summary(video_duration)
        
        # Print detailed summary
        print_biomechanics_summary(summary, video_duration, frame_num, len(csv_data))
        
        # Export to CSV
        if export_csv and csv_data:
            csv_filename = 'running_biomechanics_data.csv'
            with open(csv_filename, 'w', newline='') as csvfile:
                fieldnames = csv_data[0].keys()
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(csv_data)
            print(f"\n📊 Data exported to: {csv_filename}")

def print_biomechanics_summary(summary, video_duration, total_frames, detected_frames):
    """Print comprehensive biomechanics summary"""
    
    print("\n" + "="*70)
    print("COMPREHENSIVE BIOMECHANICS ANALYSIS")
    print("="*70)
    
    # Right vs Left Knee
    if 'knee_r' in summary and 'knee_l' in summary:
        print("\n🦵 KNEE BIOMECHANICS:")
        print(f"  Right Knee:")
        print(f"    Average angle: {summary['knee_r']['avg']:.1f}°")
        print(f"    Peak flexion: {summary['knee_r']['min']:.1f}°")
        print(f"    Full extension: {summary['knee_r']['max']:.1f}°")
        print(f"    Range of Motion: {summary['knee_r']['rom']:.1f}°")
        print(f"    Consistency (std): {summary['knee_r']['std']:.1f}°")
        
        print("  Left Knee:")
        print(f"    Average angle: {summary['knee_l']['avg']:.1f}°")
        print(f"    Peak flexion: {summary['knee_l']['min']:.1f}°")
        print(f"    Full extension: {summary['knee_l']['max']:.1f}°")
        print(f"    Range of Motion: {summary['knee_l']['rom']:.1f}°")
        print(f"    Consistency (std): {summary['knee_l']['std']:.1f}°")
        
        # Asymmetry
        asymmetry = abs(summary['knee_r']['avg'] - summary['knee_l']['avg'])
        print(f"  ⚖️  Knee Asymmetry: {asymmetry:.1f}° difference")
        if asymmetry > 5:
            print("      ⚠️  Significant asymmetry detected!")
    
    # Hip biomechanics
    if 'hip_r' in summary and 'hip_l' in summary:
        print("\n🏃 HIP BIOMECHANICS:")
        print("  Right Hip:")
        print(f"    Average: {summary['hip_r']['avg']:.1f}°")
        print(f"    Max extension: {summary['hip_r']['max']:.1f}°")
        print(f"    Range of Motion: {summary['hip_r']['rom']:.1f}°")
        
        print("  Left Hip:")
        print(f"    Average: {summary['hip_l']['avg']:.1f}°")
        print(f"    Max extension: {summary['hip_l']['max']:.1f}°")
        print(f"    Range of Motion: {summary['hip_l']['rom']:.1f}°")
        
        hip_asymmetry = abs(summary['hip_r']['avg'] - summary['hip_l']['avg'])
        print(f"  ⚖️  Hip Asymmetry: {hip_asymmetry:.1f}° difference")
    
    # Ankle biomechanics
    if 'ankle_r' in summary and 'ankle_l' in summary:
        print("\n👟 ANKLE BIOMECHANICS:")
        print("  Right Ankle:")
        print(f"    Average: {summary['ankle_r']['avg']:.1f}°")
        print(f"    Dorsiflexion: {summary['ankle_r']['min']:.1f}°")
        print(f"    Plantarflexion: {summary['ankle_r']['max']:.1f}°")
        print(f"    Range of Motion: {summary['ankle_r']['rom']:.1f}°")
        
        print("  Left Ankle:")
        print(f"    Average: {summary['ankle_l']['avg']:.1f}°")
        print(f"    Dorsiflexion: {summary['ankle_l']['min']:.1f}°")
        print(f"    Plantarflexion: {summary['ankle_l']['max']:.1f}°")
        print(f"    Range of Motion: {summary['ankle_l']['rom']:.1f}°")
    
    # Arm swing
    if 'arm_swing_r' in summary and 'arm_swing_l' in summary:
        print("\n💪 ARM SWING:")
        print("  Right Arm:")
        print(f"    Average swing: {summary['arm_swing_r']['avg']:.1f}°")
        print(f"    Swing range: {summary['arm_swing_r']['range']:.1f}°")
        
        print("  Left Arm:")
        print(f"    Average swing: {summary['arm_swing_l']['avg']:.1f}°")
        print(f"    Swing range: {summary['arm_swing_l']['range']:.1f}°")
        
        arm_balance = abs(summary['arm_swing_r']['avg'] - summary['arm_swing_l']['avg'])
        print(f"  ⚖️  Arm Balance: {arm_balance:.1f}° difference")
        if arm_balance > 10:
            print("      ⚠️  Uneven arm swing detected!")
    
    # Body lean
    if 'body_lean' in summary:
        print("\n🔺 BODY POSITION:")
        print("  Average forward lean: {summary['body_lean']['avg']:.1f}°")
        print("  Min lean: {summary['body_lean']['min']:.1f}°")
        print("  Max lean: {summary['body_lean']['max']:.1f}°")
        if summary['body_lean']['avg'] < 3:
            print("      ✅ Good upright posture")
        elif summary['body_lean']['avg'] < 8:
            print("      ✅ Optimal running lean")
        else:
            print("      ⚠️  Excessive forward lean")
    
    # Vertical oscillation
    if 'vertical_oscillation' in summary:
        print("\n📏 VERTICAL OSCILLATION:")
        print("  Total range: {summary['vertical_oscillation']['range']:.4f} (normalized)")
        print("  Consistency: {summary['vertical_oscillation']['std']:.4f}")
        if summary['vertical_oscillation']['std'] < 0.01:
            print(f"      ✅ Very stable vertical movement")
        else:
            print(f"      ⚠️  Variable vertical bounce")
    
    # Stride
    if 'stride' in summary:
        print("\n👣 STRIDE MECHANICS:")
        print(f"  Average stride length: {summary['stride']['avg_length']:.4f} (normalized)")
        print(f"  Stride consistency: {summary['stride']['consistency']:.4f}")
        print(f"  Average stride width: {summary['stride']['avg_width']:.4f} (normalized)")
        if summary['stride']['consistency'] < 0.005:
            print(f"      ✅ Highly consistent stride")
        else:
            print(f"      ⚠️  Variable stride pattern")
    
    # Cadence
    if 'cadence' in summary:
        print(f"\n⚡ CADENCE & RHYTHM:")
        print(f"  Total steps: {summary['cadence']['steps']}")
        print(f"  Average cadence: {summary['cadence']['avg_spm']:.1f} steps/min")
        if summary['cadence']['instantaneous_avg'] > 0:
            print(f"  Stride-to-stride avg: {summary['cadence']['instantaneous_avg']:.1f} steps/min")
        
        if 170 <= summary['cadence']['avg_spm'] <= 190:
            print(f"      ✅ Optimal cadence range (elite runners)")
        elif 160 <= summary['cadence']['avg_spm'] < 170:
            print(f"      ✅ Good cadence (recreational runners)")
        else:
            print(f"      ⚠️  Consider increasing cadence to 170-180")
    
    # Asymmetry
    if 'asymmetry' in summary:
        print(f"\n⚖️  GAIT SYMMETRY:")
        print(f"  Right foot contacts: {summary['asymmetry']['right_contacts']}")
        print(f"  Left foot contacts: {summary['asymmetry']['left_contacts']}")
        print(f"  Imbalance: {summary['asymmetry']['balance']} steps")
        
        if summary['asymmetry']['balance'] <= 2:
            print(f"      ✅ Excellent symmetry")
        elif summary['asymmetry']['balance'] <= 5:
            print(f"      ✅ Good symmetry")
        else:
            print(f"      ⚠️  Significant asymmetry - may indicate injury risk")
    
    # Velocity
    if 'velocity' in summary:
        print(f"\n🚀 MOVEMENT VELOCITY:")
        print(f"  Horizontal velocity: {summary['velocity']['horizontal_avg']:.2f} (relative)")
        print(f"  Vertical velocity: {summary['velocity']['vertical_avg']:.2f} (relative)")
    
    # Analysis quality
    print(f"\n📊 ANALYSIS QUALITY:")
    print(f"  Video duration: {video_duration:.1f} seconds")
    print(f"  Total frames: {total_frames}")
    print(f"  Frames with pose detected: {detected_frames}")
    print(f"  Detection rate: {detected_frames/total_frames*100:.1f}%")
    
    print("="*70)

# Main execution
if __name__ == "__main__":
    print("="*70)
    print("COMPREHENSIVE RUNNING BIOMECHANICS ANALYSIS")
    print("="*70)
    print("\nThis tool analyzes:")
    print("  ✓ Joint angles (knees, hips, ankles)")
    print("  ✓ Arm swing mechanics")
    print("  ✓ Body lean and posture")
    print("  ✓ Stride length, width, and consistency")
    print("  ✓ Vertical oscillation")
    print("  ✓ Cadence and rhythm")
    print("  ✓ Left/right asymmetry")
    print("  ✓ Movement velocities")
    print("\nControls:")
    print("  - Press 'Q' to quit analysis")
    print("  - Press 'P' to pause/resume")
    print("\n" + "="*70)
    
    # Video path
    video_path = "running_video2.mp4"  # ⚠️ CHANGE THIS to your video file
    
    print(f"\nLooking for video: {video_path}")
    print("Starting comprehensive analysis...\n")
    
    analyze_running_video(video_path, export_csv=True)
    
    print("\n✅ Analysis complete!")
    print("📊 Check 'running_biomechanics_data.csv' for detailed frame-by-frame data")
