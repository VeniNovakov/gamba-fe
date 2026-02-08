// src/components/Navbar.tsx
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ display: "flex", gap: 20 }}>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/play">Play</Link>
      <Link to="/social">Social</Link>
      <button
        onClick={() => {
          localStorage.removeItem("access");
          window.location.href = "/";
        }}
      >
        Logout
      </button>
    </nav>
  );
}
