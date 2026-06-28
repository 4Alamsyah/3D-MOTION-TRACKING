import * as THREE from 'three';
import { OrbitControls }   from 'three/addons/controls/OrbitControls.js';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { Line2 }           from 'three/addons/lines/Line2.js';
import { LineMaterial }    from 'three/addons/lines/LineMaterial.js';
import { LineGeometry }    from 'three/addons/lines/LineGeometry.js';

// ── MediaPipe Pose landmark connections ────────────────────────────────────
const CONNECTIONS = [
    // Face
    [0,1],[1,2],[2,3],[3,7],
    [0,4],[4,5],[5,6],[6,8],
    [9,10],
    // Torso
    [11,12],[11,23],[12,24],[23,24],
    // Left arm
    [11,13],[13,15],[15,17],[15,19],[15,21],[17,19],
    // Right arm
    [12,14],[14,16],[16,18],[16,20],[16,22],[18,20],
    // Left leg
    [23,25],[25,27],[27,29],[27,31],[29,31],
    // Right leg
    [24,26],[26,28],[28,30],[28,32],[30,32],
];

// ── Per-joint color ────────────────────────────────────────────────────────
function jointColor(i) {
    if (i === 0)               return 0xffcc44; // nose
    if (i <= 10)               return 0xff66aa; // face
    if (i === 11 || i === 12)  return 0x00ffff; // shoulders
    if (i <= 16)               return 0x44aaff; // arms
    if (i <= 22)               return 0x44ff88; // hands
    if (i === 23 || i === 24)  return 0x00ffff; // hips
    if (i <= 28)               return 0x9966ff; // legs
    return 0xff88aa;                            // feet
}

// ── Per-bone color ─────────────────────────────────────────────────────────
function boneColor(a, b) {
    const m = Math.max(a, b);
    if (m <= 10) return 0xff3388;
    if (m <= 16) return 0x0077ff;
    if (m <= 22) return 0x00cc55;
    if (m <= 24) return 0x00cccc;
    if (m <= 28) return 0x7755cc;
    return 0xff6677;
}

// ── Joint radius ───────────────────────────────────────────────────────────
function jointRadius(i) {
    if (i === 0)                                      return 0.065;
    if (i === 11||i===12||i===23||i===24)             return 0.055;
    if (i<=16||i===25||i===26||i===27||i===28)        return 0.042;
    return 0.026;
}

// ── Renderer / Scene ───────────────────────────────────────────────────────
const canvas = document.getElementById('c');
const W = () => window.innerWidth;
const H = () => window.innerHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020208);
scene.fog = new THREE.FogExp2(0x020208, 0.035);

const camera = new THREE.PerspectiveCamera(55, W()/H(), 0.05, 80);
camera.position.set(0, 0.2, 5.5);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(W(), H());
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace  = THREE.SRGBColorSpace;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

// ── Bloom post-processing ──────────────────────────────────────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
    new THREE.Vector2(W(), H()),
    1.4,   // strength
    0.55,  // radius
    0.78   // threshold
));

// ── Orbit controls ─────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.2, 0);
controls.enableDamping  = true;
controls.dampingFactor  = 0.06;
controls.minDistance    = 1;
controls.maxDistance    = 14;

// ── Lighting ───────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x0a1a33, 6));

const rimA = new THREE.PointLight(0x00ffff, 10, 22);
rimA.position.set(4, 5, 3);
scene.add(rimA);

const rimB = new THREE.PointLight(0x8833ff, 6, 18);
rimB.position.set(-4, 2, -3);
scene.add(rimB);

const fillLight = new THREE.PointLight(0xffffff, 2, 10);
fillLight.position.set(0, 3, 3);
scene.add(fillLight);

// ── Stars ──────────────────────────────────────────────────────────────────
{
    const n = 3500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        const r = 35 + Math.random() * 35;
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0xffffff, size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.55,
    })));
}

// ── Floor grid ─────────────────────────────────────────────────────────────
const grid = new THREE.GridHelper(22, 34, 0x001133, 0x000b22);
grid.position.y = -2.4;
scene.add(grid);

// Subtle mirror plane
const mirrorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({
        color: 0x001133, roughness: 0.05, metalness: 0.95,
        transparent: true, opacity: 0.25,
    })
);
mirrorMesh.rotation.x = -Math.PI / 2;
mirrorMesh.position.y  = -2.4;
scene.add(mirrorMesh);

