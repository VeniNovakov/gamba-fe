import { useState } from "react";
import { api } from "../api/client";

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError("");

    // Frontend Pre-validation to match your Go 'binding' tags
    if (username.length < 3) return setError("Username must be at least 3 chars");
    if (password.length < 6) return setError("Password must be at least 6 chars");

    setLoading(true);
    try {
      const endpoint = isRegister ? "auth/register" : "auth/login";
      const res = await api.post(endpoint, { username, password });
      
      // Accessing res.data.tokens.access_token based on your Go struct
      const token = res.data?.tokens?.access_token;
      
      if (token) {
        localStorage.setItem("access", token);
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      // Logic to display the specific validation error from Gin
      const serverMessage = err.response?.data?.error || err.response?.data?.message;
      setError(serverMessage || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <h1 className="navbar-logo">
            <span className="text-accent">GAMBA</span> CASINO
          </h1>
          <p className="text-secondary">
            {isRegister ? "Create your vault account" : "Welcome back, operative."}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="section-title">Username</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Min. 3 characters" 
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label className="section-title">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters" 
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? "Processing..." : isRegister ? "Create Account" : "Secure Login"}
          </button>
        </form>

        <div className="auth-footer">
          <button className="btn-link" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Already have an account? Login" : "New operative? Register here"}
          </button>
        </div>
      </div>
    </div>
  );
}