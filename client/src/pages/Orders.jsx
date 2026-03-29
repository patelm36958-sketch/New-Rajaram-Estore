import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupees } from "../api.js";

const STATUS_LABEL = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await api("/orders/mine");
        if (cancel) return;
        setOrders(data.orders || []);
      } catch (e) {
        if (!cancel) setErr(e.message);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="container" style={{ padding: "1.5rem 0 3rem" }}>
      <h1 style={{ marginTop: 0 }}>My orders</h1>
      {err && <div className="alert alert-error">{err}</div>}

      {orders.length === 0 ? (
        <p>
          No orders yet. <Link to="/products">Shop</Link>
        </p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                  <td>{formatRupees(o.totalPaise)}</td>
                  <td>
                    {o.paymentMethod}
                    <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>{o.paymentStatus}</div>
                  </td>
                  <td>{STATUS_LABEL[o.orderStatus] || o.orderStatus}</td>
                  <td>
                    <Link to={`/orders/${o.id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
