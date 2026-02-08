// src/pages/Social.tsx
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

type User = {
  id: string;
  username: string;
};

type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: User;
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

// --- JWT helper ---
function parseJwt(token: string) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64));
}

export default function Social() {
  const token = localStorage.getItem("access");
  const myId = token ? parseJwt(token).user_id : null;

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [joined, setJoined] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  if (!token || !myId) {
    return <h2>Please login first</h2>;
  }

  // Load chats + tournaments
  useEffect(() => {
    api.get("/chats").then((r) => setChats(r.data));
    api.get("/tournaments").then((r) => setTournaments(r.data));
  }, []);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS connected");
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "new_message") {
        setMessages((m) => [...m, msg.payload]);
      }

      if (msg.type === "typing") {
        setTyping(true);
        setTimeout(() => setTyping(false), 1500);
      }
    };

    ws.onerror = (e) => {
      console.error("WS error", e);
    };

    return () => {
      ws.close();
    };
  }, [token]);

  // Open chat
  const openChat = async (chat: Chat) => {
    setActiveChat(chat);
    const res = await api.get(`/chats/${chat.id}/messages`);
    setMessages(res.data);
  };

  // Send message
  const sendMessage = () => {
    if (!input.trim() || !activeChat) return;

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

  const sendTyping = () => {
    if (!activeChat) return;

    wsRef.current?.send(
      JSON.stringify({
        type: "typing",
        payload: { chat_id: activeChat.id },
      })
    );
  };

  // User search
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const t = setTimeout(async () => {
      const res = await api.get(`/users/search?q=${search}`);
      setResults(res.data);
    }, 300);

    return () => clearTimeout(t);
  }, [search]);

  // Start or reuse chat
  const startChat = async (user: User) => {
    try {
      const res = await api.post("/chats", { user_id: user.id });
      setChats((c) => [res.data, ...c]);
      openChat(res.data);
    } catch (err: any) {
      if (err.response?.status === 409) {
        const res = await api.get("/chats");
        setChats(res.data);

        const existing = res.data.find(
          (c: Chat) =>
            c.user1_id === user.id || c.user2_id === user.id
        );

        if (existing) openChat(existing);
      }
    }

    setResults([]);
    setSearch("");
  };

  // Tournament join
  const joinTournament = async (id: string) => {
    try {
      await api.post(`/tournaments/${id}/join`);
    } finally {
      setJoined((j) => [...j, id]);
    }
  };

  return (
    <div style={{ display: "flex", height: "80vh" }}>
      {/* Sidebar */}
      <div style={{ width: 300, borderRight: "1px solid #ddd", padding: 10 }}>
        <h3>Search users</h3>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="username..."
          style={{ width: "100%" }}
        />

        {results.map((u) => (
          <div key={u.id} onClick={() => startChat(u)}>
            ➕ {u.username}
          </div>
        ))}

        <h3 style={{ marginTop: 20 }}>Chats</h3>
        {chats.map((c) => {
          const other =
            c.user1.id === myId ? c.user2 : c.user1;

          return (
            <div
              key={c.id}
              onClick={() => openChat(c)}
              style={{
                padding: 10,
                cursor: "pointer",
                background:
                  activeChat?.id === c.id ? "#eee" : "",
              }}
            >
              {other.username}
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {c.messages?.[c.messages.length - 1]?.content}
              </div>
            </div>
          );
        })}

        <h3 style={{ marginTop: 20 }}>Tournaments</h3>
        {tournaments.map((t) => (
          <button
            key={t.id}
            disabled={joined.includes(t.id)}
            onClick={() => joinTournament(t.id)}
            style={{ display: "block", width: "100%" }}
          >
            {joined.includes(t.id)
              ? `Joined ${t.name}`
              : `Join ${t.name}`}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div style={{ flex: 1, padding: 10 }}>
        {activeChat ? (
          <>
            <div style={{ height: "70vh", overflowY: "auto" }}>
              {messages.map((m) => (
                <div key={m.id}>
                  <b>
                    {m.sender_id === myId
                      ? "You"
                      : m.sender?.username}
                    :
                  </b>{" "}
                  {m.content}
                </div>
              ))}
              {typing && <i>Typing...</i>}
            </div>

            <div style={{ display: "flex" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={sendTyping}
                style={{ flex: 1 }}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <h3>Select a chat</h3>
        )}
      </div>
    </div>
  );
}
