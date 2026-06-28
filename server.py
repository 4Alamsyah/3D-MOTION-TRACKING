#!/usr/bin/env python3
"""
Motion Capture 3D — WebSocket Server
Uses MediaPipe Tasks API (mediapipe >= 0.10.21).
"""

import argparse
import asyncio
import json
import logging
import os
import sys
import time
import urllib.request

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

import websockets
import websockets.exceptions

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

HOST = "localhost"
PORT = 8765

MODEL_PATH = "pose_landmarker_lite.task"
MODEL_URL  = (
    "https://storage.googleapis.com/mediapipe-models/"
    "pose_landmarker/pose_landmarker_lite/float16/latest/"
    "pose_landmarker_lite.task"
)

# Skeleton connections (same as MediaPipe Pose)
CONNECTIONS = [
    (0,1),(1,2),(2,3),(3,7),(0,4),(4,5),(5,6),(6,8),(9,10),
    (11,12),(11,23),(12,24),(23,24),
    (11,13),(13,15),(15,17),(15,19),(15,21),(17,19),
    (12,14),(14,16),(16,18),(16,20),(16,22),(18,20),
    (23,25),(25,27),(27,29),(27,31),(29,31),
    (24,26),(26,28),(28,30),(28,32),(30,32),
]

CLIENTS: set = set()

# Camera settings (overridable via command-line)
CAM_INDEX  = 0
CAM_WIDTH  = 640
CAM_HEIGHT = 480
CAM_FPS    = 30


def list_cameras(max_index=6):
    """Scan camera indexes 0..max_index and report which ones work."""
    log.info("Memindai kamera yang tersedia...")
    found = []
    for i in range(max_index):
        cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
        if cap.isOpened():
            ok, _ = cap.read()
            if ok:
                w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                log.info(f"  [{i}] Kamera terdeteksi  ({w}x{h})")
                found.append(i)
        cap.release()
    if not found:
        log.warning("  Tidak ada kamera yang terdeteksi.")
    else:
        log.info(f"Kamera tersedia di index: {found}")
        log.info(f"Pakai kamera lain dengan:  python server.py --camera <index>")
    return found


def download_model():
    if os.path.exists(MODEL_PATH):
        log.info(f"Model ditemukan: {MODEL_PATH}")
        return
    log.info("Mendownload model pose (±5 MB)...")
    log.info(f"URL: {MODEL_URL}")
    try:
        def progress(count, block, total):
            pct = min(int(count * block * 100 / total), 100)
            print(f"\r  Downloading... {pct}%", end="", flush=True)
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH, reporthook=progress)
        print()
        log.info("Model berhasil didownload.")
    except Exception as e:
        print()
        log.error(f"Gagal download model: {e}")
        log.error("Coba download manual dan taruh di folder yang sama dengan server.py:")
        log.error(f"  {MODEL_URL}")
        sys.exit(1)


async def on_connect(websocket):
    CLIENTS.add(websocket)
    log.info(f"Klien terhubung  (total: {len(CLIENTS)})")
    try:
        await websocket.wait_closed()
    finally:
        CLIENTS.discard(websocket)
        log.info(f"Klien terputus  (total: {len(CLIENTS)})")


async def broadcast(payload: str):
    if not CLIENTS:
        return
    dead = set()
    for ws in list(CLIENTS):
        try:
            await ws.send(payload)
        except Exception:
            dead.add(ws)
    CLIENTS.difference_update(dead)


