/**
 * Comprehensive Verification Suite for TriQR 3D Export System
 * Tests all 9 shapes, GLB generation, HTML viewer, and Developer ZIP.
 */

import * as THREE from "three";
import JSZip from "jszip";
import {
  generateStandaloneViewerHtml,
  generateDeveloperZip,
  generateReadme,
  WEB_COMPONENT_SOURCE,
  REACT_COMPONENT_SOURCE,
  HTML_EXAMPLE_SOURCE,
  REACT_EXAMPLE_SOURCE,
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

console.log("=================================================");
console.log("  TriQR 3D EXPORT SYSTEM — VERIFICATION SUITE");
console.log("=================================================\n");

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // TEST 1: Shape configurations
  console.log("--- 1. Testing Shape Configurations ---");
  assert(SHAPES.length === 9, `Total 9 shapes supported (found: ${SHAPES.length})`);
  const shapeIds = SHAPES.map((s) => s.id);
  const expectedShapes = [
    "cube",
    "triangular-pyramid",
    "square-pyramid",
    "triangular-prism",
    "pentagonal-prism",
    "hexagonal-prism",
    "octahedron",
    "dodecahedron",
    "icosahedron",
  ];
  for (const exp of expectedShapes) {
    assert(shapeIds.includes(exp), `Shape registered: ${exp}`);
  }

  // TEST 2: Synthesize 3D model scenes for all 9 shapes and verify GLB export
  console.log("\n--- 2. Testing GLB Export Across All 9 Shapes ---");
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const exporter = new GLTFExporter();

  for (const shape of SHAPES) {
    const root = new THREE.Group();
    root.name = "TriQR_Model";

    // Add body
    const bodyGeom = new THREE.BoxGeometry(2, 2, 2);
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xf8f4ec, roughness: 0.9 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.name = "TriQR_Body";
    root.add(body);

    // Add faces according to shape.faces
    shape.faces.forEach((face, idx) => {
      const faceGroup = new THREE.Group();
      faceGroup.name = `TriQR_Face_${face.id}`;
      faceGroup.userData = {
        triqrFaceId: face.id,
        triqrNormal: [0, 0, 1],
        triqrRotation: [0, 0, 0, 1],
        triqrIsNameFace: face.isNameFace,
      };

      const faceMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshPhysicalMaterial({ color: 0xf8f4ec })
      );
      faceMesh.name = `TriQR_FaceSurface_${face.id}`;
      faceGroup.add(faceMesh);

      if (!face.isNameFace) {
        const qrMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.6, 0.6),
          new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        qrMesh.name = `TriQR_QR_${face.id}`;
        faceGroup.add(qrMesh);
      }

      root.add(faceGroup);
    });

    const glbBuffer = await exporter.parseAsync(root, {
      binary: true,
      onlyVisible: true,
      trs: true,
    });

    assert(
      glbBuffer instanceof ArrayBuffer && glbBuffer.byteLength > 1000,
      `${shape.name} (${shape.totalFaces} faces): GLB export valid (${glbBuffer.byteLength} bytes)`
    );

    // Verify GLB binary header
    const dataView = new DataView(glbBuffer);
    const magic = dataView.getUint32(0, true);
    assert(magic === 0x46546c67, `${shape.name}: GLB magic header verified ('glTF')`);
    const version = dataView.getUint32(4, true);
    assert(version === 2, `${shape.name}: GLB version 2 verified`);

    // Parse glTF JSON chunk
    const jsonChunkLength = dataView.getUint32(12, true);
    const jsonBytes = new Uint8Array(glbBuffer, 20, jsonChunkLength);
    const gltfJson = JSON.parse(new TextDecoder().decode(jsonBytes));

    assert(gltfJson.asset && gltfJson.asset.version === "2.0", `${shape.name}: glTF asset version 2.0 verified`);
    assert(gltfJson.nodes && gltfJson.nodes.length >= shape.totalFaces, `${shape.name}: ${gltfJson.nodes.length} nodes preserved`);

    const nodeNames = gltfJson.nodes.map((n) => n.name);
    assert(nodeNames.includes("TriQR_Body"), `${shape.name}: TriQR_Body node present`);
    assert(nodeNames.includes("TriQR_Face_name-face"), `${shape.name}: name-face node present`);
  }

  // TEST 3: Standalone Viewer HTML
  console.log("\n--- 3. Testing Standalone Interactive HTML Viewer ---");
  const testGlb = new Uint8Array([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0, 12, 0, 0, 0]).buffer;
  const viewerHtml = generateStandaloneViewerHtml(testGlb, "Alex Identity");

  assert(viewerHtml.includes("<!doctype html>"), "HTML viewer has DOCTYPE");
  assert(viewerHtml.includes("<title>Alex Identity</title>"), "HTML viewer includes model title");
  assert(viewerHtml.includes('id="viewer"'), "HTML viewer includes canvas element");
  assert(viewerHtml.includes("OrbitControls"), "HTML viewer includes OrbitControls");
  assert(viewerHtml.includes("GLTFLoader"), "HTML viewer includes GLTFLoader");
  assert(viewerHtml.includes("importmap"), "HTML viewer includes modern importmap");
  assert(viewerHtml.includes("slerpQuaternions"), "HTML viewer implements smooth orientation slerp");
  assert(viewerHtml.includes("isDragging"), "HTML viewer distinguishes drag from click");
  assert(viewerHtml.includes("triqrFaceId") || viewerHtml.includes("TriQR_Face_"), "HTML viewer detects face identifiers");
  assert(!viewerHtml.includes("TriQR branding"), "HTML viewer contains no promotional or extraneous branding");

  // TEST 4: Web Component (`triqr-embed.js`)
  console.log("\n--- 4. Testing HTML Web Component (triqr-embed.js) ---");
  assert(WEB_COMPONENT_SOURCE.includes("class TriQRModel extends HTMLElement"), "Web component defines TriQRModel class");
  assert(WEB_COMPONENT_SOURCE.includes("customElements.define('triqr-model', TriQRModel)"), "Registers <triqr-model> custom element");
  assert(WEB_COMPONENT_SOURCE.includes("observedAttributes"), "Supports observedAttributes (src, height, width, background)");
  assert(WEB_COMPONENT_SOURCE.includes("disconnectedCallback"), "Implements disconnectedCallback cleanup");
  assert(WEB_COMPONENT_SOURCE.includes("forceContextLoss"), "WebGL context and resources disposed properly");

  // TEST 5: React Component (`TriQRModel.tsx`)
  console.log("\n--- 5. Testing React / Next.js Component (TriQRModel.tsx) ---");
  assert(REACT_COMPONENT_SOURCE.includes('"use client"'), "Includes Next.js 'use client' directive");
  assert(REACT_COMPONENT_SOURCE.includes("export default function TriQRModel"), "Exports default TriQRModel component");
  assert(REACT_COMPONENT_SOURCE.includes("useEffect"), "Executes Three.js safely inside useEffect");
  assert(REACT_COMPONENT_SOURCE.includes("ResizeObserver"), "Handles responsive layout with ResizeObserver");
  assert(REACT_COMPONENT_SOURCE.includes("cancelAnimationFrame"), "Cancels animation frame on unmount");
  assert(REACT_COMPONENT_SOURCE.includes("controls.dispose()"), "Disposes OrbitControls on unmount");
  assert(REACT_COMPONENT_SOURCE.includes("renderer.dispose()"), "Disposes WebGLRenderer on unmount");

  // TEST 6: Developer Integration ZIP package
  console.log("\n--- 6. Testing Developer Integration ZIP Package ---");
  const zipBlob = await generateDeveloperZip(testGlb, "Alex Identity", "Cube", "alex-identity");
  assert(zipBlob instanceof Blob, "ZIP generated as Blob");
  assert(zipBlob.size > 1000, `ZIP size valid (${zipBlob.size} bytes)`);

  const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
  const fileNames = Object.keys(zip.files);

  assert(fileNames.includes("assets/alex-identity.glb"), "ZIP contains assets/alex-identity.glb");
  assert(fileNames.includes("viewer/index.html"), "ZIP contains viewer/index.html");
  assert(fileNames.includes("html/triqr-embed.js"), "ZIP contains html/triqr-embed.js");
  assert(fileNames.includes("html/example.html"), "ZIP contains html/example.html");
  assert(fileNames.includes("react/TriQRModel.tsx"), "ZIP contains react/TriQRModel.tsx");
  assert(fileNames.includes("react/example.tsx"), "ZIP contains react/example.tsx");
  assert(fileNames.includes("README.md"), "ZIP contains README.md");

  assert(!fileNames.some((f) => f.includes("node_modules")), "ZIP does NOT contain node_modules");
  assert(!fileNames.some((f) => f.includes(".next")), "ZIP does NOT contain .next");

  // TEST 7: Documentation completeness
  console.log("\n--- 7. Testing README Documentation Completeness ---");
  const readme = generateReadme("Alex Identity", "Cube", "alex-identity");
  assert(readme.includes("TriQR Developer Integration Package"), "README title present");
  assert(readme.includes("<triqr-model"), "README explains HTML Web Component usage");
  assert(readme.includes("<TriQRModel"), "README explains React component usage");
  assert(readme.includes("assets/alex-identity.glb"), "README references model asset");
  assert(readme.includes("Attributes Reference"), "README includes HTML attributes reference");
  assert(readme.includes("Component Props"), "README includes React props reference");

  console.log("\n=================================================");
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
