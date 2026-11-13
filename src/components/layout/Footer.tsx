"use client";

export default function Footer() {
  function handleNavClick(targetId: string) {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-col footer-brand-col">
            <div className="footer-brand">
              <div className="brand-logo-mark" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" />
                  <path d="M12 22V12" />
                  <path d="M21 7L12 12L3 7" />
                </svg>
              </div>
              <span className="brand-name">TriQR</span>
            </div>
            <p className="footer-description">
              Spatial digital identity systems. Encode personal links, profiles,
              and portfolios into interactive 3D polyhedral models ready for physical 3D printing
              or digital web integration.
            </p>
          </div>

          {/* Quick Jump Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Workspace</h4>
            <ul className="footer-nav-list">
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleNavClick("identity")}
                >
                  Identity & Name
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleNavClick("links")}
                >
                  Links & QR Codes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleNavClick("shapes")}
                >
                  Polyhedral Geometries
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleNavClick("preview")}
                >
                  3D Interactive Studio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleNavClick("download")}
                >
                  Export & Integration
                </button>
              </li>
            </ul>
          </div>

          {/* 3D Viewer Guide */}
          <div className="footer-col">
            <h4 className="footer-heading">3D Controls</h4>
            <ul className="footer-controls-list">
              <li>
                <span className="control-key">Left Drag</span>
                <span className="control-desc">Orbit & rotate in 3D</span>
              </li>
              <li>
                <span className="control-key">Click Face</span>
                <span className="control-desc">Smooth camera alignment</span>
              </li>
              <li>
                <span className="control-key">Scroll / Pinch</span>
                <span className="control-desc">Zoom in & out</span>
              </li>
              <li>
                <span className="control-key">Reset ↺</span>
                <span className="control-desc">Return to canonical angle</span>
              </li>
            </ul>
          </div>

          {/* Export Formats */}
          <div className="footer-col">
            <h4 className="footer-heading">Integration</h4>
            <ul className="footer-specs-list">
              <li>
                <strong>Binary GLB (glTF 2.0)</strong>
                <p>Standard PBR materials with baked QR canvas textures</p>
              </li>
              <li>
                <strong>Standalone HTML</strong>
                <p>Zero-dependency self-contained 3D viewer</p>
              </li>
              <li>
                <strong>Developer ZIP</strong>
                <p>&lt;triqr-model&gt; & &lt;TriQRModel&gt; components</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            © 2026 TriQR Studio. Open-format 3D identity systems.
          </p>
          <div className="tech-badge">
            <span>Three.js</span>
            <span className="dot">·</span>
            <span>React Three Fiber</span>
            <span className="dot">·</span>
            <span>Next.js</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

