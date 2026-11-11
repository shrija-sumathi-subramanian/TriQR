"use client";

import { useState } from "react";
import type { RefObject } from "react";
import type { Group } from "three";
import {
  prepareModelForExport,
  exportGroupToGlb,
  generateStandaloneViewerHtml,
  generateDeveloperZip,
} from "@/lib/export-3d";

type DownloadOptionsProps = {
  modelRef: RefObject<Group | null>;
  modelName: string;
  shapeName: string;
};

function safeFileName(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "triqr-identity"
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function DownloadOptions({
  modelRef,
  modelName,
  shapeName,
}: DownloadOptionsProps) {
  const [busy, setBusy] = useState<"glb" | "html" | "zip" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);

  async function handleDownload(kind: "glb" | "html" | "zip") {
    if (busy !== null) return;

    setBusy(kind);
    setStatusMessage("");
    setIsError(false);

    try {
      const source = modelRef.current;
      if (!source) {
        throw new Error(
          "The 3D preview model is still loading. Please wait a moment and try again."
        );
      }

      const fileName = safeFileName(modelName);

      // Step 1: Prepare model clone, convert Troika text, and preserve canonical orientation
      const exportRoot = await prepareModelForExport(source);

      // Step 2: Export to binary GLB ArrayBuffer
      const glbBuffer = await exportGroupToGlb(exportRoot);

      // Step 3: Handle requested download format
      if (kind === "glb") {
        const glbBlob = new Blob([glbBuffer], { type: "model/gltf-binary" });
        triggerDownload(glbBlob, `${fileName}.glb`);
        setStatusMessage(`Successfully downloaded ${fileName}.glb`);
      } else if (kind === "html") {
        const viewerHtml = generateStandaloneViewerHtml(
          glbBuffer,
          modelName || shapeName
        );
        const htmlBlob = new Blob([viewerHtml], {
          type: "text/html;charset=utf-8",
        });
        triggerDownload(htmlBlob, `${fileName}-viewer.html`);
        setStatusMessage(`Successfully downloaded ${fileName}-viewer.html`);
      } else {
        const zipBlob = await generateDeveloperZip(
          glbBuffer,
          modelName || "Your Identity",
          shapeName,
          fileName
        );
        triggerDownload(zipBlob, `${fileName}-developer-integration.zip`);
        setStatusMessage(
          `Successfully downloaded ${fileName}-developer-integration.zip`
        );
      }
    } catch (error) {
      console.error("TriQR export error:", error);
      setIsError(true);
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during export. Please try again."
      );
    } finally {
      setBusy(null);
    }
  }

  const buttonStyle: React.CSSProperties = {
    border: "1px solid #d8c9bb",
    borderRadius: 12,
    background: "#fffdf9",
    color: "#2b2118",
    padding: "13px 15px",
    textAlign: "left",
    cursor: busy !== null ? "not-allowed" : "pointer",
    opacity: busy !== null ? 0.7 : 1,
    minWidth: 0,
    transition: "border-color 0.2s, background 0.2s, transform 0.2s",
  };

  return (
    <section
      aria-label="Download and integrate your TriQR identity"
      style={{
        margin: "24px 0",
        padding: 20,
        border: "1px solid #e7ddd3",
        borderRadius: 18,
        background: "#fbf8f3",
      }}
    >
      <p
        style={{
          margin: "0 0 6px",
          color: "#9a6949",
          fontSize: 11,
          letterSpacing: 1.5,
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        Take your identity with you
      </p>

      <h3
        style={{
          margin: "0 0 16px",
          color: "#2b2118",
          fontSize: 20,
          fontWeight: 600,
        }}
      >
        Export and integrate TriQR
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 12,
        }}
      >
        {/* Option 1: GLB 3D Model */}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => handleDownload("glb")}
          style={buttonStyle}
        >
          <strong style={{ display: "block", marginBottom: 5 }}>
            3D Model · GLB
          </strong>
          <span
            style={{
              display: "block",
              color: "#75675d",
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            For Blender, 3D applications, and portable standard viewers
          </span>
          <span
            style={{
              display: "block",
              marginTop: 10,
              color: "#a56840",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {busy === "glb" ? "Preparing GLB…" : "Download .glb →"}
          </span>
        </button>

        {/* Option 2: Standalone Interactive HTML Viewer */}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => handleDownload("html")}
          style={buttonStyle}
        >
          <strong style={{ display: "block", marginBottom: 5 }}>
            Interactive Viewer · HTML
          </strong>
          <span
            style={{
              display: "block",
              color: "#75675d",
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            Standalone viewer with drag rotation, zoom, and upright click-to-front
          </span>
          <span
            style={{
              display: "block",
              marginTop: 10,
              color: "#a56840",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {busy === "html" ? "Preparing HTML…" : "Download .html →"}
          </span>
        </button>

        {/* Option 3: Developer Integration ZIP */}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => handleDownload("zip")}
          style={buttonStyle}
        >
          <strong style={{ display: "block", marginBottom: 5 }}>
            Developer Integration · ZIP
          </strong>
          <span
            style={{
              display: "block",
              color: "#75675d",
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            Web Component, React component, standalone viewer, GLB, and README
          </span>
          <span
            style={{
              display: "block",
              marginTop: 10,
              color: "#a56840",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {busy === "zip" ? "Packaging ZIP…" : "Download integration ZIP →"}
          </span>
        </button>
      </div>

      {statusMessage && (
        <p
          role="status"
          style={{
            margin: "14px 0 0",
            fontSize: 13,
            color: isError ? "#a33d32" : "#3d7651",
            fontWeight: 500,
          }}
        >
          {statusMessage}
        </p>
      )}
    </section>
  );
}
