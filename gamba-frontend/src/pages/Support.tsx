import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

type TicketMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Ticket = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  messages: TicketMessage[];
};

export default function Support() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      const res = await api.get("/ticket");
      setTickets(res.data || []);
    } catch (e) {
      console.error("Support fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/ticket", { subject, description });
      setSubject(""); setDescription("");
      fetchTickets();
    } catch (e) { alert("Failed to open ticket"); }
  };

  const postMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim()) return;
    try {
      await api.post(`/ticket/${selectedTicket.id}/messages`, { content: newMessage });
      setNewMessage("");
      const res = await api.get(`/ticket/${selectedTicket.id}`);
      setSelectedTicket(res.data);
      fetchTickets();
    } catch (e) { alert("Failed to send message"); }
  };

  if (loading) return <div className="page-center"><div className="loader"></div></div>;

  return (
    <div className="page dashboard-container">
      <header className="dashboard-header">
        <div>
          <button className="btn btn-secondary btn-sm mb-2" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>
          <h1 className="welcome-text">Support <span>Center</span></h1>
        </div>
      </header>

      <div className="social-grid">
        <aside className="card sidebar-section">
        <div className="flex-between mb-2">
            <h3 className="section-title">Your Tickets</h3>
            <button 
            className="btn btn-primary btn-sm" 
            onClick={() => setSelectedTicket(null)}
            >
            + New
            </button>
        </div>
        
        <div className="messages-area" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {tickets.map(t => (
            <div 
                key={t.id} 
                className={`list-item ${selectedTicket?.id === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTicket(t)}
                style={{ cursor: 'pointer' }}
            >
                <div>
                <div className="text-bold">{t.subject}</div>
                <small className="text-secondary">{new Date(t.created_at).toLocaleDateString()}</small>
                </div>
                <span className={`status-pill ${t.status.toLowerCase()}`}>{t.status}</span>
            </div>
            ))}
            {tickets.length === 0 && <p className="text-secondary text-center">No history.</p>}
        </div>
        </aside>

        <main className="chat-container">
          {selectedTicket ? (
            <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="chat-header">
                <h3>{selectedTicket.subject}</h3>
                <small className="text-secondary">Ticket ID: {selectedTicket.id}</small>
              </div>

              <div className="messages-area">
                <div className="message-bubble msg-theirs">
                  <strong>Original Issue:</strong><br />
                  {selectedTicket.description}
                </div>

                {selectedTicket.messages?.map(msg => (
                  <div key={msg.id} className={`message-bubble ${msg.sender_id === 'ME' ? 'msg-mine' : 'msg-theirs'}`}>
                    {msg.content}
                  </div>
                ))}
              </div>

              <form className="chat-input-area" onSubmit={postMessage}>
                <input 
                  placeholder="Type your reply..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Send</button>
              </form>
            </div>
          ) : (
            <div className="glass-card">
              <h3 className="mb-2">New Support Ticket</h3>
              <form onSubmit={createTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="section-title">Subject</label>
                  <input 
                    placeholder="e.g. Deposit missing" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="section-title">Message</label>
                  <textarea 
                    className="input"
                    style={{ width: '100%', minHeight: '150px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', color: 'white', padding: '1rem', borderRadius: '8px' }}
                    placeholder="Explain the situation..." 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary">Create Ticket</button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}