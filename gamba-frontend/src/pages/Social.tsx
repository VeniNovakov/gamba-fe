import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

type User = {
  id: string;
  username: string;
};

type Friend = {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  user: User;
  friend: User;
};

type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Chat = {
  id: string;
  user1_id: string;
  user2_id: string;
  user1: User;
  user2: User;
  messages: Message[];
};

type Tournament = {
  id: string;
  name: string;
};

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    return JSON.parse(atob(base64Url));
  } catch (e) {
    return null;
  }
}

export default function Social() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");
  const myId = token ? parseJwt(token)?.user_id : null;

  // Data States
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  
  // UI States
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [joinedTournaments, setJoinedTournaments] = useState<Set<string>>(new Set());
  const [loadingJoin, setLoadingJoin] = useState<string | null>(null);

  // Modal States
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [moneyUser, setMoneyUser] = useState<User | null>(null);
  const [moneyAmount, setMoneyAmount] = useState("");
  const [transferStatus, setTransferStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !myId) return;

    Promise.all([
      api.get("/chats"),
      api.get("/friends"),
      api.get("/tournaments"),
    ]).then(([chatsRes, friendsRes, tourneyRes]) => {
      setChats(chatsRes.data);
      setFriends(friendsRes.data);
      setTournaments(tourneyRes.data);
    }).catch(err => console.error("Failed to load social data", err));

    const ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "new_message") {
        setMessages((prev) => [...prev, msg.payload]);
      }
    };

    return () => ws.close();
  }, [token, myId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  // --- Handlers ---

  const getChatUser = (chat: Chat) =>
    chat.user1_id === myId ? chat.user2 : chat.user1;

  const openChat = async (chat: Chat) => {
    setActiveChat(chat);
    try {
      const res = await api.get(`/chats/${chat.id}/messages`);
      setMessages(res.data);
    } catch (e) {
      console.error("Failed to load messages");
    }
  };

  const sendMessage = () => {
      if (!input.trim() || !activeChat) return;

      const optimistic: Message = {
        id: crypto.randomUUID(), // temp id
        chat_id: activeChat.id,
        sender_id: myId,
        content: input,
        created_at: new Date().toISOString(),
      };

      // show instantly
      setMessages((m) => [...m, optimistic]);

      // send to server
      wsRef.current?.send(
        JSON.stringify({
          type: "send_message",
          payload: {
            chat_id: activeChat.id,
            content: input,
          },
        })
      );

      setInput("");
    };
  const handleAddFriend = async (userId: string) => {
    try {
      await api.post(`/friends`, { friend_id: userId });
      alert("Friend request sent!");
      setSearch(""); 
    } catch (err) {
      alert("Could not add friend.");
    }
  };


  const handleUnfriend = async (friendshipId: string, friendName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${friendName} from your friends?`)) return;

    try {
      await api.delete(`/friends/${friendshipId}`);
      
      setFriends(prev => prev.filter(f => f.id !== friendshipId));
      
      if (activeChat) {
        const otherUser = getChatUser(activeChat);
        if (otherUser.username === friendName) {
          setActiveChat(null);
          setMessages([]);
        }
      }
    } catch (err) {
      alert("Failed to unfriend user. Please try again.");
    }
  };
  useEffect(() => {
      if (!search.trim()) return setSearchResults([]);
      const t = setTimeout(async () => {
        try {
          const res = await api.get(`/users/search?q=${search}`);
          setSearchResults(res.data);
        } catch (e) {
          console.error("Search failed", e);
        }
      }, 400);
      return () => clearTimeout(t);
    }, [search]);

  const handleJoinTournament = async (tId: string) => {
    setLoadingJoin(tId);
    try {
      await api.post(`/tournaments/${tId}/join`);
      setJoinedTournaments(prev => new Set(prev).add(tId));
    } catch (error) {
      console.error("Join error", error);
    } finally {
      setLoadingJoin(null);
    }
  };

  const openSendMoneyModal = (user: User) => {
    setMoneyUser(user);
    setMoneyAmount("");
    setTransferStatus("idle");
    setShowMoneyModal(true);
  };

  const handleTransfer = async () => {
    if (!moneyAmount || !moneyUser) return;
    setTransferStatus("sending");
    try {
      await api.post('/transactions/transfer', { to_user_id: moneyUser.id, amount: Number(moneyAmount) });
      setTransferStatus("success");
      alert(`Successfully sent $${moneyAmount} to ${moneyUser.username}`);
      setTimeout(() => setShowMoneyModal(false), 1500);
    } catch (e) {
      setTransferStatus("error");
    }
  };

  if (!token || !myId) return <div className="page">Please Login</div>;

  return (
    <div className="page">
      <div className="social-grid">
        
        <div className="card" style={{ padding: "1.5rem", overflowY: "auto" }}>
          <h3 className="text-accent mb-lg">Social Hub</h3>
          <div className="mb-lg">
            <input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div style={{ flex: 1 }}>
            
            {searchResults.length > 0 && (
                <div className="sidebar-section">
                    <div className="section-title text-accent">Global Search</div>
                    {searchResults.map((u) => (
                        <div key={u.id} className="list-item">
                            <span>{u.username}</span>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAddFriend(u.id)}
                            >
                              Add
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>
          <div className="sidebar-section">
            <div className="section-title">Active Chats</div>
            {chats.map((c) => (
              <div key={c.id} className={`list-item ${activeChat?.id === c.id ? 'active' : ''}`} onClick={() => openChat(c)}>
                <span className="text-bold">{getChatUser(c).username}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="section-title">Friends</div>
            {friends.map((f) => {
              const u = f.user_id === myId ? f.friend : f.user;
              return (
                <div key={f.id} className="list-item" style={{ gap: "0.5rem" }}>
                  <span style={{ flex: 1 }}>{u.username}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => openSendMoneyModal(u)} title="Send Credits">$</button>
                  
                  <button 
                    className="btn btn-secondary btn-sm btn-danger-hover" 
                    onClick={(e) => { e.stopPropagation(); handleUnfriend(f.id, u.username); }}
                    title="Remove Friend"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <div className="sidebar-section">
            <div className="section-title">Tournaments</div>
            {tournaments.map((t) => (
              <div key={t.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div className="text-bold">{t.name}</div>
                <div className="flex-row mt-sm" style={{ width: '100%' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/tournaments/${t.id}`)}>View</button>
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ flex: 1 }} 
                    disabled={joinedTournaments.has(t.id)}
                    onClick={() => handleJoinTournament(t.id)}
                  >
                    {joinedTournaments.has(t.id) ? "Joined" : "Join"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card chat-container">
          {activeChat ? (
            <>
              <div className="chat-header">
                <h3 className="text-accent">{getChatUser(activeChat).username}</h3>
              </div>
              <div className="messages-area">
                {messages.map((m) => (
                  <div key={m.id} className={`message-bubble ${m.sender_id === myId ? 'msg-mine' : 'msg-theirs'}`}>
                    {m.content}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-area">
                <input placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                <button className="btn btn-primary" onClick={sendMessage}>Send</button>
              </div>
            </>
          ) : (
            <div className="chat-empty-state">
              <h2>Select a conversation</h2>
            </div>
          )}
        </div>
      </div>

      {showMoneyModal && moneyUser && (
        <div className="modal-overlay" onClick={() => setShowMoneyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="mb-lg">Transfer Credits</h3>
            <p className="mb-lg">Sending to <span className="text-accent">{moneyUser.username}</span></p>
            <input type="number" placeholder="0.00" value={moneyAmount} onChange={e => setMoneyAmount(e.target.value)} />
            <div className="flex-row mt-lg" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowMoneyModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleTransfer}>Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}