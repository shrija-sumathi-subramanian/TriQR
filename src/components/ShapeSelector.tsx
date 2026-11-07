"use client";

import { SHAPES, type ShapeId } from "@/lib/shape-config";

interface ShapeSelectorProps {
  selectedShape: ShapeId;
  onShapeChange: (shape: ShapeId) => void;
}

export default function ShapeSelector({
  selectedShape,
  onShapeChange,
}: ShapeSelectorProps) {
  return (
    <div className="shape-selector">
      {SHAPES.map((shape) => {
        const isSelected = selectedShape === shape.id;

        return (
          <button
            key={shape.id}
            type="button"
            className={`shape-card ${isSelected ? "selected" : ""}`}
            onClick={() => onShapeChange(shape.id)}
          >
            <span className="shape-card-name">{shape.name}</span>

            <span className="shape-card-capacity">
              {shape.totalFaces - 1} URL slots
            </span>
          </button>
        );
      })}
    </div>
  );
}