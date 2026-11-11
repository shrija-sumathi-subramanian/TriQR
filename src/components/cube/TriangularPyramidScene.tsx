"use client";

import { useMemo } from "react";
import type { RefObject } from "react";

import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";

import {
  OrbitControls,
  Text,
  useTexture,
  Environment,
} from "@react-three/drei";

import type { GeneratedQR, FaceAssignments } from "@/lib/qr-types";
import type { AppearanceSettings } from "@/lib/appearance-types";
import useFaceCameraRotation from "./useFaceCameraRotation";

type Point = [number, number, number];

type SceneProps = {
  cubeRef: RefObject<Group | null>;
  cubeName: string;
  qrCodes: GeneratedQR[];
  assignments: FaceAssignments;
  appearance: AppearanceSettings;
  selectedFaceId: string;
  onFaceSelect?: (faceId: string) => void;
};

type TriangleFaceProps = {
  points: [Point, Point, Point];
  faceId: string;
  qr?: GeneratedQR;
  isNameFace?: boolean;
  cubeName?: string;
  appearance: AppearanceSettings;
  selectedFaceId: string;
  onSelect: (faceId: string, faceRotation: Quaternion) => void;
};

function getFinish(finish: AppearanceSettings["finish"]) {
  switch (finish) {
    case "glossy":
      return {
        roughness: 0.18,
        metalness: 0.05,
        clearcoat: 0.8,
      };

    case "metallic":
      return {
        roughness: 0.28,
        metalness: 0.85,
        clearcoat: 0,
      };

    default:
      return {
        roughness: 0.9,
        metalness: 0,
        clearcoat: 0,
      };
  }
}