// ── Skeleton – joints (spheres) ────────────────────────────────────────────
const jointMeshes = Array.from({ length: 33 }, (_, i) => {
    const col = jointColor(i);
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(jointRadius(i), 14, 9),
        new THREE.MeshStandardMaterial({
            color: col,
            emissive: new THREE.Color(col).multiplyScalar(0.45),
            roughness: 0.2,
            metalness: 0.55,
        })
    );
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
});

// ── Skeleton – bones (Line2 for linewidth support) ─────────────────────────
const boneLines = CONNECTIONS.map(([a, b]) => {
    const geo = new LineGeometry();
    geo.setPositions([0, 0, 0, 1, 0, 0]); // placeholder
    const mat = new LineMaterial({
        color: boneColor(a, b),
        linewidth: 3,
        resolution: new THREE.Vector2(W(), H()),
        transparent: true,
        opacity: 0.85,
    });
    const line = new Line2(geo, mat);
    line.visible = false;
    scene.add(line);
    return { line, geo, a, b };
});

// ── Ghost trail (last 4 frames, fading) ────────────────────────────────────
const TRAIL_LEN = 4;
const trailBuffer = []; // array of landmark snapshots

const ghostMaterials = Array.from({ length: TRAIL_LEN }, (_, k) => {
    const alpha = (TRAIL_LEN - k) / TRAIL_LEN * 0.18;
    return new THREE.MeshStandardMaterial({
        color: 0x0088ff, emissive: 0x002244,
        roughness: 0.5, metalness: 0.3,
        transparent: true, opacity: alpha,
    });
});

const ghostLines = Array.from({ length: TRAIL_LEN }, (_, k) => {
    const alpha = (TRAIL_LEN - k) / TRAIL_LEN * 0.12;
    return CONNECTIONS.map(([a, b]) => {
        const geo  = new LineGeometry();
        geo.setPositions([0,0,0,1,0,0]);
        const mat  = new LineMaterial({
            color: 0x002266,
            linewidth: 2,
            resolution: new THREE.Vector2(W(), H()),
            transparent: true,
            opacity: alpha,
        });
        const line = new Line2(geo, mat);
        line.visible = false;
        scene.add(line);
        return { line, geo };
    });
});

const ghostJoints = Array.from({ length: TRAIL_LEN }, (_, k) =>
    Array.from({ length: 33 }, (__, i) => {
        const m = new THREE.Mesh(
            new THREE.SphereGeometry(jointRadius(i) * 0.8, 8, 6),
            ghostMaterials[k].clone()
        );
        m.visible = false;
        scene.add(m);
        return m;
    })
);

// ── Coordinate mapping: MediaPipe → Three.js world ─────────────────────────
function toWorld(lm) {
    return new THREE.Vector3(
        -(lm.x - 0.5) * 3.2,
        -(lm.y - 0.5) * 3.2,
        -lm.z * 2.0,
    );
}

// ── Landmark state ─────────────────────────────────────────────────────────
let targetLm  = null;
let currentLm = null;
const LERP = 0.22;

// ── UI helpers ─────────────────────────────────────────────────────────────
const statusEl  = document.getElementById('status');
const msgEl     = document.getElementById('msg');
const waitingEl = document.getElementById('waiting');
const fpsEl     = document.getElementById('fps');

function setStatus(text, cls) {
    msgEl.textContent   = text;
    statusEl.className  = cls;
}

// ── WebSocket with auto-reconnect ──────────────────────────────────────────
let poseDetected = false;

function connect() {
    const ws = new WebSocket('ws://localhost:8765');

    ws.onopen = () => {
        setStatus('Terhubung — tampilkan tubuh Anda ke kamera!', 'ok');
    };
    ws.onmessage = ({ data }) => {
        const parsed = JSON.parse(data);
        if (parsed.type === 'pose') targetLm = parsed.landmarks;
    };
    ws.onerror = () => {
        setStatus('Tidak dapat terhubung — jalankan server.py terlebih dahulu!', 'error');
    };
    ws.onclose = () => {
        targetLm = null;
        setStatus('Koneksi terputus — mencoba kembali dalam 3s...', 'warn');
        setTimeout(connect, 3000);
    };
}
connect();

