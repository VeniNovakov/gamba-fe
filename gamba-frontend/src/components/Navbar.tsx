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
        {/* LOGO */}
        <div className="navbar-logo" onClick={() => navigate("/dashboard")} style={{ cursor: 'pointer' }}>
          <span className="text-accent">GAMBA</span> <span>CASINO</span>
        </div>

        {/* NAVIGATION LINKS */}
        <ul className="navbar-nav">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/play" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
              Play
            </NavLink>
          </li>
          <li>
            <NavLink to="/events" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
              Events
            </NavLink>
          </li>
          <li>
            <NavLink to="/social" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
              Social
            </NavLink>
          </li>
          <li>
            <NavLink to="/support" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
              Support
            </NavLink>
          </li>
        </ul>

        {/* ACTIONS */}
        <div className="navbar-actions">
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}