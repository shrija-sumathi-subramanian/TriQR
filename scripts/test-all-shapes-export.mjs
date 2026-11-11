/**
 * Comprehensive Multi-Shape 3D Export and Asset Verification Test
 * Tests all 9 shapes supported by TriQR:
 * 1. Cube
 * 2. Triangular Pyramid
 * 3. Square Pyramid
 * 4. Triangular Prism
 * 5. Pentagonal Prism
 * 6. Hexagonal Prism
 * 7. Octahedron
 * 8. Dodecahedron
 * 9. Icosahedron
 */

import fs from "fs";
import path from "path";
import * as THREE from "three";
import QRCode from "qrcode";
import JSZip from "jszip";
import {
  prepareModelForExport,
  exportGroupToGlb,
  generateStandaloneViewerHtml,
  generateDeveloperZip,
} from "../src/lib/export-3d.ts";
import { SHAPES } from "../src/lib/shape-config.ts";

// Polyfill FileReader for Node.js GLTFExporter execution
if (!globalThis.FileReader) {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      });
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((buf) => {
        const b64 = Buffer.from(buf).toString("base64");
        this.result = "data:application/octet-stream;base64," + b64;
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      });
    }
  };
}

class MockCanvas {
  constructor() {
    this.width = 512;
    this.height = 512;
  }
  getContext() {
    return {
      font: "",
      fillStyle: "",
      textAlign: "center",
      textBaseline: "middle",
      measureText(txt) {
        return { width: txt.length * 20 };
      },
      fillText() {},
      translate() {},
      scale() {},
      drawImage() {},
      clearRect() {},
      fillRect() {},
      putImageData() {},
    };
  }
  toBlob(callback, mimeType) {
    const png1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "base64"
    );
    callback(new Blob([png1x1], { type: mimeType || "image/png" }));
  }
  toDataURL(type) {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  }
}

class MockImage {
  constructor() {
    this.width = 256;
    this.height = 256;
    this.complete = true;
    this.src = "";
  }
}

globalThis.HTMLCanvasElement = MockCanvas;
globalThis.HTMLImageElement = MockImage;

if (!globalThis.document) {
  globalThis.document = {
    createElement(tag) {
      if (tag === "canvas") {
        return new MockCanvas();
      }
      if (tag === "img") {
        return new MockImage();
      }
      return {};
    },
  };
}

const outDir = path.resolve("./test-exports");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function getGeometryForShape(shapeId) {
  switch (shapeId) {
    case "cube":
      return new THREE.BoxGeometry(2.4, 2.4, 2.4);
    case "triangular-pyramid": {
      const geom = new THREE.BufferGeometry();
      const vertices = [
        0, 1.25, 0,
        -1.1, -0.65, 1,
        1.1, -0.65, 1,
        0, -0.65, -1.25,
      ];
      geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geom.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2]);
      geom.computeVertexNormals();
      return geom;
    }
    case "square-pyramid":
      return new THREE.ConeGeometry(1.35, 1.8, 4, 1, false);
    case "triangular-prism":
      return new THREE.CylinderGeometry(1.15, 1.15, 1.8, 3, 1, false);
    case "pentagonal-prism":
      return new THREE.CylinderGeometry(1.15, 1.15, 1.8, 5, 1, false);
    case "hexagonal-prism":
      return new THREE.CylinderGeometry(1.15, 1.15, 1.8, 6, 1, false);
    case "octahedron":
      return new THREE.OctahedronGeometry(1.35, 0);
    case "dodecahedron":
      return new THREE.DodecahedronGeometry(1.35, 0);
    case "icosahedron":
      return new THREE.IcosahedronGeometry(1.35, 0);
    default:
      return new THREE.BoxGeometry(2, 2, 2);
  }
}

