import { useEffect, useState } from "react";
import { api } from "../api/client";

type User = {
  id: string;
  username: string;
  balance: number;
  role: string
};
type GameCategory = "slots" | "dice";
type Game = {
  id: string;
  name: string;
  category: GameCategory;
  min_bet: number;
  max_bet: number;
};

type Transaction = { id: string; type: string; amount: number; created_at: string };
type Bet = { id: string; type: string; amount: number; payout: number; created_at: string, status: string, odds: number};

type Tournament = {
  id: string;
  name: string;
  description: string;
  game_id: string | null;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  starts_at: string;
  ends_at: string;
};

type EventCategory = "sports" | "esports" | "politics" | "entertainment" | "other";
type Event = {
  id: string;
  name: string;
  description: string;
  category: EventCategory;
  status: string;
  starts_at: string;
  ends_at: string | null;
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  
  const [amountInput, setAmountInput] = useState<string>("");
  const [activeAdminTab, setActiveAdminTab] = useState<"games" | "tournaments" | "events">("games");
  
  // Game form states
  const [gameName, setGameName] = useState<string>("");
  const [gameCategory, setGameCategory] = useState<GameCategory>("slots");
  const [minBet, setMinBet] = useState<string>("");
  const [maxBet, setMaxBet] = useState<string>("");

  // Tournament form states
  const [tournamentName, setTournamentName] = useState<string>("");
  const [tournamentDescription, setTournamentDescription] = useState<string>("");
  const [tournamentGameId, setTournamentGameId] = useState<string>("");
  const [tournamentEntryFee, setTournamentEntryFee] = useState<string>("");
  const [tournamentPrizePool, setTournamentPrizePool] = useState<string>("");
  const [tournamentMaxParticipants, setTournamentMaxParticipants] = useState<string>("");
  const [tournamentStartsAt, setTournamentStartsAt] = useState<string>("");
  const [tournamentEndsAt, setTournamentEndsAt] = useState<string>("");

  // Event form states
  const [eventName, setEventName] = useState<string>("");
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventCategory, setEventCategory] = useState<EventCategory>("sports");
  const [eventStartsAt, setEventStartsAt] = useState<string>("");
  const [eventEndsAt, setEventEndsAt] = useState<string>("");

  const fetchData = async () => {
    try {
      const uRes = await api.get("/users/me");
      setUser(uRes.data);
      setAdmin(uRes.data.role == "administrator")
      api.get("/transactions?limit=10").then(res => setTransactions(res.data)).catch(() => {});
      api.get("/bets?limit=10").then(res => setBets(res.data)).catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  
  const addGame = async (game: Game) =>{
    if (!game) return;

    try{
      await api.post('/games', {max_bet: game.max_bet, min_bet: game.min_bet, category: game.category, name: game.name})
    }catch(e){
      alert("Creating a game failed")
    }
  }

  const handleAddGame = async () => {
    const numMinBet = parseFloat(minBet);
    const numMaxBet = parseFloat(maxBet);
    
    if (!gameName.trim()) {
      alert("Please enter a game name");
      return;
    }
    
    if (isNaN(numMinBet) || numMinBet <= 0) {
      alert("Please enter a valid minimum bet");
      return;
    }
    
    if (isNaN(numMaxBet) || numMaxBet <= 0) {
      alert("Please enter a valid maximum bet");
      return;
    }
    
    if (numMinBet > numMaxBet) {
      alert("Minimum bet cannot be greater than maximum bet");
      return;
    }

    const newGame: Game = {
      id: "",
      name: gameName,
      category: gameCategory,
      min_bet: numMinBet,
      max_bet: numMaxBet
    };

    try {
      await addGame(newGame);
      setGameName("");
      setGameCategory("slots");
      setMinBet("");
      setMaxBet("");
      alert("Game created successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTournament = async () => {
    const numEntryFee = parseFloat(tournamentEntryFee);
    const numPrizePool = parseFloat(tournamentPrizePool);
    const numMaxParticipants = parseInt(tournamentMaxParticipants);
    
    if (!tournamentName.trim()) {
      alert("Please enter a tournament name");
      return;
    }
    
    if (isNaN(numEntryFee) || numEntryFee < 0) {
      alert("Please enter a valid entry fee");
      return;
    }
    
    if (isNaN(numPrizePool) || numPrizePool < 0) {
      alert("Please enter a valid prize pool");
      return;
    }
    
    if (isNaN(numMaxParticipants) || numMaxParticipants <= 0) {
      alert("Please enter a valid max participants");
      return;
    }

    if (!tournamentStartsAt || !tournamentEndsAt) {
      alert("Please select start and end dates");
      return;
    }

    const startsAt = new Date(tournamentStartsAt);
    const endsAt = new Date(tournamentEndsAt);

    if (endsAt <= startsAt) {
      alert("End date must be after start date");
      return;
    }

    const tournamentData: any = {
      name: tournamentName,
      description: tournamentDescription,
      entry_fee: numEntryFee,
      prize_pool: numPrizePool,
      max_participants: numMaxParticipants,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString()
    };

    if (tournamentGameId.trim()) {
      tournamentData.game_id = tournamentGameId;
    }

    try {
      await api.post('/tournaments', tournamentData);
      // Clear form
      setTournamentName("");
      setTournamentDescription("");
      setTournamentGameId("");
      setTournamentEntryFee("");
      setTournamentPrizePool("");
      setTournamentMaxParticipants("");
      setTournamentStartsAt("");
      setTournamentEndsAt("");
      alert("Tournament created successfully!");
    } catch (e) {
      console.error(e);
      alert("Creating tournament failed");
    }
  };

  const handleAddEvent = async () => {
    if (!eventName.trim()) {
      alert("Please enter an event name");
      return;
    }

    if (!eventStartsAt) {
      alert("Please select a start date");
      return;
    }

    const startsAt = new Date(eventStartsAt);
    const eventData: any = {
      name: eventName,
      description: eventDescription,
      category: eventCategory,
      starts_at: startsAt.toISOString()
    };

    if (eventEndsAt) {
      const endsAt = new Date(eventEndsAt);
      if (endsAt <= startsAt) {
        alert("End date must be after start date");
        return;
      }
      eventData.ends_at = endsAt.toISOString();
    }

    try {
      await api.post('/events', eventData);
      // Clear form
      setEventName("");
      setEventDescription("");
      setEventCategory("sports");
      setEventStartsAt("");
      setEventEndsAt("");
      alert("Event created successfully!");
    } catch (e) {
      console.error(e);
      alert("Creating event failed");
    }
  };

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
      setAmountInput(""); 
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
        gridTemplateColumns: admin ? "1fr 1fr 1fr" : "1fr 1fr", 
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
                    <div className={`game-icon-mini ${isWon ? 'border-success' : 'border-dim'}`}>
                      {isWon ? '💰' : '📉'}
                    </div>
                    
                    <div>
                      <div className="text-bold" style={{ textTransform: 'uppercase', fontSize: '0.85rem' }}>
                        {bet.type}
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
        
        {/* BLOCK 3: ADMIN PANEL (Games, Tournaments, Events) */}
        {admin && (
          <section className="glass-card">
            <div className="flex-between mb-lg">
              <h3 className="section-title">Admin Panel</h3>
              <span className="status-pill" style={{ background: 'rgba(255, 159, 28, 0.1)', color: '#FF9F1C' }}>Admin</span>
            </div>

            {/* Tab Navigation */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginBottom: '1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '0.5rem'
            }}>
              <button 
                onClick={() => setActiveAdminTab("games")}
                style={{
                  padding: '0.5rem 1rem',
                  background: activeAdminTab === "games" ? 'rgba(59, 255, 178, 0.1)' : 'transparent',
                  color: activeAdminTab === "games" ? 'var(--primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: activeAdminTab === "games" ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                Games
              </button>
              <button 
                onClick={() => setActiveAdminTab("tournaments")}
                style={{
                  padding: '0.5rem 1rem',
                  background: activeAdminTab === "tournaments" ? 'rgba(59, 255, 178, 0.1)' : 'transparent',
                  color: activeAdminTab === "tournaments" ? 'var(--primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: activeAdminTab === "tournaments" ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                Tournaments
              </button>
              <button 
                onClick={() => setActiveAdminTab("events")}
                style={{
                  padding: '0.5rem 1rem',
                  background: activeAdminTab === "events" ? 'rgba(59, 255, 178, 0.1)' : 'transparent',
                  color: activeAdminTab === "events" ? 'var(--primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: activeAdminTab === "events" ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                Events
              </button>
            </div>

            {/* GAMES TAB */}
            {activeAdminTab === "games" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    Game Name
                  </label>
                  <input 
                    type="text" 
                    className="vault-input" 
                    placeholder="e.g., Lucky Slots"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    Category
                  </label>
                  <select 
                    className="vault-input" 
                    value={gameCategory}
                    onChange={(e) => setGameCategory(e.target.value as GameCategory)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    <option value="slots">Slots</option>
                    <option value="dice">Dice</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      Min Bet
                    </label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input 
                        type="number" 
                        className="vault-input" 
                        placeholder="0.00"
                        value={minBet}
                        onChange={(e) => setMinBet(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      Max Bet
                    </label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input 
                        type="number" 
                        className="vault-input" 
                        placeholder="0.00"
                        value={maxBet}
                        onChange={(e) => setMaxBet(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  className="vault-btn deposit" 
                  onClick={handleAddGame}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Create Game
                </button>
              </div>
            )}

            {/* TOURNAMENTS TAB */}
            {activeAdminTab === "tournaments" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    Tournament Name
                  </label>
                  <input 
                    type="text" 
                    className="vault-input" 
                    placeholder="e.g., Weekend Championship"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    Description
                  </label>
                  <textarea 
                    className="vault-input" 
                    placeholder="Tournament details..."
                    value={tournamentDescription}
                    onChange={(e) => setTournamentDescription(e.target.value)}
                    style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    Game ID (Optional)
                  </label>
                  <input 
                    type="text" 
                    className="vault-input" 
                    placeholder="UUID of game"
                    value={tournamentGameId}
                    onChange={(e) => setTournamentGameId(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      Entry Fee
                    </label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input 
                        type="number" 
                        className="vault-input" 
                        placeholder="0.00"
                        value={tournamentEntryFee}
                        onChange={(e) => setTournamentEntryFee(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      Prize Pool
                    </label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input 
                        type="number" 
                        className="vault-input" 
                        placeholder="0.00"
                        value={tournamentPrizePool}
                        onChange={(e) => setTournamentPrizePool(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    Max Participants
                  </label>
                  <input 
                    type="number" 
                    className="vault-input" 
                    placeholder="e.g., 100"
                    value={tournamentMaxParticipants}
                    onChange={(e) => setTournamentMaxParticipants(e.target.value)}
                    min="1"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      Starts At
                    </label>
                    <input 
                      type="datetime-local" 
                      className="vault-input" 
                      value={tournamentStartsAt}
                      onChange={(e) => setTournamentStartsAt(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      Ends At
                    </label>
                    <input 
                      type="datetime-local" 
                      className="vault-input" 
                      value={tournamentEndsAt}
                      onChange={(e) => setTournamentEndsAt(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <button 
                  className="vault-btn deposit" 
                  onClick={handleAddTournament}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Create Tournament
                </button>
              </div>
            )}

            {/* EVENTS TAB */}
            {activeAdminTab === "events" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    Event Name
                  </label>
                  <input 
                    type="text" 
                    className="vault-input" 
                    placeholder="e.g., Super Bowl 2026"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    Description
                  </label>
                  <textarea 
                    className="vault-input" 
                    placeholder="Event details..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    Category
                  </label>
                  <select 
                    className="vault-input" 
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as EventCategory)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    <option value="sports">Sports</option>
                    <option value="esports">Esports</option>
                    <option value="politics">Politics</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      Starts At
                    </label>
                    <input 
                      type="datetime-local" 
                      className="vault-input" 
                      value={eventStartsAt}
                      onChange={(e) => setEventStartsAt(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label className="text-secondary" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      Ends At (Optional)
                    </label>
                    <input 
                      type="datetime-local" 
                      className="vault-input" 
                      value={eventEndsAt}
                      onChange={(e) => setEventEndsAt(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <button 
                  className="vault-btn deposit" 
                  onClick={handleAddEvent}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Create Event
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}