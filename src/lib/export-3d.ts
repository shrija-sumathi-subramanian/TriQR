import {
  CanvasTexture,
  DoubleSide,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Material, Texture } from "three";
import JSZip from "jszip";

/**
 * Metadata attached to each face for identification and orientation.
 */
export type FaceMetadata = {
  faceId: string;
  normal: [number, number, number];
  rotation: [number, number, number, number];
  isNameFace?: boolean;
};

/**
 * Checks if a scene object is a Drei / Troika Text mesh.
 */
export function isTroikaTextMesh(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const anyObj = obj as Record<string, unknown>;
  const mat = anyObj.material as Record<string, unknown> | undefined;

  return (
    anyObj.isTroikaText === true ||
    typeof anyObj.text === "string" ||
    anyObj.constructor?.name === "Text" ||
    anyObj.constructor?.name === "TextMesh" ||
    Boolean(mat?.isTroikaGlyphMaterial)
  );
}

/**
 * Renders a Troika text object onto an HTML canvas and returns a standard Plane mesh
 * with a CanvasTexture that standard GLTFExporter serializes into GLB without issues.
 */
export function convertTroikaTextToMesh(troikaObj: Object3D): Mesh | null {
  const anyText = troikaObj as unknown as {
    text?: string;
    fontSize?: number;
    color?: string | { getHexString?: () => string };
    maxWidth?: number;
    textAlign?: string;
    fontWeight?: string;
    font?: string;
    position: Vector3;
    quaternion: Quaternion;
    scale: Vector3;
    parent?: Object3D;
  };

  const text = String(anyText.text || "").trim();
  if (!text) return null;

  const fontSize = Number(anyText.fontSize) || 0.35;
  const maxWidth = Number(anyText.maxWidth) || 1.8;

  let colorStr = "#2B2118";
  if (anyText.color) {
    if (typeof anyText.color === "string") {
      colorStr = anyText.color;
    } else if (typeof anyText.color.getHexString === "function") {
      colorStr = "#" + anyText.color.getHexString();
    }
  }

  const isBold =
    anyText.fontWeight === "bold" ||
    anyText.fontWeight === "700" ||
    (typeof anyText.font === "string" && anyText.font.toLowerCase().includes("bold"));

  const isSerif =
    typeof anyText.font === "string"
      ? anyText.font.toLowerCase().includes("serif")
      : true; // Default font in TriQR AppearanceSettings is serif (Lora)

  const fontFamily = isSerif
    ? "'Lora', Georgia, 'Times New Roman', serif"
    : "'Source Sans 3', system-ui, -apple-system, sans-serif";

  // High resolution scale factor for crisp label textures in 3D viewers
  const pixelsPerUnit = 512;
  const canvasWidth = Math.min(2048, Math.max(256, Math.ceil(maxWidth * pixelsPerUnit)));
  const fontPixelSize = Math.round(fontSize * pixelsPerUnit);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.font = `${isBold ? "bold " : ""}${fontPixelSize}px ${fontFamily}`;

  // Word wrapping
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > canvasWidth * 0.92 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  if (lines.length === 0) lines.push(text);

  const lineHeight = Math.round(fontPixelSize * 1.25);
  const totalTextHeight = lines.length * lineHeight;
  const canvasHeight = Math.max(128, Math.ceil(totalTextHeight + fontPixelSize * 0.6));

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const textAlign = (anyText.textAlign as CanvasTextAlign) || "center";

  // Re-apply context font state after resizing canvas
  ctx.font = `${isBold ? "bold " : ""}${fontPixelSize}px ${fontFamily}`;
  ctx.fillStyle = colorStr;
  ctx.textAlign = textAlign;
  ctx.textBaseline = "middle";

  const startY = (canvasHeight - (lines.length - 1) * lineHeight) / 2;
  const drawX =
    textAlign === "center"
      ? canvasWidth / 2
      : textAlign === "right"
        ? canvasWidth * 0.95
        : canvasWidth * 0.05;

  lines.forEach((line, index) => {
    ctx.fillText(line, drawX, startY + index * lineHeight);
  });

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;

  const planeWidth = canvasWidth / pixelsPerUnit;
  const planeHeight = canvasHeight / pixelsPerUnit;
  const geometry = new PlaneGeometry(planeWidth, planeHeight);

  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
    side: DoubleSide,
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = `TriQR_Label`;
  mesh.position.copy(anyText.position);
  mesh.quaternion.copy(anyText.quaternion);
  mesh.scale.copy(anyText.scale);

  return mesh;
}

/**
 * Recursively clones an Object3D, converting Troika text meshes into standard
 * CanvasTexture meshes and preserving materials, textures, names, and userData.
 */
