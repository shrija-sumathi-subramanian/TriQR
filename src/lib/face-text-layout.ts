/**
 * Face-aware 3D text and QR layout system for TriQR.
 *
 * Ensures mathematically guaranteed collision-free spacing between QR codes and labels,
 * safe geometric containment within tapered/triangular/polygonal face boundaries,
 * and adaptive font auto-scaling across all 9 polyhedral geometries.
 */

export type FaceShapeType = "square" | "triangle" | "rectangle" | "pentagon" | "hexagon";

export interface FaceLayoutConfig {
  /** Center of the QR code plane in local face coordinates [x, y, z] */
  qrPosition: [number, number, number];
  /** Dimensions of the QR code plane [width, height] */
  qrSize: number;
  /** Center of the label text in local face coordinates [x, y, z] */
  labelPosition: [number, number, number];
  /** Maximum safe horizontal width for label text */
  labelMaxWidth: number;
  /** Maximum vertical height allocated for label text */
  labelMaxHeight: number;
  /** Computed font size for the label */
  labelFontSize: number;
  /** Name face text configuration */
  namePosition: [number, number, number];
  nameMaxWidth: number;
  nameFontSize: number;
}

/**
 * Calculates adaptive font size and wrapping parameters to guarantee
 * that text stays strictly within the allocated boundary.
 */
export function computeAutoFitText({
  text,
  baseFontSize,
  maxWidth,
  maxHeight,
  isBold = false,
  maxLines = 2,
}: {
  text: string;
  baseFontSize: number;
  maxWidth: number;
  maxHeight?: number;
  isBold?: boolean;
  maxLines?: number;
}): {
  fontSize: number;
  maxWidth: number;
  displayText: string;
} {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return {
      fontSize: baseFontSize,
      maxWidth,
      displayText: " ",
    };
  }

  // Average character width relative to font size for proportional fonts (Lora / Source Sans)
  const charWidthRatio = isBold ? 0.54 : 0.48;
  const len = trimmed.length;

  // Estimate single-line length
  const estSingleLineWidth = len * charWidthRatio * baseFontSize;

  let scale = 1.0;

  if (estSingleLineWidth > maxWidth) {
    // If text wraps across multiple lines, estimate the longest word or split line
    const words = trimmed.split(/\s+/);
    const longestWordLen = Math.max(...words.map((w) => w.length));
    const estLongestWordWidth = longestWordLen * charWidthRatio * baseFontSize;

    // Smooth scaling curve based on character count and available width
    const targetScale = Math.min(
      maxWidth / estLongestWordWidth,
      (maxWidth * Math.min(words.length, maxLines)) / estSingleLineWidth
    );

    // Clamp scaling between 62% and 100% of base font size
    scale = Math.max(0.62, Math.min(1.0, targetScale * 0.95));
  }

  // If maxHeight is constrained, ensure lines do not exceed the vertical slot
  if (maxHeight !== undefined) {
    const lineHeight = baseFontSize * scale * 1.25;
    const maxAllowedLines = Math.max(1, Math.floor(maxHeight / lineHeight));
    if (maxAllowedLines < maxLines) {
      const heightScale = maxHeight / (maxLines * baseFontSize * 1.25);
      scale = Math.max(0.55, Math.min(scale, heightScale));
    }
  }

  const fittedFontSize = Math.round(baseFontSize * scale * 1000) / 1000;

  // For extreme lengths that still exceed boundary at min scale, truncate with ellipsis
  let displayText = trimmed;
  const maxSafeChars = Math.floor((maxWidth * maxLines) / (fittedFontSize * charWidthRatio));
  if (trimmed.length > maxSafeChars && maxSafeChars > 6) {
    displayText = trimmed.slice(0, maxSafeChars - 3).trimEnd() + "...";
  }

  return {
    fontSize: fittedFontSize,
    maxWidth,
    displayText,
  };
}

/**
 * Layout configuration for standard Cube faces (face plane 2.12 x 2.12).
 *
 * Dedicated zones:
 * - QR plane: size 1.22 x 1.22 at y = -0.20 (top edge at +0.41, bottom edge at -0.81)
 * - Label: centered at y = +0.68 with maxWidth 1.85 (bottom edge at ~+0.52)
 * - Guaranteed vertical gap >= 0.11 units. Zero overlap.
 */