async function testShapeExport(shape) {
  console.log(`\nTesting Shape: ${shape.name} (${shape.id}, ${shape.totalFaces} faces)`);

  const root = new THREE.Group();
  root.name = "TriQR_SceneRoot";

  // 1. Create solid body
  const bodyGeom = getGeometryForShape(shape.id);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: "#F8F4EC",
    roughness: 0.9,
    metalness: 0.0,
    clearcoat: 0,
    side: THREE.DoubleSide,
  });
  const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
  bodyMesh.name = "TriQR_Body";
  root.add(bodyMesh);

  // 2. Create faces with QR codes and text labels
  const sampleLinks = [
    { label: "My Portfolio", url: "https://alex.dev" },
    { label: "LinkedIn", url: "https://linkedin.com/in/alex" },
    { label: "GitHub", url: "https://github.com/alex" },
    { label: "X Profile", url: "https://x.com/alex" },
  ];

  for (let i = 0; i < shape.faces.length; i++) {
    const faceConfig = shape.faces[i];
    const isNameFace = faceConfig.isNameFace;
    const faceGroup = new THREE.Group();
    faceGroup.name = `TriQR_Face_${faceConfig.id}`;

    // Compute normal angle around circle for preview placement
    const angle = (i / shape.faces.length) * Math.PI * 2;
    const nx = Math.cos(angle);
    const nz = Math.sin(angle);
    faceGroup.position.set(nx * 1.25, 0, nz * 1.25);
    faceGroup.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle);

    faceGroup.userData = {
      triqrFaceId: faceConfig.id,
      triqrNormal: [nx, 0, nz],
      triqrRotation: [faceGroup.quaternion.x, faceGroup.quaternion.y, faceGroup.quaternion.z, faceGroup.quaternion.w],
      triqrIsNameFace: isNameFace,
    };

    // Face background surface
    const faceSurf = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.2),
      new THREE.MeshPhysicalMaterial({ color: "#F8F4EC", side: THREE.DoubleSide })
    );
    faceSurf.name = `TriQR_FaceSurface_${faceConfig.id}`;
    faceGroup.add(faceSurf);

    if (isNameFace) {
      // Troika-like text object on name face
      const nameTextObj = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.3), new THREE.MeshBasicMaterial());
      nameTextObj.isTroikaText = true;
      nameTextObj.text = "Alex Identity";
      nameTextObj.fontSize = 0.42;
      nameTextObj.color = "#49362B";
      nameTextObj.maxWidth = 1.8;
      nameTextObj.position.set(0, 0, 0.025);
      faceGroup.add(nameTextObj);
    } else {
      const link = sampleLinks[(i - 1) % sampleLinks.length];
      if (i <= sampleLinks.length) {
        // Generate QR code data URL
        const qrDataUrl = await QRCode.toDataURL(link.url, { width: 256, margin: 2 });
        // Create canvas for texture
        const qrImg = new MockImage();
        qrImg.src = qrDataUrl;
        const qrTex = new THREE.Texture(qrImg);
        qrTex.colorSpace = THREE.SRGBColorSpace;
        qrTex.needsUpdate = true;

        const qrMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.8, 0.8),
          new THREE.MeshBasicMaterial({ map: qrTex, side: THREE.DoubleSide })
        );
        qrMesh.name = `TriQR_QR_${faceConfig.id}`;
        qrMesh.position.set(0, -0.1, 0.025);
        faceGroup.add(qrMesh);

        // QR label text
        const labelTextObj = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.25), new THREE.MeshBasicMaterial());
        labelTextObj.isTroikaText = true;
        labelTextObj.text = link.label;
        labelTextObj.fontSize = 0.25;
        labelTextObj.color = "#49362B";
        labelTextObj.maxWidth = 1.6;
        labelTextObj.position.set(0, 0.4, 0.025);
        faceGroup.add(labelTextObj);
      } else {
        // Empty face text
        const emptyTextObj = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.25), new THREE.MeshBasicMaterial());
        emptyTextObj.isTroikaText = true;
        emptyTextObj.text = "Empty face";
        emptyTextObj.fontSize = 0.25;
        emptyTextObj.color = "#82776D";
        emptyTextObj.position.set(0, 0, 0.025);
        faceGroup.add(emptyTextObj);
      }
    }

    root.add(faceGroup);
  }

  // Set user-triggered rotation to test orientation separation
  root.userData.initialQuaternion = new THREE.Quaternion(0, 0, 0, 1);
  root.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 3);

  // 3. Prepare for export
  const exportRoot = await prepareModelForExport(root);

  // Verify that transient rotation was NOT baked into exportRoot
  if (Math.abs(exportRoot.quaternion.y) > 0.001) {
    throw new Error(`ExportRoot quaternion did not preserve canonical initial orientation! y=${exportRoot.quaternion.y}`);
  }

  // 4. Export to binary GLB
  const glbBuffer = await exportGroupToGlb(exportRoot);

  if (!(glbBuffer instanceof ArrayBuffer) || glbBuffer.byteLength < 500) {
    throw new Error(`Invalid GLB output for ${shape.name}`);
  }

  // 5. Parse binary GLB structure
  const dataView = new DataView(glbBuffer);
  const magic = dataView.getUint32(0, true);
  if (magic !== 0x46546c67) {
    throw new Error(`Invalid GLB magic header 0x${magic.toString(16)}`);
  }
  const version = dataView.getUint32(4, true);
  const totalLength = dataView.getUint32(8, true);

  const jsonChunkLength = dataView.getUint32(12, true);
  const jsonChunkBytes = new Uint8Array(glbBuffer, 20, jsonChunkLength);
  const gltfJson = JSON.parse(new TextDecoder().decode(jsonChunkBytes));

  console.log(`  -> GLB valid: ${glbBuffer.byteLength} bytes (totalLength: ${totalLength}, version: ${version})`);
  console.log(`  -> Nodes in glTF: ${gltfJson.nodes?.length}, Meshes: ${gltfJson.meshes?.length}, Materials: ${gltfJson.materials?.length}`);

  // Save GLB file to test-exports/
  const glbPath = path.join(outDir, `${shape.id}.glb`);
  fs.writeFileSync(glbPath, Buffer.from(glbBuffer));
  console.log(`  -> Saved: ${glbPath}`);

  // 6. Test standalone HTML viewer generation
  const viewerHtml = generateStandaloneViewerHtml(glbBuffer, `${shape.name} Identity`);
  const viewerPath = path.join(outDir, `${shape.id}-viewer.html`);
  fs.writeFileSync(viewerPath, viewerHtml);
  console.log(`  -> Saved Standalone Viewer: ${viewerPath}`);

  // 7. Test developer ZIP generation
  const zipBlob = await generateDeveloperZip(glbBuffer, `${shape.name} Identity`, shape.name, shape.id);
  const zipBuffer = Buffer.from(await zipBlob.arrayBuffer());
  const zipPath = path.join(outDir, `${shape.id}-developer-integration.zip`);
  fs.writeFileSync(zipPath, zipBuffer);
  console.log(`  -> Saved Developer ZIP: ${zipPath} (${zipBuffer.length} bytes)`);

  // Verify ZIP internal contents
  const zip = await JSZip.loadAsync(zipBuffer);
  const requiredFiles = [
    `assets/${shape.id}.glb`,
    `viewer/index.html`,
    `html/triqr-embed.js`,
    `html/example.html`,
    `react/TriQRModel.tsx`,
    `react/example.tsx`,
    `README.md`,
  ];
  for (const req of requiredFiles) {
    if (!zip.file(req)) {
      throw new Error(`Missing required file in ZIP: ${req}`);
    }
  }

  return {
    shapeId: shape.id,
    name: shape.name,
    glbSize: glbBuffer.byteLength,
    zipSize: zipBuffer.length,
    nodeCount: gltfJson.nodes?.length,
  };
}

async function runAll() {
  console.log("==================================================================");
  console.log("  TriQR — Running Full Export & Verification on ALL 9 Shapes");
  console.log("==================================================================");

  const results = [];
  for (const shape of SHAPES) {
    const res = await testShapeExport(shape);
    results.push(res);
  }

  console.log("\n==================================================================");
  console.log("  FINAL RESULTS TABLE");
  console.log("==================================================================");
  console.table(results);
  console.log("\nAll 9 shapes successfully generated valid GLB models, viewers, and developer ZIPs!");
}

runAll().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
