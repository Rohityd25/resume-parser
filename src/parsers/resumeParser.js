/**
 * Resume Parser Module
 * Extracts structured information from resume text using rule-based methods.
 * No LLMs — only regex, dictionaries, and heuristic rules.
 */

const { SKILLS_LOOKUP } = require("../data/skills");

// ─── Name Extraction ──────────────────────────────────────────────
/**
 * Extract candidate name from the top of the resume.
 * Heuristic: The first non-empty, non-email, non-phone line is likely the name.
 */
function extractName(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    for (const line of lines.slice(0, 8)) {
        // Skip lines that look like headers, emails, phones, URLs, addresses
        if (/^(resume|curriculum vitae|cv|objective|summary|profile|contact)/i.test(line)) continue;
        if (/@/.test(line)) continue; // email
        if (/(\+?\d[\d\s\-()]{7,})/.test(line)) continue; // phone
        if (/^(http|www\.)/i.test(line)) continue; // URL
        if (/\d{5,}/.test(line)) continue; // ZIP code / long number
        if (line.length > 60) continue; // Too long for a name
        if (line.split(/\s+/).length > 5) continue; // Too many words

        // Check if line looks like a proper name (2-4 title-case words)
        const namePattern = /^[A-Z][a-zA-Z'.]+(?:\s+[A-Z][a-zA-Z'.]+){0,3}$/;
        if (namePattern.test(line)) {
            return line;
        }

        // Fallback: if the first line has 2-4 words, assume it is name
        const words = line.split(/\s+/);
        if (words.length >= 1 && words.length <= 4 && /[A-Za-z]/.test(line)) {
            return line;
        }
    }

    return "Unknown";
}

// ─── Email Extraction ─────────────────────────────────────────────
function extractEmail(text) {
    const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    return match ? match[0] : null;
}

