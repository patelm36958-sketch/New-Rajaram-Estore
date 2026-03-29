import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, formatRupees } from "../api.js";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [localQ, setLocalQ] = useState(q);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    return p.toString() ? `?${p.toString()}` : "";
  }, [q, category]);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const [c, path] = await Promise.all([
          api("/categories"),
          api(`/products${queryString ? queryString : ""}`),
        ]);
        if (cancel) return;
        setCategories(c.categories || []);
        setProducts(path.products || []);
        setErr("");
      } catch (e) {
        if (!cancel) setErr(e.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [queryString]);

  function applySearch(e) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (localQ) next.set("q", localQ);
    else next.delete("q");
    setSearchParams(next);
  }

  function setCategory(slug) {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    setSearchParams(next);
  }

  return (
    <div className="container" style={{ padding: "1.5rem 0 3rem" }}>
      <h1 style={{ marginTop: 0 }}>Shop</h1>

      <form onSubmit={applySearch} style={{ marginBottom: "1.25rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search rice, dal, oil…"
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          style={{ flex: "1 1 240px", padding: "0.6rem 0.85rem", borderRadius: 8, border: "1px solid var(--color-border)" }}
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      <div style={{ marginBottom: "1.25rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Category:</span>
        <button type="button" className={`btn ${!category ? "btn-primary" : "btn-secondary"}`} onClick={() => setCategory("")}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`btn ${category === c.slug ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setCategory(c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {err && <div className="alert alert-error">{err}</div>}
      {loading && <p>Loading…</p>}

      {!loading && products.length === 0 && <p>No products match your filters.</p>}

      <div className="grid-products">
        {products.map((p) => (
          <Link key={p.id} to={`/products/${p.slug}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
            {p.imageUrl ? (
              <img className="card-img" src={p.imageUrl} alt="" loading="lazy" />
            ) : (
              <div className="card-img" style={{ display: "grid", placeItems: "center" }}>—</div>
            )}
            <div className="card-body">
              {p.stock <= 0 ? (
                <span className="badge badge-warn">Out of stock</span>
              ) : p.stock <= 10 ? (
                <span className="badge badge-warn">Only {p.stock} left</span>
              ) : null}
              <h3 className="card-title">{p.name}</h3>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>{p.category?.name} · {p.unitLabel}</p>
              <p className="price" style={{ margin: 0 }}>
                {formatRupees(p.pricePaise)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
