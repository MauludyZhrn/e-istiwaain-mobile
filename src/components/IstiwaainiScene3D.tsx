import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  StyleSheet,
  Image,
} from 'react-native';
import Svg, {
  Path,
  Polygon,
  Circle,
  Line,
  G,
  Text as SvgText,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Sun, Compass } from 'lucide-react-native';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Polyfill process.emitWarning & TextDecoder agar Three.js / GLTFLoader aman di Hermes
if (typeof process !== 'undefined' && typeof (process as any).emitWarning !== 'function') {
  (process as any).emitWarning = () => {};
}
if (typeof globalThis.TextDecoder === 'undefined') {
  (globalThis as any).TextDecoder = class {
    decode(input?: ArrayBuffer | ArrayBufferView): string {
      if (!input) return '';
      const bytes =
        input instanceof ArrayBuffer
          ? new Uint8Array(input)
          : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
      let out = '';
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        out += String.fromCharCode.apply(
          null,
          Array.from(bytes.subarray(i, Math.min(i + chunk, bytes.length)))
        );
      }
      return out;
    }
  };
}

// Asset 3D Model Istiwa'aini (.glb)
const ISTIWAAIN_GLB_ASSET = require('../../assets/istiwaain.glb');

// ===== Parameter Fisik Model 3D assets/istiwaain.glb (cm) =====
const BOARD_APOTHEM = 21;
const BOARD_THICK = 1;
const DIAL_R = 17;
const SCALE_R = 15;
const GNOMON_H = 15;
const GNOMON_TIP_H = 16.2; // Tinggi dari permukaan dial (y=1.10) ke pucuk kerucut (y=17.30)
const GNOMON2_R = 15;      // Tongkat 0° berada pada (0, y, -15) di assets/istiwaain.glb
const DIAL_TOP = 1.1;      // Permukaan atas Piringan di assets/istiwaain.glb

const SUN_SWEEP_S = 2.2;
const REVEAL_S = 1.0;
const SWEEP_DEG = 35;

const toRad = (d: number) => (d * Math.PI) / 180;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

export interface Props {
  qiblaAzimuth: number; // Azimut Kiblat (° UTSB)
  sunAzimuth: number;   // Azimut Matahari (° UTSB)
  sunAltitude: number;  // Tinggi Matahari / Irtafa' (°)
  bedaAzimuth?: number; // Beda Azimut (AK - AM)
  replayKey?: number;
  size?: number;
}

interface ParsedGlbData {
  scene: THREE.Group;
  // Pre-extracted world-space triangles [x1,y1,z1, x2,y2,z2, x3,y3,z3, nx,ny,nz]
  papanTop: Float32Array;
  papanSides: Float32Array;
  piringanTop: Float32Array;
  piringanRim: Float32Array;
  cincinSkala: Float32Array;
  dialLines: Float32Array;
  radial30: Float32Array;
  ticksMajor: Float32Array;
  arahU: Float32Array;
  arahTSB: Float32Array;
  bautBatang: Float32Array;
  bautKepala: Float32Array;
  gnomon0Alas: Float32Array;
  gnomon0Batang: Float32Array;
  gnomon0Ujung: Float32Array;
  gnomonPusatAlas: Float32Array;
  gnomonPusatBatang: Float32Array;
  gnomonPusatUjung: Float32Array;
  degreeLabels: { text: string; x: number; y: number; z: number }[];
  // Dynamic meshes from assets/istiwaain.glb
  garisBayangan0?: THREE.Mesh;
  garisBayanganPusat?: THREE.Mesh;
  ujungBayangan0?: THREE.Mesh;
  ujungBayanganPusat?: THREE.Mesh;
  garisKiblat?: THREE.Mesh;
  panahKiblat?: THREE.Mesh;
}

// Cache hasil parse assets/istiwaain.glb agar instan saat berpindah tab/replay
let cachedGlbData: ParsedGlbData | null = null;
let cachedGlbPromise: Promise<ParsedGlbData> | null = null;

function extractMeshTris(
  scene: THREE.Group,
  names: string[],
  filterFn?: (nx: number, ny: number, nz: number) => boolean
): Float32Array {
  const out: number[] = [];
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const v3 = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (const name of names) {
    const obj = scene.getObjectByName(name) as THREE.Mesh | undefined;
    if (!obj || !obj.geometry) continue;
    const pos = obj.geometry.attributes.position;
    const norm = obj.geometry.attributes.normal;
    const idx = obj.geometry.index;
    if (!pos || !idx) continue;

    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i);
      const b = idx.getX(i + 1);
      const c = idx.getX(i + 2);

      if (norm) {
        n.fromBufferAttribute(norm, a).transformDirection(obj.matrixWorld).normalize();
      } else {
        n.set(0, 1, 0);
      }

      if (filterFn && !filterFn(n.x, n.y, n.z)) continue;

      v1.fromBufferAttribute(pos, a).applyMatrix4(obj.matrixWorld);
      v2.fromBufferAttribute(pos, b).applyMatrix4(obj.matrixWorld);
      v3.fromBufferAttribute(pos, c).applyMatrix4(obj.matrixWorld);

      out.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z, n.x, n.y, n.z);
    }
  }
  return new Float32Array(out);
}

