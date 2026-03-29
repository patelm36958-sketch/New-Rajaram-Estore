import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await api("/admin/dashboard");
        if (cancel) return;
        setStats(data);
      } catch (e) {
        if (!cancel) setErr(e.message);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      {err && <div className="alert alert-error">{err}</div>}
      {stats && (
        <div className="grid-products" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          <div className="card card-body">
            <h3 className="card-title" style={{ marginTop: 0 }}>
              Orders today
            </h3>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>{stats.todayOrders}</p>
            <Link to="/admin/orders">View orders</Link>
          </div>
          <div className="card card-body">
            <h3 className="card-title" style={{ marginTop: 0 }}>
              Low stock (≤10)
            </h3>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>{stats.lowStockCount}</p>
            <Link to="/admin/products">Manage products</Link>
          </div>
          <div className="card card-body">
            <h3 className="card-title" style={{ marginTop: 0 }}>
              Active products
            </h3>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>{stats.activeProducts}</p>
          </div>
          <div className="card card-body">
            <h3 className="card-title" style={{ marginTop: 0 }}>
              Pending online payments
            </h3>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>{stats.pendingOnlinePayments}</p>
          </div>
        </div>
      )}
    </>
  );
}
