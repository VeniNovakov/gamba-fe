import { useEffect, useState } from "react";
import { api } from "../api/client";

type GameCategory = "slots" | "dice";

type Game = {
  id: string;
  name: string;
  category: GameCategory;
  min_bet: number;
  max_bet: number;
};

type PlayResponse = {
  reels?: [string, string, string];
  dice?: [number, number];
  target?: number;
  won: boolean;
  payout: number;
  multiplier: number;
  new_balance: number;
};

export default function Play() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [balance, setBalance] = useState<number>(0);
  
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState<string[]>(["?", "?", "?"]);
  const [dice, setDice] = useState<number[]>([1, 1]);
  
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
        if (selectedGame.category === "slots") {
            setReels([
                 ["🍒", "🍋", "🍉", "⭐", "7️⃣"][Math.floor(Math.random() * 5)],
                 ["🍒", "🍋", "🍉", "⭐", "7️⃣"][Math.floor(Math.random() * 5)],
                 ["🍒", "🍋", "🍉", "⭐", "7️⃣"][Math.floor(Math.random() * 5)]
            ]);
        } else {
            setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
        }
    }, 80);

    try {
      const res = await api.post<PlayResponse>("/games/play", {
        game_id: selectedGame.id,
        bet_amount: bet,
      });

      const data = res.data;

      setTimeout(() => {
        clearInterval(interval);
        
        if (data.reels) setReels(data.reels);
        if (data.dice) setDice(data.dice);
        
        setBalance(data.new_balance);
        setWon(data.won);
        
        if (data.won) {
          setMessage(`WIN! x${data.multiplier.toFixed(1)} ($${data.payout.toFixed(2)})`);
        } else {
          setMessage("No luck this time.");
        }
        setLoading(false);
      }, 1000);

    } catch (err: any) {
      clearInterval(interval);
      setLoading(false);
      setMessage(err.response?.data?.error || "System Error");
      setWon(null);
    }
  };

  const adjustBet = (amount: number) => {
    if (!selectedGame) return;
    setBet((prev) => {
        const nextBet = prev + amount;
        if (nextBet < selectedGame.min_bet) return selectedGame.min_bet;
        if (nextBet > selectedGame.max_bet) return selectedGame.max_bet;
        return nextBet;
    });
  };

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
            <h1 className="text-accent" style={{ fontSize: "1.5rem", fontWeight: "bold", letterSpacing: "2px" }}>ARCADE</h1>
            <p className="text-secondary">Secure Provably Fair Connection</p>
        </div>
        <div className="card" style={{ padding: "0.5rem 1.5rem", minWidth: "150px", textAlign: "right", border: "1px solid var(--primary)" }}>
            <div className="text-secondary" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>BALANCE</div>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--primary)" }}>${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
      </div>

      <div className="game-layout" style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "2rem" }}>
        
        <div className="card">
          <h3 className="section-title mb-lg">Select Protocol</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {games.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGame(g);
                  setBet(g.min_bet);
                  setReels(["?", "?", "?"]);
                  setDice([1, 1]);
                  setMessage("");
                  setWon(null);
                }}
                className={`btn ${selectedGame?.id === g.id ? "btn-primary" : "btn-secondary"}`}
                style={{ justifyContent: "flex-start", width: "100%" }}
              >
                <span style={{ marginRight: "10px" }}>{g.category === "slots" ? "🎰" : "🎲"}</span>
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "550px", position: "relative" }}>
          {selectedGame ? (
            <>
              <h2 className="text-accent mb-xl" style={{ fontSize: "2rem" }}>{selectedGame.name}</h2>

              {selectedGame.category === "slots" ? (
                <div style={{ display: "flex", gap: "1rem", background: "rgba(0,0,0,0.4)", padding: "2rem", borderRadius: "20px", border: "1px solid var(--border-secondary)" }}>
                  {reels.map((r, i) => (
                    <div key={i} className={`reel-box ${loading ? 'spinning' : ''}`} style={{ width: "100px", height: "130px", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.5rem", borderRadius: "12px", border: "1px solid #333" }}>
                      {r}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", gap: "2rem" }}>
                  {dice.map((d, i) => (
                    <div key={i} className={`dice-face ${loading ? 'rolling' : ''}`} style={{ width: "120px", height: "120px", background: "#eee", color: "#111", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem", fontWeight: "bold", boxShadow: "0 8px 0 #bbb" }}>
                      {d}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ height: "60px", margin: "1.5rem 0", display: "flex", alignItems: "center" }}>
                {message && (
                    <div className={`status-badge ${won ? 'win' : 'lose'}`} style={{ padding: "0.5rem 2rem", borderRadius: "20px", fontWeight: "bold", border: "1px solid" }}>
                        {message}
                    </div>
                )}
              </div>

              <div style={{ width: "100%", maxWidth: "450px", background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "15px", border: "1px solid var(--border-secondary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                    <span>BET AMOUNT</span>
                    <span>LIMIT: ${selectedGame.min_bet} - ${selectedGame.max_bet}</span>
                </div>
                
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    <button className="btn btn-secondary" onClick={() => adjustBet(-10)}>-10</button>
                    <button className="btn btn-secondary" onClick={() => adjustBet(-1)}>-</button>
                    
                    <div style={{ flex: 1, position: "relative" }}>
                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--primary)" }}>$</span>
                        <input 
                            type="number" 
                            value={bet} 
                            readOnly 
                            style={{ width: "100%", textAlign: "center", fontSize: "1.2rem", background: "#000", border: "1px solid #333", height: "45px", borderRadius: "8px" }} 
                        />
                    </div>

                    <button className="btn btn-secondary" onClick={() => adjustBet(1)}>+</button>
                    <button className="btn btn-secondary" onClick={() => adjustBet(10)}>+10</button>
                </div>

                <button
                    onClick={play}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", fontWeight: "bold" }}
                >
                    {loading ? "COMMUNICATING..." : selectedGame.category === "slots" ? "SPIN" : "ROLL"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-secondary">Select a game to start wagering.</div>
          )}
        </div>
      </div>

    </div>
  );
}