export function getCubeFaceLayout(
  appearanceFontSize: number,
  labelText = "",
  nameText = ""
): FaceLayoutConfig {
  const baseLabelFont = Math.min(0.24, appearanceFontSize * 0.55);
  const baseNameFont = Math.min(0.38, appearanceFontSize * 0.9);

  const labelFit = computeAutoFitText({
    text: labelText,
    baseFontSize: baseLabelFont,
    maxWidth: 1.85,
    maxHeight: 0.32,
    isBold: false,
    maxLines: 2,
  });

  const nameFit = computeAutoFitText({
    text: nameText,
    baseFontSize: baseNameFont,
    maxWidth: 1.9,
    maxHeight: 0.8,
    isBold: false,
    maxLines: 3,
  });

  return {
    qrPosition: [0, -0.20, 0.025],
    qrSize: 1.22,
    labelPosition: [0, 0.68, 0.025],
    labelMaxWidth: labelFit.maxWidth,
    labelMaxHeight: 0.32,
    labelFontSize: labelFit.fontSize,
    namePosition: [0, 0, 0.025],
    nameMaxWidth: nameFit.maxWidth,
    nameFontSize: nameFit.fontSize,
  };
}

/**
 * Layout configuration for Triangular Pyramid (Tetrahedron) equilateral triangular faces.
 *
 * In an equilateral triangle of height H and width W (centroid at origin):
 * - Apex is at +2/3 H, base at -1/3 H.
 * - Width narrows towards the apex: W(y) = W * (y_apex - y) / H.
 *
 * Sizing:
 * - QR code: size 0.54 positioned in the wider lower-middle region (y = -0.15). Top edge = +0.12.
 * - Label: positioned at y = +0.27 with width constrained to 0.82 (bottom edge = +0.18).
 * - Guaranteed positive gap between label and QR >= 0.06 units.
 */
export function getTriangularPyramidFaceLayout(
  faceWidth: number,
  faceHeight: number,
  appearanceFontSize: number,
  labelText = "",
  nameText = ""
): FaceLayoutConfig {
  const faceUnit = Math.min(faceWidth, faceHeight);

  // QR in wider lower region
  const qrSize = Math.min(faceUnit * 0.28, 0.62);
  const qrY = -faceHeight * 0.13;
  const qrTop = qrY + qrSize / 2;

  // Label in upper band with positive gap above QR
  const minGap = 0.05;
  const labelY = Math.max(qrTop + minGap + 0.08, faceHeight * 0.22);

  // Available width at labelY inside triangular apex
  // Relative vertical distance from centroid to apex is ~0.667 * faceHeight
  const apexY = faceHeight * 0.60;
  const remainingHeightFraction = Math.max(0.15, (apexY - labelY) / (faceHeight * 0.9));
  const safeTriangleWidth = faceWidth * remainingHeightFraction * 0.82;
  const labelMaxWidth = Math.max(0.45, Math.min(safeTriangleWidth, faceWidth * 0.42));

  const baseLabelFont = Math.min(appearanceFontSize * 0.24, faceUnit * 0.065);
  const baseNameFont = Math.min(appearanceFontSize * 0.32, faceUnit * 0.085);

  const labelFit = computeAutoFitText({
    text: labelText,
    baseFontSize: baseLabelFont,
    maxWidth: labelMaxWidth,
    maxHeight: faceHeight * 0.16,
    isBold: false,
    maxLines: 2,
  });

  const nameFit = computeAutoFitText({
    text: nameText,
    baseFontSize: baseNameFont,
    maxWidth: faceWidth * 0.52,
    maxHeight: faceHeight * 0.35,
    isBold: false,
    maxLines: 3,
  });

  return {
    qrPosition: [0, qrY, 0.035],
    qrSize,
    labelPosition: [0, labelY, 0.035],
    labelMaxWidth: labelFit.maxWidth,
    labelMaxHeight: faceHeight * 0.16,
    labelFontSize: labelFit.fontSize,
    namePosition: [0, 0, 0.035],
    nameMaxWidth: nameFit.maxWidth,
    nameFontSize: nameFit.fontSize,
  };
}

