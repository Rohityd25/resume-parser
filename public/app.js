/**
 * ResumeIQ — Frontend Application
 * Handles UI interactions, API calls, and dynamic rendering.
 */

const API_BASE = "/api";

// ─── State ───────────────────────────────────────────────────
let currentTab = "dashboard";
let resumesCache = [];
let jdsCache = [];

// ─── Navigation ──────────────────────────────────────────────
function switchTab(tabName) {
    currentTab = tabName;

    // Update nav
    document.querySelectorAll(".nav-tab").forEach((t) => t.classList.remove("active"));
    const activeTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add("active");

    // Update content
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) activeContent.classList.add("active");

    // Load data for the tab
    if (tabName === "resumes") loadResumes();
    if (tabName === "jobs") loadJDs();
    if (tabName === "match") { loadMatchSelects(); }
    if (tabName === "dashboard") loadDashboardStats();
}

// Bind nav tabs
document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

// ─── Toast Notifications ─────────────────────────────────────
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
    <span>${type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}</span>
    <span>${message}</span>
  `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ─── Loading Overlay ─────────────────────────────────────────
function showLoading() {
    document.getElementById("loading-overlay").classList.add("active");
}
function hideLoading() {
    document.getElementById("loading-overlay").classList.remove("active");
}

// ─── Modal ───────────────────────────────────────────────────
function openModal(html) {
    document.getElementById("modal-body").innerHTML = html;
    document.getElementById("modal-overlay").classList.add("active");
}
function closeModal() {
    document.getElementById("modal-overlay").classList.remove("active");
}

// ─── API Helpers ─────────────────────────────────────────────
async function apiGet(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
}

async function apiPost(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
}

async function apiPostFile(endpoint, formData) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
}

async function apiDelete(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: "DELETE" });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
}

// ─── File Upload (Drag & Drop + Click) ──────────────────────
function setupUploadArea(areaId, inputId, handler) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);

    area.addEventListener("click", () => input.click());

    area.addEventListener("dragover", (e) => {
        e.preventDefault();
        area.classList.add("dragover");
    });

    area.addEventListener("dragleave", () => {
        area.classList.remove("dragover");
    });

    area.addEventListener("drop", (e) => {
        e.preventDefault();
        area.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
            handler(e.dataTransfer.files[0]);
        }
    });

    input.addEventListener("change", () => {
        if (input.files.length > 0) {
            handler(input.files[0]);
            input.value = "";
        }
    });
}

// ─── Resume Operations ──────────────────────────────────────
async function uploadResume(file) {
    showLoading();
    try {
        const fd = new FormData();
        fd.append("resume", file);
        const result = await apiPostFile("/resumes/upload", fd);
        hideLoading();
        showToast(`Resume parsed: ${result.data.name}`, "success");
        loadResumes();
        loadDashboardStats();
    } catch (err) {
        hideLoading();
        showToast(`Error: ${err.message}`, "error");
    }
}

async function parseResumeText() {
    const text = document.getElementById("resume-text-input").value.trim();
    if (!text || text.length < 10) {
        showToast("Please enter resume text (min 10 characters).", "error");
        return;
    }

    showLoading();
    try {
        const result = await apiPost("/resumes/parse-text", { text });
        hideLoading();
        showToast(`Resume parsed: ${result.data.name}`, "success");
        document.getElementById("resume-text-input").value = "";
        loadResumes();
        loadDashboardStats();
    } catch (err) {
        hideLoading();
        showToast(`Error: ${err.message}`, "error");
    }
}

async function loadResumes() {
    try {
        const result = await apiGet("/resumes");
        resumesCache = result.data || [];
        renderResumes(resumesCache);
    } catch (err) {
        showToast(`Failed to load resumes: ${err.message}`, "error");
    }
}

function renderResumes(resumes) {
    const container = document.getElementById("resumes-list");
    if (!resumes.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No resumes uploaded yet.</p></div>`;
        return;
    }

    container.innerHTML = resumes.map((r) => `
    <div class="data-card">
      <div class="card-header">
        <div>
          <div class="card-title">${escHtml(r.name || "Unknown")}</div>
          <div class="card-subtitle">${escHtml(r.email || "No email")} • ${r.yearOfExperience != null ? r.yearOfExperience + " yrs exp" : "Exp N/A"}</div>
        </div>
      </div>
      <div class="card-body">
        <div class="card-row"><strong>Education:</strong> ${(r.education || []).join(", ") || "N/A"}</div>
        <div class="skills-tags">
          ${(r.skills || []).slice(0, 10).map((s) => `<span class="skill-tag">${escHtml(s)}</span>`).join("")}
          ${(r.skills || []).length > 10 ? `<span class="skill-tag">+${r.skills.length - 10} more</span>` : ""}
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-ghost btn-sm" onclick="viewResumeDetail('${r.id}')">View Details</button>
        <button class="btn btn-danger btn-sm" onclick="deleteResume('${r.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

async function viewResumeDetail(id) {
    try {
        const result = await apiGet(`/resumes/${id}`);
        const r = result.data;
        openModal(`
      <h2>📄 ${escHtml(r.name)}</h2>
      <div class="card-row"><strong>Email:</strong> ${escHtml(r.email || "N/A")}</div>
      <div class="card-row"><strong>Phone:</strong> ${escHtml(r.phone || "N/A")}</div>
      <div class="card-row"><strong>LinkedIn:</strong> ${r.linkedin ? `<a href="${r.linkedin}" target="_blank" style="color:var(--accent-cyan)">${r.linkedin}</a>` : "N/A"}</div>
      <div class="card-row"><strong>GitHub:</strong> ${r.github ? `<a href="${r.github}" target="_blank" style="color:var(--accent-cyan)">${r.github}</a>` : "N/A"}</div>
      <div class="card-row"><strong>Experience:</strong> ${r.yearOfExperience != null ? r.yearOfExperience + " years" : "N/A"}</div>
      <div class="card-row"><strong>Salary:</strong> ${escHtml(r.salary || "N/A")}</div>
      <div class="card-row"><strong>Education:</strong> ${(r.education || []).join(", ") || "N/A"}</div>
      <div class="card-row"><strong>Summary:</strong> ${escHtml(r.summary || "N/A")}</div>
      <div style="margin-top: 1rem;">
        <strong style="color:var(--text-primary); font-size:0.9rem;">Skills (${(r.resumeSkills || []).length}):</strong>
        <div class="skills-tags" style="margin-top: 0.5rem;">
          ${(r.resumeSkills || []).map((s) => `<span class="skill-tag">${escHtml(s)}</span>`).join("")}
        </div>
      </div>
    `);
    } catch (err) {
        showToast(`Error: ${err.message}`, "error");
    }
}

async function deleteResume(id) {
    if (!confirm("Delete this resume?")) return;
    try {
        await apiDelete(`/resumes/${id}`);
        showToast("Resume deleted", "success");
        loadResumes();
        loadDashboardStats();
    } catch (err) {
        showToast(`Error: ${err.message}`, "error");
    }
}

// ─── JD Operations ──────────────────────────────────────────
async function uploadJD(file) {
    showLoading();
    try {
        const fd = new FormData();
        fd.append("jd", file);
        const result = await apiPostFile("/jds/upload", fd);
        hideLoading();
        showToast(`JD parsed: ${result.data.role}`, "success");
        loadJDs();
        loadDashboardStats();
    } catch (err) {
        hideLoading();
        showToast(`Error: ${err.message}`, "error");
    }
}

async function parseJDText() {
    const text = document.getElementById("jd-text-input").value.trim();
    const jobId = document.getElementById("jd-id-input").value.trim();

    if (!text || text.length < 10) {
        showToast("Please enter JD text (min 10 characters).", "error");
        return;
    }

    showLoading();
    try {
        const result = await apiPost("/jds/parse-text", { text, jobId: jobId || undefined });
        hideLoading();
        showToast(`JD parsed: ${result.data.role}`, "success");
        document.getElementById("jd-text-input").value = "";
        document.getElementById("jd-id-input").value = "";
        loadJDs();
        loadDashboardStats();
    } catch (err) {
        hideLoading();
        showToast(`Error: ${err.message}`, "error");
    }
}

async function loadJDs() {
    try {
        const result = await apiGet("/jds");
        jdsCache = result.data || [];
        renderJDs(jdsCache);
    } catch (err) {
        showToast(`Failed to load JDs: ${err.message}`, "error");
    }
}

function renderJDs(jds) {
    const container = document.getElementById("jds-list");
    if (!jds.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">💼</div><p>No job descriptions added yet.</p></div>`;
        return;
    }

    container.innerHTML = jds.map((jd) => `
    <div class="data-card">
      <div class="card-header">
        <div>
          <div class="card-title">${escHtml(jd.role || "Untitled")}</div>
          <div class="card-subtitle">ID: ${escHtml(jd.jobId)} • ${escHtml(jd.experience || "Exp N/A")}</div>
        </div>
      </div>
      <div class="card-body">
        <div class="card-row"><strong>Salary:</strong> ${escHtml(jd.salary || "Not specified")}</div>
        <div>
          <span style="font-size:0.8rem;color:var(--text-muted);">Required Skills:</span>
          <div class="skills-tags">
            ${(jd.requiredSkills || []).slice(0, 8).map((s) => `<span class="skill-tag">${escHtml(s)}</span>`).join("")}
            ${(jd.requiredSkills || []).length > 8 ? `<span class="skill-tag">+${jd.requiredSkills.length - 8} more</span>` : ""}
          </div>
        </div>
        ${(jd.optionalSkills || []).length > 0 ? `
        <div>
          <span style="font-size:0.8rem;color:var(--text-muted);">Optional:</span>
          <div class="skills-tags">
            ${jd.optionalSkills.map((s) => `<span class="skill-tag" style="opacity:0.6">${escHtml(s)}</span>`).join("")}
          </div>
        </div>` : ""}
      </div>
      <div class="card-actions">
        <button class="btn btn-ghost btn-sm" onclick="viewJDDetail('${jd.id}')">View Details</button>
        <button class="btn btn-danger btn-sm" onclick="deleteJD('${jd.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

async function viewJDDetail(id) {
    try {
        const result = await apiGet(`/jds/${id}`);
        const jd = result.data;
        openModal(`
      <h2>💼 ${escHtml(jd.role)}</h2>
      <div class="card-row"><strong>Job ID:</strong> ${escHtml(jd.jobId)}</div>
      <div class="card-row"><strong>Salary:</strong> ${escHtml(jd.salary || "Not specified")}</div>
      <div class="card-row"><strong>Experience:</strong> ${escHtml(jd.experience || "Not specified")}</div>
      <div class="card-row" style="align-items:flex-start;"><strong>About Role:</strong> <span style="line-height:1.5">${escHtml(jd.aboutRole || "N/A")}</span></div>
      <div style="margin-top: 1rem;">
        <strong style="color:var(--text-primary);">Required Skills (${(jd.requiredSkills || []).length}):</strong>
        <div class="skills-tags" style="margin-top: 0.5rem;">
          ${(jd.requiredSkills || []).map((s) => `<span class="skill-tag">${escHtml(s)}</span>`).join("")}
        </div>
      </div>
      ${(jd.optionalSkills || []).length > 0 ? `
      <div style="margin-top: 1rem;">
        <strong style="color:var(--text-primary);">Optional Skills (${jd.optionalSkills.length}):</strong>
        <div class="skills-tags" style="margin-top: 0.5rem;">
          ${jd.optionalSkills.map((s) => `<span class="skill-tag" style="opacity:0.6">${escHtml(s)}</span>`).join("")}
        </div>
      </div>` : ""}
    `);
    } catch (err) {
        showToast(`Error: ${err.message}`, "error");
    }
}

async function deleteJD(id) {
    if (!confirm("Delete this job description?")) return;
    try {
        await apiDelete(`/jds/${id}`);
        showToast("JD deleted", "success");
        loadJDs();
        loadDashboardStats();
    } catch (err) {
        showToast(`Error: ${err.message}`, "error");
    }
}

// ─── Match Operations ───────────────────────────────────────
async function loadMatchSelects() {
    try {
        if (!resumesCache.length) {
            const rResult = await apiGet("/resumes");
            resumesCache = rResult.data || [];
        }
        if (!jdsCache.length) {
            const jResult = await apiGet("/jds");
            jdsCache = jResult.data || [];
        }

        const resumeSelect = document.getElementById("match-resume-select");
        resumeSelect.innerHTML = `<option value="">— Choose a resume —</option>` +
            resumesCache.map((r) => `<option value="${r.id}">${escHtml(r.name)} (${escHtml(r.email || "no email")})</option>`).join("");

        const jdSelect = document.getElementById("match-jd-select");
        jdSelect.innerHTML = jdsCache.map((jd) => `<option value="${jd.id}">${escHtml(jd.jobId)} — ${escHtml(jd.role)}</option>`).join("");
    } catch (err) {
        showToast(`Error loading data: ${err.message}`, "error");
    }
}

async function runMatch() {
    const resumeId = document.getElementById("match-resume-select").value;
    if (!resumeId) {
        showToast("Please select a resume.", "error");
        return;
    }

    const jdSelect = document.getElementById("match-jd-select");
    const selectedJdIds = [...jdSelect.selectedOptions].map((o) => o.value);

    showLoading();
    try {
        const body = { resumeId };
        if (selectedJdIds.length > 0) body.jdIds = selectedJdIds;

        const result = await apiPost("/match", body);
        hideLoading();

        renderMatchResults(result.data);
        showToast(`Matched against ${result.data.matchingJobs.length} JD(s)`, "success");
    } catch (err) {
        hideLoading();
        showToast(`Error: ${err.message}`, "error");
    }
}

function renderMatchResults(data) {
    const container = document.getElementById("match-results");

    // Candidate Info
    let html = `
    <div class="candidate-info">
      <div class="info-item"><span class="info-label">Candidate</span><span class="info-value">${escHtml(data.name)}</span></div>
      <div class="info-item"><span class="info-label">Email</span><span class="info-value">${escHtml(data.email || "N/A")}</span></div>
      <div class="info-item"><span class="info-label">Experience</span><span class="info-value">${data.yearOfExperience != null ? data.yearOfExperience + " yrs" : "N/A"}</span></div>
      <div class="info-item"><span class="info-label">Skills Found</span><span class="info-value">${(data.resumeSkills || []).length}</span></div>
    </div>
  `;

    // Resume Skills
    html += `
    <div style="margin-bottom: 1.5rem;">
      <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">Resume Skills</h3>
      <div class="skills-tags">
        ${(data.resumeSkills || []).map((s) => `<span class="skill-tag">${escHtml(s)}</span>`).join("")}
      </div>
    </div>
  `;

    // Each match result
    if (data.matchingJobs && data.matchingJobs.length > 0) {
        data.matchingJobs.forEach((job) => {
            const scoreClass = job.matchingScore >= 70 ? "score-high" : job.matchingScore >= 40 ? "score-mid" : "score-low";
            const circumference = 2 * Math.PI * 34;
            const offset = circumference - (job.matchingScore / 100) * circumference;

            html += `
        <div class="match-result-card">
          <div class="match-result-header">
            <div>
              <h3>${escHtml(job.role)}</h3>
              <span style="font-size:0.8rem;color:var(--text-muted);">${escHtml(job.jobId)}</span>
            </div>
            <div class="score-circle ${scoreClass}">
              <svg viewBox="0 0 80 80">
                <circle class="bg-ring" cx="40" cy="40" r="34"/>
                <circle class="score-ring" cx="40" cy="40" r="34" 
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${offset}"/>
              </svg>
              <div class="score-text">${job.matchingScore}%</div>
            </div>
          </div>
          <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem; line-height:1.5;">${escHtml(job.aboutRole || "")}</p>
          <h4 style="font-size:0.85rem; font-weight:600; margin-bottom:0.5rem; color:var(--text-secondary);">Skills Analysis</h4>
          <div class="skills-analysis-grid">
            ${job.skillsAnalysis.map((sa) => `
              <div class="skill-analysis-item ${sa.presentInResume ? "skill-present" : "skill-missing"}">
                <span class="skill-icon">${sa.presentInResume ? "✓" : "✗"}</span>
                <span>${escHtml(sa.skill)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
        });
    } else {
        html += `<div class="empty-state"><p>No matching jobs found.</p></div>`;
    }

    container.innerHTML = html;

    // Show JSON output
    const jsonSection = document.getElementById("json-output-section");
    jsonSection.style.display = "block";
    document.getElementById("json-output").textContent = JSON.stringify(data, null, 2);
}

function copyJSON() {
    const json = document.getElementById("json-output").textContent;
    navigator.clipboard.writeText(json).then(() => {
        showToast("JSON copied to clipboard!", "success");
    });
}

// ─── Dashboard Stats ────────────────────────────────────────
async function loadDashboardStats() {
    try {
        const [rResult, jResult] = await Promise.all([
            apiGet("/resumes"),
            apiGet("/jds"),
        ]);

        document.getElementById("stat-resumes").textContent = rResult.count || 0;
        document.getElementById("stat-jds").textContent = jResult.count || 0;

        resumesCache = rResult.data || [];
        jdsCache = jResult.data || [];
    } catch (err) {
        // Silently fail on dashboard stats
    }
}

// ─── Utility ─────────────────────────────────────────────────
function escHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ─── Initialize ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    setupUploadArea("resume-upload-area", "resume-file-input", uploadResume);
    setupUploadArea("jd-upload-area", "jd-file-input", uploadJD);
    loadDashboardStats();
});
