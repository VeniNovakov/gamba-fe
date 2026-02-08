import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Play from "./pages/Play";
import Social from "./pages/Social";
import Navbar from "./components/Navbar";
import Tournament from "./pages/Tournament"; 
import Events from "./pages/Events";
import Support from "./pages/Support";  
import "./styles/styles.css"; 

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthPage = location.pathname === "/";

  return (
    <div className="app">
      {/* Dynamic Background Elements */}
      <div className="app-background">
        <div className="grid-overlay"></div>
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
      </div>

      {!isAuthPage && <Navbar />}

      <main className={`app-content ${!isAuthPage ? "content-with-nav" : ""}`}>
        {children}
      </main>

      <footer className="app-footer">
        <p>© 2026 GAMBA CASINO. All systems normal.</p>
      </footer>
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
          <Route path="/events" element={<Events />} />
          <Route path="/support" element={<Support />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}