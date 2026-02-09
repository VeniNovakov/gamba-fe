import { useEffect, useState } from "react";
import { api } from "../api/client";
import { format } from "date-fns";
import { Shield, Timer, DollarSign } from "lucide-react";

type Outcome = {
  id: string;
  name: string;
  odds: number;
};

type Event = {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  starts_at: string;
  outcomes: Outcome[];
};

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [selectedOutcome, setSelectedOutcome] = useState<{event: Event, outcome: Outcome} | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [betStatus, setBetStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events?status=${filter}`);
      setEvents(res.data);
    } catch (e) {
      console.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedOutcome || !betAmount) return;
    setBetStatus("sending");
    try {
      await api.post(`/events/${selectedOutcome.event.id}/bet`, {
        outcome_id: selectedOutcome.outcome.id,
        amount: Number(betAmount)
      });
      setBetStatus("success");
      setTimeout(() => setSelectedOutcome(null), 2000);
    } catch (e) {
      setBetStatus("error");
    }
  };

  return (
    <div className="page">
      <div className="flex-row mb-lg" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-accent">Global Events</h1>
        <div className="flex-row gap-md">
          {["upcoming", "live", "completed"].map((s) => (
            <button 
              key={s}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(s)}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="events-grid">
        {loading ? (
          <div className="text-center py-xl w-full">Scanning GAMBA for events...</div>
        ) : events.map((event) => (
          <div key={event.id} className="card event-card">
            <div className="event-badge">{event.category}</div>
            <h3 className="mb-sm">{event.name}</h3>
            <p className="text-secondary text-sm mb-md">{event.description}</p>
            
            <div className="flex-row gap-md mb-lg text-xs text-secondary">
              <span className="flex-row gap-xs"><Timer size={14}/> {format(new Date(event.starts_at), "MMM d, HH:mm")}</span>
              <span className="flex-row gap-xs"><Shield size={14}/> {event.status}</span>
            </div>

            <div className="outcomes-list">
              {event.outcomes?.map((outcome) => (
                <button 
                  key={outcome.id} 
                  className="outcome-btn"
                  onClick={() => {
                    setSelectedOutcome({ event, outcome });
                    setBetStatus("idle");
                    setBetAmount("");
                  }}
                >
                  <span className="outcome-name">{outcome.name}</span>
                  <span className="outcome-odds">{outcome.odds.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* BETTING MODAL */}
      {selectedOutcome && (
        <div className="modal-overlay" onClick={() => setSelectedOutcome(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-accent mb-sm">Place Stake</h2>
            <p className="text-secondary mb-lg">
              Event: {selectedOutcome.event.name}<br/>
              Selection: <span className="text-white">{selectedOutcome.outcome.name}</span>
            </p>

            {betStatus === "success" ? (
              <div className="text-center py-lg text-primary">BET PLACED SUCCESSFULLY</div>
            ) : (
              <>
                <div className="bet-input-wrapper">
                  <DollarSign className="input-icon" />
                  <input 
                    type="number" 
                    placeholder="Stake Amount"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                  />
                </div>
                
                <div className="payout-preview mt-md mb-lg">
                  <span>Potential Payout:</span>
                  <span className="text-primary">
                    ${(Number(betAmount) * selectedOutcome.outcome.odds).toFixed(2)}
                  </span>
                </div>

                <div className="flex-row gap-md">
                  <button className="btn btn-secondary flex-1" onClick={() => setSelectedOutcome(null)}>Cancel</button>
                  <button 
                    className="btn btn-primary flex-1" 
                    onClick={handlePlaceBet}
                    disabled={betStatus === "sending" || !betAmount}
                  >
                    {betStatus === "sending" ? "TRANSMITTING..." : "CONFIRM BET"}
                  </button>
                </div>
                {betStatus === "error" && <p className="text-error mt-md text-center">Insufficient funds or invalid stake.</p>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}