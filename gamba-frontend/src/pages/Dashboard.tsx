// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { api } from "../api/client";

type User = {
  username: string;
  balance: number;
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.get("users/me").then((r) => setUser(r.data));
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h2>Welcome {user.username}</h2>
      <h3>Balance: ${user.balance}</h3>

      <button
        onClick={() =>
          api.post("/transactions/deposit", { amount: 100 })
        }
      >
        Deposit $100
      </button>

      <button
        onClick={() =>
          api.post("/transactions/withdraw", { amount: 50 })
        }
      >
        Withdraw $50
      </button>
    </div>
  );
}
