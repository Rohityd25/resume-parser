/**
 * Express Server Entry Point
 * Resume Parser & Job Matching System
 * 
 * No LLMs — 100% rule-based NLP
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDB } = require("./db/database");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Static files (UI) ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, "..", "public")));

// ─── API Routes ──────────────────────────────────────────────────
const apiRoutes = require("./routes/api");
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

// ─── Auto-seed if DB is empty ────────────────────────────────────
async function autoSeed() {
    try {
        const db = require("./db/database");
        const jds = db.listJDs();
        if (jds.length === 0) {
            console.log("📦 No JDs found — auto-seeding sample data...");
            const { v4: uuidv4 } = require("uuid");
            const { parseJobDescription } = require("./parsers/jdParser");

            const SAMPLE_JDS = [
                { jobId: "JD001", text: "Backend Developer\n\nRequired Skills:\nJava, Spring Boot, MySQL, Docker, Kafka, REST API, Microservices, Git\n\nNice to Have:\nKubernetes, AWS, Redis, MongoDB, CI/CD, GraphQL\n\nExperience: 3-5 years\nSalary: 12 LPA" },
                { jobId: "JD002", text: "Full Stack Developer\n\nRequired Skills:\nJavaScript, TypeScript, React, Node.js, Express, MongoDB, PostgreSQL, HTML, CSS, Git\n\nNice to Have:\nNext.js, GraphQL, Docker, AWS, Jest, Redux\n\nExperience: 2-4 years\nSalary: 10 LPA" },
                { jobId: "JD003", text: "Data Engineer\n\nRequired Skills:\nPython, SQL, Apache Spark, Hadoop, AWS, PostgreSQL, Kafka, Docker\n\nNice to Have:\nScala, Airflow, Terraform, Elasticsearch, Machine Learning\n\nExperience: 3-6 years\nSalary: 15 LPA" },
                { jobId: "JD004", text: "Frontend Developer\n\nRequired Skills:\nReact, JavaScript, TypeScript, HTML, CSS, Tailwind CSS, Redux, Git\n\nNice to Have:\nVue.js, Next.js, Figma, Jest, Cypress\n\nExperience: 1-3 years\nSalary: 8 LPA" },
                { jobId: "JD005", text: "DevOps Engineer\n\nRequired Skills:\nDocker, Kubernetes, AWS, Jenkins, CI/CD, Terraform, Linux, Git, Nginx, Python\n\nNice to Have:\nAnsible, Prometheus, Grafana, Helm, GCP, Azure\n\nExperience: 4-7 years\nSalary: 18 LPA" },
            ];

            for (const item of SAMPLE_JDS) {
                const parsed = parseJobDescription(item.text, item.jobId);
                db.saveJD(uuidv4(), parsed, item.text, `sample-${item.jobId}.txt`);
                console.log(`  ✅ Seeded: ${item.jobId} — ${parsed.role}`);
            }
            console.log(`✅ Seeded ${SAMPLE_JDS.length} sample job descriptions.`);
        }
    } catch (err) {
        console.error("Auto-seed warning:", err.message);
    }
}

// ─── Start Server (async to init DB first) ───────────────────────
async function start() {
    await initDB();
    await autoSeed();

    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║   🔍  Resume Parser & Job Matcher                         ║
║   Server running on http://localhost:${PORT}                ║
║   100% Rule-Based NLP • No LLMs                          ║
╚═══════════════════════════════════════════════════════════╝
    `);
    });
}

start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});

module.exports = app;
