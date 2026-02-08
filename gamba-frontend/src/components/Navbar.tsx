// src/components/Navbar.tsx
import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="text-accent">GAMBA</span> CASINO
        </div>

        <ul className="navbar-nav">
          <li>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/play" 
              className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
            >
              Play
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/social" 
              className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
            >
              Social
            </NavLink>
          </li>
        </ul>

        <button 
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
          style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}