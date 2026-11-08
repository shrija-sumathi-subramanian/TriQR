
"use client";

import { useState } from "react";

import {
  COLOR_PRESETS,
  FINISH_CHOICES,
  FONT_CHOICES,
  type AppearanceSettings,
} from "@/lib/appearance-types";

import type { ShapeId } from "@/lib/shape-config";

type AppearanceControlsProps = {
  selectedShape: ShapeId;
  appearance: AppearanceSettings;
  onAppearanceChange: (next: AppearanceSettings) => void;
  onReset: () => void;

  // Optional legacy props for compatibility with the current parent.
  selectedFaceId?: string;
  onSelectedFaceChange?: (faceId: string) => void;
};

export default function AppearanceControls({
  appearance,
  onAppearanceChange,
  onReset,
}: AppearanceControlsProps) {
  const [colorHex, setColorHex] = useState(appearance.color);
  const [fontHex, setFontHex] = useState(appearance.fontColor);

  function updateColor(color: string) {
    const normalized = color.toUpperCase();

    onAppearanceChange({
      ...appearance,
      color: normalized,

      // Keep old fields synchronised until scene files are migrated.
      edgeColor: normalized,
      faceColors: Object.fromEntries(
        Object.keys(appearance.faceColors).map((faceId) => [
          faceId,
          normalized,
        ])
      ),
    });

    setColorHex(normalized);
  }

  function updateFontColor(color: string) {
    const normalized = color.toUpperCase();

    onAppearanceChange({
      ...appearance,
      fontColor: normalized,
    });

    setFontHex(normalized);
  }

  function updateHex(
    value: string,
    update: (color: string) => void
  ) {
    const normalized = value.trim().startsWith("#")
      ? value.trim()
      : `#${value.trim()}`;

    if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
      update(normalized);
    }
  }

  function renderPresets(
    current: string,
    onSelect: (color: string) => void
  ) {
    return (
      <div className="color-preset-grid">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            className={`color-preset ${
              current.toLowerCase() === preset.value.toLowerCase()
                ? "active"
                : ""
            }`}
            style={{ backgroundColor: preset.value }}
            aria-label={preset.name}
            title={preset.name}
            onClick={() => onSelect(preset.value)}
          />
        ))}
      </div>
    );
  }

  function renderCustomColor(
    value: string,
    setValue: (value: string) => void,
    update: (color: string) => void,
    label: string,
    id: string
  ) {
    return (
      <div className="custom-color-row">
        <label className="color-picker-label">
          <input
            type="color"
            aria-label={`Choose ${label}`}
            value={
              /^#[0-9A-Fa-f]{6}$/.test(value)
                ? value
                : "#F8F4EC"
            }
            onChange={(event) => update(event.target.value)}
          />
          <span>Custom colour</span>
        </label>

        <div className="hex-input-wrap">
          <label htmlFor={id}>HEX</label>
          <input
            id={id}
            type="text"
            value={value}
            maxLength={7}
            spellCheck={false}
            onChange={(event) => setValue(event.target.value)}
            onBlur={() => updateHex(value, update)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                updateHex(value, update);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="appearance-panel">
      <div className="appearance-panel-heading">
        <div>
          <p className="eyebrow">MAKE IT YOURS</p>
          <h3>Appearance</h3>
          <p className="appearance-help">
            One design for your entire 3D identity.
          </p>
        </div>

        <button
          type="button"
          className="appearance-reset"
          onClick={onReset}
        >
          Reset appearance
        </button>
      </div>

      {/* GLOBAL SHAPE COLOUR */}
      <div className="appearance-control-group">
        <p className="appearance-label">Shape colour</p>

        {renderPresets(appearance.color, updateColor)}

        {renderCustomColor(
          colorHex,
          setColorHex,
          updateColor,
          "shape colour",
          "appearance-shape-hex"
        )}

        <p className="appearance-hint">
          Applies the same colour to every face and edge.
        </p>
      </div>

      {/* GLOBAL FONT STYLE */}
      <div className="appearance-control-group">
        <p className="appearance-label">Font style</p>

        <div className="font-choice-grid">
          {FONT_CHOICES.map((font) => (
            <button
              key={font.value}
              type="button"
              className={`font-choice font-${font.value} ${
                appearance.font === font.value ? "active" : ""
              }`}
              onClick={() =>
                onAppearanceChange({
                  ...appearance,
                  font: font.value,
                })
              }
              aria-pressed={appearance.font === font.value}
            >
              <span className="font-sample">{font.sample}</span>
              <span>{font.label}</span>
            </button>
          ))}
        </div>

        <p className="appearance-hint">
          Changes the font across the entire model.
        </p>
      </div>

      {/* GLOBAL FONT SIZE */}
      <div className="appearance-control-group">
        <div className="appearance-setting-heading">
          <label
            className="appearance-label"
            htmlFor="appearance-font-size"
          >
            Font size
          </label>

          <span className="appearance-value">
            {appearance.fontSize.toFixed(2)}
          </span>
        </div>

        <input
          id="appearance-font-size"
          className="appearance-range"
          type="range"
          min="0.15"
          max="0.70"
          step="0.01"
          value={appearance.fontSize}
          onChange={(event) =>
            onAppearanceChange({
              ...appearance,
              fontSize: Number(event.target.value),
            })
          }
        />

        <p className="appearance-hint">
          Changes the text size across all faces together.
        </p>
      </div>

      {/* GLOBAL FONT COLOUR */}
      <div className="appearance-control-group">
        <p className="appearance-label">Font colour</p>

        {renderPresets(appearance.fontColor, updateFontColor)}

        {renderCustomColor(
          fontHex,
          setFontHex,
          updateFontColor,
          "font colour",
          "appearance-font-hex"
        )}

        <p className="appearance-hint">
          Applies to all text on the model.
        </p>
      </div>

      {/* GLOBAL SURFACE FINISH */}
      <div className="appearance-control-group">
        <p className="appearance-label">Surface finish</p>

        <div className="finish-choice-grid">
          {FINISH_CHOICES.map((finish) => (
            <button
              key={finish.value}
              type="button"
              className={`finish-choice finish-${finish.value} ${
                appearance.finish === finish.value ? "active" : ""
              }`}
              onClick={() =>
                onAppearanceChange({
                  ...appearance,
                  finish: finish.value,
                })
              }
              aria-pressed={appearance.finish === finish.value}
            >
              <span className="finish-swatch" />

              <span className="finish-copy">
                <strong>{finish.label}</strong>
                <small>{finish.description}</small>
              </span>
            </button>
          ))}
        </div>

        <p className="appearance-hint">
          Applies to the complete solid shape, not just its edges.
          QR images remain unchanged.
        </p>
      </div>
    </div>
  );
}