function buildParsedGlbDataFromScene(scene: THREE.Group): ParsedGlbData {
  scene.updateMatrixWorld(true);

  const degreeLabels: { text: string; x: number; y: number; z: number }[] = [];
  for (let deg = 0; deg < 360; deg += 30) {
    const lblObj = scene.getObjectByName(`Label_${deg}`);
    if (lblObj) {
      degreeLabels.push({
        text: `${deg}°`,
        x: lblObj.position.x,
        y: lblObj.position.y + 0.12,
        z: lblObj.position.z,
      });
    } else {
      const r = 18.8;
      degreeLabels.push({
        text: `${deg}°`,
        x: r * Math.sin(toRad(deg)),
        y: 1.14,
        z: -r * Math.cos(toRad(deg)),
      });
    }
  }

  return {
    scene,
    papanTop: extractMeshTris(scene, ['Papan_Oktagon'], (_, ny) => ny > 0.5),
    papanSides: extractMeshTris(scene, ['Papan_Oktagon'], (_, ny) => Math.abs(ny) <= 0.5),
    piringanTop: extractMeshTris(scene, ['Piringan'], (_, ny) => ny > 0.5),
    piringanRim: extractMeshTris(scene, ['Piringan'], (_, ny) => Math.abs(ny) <= 0.5),
    cincinSkala: extractMeshTris(scene, ['Cincin_Skala'], (_, ny) => ny > 0.5),
    dialLines: extractMeshTris(
      scene,
      [
        'Lingkaran_Luar',
        'Lingkaran_Dalam',
        'Lingkaran_Bantu_0',
        'Lingkaran_Bantu_1',
        'Garis_Radial_5',
      ],
      (_, ny) => ny > 0.5
    ),
    radial30: extractMeshTris(scene, ['Garis_Radial_30'], (_, ny) => ny > 0.5),
    ticksMajor: extractMeshTris(scene, ['Tick_10', 'Tick_5'], (_, ny) => ny > 0.5),
    arahU: extractMeshTris(scene, ['Arah_U'], (_, ny) => ny > 0.5),
    arahTSB: extractMeshTris(scene, ['Arah_T', 'Arah_S', 'Arah_B'], (_, ny) => ny > 0.5),
    bautBatang: extractMeshTris(
      scene,
      ['Baut_Batang_1', 'Baut_Batang_2', 'Baut_Batang_3'],
      (_, ny) => ny >= -0.2
    ),
    bautKepala: extractMeshTris(
      scene,
      ['Baut_Kepala_1', 'Baut_Kepala_2', 'Baut_Kepala_3'],
      (_, ny) => ny >= -0.2
    ),
    gnomon0Alas: extractMeshTris(scene, ['Istiwak_0derajat_Alas'], (_, ny) => ny >= -0.2),
    gnomon0Batang: extractMeshTris(scene, ['Istiwak_0derajat_Batang']),
    gnomon0Ujung: extractMeshTris(scene, ['Istiwak_0derajat_Ujung']),
    gnomonPusatAlas: extractMeshTris(scene, ['Istiwak_Pusat_Alas'], (_, ny) => ny >= -0.2),
    gnomonPusatBatang: extractMeshTris(scene, ['Istiwak_Pusat_Batang']),
    gnomonPusatUjung: extractMeshTris(scene, ['Istiwak_Pusat_Ujung']),
    degreeLabels,
    garisBayangan0: scene.getObjectByName('Garis_Bayangan_0derajat') as THREE.Mesh | undefined,
    garisBayanganPusat: scene.getObjectByName('Garis_Bayangan_Pusat') as THREE.Mesh | undefined,
    ujungBayangan0: scene.getObjectByName('Ujung_Bayangan_0derajat') as THREE.Mesh | undefined,
    ujungBayanganPusat: scene.getObjectByName('Ujung_Bayangan_Pusat') as THREE.Mesh | undefined,
    garisKiblat: scene.getObjectByName('Garis_Kiblat') as THREE.Mesh | undefined,
    panahKiblat: scene.getObjectByName('Panah_Kiblat') as THREE.Mesh | undefined,
  };
}

function createInitialThreeSceneData(): ParsedGlbData {
  const scene = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial();

  const circR = BOARD_APOTHEM / Math.cos(toRad(22.5));
  const papanGeo = new THREE.CylinderGeometry(circR, circR, BOARD_THICK, 8);
  const papan = new THREE.Mesh(papanGeo, mat);
  papan.name = 'Papan_Oktagon';
  papan.position.set(0, 0.5, 0);
  papan.rotation.set(0, toRad(22.5), 0);
  scene.add(papan);

  const piringan = new THREE.Mesh(new THREE.CylinderGeometry(DIAL_R, DIAL_R, 0.1, 48), mat);
  piringan.name = 'Piringan';
  piringan.position.set(0, 1.05, 0);
  scene.add(piringan);

  const cincin = new THREE.Mesh(new THREE.RingGeometry(15.2, 16.7, 48), mat);
  cincin.name = 'Cincin_Skala';
  cincin.rotation.x = -Math.PI / 2;
  cincin.position.set(0, 1.11, 0);
  scene.add(cincin);

  const addGnomon = (prefix: string, zPos: number) => {
    const alas = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 16), mat);
    alas.name = `${prefix}_Alas`;
    alas.position.set(0, 1.25, zPos);
    scene.add(alas);

    const batang = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 15, 20), mat);
    batang.name = `${prefix}_Batang`;
    batang.position.set(0, 8.6, zPos);
    scene.add(batang);

    const ujung = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.2, 16), mat);
    ujung.name = `${prefix}_Ujung`;
    ujung.position.set(0, 16.7, zPos);
    scene.add(ujung);
  };
  addGnomon('Istiwak_0derajat', -GNOMON2_R);
  addGnomon('Istiwak_Pusat', 0);

  const createBarMesh = (name: string, w: number, zPos: number) => {
    const g = new THREE.PlaneGeometry(1, w);
    g.rotateX(-Math.PI / 2);
    g.translate(0.5, 0, 0);
    const m = new THREE.Mesh(g, mat);
    m.name = name;
    m.position.set(0, 1.16, zPos);
    scene.add(m);
  };
  createBarMesh('Garis_Bayangan_0derajat', 0.18, -GNOMON2_R);
  createBarMesh('Garis_Bayangan_Pusat', 0.18, 0);
  createBarMesh('Garis_Kiblat', 0.44, 0);

  const arrowGeo = new THREE.BufferGeometry();
  arrowGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array([0, 0, -1.1, 2.4, 0, 0, 0, 0, 1.1]), 3)
  );
  arrowGeo.setIndex([0, 1, 2]);
  const panah = new THREE.Mesh(arrowGeo, mat);
  panah.name = 'Panah_Kiblat';
  scene.add(panah);

  return buildParsedGlbDataFromScene(scene);
}

