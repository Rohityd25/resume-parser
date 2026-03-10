/**
 * Seed Script — Populates the database with sample JDs for testing.
 * Run: npm run seed
 */

const { v4: uuidv4 } = require("uuid");
const { parseJobDescription } = require("./parsers/jdParser");
const { initDB, saveJD } = require("./db/database");

const SAMPLE_JDS = [
    {
        jobId: "JD001",
        text: `Backend Developer

About the Role:
We are looking for an experienced Backend Developer to design and build scalable, high-performance server-side applications. You will work with cross-functional teams to deliver APIs and microservices that power our platform.

Required Skills:
Java, Spring Boot, MySQL, Docker, Kafka, REST API, Microservices, Git

Nice to Have:
Kubernetes, AWS, Redis, MongoDB, CI/CD, GraphQL

Experience: 3-5 years
Salary: 12 LPA`,
    },
    {
        jobId: "JD002",
        text: `Full Stack Developer

Job Title: Full Stack Developer

About the Role:
Join our engineering team to build modern web applications from front to back. You'll own features end-to-end, from designing React UIs to building Node.js APIs with database integration.

Required Skills:
JavaScript, TypeScript, React, Node.js, Express, MongoDB, PostgreSQL, HTML, CSS, Git

Nice to Have:
Next.js, GraphQL, Docker, AWS, Jest, Tailwind CSS, Redux

Experience: 2-4 years
Salary: 10 LPA`,
    },
    {
        jobId: "JD003",
        text: `Data Engineer

Position: Data Engineer

About the Role:
We need a Data Engineer to build and maintain our data infrastructure. You'll design ETL pipelines, manage data warehouses, and enable analytics teams with clean, reliable data.

Required Skills:
Python, SQL, Apache Spark, Hadoop, AWS, PostgreSQL, Kafka, Docker

Nice to Have:
Scala, Airflow, Terraform, Elasticsearch, Tableau, Machine Learning, Redis

Experience: 3-6 years
Salary: 15 LPA`,
    },
    {
        jobId: "JD004",
        text: `Frontend Developer

Role: Frontend Developer

About the Role:
We're looking for a creative Frontend Developer to build beautiful, responsive user interfaces. You'll collaborate closely with designers and backend engineers to deliver pixel-perfect experiences.

Required Skills:
React, JavaScript, TypeScript, HTML, CSS, Tailwind CSS, Redux, Git

Nice to Have:
Vue.js, Next.js, Figma, Jest, Cypress, Webpack, Storybook

Experience: 1-3 years
Salary: 8 LPA`,
    },
    {
        jobId: "JD005",
        text: `DevOps Engineer

Job Title: DevOps Engineer

About the Role:
Responsible for building and maintaining CI/CD pipelines, container orchestration, and cloud infrastructure. You'll ensure high availability, monitoring, and automated deployments.

Required Skills:
Docker, Kubernetes, AWS, Jenkins, CI/CD, Terraform, Linux, Git, Nginx, Python

Nice to Have:
Ansible, Prometheus, Grafana, Helm, GCP, Azure, ELK Stack

Experience: 4-7 years
Salary: 18 LPA
CTC: ₹18,00,000 per annum`,
    },
];

async function seed() {
    await initDB();

    console.log("🌱 Seeding database with sample job descriptions...\n");

    for (const item of SAMPLE_JDS) {
        const parsed = parseJobDescription(item.text, item.jobId);
        const id = uuidv4();
        saveJD(id, parsed, item.text, `sample-${item.jobId}.txt`);

        console.log(`  ✅ ${item.jobId}: ${parsed.role}`);
        console.log(`     Salary: ${parsed.salary || "N/A"}`);
        console.log(`     Experience: ${parsed.experience || "N/A"}`);
        console.log(`     Required Skills: ${parsed.requiredSkills.join(", ")}`);
        console.log(`     Optional Skills: ${parsed.optionalSkills.join(", ") || "None"}`);
        console.log();
    }

    console.log(`✅ Seeded ${SAMPLE_JDS.length} job descriptions.`);
    console.log("   Run 'npm start' or 'npm run dev' to start the server.\n");
}

seed().catch(console.error);
