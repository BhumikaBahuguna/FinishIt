/** Section.jsx — Shared structural section for the homepage and other marketing pages */
import React from "react";

export function Section({ children, className = "", id = "", type = "default" }) {
  // We can vary the background color depending on the section type (e.g. alternate backgrounds)
  const baseClass = "landing-section";
  const typeClass = type === "alternate" ? "landing-section-alt" : "";

  return (
    <section id={id} className={`${baseClass} ${typeClass} ${className}`.trim()}>
      <div className="landing-container">
        {children}
      </div>
    </section>
  );
}
