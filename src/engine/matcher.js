/**
 * Matching Engine Module
 * Calculates match scores between resumes and job descriptions.
 * Uses JD skill match percentage as the primary metric.
 */

/**
 * Match a parsed resume against a parsed job description.
 * @param {Object} resume  - Parsed resume object (from resumeParser).
 * @param {Object} jd      - Parsed JD object (from jdParser).
 * @returns {Object} Match result with skills analysis and score.
 */
function matchResumeToJD(resume, jd) {
    const resumeSkillsSet = new Set(resume.resumeSkills.map((s) => s.toLowerCase()));
    const jdSkills = jd.allSkills.length > 0 ? jd.allSkills : jd.requiredSkills;

    // Build skill analysis
    const skillsAnalysis = jdSkills.map((skill) => ({
        skill,
        presentInResume: resumeSkillsSet.has(skill.toLowerCase()),
    }));

    // Calculate matching score
    const matchedCount = skillsAnalysis.filter((s) => s.presentInResume).length;
    const totalCount = skillsAnalysis.length;
    const matchingScore = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

    return {
        jobId: jd.jobId,
        role: jd.role,
        aboutRole: jd.aboutRole,
        salary: jd.salary,
        experience: jd.experience,
        requiredSkills: jd.requiredSkills,
        optionalSkills: jd.optionalSkills,
        skillsAnalysis,
        matchedSkillsCount: matchedCount,
        totalJDSkills: totalCount,
        matchingScore,
    };
}

/**
 * Match a resume against multiple JDs and return sorted results.
 * @param {Object} resume  - Parsed resume object.
 * @param {Array}  jds     - Array of parsed JD objects.
 * @returns {Array} Sorted match results (highest score first).
 */
function matchResumeToMultipleJDs(resume, jds) {
    const results = jds.map((jd) => matchResumeToJD(resume, jd));
    return results.sort((a, b) => b.matchingScore - a.matchingScore);
}

/**
 * Generate the final output JSON as specified in the requirements.
 * @param {Object} resume   - Parsed resume object.
 * @param {Array}  matchResults - Array of match results.
 * @returns {Object} Final output JSON.
 */
function generateOutputJSON(resume, matchResults) {
    return {
        name: resume.name,
        email: resume.email,
        phone: resume.phone,
        salary: resume.salary,
        yearOfExperience: resume.yearOfExperience,
        resumeSkills: resume.resumeSkills,
        education: resume.education,
        matchingJobs: matchResults.map((result) => ({
            jobId: result.jobId,
            role: result.role,
            aboutRole: result.aboutRole,
            skillsAnalysis: result.skillsAnalysis,
            matchingScore: result.matchingScore,
        })),
    };
}

module.exports = {
    matchResumeToJD,
    matchResumeToMultipleJDs,
    generateOutputJSON,
};
