/**
 * Job Description Parser Module
 * Extracts structured information from JD text using rule-based methods.
 * No LLMs — only regex, dictionaries, and heuristic rules.
 */

const { extractSkills } = require("./resumeParser");

// ─── Salary Extraction from JD ────────────────────────────────────
function extractJDSalary(text) {
    const patterns = [
        // LPA formats
        /(?:salary|ctc|compensation|package|offering|range)\s*[:\-]?\s*(₹?\s*\d+(?:\.\d+)?\s*[\-–to]+\s*\d+(?:\.\d+)?\s*(?:lpa|l\.?p\.?a\.?|lakhs?\s*(?:per\s+annum)?))/i,
        /(?:salary|ctc|compensation|package|offering|range)\s*[:\-]?\s*(₹?\s*\d+(?:\.\d+)?\s*(?:lpa|l\.?p\.?a\.?|lakhs?\s*(?:per\s+annum)?))/i,
        /(₹?\s*\d+(?:\.\d+)?\s*[\-–to]+\s*\d+(?:\.\d+)?\s*(?:lpa|l\.?p\.?a\.?|lakhs?\s*(?:per\s+annum)?))/i,
        /(₹?\s*\d+(?:\.\d+)?\s*(?:lpa|l\.?p\.?a\.?|lakhs?\s*(?:per\s+annum)?))/i,
        // INR per annum
        /(?:salary|ctc|compensation)\s*[:\-]?\s*((?:INR|₹)\s*[\d,]+(?:\.\d+)?\s*(?:[\-–to]+\s*(?:INR|₹)?\s*[\d,]+(?:\.\d+)?)?\s*(?:per\s+annum|p\.?a\.?|\/\s*annum|\/\s*year)?)/i,
        // USD
        /(?:salary|ctc|compensation)\s*[:\-]?\s*(\$\s*[\d,]+(?:\.\d+)?(?:\s*[\-–to]+\s*\$?\s*[\d,]+(?:\.\d+)?)?\s*(?:k|K|per\s+annum|\/\s*year|annually)?)/i,
        // Generic large number with currency context
        /(?:salary|ctc|compensation|package)\s*[:\-]?\s*([\d,]+(?:\.\d+)?\s*(?:per\s+annum|p\.?a\.?|\/\s*annum|\/\s*year|annually))/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }
    return null;
}

// ─── Experience Extraction from JD ────────────────────────────────
function extractJDExperience(text) {
    const patterns = [
        // Range: "3-5 years"
        /(\d+(?:\.\d+)?)\s*[\-–to]+\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?/i,
        // Single: "5+ years" or "5 years of experience"
        /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)/i,
        // "Minimum 3 years"
        /(?:minimum|min|at\s+least)\s+(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/i,
        // "Experience: 5 years"
        /(?:experience|exp)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            // If it's a range, return "3-5 years"
            if (match[2]) {
                return `${match[1]}-${match[2]} years`;
            }
            return `${match[1]} years`;
        }
    }

    // Check for fresher / entry
    if (/\b(fresher|entry[\s\-]?level|0[\s\-]*(?:years?|yrs?)|no\s+prior\s+experience)\b/i.test(text)) {
        return "Fresher / Entry-Level";
    }

    return null;
}

// ─── Required vs Optional Skills ──────────────────────────────────
/**
 * Attempt to split JD skills into required and optional.
 * Looks for sections labeled "required", "must have", "nice to have", "preferred", etc.
 */
