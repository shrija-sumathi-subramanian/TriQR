"use client";

import { useState, type FormEvent } from "react";
import type { GeneratedQR } from "@/lib/qr-types";

type ProfileLink = {
  id: number;
  displayName: string;
  url: string;
};

type IdentificationResult = {
  category: string;
  platform: string;
  confidence: "high" | "medium" | "low";
  reason: string;
};

type IdentifiedLink = {
  id: number;
  result: IdentificationResult | null;
};

type ValidationResult = {
  success: boolean;
  error?: string;
  details?: { message: string }[];
};

type QRResponse = {
  success: boolean;
  error?: string;
  details?: { message: string }[];
  totalGenerated?: number;
  qrCodes?: GeneratedQR[];
};

type ProfileFormProps = {
  capacity: number;
  onGenerated: (name: string, qrCodes: GeneratedQR[]) => void;
  onQrCodesChange: (qrCodes: GeneratedQR[]) => void;
};

export default function ProfileForm({
  capacity,
  onGenerated,
  onQrCodesChange,
}: ProfileFormProps) {
  const [name, setName] = useState("");

  const [links, setLinks] = useState<ProfileLink[]>([
    { id: 1, displayName: "", url: "" },
  ]);

  const [identifiedLinks, setIdentifiedLinks] = useState<
    IdentifiedLink[]
  >([]);

  const [generatedQRs, setGeneratedQRs] = useState<GeneratedQR[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function clearResults() {
    setIdentifiedLinks([]);
    setGeneratedQRs([]);
    onQrCodesChange([]);
    setMessage("");
    setError("");
  }

  // Add URL only when the selected shape has an available slot.
  function addLink() {
    if (links.length >= capacity) {
      setError(
        `This shape supports only ${capacity} URLs. Change your shape to add another URL.`
      );
      setMessage("");
      return;
    }

    setLinks((current) => [
      ...current,
      {
        id: Date.now() + Math.random(),
        displayName: "",
        url: "",
      },
    ]);

    clearResults();
  }

  function updateLink(
    id: number,
    field: "displayName" | "url",
    value: string
  ) {
    const currentLink = links.find((link) => link.id === id);

    setLinks((current) =>
      current.map((link) =>
        link.id === id ? { ...link, [field]: value } : link
      )
    );

    if (field === "url") {
      clearResults();
      return;
    }

    if (currentLink) {
      const updatedQRs = generatedQRs.map((qr) =>
        qr.url === currentLink.url
          ? { ...qr, displayName: value }
          : qr
      );

      setGeneratedQRs(updatedQRs);
      onQrCodesChange(updatedQRs);
    }

    setMessage("");
    setError("");
  }

  function removeLink(id: number) {
    setLinks((current) =>
      current.filter((link) => link.id !== id)
    );

    clearResults();
  }

  function getSuggestedName(platform: string) {
    const suggestions: Record<string, string> = {
      LinkedIn: "My LinkedIn",
      GitHub: "My GitHub",
      Instagram: "My Instagram",
      YouTube: "My YouTube",
      Behance: "My Behance",
      Dribbble: "My Dribbble",
      Medium: "My Medium",
    };

    return suggestions[platform] || `My ${platform}`;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    clearResults();

    if (!name.trim()) {
      setError("Please enter a name for your 3D model.");
      return;
    }

    if (links.length === 0) {
      setError("Please add at least one URL.");
      return;
    }

    // Prevent generation if the selected shape cannot hold all URLs.
    if (links.length > capacity) {
      setError(
        `Your selected shape supports only ${capacity} URLs. Remove ${links.length - capacity} URL(s) or choose a larger shape.`
      );
      return;
    }

    setLoading(true);

    try {
      // STEP 1: Validate profile information and URLs.
      const validationResponse = await fetch(
        "/api/profile/validate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            links: links.map(({ displayName, url }) => ({
              displayName: displayName.trim(),
              url: url.trim(),
            })),
          }),
        }
      );

      const validationResult: ValidationResult =
        await validationResponse.json();

      if (!validationResponse.ok) {
        const details = validationResult.details
          ?.map((issue) => issue.message)
          .join(", ");

        throw new Error(
          details ||
            validationResult.error ||
            "Profile validation failed."
        );
      }

      // STEP 2: Identify every URL.
      const identificationResults = await Promise.all(
        links.map(async (link) => {
          try {
            const response = await fetch(
              "/api/ai/identify-url",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  url: link.url.trim(),
                }),
              }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
              throw new Error("Identification failed.");
            }

            return {
              id: link.id,
              result: result.result as IdentificationResult,
            };
          } catch {
            return {
              id: link.id,
              result: null,
            };
          }
        })
      );

      setIdentifiedLinks(identificationResults);

      // STEP 3: Suggest display names.
      const preparedLinks = links.map((link) => {
        const identification = identificationResults.find(
          (item) => item.id === link.id
        )?.result;

        if (!identification) {
          return link;
        }

        return {
          ...link,
          displayName:
            link.displayName.trim() ||
            getSuggestedName(identification.platform),
        };
      });

      setLinks(preparedLinks);

      // STEP 4: Generate an individual QR code for every URL.
      const qrResponse = await fetch("/api/qr/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          links: preparedLinks.map((link) => ({
            url: link.url.trim(),
            displayName: link.displayName.trim(),
          })),
        }),
      });

      const qrResult: QRResponse = await qrResponse.json();

      if (!qrResponse.ok || !qrResult.success || !qrResult.qrCodes) {
        const details = qrResult.details
          ?.map((issue) => issue.message)
          .join(", ");

        throw new Error(
          details ||
            qrResult.error ||
            "QR code generation failed."
        );
      }

      // STEP 5: Save generated QR codes.
      setGeneratedQRs(qrResult.qrCodes);

      onGenerated(name.trim(), qrResult.qrCodes);

      // STEP 6: Show the result.
      const failedCount = identificationResults.filter(
        (item) => item.result === null
      ).length;

      if (failedCount > 0) {
        setMessage(
          `${qrResult.totalGenerated} QR code(s) generated successfully. ${failedCount} URL(s) could not be identified, but their QR codes are ready.`
        );
      } else {
        setMessage(
          `Success! All links identified and ${qrResult.totalGenerated} QR codes generated.`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="profile-section"
      id="create-profile"
    >
      <div className="profile-heading">
        <p className="eyebrow">LET'S GET STARTED</p>

        <h2>Create your identity</h2>

        <p>
          Name your 3D model and add up to {capacity} URLs.
        </p>
      </div>

      <form
        className="profile-form"
        onSubmit={handleSubmit}
      >
        {/* 3D model name */}

        <label
          className="form-label"
          htmlFor="profile-name"
        >
          Name your 3D model
        </label>

        <input
          id="profile-name"
          className="form-input"
          type="text"
          placeholder="e.g. Contacts, My Digital Identity"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setMessage("");
            setError("");
          }}
          maxLength={100}
          required
          disabled={loading}
        />

        <p className="form-hint">
          This name will appear on the front face of your model.
        </p>

        {/* URL collection */}

        <div className="links-heading">
          <div>
            <h3>Your links</h3>

            <p>
              Add your URLs. TriQR will identify them and
              suggest names automatically.
            </p>
          </div>

          <button
            type="button"
            className="add-link-button"
            onClick={addLink}
            disabled={loading}
          >
            + Add URL
          </button>
        </div>

        <p className="form-hint">
          {links.length} of {capacity} URL slots used
        </p>

        {links.map((link, index) => {
          const identification = identifiedLinks.find(
            (item) => item.id === link.id
          )?.result;

          const identificationFailed = identifiedLinks.some(
            (item) =>
              item.id === link.id && item.result === null
          );

          return (
            <div
              className="link-entry"
              key={link.id}
            >
              <div className="link-entry-heading">
                <span>URL {index + 1}</span>

                {links.length > 1 && (
                  <button
                    type="button"
                    className="remove-link-button"
                    onClick={() => removeLink(link.id)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                )}
              </div>

              <label
                className="form-label"
                htmlFor={`url-${link.id}`}
              >
                URL
              </label>

              <input
                id={`url-${link.id}`}
                className="form-input"
                type="url"
                placeholder="https://example.com"
                value={link.url}
                onChange={(event) =>
                  updateLink(
                    link.id,
                    "url",
                    event.target.value
                  )
                }
                required
                disabled={loading}
              />

              {identification && (
                <div className="identification-result">
                  <p>
                    <strong>Detected:</strong>{" "}
                    {identification.platform}
                  </p>

                  <p>
                    <strong>Category:</strong>{" "}
                    {identification.category}
                  </p>

                  <p>
                    <strong>Confidence:</strong>{" "}
                    {identification.confidence}
                  </p>

                  <p>{identification.reason}</p>
                </div>
              )}

              {link.displayName && (
                <div className="suggested-name">
                  <label
                    className="form-label"
                    htmlFor={`display-name-${link.id}`}
                  >
                    Suggested display name
                  </label>

                  <input
                    id={`display-name-${link.id}`}
                    className="form-input"
                    type="text"
                    value={link.displayName}
                    onChange={(event) =>
                      updateLink(
                        link.id,
                        "displayName",
                        event.target.value
                      )
                    }
                    maxLength={50}
                    disabled={loading}
                  />

                  <p className="form-hint">
                    You can edit this name or keep the suggestion.
                  </p>
                </div>
              )}

              {identificationFailed && (
                <p className="form-error">
                  Could not identify this URL. You can still
                  keep the link and edit its name.
                </p>
              )}
            </div>
          );
        })}

        {error && (
          <p className="form-error">{error}</p>
        )}

        {message && (
          <p className="form-success">{message}</p>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Identifying links and generating QR codes..."
            : "Identify links & generate QR codes →"}
        </button>
      </form>

      {/* Generated QR previews */}

      {generatedQRs.length > 0 && (
        <div className="qr-results">
          <div className="profile-heading">
            <p className="eyebrow">YOUR QR COLLECTION</p>

            <h2>Generated QR codes</h2>

            <p>
              Each QR code contains its original URL.
              Scan it with your phone to open the link.
            </p>
          </div>

          <div className="qr-grid">
            {generatedQRs.map((qr) => (
              <div
                className="qr-card"
                key={qr.id}
              >
                <h3>
                  {qr.displayName || `Link ${qr.id}`}
                </h3>

                <img
                  src={qr.qrCode}
                  alt={`QR code for ${qr.displayName || qr.url}`}
                  width={220}
                  height={220}
                />

                <p className="qr-url">{qr.url}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}