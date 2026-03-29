import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", description: "", sortOrder: 0 });

  async function load() {
    const data = await api("/categories");
    setCategories(data.categories || []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  async function create(e) {
    e.preventDefault();
    setErr("");
    try {
      await api("/admin/categories", {
        method: "POST",
        body: {
          name: form.name,
          slug: form.slug.toLowerCase().replace(/\s+/g, "-"),
          description: form.description || undefined,
          sortOrder: Number(form.sortOrder) || 0,
        },
      });
      setForm({ name: "", slug: "", description: "", sortOrder: 0 });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete category and its products?")) return;
    setErr("");
    try {
      await api(`/admin/categories/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Categories</h1>
      {err && <div className="alert alert-error">{err}</div>}

      <form className="form" onSubmit={create} style={{ maxWidth: 560, marginBottom: "2rem" }}>
        <h3 style={{ marginBottom: 0 }}>Add category</h3>
        <label>
          Name
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>
        <label>
          Slug (lowercase-kebab)
          <input required pattern="[a-z0-9-]+" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
        </label>
        <label>
          Description
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </label>
        <label>
          Sort order
          <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
        </label>
        <button type="submit" className="btn btn-primary">
          Create
        </button>
      </form>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Products</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.slug}</td>
                <td>{c.productCount}</td>
                <td>
                  <button type="button" className="btn btn-ghost" onClick={() => remove(c.id)}>
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
