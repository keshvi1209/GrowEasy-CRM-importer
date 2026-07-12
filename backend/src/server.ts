import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import importRoutes from "./routes/importRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_ORIGINS,
    methods: ["GET", "POST"],
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());

app.use("/api", importRoutes);

app.get("/", (_req, res) => {
  res.json({ name: "GrowEasy CSV Importer API", status: "running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Centralized error handler must be registered last.
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`GrowEasy CSV Importer API listening on port ${PORT}`);
});

export default app;
