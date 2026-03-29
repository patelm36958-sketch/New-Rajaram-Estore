import { useEffect, useState } from "react";
import { api, formatRupees } from "../api.js";

const STATUSES = [
  "placed",
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("");

  async function load() {
    const qs = filter ? `?status=${encodeURIComponent(filter)}` : "";
    const data = await api(`/admin/orders${qs}`);
    setOrders(data.orders || []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [filter]);

  async function setStatus(id, orderStatus) {
    setErr("");
    try {
      await api(`/admin/orders/${id}/status`, { method: "PATCH", body: { orderStatus } });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Orders</h1>
      {err && <div className="alert alert-error">{err}</div>}

      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontWeight: 600 }}>Filter:</span>
        <button type="button" className={`btn ${filter === "" ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter("")}>
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`btn ${filter === s ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter(s)}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Order status</th>
              <th>Set status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td>
                  {o.user?.name || o.user?.email}
                  <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>{o.phone}</div>
                </td>
                <td>{formatRupees(o.totalPaise)}</td>
                <td>
                  {o.paymentMethod} / {o.paymentStatus}
                </td>
                <td>{o.orderStatus}</td>
                <td>
                  <select
                    value={o.orderStatus}
                    onChange={(e) => setStatus(o.id, e.target.value)}
                    style={{ maxWidth: 160 }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
