import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import questionnaireRoutes from "./routes/questionnaire.js";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();
const app = express();

app.use(cors({
  origin: "https://ieeematchmakingfrontend-production.up.railway.app" || "http://localhost:3000",
}));
app.use(express.json());

// --- API routes ---
app.use("/api/questionnaire", questionnaireRoutes);

// Optional health check for backend
app.get("/api/health", (req, res) => res.send("Backend is running"));

// --- React build setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../ieee-frontend/build")));

// Serve React for any route NOT starting with /api
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "../ieee-frontend/build/index.html"));
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
