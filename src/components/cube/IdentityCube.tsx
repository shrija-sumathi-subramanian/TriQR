
"use client";

import { useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Group } from "three";

import CubeScene from "./CubeScene";
import TriangularPyramidScene from "./TriangularPyramidScene";

import type { GeneratedQR, FaceAssignments } from "@/lib/qr-types";
import type { ShapeId } from "@/lib/shape-config";

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
  const shapeRef = useRef<Group>(null);

  function resetView() {
    if (shapeRef.current) {
      shapeRef.current.rotation.set(0, 0, 0);
    }
  }

  const isCube = selectedShape === "cube";
  const isTriangularPyramid =
    selectedShape === "triangular-pyramid";

  return (
    <section className="cube-viewer">
      <div className="cube-heading">
        <div>
          <p className="eyebrow">YOUR 3D IDENTITY</p>
          <h2>
            Explore your {selectedShape.replaceAll("-", " ")}
          </h2>
        </div>

        <button
          type="button"
          className="reset-button"
          onClick={resetView}
        >
          Reset view ↺
        </button>
      </div>

      {isCube || isTriangularPyramid ? (
        <>
          <div className="cube-canvas">
            <Canvas
              camera={{
                position: isTriangularPyramid
                  ? [3, 2, 5]
                  : [0, 0, 5],
                fov: 42,
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
                  />
                ) : (
                  <TriangularPyramidScene
                    cubeRef={shapeRef}
                    cubeName={cubeName}
                    qrCodes={qrCodes}
                    assignments={assignments}
                  />
                )}
              </Suspense>
            </Canvas>
          </div>

          <p className="cube-instructions">
            Drag to rotate · Pinch to zoom · Reset to return
          </p>
        </>
      ) : (
        <div className="shape-preview-notice">
          <h3>{selectedShape.replaceAll("-", " ")}</h3>
          <p>
            Interactive 3D geometry for this shape will
            be added in the next checkpoint.
          </p>
        </div>
      )}
    </section>
  );
}
