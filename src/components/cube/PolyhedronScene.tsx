"use client";

import { useEffect, useMemo } from "react";

import {
  BufferGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry,
  OctahedronGeometry,
  Float32BufferAttribute,
  Matrix4,
  Vector3,
  Quaternion,
  DoubleSide,
} from "three";

import {
  OrbitControls,
  Text,
  useTexture,
  Environment,
} from "@react-three/drei";

import type { GeneratedQR, FaceAssignments } from "@/lib/qr-types";
import type { AppearanceSettings } from "@/lib/appearance-types";
import type { ShapeId } from "@/lib/shape-config";
import type { RefObject } from "react";
import { Group } from "three";
import useFaceCameraRotation from "./useFaceCameraRotation";

type PolyhedronSceneProps = {
  cubeRef: RefObject<Group | null>;
  selectedShape: ShapeId;
  cubeName: string;
  qrCodes: GeneratedQR[];
  assignments: FaceAssignments;
  appearance: AppearanceSettings;
  selectedFaceId: string;
  onFaceSelect?: (faceId: string) => void;
};

type FaceData = {
  id: string;
  center: Vector3;
  normal: Vector3;
  rotation: Quaternion;
  width: number;
  height: number;
  geometry: BufferGeometry;
};

type FaceGroup = {
  normal: Vector3;
  planeDistance: number;
  vertices: Vector3[];
};

function getGeometry(shape: ShapeId): BufferGeometry {
  switch (shape) {
    case "octahedron":
      return new OctahedronGeometry(1.35, 0);

    case "dodecahedron":
      return new DodecahedronGeometry(1.35, 0);

    case "icosahedron":
      return new IcosahedronGeometry(1.35, 0);

    default:
      return new OctahedronGeometry(1.35, 0);
  }
}

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

function createFaceData(source: BufferGeometry): FaceData[] {
  const geometry = source.toNonIndexed();
  const position = geometry.getAttribute("position");

  const groups: FaceGroup[] = [];

  for (let i = 0; i < position.count; i += 3) {
    const a = new Vector3().fromBufferAttribute(position, i);
    const b = new Vector3().fromBufferAttribute(position, i + 1);
    const c = new Vector3().fromBufferAttribute(position, i + 2);

    const normal = b
      .clone()
      .sub(a)
      .cross(c.clone().sub(a))
      .normalize();

    const planeDistance = normal.dot(a);

    let group = groups.find(
      (item) =>
        item.normal.dot(normal) > 0.9999 &&
        Math.abs(item.planeDistance - planeDistance) < 0.0001
    );

    if (!group) {
      group = {
        normal,
        planeDistance,
        vertices: [],
      };

      groups.push(group);
    }

    group.vertices.push(a, b, c);
  }

  geometry.dispose();

  return groups.map((group, index) => {
    const uniqueVertices: Vector3[] = [];

    for (const vertex of group.vertices) {
      const exists = uniqueVertices.some(
        (item) => item.distanceTo(vertex) < 0.0001
      );

      if (!exists) uniqueVertices.push(vertex);
    }

    const center = uniqueVertices
      .reduce(
        (sum, vertex) => sum.add(vertex),
        new Vector3()
      )
      .divideScalar(uniqueVertices.length);

    const normal = group.normal.clone().normalize();

    let up = new Vector3(0, 1, 0);

    if (Math.abs(normal.dot(up)) > 0.95) {
      up = new Vector3(0, 0, 1);
    }

    const right = up.clone().cross(normal).normalize();
    const correctedUp = normal.clone().cross(right).normalize();

    const matrix = new Matrix4().makeBasis(
      right,
      correctedUp,
      normal
    );

    const rotation = new Quaternion().setFromRotationMatrix(matrix);

    uniqueVertices.sort((a, b) => {
      const aDirection = a.clone().sub(center);
      const bDirection = b.clone().sub(center);

      const angleA = Math.atan2(
        aDirection.dot(correctedUp),
        aDirection.dot(right)
      );

      const angleB = Math.atan2(
        bDirection.dot(correctedUp),
        bDirection.dot(right)
      );

      return angleA - angleB;
    });

    const localVertices = uniqueVertices.map((vertex) => {
      const direction = vertex.clone().sub(center);

      return {
        x: direction.dot(right),
        y: direction.dot(correctedUp),
      };
    });

    const minX = Math.min(...localVertices.map((v) => v.x));
    const maxX = Math.max(...localVertices.map((v) => v.x));

    const minY = Math.min(...localVertices.map((v) => v.y));
    const maxY = Math.max(...localVertices.map((v) => v.y));

    const width = maxX - minX;
    const height = maxY - minY;

    const insetVertices = uniqueVertices.map((vertex) =>
      vertex.clone().lerp(center, 0.008)
    );

    const positions: number[] = [];

    for (let i = 0; i < insetVertices.length; i++) {
      const next = (i + 1) % insetVertices.length;

      positions.push(...center.toArray());
      positions.push(...insetVertices[i].toArray());
      positions.push(...insetVertices[next].toArray());
    }

    const faceGeometry = new BufferGeometry();

    faceGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(positions, 3)
    );

    faceGeometry.computeVertexNormals();

    return {
      id: index === 0 ? "name-face" : `face-${index + 1}`,
      center,
      normal,
      rotation,
      width,
      height,
      geometry: faceGeometry,
    };
  });
}

