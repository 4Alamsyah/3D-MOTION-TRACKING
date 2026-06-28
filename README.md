# 🎬 Motion Capture 3D

**Real-time 3D body motion capture** — Detect body movements from camera using MediaPipe, display as a living 3D skeleton in browser with Three.js.

> Camera → Python (MediaPipe Pose) → WebSocket → Browser (Three.js 3D)

## 🎯 Features

✨ **Real-time Pose Detection** — MediaPipe detects 33 body landmarks (head, shoulders, hands, feet)  
🎨 **3D Skeleton Animation** — Three.js renders skeleton with gradient color per body part  
👻 **Ghost Trail Effect** — 4-frame shadow for smooth motion visualization  
💫 **Bloom Glow** — UnrealBloomPass post-processing for sci-fi effects  
🎮 **OrbitControls** — Drag to rotate, scroll to zoom  
🌐 **WebSocket Real-time** — Stream pose data directly to browser, minimal latency  
📹 **Multi-camera Support** — Switch cameras via command-line  
🖥️ **Windows DirectShow** — Stable & fast camera backend  

## 📋 Requirements

- **Python 3.8+**
- **Webcam / USB Camera**
- **Modern browser** (Chrome, Firefox, Edge with WebGL support)
- **XAMPP** (or any web server to serve `index.html`)

## 🚀 Quick Start

### 1️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

Or auto-install via `start.bat`:
```bash
start.bat
```

### 2️⃣ Run Python Server

```bash
python server.py
```

**Expected output:**
```
[12:15:00] Motion Capture 3D — Server
[12:15:00] WebSocket active  →  ws://localhost:8765
[12:15:00] Open browser      →  http://localhost/3dproject/
[12:15:00] Camera active. Press 'Q' in preview window to exit.
```

OpenCV preview window will appear showing skeleton in real-time.

### 3️⃣ Open in Browser

```
http://localhost/3dproject/
```

The 3D skeleton will appear and follow your body movements! 🎉

---

## 🎮 Controls

### Browser
- **Left Drag** — Rotate camera (orbital)
- **Scroll** — Zoom in/out
- **Right Drag** — Pan camera

### Camera Preview
- **Q** — Exit program

---

## 🎥 Switch Camera

### List Available Cameras
```bash
python server.py --list
```

Example output:
```
[12:19:28] Scanning available cameras...
[12:19:30]   [0] Camera detected  (640x480)
[12:19:31]   [1] Camera detected  (640x480)
[12:19:32] Available camera indexes: [0, 1, 2]
```

### Use Specific Camera
```bash
python server.py --camera 1
```

### Advanced Options

```bash
python server.py --camera 1 --width 1280 --height 720 --fps 30
```

| Argument | Function | Default |
|---|---|---|
| `-c`, `--camera` | Camera index | `0` |
| `-l`, `--list` | List cameras and exit | - |
| `--width` | Camera frame width (px) | `640` |
| `--height` | Camera frame height (px) | `480` |
| `--fps` | Target camera FPS | `30` |

---

## 📂 Project Structure

```
3dproject/
├── index.html           # Web UI (dark space theme)
├── js/
│   └── app.js          # Three.js scene, skeleton, WebSocket client
├── server.py           # Python: OpenCV + MediaPipe + WebSocket
├── requirements.txt    # Python dependencies
├── start.bat           # Windows launcher (auto-install deps)
└── README.md           # This file
```

---

## 🏗️ Architecture

### Backend (Python)

```
Camera (OpenCV)
    ↓
MediaPipe Pose Landmarker (33 landmarks)
    ↓
JSON: {x, y, z, visibility}
    ↓
WebSocket Server (asyncio)
    ↓
All Connected Clients
```

**File:** `server.py`

**Key Features:**
- Model: `pose_landmarker_lite` (~5 MB, auto-download on first run)
- Mode: VIDEO (smooth tracking between frames)
- Backend: DirectShow (Windows) or default OpenCV
- WebSocket: `ws://localhost:8765`

### Frontend (Browser)

```
WebSocket Client
    ↓
Parse Landmarks
    ↓
Smooth Lerp Interpolation
    ↓
Update Three.js Scene
    ├─ 33 Joint Spheres (glossy material + emissive)
    ├─ Bone Lines (Line2 with actual linewidth)
    ├─ Ghost Trail (4 frame fading)
    └─ Lighting + Bloom Post-Process
    ↓
Render with EffectComposer
```

**File:** `js/app.js`

**Key Features:**
- Three.js v0.165.0 (CDN)
- Scene: Dark space theme + starfield
- Lighting: 2 rim lights + 1 fill light
- Post-processing: Bloom (UnrealBloomPass)
- Controls: OrbitControls with damping
- Bone color: Gradient per body part
- Ghost trail: Smooth lerp + 4-frame buffer

---

## 🔧 Dependencies

