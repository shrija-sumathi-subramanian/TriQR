"use client";

import { RefObject } from "react";
import { Group, DoubleSide } from "three";
import { OrbitControls, Text, useTexture } from "@react-three/drei";

import type { GeneratedQR, FaceAssignments } from "@/lib/qr-types";

type CubeSceneProps = {
  cubeRef: RefObject<Group | null>;
  cubeName: string;
  qrCodes: GeneratedQR[];
  assignments: FaceAssignments;
};

type FaceProps = {
  position: [number, number, number];
  rotation: [number, number, number];
  qr?: GeneratedQR;
};

function QRFace({ qr }: { qr: GeneratedQR }) {
  const texture = useTexture(qr.qrCode);

  return (
    <group>
      <Text
        position={[0, 0.77, 0.025]}
        fontSize={0.17}
        color="#2B2118"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.9}
      >
        {qr.displayName || " "}
      </Text>

      <mesh position={[0, -0.12, 0.025]}>
        <planeGeometry args={[1.35, 1.35]} />
        <meshBasicMaterial
          map={texture}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function CubeFace({ position, rotation, qr }: FaceProps) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[2.35, 2.35]} />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.8}
          side={DoubleSide}
        />
      </mesh>

      {qr ? (
        <QRFace qr={qr} />
      ) : (
        <Text
          position={[0, 0, 0.025]}
          fontSize={0.16}
          color="#82776D"
          anchorX="center"
          anchorY="middle"
        >
          Empty face
        </Text>
      )}
    </group>
  );
}

export default function CubeScene({
  cubeRef,
  cubeName,
  qrCodes,
  assignments,
}: CubeSceneProps) {
  function getQr(faceId: string) {
    const qrId = assignments[faceId];

    return qrCodes.find((qr) => qr.id === qrId);
  }

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[4, 5, 6]} intensity={2} />

      <group ref={cubeRef}>
        {/* Front face: cube name only */}
        <group position={[0, 0, 1.21]}>
          <mesh>
            <planeGeometry args={[2.35, 2.35]} />
            <meshStandardMaterial
              color="#E39B67"
              roughness={0.8}
              side={DoubleSide}
            />
          </mesh>

          <Text
            position={[0, 0, 0.025]}
            fontSize={0.3}
            color="#2B2118"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.9}
          >
            {cubeName || "Your Identity"}
          </Text>
        </group>

        {/* Back */}
        <CubeFace
          position={[0, 0, -1.21]}
          rotation={[0, Math.PI, 0]}
          qr={getQr("face-2")}
        />

        {/* Right */}
        <CubeFace
          position={[1.21, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          qr={getQr("face-3")}
        />

        {/* Left */}
        <CubeFace
          position={[-1.21, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          qr={getQr("face-4")}
        />

        {/* Top */}
        <CubeFace
          position={[0, 1.21, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          qr={getQr("face-5")}
        />

        {/* Bottom */}
        <CubeFace
          position={[0, -1.21, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          qr={getQr("face-6")}
        />
      </group>

      <OrbitControls
        enableRotate
        enableZoom
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI - 0.2}
      />
    </>
  );
}