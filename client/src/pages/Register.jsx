import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import { readGuestCart, clearGuestCart } from "../lib/cartStorage.js";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });
  const [err, setErr] = useState("");

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const user = await register({
        email: form.email,
        password: form.password,
        name: form.name || undefined,
        phone: form.phone || undefined,
      });
      const guest = readGuestCart();
      if (guest.length > 0) {
        try {
          await api("/cart/merge", { method: "POST", body: { items: guest } });
          clearGuestCart();
        } catch {
          /* merge best-effort */
        }
      }
      navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 440 }}>
      <h1 style={{ marginTop: 0 }}>Create account</h1>
      {err && <div className="alert alert-error">{err}</div>}
      <form className="form" onSubmit={onSubmit}>
        <label>
          Name (optional)
          <input value={form.name} onChange={(e) => update("name", e.target.value)} />
        </label>
        <label>
          Phone (optional)
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
        </label>
        <label>
          Password (min 6 characters)
          <input type="password" minLength={6} required value={form.password} onChange={(e) => update("password", e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary">
          Sign up
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
