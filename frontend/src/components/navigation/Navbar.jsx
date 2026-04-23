/** Navbar.jsx — Top navigation bar for the public landing page */
import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="landing-navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="nav-logo">FinishIt</Link>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="nav-link-subtle">Log in</Link>
          <Link to="/login">
            <button className="nav-btn">Get Started</button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
