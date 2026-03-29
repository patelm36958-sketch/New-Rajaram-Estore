import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupees } from "../api.js";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [c, p] = await Promise.all([
          api("/categories"),
          api("/products"),
        ]);
        if (cancel) return;
        setCategories(c.categories || []);
        setFeatured((p.products || []).slice(0, 6));
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
      <section className="hero">
        <div className="container">
          <h1>New Rajaram Estore</h1>
          <p>
            Fresh groceries and daily needs. Browse staples, spices, oil, snacks, and more. Add to cart,
            pay online or cash on delivery, and track your order.
          </p>
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/products" className="btn btn-secondary" style={{ background: "#fff", color: "var(--color-forest)" }}>
              Start shopping
            </Link>
            <Link to="/register" className="btn" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
              Create account
            </Link>
          </div>
          <p className="pwa-hint" style={{ color: "rgba(255,255,255,0.85)", marginTop: "1rem" }}>
            Tip: On Android, use your browser menu → “Install app” or “Add to Home screen” for a quick shortcut.
          </p>
        </div>
      </section>

      <div className="container" style={{ paddingBottom: "3rem" }}>
        {err && <div className="alert alert-error">{err}</div>}

        <h2 style={{ marginTop: 0 }}>Categories</h2>
        <div className="grid-products" style={{ marginBottom: "2.5rem" }}>
          {categories.map((c) => (
            <Link key={c.id} to={`/products?category=${encodeURIComponent(c.slug)}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card-body">
                <span className="badge">{c.productCount} items</span>
                <h3 className="card-title" style={{ fontFamily: "var(--font-display)" }}>
                  {c.name}
                </h3>
                {c.description && <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-muted)" }}>{c.description}</p>}
              </div>
            </Link>
          ))}
        </div>

        <h2>Popular picks</h2>
        <div className="grid-products">
          {featured.map((p) => (
            <Link key={p.id} to={`/products/${p.slug}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
              {p.imageUrl ? (
                <img className="card-img" src={p.imageUrl} alt="" loading="lazy" />
              ) : (
                <div className="card-img" style={{ display: "grid", placeItems: "center", color: "var(--color-muted)" }}>
                  No image
                </div>
              )}
              <div className="card-body">
                <h3 className="card-title">{p.name}</h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-muted)" }}>{p.unitLabel}</p>
                <p className="price" style={{ margin: 0 }}>
                  {formatRupees(p.pricePaise)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
