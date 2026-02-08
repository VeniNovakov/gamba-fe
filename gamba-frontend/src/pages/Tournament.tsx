import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";

type LeaderboardEntry = {
    rank: number;
    user_id: string;
    user_name: string;
    score: number;
    prize_won: number;
};

export default function Tournament() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<any | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const loadTournamentData = async () => {
      try {
        const [tRes, lRes] = await Promise.all([
          api.get(`/tournaments/${id}`),
          api.get(`/tournaments/${id}/leaderboard`)
        ]);
        
        setTournament(tRes.data);
        setLeaderboard(lRes.data);
      } catch (err) {
        console.error("Data fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    loadTournamentData();
    const interval = setInterval(loadTournamentData, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/tournaments/${id}/join`, { tournament_id: id });
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error || "Transaction failed");
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="page text-center"><div className="loading"></div></div>;

  return (
    <div className="page">
      <div className="card mb-lg" style={{ borderLeft: "4px solid var(--primary)" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
                <h1 className="text-accent">{tournament.name}</h1>
                <p className="text-secondary">{tournament.description}</p>
            </div>
            <div style={{ textAlign: "right" }}>
                <p className="text-secondary">PRIZE POOL</p>
                <h2 className="text-warning">${tournament.prize_pool}</h2>
            </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "2rem" }}>
        <div className="card">
          <h3 className="mb-lg">Leaderboard</h3>
          <table style={{ width: "100%" }}>
            <thead>
              <tr className="text-secondary" style={{ textAlign: "left" }}>
                <th>Rank</th>
                <th>User</th>
                <th style={{ textAlign: "right" }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.user_id} style={{ height: "50px", borderBottom: "1px solid var(--border-secondary)" }}>
                  <td>#{entry.rank}</td>
                  <td className="text-bold">{entry.user_name}</td>
                  <td className="text-accent" style={{ textAlign: "right" }}>{entry.score.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sidebar">
          <div className="card mb-lg">
            <h4 className="mb-2">Registration</h4>
            <p className="text-secondary mb-lg">Fee: ${tournament.entry_fee}</p>
            <button 
                className="btn btn-primary" 
                style={{ width: "100%" }}
                onClick={handleJoin}
                disabled={joining || tournament.status !== 'open'}
            >
              {joining ? "PROCESSING..." : tournament.status === 'open' ? "JOIN NOW" : "REGISTRATION CLOSED"}
            </button>
          </div>
          
          <div className="card">
             <h4 className="mb-2">Tournament Status</h4>
             <div className={`btn btn-sm ${tournament.status === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}>
                {tournament.status.replace('_', ' ').toUpperCase()}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}