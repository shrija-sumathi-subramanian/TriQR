
"use client";

import {
  getQrFaces,
  getQrCapacity,
  type ShapeId,
} from "@/lib/shape-config";

import type {
  FaceAssignments,
  GeneratedQR,
} from "@/lib/qr-types";

type FaceAssignmentProps = {
  selectedShape: ShapeId;
  qrCodes: GeneratedQR[];
  assignments: FaceAssignments;
  onAssignmentsChange: (value: FaceAssignments) => void;
};

export default function FaceAssignment({
  selectedShape,
  qrCodes,
  assignments,
  onAssignmentsChange,
}: FaceAssignmentProps) {
  const faces = getQrFaces(selectedShape);
  const assignedIds = Object.values(assignments);

  function assignQr(faceId: string, value: string) {
    const updated = { ...assignments };

    if (value === "") {
      delete updated[faceId];
    } else {
      const qrId = Number(value);

      for (const [key, assignedId] of Object.entries(updated)) {
        if (assignedId === qrId) {
          delete updated[key];
        }
      }

      updated[faceId] = qrId;
    }

    onAssignmentsChange(updated);
  }

  return (
    <section className="assignment-section">
      <div className="profile-heading">
        <p className="eyebrow">MAKE IT YOURS</p>

        <h2>Assign your QR codes</h2>

        <p>
          Choose which links appear on your{" "}
          {selectedShape.replaceAll("-", " ")}.
          The first face is reserved for your model name.
        </p>
      </div>

      {qrCodes.length === 0 ? (
        <p className="assignment-empty">
          Generate your QR codes first.
        </p>
      ) : (
        <>
          <p className="assignment-capacity">
            {Object.keys(assignments).length} of{" "}
            {getQrCapacity(selectedShape)} QR slots assigned
          </p>

          <div className="assignment-list">
            {faces.map((face) => {
              const currentId = assignments[face.id];

              return (
                <div className="assignment-row" key={face.id}>
                  <label
                    className="form-label"
                    htmlFor={`assignment-${face.id}`}
                  >
                    {face.label}
                  </label>

                  <select
                    id={`assignment-${face.id}`}
                    className="form-input"
                    value={currentId ?? ""}
                    onChange={(event) =>
                      assignQr(face.id, event.target.value)
                    }
                  >
                    <option value="">Leave this face empty</option>

                    {qrCodes
                      .filter(
                        (qr) =>
                          !assignedIds.includes(qr.id) ||
                          qr.id === currentId
                      )
                      .map((qr) => (
                        <option key={qr.id} value={qr.id}>
                          {qr.displayName || `Link ${qr.id}`}
                        </option>
                      ))}
                  </select>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
