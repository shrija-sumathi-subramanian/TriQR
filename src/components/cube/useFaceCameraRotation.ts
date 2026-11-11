
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Group,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";
import type { RefObject } from "react";

export default function useFaceCameraRotation(
  externalRef?: RefObject<Group | null>
) {
  const internalRef = useRef<Group | null>(null);
  const rootRef = externalRef ?? internalRef;
  const targetRotation = useRef<Quaternion | null>(null);

  const { camera } = useThree();

  useEffect(() => {
    const root = rootRef.current;
    if (root && !root.userData.initialQuaternion) {
      root.userData.initialQuaternion = root.quaternion.clone();
    }
  }, [rootRef]);

  const rotateFace = useCallback(
    (localFaceRotation: Quaternion) => {
      const root = rootRef.current;
      if (!root) return;

      // Direction from the model toward the camera.
      const cameraPosition = new Vector3();
      const rootPosition = new Vector3();

      camera.getWorldPosition(cameraPosition);
      root.getWorldPosition(rootPosition);

      const faceNormal = cameraPosition
        .sub(rootPosition)
        .normalize();

      // Keep the face upright while pointing it toward the camera.
      const worldUp = new Vector3(0, 1, 0);
      const projectedUp = worldUp
        .clone()
        .addScaledVector(faceNormal, -worldUp.dot(faceNormal));

      if (projectedUp.lengthSq() < 0.001) {
        projectedUp.set(0, 0, 1);
        projectedUp.addScaledVector(
          faceNormal,
          -projectedUp.dot(faceNormal)
        );
      }

      projectedUp.normalize();

      const right = projectedUp
        .clone()
        .cross(faceNormal)
        .normalize();

      const correctedUp = faceNormal
        .clone()
        .cross(right)
        .normalize();

      const faceMatrix = new Matrix4().makeBasis(
        right,
        correctedUp,
        faceNormal
      );

      const desiredFaceWorld = new Quaternion()
        .setFromRotationMatrix(faceMatrix);

      // Calculate the root rotation needed to put this face
      // directly toward the camera.
      const desiredRootWorld = desiredFaceWorld.multiply(
        localFaceRotation.clone().invert()
      );

      // Convert world rotation to the root's parent space.
      if (root.parent) {
        const parentWorldRotation = new Quaternion();
        root.parent.getWorldQuaternion(parentWorldRotation);

        desiredRootWorld.premultiply(
          parentWorldRotation.invert()
        );
      }

      targetRotation.current = desiredRootWorld;
    },
    [camera, rootRef]
  );

  useFrame((_, delta) => {
    const root = rootRef.current;
    const target = targetRotation.current;

    if (!root || !target) return;

    const smoothness = 1 - Math.exp(-7 * delta);

    root.quaternion.slerp(target, smoothness);

    if (root.quaternion.angleTo(target) < 0.001) {
      root.quaternion.copy(target);
      targetRotation.current = null;
    }
  });

  return { rootRef, rotateFace };
}