function cloneHierarchyForExport(obj: Object3D): Object3D | null {
  if (isTroikaTextMesh(obj)) {
    return convertTroikaTextToMesh(obj);
  }

  let copy: Object3D;

  if ((obj as Mesh).isMesh) {
    const mesh = obj as Mesh;
    let geom = mesh.geometry;
    if (geom) {
      geom = geom.clone();
    }

    let mat: Material | Material[];
    if (Array.isArray(mesh.material)) {
      mat = mesh.material.map((m) => cloneMaterialWithTextures(m));
    } else if (mesh.material) {
      mat = cloneMaterialWithTextures(mesh.material);
    } else {
      mat = mesh.material;
    }

    const newMesh = new Mesh(geom, mat);
    newMesh.castShadow = false;
    newMesh.receiveShadow = false;
    copy = newMesh;
  } else if ((obj as Group).isGroup) {
    copy = new Group();
  } else {
    copy = new Object3D();
  }

  copy.name = obj.name || "TriQR_Node";
  copy.position.copy(obj.position);
  copy.quaternion.copy(obj.quaternion);
  copy.scale.copy(obj.scale);
  copy.visible = obj.visible;

  if (obj.userData) {
    copy.userData = JSON.parse(JSON.stringify(obj.userData));
  }

  for (const child of obj.children) {
    const clonedChild = cloneHierarchyForExport(child);
    if (clonedChild) {
      copy.add(clonedChild);
    }
  }

  return copy;
}

function cloneMaterialWithTextures(material: Material): Material {
  const cloned = material.clone();
  // Ensure sRGB color space is retained on texture maps
  const anyCloned = cloned as unknown as { map?: Texture };
  if (anyCloned.map) {
    anyCloned.map.colorSpace = SRGBColorSpace;
    anyCloned.map.needsUpdate = true;
  }
  return cloned;
}

/**
 * Prepares the model root group for clean GLB export.
 * Preserves the true canonical initial orientation (separating it from user-triggered face rotation),
 * clones the graph, converts Troika text, enriches semantic face metadata, updates world matrices,
 * and returns a clean root group.
 */
export async function prepareModelForExport(source: Group): Promise<Group> {
  // Preserve transient preview state
  const transientQuaternion = source.quaternion.clone();
  const transientPosition = source.position.clone();

  // Determine true canonical initial orientation (separate from user-triggered face rotation)
  const canonicalQuaternion =
    (source.userData?.initialQuaternion as Quaternion | undefined)?.clone() ??
    new Quaternion(0, 0, 0, 1);
  const canonicalPosition = new Vector3(0, 0, 0);

  // Set source to canonical orientation before cloning
  source.quaternion.copy(canonicalQuaternion);
  source.position.copy(canonicalPosition);
  source.updateMatrixWorld(true);

  // Wait for any pending image textures (e.g. QR code base64 images)
  const pendingImages: Promise<void>[] = [];
  source.traverse((obj) => {
    const mesh = obj as Mesh;
    if (mesh.isMesh && mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const tex = (m as unknown as { map?: Texture }).map;
        if (tex && tex.image) {
          const img = tex.image as HTMLImageElement;
          if (img && typeof img.complete === "boolean" && !img.complete) {
            pendingImages.push(
              new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
            );
          }
        }
      }
    }
  });

  if (pendingImages.length > 0) {
    await Promise.all(pendingImages);
  }

  // Deep clone and convert Troika text
  const exportRoot = new Group();
  exportRoot.name = "TriQR_Model";
  exportRoot.position.copy(canonicalPosition);
  exportRoot.quaternion.copy(canonicalQuaternion);

  for (const child of source.children) {
    const cloned = cloneHierarchyForExport(child);
    if (cloned) {
      exportRoot.add(cloned);
    }
  }

  // Restore live preview scene transform exactly as the user had it
  source.quaternion.copy(transientQuaternion);
  source.position.copy(transientPosition);
  source.updateMatrixWorld(true);

  // Automatically infer and enrich semantic face nodes & metadata if not already present
  inferAndEnrichFaceNodes(exportRoot);

  // Update matrices on export tree
  exportRoot.updateMatrixWorld(true);

  return exportRoot;
}

/**
 * Automatically inspects the cloned hierarchy and ensures every face node,
 * surface mesh, QR mesh, label, and body mesh has clean semantic names
 * and metadata for Blender outliner organization and click-to-front interaction.
 */
export function inferAndEnrichFaceNodes(exportRoot: Group): void {
  let faceIndex = 0;

  for (const child of exportRoot.children) {
    // Check if this child is the solid central body mesh
    if ((child as Mesh).isMesh && faceIndex === 0 && child.children.length === 0) {
      if (!child.name || child.name === "TriQR_Node") {
        child.name = "TriQR_Body";
      }
      continue;
    }

    faceIndex++;
    const isNameFace = faceIndex === 1;
    const defaultFaceId = isNameFace ? "name-face" : `face-${faceIndex}`;

    // Respect existing userData or name if already set
    const faceId = (child.userData?.triqrFaceId as string) || defaultFaceId;

    if (!child.name || child.name === "TriQR_Node") {
      child.name = `TriQR_Face_${faceId}`;
    }

    let faceQuat = child.quaternion.clone();
    let faceNormal = new Vector3(0, 0, 1).applyQuaternion(faceQuat);

    // If child.position is offset (e.g. in CubeScene), compute normal from position
    if (child.position.lengthSq() > 0.1) {
      const posNormal = child.position.clone().normalize();
      if (
        child.quaternion.lengthSq() < 0.001 ||
        (child.quaternion.x === 0 &&
          child.quaternion.y === 0 &&
          child.quaternion.z === 0 &&
          child.quaternion.w === 1)
      ) {
        faceNormal = posNormal;
        const up = new Vector3(0, 1, 0);
        let pUp = up.clone().addScaledVector(posNormal, -up.dot(posNormal)).normalize();
        if (pUp.lengthSq() < 0.001) pUp.set(0, 0, 1);
        const right = pUp.clone().cross(posNormal).normalize();
        const cUp = posNormal.clone().cross(right).normalize();
        faceQuat = new Quaternion().setFromRotationMatrix(
          new Matrix4().makeBasis(right, cUp, posNormal)
        );
      }
    }

    if (!child.userData?.triqrFaceId) {
      child.userData = {
        ...child.userData,
        triqrFaceId: faceId,
        triqrNormal: [faceNormal.x, faceNormal.y, faceNormal.z],
        triqrRotation: [faceQuat.x, faceQuat.y, faceQuat.z, faceQuat.w],
        triqrIsNameFace: isNameFace,
      };
    }

    // Label child sub-meshes
    child.traverse((sub) => {
      if (sub === child) return;
      if ((sub as Mesh).isMesh) {
        if (!sub.name || sub.name === "TriQR_Node") {
          const mat = (sub as Mesh).material;
          const hasTexture = Boolean((mat as unknown as { map?: Texture })?.map);
          if (hasTexture) {
            sub.name = `TriQR_QR_${faceId}`;
          } else {
            sub.name = `TriQR_FaceSurface_${faceId}`;
          }
        }
      }
    });
  }
}

