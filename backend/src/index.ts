import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import productsRouter from "./routes/products";
import alertsRouter from "./routes/alerts";
import importsRouter from "./routes/imports";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "SMB Ops Dashboard backend is running" });
});

app.get("/api/status", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/products", productsRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/imports", importsRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});