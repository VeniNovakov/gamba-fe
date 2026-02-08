// src/pages/Auth.tsx
import { api } from "../api/client";

export default function Auth() {
  const login = async () => {
    const username = (document.getElementById("u") as HTMLInputElement).value;
    const password = (document.getElementById("p") as HTMLInputElement).value;

    const res = await api.post("auth/login", { username, password });
    localStorage.setItem("access", res.data.tokens.access_token);
    window.location.href = "/dashboard";
  };

  return (
    <div style={{ padding: 50 }}>
      <h1>GAMBA</h1>
      <input id="u" placeholder="Username" />
      <br />
      <input id="p" type="password" placeholder="Password" />
      <br />
      <button onClick={login}>Login</button>
    </div>
  );
}
