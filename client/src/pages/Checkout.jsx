import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatRupees } from "../api.js";
import { loadRazorpayScript } from "../lib/razorpay.js";

export default function Checkout() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [form, setForm] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await api("/cart");
        if (cancel) return;
        setItems(data.items || []);
      } catch (e) {
        if (!cancel) setErr(e.message);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const subtotal = items.reduce((s, i) => s + i.product.pricePaise * i.quantity, 0);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const payload = {
        ...form,
        paymentMethod,
      };
      const res = await api("/orders/checkout", { method: "POST", body: payload });

      if (paymentMethod === "COD") {
        setBusy(false);
        navigate(`/orders/${res.order.id}`, { replace: true });
        return;
      }

      const rz = res.razorpay;
      if (!rz?.keyId || !rz?.orderId) {
        throw new Error(res.order?.id ? "Payment gateway not configured on server." : "Invalid checkout response");
      }

      const Razorpay = await loadRazorpayScript();
      const orderId = res.order.id;

      const options = {
        key: rz.keyId,
        amount: rz.amount,
        currency: rz.currency || "INR",
        order_id: rz.orderId,
        name: "New Rajaram Estore",
        description: `Order ${orderId}`,
        handler: async function (response) {
          try {
            await api("/payments/verify", {
              method: "POST",
              body: {
                orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });
            navigate(`/orders/${orderId}`, { replace: true });
          } catch (verErr) {
            setErr(verErr.message || "Payment verify failed — check My orders or contact shop.");
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
        theme: { color: "#1a5f2a" },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: "2rem 0" }}>
        <p>Your cart is empty.</p>
        <Link to="/products">Shop</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "1.5rem 0 3rem", maxWidth: 640 }}>
      <h1 style={{ marginTop: 0 }}>Checkout</h1>
      {err && <div className="alert alert-error">{err}</div>}

      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid var(--color-border)" }}>
        <h3 style={{ marginTop: 0 }}>Order summary</h3>
        <ul style={{ paddingLeft: "1.2rem", margin: "0 0 0.5rem" }}>
          {items.map((i) => (
            <li key={i.productId}>
              {i.product.name} × {i.quantity} — {formatRupees(i.product.pricePaise * i.quantity)}
            </li>
          ))}
        </ul>
        <strong>Total: {formatRupees(subtotal)}</strong>
      </div>

      <form className="form" onSubmit={submit} style={{ maxWidth: "100%" }}>
        <label>
          Address line 1
          <input required value={form.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} />
        </label>
        <label>
          Address line 2
          <input value={form.addressLine2} onChange={(e) => update("addressLine2", e.target.value)} />
        </label>
        <div className="form-row-2">
          <label>
            City
            <input required value={form.city} onChange={(e) => update("city", e.target.value)} />
          </label>
          <label>
            State
            <input required value={form.state} onChange={(e) => update("state", e.target.value)} />
          </label>
        </div>
        <div className="form-row-2">
          <label>
            PIN code
            <input required minLength={3} value={form.pincode} onChange={(e) => update("pincode", e.target.value)} />
          </label>
          <label>
            Phone
            <input required minLength={10} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </label>
        </div>
        <label>
          Notes (optional)
          <textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </label>

        <fieldset style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "1rem" }}>
          <legend style={{ fontWeight: 600 }}>Payment</legend>
          <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
            <input type="radio" name="pm" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
            Cash on delivery / pay when you receive
          </label>
          <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem" }}>
            <input type="radio" name="pm" checked={paymentMethod === "ONLINE"} onChange={() => setPaymentMethod("ONLINE")} />
            Pay online (UPI / card / netbanking via Razorpay)
          </label>
          {paymentMethod === "ONLINE" && (
            <p className="pwa-hint" style={{ marginBottom: 0 }}>
              Configure <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> on the server. Use test keys while developing.
            </p>
          )}
        </fieldset>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Processing…" : paymentMethod === "ONLINE" ? "Pay now" : "Place order"}
        </button>
        <Link to="/cart" style={{ marginLeft: "0.5rem" }}>
          Back to cart
        </Link>
      </form>
    </div>
  );
}
