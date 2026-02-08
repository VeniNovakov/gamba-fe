// src/pages/Play.tsx
import { useEffect, useState } from "react";
import { api } from "../api/client";

type Game = {
  id: string;
  name: string;
  min_bet: number;
  max_bet: number;
};

type PlayResponse = {
  reels: [string, string, string];
  won: boolean;
  payout: number;
  multiplier: number;
  new_balance: number;
};

export default function Play() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState<string[]>(["?", "?", "?"]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [won, setWon] = useState<boolean | null>(null);

  useEffect(() => {
    api.get("/games").then((r) => setGames(r.data));
    api.get("/users/me").then((r) => setBalance(r.data.balance));
  }, []);

  const play = async () => {
    if (!selectedGame || loading) return;
    
    if (balance < bet) {
        setMessage("Insufficient funds");
        setWon(false);
        return;
    }

    setLoading(true);
    setMessage("");
    setWon(null);
    
    let interval = setInterval(() => {
        setReels([
             ["🍒", "🍋", "🍉", "⭐"][Math.floor(Math.random() * 4)],
             ["🍒", "🍋", "🍉", "⭐"][Math.floor(Math.random() * 4)],
             ["🍒", "🍋", "🍉", "⭐"][Math.floor(Math.random() * 4)]
        ]);
    }, 100);

    try {
      const res = await api.post<PlayResponse>("/games/play", {
        game_id: selectedGame.id,
        bet_amount: bet,
      });

      const data = res.data;

      setTimeout(() => {
        clearInterval(interval);
        setReels(data.reels);
        setBalance(data.new_balance);
        setWon(data.won);
        
        if (data.won) {
          setMessage(`WIN! x${data.multiplier} ($${data.payout.toFixed(2)})`);
        } else {
          setMessage("No luck this time.");
        }
        setLoading(false);
      }, 800);

    } catch (err: any) {
      clearInterval(interval);
      setLoading(false);
      setMessage(err.response?.data?.error || "System Error");
      setWon(null);
    }
  };

  const adjustBet = (amount: number) => {
    if (!selectedGame) return;
    const newBet = bet + amount;
    if (newBet >= selectedGame.min_bet && newBet <= selectedGame.max_bet) {
      setBet(newBet);
    }
  };

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
            <h1 className="text-accent" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>ARCADE</h1>
            <p className="text-secondary">High risk, high reward.</p>
        </div>
        <div className="card" style={{ padding: "0.5rem 1.5rem", minWidth: "150px", textAlign: "right" }}>
            <div className="text-secondary" style={{ fontSize: "0.8rem" }}>BALANCE</div>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>${balance.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "2rem" }}>
        
        <div className="card">
          <h3 className="mb-lg">Select Protocol</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {games.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGame(g);
                  setBet(g.min_bet);
                  setReels(["?", "?", "?"]);
                  setMessage("");
                  setWon(null);
                }}
                className={`btn ${selectedGame?.id === g.id ? "btn-primary" : "btn-secondary"}`}
                style={{ justifyContent: "flex-start", width: "100%" }}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Game Stage */}
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "500px" }}>
          {selectedGame ? (
            <>
              <h2 className="text-accent mb-lg">{selectedGame.name}</h2>

              <div 
                style={{ 
                    display: "flex", 
                    gap: "1rem", 
                    background: "#000", 
                    padding: "2rem", 
                    borderRadius: "16px",
                    border: won === true ? "2px solid var(--primary)" : "2px solid var(--border-secondary)",
                    boxShadow: won === true ? "0 0 30px rgba(60,255,180,0.3)" : "none",
                    transition: "all 0.3s ease"
                }}
              >
                {reels.map((r, i) => (
                  <div 
                    key={i} 
                    style={{ 
                        width: "80px", 
                        height: "100px", 
                        background: "var(--bg-tertiary)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        fontSize: "3rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-secondary)"
                    }}
                  >
                    {r}
                  </div>
                ))}
              </div>

              <div style={{ height: "40px", margin: "1.5rem 0", textAlign: "center" }}>
                {message && (
                    <div 
                        className="btn" 
                        style={{ 
                            background: won === true ? "rgba(60, 255, 180, 0.1)" : "rgba(255, 77, 148, 0.1)",
                            color: won === true ? "var(--primary)" : "var(--secondary)",
                            border: "1px solid currentColor",
                            cursor: "default"
                        }}
                    >
                        {message}
                    </div>
                )}
              </div>

              <div style={{ width: "100%", maxWidth: "400px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    <span>Min: ${selectedGame.min_bet}</span>
                    <span>Max: ${selectedGame.max_bet}</span>
                </div>
                
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                    <button className="btn btn-secondary" onClick={() => adjustBet(-10)}>-10</button>
                    <button className="btn btn-secondary" onClick={() => adjustBet(-1)}>-</button>
                    <input
                        type="number"
                        value={bet}
                        readOnly
                        style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.1rem" }}
                    />
                    <button className="btn btn-secondary" onClick={() => adjustBet(1)}>+</button>
                    <button className="btn btn-secondary" onClick={() => adjustBet(10)}>+10</button>
                </div>

                <button
                    onClick={play}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
                >
                    {loading ? "PROCESSING..." : "SPIN"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-secondary">
                Select a game protocol from the left to begin.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}