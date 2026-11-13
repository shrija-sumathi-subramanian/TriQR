"use client";

import { useState, useEffect } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 16);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleNavClick(targetId: string) {
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="header-inner">
        {/* Brand */}
        <a
          href="#shapes"
          className="brand-link"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <div className="brand-logo-mark" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Isometric 3D Polyhedral Cube representation */}
              <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" />
              <path d="M12 22V12" />
              <path d="M21 7L12 12L3 7" />
            </svg>
          </div>
          <span className="brand-name">TriQR</span>
          <span className="brand-badge">3D Identity</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="header-nav" aria-label="Main Navigation">
          <button
            type="button"
            className="nav-link"
            onClick={() => handleNavClick("identity")}
          >
            Identity
          </button>
          <button
            type="button"
            className="nav-link"
            onClick={() => handleNavClick("links")}
          >
            Links
          </button>
          <button
            type="button"
            className="nav-link"
            onClick={() => handleNavClick("shapes")}
          >
            Shapes
          </button>
          <button
            type="button"
            className="nav-link"
            onClick={() => handleNavClick("preview")}
          >
            3D Studio
          </button>
          <button
            type="button"
            className="nav-link"
            onClick={() => handleNavClick("download")}
          >
            Export
          </button>
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
          <button
            type="button"
            className="header-cta"
            onClick={() => handleNavClick("preview")}
          >
            Open 3D Studio
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span className={`hamburger-bar ${mobileMenuOpen ? "open" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <nav className="mobile-nav" aria-label="Mobile Navigation">
            <button
              type="button"
              className="mobile-nav-link"
              onClick={() => handleNavClick("identity")}
            >
              <span>01</span> Identity
            </button>
            <button
              type="button"
              className="mobile-nav-link"
              onClick={() => handleNavClick("links")}
            >
              <span>02</span> Links
            </button>
            <button
              type="button"
              className="mobile-nav-link"
              onClick={() => handleNavClick("shapes")}
            >
              <span>03</span> Shapes
            </button>
            <button
              type="button"
              className="mobile-nav-link"
              onClick={() => handleNavClick("preview")}
            >
              <span>04</span> 3D Studio
            </button>
            <button
              type="button"
              className="mobile-nav-link"
              onClick={() => handleNavClick("download")}
            >
              <span>05</span> Export & Integration
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

