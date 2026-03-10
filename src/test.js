/**
 * Test Script — Verifies the parsing and matching pipeline.
 * Run: npm test
 */

const { parseResume, extractSkills } = require("./parsers/resumeParser");
const { parseJobDescription } = require("./parsers/jdParser");
const { matchResumeToJD, matchResumeToMultipleJDs, generateOutputJSON } = require("./engine/matcher");

console.log("\n═══════════════════════════════════════════");
console.log("  ResumeIQ — Pipeline Test Suite");
console.log("═══════════════════════════════════════════\n");

let passed = 0;
let failed = 0;

function assert(label, condition) {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.log(`  ❌ ${label}`);
        failed++;
    }
}

// ─── Test 1: Resume Parsing ─────────────────────────────────
console.log("📄 Test 1: Resume Parsing\n");

const sampleResume = `
John Doe
john.doe@gmail.com | +91 98765 43210
linkedin.com/in/johndoe | github.com/johndoe

Summary: Experienced Full Stack Developer with 4.5 years of experience in building scalable web applications.

Skills: Java, Spring Boot, React, Node.js, MySQL, MongoDB, Docker, Git, REST API, Kafka, AWS, TypeScript, HTML, CSS

Education:
B.Tech in Computer Science from IIT Delhi, 2018

Experience:
Senior Developer at TechCorp
Jan 2020 - Present
- Built microservices using Spring Boot and Kafka
- Developed React frontend with TypeScript

Junior Developer at StartupXYZ
Jun 2018 - Dec 2019
- Full stack development with Node.js and MongoDB

Current CTC: 12 LPA
`;

const parsedResume = parseResume(sampleResume);

assert("Name extracted", parsedResume.name === "John Doe");
assert("Email extracted", parsedResume.email === "john.doe@gmail.com");
assert("Phone extracted", parsedResume.phone !== null);
assert("Experience extracted", parsedResume.yearOfExperience !== null && parsedResume.yearOfExperience > 0);
assert("Skills extracted (>= 10)", parsedResume.resumeSkills.length >= 10);
assert("Java skill found", parsedResume.resumeSkills.includes("Java"));
assert("React skill found", parsedResume.resumeSkills.includes("React"));
assert("Docker skill found", parsedResume.resumeSkills.includes("Docker"));
assert("Education found", parsedResume.education.length > 0);
assert("LinkedIn found", parsedResume.linkedin !== null);
assert("GitHub found", parsedResume.github !== null);

// ─── Test 2: JD Parsing ────────────────────────────────────
console.log("\n\n💼 Test 2: JD Parsing\n");

const sampleJD = `
Backend Developer

About the Role:
We are looking for an experienced Backend Developer to design and build scalable server-side applications.

Required Skills:
Java, Spring Boot, MySQL, Docker, Kafka, REST API, Microservices, Git

Nice to Have:
Kubernetes, AWS, Redis, MongoDB

Experience: 3-5 years
Salary: 12 LPA
`;

const parsedJD = parseJobDescription(sampleJD, "JD001");

assert("Job ID set", parsedJD.jobId === "JD001");
assert("Role extracted", parsedJD.role.length > 3);
assert("Salary extracted", parsedJD.salary !== null);
assert("Experience extracted", parsedJD.experience !== null);
assert("Skills found (>= 5)", parsedJD.allSkills.length >= 5);
assert("Java in JD skills", parsedJD.allSkills.includes("Java"));
assert("Kafka in JD skills", parsedJD.allSkills.includes("Kafka"));
assert("About role extracted", parsedJD.aboutRole && parsedJD.aboutRole.length > 10);

// ─── Test 3: Matching ──────────────────────────────────────
console.log("\n\n🎯 Test 3: Matching\n");

const matchResult = matchResumeToJD(parsedResume, parsedJD);

assert("Match result has jobId", matchResult.jobId === "JD001");
assert("Skills analysis is array", Array.isArray(matchResult.skillsAnalysis));
assert("Score is number 0-100", typeof matchResult.matchingScore === "number" && matchResult.matchingScore >= 0 && matchResult.matchingScore <= 100);
assert("Score > 0 (resume has matching skills)", matchResult.matchingScore > 0);
assert("Java is matched", matchResult.skillsAnalysis.find((s) => s.skill === "Java")?.presentInResume === true);

console.log(`  Matching Score: ${matchResult.matchingScore}%`);

// ─── Test 4: Multi-JD Matching ─────────────────────────────
console.log("\n\n📊 Test 4: Multi-JD Matching\n");

const jd2 = parseJobDescription("Frontend Developer\nRequired Skills: React, Vue.js, Angular, TypeScript, CSS, HTML, Figma, Jest\nExperience: 2+ years\nSalary: 8 LPA", "JD002");
const jd3 = parseJobDescription("Python Data Engineer\nRequired Skills: Python, Pandas, NumPy, Apache Spark, Hadoop, TensorFlow, Scikit-learn\nExperience: 3+ years\nSalary: 15 LPA", "JD003");

const multiResults = matchResumeToMultipleJDs(parsedResume, [parsedJD, jd2, jd3]);

assert("3 results returned", multiResults.length === 3);
assert("Results sorted by score (desc)", multiResults[0].matchingScore >= multiResults[1].matchingScore);

multiResults.forEach((r) => {
    console.log(`  ${r.jobId} (${r.role}): ${r.matchingScore}% match`);
});

// ─── Test 5: Output JSON ───────────────────────────────────
console.log("\n\n📋 Test 5: Output JSON Format\n");

const output = generateOutputJSON(parsedResume, multiResults);

assert("Output has name", output.name === "John Doe");
assert("Output has resumeSkills array", Array.isArray(output.resumeSkills));
assert("Output has matchingJobs array", Array.isArray(output.matchingJobs));
assert("Each job has matchingScore", output.matchingJobs.every((j) => typeof j.matchingScore === "number"));
assert("Each job has skillsAnalysis", output.matchingJobs.every((j) => Array.isArray(j.skillsAnalysis)));

// ─── Test 6: Edge Cases ────────────────────────────────────
console.log("\n\n⚡ Test 6: Edge Cases\n");

const emptyResume = parseResume("");
assert("Empty resume returns name 'Unknown'", emptyResume.name === "Unknown");
assert("Empty resume returns empty skills", emptyResume.resumeSkills.length === 0);

const fresherResume = parseResume("Jane Smith\njane@email.com\nFresher\nSkills: Python, React");
assert("Fresher = 0 years experience", fresherResume.yearOfExperience === 0);
assert("Fresher skills extracted", fresherResume.resumeSkills.length >= 2);

const salaryJD = parseJobDescription("Role: Test\nSalary: ₹10,00,000 per annum\nSkills: Python", "JD-SAL");
assert("INR salary extracted", salaryJD.salary !== null);

console.log("\n═══════════════════════════════════════════");
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log("═══════════════════════════════════════════\n");

process.exit(failed > 0 ? 1 : 0);