function QRFaceContent({
  qr,
  face,
  appearance,
}: {
  qr: GeneratedQR;
  face: FaceData;
  appearance: AppearanceSettings;
}) {
  const texture = useTexture(qr.qrCode);

  const baseFontSize = appearance.fontSize * 0.35;

  const qrSize = Math.min(
    face.width * 0.42,
    face.height * 0.36
  );

  const labelSize = Math.min(
    baseFontSize,
    face.width * 0.095,
    face.height * 0.12
  );

  return (
    <group>
      <Text
        position={[0, face.height * 0.15, 0.025]}
        fontSize={labelSize}
        color={appearance.fontColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={face.width * 0.68}
        textAlign="center"
        fontWeight={
          appearance.font === "bold-display" ? "bold" : "normal"
        }
        overflowWrap="break-word"
      >
        {qr.displayName || " "}
      </Text>

      <mesh position={[0, -face.height * 0.20, 0.025]}>
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

function PolyhedronFace({
  face,
  qr,
  cubeName,
  appearance,
  finish,
  selectedFaceId,
  onFaceSelect,
}: {
  face: FaceData;
  qr?: GeneratedQR;
  cubeName: string;
  appearance: AppearanceSettings;
  finish: {
    roughness: number;
    metalness: number;
    clearcoat: number;
  };
  selectedFaceId: string;
  onFaceSelect?: (faceId: string, faceRotation: Quaternion) => void;
}) {
  const textSize = Math.min(
    appearance.fontSize * 0.35,
    face.width * 0.095,
    face.height * 0.12
  );

  return (
    <group>
      <mesh
        geometry={face.geometry}
        position={face.normal.clone().multiplyScalar(0.009)}
        onClick={(event) => {
          event.stopPropagation();
          onFaceSelect?.(face.id, face.rotation);
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
        position={face.center
          .clone()
          .add(face.normal.clone().multiplyScalar(0.018))}
        quaternion={face.rotation}
      >
        {face.id === "name-face" ? (
          <Text
            position={[0, 0, 0.025]}
            fontSize={textSize}
            color={appearance.fontColor}
            anchorX="center"
            anchorY="middle"
            maxWidth={face.width * 0.72}
            textAlign="center"
            fontWeight={
              appearance.font === "bold-display" ? "bold" : "normal"
            }
            overflowWrap="break-word"
          >
            {cubeName || "Your Identity"}
          </Text>
        ) : qr ? (
          <QRFaceContent
            qr={qr}
            face={face}
            appearance={appearance}
          />
        ) : (
          <Text
            position={[0, 0, 0.025]}
            fontSize={textSize}
            color={appearance.fontColor}
            anchorX="center"
            anchorY="middle"
            maxWidth={face.width * 0.68}
            textAlign="center"
          >
            Empty face
          </Text>
        )}
      </group>
    </group>
  );
}

export default function PolyhedronScene({
  cubeRef,
  selectedShape,
  cubeName,
  qrCodes,
  assignments,
  appearance,
  selectedFaceId,
  onFaceSelect,
}: PolyhedronSceneProps) {
  const { rootRef, rotateFace } = useFaceCameraRotation(cubeRef);

  function handleFaceSelect(faceId: string, faceRotation: Quaternion) {
    onFaceSelect?.(faceId);
    rotateFace(faceRotation);
  }

  const finish = getFinish(appearance.finish);

  const { bodyGeometry, faces } = useMemo(() => {
    const bodyGeometry = getGeometry(selectedShape);

    return {
      bodyGeometry,
      faces: createFaceData(bodyGeometry),
    };
  }, [selectedShape]);

  useEffect(() => {
    return () => {
      bodyGeometry.dispose();

      faces.forEach((face) => {
        face.geometry.dispose();
      });
    };
  }, [bodyGeometry, faces]);

  function getQr(faceId: string) {
    const qrId = assignments[faceId];

    return qrCodes.find((qr) => qr.id === qrId);
  }

  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight
        position={[4, 6, 5]}
        intensity={1.2}
      />

      <Environment preset="studio" />

      <group ref={rootRef}>
        <mesh geometry={bodyGeometry}>
          <meshPhysicalMaterial
            color={appearance.color}
            roughness={finish.roughness}
            metalness={finish.metalness}
            clearcoat={finish.clearcoat}
            clearcoatRoughness={0.15}
            side={DoubleSide}
          />
        </mesh>

        {faces.map((face) => (
          <PolyhedronFace
            key={face.id}
            face={face}
            qr={getQr(face.id)}
            cubeName={cubeName}
            appearance={appearance}
            finish={finish}
            selectedFaceId={selectedFaceId}
            onFaceSelect={handleFaceSelect}
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