// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { api } from "../api/client";

type User = {
  id: string;
  username: string;
  balance: number;
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("users/me")
      .then((r) => setUser(r.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    const amount = type === 'deposit' ? 100 : 50;
    try {
      await api.post(`/transactions/${type}`, { amount });
      const res = await api.get("users/me");
      setUser(res.data);
    } catch (e) {
      alert("Transaction failed");
    }
  };

  if (loading) return <div className="page text-center"><div className="loading"></div></div>;
  if (!user) return <div className="page text-center">User not found</div>;

  return (
    <div className="page">
      <div className="page-hero">
        <h1 className="page-title">
          Welcome back, <span className="text-accent">{user.username}</span>
        </h1>
        <p className="page-subtitle">Your command center.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        
        <div className="card">
          <h3 className="text-secondary mb-lg">Total Balance</h3>
          <div style={{ fontSize: "3rem", fontWeight: "bold", lineHeight: 1 }}>
            ${user.balance.toFixed(2)}
          </div>
        </div>

        <div className="card">
          <h3 className="text-secondary mb-lg">Wallet Actions</h3>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => handleTransaction('deposit')}
            >
              Deposit $100
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => handleTransaction('withdraw')}
            >
              Withdraw $50
            </button>
          </div>
          <p className="text-secondary mt-lg" style={{ fontSize: "0.8rem" }}>
            * Instant transfers powered by GAMBA Chain
          </p>
        </div>


      </div>
    </div>
  );
}