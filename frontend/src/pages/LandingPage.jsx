/** LandingPage.jsx — Creative Studio / Branding Theme */
import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/navigation/Navbar";
import "../styles/features/landing.css";

export function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />

      {/* BLOCK 1: THE HERO (Estudio Koudblu inspired) */}
      <section className="hero-block">
        <div className="hero-glow-back"></div>
        <div className="hero-subtitle">FinishIt ✧ STUDIO</div>
        <h1 className="hero-title">
          Productivity<br />
          <span className="text-gradient">& Focus</span>
        </h1>
        <div className="hero-cta-wrapper">
          <Link to="/login">
            <button className="nav-btn">START NOW &darr;</button>
          </Link>
        </div>
      </section>



    </div>
  );
}