// ─── Phone Extraction ─────────────────────────────────────────────
function extractPhone(text) {
    const patterns = [
        /(?:\+91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}/,            // Indian mobile
        /(?:\+1[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/, // US format
        /\+?\d{1,3}[\s\-]?\d{4,5}[\s\-]?\d{4,5}/,             // General intl
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[0].trim();
    }
    return null;
}

// ─── Education Extraction ─────────────────────────────────────────
function extractEducation(text) {
    const degrees = [];
    const degreePatterns = [
        /\b(B\.?Tech|B\.?E\.?|Bachelor(?:'?s)?\s+(?:of\s+)?(?:Technology|Engineering|Science|Arts|Commerce))\b/gi,
        /\b(M\.?Tech|M\.?E\.?|Master(?:'?s)?\s+(?:of\s+)?(?:Technology|Engineering|Science|Arts|Business|Commerce))\b/gi,
        /\b(MBA|M\.?B\.?A\.?)\b/gi,
        /\b(MCA|M\.?C\.?A\.?)\b/gi,
        /\b(BCA|B\.?C\.?A\.?)\b/gi,
        /\b(B\.?Sc|M\.?Sc|B\.?Com|M\.?Com)\b/gi,
        /\b(Ph\.?D|Doctorate)\b/gi,
        /\b(Diploma)\b/gi,
        /\b(12th|10th|HSC|SSC|CBSE|ICSE)\b/gi,
    ];

    for (const pattern of degreePatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const deg = match[1].trim();
            if (!degrees.find((d) => d.toLowerCase() === deg.toLowerCase())) {
                degrees.push(deg);
            }
        }
    }

    return degrees;
}

// ─── Experience (Years) Extraction ────────────────────────────────
function extractYearsOfExperience(text) {
    // Direct statements
    const directPatterns = [
        /(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?(?:experience|exp)/i,
        /(?:experience|exp)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?/i,
        /(\d+(?:\.\d+)?)\s*\+?\s*yrs?\s+(?:of\s+)?(?:experience|exp)/i,
        /(?:total|overall)\s+(?:experience|exp)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/i,
        /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s+in\s+(?:software|IT|development|industry)/i,
    ];

    for (const pattern of directPatterns) {
        const match = text.match(pattern);
        if (match) {
            return parseFloat(match[1]);
        }
    }

    // Fresher / Entry-level
    if (/\b(fresher|entry[\s\-]?level|graduate|recent graduate|no experience)\b/i.test(text)) {
        return 0;
    }

    // Calculate from date ranges (e.g., "Jan 2019 - Present")
    return calculateExperienceFromDates(text);
}

/**
 * Calculate experience by finding date ranges in the resume and summing them.
 */
function calculateExperienceFromDates(text) {
    const months = {
        jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
        apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
        aug: 7, august: 7, sep: 8, sept: 8, september: 8,
        oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
    };

    const dateRangePattern =
        /(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,]?\s+)?(\d{4})\s*[\-–—to]+\s*(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,]?\s+)?(\d{4}|present|current|till\s+date|ongoing)/gi;

    let totalMonths = 0;
    let match;

    while ((match = dateRangePattern.exec(text)) !== null) {
        const startMonth = match[1] ? months[match[1].toLowerCase().replace(".", "")] || 0 : 0;
        const startYear = parseInt(match[2]);

        let endMonth, endYear;
        if (/present|current|till|ongoing/i.test(match[4])) {
            const now = new Date();
            endMonth = now.getMonth();
            endYear = now.getFullYear();
        } else {
            endMonth = match[3] ? months[match[3].toLowerCase().replace(".", "")] || 0 : 11;
            endYear = parseInt(match[4]);
        }

        const diffMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
        if (diffMonths > 0 && diffMonths < 600) {
            totalMonths += diffMonths;
        }
    }

    if (totalMonths > 0) {
        return Math.round((totalMonths / 12) * 10) / 10; // 1 decimal
    }

    return null;
}

// ─── Salary Extraction ────────────────────────────────────────────
function extractSalary(text) {
    const salaryPatterns = [
        // LPA formats
        /(?:salary|ctc|compensation|package|current\s+(?:ctc|salary)|expected\s+(?:ctc|salary))\s*[:\-]?\s*(₹?\s*\d+(?:\.\d+)?\s*(?:lpa|lakhs?\s*per\s*annum|l\.?p\.?a\.?))/i,
        /(₹?\s*\d+(?:\.\d+)?\s*(?:lpa|lakhs?\s*per\s*annum|l\.?p\.?a\.?))/i,
        // Per annum formats
        /(?:salary|ctc|compensation|package)\s*[:\-]?\s*(₹?\s*[\d,]+(?:\.\d+)?\s*(?:per\s+annum|p\.?a\.?|\/\s*annum|\/\s*year))/i,
        // INR explicit
        /((?:INR|₹)\s*[\d,]+(?:\.\d+)?(?:\s*(?:per\s+annum|p\.?a\.?|\/\s*annum|\/\s*year|lpa|lakhs?))?)/i,
        // USD / generic
        /(?:salary|ctc|compensation)\s*[:\-]?\s*(\$?\s*[\d,]+(?:\.\d+)?(?:\s*(?:k|K|per\s+annum|\/\s*year|annually))?)/i,
    ];

    for (const pattern of salaryPatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }
    return null;
}

// ─── Skills Extraction ────────────────────────────────────────────
/**
 * Extract skills from text using the skills lookup dictionary.
 * Uses word-boundary-aware matching to avoid false positives.
 */
function extractSkills(text) {
    const found = new Set();
    const normalizedText = text.toLowerCase();

    // Build token set for single-word skills (fast lookup)
    const tokens = new Set(
        normalizedText
            .replace(/[^a-z0-9#+.\-\/]/g, " ")
            .split(/\s+/)
            .filter(Boolean)
    );

    for (const [alias, canonical] of SKILLS_LOOKUP) {
        if (found.has(canonical)) continue;

        // Single-word aliases: check token set
        if (!alias.includes(" ")) {
            if (tokens.has(alias)) {
                found.add(canonical);
                continue;
            }
        }

        // Multi-word aliases: check substring with word boundaries
        // Escape special regex chars in the alias
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`(?:^|[\\s,;|/()\\[\\]])${escaped}(?:$|[\\s,;|/()\\[\\]])`, "i");
        if (re.test(normalizedText)) {
            found.add(canonical);
        }
    }

    return [...found].sort();
}

// ─── LinkedIn Extraction ──────────────────────────────────────────
function extractLinkedIn(text) {
    const match = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i);
    return match ? match[0] : null;
}

// ─── GitHub Extraction ────────────────────────────────────────────
function extractGitHub(text) {
    const match = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9\-_]+/i);
    return match ? match[0] : null;
}

// ─── Summary / Objective Extraction ───────────────────────────────
function extractSummary(text) {
    const summaryPatterns = [
        /(?:summary|objective|about\s+me|profile|professional\s+summary|career\s+objective)\s*[:\-]?\s*\n?([\s\S]{20,500}?)(?=\n\s*(?:[A-Z][A-Z\s]+:?|education|experience|skills|projects|certifications|work history|technical|achievements)|\n{3,}|$)/i,
    ];

    for (const pattern of summaryPatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1].trim().replace(/\s+/g, " ").substring(0, 500);
        }
    }
    return null;
}

// ─── Main Parse Function ──────────────────────────────────────────
/**
 * Parse resume text and return structured data.
 * @param {string} text - The raw text of the resume.
 * @returns {Object} Parsed resume data.
 */
function parseResume(text) {
    return {
        name: extractName(text),
        email: extractEmail(text),
        phone: extractPhone(text),
        linkedin: extractLinkedIn(text),
        github: extractGitHub(text),
        education: extractEducation(text),
        yearOfExperience: extractYearsOfExperience(text),
        salary: extractSalary(text),
        resumeSkills: extractSkills(text),
        summary: extractSummary(text),
    };
}

module.exports = {
    parseResume,
    extractName,
    extractEmail,
    extractPhone,
    extractEducation,
    extractYearsOfExperience,
    extractSalary,
    extractSkills,
    extractLinkedIn,
    extractGitHub,
    extractSummary,
};
