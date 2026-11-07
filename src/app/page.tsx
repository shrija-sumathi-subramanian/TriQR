
"use client";

import { useState } from "react";

import ShapeSelector from "@/components/ShapeSelector";
import ProfileForm from "@/components/profile/ProfileForm";
import FaceAssignment from "@/components/FaceAssignment";
import IdentityCube from "@/components/cube/IdentityCube";

import {
  getQrCapacity,
  type ShapeId,
} from "@/lib/shape-config";

import type {
  FaceAssignments,
  GeneratedQR,
} from "@/lib/qr-types";

export default function Home() {
  const [selectedShape, setSelectedShape] =
    useState<ShapeId>("cube");

  const [cubeName, setCubeName] = useState("Your Identity");

  const [qrCodes, setQrCodes] = useState<GeneratedQR[]>([]);

  const [assignments, setAssignments] =
    useState<FaceAssignments>({});

  const capacity = getQrCapacity(selectedShape);

  function handleShapeChange(shape: ShapeId) {
    setSelectedShape(shape);
    setAssignments({});
  }

  function handleQrCodesChange(codes: GeneratedQR[]) {
    setQrCodes(codes);
    setAssignments({});
  }

  function handleGenerated(
    name: string,
    codes: GeneratedQR[]
  ) {
    setCubeName(name);
    handleQrCodesChange(codes);
  }

  return (
    <main className="page-container">
      <section className="hero" id="shapes">
        <p className="hero-note">
          YOUR LINKS. YOUR SHAPE. YOUR IDENTITY.
        </p>

        <h1>Give your digital identity a new dimension.</h1>

        <p>
          Turn your important links into an interactive 3D QR identity.
        </p>
      </section>

      <section className="builder-section">
        <h2>01. Choose your shape</h2>

        <ShapeSelector
          selectedShape={selectedShape}
          onShapeChange={handleShapeChange}
        />
      </section>

      <section className="builder-section">
        <h2>02. Build your identity</h2>

        <ProfileForm
          capacity={capacity}
          onGenerated={handleGenerated}
          onQrCodesChange={handleQrCodesChange}
        />
      </section>

      {qrCodes.length > 0 && (
        <>
          <section className="builder-section">
            <h2>03. Assign your QR codes</h2>

            <FaceAssignment
              selectedShape={selectedShape}
              qrCodes={qrCodes}
              assignments={assignments}
              onAssignmentsChange={setAssignments}
            />
          </section>

          <section className="builder-section">
            <h2>04. Preview your 3D identity</h2>

            <IdentityCube
              cubeName={cubeName}
              selectedShape={selectedShape}
              qrCodes={qrCodes}
              assignments={assignments}
            />
          </section>
        </>
      )}
    </main>
  );
}
