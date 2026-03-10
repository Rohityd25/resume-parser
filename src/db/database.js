/**
 * Database Module (SQLite via better-sqlite3)
 * Provides persistent storage for resumes, JDs, and match results.
 */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH = path.join(DB_DIR, "resume_parser.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");

// ─── Schema Setup ─────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    linkedin TEXT,
    github TEXT,
    salary TEXT,
    year_of_experience REAL,
    skills TEXT,         -- JSON array
    education TEXT,      -- JSON array
    summary TEXT,
    raw_text TEXT,
    original_filename TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS job_descriptions (
    id TEXT PRIMARY KEY,
    job_id TEXT UNIQUE,
    role TEXT,
    about_role TEXT,
    salary TEXT,
    experience TEXT,
    required_skills TEXT, -- JSON array
    optional_skills TEXT, -- JSON array
    all_skills TEXT,      -- JSON array
    raw_text TEXT,
    original_filename TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS match_results (
    id TEXT PRIMARY KEY,
    resume_id TEXT,
    jd_id TEXT,
    matching_score REAL,
    skills_analysis TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id),
    FOREIGN KEY (jd_id) REFERENCES job_descriptions(id)
  );
`);

// ─── Resume CRUD ──────────────────────────────────────────────────
const insertResume = db.prepare(`
  INSERT OR REPLACE INTO resumes (id, name, email, phone, linkedin, github, salary, year_of_experience, skills, education, summary, raw_text, original_filename)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getResume = db.prepare("SELECT * FROM resumes WHERE id = ?");
const getAllResumes = db.prepare("SELECT * FROM resumes ORDER BY created_at DESC");
const deleteResume = db.prepare("DELETE FROM resumes WHERE id = ?");

function saveResume(id, parsed, rawText, filename) {
    insertResume.run(
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
        filename
    );
}

function getResumeById(id) {
    const row = getResume.get(id);
    if (!row) return null;
    return {
        ...row,
        skills: JSON.parse(row.skills || "[]"),
        education: JSON.parse(row.education || "[]"),
    };
}

function listResumes() {
    return getAllResumes.all().map((row) => ({
        ...row,
        skills: JSON.parse(row.skills || "[]"),
        education: JSON.parse(row.education || "[]"),
    }));
}

function removeResume(id) {
    deleteResume.run(id);
    // Also remove associated match results
    db.prepare("DELETE FROM match_results WHERE resume_id = ?").run(id);
}

// ─── JD CRUD ──────────────────────────────────────────────────────
const insertJD = db.prepare(`
  INSERT OR REPLACE INTO job_descriptions (id, job_id, role, about_role, salary, experience, required_skills, optional_skills, all_skills, raw_text, original_filename)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getJD = db.prepare("SELECT * FROM job_descriptions WHERE id = ?");
const getJDByJobId = db.prepare("SELECT * FROM job_descriptions WHERE job_id = ?");
const getAllJDs = db.prepare("SELECT * FROM job_descriptions ORDER BY created_at DESC");
const deleteJD = db.prepare("DELETE FROM job_descriptions WHERE id = ?");

function saveJD(id, parsed, rawText, filename) {
    insertJD.run(
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
        filename
    );
}

function getJDById(id) {
    const row = getJD.get(id);
    if (!row) return null;
    return {
        ...row,
        required_skills: JSON.parse(row.required_skills || "[]"),
        optional_skills: JSON.parse(row.optional_skills || "[]"),
        all_skills: JSON.parse(row.all_skills || "[]"),
    };
}

function listJDs() {
    return getAllJDs.all().map((row) => ({
        ...row,
        required_skills: JSON.parse(row.required_skills || "[]"),
        optional_skills: JSON.parse(row.optional_skills || "[]"),
        all_skills: JSON.parse(row.all_skills || "[]"),
    }));
}

function removeJD(id) {
    deleteJD.run(id);
    db.prepare("DELETE FROM match_results WHERE jd_id = ?").run(id);
}

// ─── Match Results CRUD ──────────────────────────────────────────
const insertMatch = db.prepare(`
  INSERT OR REPLACE INTO match_results (id, resume_id, jd_id, matching_score, skills_analysis)
  VALUES (?, ?, ?, ?, ?)
`);

const getMatchesByResume = db.prepare(`
  SELECT mr.*, jd.role, jd.job_id, jd.about_role
  FROM match_results mr
  JOIN job_descriptions jd ON mr.jd_id = jd.id
  WHERE mr.resume_id = ?
  ORDER BY mr.matching_score DESC
`);

function saveMatchResult(id, resumeId, jdId, score, skillsAnalysis) {
    insertMatch.run(id, resumeId, jdId, score, JSON.stringify(skillsAnalysis));
}

function getMatchesForResume(resumeId) {
    return getMatchesByResume.all(resumeId).map((row) => ({
        ...row,
        skills_analysis: JSON.parse(row.skills_analysis || "[]"),
    }));
}

module.exports = {
    db,
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
