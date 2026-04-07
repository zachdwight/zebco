/**
 * Healthcare ELT Web UI - Client-Side Logic
 */

let currentJobId = null;
let ws = null;

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  setupFileUpload();
  setupFormListeners();
  setupIterationSlider();
});

// ============================================================================
// File Upload
// ============================================================================

function setupFileUpload() {
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const fileName = document.getElementById("fileName");
  const transformBtn = document.getElementById("transformBtn");

  // Click to select
  uploadArea.addEventListener("click", () => fileInput.click());

  // Drag and drop
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  // File input change
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  function handleFileSelect(file) {
    fileInput.files = new DataTransfer().items.add(file);
    fileName.textContent = `✅ Selected: ${file.name}`;
    fileName.style.display = "block";
    transformBtn.disabled = false;
  }
}

function setupFormListeners() {
  document.getElementById("transformBtn").addEventListener("click", startTransformation);
  document.getElementById("clearBtn").addEventListener("click", clearAll);
  document.getElementById("provenanceBtn").addEventListener("click", generateProvenance);
}

function setupIterationSlider() {
  const slider = document.getElementById("maxIterations");
  const value = document.getElementById("iterationValue");

  slider.addEventListener("input", (e) => {
    value.textContent = e.target.value;
  });
}

// ============================================================================
// Transformation
// ============================================================================

async function startTransformation() {
  const fileInput = document.getElementById("fileInput");
  const entityType = document.getElementById("entityType").value;
  const model = document.getElementById("model").value;
  const maxIterations = document.getElementById("maxIterations").value;

  if (!fileInput.files.length) {
    alert("Please select a file");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("entityType", entityType === "auto" ? "all" : entityType);
  formData.append("model", model);
  formData.append("maxIterations", maxIterations);

  document.getElementById("transformBtn").disabled = true;

  try {
    // Start transformation
    const response = await fetch("/api/transform", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to start transformation");
    }

    currentJobId = data.jobId;

    // Show progress panel
    document.getElementById("progressPanel").style.display = "block";
    document.getElementById("logsContainer").innerHTML = "";

    // Connect WebSocket for logs
    connectWebSocket(currentJobId);

    // Poll status
    pollStatus(currentJobId);
  } catch (error) {
    alert(`Error: ${error.message}`);
    document.getElementById("transformBtn").disabled = false;
  }
}

function connectWebSocket(jobId) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ action: "subscribe", jobId }));
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === "log") {
      addLog(message.message, message.level);
    } else if (message.type === "status") {
      updateStatus(message);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    addLog("Connection error", "error");
  };
}

