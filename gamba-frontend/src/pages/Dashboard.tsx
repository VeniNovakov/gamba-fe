// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { api } from "../api/client";

type User = {
  id: string;
  username: string;
  balance: number;
};

type Transaction = { id: string; type: string; amount: number; created_at: string };
type Bet = { id: string; type: string; amount: number; payout: number; created_at: string, status: string, odds: number};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New state for money input
  const [amountInput, setAmountInput] = useState<string>("");

  const fetchData = async () => {
    try {
      const uRes = await api.get("users/me");
      setUser(uRes.data);
      api.get("/transactions?limit=10").then(res => setTransactions(res.data)).catch(() => {});
      api.get("/bets?limit=10").then(res => setBets(res.data)).catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    const numAmount = parseFloat(amountInput);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (type === 'withdraw' && user && numAmount > user.balance) {
      alert("Insufficient funds");
      return;
    }

    try {
      await api.post(`/transactions/${type}`, { amount: numAmount });
      setAmountInput(""); // Clear input on success
      fetchData();
    } catch (e) {
      alert("Transaction failed. Check console for details.");
    }
  };

  if (loading) return <div className="page text-center"><div className="loader"></div></div>;
  if (!user) return <div className="page text-center">User not found</div>;

  return (
    <div className="page dashboard-container">
      <div className="vault-header">
        <div className="vault-info">
          <h1 className="welcome-text">Welcome back, <span>{user.username}</span></h1>
          <p className="status-tag">● Account Verified</p>
        </div>
        
        <div className="vault-balance-card">
          <div className="balance-content">
            <small className="label">Available Funds</small>
            <div className="main-balance">
              <span className="currency">$</span>
              {user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="vault-controls">
            <div className="input-wrapper">
              <span className="input-prefix">$</span>
              <input 
                type="number" 
                className="vault-input" 
                placeholder="0.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
              {user.balance > 0 && (
                <button className="max-btn" onClick={() => setAmountInput(user.balance.toString())}>MAX</button>
              )}
            </div>
            
            <div className="balance-actions">
               <button className="vault-btn deposit" onClick={() => handleTransaction('deposit')}>
                 Deposit
               </button>
               <button className="vault-btn withdraw" onClick={() => handleTransaction('withdraw')}>
                 Withdraw
               </button>
            </div>
          </div>
        </div>
      </div>

<div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "2rem",
        alignItems: "start" 
      }}>
        
        {/* BLOCK 1: BETS */}
<section className="glass-card">
  <div className="flex-between mb-lg">
    <h3 className="section-title">Recent Activity</h3>
    <span className="status-pill open">Live Feed</span>
  </div>

  <div className="scroll-area" style={{ height: "400px", overflowY: "auto", paddingRight: "10px" }}>
    {bets && bets.length > 0 ? bets.map(bet => {
      const isWon = bet.status === 'won';
      
      return (
        <div key={bet.id} className="list-item">
          <div className="flex-row">
            {/* Displaying icon based on outcome */}
            <div className={`game-icon-mini ${isWon ? 'border-success' : 'border-dim'}`}>
              {isWon ? '💰' : '📉'}
            </div>
            
            <div>
              <div className="text-bold" style={{ textTransform: 'uppercase', fontSize: '0.85rem' }}>
                {bet.type} {/* Falling back to type since Game Name isn't in JSON */}
              </div>
              <small className="text-secondary">
                {bet.odds > 0 ? `${bet.odds.toFixed(2)}x` : '0.00x'} • {new Date(bet.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className={`text-bold ${isWon ? "text-accent" : "text-secondary"}`} style={{ opacity: isWon ? 1 : 0.6 }}>
              {isWon ? `+$${bet.payout.toFixed(2)}` : `-$${bet.amount.toFixed(2)}`}
            </div>
            <small className="status-pill" style={{ 
              fontSize: '0.6rem', 
              background: isWon ? 'rgba(59, 255, 178, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              color: isWon ? 'var(--primary)' : 'var(--text-secondary)'
            }}>
              {bet.status}
            </small>
          </div>
        </div>
      );
    }) : (
      <div className="text-center py-xl">
        <p className="text-secondary">No bets found</p>
      </div>
    )}
  </div>
</section>

        {/* BLOCK 2: TRANSACTIONS */}
        <section className="glass-card">
          <h3 className="mb-lg">Transactions</h3>
          {/* Scrollable Container */}
          <div className="scroll-area" style={{ height: "400px", overflowY: "auto", paddingRight: "10px" }}>
            {transactions && transactions.length > 0 ? transactions.map(tx => (
              <div key={tx.id} className="list-item">
                <div>
                  <div className="text-bold capitalize">{tx.type}</div>
                  <small className="text-secondary">{new Date(tx.created_at).toLocaleDateString()}</small>
                </div>
                <span className="text-bold">
                  {tx.amount > 0 ? "+" : ""}${tx.amount.toFixed(2)}
                </span>
              </div>
            )) : <p className="text-secondary py-md text-center">No history.</p>}
          </div>
        </section>

      </div>
    </div>
  );
}