function fetchArrayBuffer(uri: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', uri, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
        resolve(xhr.response as ArrayBuffer);
      } else if (xhr.status === 0 && xhr.response) {
        resolve(xhr.response as ArrayBuffer);
      } else {
        reject(new Error(`HTTP ${xhr.status} saat memuat istiwaain.glb`));
      }
    };
    xhr.onerror = () => reject(new Error('Gagal memuat ArrayBuffer istiwaain.glb'));
    xhr.send(null);
  });
}

async function loadIstiwaainGlb(): Promise<ParsedGlbData> {
  if (cachedGlbData) return cachedGlbData;
  if (cachedGlbPromise) return cachedGlbPromise;

  cachedGlbPromise = (async () => {
    let uri: string | null = null;

    // 1. Resolve via React Native Image.resolveAssetSource
    const resolved = Image.resolveAssetSource(ISTIWAAIN_GLB_ASSET);
    if (resolved?.uri) {
      uri = resolved.uri;
    }

    // 2. Fallback via ExpoAsset jika tersedia
    if (!uri && requireOptionalNativeModule('ExpoAsset')) {
      const { Asset } = require('expo-asset');
      const asset = Asset.fromModule(ISTIWAAIN_GLB_ASSET);
      await asset.downloadAsync();
      uri = asset.localUri || asset.uri;
    }

    if (!uri) {
      throw new Error('URI assets/istiwaain.glb tidak ditemukan');
    }

    let buffer: ArrayBuffer;
    try {
      buffer = await fetchArrayBuffer(uri);
    } catch (xhrErr) {
      if (requireOptionalNativeModule('ExpoFileSystem')) {
        const { File } = require('expo-file-system');
        buffer = await new File(uri).arrayBuffer();
      } else {
        throw xhrErr;
      }
    }

    return new Promise<ParsedGlbData>((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.parse(
        buffer,
        '',
        (gltf) => {
          const parsed = buildParsedGlbDataFromScene(gltf.scene);
          cachedGlbData = parsed;
          resolve(parsed);
        },
        (err) => reject(err)
      );
    });
  })();

  return cachedGlbPromise;
}

/**
 * Matriks Proyeksi Kamera 3D Perspektif
 */
function createProjector(size: number, yaw: number, pitch: number) {
  const dist = 108;
  const focal = size * 1.78;
  const cx = size / 2;
  const cy = size / 2 + size * 0.04;

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const ty = 2.4;

  // Posisi kamera di ruang dunia (untuk front-face culling & depth sorting)
  const camZ1 = dist * cosP;
  const camY = ty + dist * sinP;
  const camX = sinY * camZ1;
  const camZ = cosY * camZ1;

  const project = (x: number, y: number, z: number): [number, number, number] => {
    const dy = y - ty;
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    const y2 = dy * cosP - z1 * sinP;
    const z2 = dy * sinP + z1 * cosP;

    const depth = dist + z2;
    const scale = focal / Math.max(depth, 10);
    return [cx + x1 * scale, cy - y2 * scale, depth];
  };

  return { project, camPos: [camX, camY, camZ] as [number, number, number] };
}

function ptsToStr(pts: [number, number][]): string {
  return pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
}