/**
 * Exports a prepared Three.js Group to a binary GLB ArrayBuffer.
 */
export async function exportGroupToGlb(exportRoot: Group): Promise<ArrayBuffer> {
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const exporter = new GLTFExporter();

  const result = await exporter.parseAsync(exportRoot, {
    binary: true,
    onlyVisible: true,
    trs: true,
    maxTextureSize: 4096,
  });

  if (!(result instanceof ArrayBuffer)) {
    throw new Error("The GLB exporter did not return a binary model.");
  }

  return result;
}

/**
 * Generates the standalone interactive HTML viewer with the GLB model embedded as base64.
 */
export function generateStandaloneViewerHtml(glbBuffer: ArrayBuffer, modelTitle: string): string {
  const bytes = new Uint8Array(glbBuffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const base64Glb = btoa(binary);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(modelTitle || "TriQR 3D Identity")}</title>
  <style>
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #F5F0E9;
    }
    #viewer {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: none;
    }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      color: #82776D;
      pointer-events: none;
      transition: opacity 0.3s;
    }
  </style>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/"
    }
  }
  </script>
</head>
<body>
  <div id="loading">Loading 3D model…</div>
  <canvas id="viewer"></canvas>

  <script type="module">
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    const canvas = document.querySelector('#viewer');
    const loadingEl = document.querySelector('#loading');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F5F0E9');

    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 1000);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd0c4b8, 1.4));
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight1.position.set(4, 6, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight2.position.set(-4, -2, -3);
    scene.add(dirLight2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 0.8;

    let model = null;
    let turning = false;
    let turnFrame = 0;
    let downX = 0, downY = 0, isDragging = false;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const base64Data = "${base64Glb}";
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const loader = new GLTFLoader();
    loader.parse(bytes.buffer, '', (gltf) => {
      model = gltf.scene;
      scene.add(model);
      model.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.updateMatrixWorld(true);

      const size = box.getSize(new THREE.Vector3()).length() || 3;
      camera.position.set(0, 0, size * 1.55);
      camera.near = Math.max(size / 500, 0.01);
      camera.far = size * 100;
      camera.updateProjectionMatrix();

      controls.target.set(0, 0, 0);
      controls.minDistance = size * 0.7;
      controls.maxDistance = size * 5.0;
      controls.update();

      if (loadingEl) loadingEl.style.display = 'none';
    }, (error) => {
      console.error('Failed to load TriQR model:', error);
      if (loadingEl) loadingEl.textContent = 'Failed to load 3D model';
    });

    // Detect drag movement threshold (distinguish drag from click)
    canvas.addEventListener('pointerdown', (e) => {
      downX = e.clientX;
      downY = e.clientY;
      isDragging = false;
    });

    canvas.addEventListener('pointermove', (e) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) {
        isDragging = true;
      }
    });

    canvas.addEventListener('click', (e) => {
      if (!model || isDragging || turning) return;

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(model.children, true);
      if (!hits.length) return;

      // Find the clicked face by checking hierarchy for face metadata or naming
      let faceNode = null;
      for (const hit of hits) {
        let curr = hit.object;
        while (curr && curr !== model) {
          if (curr.userData && curr.userData.triqrFaceId) {
            faceNode = curr;
            break;
          }
          if (curr.name && curr.name.startsWith('TriQR_Face_')) {
            faceNode = curr;
            break;
          }
          curr = curr.parent;
        }
        if (faceNode) break;
      }

      // If no explicit face was hit, check hit mesh normals
      let faceRotation = null;
      if (faceNode && faceNode.userData && Array.isArray(faceNode.userData.triqrRotation)) {
        faceRotation = new THREE.Quaternion(...faceNode.userData.triqrRotation);
      } else if (faceNode) {
        faceRotation = faceNode.quaternion.clone();
      } else {
        // Only click-to-front if the hit was a face surface, not the solid central body
        const hit = hits.find(h => h.object.name && !h.object.name.includes('Body') && h.face);
        if (hit && hit.face) {
          const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
          const localNormal = worldNormal.clone().applyQuaternion(model.quaternion.clone().invert()).normalize();
          const up = new THREE.Vector3(0, 1, 0);
          let pUp = up.clone().addScaledVector(localNormal, -up.dot(localNormal)).normalize();
          if (pUp.lengthSq() < 0.001) pUp.set(0, 0, 1);
          const right = pUp.clone().cross(localNormal).normalize();
          const cUp = localNormal.clone().cross(right).normalize();
          faceRotation = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(right, cUp, localNormal)
          );
        }
      }

      if (!faceRotation) return;

      // Upright camera-facing orientation algorithm
      const cameraPos = new THREE.Vector3();
      const modelPos = new THREE.Vector3();
      camera.getWorldPosition(cameraPos);
      model.getWorldPosition(modelPos);

      const faceNormalWorld = cameraPos.clone().sub(modelPos).normalize();
      const worldUp = new THREE.Vector3(0, 1, 0);
      let projectedUp = worldUp.clone().addScaledVector(faceNormalWorld, -worldUp.dot(faceNormalWorld));
      if (projectedUp.lengthSq() < 0.001) {
        projectedUp.set(0, 0, 1).addScaledVector(faceNormalWorld, -faceNormalWorld.z);
      }
      projectedUp.normalize();

      const right = projectedUp.clone().cross(faceNormalWorld).normalize();
      const correctedUp = faceNormalWorld.clone().cross(right).normalize();

      const faceMatrix = new THREE.Matrix4().makeBasis(right, correctedUp, faceNormalWorld);
      const desiredFaceWorld = new THREE.Quaternion().setFromRotationMatrix(faceMatrix);

      const desiredRootWorld = desiredFaceWorld.clone().multiply(faceRotation.clone().invert());

      if (model.parent) {
        const parentWorldRot = new THREE.Quaternion();
        model.parent.getWorldQuaternion(parentWorldRot);
        desiredRootWorld.premultiply(parentWorldRot.invert());
      }

      const startQuat = model.quaternion.clone();
      const targetQuat = desiredRootWorld;

      turning = true;
      controls.enabled = false;
      const startTime = performance.now();
      const duration = 600;

      const animateStep = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        model.quaternion.slerpQuaternions(startQuat, targetQuat, ease);

        if (progress < 1) {
          turnFrame = requestAnimationFrame(animateStep);
        } else {
          model.quaternion.copy(targetQuat);
          turning = false;
          controls.enabled = true;
        }
      };

      cancelAnimationFrame(turnFrame);
      turnFrame = requestAnimationFrame(animateStep);
    });

    function resize() {
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    new ResizeObserver(resize).observe(canvas);
    resize();

    function renderLoop() {
      requestAnimationFrame(renderLoop);
      if (!turning) controls.update();
      renderer.render(scene, camera);
    }
    renderLoop();
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return m;
    }
  });
}

