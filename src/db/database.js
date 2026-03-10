/**
 * Database Module (SQLite via sql.js — pure JavaScript, no native addons)
 * Works on ALL platforms including Railway, Render, Fly.io, Vercel, etc.
 */

const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH = path.join(DB_DIR, "resume_parser.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

let db = null;

// ─── Initialize Database ───────────────────────────────────────────
async function initDB() {
    if (db) return db;

    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    // Create tables
    db.run(`
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      linkedin TEXT,
      github TEXT,
      salary TEXT,
      year_of_experience REAL,
      skills TEXT,
      education TEXT,
      summary TEXT,
      raw_text TEXT,
      original_filename TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS job_descriptions (
      id TEXT PRIMARY KEY,
      job_id TEXT UNIQUE,
      role TEXT,
      about_role TEXT,
      salary TEXT,
      experience TEXT,
      required_skills TEXT,
      optional_skills TEXT,
      all_skills TEXT,
      raw_text TEXT,
      original_filename TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS match_results (
      id TEXT PRIMARY KEY,
      resume_id TEXT,
      jd_id TEXT,
      matching_score REAL,
      skills_analysis TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resume_id) REFERENCES resumes(id),
      FOREIGN KEY (jd_id) REFERENCES job_descriptions(id)
    );
  `);

    return db;
}

// ─── Persist to disk ───────────────────────────────────────────────
function persist() {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

// ─── Helper to run query and get rows ──────────────────────────────
function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

function queryOne(sql, params = []) {
    const rows = queryAll(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

function execute(sql, params = []) {
    db.run(sql, params);
    persist();
}

// ─── Resume CRUD ──────────────────────────────────────────────────
function saveResume(id, parsed, rawText, filename) {
    execute(
        `INSERT OR REPLACE INTO resumes (id, name, email, phone, linkedin, github, salary, year_of_experience, skills, education, summary, raw_text, original_filename)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            parsed.name,
            parsed.email,
            parsed.phone,
            parsed.linkedin,
            parsed.github,
            parsed.salary,
            parsed.yearOfExperience,
            JSON.stringify(parsed.resumeSkills),
            JSON.stringify(parsed.education),
            parsed.summary,
            rawText,
            filename,
        ]
    );
}

function getResumeById(id) {
    const row = queryOne("SELECT * FROM resumes WHERE id = ?", [id]);
    if (!row) return null;
    return {
        ...row,
        skills: JSON.parse(row.skills || "[]"),
        education: JSON.parse(row.education || "[]"),
    };
}

function listResumes() {
    return queryAll("SELECT * FROM resumes ORDER BY created_at DESC").map(
        (row) => ({
            ...row,
            skills: JSON.parse(row.skills || "[]"),
            education: JSON.parse(row.education || "[]"),
        })
    );
}

function removeResume(id) {
    execute("DELETE FROM resumes WHERE id = ?", [id]);
    execute("DELETE FROM match_results WHERE resume_id = ?", [id]);
}

// ─── JD CRUD ──────────────────────────────────────────────────────
function saveJD(id, parsed, rawText, filename) {
    execute(
        `INSERT OR REPLACE INTO job_descriptions (id, job_id, role, about_role, salary, experience, required_skills, optional_skills, all_skills, raw_text, original_filename)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            parsed.jobId,
            parsed.role,
            parsed.aboutRole,
            parsed.salary,
            parsed.experience,
            JSON.stringify(parsed.requiredSkills),
            JSON.stringify(parsed.optionalSkills),
            JSON.stringify(parsed.allSkills),
            rawText,
            filename,
        ]
    );
}

function getJDById(id) {
    const row = queryOne("SELECT * FROM job_descriptions WHERE id = ?", [id]);
    if (!row) return null;
    return {
        ...row,
        required_skills: JSON.parse(row.required_skills || "[]"),
        optional_skills: JSON.parse(row.optional_skills || "[]"),
        all_skills: JSON.parse(row.all_skills || "[]"),
    };
}

function listJDs() {
    return queryAll(
        "SELECT * FROM job_descriptions ORDER BY created_at DESC"
    ).map((row) => ({
        ...row,
        required_skills: JSON.parse(row.required_skills || "[]"),
        optional_skills: JSON.parse(row.optional_skills || "[]"),
        all_skills: JSON.parse(row.all_skills || "[]"),
    }));
}

function removeJD(id) {
    execute("DELETE FROM job_descriptions WHERE id = ?", [id]);
    execute("DELETE FROM match_results WHERE jd_id = ?", [id]);
}

// ─── Match Results CRUD ──────────────────────────────────────────
function saveMatchResult(id, resumeId, jdId, score, skillsAnalysis) {
    execute(
        `INSERT OR REPLACE INTO match_results (id, resume_id, jd_id, matching_score, skills_analysis)
     VALUES (?, ?, ?, ?, ?)`,
        [id, resumeId, jdId, score, JSON.stringify(skillsAnalysis)]
    );
}

function getMatchesForResume(resumeId) {
    return queryAll(
        `SELECT mr.*, jd.role, jd.job_id, jd.about_role
     FROM match_results mr
     JOIN job_descriptions jd ON mr.jd_id = jd.id
     WHERE mr.resume_id = ?
     ORDER BY mr.matching_score DESC`,
        [resumeId]
    ).map((row) => ({
        ...row,
        skills_analysis: JSON.parse(row.skills_analysis || "[]"),
    }));
}

module.exports = {
    initDB,
    saveResume,
    getResumeById,
    listResumes,
    removeResume,
    saveJD,
    getJDById,
    listJDs,
    removeJD,
    saveMatchResult,
    getMatchesForResume,
};
