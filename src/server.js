/**
 * Express Server Entry Point
 * Resume Parser & Job Matching System
 * 
 * No LLMs — 100% rule-based NLP
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const apiRoutes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Static files (UI) ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, "..", "public")));

// ─── API Routes ──────────────────────────────────────────────────
app.use("/api", apiRoutes);

// ─── Catch-all to serve index.html for SPA ───────────────────────
app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
        res.sendFile(path.join(__dirname, "..", "public", "index.html"));
    } else {
        next();
    }
});

// ─── Global Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Max size: 10MB." });
    }
    res.status(500).json({ error: err.message || "Internal server error" });
});

// ─── Start Server ────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`

   🔍  Resume Parser & Job Matcher                              
   Server running on http://localhost:${PORT}              
   API docs:        http://localhost:${PORT}/api/health     
  `);
});

module.exports = app;