/**
 * Source code for the reusable Web Component `triqr-embed.js`.
 */
export const WEB_COMPONENT_SOURCE = String.raw`/**
 * TriQR Web Component — <triqr-model>
 * A standalone, reusable 3D identity viewer with drag, zoom, and upright click-to-front.
 *
 * Usage:
 *   <triqr-model src="/models/my-triqr.glb" height="520px"></triqr-model>
 *   <script type="module" src="/triqr/triqr-embed.js"></script>
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/controls/OrbitControls.js';

class TriQRModel extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'height', 'width', 'background'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._animId = 0;
    this._turnFrame = 0;
    this._turning = false;
    this._model = null;
    this._controls = null;
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._resizeObserver = null;
  }

  connectedCallback() {
    this._setupDOM();
    this._initThree();
    this._loadModel();
  }

  disconnectedCallback() {
    this._cleanup();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'src' && this._renderer) {
      this._loadModel();
    } else if (name === 'background' && this._scene) {
      this._scene.background = new THREE.Color(newVal || '#F5F0E9');
    }
  }

  _setupDOM() {
    const height = this.getAttribute('height') || '480px';
    const width = this.getAttribute('width') || '100%';
    const bg = this.getAttribute('background') || '#F5F0E9';

    this.shadowRoot.innerHTML = [
      '<style>',
      ':host { display: block; position: relative; width: ' + width + '; height: ' + height + '; min-height: 280px; background: ' + bg + '; border-radius: 12px; overflow: hidden; }',
      'canvas { display: block; width: 100%; height: 100%; touch-action: none; }',
      '.status-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-family: system-ui, -apple-system, sans-serif; font-size: 14px; color: #82776D; pointer-events: none; }',
      '</style>',
      '<div class="status-overlay" id="status">Loading 3D model…</div>',
      '<canvas id="canvas"></canvas>'
    ].join('\n');
  }

  _initThree() {
    const canvas = this.shadowRoot.querySelector('#canvas');
    const bg = this.getAttribute('background') || '#F5F0E9';

    this._renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.0;

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(bg);

    this._camera = new THREE.PerspectiveCamera(38, 1, 0.05, 1000);

    this._scene.add(new THREE.HemisphereLight(0xffffff, 0xd0c4b8, 1.4));
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight1.position.set(4, 6, 5);
    this._scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight2.position.set(-4, -2, -3);
    this._scene.add(dirLight2);

    this._controls = new OrbitControls(this._camera, canvas);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.08;
    this._controls.enablePan = false;
    this._controls.rotateSpeed = 0.8;
    this._controls.zoomSpeed = 0.8;

    this._setupEvents(canvas);

    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(canvas);
    this._onResize();

    const render = () => {
      this._animId = requestAnimationFrame(render);
      if (!this._turning && this._controls) this._controls.update();
      if (this._renderer && this._scene && this._camera) {
        this._renderer.render(this._scene, this._camera);
      }
    };
    render();
  }

  _onResize() {
    if (!this._renderer || !this._camera) return;
    const canvas = this.shadowRoot.querySelector('#canvas');
    if (!canvas) return;
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    this._renderer.setSize(w, h, false);
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
  }

  _loadModel() {
    const src = this.getAttribute('src');
    const statusEl = this.shadowRoot.querySelector('#status');
    if (!src) {
      if (statusEl) statusEl.textContent = 'No model source specified';
      return;
    }

    if (this._model) {
      this._scene.remove(this._model);
      this._model = null;
    }

    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.textContent = 'Loading 3D model…';
    }

    const loader = new GLTFLoader();
    loader.load(
      src,
      (gltf) => {
        this._model = gltf.scene;
        this._scene.add(this._model);
        this._model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(this._model);
        const center = box.getCenter(new THREE.Vector3());
        this._model.position.sub(center);
        this._model.updateMatrixWorld(true);

        const size = box.getSize(new THREE.Vector3()).length() || 3;
        this._camera.position.set(0, 0, size * 1.55);
        this._camera.near = Math.max(size / 500, 0.01);
        this._camera.far = size * 100;
        this._camera.updateProjectionMatrix();

        this._controls.target.set(0, 0, 0);
        this._controls.minDistance = size * 0.7;
        this._controls.maxDistance = size * 5.0;
        this._controls.update();

        if (statusEl) statusEl.style.display = 'none';
        this.dispatchEvent(new CustomEvent('load', { detail: { model: this._model } }));
      },
      undefined,
      (error) => {
        console.error('TriQR Model load error:', error);
        if (statusEl) statusEl.textContent = 'Failed to load 3D model';
        this.dispatchEvent(new CustomEvent('error', { detail: { error } }));
      }
    );
  }

  _setupEvents(canvas) {
    let downX = 0, downY = 0, isDragging = false;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    canvas.addEventListener('pointerdown', (e) => {
      downX = e.clientX;
      downY = e.clientY;
      isDragging = false;
    });

    canvas.addEventListener('pointermove', (e) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) {
        isDragging = true;
      }
    });

    canvas.addEventListener('click', (e) => {
      if (!this._model || isDragging || this._turning) return;

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, this._camera);

      const hits = raycaster.intersectObjects(this._model.children, true);
      if (!hits.length) return;

      let faceNode = null;
      for (const hit of hits) {
        let curr = hit.object;
        while (curr && curr !== this._model) {
          if (curr.userData && curr.userData.triqrFaceId) {
            faceNode = curr;
            break;
          }
          if (curr.name && curr.name.startsWith('TriQR_Face_')) {
            faceNode = curr;
            break;
          }
          curr = curr.parent;
        }
        if (faceNode) break;
      }

      let faceRotation = null;
      if (faceNode && faceNode.userData && Array.isArray(faceNode.userData.triqrRotation)) {
        faceRotation = new THREE.Quaternion(...faceNode.userData.triqrRotation);
      } else if (faceNode) {
        faceRotation = faceNode.quaternion.clone();
      } else {
        const hit = hits.find(h => h.object.name && !h.object.name.includes('Body') && h.face);
        if (hit && hit.face) {
          const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
          const localNormal = worldNormal.clone().applyQuaternion(this._model.quaternion.clone().invert()).normalize();
          const up = new THREE.Vector3(0, 1, 0);
          let pUp = up.clone().addScaledVector(localNormal, -up.dot(localNormal)).normalize();
          if (pUp.lengthSq() < 0.001) pUp.set(0, 0, 1);
          const right = pUp.clone().cross(localNormal).normalize();
          const cUp = localNormal.clone().cross(right).normalize();
          faceRotation = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(right, cUp, localNormal)
          );
        }
      }

      if (!faceRotation) return;

      // Upright orientation formula
      const cameraPos = new THREE.Vector3();
      const modelPos = new THREE.Vector3();
      this._camera.getWorldPosition(cameraPos);
      this._model.getWorldPosition(modelPos);

      const faceNormalWorld = cameraPos.clone().sub(modelPos).normalize();
      const worldUp = new THREE.Vector3(0, 1, 0);
      let projectedUp = worldUp.clone().addScaledVector(faceNormalWorld, -worldUp.dot(faceNormalWorld));
      if (projectedUp.lengthSq() < 0.001) {
        projectedUp.set(0, 0, 1).addScaledVector(faceNormalWorld, -faceNormalWorld.z);
      }
      projectedUp.normalize();

      const right = projectedUp.clone().cross(faceNormalWorld).normalize();
      const correctedUp = faceNormalWorld.clone().cross(right).normalize();

      const faceMatrix = new THREE.Matrix4().makeBasis(right, correctedUp, faceNormalWorld);
      const desiredFaceWorld = new THREE.Quaternion().setFromRotationMatrix(faceMatrix);
      const desiredRootWorld = desiredFaceWorld.clone().multiply(faceRotation.clone().invert());

      if (this._model.parent) {
        const parentWorldRot = new THREE.Quaternion();
        this._model.parent.getWorldQuaternion(parentWorldRot);
        desiredRootWorld.premultiply(parentWorldRot.invert());
      }

      const startQuat = this._model.quaternion.clone();
      const targetQuat = desiredRootWorld;

      this._turning = true;
      this._controls.enabled = false;
      const startTime = performance.now();
      const duration = 600;

      const animateStep = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        this._model.quaternion.slerpQuaternions(startQuat, targetQuat, ease);

        if (progress < 1) {
          this._turnFrame = requestAnimationFrame(animateStep);
        } else {
          this._model.quaternion.copy(targetQuat);
          this._turning = false;
          this._controls.enabled = true;
        }
      };

      cancelAnimationFrame(this._turnFrame);
      this._turnFrame = requestAnimationFrame(animateStep);
    });
  }

  _cleanup() {
    cancelAnimationFrame(this._animId);
    cancelAnimationFrame(this._turnFrame);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    if (this._controls) this._controls.dispose();
    if (this._renderer) {
      this._renderer.dispose();
      this._renderer.forceContextLoss();
    }
  }
}

if (!customElements.get('triqr-model')) {
  customElements.define('triqr-model', TriQRModel);
}
export { TriQRModel };
`;

