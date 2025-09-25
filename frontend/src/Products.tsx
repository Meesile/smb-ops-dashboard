import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("http://localhost:4000/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Products</h2>
      {products.length === 0 ? (
        <p>No products found</p>
      ) : (
        <ul>
          {products.map((p) => (
            <li key={p.id}>
              {p.name} ({p.sku}) — Qty: {p.quantity}, Threshold: {p.threshold}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}