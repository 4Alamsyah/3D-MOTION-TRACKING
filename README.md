# 🎬 Motion Capture 3D

**Real-time 3D body motion capture** — Deteksi gerakan tubuh dari kamera menggunakan MediaPipe, tampilkan sebagai skeleton 3D yang hidup di browser dengan Three.js.

> Kamera → Python (MediaPipe Pose) → WebSocket → Browser (Three.js 3D)

## 🎯 Features

✨ **Real-time Pose Detection** — MediaPipe mendeteksi 33 landmark tubuh (kepala, bahu, tangan, kaki)  
🎨 **3D Skeleton Animation** — Three.js render skeleton dengan warna gradasi per bagian tubuh  
👻 **Ghost Trail Effect** — 4-frame bayangan untuk visual gerakan yang smooth  
💫 **Bloom Glow** — Post-processing UnrealBloomPass untuk efek sci-fi  
🎮 **OrbitControls** — Drag kamera untuk rotasi, scroll untuk zoom  
🌐 **WebSocket Real-time** — Streaming pose data langsung ke browser, latency minimal  
📹 **Multi-camera Support** — Ganti kamera lewat command-line  
🖥️ **Windows DirectShow** — Backend kamera yang stabil & cepat  

## 📋 Requirements

- **Python 3.8+**
- **Webcam / USB Camera**
- **Modern browser** (Chrome, Firefox, Edge dengan WebGL support)
- **XAMPP** (atau web server lain untuk serve `index.html`)

## 🚀 Quick Start

### 1️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

Atau auto-install lewat `start.bat`:
```bash
start.bat
```

### 2️⃣ Jalankan Server Python

```bash
python server.py
```

**Output yang diharapkan:**
```
[12:15:00] Motion Capture 3D — Server
[12:15:00] WebSocket aktif  →  ws://localhost:8765
[12:15:00] Buka browser     →  http://localhost/3dproject/
[12:15:00] Kamera aktif. Tekan 'Q' di jendela preview untuk keluar.
```

Jendela OpenCV preview akan muncul menampilkan skeleton real-time.

### 3️⃣ Buka Browser

```
http://localhost/3dproject/
```

Skeleton 3D akan muncul dan mengikuti gerakan tubuh Anda di kamera! 🎉

---

## 🎮 Controls

### Browser
- **Drag kiri** — Putar kamera (orbital)
- **Scroll** — Zoom in/out
- **Drag kanan** — Pan kamera

### Preview Kamera
- **Q** — Keluar dari program

---

## 🎥 Ganti Kamera

### Lihat Kamera yang Tersedia
```bash
python server.py --list
```

Output contoh:
```
[12:19:28] Memindai kamera yang tersedia...
[12:19:30]   [0] Kamera terdeteksi  (640x480)
[12:19:31]   [1] Kamera terdeteksi  (640x480)
[12:19:32] Kamera tersedia di index: [0, 1, 2]
```

### Pakai Kamera Tertentu
```bash
python server.py --camera 1
```

### Opsi Lanjutan

```bash
python server.py --camera 1 --width 1280 --height 720 --fps 30
```

| Argumen | Fungsi | Default |
|---|---|---|
| `-c`, `--camera` | Index kamera | `0` |
| `-l`, `--list` | Tampilkan daftar kamera lalu keluar | - |
| `--width` | Lebar frame kamera (px) | `640` |
| `--height` | Tinggi frame kamera (px) | `480` |
| `--fps` | Target FPS kamera | `30` |

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
└── README.md           # File ini
```

---

## 🏗️ Architecture

### Backend (Python)

```
Kamera (OpenCV)
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
- Model: `pose_landmarker_lite` (~5 MB, auto-download)
- Mode: VIDEO (smooth tracking antar frame)
- Backend: DirectShow (Windows) atau default OpenCV
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
    ├─ Bone Lines (Line2 dengan linewidth)
    ├─ Ghost Trail (4 frame fading)
    └─ Lighting + Bloom Post-Process
    ↓
