/**
 * Scraper Routes
 * Endpoints to fetch live job data from public job board APIs
 * and optionally auto-save scraped JDs into the local database.
 */

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const {
    scrapeRemoteOK,
    scrapeArbeitnow,
    scrapeHimalayas,
    scrapeAllSources,
    scrapeHTML,
} = require("../scrapers/jobScraper");
const { parseJobDescription } = require("../parsers/jdParser");
const db = require("../db/database");

const router = express.Router();
router.use(express.json());

// ─── Shared: convert a scraped job → JD text → parse → save ───────
function importJobToDB(job) {
    const text = buildJDText(job);
    const jobId = `SCRAPE-${Date.now()}-${uuidv4().slice(0, 6)}`;
    const parsed = parseJobDescription(text, jobId);
    const id = uuidv4();
    db.saveJD(id, parsed, text, `scraped-${job.source}`);
    return { id, jobId, ...parsed };
}

function buildJDText(job) {
    const lines = [];
    lines.push(job.title || "Untitled Role");
    if (job.company)     lines.push(`Company: ${job.company}`);
    if (job.location)    lines.push(`Location: ${job.location}`);
    if (job.salary)      lines.push(`Salary: ${job.salary}`);
    if (job.tags?.length) lines.push(`Required Skills:\n${job.tags.join(", ")}`);
    if (job.description) lines.push(`\nAbout the Role:\n${job.description}`);
    return lines.join("\n");
}

// ─── GET /api/scrape/remoteok ──────────────────────────────────────
/**
 * Query params: ?q=python&limit=10
 * Fetches live jobs from RemoteOK public API.
 */
router.get("/remoteok", async (req, res) => {
    try {
        const { q = "", limit = 10 } = req.query;
        const jobs = await scrapeRemoteOK(q, Math.min(Number(limit), 30));
        res.json({
            success: true,
            source: "RemoteOK",
            count: jobs.length,
            data: jobs,
        });
    } catch (err) {
        console.error("RemoteOK scrape error:", err.message);
        res.status(500).json({ error: `RemoteOK scrape failed: ${err.message}` });
    }
});

// ─── GET /api/scrape/arbeitnow ──────────────────────────────────────
/**
 * Query params: ?q=react&limit=10
 */
router.get("/arbeitnow", async (req, res) => {
    try {
        const { q = "", limit = 10 } = req.query;
        const jobs = await scrapeArbeitnow(q, Math.min(Number(limit), 30));
        res.json({
            success: true,
            source: "Arbeitnow",
            count: jobs.length,
            data: jobs,
        });
    } catch (err) {
        console.error("Arbeitnow scrape error:", err.message);
        res.status(500).json({ error: `Arbeitnow scrape failed: ${err.message}` });
    }
});

// ─── GET /api/scrape/himalayas ─────────────────────────────────────
router.get("/himalayas", async (req, res) => {
    try {
        const { q = "", limit = 10 } = req.query;
        const jobs = await scrapeHimalayas(q, Math.min(Number(limit), 30));
        res.json({
            success: true,
            source: "Himalayas",
            count: jobs.length,
            data: jobs,
        });
    } catch (err) {
        console.error("Himalayas scrape error:", err.message);
        res.status(500).json({ error: `Himalayas scrape failed: ${err.message}` });
    }
});

// ─── GET /api/scrape/all ────────────────────────────────────────────
/**
 * Scrapes ALL sources in parallel.
 * Query params: ?q=backend&limit=8
 */
router.get("/all", async (req, res) => {
    try {
        const { q = "", limit = 8 } = req.query;
        const jobs = await scrapeAllSources(q, Math.min(Number(limit), 20));
        res.json({
            success: true,
            count: jobs.length,
            data: jobs,
        });
    } catch (err) {
        console.error("Multi-source scrape error:", err.message);
        res.status(500).json({ error: `Scrape failed: ${err.message}` });
    }
});

// ─── POST /api/scrape/html ─────────────────────────────────────────
/**
 * Scrapes any job board URL via HTML parsing (Cheerio).
 * Body: { url, selectors? }
 */
router.post("/html", async (req, res) => {
    try {
        const { url, selectors = {} } = req.body;
        if (!url || !url.startsWith("http")) {
            return res.status(400).json({ error: "A valid URL is required." });
        }
        const jobs = await scrapeHTML(url, selectors);
        res.json({
            success: true,
            source: url,
            count: jobs.length,
            data: jobs,
        });
    } catch (err) {
        console.error("HTML scrape error:", err.message);
        res.status(500).json({ error: `HTML scrape failed: ${err.message}` });
    }
});

// ─── POST /api/scrape/import ────────────────────────────────────────
/**
 * Imports selected scraped jobs directly into the JD database.
 * Body: { jobs: [ {title, company, location, tags, salary, description, ...} ] }
 */
router.post("/import", (req, res) => {
    try {
        const { jobs } = req.body;
        if (!Array.isArray(jobs) || jobs.length === 0) {
            return res.status(400).json({ error: "Provide a non-empty 'jobs' array." });
        }

        const imported = [];
        const failed = [];

        for (const job of jobs) {
            try {
                const result = importJobToDB(job);
                imported.push(result);
            } catch (err) {
                failed.push({ title: job.title, error: err.message });
            }
        }

        res.status(201).json({
            success: true,
            message: `Imported ${imported.length} job(s) as Job Descriptions.`,
            imported,
            failed,
        });
    } catch (err) {
        console.error("Import error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
