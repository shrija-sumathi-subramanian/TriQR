"use client";

import { DoubleSide, Euler, Group, Quaternion } from "three";
import type { RefObject } from "react";
import useFaceCameraRotation from "./useFaceCameraRotation";

import {
  OrbitControls,
  RoundedBox,
  Text,
  useTexture,
} from "@react-three/drei";

import type { GeneratedQR, FaceAssignments } from "@/lib/qr-types";
import type { AppearanceSettings } from "@/lib/appearance-types";

type CubeSceneProps = {
  cubeRef: RefObject<Group | null>;
  cubeName: string;
  qrCodes: GeneratedQR[];
  assignments: FaceAssignments;
  appearance: AppearanceSettings;
  finishSettings: {
    roughness: number;
    metalness: number;
  };
  selectedFaceId: string;
  onFaceSelect?: (faceId: string) => void;
};

type FaceProps = {
  faceId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  qr?: GeneratedQR;
  appearance: AppearanceSettings;
  selectedFaceId: string;
  onSelect: (faceId: string, faceRotation: Quaternion) => void;
};

function QRFace({
  qr,
  appearance,
  faceId,
}: {
  qr: GeneratedQR;
  appearance: AppearanceSettings;
  faceId?: string;
}) {
  const texture = useTexture(qr.qrCode);

  return (
    <group>
      <Text
        position={[0, 0.62, 0.025]}
        fontSize={appearance.fontSize}
        color={appearance.fontColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.9}
        textAlign="center"
        fontWeight={
          appearance.font === "bold-display" ? "bold" : "normal"
        }
      >
        {qr.displayName || " "}
      </Text>

      <mesh
        name={faceId ? `TriQR_QR_${faceId}` : "TriQR_QR"}
        position={[0, -0.12, 0.025]}
      >
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial
          map={texture}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function CubeFace({
  faceId,
  position,
  rotation,
  qr,
  appearance,
  selectedFaceId,
  onSelect,
}: FaceProps) {
  const quat = new Quaternion().setFromEuler(new Euler(...rotation));

  return (
    <group
      name={`TriQR_Face_${faceId}`}
      userData={{
        triqrFaceId: faceId,
        triqrRotation: [quat.x, quat.y, quat.z, quat.w],
        triqrIsNameFace: false,
      }}
      position={position}
      rotation={rotation}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(faceId, quat);
      }}
    >
      <mesh name={`TriQR_FaceSurface_${faceId}`}>
        <planeGeometry args={[2.12, 2.12]} />

        <meshPhysicalMaterial
          color={appearance.color}
          roughness={
            appearance.finish === "matte"
              ? 0.9
              : appearance.finish === "glossy"
                ? 0.18
                : 0.28
          }
          metalness={
            appearance.finish === "metallic"
              ? 0.85
              : appearance.finish === "glossy"
                ? 0.05
                : 0
          }
          side={DoubleSide}
        />
      </mesh>

      {qr ? (
        <QRFace qr={qr} appearance={appearance} faceId={faceId} />
      ) : (
        <Text
          position={[0, 0, 0.025]}
          fontSize={appearance.fontSize}
          color={appearance.fontColor}
          anchorX="center"
          anchorY="middle"
          maxWidth={1.8}
          textAlign="center"
          fontWeight={
            appearance.font === "bold-display" ? "bold" : "normal"
          }
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
  appearance,
  finishSettings,
  selectedFaceId,
  onFaceSelect,
}: CubeSceneProps) {
  const { rootRef, rotateFace } = useFaceCameraRotation(cubeRef);

  function handleFaceSelect(faceId: string, faceRotation: Quaternion) {
    onFaceSelect?.(faceId);
    rotateFace(faceRotation);
  }

  function getQr(faceId: string) {
    const qrId = assignments[faceId];
    return qrCodes.find((qr) => qr.id === qrId);
  }


  return (
    <>
      <ambientLight intensity={1.2} />

      <directionalLight
        position={[4, 5, 6]}
        intensity={0.9}
      />

      <group ref={rootRef}>
        {/* Rounded solid cube body */}
        <RoundedBox
          name="TriQR_Body"
          args={[2.4, 2.4, 2.4]}
          radius={0.14}
          smoothness={8}
        >
          <meshPhysicalMaterial
            color={appearance.color}
            roughness={finishSettings.roughness}
            metalness={finishSettings.metalness}
            clearcoat={appearance.finish === "glossy" ? 0.8 : 0}
            clearcoatRoughness={0.15}
          />
        </RoundedBox>

        {/* Reserved name face */}
        <group
          name="TriQR_Face_name-face"
          userData={{
            triqrFaceId: "name-face",
            triqrRotation: [0, 0, 0, 1],
            triqrIsNameFace: true,
          }}
          position={[0, 0, 1.205]}
          onClick={(event) => {
            event.stopPropagation();
            handleFaceSelect("name-face", new Quaternion());
          }}
        >
          <mesh name="TriQR_FaceSurface_name-face">
            <planeGeometry args={[2.12, 2.12]} />
            <meshPhysicalMaterial
              color={appearance.color}
              roughness={finishSettings.roughness}
              metalness={finishSettings.metalness}
              side={DoubleSide}
            />
          </mesh>

          <Text
            position={[0, 0, 0.025]}
            fontSize={appearance.fontSize}
            color={appearance.fontColor}
            anchorX="center"
            anchorY="middle"
            maxWidth={1.9}
            textAlign="center"
            fontWeight={
              appearance.font === "bold-display" ? "bold" : "normal"
            }
          >
            {cubeName || "Your Identity"}
          </Text>
        </group>

        <CubeFace
          faceId="face-2"
          position={[0, 0, -1.205]}
          rotation={[0, Math.PI, 0]}
          qr={getQr("face-2")}
          appearance={appearance}
          selectedFaceId={selectedFaceId}
          onSelect={handleFaceSelect}
        />

        <CubeFace
          faceId="face-3"
          position={[1.205, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          qr={getQr("face-3")}
          appearance={appearance}
          selectedFaceId={selectedFaceId}
          onSelect={handleFaceSelect}
        />

        <CubeFace
          faceId="face-4"
          position={[-1.205, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          qr={getQr("face-4")}
          appearance={appearance}
          selectedFaceId={selectedFaceId}
          onSelect={handleFaceSelect}
        />

        <CubeFace
          faceId="face-5"
          position={[0, 1.205, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          qr={getQr("face-5")}
          appearance={appearance}
          selectedFaceId={selectedFaceId}
          onSelect={handleFaceSelect}
        />

        <CubeFace
          faceId="face-6"
          position={[0, -1.205, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          qr={getQr("face-6")}
          appearance={appearance}
          selectedFaceId={selectedFaceId}
          onSelect={handleFaceSelect}
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