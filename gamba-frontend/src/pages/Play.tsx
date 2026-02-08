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

  const [reels, setReels] = useState<string[]>(["❔", "❔", "❔"]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    api.get("/games").then((r) => setGames(r.data));
    api.get("/me").then((r) => setBalance(r.data.balance)); // assume you have this
  }, []);

  const play = async () => {
    if (!selectedGame) return;

    setLoading(true);
    setMessage("");
    setReels(["🎰", "🎰", "🎰"]);

    try {
      const res = await api.post<PlayResponse>("/games/play", {
        game_id: selectedGame.id,
        bet_amount: bet,
      });

      const data = res.data;

      // fake spin delay for UX
      setTimeout(() => {
        setReels(data.reels);
        setBalance(data.new_balance);

        if (data.won) {
          setMessage(
            `YOU WON! x${data.multiplier} → +${data.payout}`
          );
        } else {
          setMessage("You lost 😭");
        }

        setLoading(false);
      }, 600);
    } catch (err: any) {
      setLoading(false);
      setMessage(
        err.response?.data?.error || "Something went wrong"
      );
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Slot Games</h2>

      <h3>Balance: ${balance.toFixed(2)}</h3>

      <div>
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGame(g)}
            style={{
              margin: 4,
              background:
                selectedGame?.id === g.id ? "#4ade80" : "",
            }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {selectedGame && (
        <>
          <h3>{selectedGame.name}</h3>

          <div style={{ fontSize: 64, margin: 20 }}>
            {reels[0]} {reels[1]} {reels[2]}
          </div>

          <div>
            <input
              type="number"
              value={bet}
              min={selectedGame.min_bet}
              max={selectedGame.max_bet}
              onChange={(e) => setBet(Number(e.target.value))}
            />
          </div>

          <button
            onClick={play}
            disabled={loading}
            style={{ marginTop: 10, padding: 10 }}
          >
            {loading ? "Spinning..." : "SPIN"}
          </button>

          <p>{message}</p>
        </>
      )}
    </div>
  );
}
