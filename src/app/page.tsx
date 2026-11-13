"use client";

import { useState } from "react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ShapeSelector from "@/components/ShapeSelector";
import ProfileForm from "@/components/profile/ProfileForm";
import FaceAssignment from "@/components/FaceAssignment";
import IdentityCube from "@/components/cube/IdentityCube";

import {
  getQrCapacity,
  getQrFaces,
  type ShapeId,
} from "@/lib/shape-config";

import type {
  FaceAssignments,
  GeneratedQR,
} from "@/lib/qr-types";

export default function Home() {
  const [selectedShape, setSelectedShape] = useState<ShapeId>("cube");
  const [cubeName, setCubeName] = useState("Your Identity");
  const [qrCodes, setQrCodes] = useState<GeneratedQR[]>([]);
  const [assignments, setAssignments] = useState<FaceAssignments>({});

  const capacity = getQrCapacity(selectedShape);

  function handleShapeChange(shape: ShapeId) {
    setSelectedShape(shape);
    // When changing shapes, auto-assign existing QR codes up to the new shape's capacity
    if (qrCodes.length > 0) {
      const faces = getQrFaces(shape);
      const updated: FaceAssignments = {};
      qrCodes.slice(0, faces.length).forEach((qr, idx) => {
        if (faces[idx]) updated[faces[idx].id] = qr.id;
      });
      setAssignments(updated);
    } else {
      setAssignments({});
    }
  }

  function handleQrCodesChange(codes: GeneratedQR[]) {
    setQrCodes(codes);
    const faces = getQrFaces(selectedShape);
    const updated: FaceAssignments = {};
    codes.slice(0, faces.length).forEach((qr, idx) => {
      if (faces[idx]) updated[faces[idx].id] = qr.id;
    });
    setAssignments(updated);
  }

  function handleGenerated(name: string, codes: GeneratedQR[]) {
    setCubeName(name || "Your Identity");
    handleQrCodesChange(codes);
  }

  return (
    <>
      <Header />

      <main className="page-container">
        {/* Editorial Hero */}
        <section className="hero">
          <div className="hero-eyebrow-wrap">
            <span className="hero-eyebrow-badge">TRIQR STUDIO</span>
            <span className="hero-eyebrow-text">SPATIAL DIGITAL IDENTITY</span>
          </div>

          <h1>Give your digital identity a tangible new dimension.</h1>

          <p className="hero-lead">
            Turn your links, portfolio, and profiles into an interactive 3D model.
            Rotate, customize materials, and export ready for physical display or web integration.
          </p>

          <div className="hero-features">
            <div className="hero-feature-pill">
              <span className="feature-dot"></span>
              9 3D Geometries
            </div>
            <div className="hero-feature-pill">
              <span className="feature-dot"></span>
              Real-Time PBR Materials
            </div>
            <div className="hero-feature-pill">
              <span className="feature-dot"></span>
              Instant Scannable QR Codes
            </div>
            <div className="hero-feature-pill">
              <span className="feature-dot"></span>
              Zero-Dependency GLB & HTML Export
            </div>
          </div>
        </section>

        {/* Section 01: Profile and Links */}
        <section className="builder-section">
          <div className="section-header-block">
            <span className="section-label">01. IDENTITY & LINKS</span>
            <h2>Add your name and links</h2>
            <p className="section-description">
              Name your model and add your links. TriQR detects each platform and creates scannable QR codes.
            </p>
          </div>

          <ProfileForm
            capacity={capacity}
            initialName={cubeName === "Your Identity" ? "" : cubeName}
            onNameChange={(val) => setCubeName(val || "Your Identity")}
            onGenerated={handleGenerated}
            onQrCodesChange={handleQrCodesChange}
          />
        </section>

        {/* Section 02: Polyhedral Geometry */}
        <section className="builder-section" id="shapes">
          <div className="section-header-block">
            <span className="section-label">02. 3D SHAPE</span>
            <h2>Choose your shape</h2>
            <p className="section-description">
              Select from 9 mathematical polyhedra based on how many link slots you need.
            </p>
          </div>

          <ShapeSelector
            selectedShape={selectedShape}
            onShapeChange={handleShapeChange}
          />
        </section>

        {/* Section 03: Face Assignment (visible when QR codes exist) */}
        {qrCodes.length > 0 && (
          <section className="builder-section" id="assignment">
            <div className="section-header-block">
              <span className="section-label">03. FACE LAYOUT</span>
              <h2>Arrange your faces</h2>
              <p className="section-description">
                Your links are placed on faces automatically. Reorder them or leave faces empty anytime.
              </p>
            </div>

            <FaceAssignment
              selectedShape={selectedShape}
              qrCodes={qrCodes}
              assignments={assignments}
              onAssignmentsChange={setAssignments}
            />
          </section>
        )}

        {/* Section 04: 3D Interactive Studio & Appearance (Always visible!) */}
        <section className="builder-section">
          <div className="section-header-block">
            <span className="section-label">04. 3D STUDIO</span>
            <h2>Interactive 3D preview</h2>
            <p className="section-description">
              Drag to rotate, click faces to inspect, and customize colors and finishes in real time.
            </p>
          </div>

          <IdentityCube
            cubeName={cubeName}
            selectedShape={selectedShape}
            qrCodes={qrCodes}
            assignments={assignments}
          />
        </section>
      </main>

      <Footer />
    </>
  );
}
