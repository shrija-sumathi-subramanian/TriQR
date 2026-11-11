"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import type { Group } from "three";

import CubeScene from "./CubeScene";
import TriangularPyramidScene from "./TriangularPyramidScene";
import PolyhedronScene from "./PolyhedronScene";
import AppearanceControls from "./AppearanceControls";
import DownloadOptions from "./DownloadOptions";

import type { GeneratedQR, FaceAssignments } from "@/lib/qr-types";
import type { ShapeId } from "@/lib/shape-config";

import {
  createDefaultAppearance,
  type AppearanceSettings,
} from "@/lib/appearance-types";

type IdentityCubeProps = {
  cubeName: string;
  selectedShape: ShapeId;
  qrCodes: GeneratedQR[];
  assignments: FaceAssignments;
};

export default function IdentityCube({
  cubeName,
  selectedShape,
  qrCodes,
  assignments,
}: IdentityCubeProps) {
  const [resetKey, setResetKey] = useState(0);
  const [selectedFaceId, setSelectedFaceId] = useState("name-face");
  const [appearance, setAppearance] = useState<AppearanceSettings>(
    () => createDefaultAppearance(selectedShape)
  );

  // Shared root ref: used by face rotation and by the GLB/HTML/ZIP exporter.
  const shapeRef = useRef<Group | null>(null);

  useEffect(() => {
    setAppearance(createDefaultAppearance(selectedShape));
    setSelectedFaceId("name-face");
  }, [selectedShape]);

  const isCube = selectedShape === "cube";
  const isTriangularPyramid = selectedShape === "triangular-pyramid";

  function resetAppearance() {
    setAppearance(createDefaultAppearance(selectedShape));
    setSelectedFaceId("name-face");
  }

  const finishSettings = {
    roughness:
      appearance.finish === "matte"
        ? 0.9
        : appearance.finish === "glossy"
          ? 0.18
          : 0.28,
    metalness:
      appearance.finish === "metallic"
        ? 0.85
        : appearance.finish === "glossy"
          ? 0.05
          : 0,
  };

  const shapeTitle = selectedShape
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <section className="cube-viewer">
      <div className="cube-heading">
        <div>
          <p className="eyebrow">YOUR 3D IDENTITY</p>
          <h2>{shapeTitle}</h2>
          <p className="cube-subheading">Rotate and pinch to explore.</p>
        </div>

        <button
          type="button"
          className="reset-button"
          onClick={() => setResetKey((value) => value + 1)}
        >
          Reset view ↺
        </button>
      </div>

      <div className="cube-canvas">
        <Canvas
          key={resetKey}
          shadows
          camera={{
            position: isCube ? [0, 0, 5] : [3.5, 2.5, 6],
            fov: 38,
          }}
          dpr={[1, 2]}
        >
          <color attach="background" args={["#F5F0E9"]} />

          <Suspense fallback={null}>
            {isCube ? (
              <CubeScene
                cubeRef={shapeRef}
                cubeName={cubeName}
                qrCodes={qrCodes}
                assignments={assignments}
                appearance={appearance}
                finishSettings={finishSettings}
                selectedFaceId={selectedFaceId}
                onFaceSelect={setSelectedFaceId}
              />
            ) : isTriangularPyramid ? (
              <TriangularPyramidScene
                cubeRef={shapeRef}
                cubeName={cubeName}
                qrCodes={qrCodes}
                assignments={assignments}
                appearance={appearance}
                selectedFaceId={selectedFaceId}
                onFaceSelect={setSelectedFaceId}
              />
            ) : (
              <PolyhedronScene
                cubeRef={shapeRef}
                selectedShape={selectedShape}
                cubeName={cubeName}
                qrCodes={qrCodes}
                assignments={assignments}
                appearance={appearance}
                selectedFaceId={selectedFaceId}
                onFaceSelect={setSelectedFaceId}
              />
            )}
          </Suspense>
        </Canvas>
      </div>

      <div className="cube-instructions">
        <p><strong>Explore your shape</strong></p>
        <p>Drag to rotate · Click a face to bring it forward</p>
        <p>Scroll or pinch to zoom · Reset to original view</p>
      </div>

      <AppearanceControls
        selectedShape={selectedShape}
        appearance={appearance}
        selectedFaceId={selectedFaceId}
        onSelectedFaceChange={setSelectedFaceId}
        onAppearanceChange={setAppearance}
        onReset={resetAppearance}
      />

      <DownloadOptions
        modelRef={shapeRef}
        modelName={cubeName || "triqr-identity"}
        shapeName={shapeTitle}
      />
    </section>
  );
}
