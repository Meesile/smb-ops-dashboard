import { Router } from "express";

const router = Router();

// mock data for now
const products = [
  { id: "p1", name: "House Blend Coffee Beans", sku: "HB-12OZ", quantity: 18, threshold: 5 },
  { id: "p2", name: "Oat Milk", sku: "OM-1L", quantity: 7, threshold: 6 },
  { id: "p3", name: "Croissant", sku: "CR-01", quantity: 2, threshold: 8 }
];

router.get("/", (_req, res) => {
  res.json(products);
});

router.post("/", (req, res) => {
  const { name, sku, quantity = 0, threshold = 0 } = req.body;

  if (!name || !sku) {
    return res.status(400).json({ error: "Name and SKU are required" });
  }

  const skuExists = products.some(product => product.sku === sku);
  if (skuExists) {
    return res.status(400).json({ error: "SKU must be unique" });
  }

  const nextIdNumber = products.length > 0 ? Math.max(...products.map(p => parseInt(p.id.slice(1)))) + 1 : 1;
  const newProduct = {
    id: `p${nextIdNumber}`,
    name,
    sku,
    quantity,
    threshold
  };

  products.push(newProduct);

  res.status(201).json(newProduct);
});

export default router;