// ── FPS counter ────────────────────────────────────────────────────────────
let frames = 0, fpsAcc = 0;

// ── Render loop ────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let trailTick = 0;

(function loop() {
    requestAnimationFrame(loop);
    const dt = clock.getDelta();
    const t  = clock.elapsedTime;

    // FPS
    frames++;
    fpsAcc += dt;
    if (fpsAcc >= 1) {
        fpsEl.textContent = `${frames} fps`;
        frames = 0;
        fpsAcc = 0;
    }

    controls.update();

    // Orbit key lights for dynamic glow
    rimA.position.x = Math.sin(t * 0.25) * 5;
    rimA.position.z = Math.cos(t * 0.25) * 5;

    // ── Update skeleton ──────────────────────────────────────────────────
    let hasPose = false;

    if (targetLm) {
        if (!currentLm) {
            currentLm = targetLm.map(l => ({ ...l }));
        }

        // Smooth lerp toward target
        for (let i = 0; i < targetLm.length; i++) {
            const s = targetLm[i], d = currentLm[i];
            d.x += (s.x - d.x) * LERP;
            d.y += (s.y - d.y) * LERP;
            d.z += (s.z - d.z) * LERP;
            d.v  = s.v;
        }

        // Ghost trail: snapshot every 2 frames
        trailTick++;
        if (trailTick % 2 === 0) {
            trailBuffer.unshift(currentLm.map(l => ({ ...l })));
            if (trailBuffer.length > TRAIL_LEN) trailBuffer.pop();
        }

        // Update joints
        for (let i = 0; i < 33; i++) {
            const lm = currentLm[i];
            if (lm.v > 0.5) {
                const pos = toWorld(lm);
                jointMeshes[i].position.copy(pos);
                const pulse = 1 + 0.07 * Math.sin(t * 3.5 + i * 0.6);
                jointMeshes[i].scale.setScalar(pulse);
                jointMeshes[i].visible = true;
                hasPose = true;
            } else {
                jointMeshes[i].visible = false;
            }
        }

        // Update bones
        for (const { line, geo, a, b } of boneLines) {
            const la = currentLm[a], lb = currentLm[b];
            if (la.v > 0.3 && lb.v > 0.3) {
                const pa = toWorld(la), pb = toWorld(lb);
                geo.setPositions([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z]);
                line.visible = true;
            } else {
                line.visible = false;
            }
        }

        // Update ghost trail
        for (let k = 0; k < TRAIL_LEN; k++) {
            const snap = trailBuffer[k];
            if (!snap) {
                ghostJoints[k].forEach(m => m.visible = false);
                ghostLines[k].forEach(({ line }) => line.visible = false);
                continue;
            }
            for (let i = 0; i < 33; i++) {
                const lm = snap[i];
                if (lm.v > 0.5) {
                    ghostJoints[k][i].position.copy(toWorld(lm));
                    ghostJoints[k][i].visible = true;
                } else {
                    ghostJoints[k][i].visible = false;
                }
            }
            for (let j = 0; j < CONNECTIONS.length; j++) {
                const [a, b] = CONNECTIONS[j];
                const la = snap[a], lb = snap[b];
                if (la.v > 0.3 && lb.v > 0.3) {
                    const pa = toWorld(la), pb = toWorld(lb);
                    ghostLines[k][j].geo.setPositions([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z]);
                    ghostLines[k][j].line.visible = true;
                } else {
                    ghostLines[k][j].line.visible = false;
                }
            }
        }
    } else {
        jointMeshes.forEach(m => m.visible = false);
        boneLines.forEach(({ line }) => line.visible = false);
        ghostJoints.forEach(g => g.forEach(m => m.visible = false));
        ghostLines.forEach(g => g.forEach(({ line }) => line.visible = false));
    }

    // Toggle waiting overlay
    if (hasPose !== poseDetected) {
        poseDetected = hasPose;
        waitingEl.classList.toggle('hidden', hasPose);
    }

    composer.render();
})();

// ── Resize ─────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
    composer.setSize(W(), H());
    const res = new THREE.Vector2(W(), H());
    boneLines.forEach(({ line }) => line.material.resolution.copy(res));
    ghostLines.forEach(g => g.forEach(({ line }) => line.material.resolution.copy(res)));
});