function addLog(message, level = "info") {
  const logsContainer = document.getElementById("logsContainer");

  // Clear placeholder if first log
  if (logsContainer.querySelector(".text-muted")) {
    logsContainer.innerHTML = "";
  }

  const logEntry = document.createElement("div");
  logEntry.className = `log-entry ${level}`;

  const timestamp = new Date().toLocaleTimeString();
  logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span>${escapeHtml(message)}`;

  logsContainer.appendChild(logEntry);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

function updateStatus(message) {
  const statusText = document.getElementById("statusText");
  const progressBar = document.getElementById("progressBar");

  progressBar.style.width = `${message.progress}%`;
  progressBar.textContent = `${message.progress}%`;
  progressBar.setAttribute("aria-valuenow", message.progress);

  if (message.status === "completed") {
    addLog("✅ Transformation completed!", "success");
    showResults();
  } else if (message.status === "failed") {
    addLog(`❌ Transformation failed: ${message.error}`, "error");
    document.getElementById("transformBtn").disabled = false;
  }
}

function pollStatus(jobId) {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`/api/status/${jobId}`);
      const data = await response.json();

      if (data.status === "completed" || data.status === "failed") {
        clearInterval(interval);
        if (data.status === "failed") {
          addLog(`Error: ${data.error}`, "error");
        }
      }
    } catch (error) {
      console.error("Error polling status:", error);
    }
  }, 1000);
}

// ============================================================================
// Results Display
// ============================================================================

async function showResults() {
  try {
    const response = await fetch(`/api/results/${currentJobId}`);
    if (!response.ok) throw new Error("Failed to fetch results");

    const results = await response.json();

    // Show results panel
    document.getElementById("resultsPanel").style.display = "block";

    // Show transformation results
    displayTransformationResults(results);

    // Show validation report
    displayValidationReport(results.validationResult);

    // Show output preview
    displayOutputPreview(results.outputData);

    document.getElementById("transformBtn").disabled = false;
    document.getElementById("clearBtn").style.display = "inline-block";
  } catch (error) {
    addLog(`Error fetching results: ${error.message}`, "error");
  }
}

function displayTransformationResults(results) {
  const content = document.getElementById("resultsContent");

  content.innerHTML = `
    <div class="result-item">
      <span class="result-label">Entity Type:</span>
      <span class="result-value">${results.entityType}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Records:</span>
      <span class="result-value">${results.recordsProcessed.toLocaleString()}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Status:</span>
      <span class="result-value">${
        results.validationPassed
          ? '<span style="color: #28a745;">✅ Passed</span>'
          : '<span style="color: #dc3545;">❌ Failed</span>'
      }</span>
    </div>
    <div class="result-item">
      <span class="result-label">Output Path:</span>
      <span class="result-value" style="font-size: 0.85rem; word-break: break-all;">${results.outputPath}</span>
    </div>
  `;
}

function displayValidationReport(validationResult) {
  const content = document.getElementById("validationContent");

  const badgeClass = validationResult.passed ? "passed" : "failed";
  const badgeText = validationResult.passed ? "✅ PASSED" : "❌ FAILED";

  let html = `
    <div class="validation-badge ${badgeClass}">${badgeText}</div>
    <div class="result-item">
      <span class="result-label">Valid Records:</span>
      <span class="result-value">${validationResult.recordsValid}/${validationResult.recordsValidated}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Pass Rate:</span>
      <span class="result-value">${(parseFloat(validationResult.validationRate) * 100).toFixed(2)}%</span>
    </div>
  `;

  if (validationResult.issues && validationResult.issues.length > 0) {
    html += `
      <div style="margin-top: 15px;">
        <strong style="color: #dc3545;">Issues Found:</strong>
        <ul style="margin-top: 8px; padding-left: 20px; font-size: 0.85rem;">
          ${validationResult.issues
            .slice(0, 5)
            .map((issue) => `<li>${issue}</li>`)
            .join("")}
          ${validationResult.issues.length > 5 ? `<li><em>+${validationResult.issues.length - 5} more...</em></li>` : ""}
        </ul>
      </div>
    `;
  }

  content.innerHTML = html;
}

function displayOutputPreview(data) {
  const preview = document.getElementById("outputPreview");
  const previewPanel = document.getElementById("previewPanel");

  const records = Array.isArray(data) ? data.slice(0, 5) : [data];
  preview.textContent = JSON.stringify(records, null, 2);
  previewPanel.style.display = "block";
}

// ============================================================================
// Provenance
// ============================================================================

async function generateProvenance() {
  if (!currentJobId) {
    alert("No active transformation");
    return;
  }

  const btn = document.getElementById("provenanceBtn");
  const content = document.getElementById("provenanceContent");

  btn.disabled = true;
  content.innerHTML = `
    <div style="text-align: center;">
      <div class="spinner"></div>
      Generating provenance analysis...
    </div>
  `;

  addLog("Generating AI provenance analysis...", "info");

  try {
    const response = await fetch(`/api/provenance/${currentJobId}`, {
      method: "POST",
    });

    if (!response.ok) throw new Error("Failed to generate provenance");

    const result = await response.json();

    displayProvenance(result.provenanceData, result.files);
    addLog("✅ Provenance report generated successfully", "success");
  } catch (error) {
    content.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    addLog(`Error generating provenance: ${error.message}`, "error");
  } finally {
    btn.disabled = false;
  }
}

function displayProvenance(provenance, files) {
  const content = document.getElementById("provenanceContent");

  const assessment = provenance.aiAssessment;

  let html = `
    <div style="margin-bottom: 15px;">
      <strong>📊 Data Quality Improvement:</strong>
      <p style="margin: 8px 0; font-size: 0.9rem;">${assessment.dataQualityImprovement}</p>
    </div>

    <div style="margin-bottom: 15px;">
      <strong>⚠️ Risks:</strong>
      <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.85rem;">
        ${
          assessment.riskFactors && assessment.riskFactors.length > 0
            ? assessment.riskFactors
                .slice(0, 3)
                .map((risk) => `<li>${risk}</li>`)
                .join("")
            : "<li>None identified</li>"
        }
      </ul>
    </div>

    <div style="margin-bottom: 15px;">
      <strong>✨ Recommendations:</strong>
      <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.85rem;">
        ${
          assessment.recommendations && assessment.recommendations.length > 0
            ? assessment.recommendations
                .slice(0, 3)
                .map((rec) => `<li>${rec}</li>`)
                .join("")
            : "<li>No recommendations</li>"
        }
      </ul>
    </div>

    <div style="padding: 10px; background-color: #f0f7ff; border-radius: 4px; margin-bottom: 10px;">
      <strong>🎯 Overall Confidence:</strong>
      <p style="margin: 5px 0; font-size: 0.9rem;">${assessment.overallConfidence}</p>
    </div>

    <small class="text-muted">
      📄 Full reports saved:<br>
      JSON: <code>${files.json}</code><br>
      Markdown: <code>${files.markdown}</code>
    </small>
  `;

  content.innerHTML = html;
}

// ============================================================================
// Utilities
// ============================================================================

function clearAll() {
  document.getElementById("fileInput").value = "";
  document.getElementById("fileName").style.display = "none";
  document.getElementById("entityType").value = "auto";
  document.getElementById("model").value = "claude";
  document.getElementById("maxIterations").value = "8";
  document.getElementById("iterationValue").textContent = "8";

  document.getElementById("progressPanel").style.display = "none";
  document.getElementById("resultsPanel").style.display = "none";
  document.getElementById("previewPanel").style.display = "none";
  document.getElementById("logsContainer").innerHTML =
    '<p class="text-muted">Logs will appear here during transformation...</p>';

  document.getElementById("transformBtn").disabled = false;
  document.getElementById("clearBtn").style.display = "none";

  currentJobId = null;

  if (ws) {
    ws.close();
    ws = null;
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
