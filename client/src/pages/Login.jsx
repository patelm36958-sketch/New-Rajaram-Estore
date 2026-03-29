import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import { readGuestCart, clearGuestCart } from "../lib/cartStorage.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const user = await login(email, password);
      const guest = readGuestCart();
      if (guest.length > 0 && user.role === "customer") {
        try {
          await api("/cart/merge", { method: "POST", body: { items: guest } });
          clearGuestCart();
        } catch {
          /* merge best-effort */
        }
      }
      navigate(user.role === "admin" ? "/admin" : from, { replace: true });
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 440 }}>
      <h1 style={{ marginTop: 0 }}>Log in</h1>
      {err && <div className="alert alert-error">{err}</div>}
      <form className="form" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary">
          Log in
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        No account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  );
}
