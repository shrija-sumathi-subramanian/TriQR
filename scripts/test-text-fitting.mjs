/**
 * Verification test for Face-Aware Text Auto-Fitting and Boundary Constraints.
 */

import {
  computeAutoFitText,
  getCubeFaceLayout,
  getTriangularPyramidFaceLayout,
  getPolyhedronFaceLayout,
} from "../src/lib/face-text-layout.ts";

const testStrings = [
  "X",
  "GitHub",
  "LinkedIn Profile",
  "Senior Full-Stack Engineer",
  "https://myportfolio.io/developer/spatial-3d-identity",
  "EXTRAORDINARILY_LONG_CONTINUOUS_STRING_WITHOUT_SPACES_OR_PUNCTUATION_TO_TEST_SAFETY",
];

console.log("==================================================================");
console.log("  Testing computeAutoFitText across various text lengths");
console.log("==================================================================");

for (const str of testStrings) {
  const result = computeAutoFitText({
    text: str,
    baseFontSize: 0.28,
    maxWidth: 1.2,
    maxHeight: 0.35,
    isBold: false,
    maxLines: 2,
  });
  console.log(`Input: "${str.slice(0, 28)}${str.length > 28 ? '...' : ''}" (${str.length} chars)`);
  console.log(`  -> Font size: ${result.fontSize} (base: 0.28)`);
  console.log(`  -> Display: "${result.displayText}"`);
  console.log(`  -> Max Width: ${result.maxWidth}`);
  if (result.fontSize <= 0 || isNaN(result.fontSize)) {
    throw new Error(`Invalid fontSize: ${result.fontSize}`);
  }
}

console.log("\n==================================================================");
console.log("  Verifying Zero Collision (Guaranteed Gap) on QR Faces");
console.log("==================================================================");

// 1. Cube
const cubeLayout = getCubeFaceLayout(0.35, "LinkedIn Profile", "Alex Rivera");
const cubeQrTop = cubeLayout.qrPosition[1] + cubeLayout.qrSize / 2;
const cubeLabelBottom = cubeLayout.labelPosition[1] - cubeLayout.labelMaxHeight / 2;
const cubeGap = cubeLabelBottom - cubeQrTop;
console.log(`Cube: QR top = ${cubeQrTop.toFixed(3)}, Label bottom = ${cubeLabelBottom.toFixed(3)}, Gap = ${cubeGap.toFixed(3)}`);
if (cubeGap <= 0) throw new Error("Cube QR and label collide!");

// 2. Triangular Pyramid
const triLayout = getTriangularPyramidFaceLayout(2.4, 2.1, 0.35, "LinkedIn Profile", "Alex Rivera");
const triQrTop = triLayout.qrPosition[1] + triLayout.qrSize / 2;
const triLabelBottom = triLayout.labelPosition[1] - triLayout.labelMaxHeight / 2;
const triGap = triLabelBottom - triQrTop;
console.log(`Triangular Pyramid: QR top = ${triQrTop.toFixed(3)}, Label bottom = ${triLabelBottom.toFixed(3)}, Gap = ${triGap.toFixed(3)}`);
if (triGap <= 0) throw new Error("Triangular Pyramid QR and label collide!");

// 3. Polyhedron Triangle (Octahedron)
const octFace = { vertexCount: 3, width: 1.9, height: 1.65 };
const octLayout = getPolyhedronFaceLayout(octFace, 0.35, "LinkedIn Profile", "Alex Rivera");
const octQrTop = octLayout.qrPosition[1] + octLayout.qrSize / 2;
const octLabelBottom = octLayout.labelPosition[1] - octLayout.labelMaxHeight / 2;
const octGap = octLabelBottom - octQrTop;
console.log(`Octahedron Face: QR top = ${octQrTop.toFixed(3)}, Label bottom = ${octLabelBottom.toFixed(3)}, Gap = ${octGap.toFixed(3)}`);
if (octGap <= 0) throw new Error("Octahedron QR and label collide!");

// 4. Polyhedron Quad (Triangular Prism Side)
const prismFace = { vertexCount: 4, width: 1.99, height: 1.80 };
const prismLayout = getPolyhedronFaceLayout(prismFace, 0.35, "LinkedIn Profile", "Alex Rivera");
const prismQrTop = prismLayout.qrPosition[1] + prismLayout.qrSize / 2;
const prismLabelBottom = prismLayout.labelPosition[1] - prismLayout.labelMaxHeight / 2;
const prismGap = prismLabelBottom - prismQrTop;
console.log(`Prism Quad Face: QR top = ${prismQrTop.toFixed(3)}, Label bottom = ${prismLabelBottom.toFixed(3)}, Gap = ${prismGap.toFixed(3)}`);
if (prismGap <= 0) throw new Error("Prism Quad QR and label collide!");

// 5. Polyhedron Pentagon (Dodecahedron)
const dodecFace = { vertexCount: 5, width: 1.55, height: 1.48 };
const dodecLayout = getPolyhedronFaceLayout(dodecFace, 0.35, "LinkedIn Profile", "Alex Rivera");
const dodecQrTop = dodecLayout.qrPosition[1] + dodecLayout.qrSize / 2;
const dodecLabelBottom = dodecLayout.labelPosition[1] - dodecLayout.labelMaxHeight / 2;
const dodecGap = dodecLabelBottom - dodecQrTop;
console.log(`Dodecahedron Face: QR top = ${dodecQrTop.toFixed(3)}, Label bottom = ${dodecLabelBottom.toFixed(3)}, Gap = ${dodecGap.toFixed(3)}`);
if (dodecGap <= 0) throw new Error("Dodecahedron QR and label collide!");

console.log("\nAll collision checks passed! Positive separation guaranteed on all shapes.");