function trisToSvgPath(
  tris: Float32Array,
  project: (x: number, y: number, z: number) => [number, number, number],
  cullBackface = false
): string {
  let d = '';
  for (let i = 0; i < tris.length; i += 12) {
    const p1 = project(tris[i], tris[i + 1], tris[i + 2]);
    const p2 = project(tris[i + 3], tris[i + 4], tris[i + 5]);
    const p3 = project(tris[i + 6], tris[i + 7], tris[i + 8]);

    if (cullBackface) {
      const cross = (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
      if (cross >= 0) continue;
    }

    d += `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}L${p3[0].toFixed(1)} ${p3[1].toFixed(1)}Z`;
  }
  return d;
}

/**
 * Proyeksi mesh 3D silinder/kerucut dari assets/istiwaain.glb dengan 3 tingkatan pencahayaan Matahari
 */
function litTrisToSvgPaths(
  tris: Float32Array,
  project: (x: number, y: number, z: number) => [number, number, number],
  sunDir: [number, number, number]
): { lit: string; mid: string; dark: string } {
  let lit = '';
  let mid = '';
  let dark = '';

  const [sx, sy, sz] = sunDir;

  for (let i = 0; i < tris.length; i += 12) {
    const p1 = project(tris[i], tris[i + 1], tris[i + 2]);
    const p2 = project(tris[i + 3], tris[i + 4], tris[i + 5]);
    const p3 = project(tris[i + 6], tris[i + 7], tris[i + 8]);

    const cross = (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
    if (cross >= 0) continue;

    const nx = tris[i + 9];
    const ny = tris[i + 10];
    const nz = tris[i + 11];
    const dot = nx * sx + ny * sy + nz * sz;

    const cmd = `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}L${p3[0].toFixed(1)} ${p3[1].toFixed(1)}Z`;
    if (dot > 0.35) {
      lit += cmd;
    } else if (dot > -0.15) {
      mid += cmd;
    } else {
      dark += cmd;
    }
  }
  return { lit, mid, dark };
}

/**
 * Proyeksi langsung THREE.Mesh dinamis dari dalam gltf.scene (Garis_Bayangan, Garis_Kiblat, Panah_Kiblat)
 */
function dynamicMeshToSvgPath(
  mesh: THREE.Mesh | undefined,
  project: (x: number, y: number, z: number) => [number, number, number]
): string {
  if (!mesh || !mesh.geometry) return '';
  mesh.updateMatrixWorld(true);
  const pos = mesh.geometry.attributes.position;
  const idx = mesh.geometry.index;
  if (!pos || !idx) return '';

  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const v3 = new THREE.Vector3();
  let d = '';

  for (let i = 0; i < idx.count; i += 3) {
    v1.fromBufferAttribute(pos, idx.getX(i)).applyMatrix4(mesh.matrixWorld);
    v2.fromBufferAttribute(pos, idx.getX(i + 1)).applyMatrix4(mesh.matrixWorld);
    v3.fromBufferAttribute(pos, idx.getX(i + 2)).applyMatrix4(mesh.matrixWorld);

    const p1 = project(v1.x, v1.y, v1.z);
    const p2 = project(v2.x, v2.y, v2.z);
    const p3 = project(v3.x, v3.y, v3.z);

    d += `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}L${p3[0].toFixed(1)} ${p3[1].toFixed(1)}Z`;
  }
  return d;
}

export const IstiwaainiScene3D: React.FC<Props> = ({
  qiblaAzimuth,
  sunAzimuth,
  sunAltitude,
  bedaAzimuth,
  replayKey = 0,
  size = 310,
}) => {
  const [glbData, setGlbData] = useState<ParsedGlbData>(
    () => cachedGlbData || createInitialThreeSceneData()
  );
  const [cam, setCam] = useState({ yaw: 0.22, pitch: 0.82 });
  const [anim, setAnim] = useState({ sun: 0, rev: 0 });
  const [showRays, setShowRays] = useState(true);
  // Mode 'sop' = Cara Kerja Alat (Titik 0° diarahkan ke Matahari, bayangan Tongkat 0° menumbuk Tongkat Pusat)
  // Mode 'utsb' = Orientasi Utara Sejati (Titik 0° di Utara, Matahari pada Azimut Matahari)
  const [alignMode, setAlignMode] = useState<'sop' | 'utsb'>('sop');

  const dragStartRef = useRef({ yaw: 0.22, pitch: 0.82 });
  const camRef = useRef(cam);
  camRef.current = cam;

  // Muat model 3D assets/istiwaain.glb menggunakan GLTFLoader
  useEffect(() => {
    let mounted = true;
    loadIstiwaainGlb()
      .then((data) => {
        if (mounted) setGlbData(data);
      })
      .catch((err) => {
        console.warn('[IstiwaainiScene3D] Fallback ke geometri prosedural:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Animasi sapuan matahari & kemunculan sudut kiblat
  useEffect(() => {
    let rafId: number;
    const t0 = Date.now();

    const tick = () => {
      const elapsed = (Date.now() - t0) / 1000;
      const sunP = easeOut(clamp01(elapsed / SUN_SWEEP_S));
      const revP = easeOut(clamp01((elapsed - SUN_SWEEP_S * 0.65) / REVEAL_S));
      setAnim({ sun: sunP, rev: revP });

      if (elapsed < SUN_SWEEP_S + REVEAL_S) {
        rafId = requestAnimationFrame(tick);
      }
    };

    setAnim({ sun: 0, rev: 0 });
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [replayKey, qiblaAzimuth, sunAzimuth, sunAltitude, alignMode]);

  // Gesture sentuh untuk memutar model 3D
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
        onPanResponderGrant: () => {
          dragStartRef.current = { ...camRef.current };
        },
        onPanResponderMove: (_, g) => {
          const nextYaw = dragStartRef.current.yaw + g.dx * 0.012;
          const nextPitch = Math.max(
            0.25,
            Math.min(1.45, dragStartRef.current.pitch + g.dy * 0.01)
          );
          setCam({ yaw: nextYaw, pitch: nextPitch });
        },
      }),
    []
  );

  const { project } = useMemo(
    () => createProjector(size, cam.yaw, cam.pitch),
    [size, cam.yaw, cam.pitch]
  );

  // ===== Perhitungan Sudut pada Piringan Alat Sesuai Mode =====
  const computedBA =
    bedaAzimuth !== undefined
      ? ((bedaAzimuth % 360) + 360) % 360
      : ((qiblaAzimuth - sunAzimuth) % 360 + 360) % 360;

  // Pada mode SOP Alat: titik 0° diarahkan ke Matahari (sehingga Matahari berada di arah 0° dial,
  // bayangan jatuh lurus ke 180° menumbuk Tongkat Pusat, dan Kiblat ditarik ke angka Beda Azimut).
  // Pada mode UTSB: titik 0° di Utara Sejati, Matahari di sunAzimuth, Kiblat di qiblaAzimuth.
  const targetDialSunAz = alignMode === 'sop' ? 0 : sunAzimuth;
  const targetDialQiblaAz = alignMode === 'sop' ? computedBA : qiblaAzimuth;

  const currentDialSunAz = targetDialSunAz - SWEEP_DEG * (1 - anim.sun);
  const sunAzRad = toRad(currentDialSunAz);
  const sunAltClamped = Math.max(sunAltitude, 2);
  const sunAltRad = toRad(sunAltClamped);
  const isSunUp = sunAltitude > 0.5;

  // Panjang bayangan pada piringan dial (dibatasi maks 19 cm di visualisasi agar tidak keluar papan saat matahari sangat rendah)
  const rawShadowLen = GNOMON_TIP_H / Math.tan(sunAltRad);
  const visualShadowLen = Math.min(rawShadowLen, 18.5);
  const shadowAzDeg = (currentDialSunAz + 180) % 360;

  // Vektor arah jatuhnya bayangan di bidang dial (X = Timur, Z = Selatan)
  const shX = -visualShadowLen * Math.sin(sunAzRad);
  const shZ = visualShadowLen * Math.cos(sunAzRad);

  // Vektor arah cahaya Matahari ternormalisasi (untuk shading 3D mesh dari istiwaain.glb)
  const sunDir: [number, number, number] = useMemo(() => {
    const sx = Math.sin(sunAzRad) * Math.cos(sunAltRad);
    const sy = Math.sin(sunAltRad);
    const sz = -Math.cos(sunAzRad) * Math.cos(sunAltRad);
    return [sx, sy, sz];
  }, [sunAzRad, sunAltRad]);

  // Koordinat 3D Bola Matahari di kubah langit
  const sun3D = useMemo(() => {
    const rSky = 44;
    const sx = rSky * sunDir[0];
    const sy = Math.max(7.5, rSky * sunDir[1]);
    const sz = rSky * sunDir[2];
    const pSun = project(sx, sy, sz);
    const pGround = project(sx, DIAL_TOP, sz);
    const pCenter = project(0, DIAL_TOP, 0);
    return { sx, sy, sz, pSun, pGround, pCenter };
  }, [sunDir, project]);

  // ===== Proyeksi Geometri Statis dari assets/istiwaain.glb =====
  const glbProjected = useMemo(() => {
    if (!glbData) return null;

    const papanSidesLit = litTrisToSvgPaths(glbData.papanSides, project, sunDir);
    const papanTopPath = trisToSvgPath(glbData.papanTop, project, true);
    const piringanRimPath = trisToSvgPath(glbData.piringanRim, project, true);
    const piringanTopPath = trisToSvgPath(glbData.piringanTop, project, true);
    const cincinSkalaPath = trisToSvgPath(glbData.cincinSkala, project, true);
    const dialLinesPath = trisToSvgPath(glbData.dialLines, project, false);
    const radial30Path = trisToSvgPath(glbData.radial30, project, false);
    const ticksMajorPath = trisToSvgPath(glbData.ticksMajor, project, false);
    const arahUPath = trisToSvgPath(glbData.arahU, project, false);
    const arahTSBPath = trisToSvgPath(glbData.arahTSB, project, false);
    const bautBatangLit = litTrisToSvgPaths(glbData.bautBatang, project, sunDir);
    const bautKepalaLit = litTrisToSvgPaths(glbData.bautKepala, project, sunDir);

    const gnomon0AlasLit = litTrisToSvgPaths(glbData.gnomon0Alas, project, sunDir);
    const gnomon0BatangLit = litTrisToSvgPaths(glbData.gnomon0Batang, project, sunDir);
    const gnomon0UjungLit = litTrisToSvgPaths(glbData.gnomon0Ujung, project, sunDir);

    const gnomonPusatAlasLit = litTrisToSvgPaths(glbData.gnomonPusatAlas, project, sunDir);
    const gnomonPusatBatangLit = litTrisToSvgPaths(glbData.gnomonPusatBatang, project, sunDir);
    const gnomonPusatUjungLit = litTrisToSvgPaths(glbData.gnomonPusatUjung, project, sunDir);

    const labels = glbData.degreeLabels.map((lbl) => {
      const p = project(lbl.x, lbl.y, lbl.z);
      return { text: lbl.text, x: p[0], y: p[1] };
    });

    // Depth sort antara Tongkat 0° (0, y, -15) dan Tongkat Pusat (0, y, 0)
    const depth0 = project(0, 8.6, -GNOMON2_R)[2];
    const depthPusat = project(0, 8.6, 0)[2];

    return {
      papanSidesLit,
      papanTopPath,
      piringanRimPath,
      piringanTopPath,
      cincinSkalaPath,
      dialLinesPath,
      radial30Path,
      ticksMajorPath,
      arahUPath,
      arahTSBPath,
      bautBatangLit,
      bautKepalaLit,
      gnomon0: {
        alas: gnomon0AlasLit,
        batang: gnomon0BatangLit,
        ujung: gnomon0UjungLit,
        depth: depth0,
        baseX: 0,
        baseZ: -GNOMON2_R,
        label: 'Istiwak 0°',
        tipColor: '#3B82F6',
      },
      gnomonPusat: {
        alas: gnomonPusatAlasLit,
        batang: gnomonPusatBatangLit,
        ujung: gnomonPusatUjungLit,
        depth: depthPusat,
        baseX: 0,
        baseZ: 0,
        label: 'Istiwak Pusat',
        tipColor: '#EF4444',
      },
      labels,
    };
  }, [glbData, project, sunDir]);

  // ===== Transformasi Mesh Dinamis di dalam assets/istiwaain.glb =====
  const dynamicGlbPaths = useMemo(() => {
    // 1. Update transform node Garis_Bayangan_0derajat & Garis_Bayangan_Pusat di gltf.scene
    let shadow0Path = '';
    let shadowPusatPath = '';

    if (glbData && isSunUp) {
      const rotY = toRad(90 - shadowAzDeg);
      if (glbData.garisBayangan0) {
        glbData.garisBayangan0.position.set(0, 1.16, -GNOMON2_R);
        glbData.garisBayangan0.rotation.set(0, rotY, 0);
        glbData.garisBayangan0.scale.set(visualShadowLen, 1, 1.45);
        shadow0Path = dynamicMeshToSvgPath(glbData.garisBayangan0, project);
      }
      if (glbData.garisBayanganPusat) {
        glbData.garisBayanganPusat.position.set(0, 1.16, 0);
        glbData.garisBayanganPusat.rotation.set(0, rotY, 0);
        glbData.garisBayanganPusat.scale.set(visualShadowLen, 1, 1.45);
        shadowPusatPath = dynamicMeshToSvgPath(glbData.garisBayanganPusat, project);
      }
      if (glbData.ujungBayangan0) {
        glbData.ujungBayangan0.position.set(shX, 1.16, -GNOMON2_R + shZ);
        glbData.ujungBayangan0.scale.set(0.85, 0.4, 0.85);
      }
      if (glbData.ujungBayanganPusat) {
        glbData.ujungBayanganPusat.position.set(shX, 1.16, shZ);
        glbData.ujungBayanganPusat.scale.set(0.85, 0.4, 0.85);
      }
    }

    // 2. Update transform node Garis_Kiblat & Panah_Kiblat di gltf.scene
    let garisKiblatPath = '';
    let panahKiblatPath = '';
    let arcPolygon = '';
    const p = anim.rev;

    if (p > 0.01) {
      const curQ = targetDialQiblaAz * p;
      const qRad = toRad(targetDialQiblaAz);
      const rotQ = toRad(90 - targetDialQiblaAz);
      const lineLen = SCALE_R * p;

      if (glbData?.garisKiblat) {
        glbData.garisKiblat.position.set(0, 1.18, 0);
        glbData.garisKiblat.rotation.set(0, rotQ, 0);
        glbData.garisKiblat.scale.set(lineLen, 1, 1.15);
        garisKiblatPath = dynamicMeshToSvgPath(glbData.garisKiblat, project);
      }
      if (glbData?.panahKiblat) {
        glbData.panahKiblat.position.set(
          (SCALE_R - 0.6) * p * Math.sin(qRad),
          1.18,
          -(SCALE_R - 0.6) * p * Math.cos(qRad)
        );
        glbData.panahKiblat.rotation.set(0, rotQ, 0);
        glbData.panahKiblat.scale.set(p, p, p);
        panahKiblatPath = dynamicMeshToSvgPath(glbData.panahKiblat, project);
      }

      // Busur sudut Kiblat / Beda Azimut
      const yArc = 1.17;
      const rIn = 6.8;
      const rOut = 8.1;
      const steps = Math.max(10, Math.round(curQ / 5));
      const outerPts: [number, number][] = [];
      const innerPts: [number, number][] = [];
      for (let i = 0; i <= steps; i++) {
        const a = toRad((curQ * i) / steps);
        const po = project(rOut * Math.sin(a), yArc, -rOut * Math.cos(a));
        const pi = project(rIn * Math.sin(a), yArc, -rIn * Math.cos(a));
        outerPts.push([po[0], po[1]]);
        innerPts.unshift([pi[0], pi[1]]);
      }
      arcPolygon = ptsToStr([...outerPts, ...innerPts]);
    }

    // Label derajat Kiblat pada ujung panah
    const qRadFull = toRad(targetDialQiblaAz);
    const pQiblaLabel = project(
      (SCALE_R + 3.2) * Math.sin(qRadFull),
      1.5,
      -(SCALE_R + 3.2) * Math.cos(qRadFull)
    );

    return {
      shadow0Path,
      shadowPusatPath,
      garisKiblatPath,
      panahKiblatPath,
      arcPolygon,
      pQiblaLabel,
      opacity: p * 0.9,
    };
  }, [
    glbData,
    isSunUp,
    shadowAzDeg,
    visualShadowLen,
    shX,
    shZ,
    anim.rev,
    targetDialQiblaAz,
    project,
  ]);

  // Urutan render kedua tongkat dari jauh ke dekat (depth sorting 3D)
  const orderedGnomons = useMemo(() => {
    if (!glbProjected) return [];
    const list = [glbProjected.gnomon0, glbProjected.gnomonPusat];
    list.sort((a, b) => b.depth - a.depth);
    return list;
  }, [glbProjected]);

  // Garis bidik poros 0° -> 180° (penghubung Tongkat 0° dan Tongkat Pusat)
  const centerAxisLine = useMemo(() => {
    const pNorth = project(0, 1.15, -SCALE_R);
    const pSouth = project(0, 1.15, SCALE_R);
    return { pNorth, pSouth };
  }, [project]);

  return (
    <View style={[styles.wrapper, { width: size }]}>
      <View
        style={[styles.container, { width: size, height: size }]}
        {...panResponder.panHandlers}
      >
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
              <Stop offset="45%" stopColor="#F59E0B" stopOpacity="0.55" />
              <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="shadowFrustum" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
              <Stop offset="100%" stopColor="#0F172A" stopOpacity="0.32" />
            </LinearGradient>
          </Defs>

          {glbProjected && (
            <G>
              {/* 1. Batang Baut Penyetel di bawah Papan (dari assets/istiwaain.glb) */}
              <Path d={glbProjected.bautBatangLit.dark} fill="#78350F" />
              <Path d={glbProjected.bautBatangLit.mid} fill="#B45309" />
              <Path d={glbProjected.bautBatangLit.lit} fill="#F59E0B" />

              {/* 2. Dinding Samping & Permukaan Papan_Oktagon (dari assets/istiwaain.glb) */}
              <Path
                d={glbProjected.papanSidesLit.dark}
                fill="#090D16"
                stroke="#090D16"
                strokeWidth={0.3}
              />
              <Path
                d={glbProjected.papanSidesLit.mid}
                fill="#1E293B"
                stroke="#1E293B"
                strokeWidth={0.3}
              />
              <Path
                d={glbProjected.papanSidesLit.lit}
                fill="#334155"
                stroke="#334155"
                strokeWidth={0.3}
              />
              <Path
                d={glbProjected.papanTopPath}
                fill="#0B1020"
                stroke="#1E293B"
                strokeWidth={0.4}
              />

              {/* 3. Piringan Kuning & Cincin_Skala (dari assets/istiwaain.glb) */}
              <Path d={glbProjected.piringanRimPath} fill="#CA8A04" />
              <Path
                d={glbProjected.piringanTopPath}
                fill="#F2E20D"
                stroke="#F2E20D"
                strokeWidth={0.35}
              />
              <Path
                d={glbProjected.cincinSkalaPath}
                fill="#F1F5F9"
                stroke="#F1F5F9"
                strokeWidth={0.3}
              />

              {/* 4. Lingkaran Skala, Garis Radial & Tick Derajat (dari assets/istiwaain.glb) */}
              <Path d={glbProjected.dialLinesPath} fill="#1E293B" opacity={0.55} />
              <Path d={glbProjected.radial30Path} fill="#0F172A" opacity={0.85} />
              <Path d={glbProjected.ticksMajorPath} fill="#0F172A" opacity={0.9} />

              {/* 5. Mesh Huruf Arah Mata Angin Arah_U, Arah_T, Arah_S, Arah_B (dari assets/istiwaain.glb) */}
              <Path d={glbProjected.arahUPath} fill="#EF4444" stroke="#EF4444" strokeWidth={0.2} />
              <Path
                d={glbProjected.arahTSBPath}
                fill="#F8FAFC"
                stroke="#F8FAFC"
                strokeWidth={0.2}
              />

              {/* 6. Label Derajat 0° s/d 330° pada posisi node Label_* dari assets/istiwaain.glb */}
              {glbProjected.labels.map((lbl) => (
                <SvgText
                  key={lbl.text}
                  x={lbl.x}
                  y={lbl.y + 2.5}
                  fill={lbl.text === '0°' ? '#FCA5A5' : '#CBD5E1'}
                  fontSize={7.2}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {lbl.text}
                </SvgText>
              ))}

              {/* 7. Garis Poros Bidik 0° - 180° */}
              <Line
                x1={centerAxisLine.pNorth[0]}
                y1={centerAxisLine.pNorth[1]}
                x2={centerAxisLine.pSouth[0]}
                y2={centerAxisLine.pSouth[1]}
                stroke="#DC2626"
                strokeWidth={1.1}
                strokeDasharray="3,3"
                opacity={0.55}
              />

              {/* 8. Kepala Baut Kuningan Baut_Kepala_1..3 (dari assets/istiwaain.glb) */}
              <Path d={glbProjected.bautKepalaLit.dark} fill="#92400E" />
              <Path d={glbProjected.bautKepalaLit.mid} fill="#D97706" />
              <Path d={glbProjected.bautKepalaLit.lit} fill="#FCD34D" />

              {/* 9. Mesh Bayangan Dinamis Garis_Bayangan_0derajat & Garis_Bayangan_Pusat (dari assets/istiwaain.glb) */}
              {isSunUp && (
                <G>
                  <Path
                    d={dynamicGlbPaths.shadow0Path}
                    fill="#090D16"
                    stroke="#090D16"
                    strokeWidth={0.8}
                    opacity={0.88}
                  />
                  <Path
                    d={dynamicGlbPaths.shadowPusatPath}
                    fill="#090D16"
                    stroke="#090D16"
                    strokeWidth={0.8}
                    opacity={0.88}
                  />
                </G>
              )}

              {/* 10. Busur Sudut & Mesh Garis_Kiblat + Panah_Kiblat (dari assets/istiwaain.glb) */}
              {anim.rev > 0.01 && (
                <G>
                  <Polygon
                    points={dynamicGlbPaths.arcPolygon}
                    fill="#F97316"
                    fillOpacity={dynamicGlbPaths.opacity * 0.85}
                  />
                  <Path
                    d={dynamicGlbPaths.garisKiblatPath}
                    fill="#10B981"
                    stroke="#059669"
                    strokeWidth={0.4}
                  />
                  <Path
                    d={dynamicGlbPaths.panahKiblatPath}
                    fill="#10B981"
                    stroke="#047857"
                    strokeWidth={0.5}
                  />
                  {anim.rev > 0.7 && (
                    <SvgText
                      x={dynamicGlbPaths.pQiblaLabel[0]}
                      y={dynamicGlbPaths.pQiblaLabel[1]}
                      fill="#34D399"
                      fontSize={8.5}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      🕋 {targetDialQiblaAz.toFixed(1)}°
                    </SvgText>
                  )}
                </G>
              )}

              {/* 11. Kedua Tongkat 3D (Istiwak_0derajat & Istiwak_Pusat dari assets/istiwaain.glb) + Sinar & Ujung Bayangan */}
              {orderedGnomons.map((g) => {
                const pBase = project(g.baseX, 1.16, g.baseZ);
                const pTip = project(g.baseX, 17.3, g.baseZ);
                const pShadowTip = project(g.baseX + shX, 1.16, g.baseZ + shZ);
                const shadowTrianglePts = ptsToStr([
                  [pBase[0], pBase[1]],
                  [pTip[0], pTip[1]],
                  [pShadowTip[0], pShadowTip[1]],
                ]);

                return (
                  <G key={g.label}>
                    {/* Segitiga Optik Bayangan Ruang 3D (antara Tongkat, Sinar, dan Bayangan) */}
                    {isSunUp && showRays && (
                      <Polygon points={shadowTrianglePts} fill="url(#shadowFrustum)" />
                    )}

                    {/* Ujung_Bayangan_0derajat / Ujung_Bayangan_Pusat */}
                    {isSunUp && (
                      <Circle
                        cx={pShadowTip[0]}
                        cy={pShadowTip[1]}
                        r={4.2}
                        fill={g.tipColor}
                        stroke="#FFFFFF"
                        strokeWidth={1.1}
                      />
                    )}

                    {/* Sinar Matahari Datang ke Pucuk Tongkat & Menerus ke Ujung Bayangan */}
                    {isSunUp && showRays && (
                      <G>
                        <Line
                          x1={sun3D.pSun[0]}
                          y1={sun3D.pSun[1]}
                          x2={pTip[0]}
                          y2={pTip[1]}
                          stroke="#FBBF24"
                          strokeWidth={1.3}
                          strokeDasharray="4,3"
                          opacity={0.8}
                        />
                        <Line
                          x1={pTip[0]}
                          y1={pTip[1]}
                          x2={pShadowTip[0]}
                          y2={pShadowTip[1]}
                          stroke="#FDE047"
                          strokeWidth={1.15}
                          strokeDasharray="2,2"
                          opacity={0.9}
                        />
                      </G>
                    )}

                    {/* Mesh 3D Alas Tongkat (Istiwak_*_Alas dari assets/istiwaain.glb) */}
                    <Path d={g.alas.dark} fill="#475569" />
                    <Path d={g.alas.mid} fill="#94A3B8" />
                    <Path d={g.alas.lit} fill="#E2E8F0" />

                    {/* Mesh 3D Batang Tongkat (Istiwak_*_Batang dari assets/istiwaain.glb) */}
                    <Path d={g.batang.dark} fill="#475569" stroke="#475569" strokeWidth={0.25} />
                    <Path d={g.batang.mid} fill="#CBD5E1" stroke="#CBD5E1" strokeWidth={0.25} />
                    <Path d={g.batang.lit} fill="#F8FAFC" stroke="#F8FAFC" strokeWidth={0.25} />

                    {/* Mesh 3D Ujung Kerucut Tongkat (Istiwak_*_Ujung dari assets/istiwaain.glb) */}
                    <Path d={g.ujung.dark} fill={g.tipColor} opacity={0.75} />
                    <Path d={g.ujung.mid} fill={g.tipColor} />
                    <Path d={g.ujung.lit} fill="#FFFFFF" opacity={0.85} />

                    {/* Label Nama Tongkat */}
                    <SvgText
                      x={pTip[0]}
                      y={pTip[1] - 7}
                      fill="#F8FAFC"
                      fontSize={8}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {g.label}
                    </SvgText>
                  </G>
                );
              })}

              {/* 12. Visualisasi 3D Bola Matahari & Garis Proyeksi Horison */}
              {isSunUp && (
                <G>
                  {/* Garis arah datangnya Azimut Matahari di bidang horison */}
                  <Line
                    x1={sun3D.pCenter[0]}
                    y1={sun3D.pCenter[1]}
                    x2={sun3D.pGround[0]}
                    y2={sun3D.pGround[1]}
                    stroke="#F59E0B"
                    strokeWidth={0.9}
                    strokeDasharray="2,3"
                    opacity={0.45}
                  />
                  {/* Garis proyeksi tinggi matahari (Irtafa') */}
                  <Line
                    x1={sun3D.pGround[0]}
                    y1={sun3D.pGround[1]}
                    x2={sun3D.pSun[0]}
                    y2={sun3D.pSun[1]}
                    stroke="#F59E0B"
                    strokeWidth={1}
                    strokeDasharray="2,3"
                    opacity={0.55}
                  />
                  {/* Halo pijar matahari */}
                  <Circle cx={sun3D.pSun[0]} cy={sun3D.pSun[1]} r={17} fill="url(#sunGlow)" />
                  {/* Inti bola matahari */}
                  <Circle
                    cx={sun3D.pSun[0]}
                    cy={sun3D.pSun[1]}
                    r={6.2}
                    fill="#FBBF24"
                    stroke="#FEF9C3"
                    strokeWidth={1.5}
                  />
                  <SvgText
                    x={sun3D.pSun[0]}
                    y={sun3D.pSun[1] - 11}
                    fill="#FDE68A"
                    fontSize={8.5}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ☀️ Irtafa&apos; {sunAltitude.toFixed(1)}°
                  </SvgText>
                </G>
              )}
            </G>
          )}
        </Svg>

        {/* Kontrol Overlay Atas: Mode Orientasi Alat & Toggle Sinar */}
        <View style={styles.topControlOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.btnMode,
              alignMode === 'sop' ? styles.btnModeActive : null,
            ]}
            onPress={() => setAlignMode(alignMode === 'sop' ? 'utsb' : 'sop')}
          >
            <Compass size={12} color={alignMode === 'sop' ? '#34D399' : '#38BDF8'} />
            <Text style={styles.btnToggleRayText}>
              {alignMode === 'sop' ? 'Mode: Bidik 0° ke ☀️' : 'Mode: Peta UTSB'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnToggleRay}
            onPress={() => setShowRays(!showRays)}
          >
            <Sun size={12} color="#F59E0B" />
            <Text style={styles.btnToggleRayText}>
              {showRays ? 'Sinar: ON' : 'Sinar: OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Status & Petunjuk Singkat di Bawah */}
        <View style={styles.bottomHint} pointerEvents="none">
          <Text style={styles.hintText}>
            {alignMode === 'sop'
              ? `Bayangan 0° → Pusat sejajar | Kiblat di BA = ${computedBA.toFixed(1)}°`
              : `0° = Utara | Bayangan ke ${((sunAzimuth + 180) % 360).toFixed(1)}° | Kiblat ${qiblaAzimuth.toFixed(1)}°`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  topControlOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnMode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: '#475569',
  },
  btnModeActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(6, 78, 59, 0.75)',
  },
  btnToggleRay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: '#475569',
  },
  btnToggleRayText: {
    color: '#E2E8F0',
    fontSize: 9.5,
    fontWeight: '600',
  },
  bottomHint: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#334155',
  },
  hintText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '600',
  },
});
