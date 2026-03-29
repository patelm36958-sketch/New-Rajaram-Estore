import { useEffect, useState } from "react";
import { api, formatRupees } from "../api.js";

const emptyForm = {
  categoryId: "",
  name: "",
  slug: "",
  description: "",
  priceRupees: "",
  unitLabel: "kg",
  imageUrl: "",
  stock: 0,
  isActive: true,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [err, setErr] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    const [p, c] = await Promise.all([api("/admin/products"), api("/categories")]);
    setProducts(p.products || []);
    setCategories(c.categories || []);
    if (!form.categoryId && (c.categories || [])[0]) {
      setForm((f) => ({ ...f, categoryId: c.categories[0].id }));
    }
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toPaise(rupeesStr) {
    const n = Number(rupeesStr);
    if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid price");
    return Math.round(n * 100);
  }

  async function save(e) {
    e.preventDefault();
    setErr("");
    try {
      const pricePaise = toPaise(form.priceRupees);
      const slug = form.slug.toLowerCase().replace(/\s+/g, "-");
      const body = {
        categoryId: form.categoryId,
        name: form.name,
        slug,
        description: form.description || undefined,
        pricePaise,
        unitLabel: form.unitLabel || "unit",
        imageUrl: form.imageUrl?.trim() || undefined,
        stock: Number(form.stock) || 0,
        isActive: form.isActive,
      };

      if (editingId) {
        await api(`/admin/products/${editingId}`, { method: "PATCH", body });
      } else {
        await api("/admin/products", { method: "POST", body });
      }
      setForm({ ...emptyForm, categoryId: categories[0]?.id || "" });
      setEditingId(null);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  function edit(p) {
    setEditingId(p.id);
    setForm({
      categoryId: p.categoryId,
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      priceRupees: String(p.pricePaise / 100),
      unitLabel: p.unitLabel,
      imageUrl: p.imageUrl || "",
      stock: p.stock,
      isActive: p.isActive,
    });
  }

  async function remove(id) {
    if (!confirm("Delete this product?")) return;
    setErr("");
    try {
      await api(`/admin/products/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Products</h1>
      {err && <div className="alert alert-error">{err}</div>}

      <form className="form" onSubmit={save} style={{ maxWidth: 560, marginBottom: "2rem" }}>
        <h3 style={{ marginBottom: 0 }}>{editingId ? "Edit product" : "Add product"}</h3>
        <label>
          Category
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Name
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>
        <label>
          Slug
          <input required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
        </label>
        <label>
          Description
          <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </label>
        <div className="form-row-2">
          <label>
            Price (INR)
            <input required type="number" step="0.01" min="0.01" value={form.priceRupees} onChange={(e) => setForm((f) => ({ ...f, priceRupees: e.target.value }))} />
          </label>
          <label>
            Unit label
            <input value={form.unitLabel} onChange={(e) => setForm((f) => ({ ...f, unitLabel: e.target.value }))} />
          </label>
        </div>
        <label>
          Image URL
          <input type="url" placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
        </label>
        <div className="form-row-2">
          <label>
            Stock
            <input type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
          </label>
          <label style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            Active (visible in shop)
          </label>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="submit" className="btn btn-primary">
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditingId(null);
                setForm({ ...emptyForm, categoryId: categories[0]?.id || "" });
              }}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.category?.name}</td>
                <td>{formatRupees(p.pricePaise)}</td>
                <td>{p.stock}</td>
                <td>{p.isActive ? "Yes" : "No"}</td>
                <td>
                  <button type="button" className="btn btn-ghost" onClick={() => edit(p)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => remove(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