/**
 * Source code for the reusable React / Next.js component `TriQRModel.tsx`.
 */
export const REACT_COMPONENT_SOURCE = String.raw`"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type TriQRModelProps = {
  src: string;
  height?: number | string;
  width?: number | string;
  background?: string;
  className?: string;
  style?: CSSProperties;
  onLoad?: () => void;
  onError?: (error: Error) => void;
};

export default function TriQRModel({
  src,
  height = 520,
  width = "100%",
  background = "#F5F0E9",
  className,
  style,
  onLoad,
  onError,
}: TriQRModelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId = 0;
    let turnFrame = 0;
    let turning = false;
    let model: THREE.Group | null = null;

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "none";
    container.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 1000);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd0c4b8, 1.4));
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight1.position.set(4, 6, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight2.position.set(-4, -2, -3);
    scene.add(dirLight2);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 0.8;

    function handleResize() {
      const w = Math.max(1, container?.clientWidth || 300);
      const h = Math.max(1, container?.clientHeight || 300);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    setLoading(true);
    setErrorMessage(null);

    const loader = new GLTFLoader();
    loader.load(
      src,
      (gltf) => {
        model = gltf.scene;
        scene.add(model);
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.updateMatrixWorld(true);

        const size = box.getSize(new THREE.Vector3()).length() || 3;
        camera.position.set(0, 0, size * 1.55);
        camera.near = Math.max(size / 500, 0.01);
        camera.far = size * 100;
        camera.updateProjectionMatrix();

        controls.target.set(0, 0, 0);
        controls.minDistance = size * 0.7;
        controls.maxDistance = size * 5.0;
        controls.update();

        setLoading(false);
        onLoad?.();
      },
      undefined,
      (err) => {
        const error = err instanceof Error ? err : new Error("Failed to load 3D model");
        console.error("TriQRModel loading error:", error);
        setLoading(false);
        setErrorMessage("Failed to load 3D model");
        onError?.(error);
      }
    );

    // Pointer events for upright click-to-front
    let downX = 0, downY = 0, isDragging = false;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      isDragging = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) {
        isDragging = true;
      }
    };

    const onClick = (e: MouseEvent) => {
      if (!model || isDragging || turning) return;

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(model.children, true);
      if (!hits.length) return;

      let faceNode: THREE.Object3D | null = null;
      for (const hit of hits) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== model) {
          if (curr.userData && curr.userData.triqrFaceId) {
            faceNode = curr;
            break;
          }
          if (curr.name && curr.name.startsWith("TriQR_Face_")) {
            faceNode = curr;
            break;
          }
          curr = curr.parent;
        }
        if (faceNode) break;
      }

      let faceRotation: THREE.Quaternion | null = null;
      if (faceNode && faceNode.userData && Array.isArray(faceNode.userData.triqrRotation)) {
        faceRotation = new THREE.Quaternion(...faceNode.userData.triqrRotation);
      } else if (faceNode) {
        faceRotation = faceNode.quaternion.clone();
      } else {
        const hit = hits.find((h) => h.object.name && !h.object.name.includes("Body") && h.face);
        if (hit && hit.face) {
          const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
          const localNormal = worldNormal.clone().applyQuaternion(model.quaternion.clone().invert()).normalize();
          const up = new THREE.Vector3(0, 1, 0);
          let pUp = up.clone().addScaledVector(localNormal, -up.dot(localNormal)).normalize();
          if (pUp.lengthSq() < 0.001) pUp.set(0, 0, 1);
          const right = pUp.clone().cross(localNormal).normalize();
          const cUp = localNormal.clone().cross(right).normalize();
          faceRotation = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(right, cUp, localNormal)
          );
        }
      }

      if (!faceRotation) return;

      const cameraPos = new THREE.Vector3();
      const modelPos = new THREE.Vector3();
      camera.getWorldPosition(cameraPos);
      model.getWorldPosition(modelPos);

      const faceNormalWorld = cameraPos.clone().sub(modelPos).normalize();
      const worldUp = new THREE.Vector3(0, 1, 0);
      let projectedUp = worldUp.clone().addScaledVector(faceNormalWorld, -worldUp.dot(faceNormalWorld));
      if (projectedUp.lengthSq() < 0.001) {
        projectedUp.set(0, 0, 1).addScaledVector(faceNormalWorld, -faceNormalWorld.z);
      }
      projectedUp.normalize();

      const right = projectedUp.clone().cross(faceNormalWorld).normalize();
      const correctedUp = faceNormalWorld.clone().cross(right).normalize();

      const faceMatrix = new THREE.Matrix4().makeBasis(right, correctedUp, faceNormalWorld);
      const desiredFaceWorld = new THREE.Quaternion().setFromRotationMatrix(faceMatrix);
      const desiredRootWorld = desiredFaceWorld.clone().multiply(faceRotation.clone().invert());

      if (model.parent) {
        const parentWorldRot = new THREE.Quaternion();
        model.parent.getWorldQuaternion(parentWorldRot);
        desiredRootWorld.premultiply(parentWorldRot.invert());
      }

      const startQuat = model.quaternion.clone();
      const targetQuat = desiredRootWorld;

      turning = true;
      controls.enabled = false;
      const startTime = performance.now();
      const duration = 600;

      const animateStep = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        model?.quaternion.slerpQuaternions(startQuat, targetQuat, ease);

        if (progress < 1) {
          turnFrame = requestAnimationFrame(animateStep);
        } else {
          model?.quaternion.copy(targetQuat);
          turning = false;
          controls.enabled = true;
        }
      };

      cancelAnimationFrame(turnFrame);
      turnFrame = requestAnimationFrame(animateStep);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("click", onClick);

    function render() {
      animId = requestAnimationFrame(render);
      if (!turning) controls.update();
      renderer.render(scene, camera);
    }
    render();

    return () => {
      cancelAnimationFrame(animId);
      cancelAnimationFrame(turnFrame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("click", onClick);
      controls.dispose();
      renderer.dispose();
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, [src, background, onLoad, onError]);

  const heightValue = typeof height === "number" ? height + "px" : height;
  const widthValue = typeof width === "number" ? width + "px" : width;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: widthValue,
        height: heightValue,
        minHeight: 280,
        backgroundColor: background,
        borderRadius: 12,
        overflow: "hidden",
        ...style,
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#82776D",
            fontSize: 14,
            fontFamily: "system-ui, -apple-system, sans-serif",
            pointerEvents: "none",
          }}
        >
          Loading 3D model…
        </div>
      )}
      {errorMessage && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#A33D32",
            fontSize: 14,
            fontFamily: "system-ui, -apple-system, sans-serif",
            pointerEvents: "none",
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
`;

