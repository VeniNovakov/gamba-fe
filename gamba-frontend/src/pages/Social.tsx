// src/pages/Social.tsx
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

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

type FriendRequest = {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "rejected";
  user: User;
  friend: User;
};

type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
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

  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  if (!token || !myId) {
    return <h2>Please login first</h2>;
  }

  const getFriendUser = (f: Friend): User => {
    return f.user_id === myId ? f.friend : f.user;
  };

  useEffect(() => {
    api.get("/chats").then((r) => setChats(r.data));
    api.get("/tournaments").then((r) => setTournaments(r.data));
    api.get("/friends").then((r) => setFriends(r.data));
    api.get("/friends/requests").then((r) => setIncoming(r.data));
    api.get("/friends/sent").then((r) => setSent(r.data));
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "new_message") {
        setMessages((m) => {
          if (m.some((x) => x.id === msg.payload.id)) return m;
          return [...m, msg.payload];
        });
      }

      if (msg.type === "message_read") {
        setMessages((m) =>
          m.map((x) =>
            x.chat_id === msg.payload.chat_id && !x.read_at
              ? { ...x, read_at: new Date().toISOString() }
              : x
          )
        );
      }

      if (msg.type === "typing") {
        setTyping(true);
        setTimeout(() => setTyping(false), 1500);
      }
    };

    return () => ws.close();
  }, [token]);

  const openChat = async (chat: Chat) => {
    setActiveChat(chat);
    const res = await api.get(`/chats/${chat.id}/messages`);
    setMessages(res.data);
    
    // Mark as read
    await api.post(`/chats/${chat.id}/read`);
  };

const sendMessage = () => {
  if (!input.trim() || !activeChat) return;

  const newMessage: Message = {
    id: crypto.randomUUID(),
    chat_id: activeChat.id,
    sender_id: myId,
    content: input,
    created_at: new Date().toISOString(),
  };

  setMessages((m) => [...m, newMessage]);

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
          (c: Chat) => c.user1_id === user.id || c.user2_id === user.id
        );

        if (existing) openChat(existing);
      }
    }

    setResults([]);
    setSearch("");
  };

  const sendFriendRequest = async (id: string) => {
    await api.post("/friends/request", { user_id: id });
    const res = await api.get("/friends/sent");
    setSent(res.data);
  };

  const acceptRequest = async (id: string) => {
    await api.post(`/friends/${id}/accept`);
    setIncoming((r) => r.filter((x) => x.id !== id));
    const res = await api.get("/friends");
    setFriends(res.data);
  };

  const rejectRequest = async (id: string) => {
    await api.post(`/friends/${id}/reject`);
    setIncoming((r) => r.filter((x) => x.id !== id));
  };

  const removeFriend = async (id: string) => {
    await api.delete(`/friends/${id}`);
    setFriends((f) => f.filter((x) => getFriendUser(x).id !== id));
  };

  const joinTournament = async (id: string) => {
    await api.post(`/tournaments/${id}/join`);
    setJoined((j) => [...j, id]);
  };

  return (
    <div style={{ display: "flex", height: "80vh" }}>
      <div style={{ width: 320, borderRight: "1px solid #ddd", padding: 10 }}>
        <h3>Search users</h3>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="username..."
          style={{ width: "100%" }}
        />

        {results.map((u) => (
          <div key={u.id} style={{ display: "flex", gap: 5 }}>
            {u.username}
            <button onClick={() => sendFriendRequest(u.id)}>Add</button>
            <button onClick={() => startChat(u)}>Chat</button>
          </div>
        ))}

        <h3 style={{ marginTop: 20 }}>Friend Requests</h3>
        {incoming.map((r) => (
          <div key={r.id} style={{ display: "flex", gap: 5 }}>
            {r.user?.username}
            <button onClick={() => acceptRequest(r.id)}>Accept</button>
            <button onClick={() => rejectRequest(r.id)}>Reject</button>
          </div>
        ))}

        <h3 style={{ marginTop: 20 }}>Friends</h3>
        {friends.map((f) => {
          const friendUser = getFriendUser(f);
          return (
            <div key={f.id} style={{ display: "flex", gap: 5 }}>
              {friendUser.username}
              <button onClick={() => startChat(friendUser)}>Chat</button>
              <button onClick={() => removeFriend(friendUser.id)}>Remove</button>
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
            {joined.includes(t.id) ? `Joined ${t.name}` : `Join ${t.name}`}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: 10 }}>
        {activeChat ? (
          <>
            <div style={{ height: "70vh", overflowY: "auto" }}>
              {messages.map((m) => (
                <div key={m.id}>
                  <b>{m.sender_id === myId ? "You" : m.sender?.username}:</b>{" "}
                  {m.content}
                  <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {m.sender_id === myId && (
                      <span style={{ marginLeft: 4 }}>
                        {m.read_at ? `✓✓ ${new Date(m.read_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "✓"}
                      </span>
                    )}
                  </span>
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