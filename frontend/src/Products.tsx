import { useEffect, useRef, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import ProductTrendModal from "./components/ProductTrendModal";
import ConfirmModal from "./components/ConfirmModal";

type Product = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
  salesSummary: {
    totalUnitsSold: number;
    salesCount: number;
    lastSaleDate: string | null;
  };
};

export default function Products() {
  const [chartMode, setChartMode] = useState<"low" | "top">("low");
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
  const prevHashRef = useRef<string>("");
  const [pausePolling, setPausePolling] = useState(false);

  // CSV upload helpers
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadMsg, setUploadMsg] = useState<string>("");
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [normalizing, setNormalizing] = useState<boolean>(false);
  
  // Product trend modal
  const [trendProductId, setTrendProductId] = useState<string | null>(null);

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const fetchProducts = async () => {
    try {
      setError("");
      const res = await fetch("http://localhost:4000/api/products");
      if (!res.ok) throw new Error("Failed to load products");
      const data = (await res.json()) as Product[];

      // Build a stable hash of the essential fields sorted by SKU to avoid rerenders when nothing changed
      const normalized = (Array.isArray(data) ? data : [])
        .map((p) => ({ 
          sku: p.sku, 
          name: p.name, 
          quantity: p.quantity, 
          threshold: p.threshold,
          totalUnitsSold: p.salesSummary?.totalUnitsSold || 0,
          salesCount: p.salesSummary?.salesCount || 0
        }))
        .sort((a, b) => a.sku.localeCompare(b.sku));
      const hash = JSON.stringify(normalized);

      if (hash !== prevHashRef.current) {
        setProducts(Array.isArray(data) ? data : []);
        prevHashRef.current = hash;
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // initial load once
  useEffect(() => {
    fetchProducts();
  }, []);

  // polling that pauses while the user is interacting with the chart (prevents tooltip flicker)
  useEffect(() => {
    if (pausePolling) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = window.setInterval(fetchProducts, 5000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [pausePolling]);

  // refresh on window focus
  useEffect(() => {
    const onFocus = () => fetchProducts();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // ----- Chart data (2 modes): "low" (Qty vs Threshold for at/below threshold) and "top" (largest quantities)
  const { chartData, shouldShowChart } = useMemo(() => {
    const lowStockData = products
      .filter((p) => typeof p.threshold === "number" && p.threshold > 0)
      .map((p) => ({
        name: p.sku,
        productName: p.name,
        quantity: p.quantity,
        threshold: p.threshold,
        ratio: p.quantity / p.threshold,
      }))
      .filter((d) => d.ratio <= 1)
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 10);

    const topQtyData = products
      .map((p) => ({ name: p.sku, productName: p.name, quantity: p.quantity, threshold: p.threshold }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const chartData = chartMode === "low" ? lowStockData : topQtyData;
    const shouldShowChart = chartMode === "low" ? chartData.length >= 2 : chartData.length >= 3;
    return { chartData, shouldShowChart };
  }, [products, chartMode]);

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

  const deleteProduct = async (sku: string, productName: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Product",
      message: `Are you sure you want to delete ${productName} (${sku})? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
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
      },
    });
  };

  const uploadCsv = async () => {
    const file = fileRef.current?.files?.[0];
    setUploadMsg("");
    setUploadErrors([]);
    if (!file) {
      setUploadMsg("Please choose a .csv file first");
      return;
    }
    if (file.size === 0) {
      setUploadMsg("❌ Selected file is empty (0 bytes)");
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file, file.name);
  
      // 1) Upload to staging
      const res = await fetch("http://localhost:4000/api/imports/csv", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      setUploadErrors([]);
      if (!res.ok) {
        setUploadMsg(`❌ ${data?.error || "Upload failed"}`);
        return;
      } else if (data.invalid && Array.isArray(data.errors)) {
        setUploadErrors(data.errors);
      }
  
      // 2) Normalize automatically if jobId is returned
      if (data?.jobId) {
        setUploadMsg("Uploading complete — normalizing…");
        setNormalizing(true);
        const res2 = await fetch(
          `http://localhost:4000/api/imports/normalize/${encodeURIComponent(data.jobId)}`,
          { method: "POST" }
        );
        const norm = await res2.json();
        if (!res2.ok) {
          setUploadMsg(`❌ Normalize failed: ${norm?.error || "Unknown error"}`);
        } else {
          if (norm.invalid && Array.isArray(norm.errors)) {
            setUploadErrors(norm.errors);
          }
          setUploadMsg(
            `✅ Import complete — created: ${norm.created}, updated: ${norm.updated}, snapshots: ${norm.snapshots}`
          );
        }
      } else {
        setUploadMsg("✅ Upload complete (no job id)");
      }
  
      // 3) Refresh products and clear file input
      await fetchProducts();
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      setUploadMsg(`❌ ${e?.message || "Network error"}`);
    } finally {
      setUploading(false);
      setNormalizing(false);
    }
  };

  return (
    <div className="card compact scrollable">
      {/* Chart (only if we have enough relevant data) */}
      {shouldShowChart && (
        <div
          className="chart-container"
          style={{ height: 200, marginBottom: 12 }}
          onMouseEnter={() => setPausePolling(true)}
          onMouseLeave={() => setPausePolling(false)}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600 }}>Inventory Overview</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" style={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]} stroke="var(--text-secondary)" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }}
                labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                formatter={(value: any, key: any, entry: any) => {
                  if (key === "quantity") return [value, "Qty"];
                  if (key === "threshold") return [value, "Threshold"];
                  return [value, key];
                }}
                labelFormatter={(label: any, payload: any) => {
                  const item = payload && payload[0] && payload[0].payload;
                  if (item) {
                    return `${item.productName} (${item.name})`;
                  }
                  return label;
                }}
              />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
              <Bar dataKey="quantity" name="Qty" label={{ position: "top", fill: "var(--text-primary)", fontSize: 12 }}>
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={typeof entry.threshold === "number" && entry.quantity <= entry.threshold ? "var(--accent-red)" : "var(--accent-green)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="card-header">
        <h2 className="card-title">Products</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setChartMode("low")}
            disabled={chartMode === "low"}
            className={chartMode === "low" ? "" : "btn-secondary"}
            title="Show low-stock (Qty vs Threshold)"
          >
            Low-stock
          </button>
          <button
            onClick={() => setChartMode("top")}
            disabled={chartMode === "top"}
            className={chartMode === "top" ? "" : "btn-secondary"}
            title="Show top quantities"
          >
            Top qty
          </button>
          <button onClick={fetchProducts} disabled={saving} className="btn-secondary">Refresh</button>

          {/* Hidden file input — opened by Import button */}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={uploadCsv}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || normalizing}
            title="Import products from CSV"
          >
            {normalizing ? "Normalizing…" : uploading ? "Uploading…" : "Import CSV"}
          </button>
        </div>
      </div>
      {uploadMsg && (
        <div style={{ marginTop: 6, textAlign: "right", fontSize: 12, opacity: 0.8 }}>
          {uploadMsg}
        </div>
      )}
      {uploadErrors.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 12, color: "crimson" }}>
          <strong>Import errors:</strong>
          <ul>
            {uploadErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span>
                      {p.name} ({p.sku}) — Qty: {p.quantity}, Threshold: {p.threshold}
                    </span>
                    <div style={{ fontSize: 12, opacity: 0.7, display: "flex", gap: 12 }}>
                      <span>Sold: {p.salesSummary.totalUnitsSold} units ({p.salesSummary.salesCount} sales)</span>
                      {p.salesSummary.lastSaleDate && (
                        <span>Last sale: {new Date(p.salesSummary.lastSaleDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => startEdit(p)} className="btn-secondary">Edit</button>
                  <button onClick={() => setTrendProductId(p.id)} className="btn-secondary">View Trend</button>
                  <button onClick={() => deleteProduct(p.sku, p.name)} disabled={saving} className="btn-danger">
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <ProductTrendModal 
        productId={trendProductId} 
        onClose={() => setTrendProductId(null)} 
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        confirmText="Delete"
        isDangerous={true}
      />
    </div>
  );
}