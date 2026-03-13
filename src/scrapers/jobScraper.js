/**
 * Job Web Scraper Module
 * Fetches live job listings from public job portals using axios + cheerio.
 * Sources:
 *   1. RemoteOK  — public JSON API (no auth needed)
 *   2. Arbeitnow — public JSON API (no auth needed)
 *   3. Himalayas — public JSON API (no auth needed)
 *
 * Also includes an HTML scraper for plain job board pages via cheerio.
 */

const axios = require("axios");
const cheerio = require("cheerio");

// ─── Shared HTTP client ─────────────────────────────────────────────
const http = axios.create({
    timeout: 15000,
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "application/json, text/html, */*",
    },
});

// ─── Helper: clean text ────────────────────────────────────────────
function clean(str) {
    if (!str) return "";
    return str.replace(/\s+/g, " ").trim();
}

// ─── Helper: strip HTML tags ───────────────────────────────────────
function stripHTML(html) {
    if (!html) return "";
    const $ = cheerio.load(html);
    return clean($.text());
}

// ─── Source 1: RemoteOK (JSON API) ────────────────────────────────
/**
 * Fetches remote jobs from remoteok.com public JSON feed.
 * @param {string} query  - keyword to filter (e.g. "node", "python")
 * @param {number} limit
 */
async function scrapeRemoteOK(query = "", limit = 10) {
    const url = "https://remoteok.com/api";
    const res = await http.get(url, {
        headers: { "Accept": "application/json" },
    });

    // First element is a legal notice object, skip it
    const jobs = Array.isArray(res.data) ? res.data.slice(1) : [];

    const q = query.toLowerCase();
    const filtered = q
        ? jobs.filter(
              (j) =>
                  (j.position || "").toLowerCase().includes(q) ||
                  (j.tags || []).some((t) => t.toLowerCase().includes(q)) ||
                  (j.description || "").toLowerCase().includes(q)
          )
        : jobs;

    return filtered.slice(0, limit).map((j) => ({
        source: "RemoteOK",
        title: clean(j.position) || "Unknown Role",
        company: clean(j.company) || "Unknown Company",
        location: clean(j.location) || "Remote",
        tags: Array.isArray(j.tags) ? j.tags.slice(0, 12) : [],
        salary: j.salary_min
            ? `$${j.salary_min}–$${j.salary_max || j.salary_min}`
            : null,
        postedAt: j.date || null,
        url: j.url || `https://remoteok.com/l/${j.id}`,
        description: stripHTML(j.description).substring(0, 1200),
    }));
}

// ─── Source 2: Arbeitnow (JSON API) ────────────────────────────────
/**
 * Fetches jobs from arbeitnow.com public API.
 * Supports filtering by ?search=keyword
 */
async function scrapeArbeitnow(query = "", limit = 10) {
    const params = new URLSearchParams();
    if (query) params.set("search", query);

    const url = `https://www.arbeitnow.com/api/job-board-api?${params.toString()}`;
    const res = await http.get(url);

    const jobs = res.data?.data || [];
    return jobs.slice(0, limit).map((j) => ({
        source: "Arbeitnow",
        title: clean(j.title) || "Unknown Role",
        company: clean(j.company_name) || "Unknown Company",
        location: clean(j.location) || "Remote",
        tags: Array.isArray(j.tags) ? j.tags.slice(0, 12) : [],
        salary: null,
        postedAt: j.created_at || null,
        url: j.url || null,
        description: stripHTML(j.description).substring(0, 1200),
    }));
}

// ─── Source 3: Himalayas (JSON API) ────────────────────────────────
/**
 * Fetches remote jobs from himalayas.app public API.
 */
async function scrapeHimalayas(query = "", limit = 10) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("_limit", String(limit));

    const url = `https://himalayas.app/jobs/api?${params.toString()}`;
    const res = await http.get(url);

    const jobs = res.data?.jobs || [];
    return jobs.slice(0, limit).map((j) => ({
        source: "Himalayas",
        title: clean(j.title) || "Unknown Role",
        company: clean(j.companyName) || "Unknown Company",
        location: clean(j.location) || "Remote",
        tags: Array.isArray(j.categories) ? j.categories.slice(0, 12) : [],
        salary: j.salaryRange
            ? `$${j.salaryRange.from}–$${j.salaryRange.to}`
            : null,
        postedAt: j.createdAt || null,
        url: j.applicationLink || null,
        description: stripHTML(j.description).substring(0, 1200),
    }));
}

// ─── Source 4: Generic HTML scraper (via Cheerio) ─────────────────
/**
 * Scrapes job postings from any HTML page given a URL and optional CSS selectors.
 * Falls back to extracting any meaningful text blocks.
 *
 * @param {string} pageUrl
 * @param {object} selectors  - { item, title, company, location, description }
 */
async function scrapeHTML(pageUrl, selectors = {}) {
    const res = await http.get(pageUrl, {
        responseType: "text",
        headers: { Accept: "text/html" },
    });

    const $ = cheerio.load(res.data);
    const {
        item = "article, .job, .job-card, .job-listing, [class*='job']",
        title = "h2, h3, .title, [class*='title'], [class*='position']",
        company = ".company, [class*='company'], [class*='employer']",
        location = ".location, [class*='location']",
        description = "p, .description, [class*='desc']",
    } = selectors;

    const results = [];
    $(item)
        .slice(0, 15)
        .each((_, el) => {
            const $el = $(el);
            const t = clean($el.find(title).first().text()) || clean($el.find("a").first().text());
            if (!t || t.length < 3) return;

            results.push({
                source: new URL(pageUrl).hostname,
                title: t,
                company: clean($el.find(company).first().text()) || null,
                location: clean($el.find(location).first().text()) || null,
                tags: [],
                salary: null,
                postedAt: null,
                url: (() => {
                    const href = $el.find("a").first().attr("href");
                    if (!href) return pageUrl;
                    if (href.startsWith("http")) return href;
                    const base = new URL(pageUrl);
                    return `${base.protocol}//${base.host}${href}`;
                })(),
                description: clean($el.find(description).first().text()).substring(0, 800),
            });
        });

    return results;
}

// ─── Aggregate: scrape all sources ────────────────────────────────
/**
 * Scrapes from all available API sources in parallel.
 * Catches individual failures without crashing the whole request.
 *
 * @param {string} query
 * @param {number} limitPerSource
 */
async function scrapeAllSources(query = "", limitPerSource = 10) {
    const tasks = [
        scrapeRemoteOK(query, limitPerSource).catch((err) => {
            console.warn("RemoteOK scrape failed:", err.message);
            return [];
        }),
        scrapeArbeitnow(query, limitPerSource).catch((err) => {
            console.warn("Arbeitnow scrape failed:", err.message);
            return [];
        }),
        scrapeHimalayas(query, limitPerSource).catch((err) => {
            console.warn("Himalayas scrape failed:", err.message);
            return [];
        }),
    ];

    const results = await Promise.all(tasks);
    return results.flat();
}

module.exports = {
    scrapeRemoteOK,
    scrapeArbeitnow,
    scrapeHimalayas,
    scrapeHTML,
    scrapeAllSources,
};
