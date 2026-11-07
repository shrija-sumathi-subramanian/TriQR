
export type ShapeId =
  | "cube"
  | "triangular-pyramid"
  | "square-pyramid"
  | "triangular-prism"
  | "pentagonal-prism"
  | "hexagonal-prism"
  | "octahedron"
  | "dodecahedron"
  | "icosahedron";

export type ShapeFace = {
  id: string;
  label: string;
  isNameFace: boolean;
};

export type ShapeConfig = {
  id: ShapeId;
  name: string;
  totalFaces: number;
  faces: ShapeFace[];
};

function createFaces(
  totalFaces: number,
  labels?: string[]
): ShapeFace[] {
  return Array.from({ length: totalFaces }, (_, index) => ({
    id: index === 0 ? "name-face" : `face-${index + 1}`,
    label:
      labels?.[index] ??
      (index === 0 ? "Name face" : `Face ${index + 1}`),
    isNameFace: index === 0,
  }));
}

export const SHAPES: ShapeConfig[] = [
  {
    id: "cube",
    name: "Cube",
    totalFaces: 6,
    faces: createFaces(6, [
      "Front (Name)",
      "Back",
      "Right",
      "Left",
      "Top",
      "Bottom",
    ]),
  },
  {
    id: "triangular-pyramid",
    name: "Triangular Pyramid",
    totalFaces: 4,
    faces: createFaces(4),
  },
  {
    id: "square-pyramid",
    name: "Square Pyramid",
    totalFaces: 5,
    faces: createFaces(5),
  },
  {
    id: "triangular-prism",
    name: "Triangular Prism",
    totalFaces: 5,
    faces: createFaces(5),
  },
  {
    id: "pentagonal-prism",
    name: "Pentagonal Prism",
    totalFaces: 7,
    faces: createFaces(7),
  },
  {
    id: "hexagonal-prism",
    name: "Hexagonal Prism",
    totalFaces: 8,
    faces: createFaces(8),
  },
  {
    id: "octahedron",
    name: "Octahedron",
    totalFaces: 8,
    faces: createFaces(8),
  },
  {
    id: "dodecahedron",
    name: "Dodecahedron",
    totalFaces: 12,
    faces: createFaces(12),
  },
  {
    id: "icosahedron",
    name: "Icosahedron",
    totalFaces: 20,
    faces: createFaces(20),
  },
];

// Get the configuration of a selected shape.
export function getShapeConfig(
  shapeId: ShapeId
): ShapeConfig | undefined {
  return SHAPES.find((shape) => shape.id === shapeId);
}

// The first face is always reserved for the model name.
export function getQrFaces(shapeId: ShapeId): ShapeFace[] {
  const shape = getShapeConfig(shapeId);

  return shape?.faces.filter((face) => !face.isNameFace) ?? [];
}

// Get the maximum number of QR codes a shape can hold.
export function getQrCapacity(shapeId: ShapeId): number {
  return getQrFaces(shapeId).length;
}

// Split selected links into those that fit and those that remain outside.
export function splitLinksByCapacity<T>(
  links: T[],
  capacity: number
): {
  assigned: T[];
  additional: T[];
} {
  return {
    assigned: links.slice(0, capacity),
    additional: links.slice(capacity),
  };
}