function extractJDSkillsCategorized(text) {
    const allSkills = extractSkills(text);

    // Try to find required / optional sections
    const requiredSection = text.match(
        /(?:required\s+skills?|must[\s\-]have|mandatory|essential|key\s+skills?|core\s+skills?|technical\s+skills?)\s*[:\-]?\s*\n?([\s\S]{10,1500}?)(?=\n\s*(?:nice|preferred|optional|good|bonus|additional|desired|about|responsibilities|qualifications|education|experience|benefits|perks|salary|compensation|[A-Z][A-Z\s]+:)|\n{3,}|$)/i
    );

    const optionalSection = text.match(
        /(?:nice[\s\-]to[\s\-]have|preferred|optional|good[\s\-]to[\s\-]have|bonus|desired|additional)\s*(?:skills?)?\s*[:\-]?\s*\n?([\s\S]{10,1500}?)(?=\n\s*(?:required|must|mandatory|essential|about|responsibilities|qualifications|education|experience|benefits|perks|salary|compensation|[A-Z][A-Z\s]+:)|\n{3,}|$)/i
    );

    let requiredSkills = allSkills;
    let optionalSkills = [];

    if (requiredSection && optionalSection) {
        requiredSkills = extractSkills(requiredSection[1]);
        optionalSkills = extractSkills(optionalSection[1]);

        // Any skills found in JD but not in either section → add to required
        for (const skill of allSkills) {
            if (!requiredSkills.includes(skill) && !optionalSkills.includes(skill)) {
                requiredSkills.push(skill);
            }
        }
    } else if (optionalSection) {
        optionalSkills = extractSkills(optionalSection[1]);
        requiredSkills = allSkills.filter((s) => !optionalSkills.includes(s));
    }

    return {
        requiredSkills: [...new Set(requiredSkills)].sort(),
        optionalSkills: [...new Set(optionalSkills)].sort(),
        allSkills: [...new Set(allSkills)].sort(),
    };
}

// ─── About Role / Summary Extraction ──────────────────────────────
function extractAboutRole(text) {
    const patterns = [
        /(?:about\s+(?:the\s+)?role|job\s+(?:description|summary)|role\s+(?:description|summary|overview)|overview|description|about\s+(?:the\s+)?(?:job|position))\s*[:\-]?\s*\n?([\s\S]{20,800}?)(?=\n\s*(?:required|must|mandatory|essential|key\s+skills|responsibilities|qualifications|skills|technical|education|experience|nice|preferred|[A-Z][A-Z\s]+:)|\n{3,}|$)/i,
        /(?:responsibilities|key\s+responsibilities|what\s+you.?ll\s+do)\s*[:\-]?\s*\n?([\s\S]{20,800}?)(?=\n\s*(?:required|must|mandatory|essential|key\s+skills|qualifications|skills|technical|education|experience|nice|preferred|[A-Z][A-Z\s]+:)|\n{3,}|$)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1].trim().replace(/\s+/g, " ").substring(0, 600);
        }
    }

    // Fallback: first 2-3 sentences
    const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 3).join(" ");
    if (sentences.length > 30) {
        return sentences.substring(0, 600);
    }

    return "No description available.";
}

// ─── Role / Title Extraction ──────────────────────────────────────
function extractJobTitle(text) {
    const patterns = [
        /(?:job\s+title|position|role|title|designation)\s*[:\-]?\s*(.+)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const title = match[1].trim().split("\n")[0].trim();
            if (title.length < 80) return title;
        }
    }

    // Fallback: first non-empty short line
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 5)) {
        if (line.length > 5 && line.length < 80 && !/^(job|about|company|location|salary|experience)/i.test(line)) {
            return line;
        }
    }

    return "Untitled Position";
}

// ─── Main JD Parse Function ──────────────────────────────────────
function parseJobDescription(text, jobId) {
    const skillsData = extractJDSkillsCategorized(text);

    return {
        jobId: jobId || `JD-${Date.now()}`,
        role: extractJobTitle(text),
        aboutRole: extractAboutRole(text),
        salary: extractJDSalary(text),
        experience: extractJDExperience(text),
        requiredSkills: skillsData.requiredSkills,
        optionalSkills: skillsData.optionalSkills,
        allSkills: skillsData.allSkills,
    };
}

module.exports = {
    parseJobDescription,
    extractJDSalary,
    extractJDExperience,
    extractJDSkillsCategorized,
    extractAboutRole,
    extractJobTitle,
};