/**
 * Example HTML page demonstrating `<triqr-model>`.
 */
export const HTML_EXAMPLE_SOURCE = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TriQR Web Component Demo</title>
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      font-family: system-ui, -apple-system, sans-serif;
      background: #FDFBF7;
      color: #2B2118;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .container {
      width: 100%;
      max-width: 800px;
    }
    h1 {
      margin-top: 0;
      font-size: 28px;
    }
    p {
      color: #82776D;
      line-height: 1.5;
    }
    .card {
      margin-top: 24px;
      padding: 16px;
      background: #FFFFFF;
      border: 1px solid #EAE2D9;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>My Interactive 3D Identity</h1>
    <p>Drag to rotate the model, scroll to zoom, and click any face to turn it toward you for scanning.</p>

    <div class="card">
      <triqr-model src="../assets/my-triqr.glb" height="520px"></triqr-model>
    </div>
  </div>

  <script type="module" src="./triqr-embed.js"></script>
</body>
</html>
`;

/**
 * Example React component usage.
 */
export const REACT_EXAMPLE_SOURCE = String.raw`import TriQRModel from "./TriQRModel";

export default function IdentitySection() {
  return (
    <section style={{ maxWidth: 800, margin: "40px auto", padding: 20 }}>
      <h2 style={{ fontSize: 28, color: "#2B2118" }}>My Digital Identity</h2>
      <p style={{ color: "#82776D" }}>
        Interactive 3D model. Click any face to bring it forward for easy scanning.
      </p>

      <div style={{ marginTop: 24, borderRadius: 16, overflow: "hidden", border: "1px solid #EAE2D9" }}>
        <TriQRModel
          src="/models/my-triqr.glb"
          height={520}
          background="#F5F0E9"
        />
      </div>
    </section>
  );
}
`;

/**
 * Comprehensive Developer README documentation.
 */
export function generateReadme(modelName: string, shapeName: string, safeFileName: string): string {
  return `# TriQR Developer Integration Package

This package allows you to embed your 3D TriQR identity model directly into any website or application.

- **Model Name:** ${modelName}
- **3D Shape:** ${shapeName}
- **Asset File:** \`assets/${safeFileName}.glb\`

---

## 1. Package Directory Structure

\`\`\`
triqr-developer-package/
├── assets/
│   └── ${safeFileName}.glb       # Your exported 3D model (GLB format)
├── viewer/
│   └── index.html                # Standalone interactive viewer
├── html/
│   ├── triqr-embed.js            # Custom Web Component (<triqr-model>)
│   └── example.html              # Working HTML demonstration
├── react/
│   ├── TriQRModel.tsx            # React / Next.js client component
│   └── example.tsx               # Working React demonstration
└── README.md                     # Integration documentation
\`\`\`

---

## 2. Hosting Your Model Asset

1. Copy \`assets/${safeFileName}.glb\` to your website's public assets folder (e.g., \`public/models/${safeFileName}.glb\`).
2. Ensure your web server serves \`.glb\` files with the MIME type \`model/gltf-binary\` and enables CORS if hosted on a separate CDN.

---

## 3. Integration Method 1: HTML / JavaScript (Custom Element)

### Step 1: Include the script and component

Copy \`html/triqr-embed.js\` into your site and reference it with \`type="module"\`:

\`\`\`html
<!-- Include the Web Component -->
<script type="module" src="/scripts/triqr-embed.js"></script>

<!-- Render the 3D model -->
<triqr-model
  src="/models/${safeFileName}.glb"
  height="520px"
  width="100%"
  background="#F5F0E9">
</triqr-model>
\`\`\`

### Attributes Reference:
| Attribute | Type | Default | Description |
|---|---|---|---|
| \`src\` | \`string\` | **Required** | URL path to your \`.glb\` model file |
| \`height\` | \`string\` | \`"480px"\` | Container height (e.g. \`"520px"\` or \`"80vh"\`) |
| \`width\` | \`string\` | \`"100%"\` | Container width |
| \`background\` | \`string\` | \`"#F5F0E9"\` | Canvas background hex color |

---

## 4. Integration Method 2: React / Next.js

### Step 1: Copy the Component

Copy \`react/TriQRModel.tsx\` into your components directory (e.g. \`components/TriQRModel.tsx\`).

### Step 2: Install Three.js dependencies (if not already installed)

\`\`\`bash
npm install three @types/three
\`\`\`

### Step 3: Use the Component

\`\`\`tsx
import TriQRModel from "@/components/TriQRModel";

export default function ProfilePage() {
  return (
    <main>
      <h1>My 3D Identity</h1>
      <TriQRModel
        src="/models/${safeFileName}.glb"
        height={520}
        background="#F5F0E9"
      />
    </main>
  );
}
\`\`\`

### Component Props:
| Prop | Type | Default | Description |
|---|---|---|---|
| \`src\` | \`string\` | **Required** | URL path to your \`.glb\` model file |
| \`height\` | \`number \| string\` | \`520\` | Height in pixels or CSS string |
| \`width\` | \`number \| string\` | \`"100%"\` | Width in pixels or CSS string |
| \`background\` | \`string\` | \`"#F5F0E9"\` | Canvas background color |
| \`className\` | \`string\` | \`undefined\` | Optional CSS class name |
| \`style\` | \`React.CSSProperties\` | \`undefined\` | Optional inline styles |
| \`onLoad\` | \`() => void\` | \`undefined\` | Callback fired when model finishes loading |
| \`onError\` | \`(err: Error) => void\` | \`undefined\` | Callback fired on loading error |

---

## 5. Built-in Interactions

Both the Web Component and React Component support:
- **Mouse / Touch Drag:** Rotate smoothly in any direction with damping.
- **Scroll Wheel / Pinch Zoom:** Zoom in and out with safe bounding limits.
- **Upright Click-to-Front:** Clicking any QR face smoothly aligns that face directly toward the camera, keeping the text and QR code right-side up for easy scanning.
- **Drag Thresholding:** Click-to-front does not trigger accidentally while dragging to rotate.
- **Responsive Layouts:** Uses \`ResizeObserver\` to adapt automatically to any screen size.
- **Automatic Resource Cleanup:** Disposes WebGL contexts, geometries, and textures when unmounted to avoid memory leaks.
`;
}

/**
 * Generates the complete developer integration ZIP file.
 */
export async function generateDeveloperZip(
  glbBuffer: ArrayBuffer,
  modelName: string,
  shapeName: string,
  safeFileName: string
): Promise<Blob> {
  const zip = new JSZip();

  // 1. Assets folder
  zip.file(`assets/${safeFileName}.glb`, glbBuffer);

  // 2. Standalone viewer
  const viewerHtml = generateStandaloneViewerHtml(glbBuffer, modelName);
  zip.file("viewer/index.html", viewerHtml);

  // 3. HTML Web Component & Example
  zip.file("html/triqr-embed.js", WEB_COMPONENT_SOURCE);
  zip.file("html/example.html", HTML_EXAMPLE_SOURCE.replace("../assets/my-triqr.glb", `../assets/${safeFileName}.glb`));

  // 4. React Component & Example
  zip.file("react/TriQRModel.tsx", REACT_COMPONENT_SOURCE);
  zip.file("react/example.tsx", REACT_EXAMPLE_SOURCE.replace("/models/my-triqr.glb", `/models/${safeFileName}.glb`));

  // 5. Documentation
  const readme = generateReadme(modelName, shapeName, safeFileName);
  zip.file("README.md", readme);

  return await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