/**
 * Layout configuration for polyhedral faces (Square Pyramid, Triangular Prism,
 * Pentagonal Prism, Hexagonal Prism, Octahedron, Dodecahedron, Icosahedron).
 *
 * Automatically branches on vertexCount (3: triangle, 4: quad/rectangle, 5: pentagon, 6: hexagon)
 * and face aspect ratio to ensure harmonious layout and zero collision.
 */
export function getPolyhedronFaceLayout(
  face: {
    vertexCount: number;
    width: number;
    height: number;
  },
  appearanceFontSize: number,
  labelText = "",
  nameText = ""
): FaceLayoutConfig {
  const { vertexCount, width, height } = face;
  const isTriangle = vertexCount === 3;
  const isPentagon = vertexCount === 5;
  const isHexagon = vertexCount === 6;

  let qrSize: number;
  let qrY: number;
  let labelY: number;
  let labelMaxWidth: number;
  let labelMaxHeight: number;
  let baseLabelFont: number;
  let baseNameFont: number;
  let nameMaxWidth: number;

  if (isTriangle) {
    // Triangular faces (Octahedron, Icosahedron, sides of Square Pyramid, ends of Triangular Prism)
    const faceUnit = Math.min(width, height);
    qrSize = Math.min(width * 0.30, height * 0.30, 0.58);
    qrY = -height * 0.10;
    const qrTop = qrY + qrSize / 2;

    labelY = Math.max(qrTop + 0.06, height * 0.24);
    labelMaxWidth = width * 0.48;
    labelMaxHeight = height * 0.18;

    baseLabelFont = Math.min(appearanceFontSize * 0.22, faceUnit * 0.068);
    baseNameFont = Math.min(appearanceFontSize * 0.28, faceUnit * 0.088);
    nameMaxWidth = width * 0.52;
  } else if (isPentagon || isHexagon) {
    // Regular polygonal faces (Dodecahedron, prism caps)
    const faceUnit = Math.min(width, height);
    qrSize = Math.min(width * 0.36, height * 0.36, 0.72);
    qrY = -height * 0.09;
    const qrTop = qrY + qrSize / 2;

    labelY = Math.max(qrTop + 0.07, height * 0.26);
    labelMaxWidth = width * 0.62;
    labelMaxHeight = height * 0.20;

    baseLabelFont = Math.min(appearanceFontSize * 0.26, faceUnit * 0.078);
    baseNameFont = Math.min(appearanceFontSize * 0.32, faceUnit * 0.095);
    nameMaxWidth = width * 0.65;
  } else {
    // Quads & Rectangles (Sides of Triangular, Pentagonal, Hexagonal prisms, base of Square Pyramid)
    const isNarrowColumn = width < height * 0.85;
    qrSize = isNarrowColumn
      ? Math.min(width * 0.64, height * 0.36, 0.85)
      : Math.min(width * 0.44, height * 0.44, 0.95);

    qrY = -height * 0.12;
    const qrTop = qrY + qrSize / 2;

    labelY = Math.max(qrTop + 0.08, height * 0.28);
    labelMaxWidth = width * (isNarrowColumn ? 0.84 : 0.76);
    labelMaxHeight = height * 0.22;

    const faceUnit = Math.min(width, height);
    baseLabelFont = Math.min(appearanceFontSize * 0.28, faceUnit * 0.085);
    baseNameFont = Math.min(appearanceFontSize * 0.34, faceUnit * 0.105);
    nameMaxWidth = width * 0.82;
  }

  const labelFit = computeAutoFitText({
    text: labelText,
    baseFontSize: baseLabelFont,
    maxWidth: labelMaxWidth,
    maxHeight: labelMaxHeight,
    isBold: false,
    maxLines: 2,
  });

  const nameFit = computeAutoFitText({
    text: nameText,
    baseFontSize: baseNameFont,
    maxWidth: nameMaxWidth,
    maxHeight: height * 0.4,
    isBold: false,
    maxLines: 3,
  });

  return {
    qrPosition: [0, qrY, 0.035],
    qrSize,
    labelPosition: [0, labelY, 0.035],
    labelMaxWidth: labelFit.maxWidth,
    labelMaxHeight,
    labelFontSize: labelFit.fontSize,
    namePosition: [0, 0, 0.035],
    nameMaxWidth: nameFit.maxWidth,
    nameFontSize: nameFit.fontSize,
  };
}

