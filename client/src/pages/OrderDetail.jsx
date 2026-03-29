import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, formatRupees } from "../api.js";

const STATUS_ORDER = ["placed", "confirmed", "packed", "out_for_delivery", "delivered"];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await api(`/orders/mine/${encodeURIComponent(id)}`);
        if (cancel) return;
        setOrder(data.order);
      } catch (e) {
        if (!cancel) setErr(e.message);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  if (err || !order) {
    return (
      <div className="container" style={{ padding: "2rem 0" }}>
        {err ? <div className="alert alert-error">{err}</div> : <p>Loading…</p>}
        <Link to="/orders">Back to orders</Link>
      </div>
    );
  }

  const idx = STATUS_ORDER.indexOf(order.orderStatus);
  const cancelled = order.orderStatus === "cancelled";

  return (
    <div className="container" style={{ padding: "1.5rem 0 3rem", maxWidth: 720 }}>
      <Link to="/orders">← My orders</Link>
      <h1 style={{ marginTop: "1rem" }}>Order</h1>
      <p style={{ color: "var(--color-muted)" }}>
        {new Date(order.createdAt).toLocaleString()} · #{order.id.slice(0, 8)}
      </p>

      <div style={{ margin: "1.5rem 0" }}>
        <strong>Status</strong>
        {cancelled ? (
          <p className="badge badge-warn">Cancelled</p>
        ) : (
          <ol style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem" }}>
            {STATUS_ORDER.map((s, i) => (
              <li
                key={s}
                style={{
                  fontWeight: i <= idx ? 600 : 400,
                  color: i <= idx ? "var(--color-forest)" : "var(--color-muted)",
                }}
              >
                {s.replace(/_/g, " ")}
                {order.orderStatus === s && " — current"}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="card" style={{ padding: "1rem", marginBottom: "1rem", border: "1px solid var(--color-border)" }}>
        <h3 style={{ marginTop: 0 }}>Delivery</h3>
        <p style={{ margin: 0 }}>
          {order.addressLine1}
          {order.addressLine2 ? `, ${order.addressLine2}` : ""}
        </p>
        <p style={{ margin: "0.25rem 0 0" }}>
          {order.city}, {order.state} — {order.pincode}
        </p>
        <p style={{ margin: "0.25rem 0 0" }}>Phone: {order.phone}</p>
        {order.notes && <p style={{ marginTop: "0.5rem" }}>Notes: {order.notes}</p>}
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((l) => (
              <tr key={l.id}>
                <td>
                  {l.productName}
                  <div style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>{l.unitLabel}</div>
                </td>
                <td>{l.quantity}</td>
                <td>{formatRupees(l.unitPricePaise)}</td>
                <td>{formatRupees(l.lineTotalPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: "1rem" }}>
        <strong>Payment:</strong> {order.paymentMethod} — {order.paymentStatus}
      </p>
      <p>
        <strong>Total:</strong> {formatRupees(order.totalPaise)}
      </p>
    </div>
  );
}
