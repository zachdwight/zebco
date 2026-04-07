#!/usr/bin/env node

/**
 * Healthcare ELT Web Server
 *
 * Express.js server with web UI and WebSocket support for real-time transformation monitoring
 */

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const { Orchestrator } = require("./orchestrator");
const { ProvenanceGenerator } = require("./provenance-generator");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// File upload configuration
const uploadDir = path.join(__dirname, "..", "bronze");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// In-memory job tracking
const jobs = new Map();

// WebSocket setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ============================================================================
// API Routes
// ============================================================================

/**
 * POST /api/transform - Start a transformation
 */
app.post("/api/transform", upload.single("file"), async (req, res) => {
  try {
    const jobId = uuidv4();
    const { entityType, model, maxIterations } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const job = {
      id: jobId,
      status: "starting",
      file: req.file.filename,
      entityType: entityType || "auto-detect",
      model: model || "claude",
      maxIterations: parseInt(maxIterations) || 8,
      startTime: new Date(),
      logs: [],
      progress: 0,
      result: null,
      error: null,
    };

    jobs.set(jobId, job);

    // Run transformation in background
    runTransformation(jobId).catch((error) => {
      job.error = error.message;
      job.status = "failed";
      broadcastLog(jobId, `ERROR: ${error.message}`, "error");
    });

    res.json({ jobId, status: "queued" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/status/:jobId - Get job status
 */
app.get("/api/status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    file: job.file,
    entityType: job.entityType,
    model: job.model,
    startTime: job.startTime,
    duration: job.status === "completed" || job.status === "failed" ? new Date() - job.startTime : null,
    error: job.error,
  });
});

/**
 * GET /api/results/:jobId - Get transformation results
 */
app.get("/api/results/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  if (job.status !== "completed") {
    return res.status(400).json({ error: `Job is ${job.status}, not completed` });
  }

  res.json(job.result);
});

/**
 * POST /api/provenance/:jobId - Generate provenance report
 */
app.post("/api/provenance/:jobId", async (req, res) => {
  const job = jobs.get(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  if (!job.result) {
    return res.status(400).json({ error: "No transformation results available" });
  }

  try {
    broadcastLog(req.params.jobId, "Generating data provenance report...", "info");

    const provenanceGenerator = new ProvenanceGenerator({
      model: job.model,
    });

    const provenance = await provenanceGenerator.generateProvenance({
      inputData: job.result.inputData,
      outputData: job.result.outputData,
      sourceFile: job.file,
      entityType: job.result.entityType,
      validationResult: job.result.validationResult,
      model: job.model,
      iterationsUsed: job.result.iterationsUsed,
      timeMs: new Date() - job.startTime,
    });

    // Write provenance files
    const outputDir = job.result.outputPath;
    const { jsonPath, mdPath } = await provenanceGenerator.writeProvenanceFiles(
      provenance,
      outputDir
    );

    broadcastLog(req.params.jobId, "✅ Provenance report generated", "success");

    res.json({
      success: true,
      provenanceData: provenance,
      files: {
        json: path.relative(process.cwd(), jsonPath),
        markdown: path.relative(process.cwd(), mdPath),
      },
    });
  } catch (error) {
    broadcastLog(req.params.jobId, `ERROR generating provenance: ${error.message}`, "error");
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/logs/:jobId - Get job logs
 */
app.get("/api/logs/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json({ logs: job.logs });
});

/**
 * GET / - Serve the web UI
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================================================================
// WebSocket Handling
// ============================================================================

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    try {
      const { action, jobId } = JSON.parse(message);

      if (action === "subscribe") {
        ws.jobId = jobId;
        const job = jobs.get(jobId);

        if (job) {
          // Send existing logs
          job.logs.forEach((log) => {
            ws.send(
              JSON.stringify({
                type: "log",
                level: log.level,
                message: log.message,
              })
            );
          });

          // Send status
          ws.send(
            JSON.stringify({
              type: "status",
              status: job.status,
              progress: job.progress,
            })
          );
        }
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  });
});

/**
 * Broadcast log to all WebSocket clients watching this job
 */
function broadcastLog(jobId, message, level = "info") {
  const job = jobs.get(jobId);

  if (job) {
    job.logs.push({ timestamp: new Date(), message, level });

    // Cap logs at 1000 entries
    if (job.logs.length > 1000) {
      job.logs.shift();
    }
  }

  // Send to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.jobId === jobId) {
      client.send(
        JSON.stringify({
          type: "log",
          level,
          message,
          timestamp: new Date().toISOString(),
        })
      );
    }
  });
}

/**
 * Run transformation in background
 */
async function runTransformation(jobId) {
  const job = jobs.get(jobId);

  try {
    job.status = "running";
    job.progress = 10;

    broadcastLog(jobId, "Initializing orchestrator...", "info");

    const filePath = path.join(uploadDir, job.file);
    const outputDir = path.join(__dirname, "..", "outputs");

    const orchestrator = new Orchestrator({
      maxIterations: job.maxIterations,
      model: job.model,
      outputDir,
      verbose: false,
    });

    // Wrap logging
    const originalLog = orchestrator.log.bind(orchestrator);
    orchestrator.log = (message, data = null) => {
      broadcastLog(jobId, message, "info");
      originalLog(message, data);
    };

    broadcastLog(jobId, `Starting transformation: ${job.file}`, "info");
    job.progress = 20;

    // Run transformation
    const result = await orchestrator.transformFile(filePath, job.entityType);

    if (!result.success) {
      throw new Error(result.error || "Transformation failed");
    }

    job.progress = 90;

    // Read output files
    const outputPath = result.outputPath;
    const outputDir2 = path.dirname(outputPath);

    const outputJson = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    const validationReport = JSON.parse(
      fs.readFileSync(path.join(outputDir2, "validation_report.json"), "utf-8")
    );
    const inputData = require(filePath);

    job.result = {
      entityType: result.entityType,
      recordsProcessed: result.recordsProcessed,
      validationPassed: result.validationPassed,
      outputPath: outputDir2,
      inputData,
      outputData: outputJson,
      validationResult: validationReport,
      iterationsUsed: 1, // Would need to track in orchestrator
    };

    job.status = "completed";
    job.progress = 100;

    broadcastLog(jobId, "✅ Transformation completed successfully", "success");
    broadcastLog(jobId, `Records processed: ${result.recordsProcessed}`, "info");
    broadcastLog(jobId, `Validation: ${result.validationPassed ? "PASSED" : "FAILED"}`, result.validationPassed ? "success" : "warn");

    // Update status for WebSocket clients
    wss.clients.forEach((client) => {
      if (client.jobId === jobId) {
        client.send(
          JSON.stringify({
            type: "status",
            status: "completed",
            progress: 100,
          })
        );
      }
    });
  } catch (error) {
    job.status = "failed";
    job.error = error.message;
    broadcastLog(jobId, `❌ ERROR: ${error.message}`, "error");

    // Notify WebSocket clients
    wss.clients.forEach((client) => {
      if (client.jobId === jobId) {
        client.send(
          JSON.stringify({
            type: "status",
            status: "failed",
            error: error.message,
          })
        );
      }
    });
  }
}

// ============================================================================
// Start Server
// ============================================================================

server.listen(PORT, () => {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`Healthcare ELT Web UI`);
  console.log(`${"=".repeat(80)}`);
  console.log(`\n🌐 Server running at: http://localhost:${PORT}`);
  console.log(`\n📁 Upload files to: ${uploadDir}`);
  console.log(`\n✨ Open http://localhost:${PORT} in your browser to get started\n`);
});

module.exports = { server, jobs };
