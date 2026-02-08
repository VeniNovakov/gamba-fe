// src/App.tsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Play from "./pages/Play";
import Social from "./pages/Social";
import Navbar from "./components/Navbar";
import Tournament from "./pages/Tournament"; 
import "./styles/styles.css"; 
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideNavbar = location.pathname === "/";

  return (
    <div className="app">
      <div className="app-background">
        <div className="grid-overlay"></div>
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
      </div>

      {!hideNavbar && <Navbar />}

      <main className="app-content">
        {children}
      </main>

      <div className="app-footer">
        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
          © 2026 GAMBA CASINO. All systems normal.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/play" element={<Play />} />
          <Route path="/social" element={<Social />} />
          <Route path="/tournaments/:id" element={<Tournament />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}