/**
 * API Routes
 * RESTful endpoints for resume parsing, JD processing, and matching.
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const { extractText } = require("../parsers/fileParser");
const { parseResume } = require("../parsers/resumeParser");
const { parseJobDescription } = require("../parsers/jdParser");
const { matchResumeToJD, matchResumeToMultipleJDs, generateOutputJSON } = require("../engine/matcher");
const db = require("../db/database");

const router = express.Router();

// ─── Multer Configuration ─────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4().slice(0, 8)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const allowedExts = [".pdf", ".docx", ".doc", ".txt"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowedExts.join(", ")}`));
        }
    },
});

// ─── RESUME ENDPOINTS ─────────────────────────────────────────────

/**
 * POST /api/resumes/upload
 * Upload and parse a resume file.
 */
router.post("/resumes/upload", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded. Use field name 'resume'." });
        }

        const filePath = req.file.path;
        const rawText = await extractText(filePath);
        const parsed = parseResume(rawText);
        const id = uuidv4();

        db.saveResume(id, parsed, rawText, req.file.originalname);

        // Clean up uploaded file (we stored the text)
        fs.unlinkSync(filePath);

        res.status(201).json({
            success: true,
            message: "Resume parsed successfully",
            data: {
                id,
                ...parsed,
            },
        });
    } catch (err) {
        console.error("Resume upload error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/resumes/parse-text
 * Parse resume from raw text (for pasted content).
 */
router.post("/resumes/parse-text", express.json(), async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length < 10) {
            return res.status(400).json({ error: "Resume text is required (min 10 characters)." });
        }

        const parsed = parseResume(text);
        const id = uuidv4();

        db.saveResume(id, parsed, text, "pasted-text");

        res.status(201).json({
            success: true,
            message: "Resume parsed successfully",
            data: { id, ...parsed },
        });
    } catch (err) {
        console.error("Resume parse-text error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/resumes
 * List all parsed resumes.
 */
router.get("/resumes", (req, res) => {
    try {
        const resumes = db.listResumes();
        res.json({
            success: true,
            count: resumes.length,
            data: resumes.map((r) => ({
                id: r.id,
                name: r.name,
                email: r.email,
                phone: r.phone,
                skills: r.skills,
                yearOfExperience: r.year_of_experience,
                education: r.education,
                createdAt: r.created_at,
            })),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/resumes/:id
 * Get a specific parsed resume.
 */
router.get("/resumes/:id", (req, res) => {
    try {
        const resume = db.getResumeById(req.params.id);
        if (!resume) return res.status(404).json({ error: "Resume not found" });

        res.json({
            success: true,
            data: {
                id: resume.id,
                name: resume.name,
                email: resume.email,
                phone: resume.phone,
                linkedin: resume.linkedin,
                github: resume.github,
                salary: resume.salary,
                yearOfExperience: resume.year_of_experience,
                resumeSkills: resume.skills,
                education: resume.education,
                summary: resume.summary,
                createdAt: resume.created_at,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/resumes/:id
 * Delete a resume.
 */
router.delete("/resumes/:id", (req, res) => {
    try {
        db.removeResume(req.params.id);
        res.json({ success: true, message: "Resume deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── JOB DESCRIPTION ENDPOINTS ───────────────────────────────────

/**
 * POST /api/jds/upload
 * Upload and parse a JD file.
 */
router.post("/jds/upload", upload.single("jd"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded. Use field name 'jd'." });
        }

        const filePath = req.file.path;
        const rawText = await extractText(filePath);
        const jobId = req.body.jobId || `JD-${Date.now()}`;
        const parsed = parseJobDescription(rawText, jobId);
        const id = uuidv4();

        db.saveJD(id, parsed, rawText, req.file.originalname);
        fs.unlinkSync(filePath);

        res.status(201).json({
            success: true,
            message: "Job description parsed successfully",
            data: { id, ...parsed },
        });
    } catch (err) {
        console.error("JD upload error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/jds/parse-text
 * Parse JD from raw text.
 */
router.post("/jds/parse-text", express.json(), async (req, res) => {
    try {
        const { text, jobId } = req.body;
        if (!text || text.trim().length < 10) {
            return res.status(400).json({ error: "JD text is required (min 10 characters)." });
        }

        const parsed = parseJobDescription(text, jobId || `JD-${Date.now()}`);
        const id = uuidv4();

        db.saveJD(id, parsed, text, "pasted-text");

        res.status(201).json({
            success: true,
            message: "Job description parsed successfully",
            data: { id, ...parsed },
        });
    } catch (err) {
        console.error("JD parse-text error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/jds
 * List all parsed JDs.
 */
router.get("/jds", (req, res) => {
    try {
        const jds = db.listJDs();
        res.json({
            success: true,
            count: jds.length,
            data: jds.map((jd) => ({
                id: jd.id,
                jobId: jd.job_id,
                role: jd.role,
                salary: jd.salary,
                experience: jd.experience,
                requiredSkills: jd.required_skills,
                optionalSkills: jd.optional_skills,
                createdAt: jd.created_at,
            })),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/jds/:id
 * Get a specific JD.
 */
router.get("/jds/:id", (req, res) => {
    try {
        const jd = db.getJDById(req.params.id);
        if (!jd) return res.status(404).json({ error: "Job description not found" });

        res.json({
            success: true,
            data: {
                id: jd.id,
                jobId: jd.job_id,
                role: jd.role,
                aboutRole: jd.about_role,
                salary: jd.salary,
                experience: jd.experience,
                requiredSkills: jd.required_skills,
                optionalSkills: jd.optional_skills,
                allSkills: jd.all_skills,
                createdAt: jd.created_at,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/jds/:id
 */
router.delete("/jds/:id", (req, res) => {
    try {
        db.removeJD(req.params.id);
        res.json({ success: true, message: "Job description deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── MATCHING ENDPOINTS ──────────────────────────────────────────

/**
 * POST /api/match
 * Match a specific resume against all JDs (or specific JDs).
 * Body: { resumeId, jdIds? }
 */
router.post("/match", express.json(), (req, res) => {
    try {
        const { resumeId, jdIds } = req.body;

        if (!resumeId) {
            return res.status(400).json({ error: "resumeId is required" });
        }

        const resumeRow = db.getResumeById(resumeId);
        if (!resumeRow) return res.status(404).json({ error: "Resume not found" });

        // Build resume object for matcher
        const resume = {
            name: resumeRow.name,
            email: resumeRow.email,
            phone: resumeRow.phone,
            salary: resumeRow.salary,
            yearOfExperience: resumeRow.year_of_experience,
            resumeSkills: resumeRow.skills,
            education: resumeRow.education,
        };

        // Get JDs
        let jdRows;
        if (jdIds && jdIds.length > 0) {
            jdRows = jdIds.map((id) => db.getJDById(id)).filter(Boolean);
        } else {
            jdRows = db.listJDs();
        }

        if (jdRows.length === 0) {
            return res.status(400).json({ error: "No job descriptions found to match against." });
        }

        // Build JD objects for matcher
        const jds = jdRows.map((jd) => ({
            jobId: jd.job_id,
            role: jd.role,
            aboutRole: jd.about_role,
            salary: jd.salary,
            experience: jd.experience,
            requiredSkills: jd.required_skills,
            optionalSkills: jd.optional_skills,
            allSkills: jd.all_skills,
        }));

        const matchResults = matchResumeToMultipleJDs(resume, jds);
        const output = generateOutputJSON(resume, matchResults);

        // Save match results to DB
        matchResults.forEach((result) => {
            const matchId = uuidv4();
            const jdRow = jdRows.find((j) => j.job_id === result.jobId);
            if (jdRow) {
                db.saveMatchResult(matchId, resumeId, jdRow.id, result.matchingScore, result.skillsAnalysis);
            }
        });

        res.json({
            success: true,
            message: `Matched against ${jds.length} job description(s)`,
            data: output,
        });
    } catch (err) {
        console.error("Match error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/match/quick
 * Quick match: upload resume + paste JD text, get instant results.
 * Accepts multipart form: resume file + jdText field.
 */
router.post("/match/quick", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Resume file is required (field: 'resume')." });
        }
        if (!req.body.jdText || req.body.jdText.trim().length < 10) {
            return res.status(400).json({ error: "JD text is required (field: 'jdText', min 10 chars)." });
        }

        const filePath = req.file.path;
        const rawResumeText = await extractText(filePath);
        const resume = parseResume(rawResumeText);
        const jd = parseJobDescription(req.body.jdText, req.body.jobId || `JD-QUICK-${Date.now()}`);

        const matchResults = matchResumeToMultipleJDs(resume, [jd]);
        const output = generateOutputJSON(resume, matchResults);

        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: "Quick match completed",
            data: output,
        });
    } catch (err) {
        console.error("Quick match error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/match/results/:resumeId
 * Get saved match results for a resume.
 */
router.get("/match/results/:resumeId", (req, res) => {
    try {
        const results = db.getMatchesForResume(req.params.resumeId);
        res.json({
            success: true,
            count: results.length,
            data: results.map((r) => ({
                jobId: r.job_id,
                role: r.role,
                aboutRole: r.about_role,
                matchingScore: r.matching_score,
                skillsAnalysis: r.skills_analysis,
                createdAt: r.created_at,
            })),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── HEALTH / INFO ────────────────────────────────────────────────

router.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "Resume Parser & Job Matcher",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        note: "No LLMs used — 100% rule-based NLP",
    });
});

module.exports = router;
