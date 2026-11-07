
"use client";

import { useMemo } from "react";
import type { RefObject } from "react";
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Quaternion,
  Vector3,
} from "three";

import { OrbitControls, Text, useTexture } from "@react-three/drei";

import type { GeneratedQR, FaceAssignments } from "@/lib/qr-types";

type Point = [number, number, number];

type SceneProps = {
  cubeRef: RefObject<Group | null>;
  cubeName: string;
  qrCodes: GeneratedQR[];
  assignments: FaceAssignments;
};

type TriangleFaceProps = {
  points: [Point, Point, Point];
  qr?: GeneratedQR;
  isNameFace?: boolean;
  cubeName?: string;
};

function QRContent({ qr }: { qr: GeneratedQR }) {
  const texture = useTexture(qr.qrCode);

  return (
    <group>
      <Text
        position={[0, 0.48, 0.025]}
        fontSize={0.13}
        color="#2B2118"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.2}
      >
        {qr.displayName || " "}
      </Text>

      <mesh position={[0, -0.08, 0.025]}>
        <planeGeometry args={[0.72, 0.72]} />
        <meshBasicMaterial
          map={texture}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function TriangleFace({
  points,
  qr,
  isNameFace,
  cubeName,
}: TriangleFaceProps) {
  const { geometry, center, rotation } = useMemo(() => {
    const [a, b, c] = points.map(
      (point) => new Vector3(...point)
    );

    const geometry = new BufferGeometry();

    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [
          ...a.toArray(),
          ...b.toArray(),
          ...c.toArray(),
        ],
        3
      )
    );

    geometry.computeVertexNormals();

    const center = a.clone().add(b).add(c).divideScalar(3);

    const normal = b
      .clone()
      .sub(a)
      .cross(c.clone().sub(a))
      .normalize();

    const rotation = new Quaternion().setFromUnitVectors(
      new Vector3(0, 0, 1),
      normal
    );

    return { geometry, center, rotation };
  }, [points]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={isNameFace ? "#E39B67" : "#FFFFFF"}
          roughness={0.8}
          side={DoubleSide}
        />
      </mesh>

      <group
        position={center}
        quaternion={rotation}
      >
        {isNameFace ? (
          <Text
            position={[0, 0, 0.025]}
            fontSize={0.19}
            color="#2B2118"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.2}
          >
            {cubeName || "Your Identity"}
          </Text>
        ) : qr ? (
          <QRContent qr={qr} />
        ) : (
          <Text
            position={[0, 0, 0.025]}
            fontSize={0.12}
            color="#82776D"
            anchorX="center"
            anchorY="middle"
          >
            Empty face
          </Text>
        )}
      </group>
    </group>
  );
}

export default function TriangularPyramidScene({
  cubeRef,
  cubeName,
  qrCodes,
  assignments,
}: SceneProps) {
  const vertices: Point[] = [
    [0, 1.25, 0],
    [-1.1, -0.65, 1],
    [1.1, -0.65, 1],
    [0, -0.65, -1.25],
  ];

  function getQr(faceId: string) {
    const qrId = assignments[faceId];
    return qrCodes.find((qr) => qr.id === qrId);
  }

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[4, 5, 6]} intensity={2} />

      <group ref={cubeRef}>
        {/* Front face: model name only */}
        <TriangleFace
          points={[vertices[0], vertices[1], vertices[2]]}
          isNameFace
          cubeName={cubeName}
        />

        {/* QR face 2 */}
        <TriangleFace
          points={[vertices[0], vertices[2], vertices[3]]}
          qr={getQr("face-2")}
        />

        {/* QR face 3 */}
        <TriangleFace
          points={[vertices[0], vertices[3], vertices[1]]}
          qr={getQr("face-3")}
        />

        {/* QR face 4 */}
        <TriangleFace
          points={[vertices[1], vertices[3], vertices[2]]}
          qr={getQr("face-4")}
        />
      </group>

      <OrbitControls
        enableRotate
        enableZoom
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}