async def camera_loop():
    download_model()

    log.info("Membuat pose landmarker...")
    base_opts = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
    options   = mp_vision.PoseLandmarkerOptions(
        base_options=base_opts,
        running_mode=mp_vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    log.info(f"Membuka kamera index {CAM_INDEX}...")
    # CAP_DSHOW = DirectShow backend, lebih stabil & cepat dibuka di Windows
    cap = cv2.VideoCapture(CAM_INDEX, cv2.CAP_DSHOW)
    if not cap.isOpened():
        log.warning(f"Kamera {CAM_INDEX} gagal dengan DirectShow, coba backend default...")
        cap = cv2.VideoCapture(CAM_INDEX)
    if not cap.isOpened():
        log.error(f"Gagal membuka kamera index {CAM_INDEX}!")
        log.error("Jalankan 'python server.py --list' untuk melihat kamera yang tersedia.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  CAM_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAM_HEIGHT)
    cap.set(cv2.CAP_PROP_FPS,          CAM_FPS)

    log.info("Siap! Tekan Q di jendela preview untuk keluar.")

    with mp_vision.PoseLandmarker.create_from_options(options) as landmarker:
        while True:
            ok, frame = cap.read()
            if not ok:
                await asyncio.sleep(0.033)
                continue

            frame = cv2.flip(frame, 1)
            rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            mp_image     = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            timestamp_ms = int(time.monotonic() * 1000)
            result       = landmarker.detect_for_video(mp_image, timestamp_ms)

            h, w = frame.shape[:2]

            if result.pose_landmarks:
                lms = result.pose_landmarks[0]

                payload = json.dumps({
                    "type": "pose",
                    "landmarks": [
                        {
                            "x": float(lm.x),
                            "y": float(lm.y),
                            "z": float(lm.z),
                            "v": float(lm.visibility) if lm.visibility is not None else 1.0,
                        }
                        for lm in lms
                    ],
                })
                await broadcast(payload)

                # Draw skeleton on preview
                for a, b in CONNECTIONS:
                    if a < len(lms) and b < len(lms):
                        la, lb = lms[a], lms[b]
                        va = la.visibility if la.visibility is not None else 1.0
                        vb = lb.visibility if lb.visibility is not None else 1.0
                        if va > 0.3 and vb > 0.3:
                            pt1 = (int(la.x * w), int(la.y * h))
                            pt2 = (int(lb.x * w), int(lb.y * h))
                            cv2.line(frame, pt1, pt2, (0, 180, 255), 2)

                for lm in lms:
                    v = lm.visibility if lm.visibility is not None else 1.0
                    if v > 0.5:
                        cx, cy = int(lm.x * w), int(lm.y * h)
                        cv2.circle(frame, (cx, cy), 5, (0, 255, 200), -1)

                cv2.putText(frame, f"POSE OK  |  klien: {len(CLIENTS)}",
                            (10, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 200), 2)
            else:
                cv2.putText(frame, "Pose tidak terdeteksi — mundur sedikit",
                            (10, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 100, 255), 2)

            cv2.imshow("Motion Capture Preview  [Q = Keluar]", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

            await asyncio.sleep(0)

    cap.release()
    cv2.destroyAllWindows()
    log.info("Kamera ditutup.")


async def main():
    log.info("=" * 52)
    log.info("  Motion Capture 3D — Server")
    log.info("=" * 52)

    async with websockets.serve(
        on_connect, HOST, PORT,
        ping_interval=20,
        ping_timeout=10,
    ):
        log.info(f"WebSocket aktif  →  ws://{HOST}:{PORT}")
        log.info(f"Buka browser     →  http://localhost/3dproject/")
        log.info("-" * 52)
        await camera_loop()

    log.info("Server dihentikan.")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Motion Capture 3D — WebSocket Server (OpenCV + MediaPipe)"
    )
    parser.add_argument("-c", "--camera", type=int, default=0,
                        help="Index kamera yang dipakai (default: 0)")
    parser.add_argument("-l", "--list", action="store_true",
                        help="Tampilkan daftar kamera yang tersedia lalu keluar")
    parser.add_argument("--width",  type=int, default=640, help="Lebar frame kamera")
    parser.add_argument("--height", type=int, default=480, help="Tinggi frame kamera")
    parser.add_argument("--fps",    type=int, default=30,  help="FPS kamera")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    if args.list:
        list_cameras()
        sys.exit(0)

    CAM_INDEX  = args.camera
    CAM_WIDTH  = args.width
    CAM_HEIGHT = args.height
    CAM_FPS    = args.fps

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("\nDihentikan oleh pengguna.")
    except Exception as exc:
        log.error(f"Error fatal: {exc}")
        sys.exit(1)