Render dengan EffectComposer
```

**File:** `js/app.js`

**Key Features:**
- Three.js v0.165.0 (CDN)
- Scene: Dark space theme + starfield
- Lighting: 2 rim lights + 1 fill light
- Post-processing: Bloom (UnrealBloomPass)
- Controls: OrbitControls + damping
- Bone color: Gradient per bagian tubuh
- Ghost trail: Lerp smooth + 4-frame buffer

---

## 🔧 Dependencies

```
opencv-python>=4.8.0        # Kamera & image processing
mediapipe>=0.10.21          # Pose detection (Tasks API)
websockets>=12.0            # WebSocket server/client
```

**Frontend (CDN):**
- Three.js v0.165.0
- EffectComposer, UnrealBloomPass
- OrbitControls
- Line2 (untuk bone width support)

---

## 🎨 Customization

### Warna Skeleton

Edit `js/app.js`:

```javascript
function jointColor(i) {
    if (i === 0)               return 0xffcc44; // nose (kuning)
    if (i <= 10)               return 0xff66aa; // face (pink)
    if (i === 11 || i === 12)  return 0x00ffff; // shoulders (cyan)
    // ...
}
```

### Bloom Intensity

```javascript
composer.addPass(new UnrealBloomPass(
    new THREE.Vector2(W(), H()),
    1.4,   // strength (0-3, naikkan untuk lebih terang)
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
const LERP = 0.22; // (0-1) naikkan untuk jerk, turunkan untuk lag
```

---

## ⚠️ Troubleshooting

### **"Module Not Found: mediapipe"**
```bash
pip install mediapipe websockets opencv-python -U
```

### **"Gagal Membuka Kamera"**
1. Cek kamera yang tersedia: `python server.py --list`
2. Izinkan akses kamera di Windows Settings
3. Tutup aplikasi lain yang pakai kamera (Zoom, Discord, etc)
4. Coba kamera berbeda: `python server.py --camera 1`

### **Browser Tidak Konek ke Server**
1. Pastikan server jalan: Cek console server harus ada log "WebSocket aktif"
2. Cek firewall Windows: Allow Python melalui Windows Firewall
3. Refresh browser (F5)
4. Cek console browser (F12 → Console) untuk error WebSocket

### **Pose Tidak Terdeteksi**
1. Mundur lebih jauh dari kamera (±1.5 meter)
2. Pastikan tubuh terlihat **utuh** di layar preview
3. Pencahayaan harus cukup terang
4. MediaPipe perlu confidence threshold ≥ 0.5

### **Skeleton Jitter/Tremor**
1. Naikkan `CAM_FPS` untuk lebih smooth tracking
2. Turunkan `LERP` di `js/app.js` untuk interpolasi lebih halus
3. Pakai kamera yang lebih baik (lebih stabil frame-nya)

---

## 📊 Performance

| Metric | Value |
|---|---|
| **Model Load Time** | ~2-3 detik (first run, auto-download) |
| **Pose Detection FPS** | 25-30 fps (tergantung CPU & kamera) |
| **WebSocket Latency** | <50ms (lokal) |
| **Browser Render** | 60 fps (memungkinkan GPU) |
| **Memory Usage** | ~200-300 MB (Python + MediaPipe) |

---

## 🎓 How It Works

### 1. **Pose Detection** (MediaPipe)
MediaPipe menggunakan deep learning (pose_landmarker_lite) untuk:
- Deteksi kepala, bahu, siku, pergelangan tangan, pinggul, lutut, pergelangan kaki
- Output: 33 landmark dengan koordinat (x, y, z) dan visibility confidence (0-1)
- Z-axis: depth (relative), berguna untuk occlusion detection

### 2. **WebSocket Streaming** (asyncio)
- Server mengirim landmark JSON **setiap frame** (30 fps)
- Broadcast ke semua klien yang terhubung
- Auto-reconnect di browser kalau terputus

### 3. **3D Rendering** (Three.js)
- Setiap landmark = sphere dengan radius tergantung joint importance
- Bones = Line2 (custom line renderer dengan linewidth nyata)
- Smooth interpolation (Lerp) untuk gerakan natural
- Ghost trail untuk visual residual gerakan

### 4. **Visual Effects**
- **Bloom**: Menambah glow sci-fi-ish
- **Ambient Occlusion**: (opsional di masa depan)
- **Shadows**: (opsional di masa depan)

---

## 🚀 Future Enhancements

- [ ] **Hand Tracking** — Deteksi gesture tangan (MediaPipe Hands)
- [ ] **Face Tracking** — Ekspresi wajah & head rotation (MediaPipe Face Mesh)
- [ ] **Recording** — Save pose data ke JSON untuk playback nanti
- [ ] **Multi-person** — Support multiple skeleton sekaligus
- [ ] **VR Export** — Buat avatar yang bisa di-import ke game/VR
- [ ] **Web UI Controls** — Slider untuk tweak bloom, lighting, dll tanpa edit code
- [ ] **Mobile Support** — PWA + mobile camera
- [ ] **GPU Optimization** — CUDA support untuk faster pose detection

---

## 📝 License

MIT License — Bebas dipakai, dimodif, dan di-share.

---

## 👤 Author

Created with ❤️ for **Motion Capture enthusiasts**

**Questions?** Buka issue atau diskusi di GitHub!

---

## 🎬 Demo / Screenshots

**Status:** ✅ Working  
**Last Updated:** 2026-06-28

---

Made with Three.js + MediaPipe + asyncio WebSocket 🚀