```
opencv-python>=4.8.0        # Camera & image processing
mediapipe>=0.10.21          # Pose detection (Tasks API)
websockets>=12.0            # WebSocket server/client
```

**Frontend (CDN):**
- Three.js v0.165.0
- EffectComposer, UnrealBloomPass
- OrbitControls
- Line2 (for bone width support)

---

## 🎨 Customization

### Skeleton Colors

Edit `js/app.js`:

```javascript
function jointColor(i) {
    if (i === 0)               return 0xffcc44; // nose (yellow)
    if (i <= 10)               return 0xff66aa; // face (pink)
    if (i === 11 || i === 12)  return 0x00ffff; // shoulders (cyan)
    // ...
}
```

### Bloom Intensity

```javascript
composer.addPass(new UnrealBloomPass(
    new THREE.Vector2(W(), H()),
    1.4,   // strength (0-3, increase for brighter)
    0.55,  // radius
    0.78   // threshold
));
```

### Lighting

```javascript
const rimA = new THREE.PointLight(0x00ffff, 10, 22); // cyan rim
const rimB = new THREE.PointLight(0x8833ff, 6, 18);  // purple rim
const fillLight = new THREE.PointLight(0xffffff, 2, 10); // white fill
```

### Skeleton Smoothing

```javascript
const LERP = 0.22; // (0-1) increase for jerk, decrease for lag
```

---

## ⚠️ Troubleshooting

### **"Module Not Found: mediapipe"**
```bash
pip install mediapipe websockets opencv-python -U
```

### **"Failed to Open Camera"**
1. Check available cameras: `python server.py --list`
2. Allow camera access in Windows Settings
3. Close other apps using camera (Zoom, Discord, etc)
4. Try different camera: `python server.py --camera 1`

### **Browser Cannot Connect to Server**
1. Ensure server is running: Check server console for "WebSocket active" log
2. Check Windows Firewall: Allow Python through firewall
3. Refresh browser (F5)
4. Check browser console (F12 → Console) for WebSocket errors

### **Pose Not Detected**
1. Step back further from camera (~1.5 meters)
2. Ensure **full body** is visible in preview
3. Lighting must be bright enough
4. MediaPipe needs confidence threshold ≥ 0.5

### **Skeleton Jitter/Tremor**
1. Increase `CAM_FPS` for smoother tracking
2. Decrease `LERP` in `js/app.js` for finer interpolation
3. Use higher quality camera (more stable frame capture)

---

## 📊 Performance

| Metric | Value |
|---|---|
| **Model Load Time** | ~2-3 seconds (first run, auto-download) |
| **Pose Detection FPS** | 25-30 fps (depends on CPU & camera) |
| **WebSocket Latency** | <50ms (local) |
| **Browser Render** | 60 fps (GPU permitting) |
| **Memory Usage** | ~200-300 MB (Python + MediaPipe) |

---

## 🎓 How It Works

### 1. **Pose Detection** (MediaPipe)
MediaPipe uses deep learning (pose_landmarker_lite) to:
- Detect head, shoulders, elbows, wrists, hips, knees, ankles
- Output: 33 landmarks with coordinates (x, y, z) and visibility confidence (0-1)
- Z-axis: relative depth, useful for occlusion detection

### 2. **WebSocket Streaming** (asyncio)
- Server sends landmark JSON **every frame** (30 fps)
- Broadcasts to all connected clients
- Auto-reconnect in browser if connection drops

### 3. **3D Rendering** (Three.js)
- Each landmark = sphere with radius based on joint importance
- Bones = Line2 (custom line renderer with actual linewidth)
- Smooth interpolation (Lerp) for natural movement
- Ghost trail for visual residual motion

### 4. **Visual Effects**
- **Bloom**: Adds sci-fi glow effect
- **Rim Lighting**: Highlights edges for better depth perception
- **Starfield**: Background ambiance

---

## 🚀 Future Enhancements

- [ ] **Hand Tracking** — Detect hand gestures (MediaPipe Hands)
- [ ] **Face Tracking** — Facial expressions & head rotation (MediaPipe Face Mesh)
- [ ] **Recording** — Save pose data to JSON for playback
- [ ] **Multi-person** — Support multiple skeletons simultaneously
- [ ] **VR Export** — Export avatar for game/VR import
- [ ] **Web UI Controls** — Sliders to tweak bloom, lighting, etc without editing code
- [ ] **Mobile Support** — PWA + mobile camera
- [ ] **GPU Optimization** — CUDA support for faster pose detection

---

## 📝 License

MIT License — Free to use, modify, and share.

---

## 👤 Author

Created with ❤️ for Motion Capture enthusiasts

**Questions?** Open an issue on GitHub!

---

## 🎬 Demo / Screenshots

_(Tambahkan screenshot skeleton 3D kalau sudah jalan)_

**Status:** ✅ Working  
**Last Updated:** 2026-06-28

---

Made with Three.js + MediaPipe + asyncio WebSocket 🚀
