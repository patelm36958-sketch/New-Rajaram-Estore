import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, formatRupees } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { readGuestCart, writeGuestCart } from "../lib/cartStorage.js";

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await api(`/products/${encodeURIComponent(slug)}`);
        if (cancel) return;
        setProduct(data.product);
      } catch (e) {
        if (!cancel) setErr(e.message);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [slug]);

  async function addToCart() {
    setMsg("");
    setErr("");
    if (!product || product.stock <= 0) return;
    const n = Math.min(Math.max(1, qty), product.stock);

    try {
      if (user) {
        if (user.role !== "customer") {
          setErr("Log in as a customer to add to cart.");
          return;
        }
        await api("/cart/items", {
          method: "PUT",
          body: { productId: product.id, quantity: n },
        });
        setMsg("Added to cart.");
      } else {
        const guest = readGuestCart().filter((i) => i.productId !== product.id);
        guest.push({ productId: product.id, quantity: n });
        writeGuestCart(guest);
        setMsg("Added to cart (saved on this device). Log in to sync.");
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  if (err && !product) {
    return (
      <div className="container" style={{ padding: "2rem 0" }}>
        <div className="alert alert-error">{err}</div>
        <Link to="/products">Back to shop</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: "2rem 0" }}>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "1.5rem 0 3rem", maxWidth: 900 }}>
      <Link to="/products" style={{ fontSize: "0.9rem" }}>
        ← Back to shop
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "2rem", marginTop: "1rem" }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" style={{ width: "100%", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }} />
        ) : (
          <div style={{ background: "#e8e4dc", borderRadius: "var(--radius)", aspectRatio: "1", display: "grid", placeItems: "center" }}>
            No image
          </div>
        )}
        <div>
          <span className="badge">{product.category?.name}</span>
          <h1 style={{ margin: "0.5rem 0" }}>{product.name}</h1>
          <p className="price" style={{ fontSize: "1.35rem" }}>
            {formatRupees(product.pricePaise)}
            <span style={{ fontWeight: 500, fontSize: "1rem", color: "var(--color-muted)" }}> / {product.unitLabel}</span>
          </p>
          {product.description && <p style={{ color: "var(--color-muted)" }}>{product.description}</p>}

          {product.stock <= 0 ? (
            <p className="badge badge-warn" style={{ marginTop: "1rem" }}>
              Out of stock
            </p>
          ) : (
            <>
              <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  Qty
                  <input
                    type="number"
                    min={1}
                    max={product.stock}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value) || 1)}
                    style={{ width: 72, padding: "0.4rem", borderRadius: 8, border: "1px solid var(--color-border)" }}
                  />
                </label>
                <button type="button" className="btn btn-primary" onClick={addToCart}>
                  Add to cart
                </button>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-muted)" }}>{product.stock} in stock</p>
            </>
          )}

          {msg && <div className="alert" style={{ marginTop: "1rem" }}>{msg}</div>}
         
          {err && <div className="alert alert-error" style={{ marginTop: "1rem" }}>{err}</div>}
        </div>
      </div>
    </div>
  );
}
