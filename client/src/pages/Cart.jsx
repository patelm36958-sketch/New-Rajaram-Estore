import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupees } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  readGuestCart,
  writeGuestCart,
  clearGuestCart,
} from "../lib/cartStorage.js";

export default function Cart() {
  const { user, loading } = useAuth();
  const [lines, setLines] = useState([]);
  const [err, setErr] = useState("");

  const loadServer = useCallback(async () => {
    const data = await api("/cart");
    setLines(data.items || []);
  }, []);

  const loadGuest = useCallback(async () => {
    const guest = readGuestCart();
    if (guest.length === 0) {
      setLines([]);
      return;
    }
    const { products } = await api("/products");
    const byId = Object.fromEntries((products || []).map((p) => [p.id, p]));
    setLines(
      guest
        .map((g) => {
          const p = byId[g.productId];
          if (!p || !p.isActive) return null;
          return { productId: g.productId, quantity: g.quantity, product: p };
        })
        .filter(Boolean)
    );
  }, []);

  useEffect(() => {
    if (loading) return;
    let cancel = false;
    (async () => {
      try {
        setErr("");
        if (user && user.role === "customer") await loadServer();
        else await loadGuest();
      } catch (e) {
        if (!cancel) setErr(e.message);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [user, loading, loadServer, loadGuest]);

  async function setQty(productId, quantity, product) {
    try {
      if (user && user.role === "customer") {
        await api("/cart/items", {
          method: "PUT",
          body: { productId, quantity },
        });
        await loadServer();
      } else {
        const guest = readGuestCart();
        const next = guest.filter((i) => i.productId !== productId);
        const max = product?.stock ?? quantity;
        const q = Math.min(Math.max(0, quantity), max);
        if (q > 0) next.push({ productId, quantity: q });
        writeGuestCart(next);
        await loadGuest();
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  async function clearCart() {
    try {
      if (user && user.role === "customer") {
        await api("/cart", { method: "DELETE" });
        await loadServer();
      } else {
        clearGuestCart();
        setLines([]);
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  const subtotal = lines.reduce((s, i) => s + i.product.pricePaise * i.quantity, 0);

  return (
    <div className="container" style={{ padding: "1.5rem 0 3rem" }}>
      <h1 style={{ marginTop: 0 }}>Cart</h1>
      {err && <div className="alert alert-error">{err}</div>}

      {lines.length === 0 ? (
        <p>
          Your cart is empty. <Link to="/products">Continue shopping</Link>
        </p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Line total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((i) => (
                  <tr key={i.productId}>
                    <td>
                      <Link to={`/products/${i.product.slug}`}>{i.product.name}</Link>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>{i.product.unitLabel}</div>
                    </td>
                    <td>{formatRupees(i.product.pricePaise)}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={i.product.stock}
                        value={i.quantity}
                        onChange={(e) =>
                          setQty(i.productId, Number(e.target.value) || 0, i.product)
                        }
                        style={{ width: 64 }}
                      />
                    </td>
                    <td>{formatRupees(i.product.pricePaise * i.quantity)}</td>
                    <td>
                      <button type="button" className="btn btn-ghost" onClick={() => setQty(i.productId, 0, i.product)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <strong>Subtotal:</strong> {formatRupees(subtotal)}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-secondary" onClick={clearCart}>
                Clear cart
              </button>
              {user && user.role === "customer" ? (
                <Link to="/checkout" className="btn btn-primary" style={{ textDecoration: "none" }}>
                  Checkout
                </Link>
              ) : (
                <Link to="/login" state={{ from: "/checkout" }} className="btn btn-primary" style={{ textDecoration: "none" }}>
                  Log in to checkout
                </Link>
              )}
            </div>
          </div>
          {user && user.role !== "customer" && (
            <p className="alert" style={{ marginTop: "1rem" }}>
              Admin accounts cannot place customer orders. Use the demo customer account or register a new customer.
            </p>
          )}
        </>
      )}
    </div>
  );
}