function QRContent({
  qr,
  appearance,
  faceWidth,
  faceHeight,
  faceId,
}: {
  qr: GeneratedQR;
  appearance: AppearanceSettings;
  faceWidth: number;
  faceHeight: number;
  faceId?: string;
}) {
  const texture = useTexture(qr.qrCode);
  const faceUnit = Math.min(faceWidth, faceHeight);
  const textSize = Math.min(appearance.fontSize * 0.28, faceUnit * 0.075);
  const qrSize = faceUnit * 0.27;

  return (
    <group>
      <Text
        position={[0, faceHeight * 0.19, 0.035]}
        fontSize={textSize}
        color={appearance.fontColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={faceWidth * 0.46}
        textAlign="center"
        fontWeight={
          appearance.font === "bold-display" ? "bold" : "normal"
        }
        overflowWrap="break-word"
      >
        {qr.displayName || " "}
      </Text>

      <mesh
        name={faceId ? `TriQR_QR_${faceId}` : "TriQR_QR"}
        position={[0, -faceHeight * 0.105, 0.035]}
      >
        <planeGeometry args={[qrSize, qrSize]} />
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
  faceId,
  qr,
  isNameFace,
  cubeName,
  appearance,
  selectedFaceId,
  onSelect,
}: TriangleFaceProps) {
  const { geometry, center, rotation, normal, width, height } = useMemo(() => {
    const [a, b, c] = points.map(
      (point) => new Vector3(...point)
    );

    const center = a.clone().add(b).add(c).divideScalar(3);

    const insetPoints = [a, b, c].map((point) =>
      point.clone().lerp(center, 0.035)
    );

    const geometry = new BufferGeometry();

    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        insetPoints.flatMap((point) => point.toArray()),
        3
      )
    );

    geometry.setIndex([0, 1, 2]);
    geometry.computeVertexNormals();

    const normal = b
      .clone()
      .sub(a)
      .cross(c.clone().sub(a))
      .normalize();

    const up = new Vector3(0, 1, 0);

    const projectedUp = up
      .clone()
      .addScaledVector(normal, -up.dot(normal))
      .normalize();

    if (projectedUp.lengthSq() < 0.001) {
      projectedUp.set(0, 0, 1);
    }

    const right = projectedUp.clone().cross(normal).normalize();
    const correctedUp = normal.clone().cross(right).normalize();

    const matrix = new Matrix4().makeBasis(
      right,
      correctedUp,
      normal
    );

    const rotation = new Quaternion().setFromRotationMatrix(matrix);

    const localPoints = insetPoints.map((point) => {
      const relative = point.clone().sub(center);
      return {
        x: relative.dot(right),
        y: relative.dot(correctedUp),
      };
    });
    const width = Math.max(...localPoints.map((point) => point.x)) -
      Math.min(...localPoints.map((point) => point.x));
    const height = Math.max(...localPoints.map((point) => point.y)) -
      Math.min(...localPoints.map((point) => point.y));

    return { geometry, center, rotation, normal, width, height };
  }, [points]);

  const finish = getFinish(appearance.finish);
  const faceUnit = Math.min(width, height);
  const textSize = Math.min(appearance.fontSize * 0.28, faceUnit * 0.075);

  return (
    <group
      name={`TriQR_Face_${faceId}`}
      userData={{
        triqrFaceId: faceId,
        triqrNormal: [normal.x, normal.y, normal.z],
        triqrRotation: [rotation.x, rotation.y, rotation.z, rotation.w],
        triqrIsNameFace: isNameFace,
      }}
    >
      <mesh
        name={`TriQR_FaceSurface_${faceId}`}
        geometry={geometry}
        position={normal.clone().multiplyScalar(0.008)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(faceId, rotation);
        }}
      >
        <meshPhysicalMaterial
          color={appearance.color}
          roughness={finish.roughness}
          metalness={finish.metalness}
          clearcoat={finish.clearcoat}
          clearcoatRoughness={0.15}
          side={DoubleSide}
        />
      </mesh>

      <group
        position={center.clone().add(normal.clone().multiplyScalar(0.012))}
        quaternion={rotation}
      >
        {isNameFace ? (
          <Text
            position={[0, 0, 0.035]}
            fontSize={textSize}
            color={appearance.fontColor}
            anchorX="center"
            anchorY="middle"
            maxWidth={width * 0.46}
            textAlign="center"
            overflowWrap="break-word"
            fontWeight={
              appearance.font === "bold-display" ? "bold" : "normal"
            }
          >
            {cubeName || "Your Identity"}
          </Text>
        ) : qr ? (
          <QRContent
            qr={qr}
            appearance={appearance}
            faceWidth={width}
            faceHeight={height}
            faceId={faceId}
          />
        ) : (
          <Text
            position={[0, 0, 0.035]}
            fontSize={textSize}
            color={appearance.fontColor}
            anchorX="center"
            anchorY="middle"
            maxWidth={width * 0.42}
            textAlign="center"
            overflowWrap="break-word"
            fontWeight={
              appearance.font === "bold-display" ? "bold" : "normal"
            }
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
  appearance,
  selectedFaceId,
  onFaceSelect,
}: SceneProps) {
  const { rotateFace } = useFaceCameraRotation(cubeRef);

  function handleFaceSelect(faceId: string, faceRotation: Quaternion) {
    onFaceSelect?.(faceId);
    rotateFace(faceRotation);
  }

  const vertices: Point[] = [
    [0, 1.25, 0],
    [-1.1, -0.65, 1],
    [1.1, -0.65, 1],
    [0, -0.65, -1.25],
  ];

  const solidGeometry = useMemo(() => {
    const geometry = new BufferGeometry();

    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(vertices.flat(), 3)
    );

    geometry.setIndex([
      0, 1, 2,
      0, 2, 3,
      0, 3, 1,
      1, 3, 2,
    ]);

    geometry.computeVertexNormals();

    return geometry;
  }, []);

  function getQr(faceId: string) {
    const qrId = assignments[faceId];
    return qrCodes.find((qr) => qr.id === qrId);
  }

  const faces: {
    points: [Point, Point, Point];
    faceId: string;
    qr?: GeneratedQR;
    isNameFace?: boolean;
  }[] = [
    {
      points: [vertices[0], vertices[1], vertices[2]],
      faceId: "name-face",
      isNameFace: true,
    },
    {
      points: [vertices[0], vertices[2], vertices[3]],
      faceId: "face-2",
      qr: getQr("face-2"),
    },
    {
      points: [vertices[0], vertices[3], vertices[1]],
      faceId: "face-3",
      qr: getQr("face-3"),
    },
    {
      points: [vertices[1], vertices[3], vertices[2]],
      faceId: "face-4",
      qr: getQr("face-4"),
    },
  ];

  const finish = getFinish(appearance.finish);

  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight
        position={[4, 6, 5]}
        intensity={1.2}
      />

      <Environment preset="studio" />

      <group ref={cubeRef}>
        {/* Solid tetrahedron body */}
        <mesh name="TriQR_Body" geometry={solidGeometry}>
          <meshPhysicalMaterial
            color={appearance.color}
            roughness={finish.roughness}
            metalness={finish.metalness}
            clearcoat={finish.clearcoat}
            clearcoatRoughness={0.15}
            side={DoubleSide}
          />
        </mesh>

        {/* Four selectable faces */}
        {faces.map((face) => (
          <TriangleFace
            key={face.faceId}
            points={face.points}
            faceId={face.faceId}
            qr={face.qr}
            isNameFace={face.isNameFace}
            cubeName={cubeName}
            appearance={appearance}
            selectedFaceId={selectedFaceId}
            onSelect={handleFaceSelect}
          />
        ))}
      </group>

      <OrbitControls
        enableRotate
        enableZoom
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.8}
        zoomSpeed={0.8}
        minDistance={3.5}
        maxDistance={9}
      />
    </>
  );
}