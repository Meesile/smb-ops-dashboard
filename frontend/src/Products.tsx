import { useEffect, useRef, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; sku: string; quantity: string; threshold: string }>({
    name: "",
    sku: "",
    quantity: "",
    threshold: "",
  });
  const [saving, setSaving] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const fetchProducts = async () => {
    try {
      setError("");
      const res = await fetch("http://localhost:4000/api/products");
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // initial load + polling
  useEffect(() => {
    fetchProducts();
    timerRef.current = window.setInterval(fetchProducts, 5000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  // refresh on window focus
  useEffect(() => {
    const onFocus = () => fetchProducts();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const startEdit = (p: Product) => {
    setEditingSku(p.sku);
    setForm({
      name: p.name,
      sku: p.sku,
      quantity: String(p.quantity),
      threshold: String(p.threshold),
    });
  };

  const cancelEdit = () => {
    setEditingSku(null);
    setForm({ name: "", sku: "", quantity: "", threshold: "" });
  };

  const saveEdit = async (originalSku: string) => {
    try {
      setSaving(true);
      setError("");
      const body = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        quantity: form.quantity === "" ? undefined : Number(form.quantity),
        threshold: form.threshold === "" ? undefined : Number(form.threshold),
      };

      if (!body.name || !body.sku) {
        setError("Name and SKU are required");
        setSaving(false);
        return;
      }

      const res = await fetch(`http://localhost:4000/api/products/sku/${encodeURIComponent(originalSku)}` , {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to update product");
      } else {
        cancelEdit();
        await fetchProducts();
      }
    } catch (e: any) {
      setError(e?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (sku: string) => {
    if (!confirm(`Delete product ${sku}? This cannot be undone.`)) return;
    try {
      setSaving(true);
      setError("");
      const res = await fetch(`http://localhost:4000/api/products/sku/${encodeURIComponent(sku)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Failed to delete product");
      } else {
        await fetchProducts();
      }
    } catch (e: any) {
      setError(e?.message || "Failed to delete product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Products</h2>
        <button onClick={fetchProducts} disabled={saving}>Refresh</button>
      </div>
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p style={{ color: "crimson" }}>❌ {error}</p>
      ) : products.length === 0 ? (
        <p>No products found</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {products.map((p) => (
            <li key={p.id} style={{ margin: "8px 0", padding: "8px 0", borderBottom: "1px solid #eee" }}>
              {editingSku === p.sku ? (
                <div style={{ display: "grid", gap: 6, maxWidth: 560 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <label>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>Name</div>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>SKU</div>
                      <input
                        value={form.sku}
                        onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                        required
                      />
                    </label>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <label>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>Quantity</div>
                      <input
                        type="number"
                        value={form.quantity}
                        onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                        min={0}
                      />
                    </label>
                    <label>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>Threshold</div>
                      <input
                        type="number"
                        value={form.threshold}
                        onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))}
                        min={0}
                      />
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => saveEdit(p.sku)} disabled={saving}>Save</button>
                    <button onClick={cancelEdit} disabled={saving}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span>
                    {p.name} ({p.sku}) — Qty: {p.quantity}, Threshold: {p.threshold}
                  </span>
                  <button onClick={() => startEdit(p)}>Edit</button>
                  <button onClick={() => deleteProduct(p.sku)} disabled={saving} style={{ color: "#b00020" }}>
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}