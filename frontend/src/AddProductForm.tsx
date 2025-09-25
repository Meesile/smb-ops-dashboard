import { useState } from "react";

type Props = { onCreated?: () => void };

export default function AddProductForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [threshold, setThreshold] = useState<number | "">("");
  const [msg, setMsg] = useState<string>("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch("http://localhost:4000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          quantity: quantity === "" ? 0 : Number(quantity),
          threshold: threshold === "" ? 0 : Number(threshold),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(`❌ ${data.error || "Failed to create product"}`);
        return;
      }

      setMsg(`✅ Created ${data.name} (${data.sku})`);
      setName("");
      setSku("");
      setQuantity("");
      setThreshold("");
      onCreated?.(); // let parent refresh list
    } catch {
      setMsg("❌ Network error");
    }
  };

  return (
    <form onSubmit={submit} style={{ marginTop: 24, display: "grid", gap: 8, maxWidth: 420 }}>
      <h2>Add Product</h2>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        placeholder="SKU"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
        min={0}
      />
      <input
        type="number"
        placeholder="Threshold"
        value={threshold}
        onChange={(e) => setThreshold(e.target.value === "" ? "" : Number(e.target.value))}
        min={0}
      />
      <button type="submit">Create</button>
      {msg && <div>{msg}</div>}
    </form>
  );
}