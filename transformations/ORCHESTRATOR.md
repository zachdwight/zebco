# Healthcare ELT Orchestrator

AI-powered healthcare data transformation engine that reads raw files, generates transformation code, executes it, validates outputs, and iteratively improves until success.

## Overview

The orchestrator automates the entire transformation workflow:

```
Bronze File (CSV/Excel/XML/JSON)
    ↓
Convert to JSON
    ↓
Load Expectations & Context
    ↓
Call AI to Generate Transform Code
    ↓
Execute Generated Code
    ↓
Validate Output
    ↓
✅ Pass? → Write Output
❌ Fail? → Retry (up to 8 iterations)
```

## Quick Start

### 1. Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# ANTHROPIC_API_KEY=sk-...
# GOOGLE_API_KEY=...
```

### 2. Place Raw Files in Bronze Directory

```bash
# Create bronze directory if it doesn't exist
mkdir -p bronze

# Add your raw files
cp /path/to/patients.csv bronze/
cp /path/to/encounters.xlsx bronze/
```

Naming convention: Files should include entity type in name
- `patients.csv`, `patient_export.xlsx`
- `encounters.csv`, `visit_records.xlsx`
- `diagnoses.csv`, `diagnosis_data.xlsx`
- `billing.csv`, `charges.xlsx`
- `providers.csv`

### 3. Run Transformation

```bash
# Transform a single file
node transformations/orchestrator.js --bronze-file=bronze/patients.csv --entity=patient

# Transform all files in bronze directory (auto-detect entity type)
node transformations/orchestrator.js --bronze-dir=bronze

# Transform specific entity type only
node transformations/orchestrator.js --bronze-dir=bronze --entity=encounter

# Set max iterations (default: 8)
node transformations/orchestrator.js --bronze-file=bronze/patients.csv --entity=patient --max-iterations=5

# Use specific LLM
node transformations/orchestrator.js --bronze-file=bronze/patients.csv --entity=patient --model=gemini
```

### 4. Check Results

Outputs appear in `outputs/{entity_type}/converted_{date}/`:

```
outputs/patient/converted_2026-04-07/
├── output.json              # Transformed data
├── validation_report.json   # Validation results
└── notes.md                 # Human-readable summary
```

## Configuration

### Environment Variables (`.env`)

```bash
# Primary LLM to use
DEFAULT_LLM=claude              # claude, gemini, local

# API Keys
ANTHROPIC_API_KEY=sk-...
GOOGLE_API_KEY=...
LOCAL_LLM_URL=http://localhost:11434

# Orchestrator behavior
MAX_ITERATIONS=8                # Max transformation attempts
LOG_LEVEL=info                  # debug, info, warn, error

# Paths
BRONZE_DIR=./bronze             # Raw input files
OUTPUT_DIR=./outputs            # Transformed outputs
LOG_DIR=./transformations/logs  # Execution logs
```

### Programmatic Configuration (`config.js`)

```javascript
// Modify transformations/config.js for advanced settings
{
  orchestrator: {
    maxIterations: 8,
    validateAfterEachIteration: true,
    saveIntermediateResults: true,
  },
  validation: {
    validationPassThreshold: 0.995,  // 99.5% pass rate required
    requiredFieldThreshold: 1.0,     // 100% of required fields
  },
  entities: {
    patient: {
      batchSize: 100,
      requiredFields: ["first_name", "last_name", "dob"],
    },
    // ... more entity configs
  }
}
```

## How It Works

### Step 1: Discover & Convert

- Reads bronze file (CSV, Excel, XML, JSON)
- Auto-detects format and entity type
- Converts to standardized JSON
- Analyzes data quality

### Step 2: Load Context

- Reads `expectations.md` (transformation rules)
- Reads `field_mappings/*.md` (how fields map)
- Reads `data_schema.md` (expected output structure)
- Loads example outputs for reference

### Step 3: Generate Code

Calls LLM (Claude, Gemini, or local) with prompt containing:

```
ENTITY TYPE: patient

INPUT DATA SAMPLE:
{ "first_name": "JOHN", "last_name": "SMITH", "dob": "1965-03-22", ... }

EXPECTATIONS & RULES:
[Full expectations.md content]

FIELD MAPPINGS:
[Mapping documentation]

SCHEMA:
[Data schema definitions]

EXAMPLE OUTPUT:
[Example output for reference]

YOUR TASK:
Write a JavaScript function called transform(data) that...
```

LLM responds with executable JavaScript code.

### Step 4: Execute Code

```javascript
// Generated code looks like:
function transform(data) {
  if (!Array.isArray(data)) data = [data];

  return data.map(record => ({
    first_name: record.first_name
      ? record.first_name.charAt(0).toUpperCase() +
        record.first_name.slice(1).toLowerCase()
      : null,
    last_name: record.last_name
      ? record.last_name.charAt(0).toUpperCase() +
        record.last_name.slice(1).toLowerCase()
      : null,
    dob: record.dob,
    // ... more transformations
  }));
}
```

Code is executed safely with input data.

### Step 5: Validate

Checks output against validation rules:

```javascript
validatePatients(data)
  ✓ All required fields present
  ✓ Date formats valid (YYYY-MM-DD)
  ✓ 99.5%+ records pass validation
  ✓ Phone format is (XXX) XXX-XXXX
  ✓ Email format valid
```

### Step 6: Iterate or Succeed

- **If validation passes** → Write output to `outputs/`
- **If validation fails** → Report issues to AI, retry
  - AI sees: "Record 5: Invalid email format"
  - AI updates code to fix the issue
  - Re-runs validation
  - Continues for up to 8 iterations

## LLM Options

### Claude API (Recommended)

```bash
# Requires ANTHROPIC_API_KEY
node orchestrator.js --model=claude

# Uses: claude-opus-4-6 (latest, most capable)
# Cost: ~$0.003 per 1K input tokens
# Speed: ~5-10 seconds per transformation
```

**Best for**: Most reliable results, complex transformations, best understanding of healthcare context.

### Gemini

```bash
# Requires GOOGLE_API_KEY
node orchestrator.js --model=gemini

# Uses: gemini-pro
# Cost: Free tier available
# Speed: ~3-5 seconds per transformation
```

**Best for**: Cost-effective, good quality, free tier available.

### Local LLM (Ollama)

```bash
# Requires local LLM running: ollama serve mistral
node orchestrator.js --model=local

# Uses: mistral, llama2, etc. (configurable)
# Cost: Free (after download)
# Speed: Varies (5-30 seconds depending on hardware)
```

**Best for**: Privacy (no API calls), offline operation, no cost.

**Setup local LLM:**
```bash
# Install Ollama: https://ollama.ai
ollama pull mistral
ollama serve mistral  # Runs on localhost:11434
```

## Iteration & Self-Healing

The orchestrator can auto-fix failures:

```
Iteration 1:
  Generated code, validation failed
  Issues: "Record 5: Invalid email format"

Iteration 2:
  AI sees the error, updates code:
    - Adds email validation
    - Sanitizes invalid emails
  Re-runs validation: PASSED ✅

Iteration 3:
  Not needed (passed on iteration 2)
```

### Setting Iteration Limits

```bash
# Allow up to 8 iterations (default)
node orchestrator.js --bronze-file=bronze/patients.csv --max-iterations=8

# Faster feedback (fewer retries)
node orchestrator.js --bronze-file=bronze/patients.csv --max-iterations=3

# Give up faster on hard problems
node orchestrator.js --bronze-file=bronze/patients.csv --max-iterations=2
```

## Entity Type Auto-Detection

The orchestrator detects entity type from filename:

| Filename Contains | Detected Type |
|------------------|---------------|
| patient | patient |
| encounter, visit | encounter |
| diagnosis, diagnos | diagnosis |
| billing, charge | billing |
| provider, staff | provider |

Override detection:
```bash
node orchestrator.js --bronze-file=bronze/my_file.csv --entity=patient
```

## Output Structure

### Output JSON

```json
{
  "first_name": "John",
  "last_name": "Smith",
  "dob": "1965-03-22",
  "gender": "M",
  "phone": "(617) 555-4321",
  "email": "john.smith@email.com",
  "active": true
}
```

### Validation Report

```json
{
  "timestamp": "2026-04-07T10:15:24Z",
  "entityType": "patient",
  "sourceFile": "patients.csv",
  "recordsProcessed": 1200,
  "validationPassed": true,
  "issues": [],
  "recordsValid": 1200,
  "validationRate": "1.0000"
}
```

### Notes (Human-Readable)

```markdown
# Transformation Report

**Generated**: 2026-04-07T10:15:24Z
**Source File**: patients.csv
**Entity Type**: patient
**Records Processed**: 1,200

## Validation Status
✅ **PASSED**

## Output Files
- **JSON**: `output.json`
- **Validation Report**: `validation_report.json`

## Next Steps
Ready for import into target system.
```

## Troubleshooting

### API Key Issues

```
ERROR: ANTHROPIC_API_KEY environment variable not set

Solution:
  1. Create .env file from .env.example
  2. Add your API key: ANTHROPIC_API_KEY=sk-...
  3. Run: export $(cat .env | xargs)
  4. Try again
```

### File Format Issues

```
ERROR: Unsupported file format: .txt

Solution:
  Convert to supported format first:
  - CSV for text files
  - XLSX for Excel
  - JSON for structured data
  - XML for tagged data
```

### Validation Failures (After Max Iterations)

```
ERROR: Transformation did not converge after 8 iterations

Possible causes:
  1. Data is too messy/inconsistent
  2. Transformation rules are too strict
  3. LLM needs better context

Solutions:
  1. Clean source data first
  2. Relax validation rules in validators.js
  3. Provide better examples in outputs/
  4. Try different LLM (Claude → Gemini)
```

### Code Generation Failures

```
ERROR: Code execution failed: ...

Troubleshoot:
  1. Check transformations/logs/ for details
  2. Review generated code in logs
  3. Try with more detailed context
  4. Check field_mappings documentation
```

## Performance Tips

### For Large Files (>10,000 records)

```bash
# Lower max iterations to speed up (less retry)
node orchestrator.js --bronze-file=large_file.csv --max-iterations=3

# Or: Process in batches
# (Split large.csv into smaller chunks, process each separately)
```

### For Cost Optimization

```bash
# Use Gemini (cheaper than Claude)
node orchestrator.js --model=gemini --bronze-dir=bronze

# Or: Use local LLM (free)
node orchestrator.js --model=local --bronze-dir=bronze
```

### For Speed

```bash
# Local LLM is fastest (no API latency)
# But requires powerful hardware
ollama pull mistral
ollama serve mistral
node orchestrator.js --model=local
```

## Advanced Usage

### Batch Processing

```bash
# Process all files in bronze directory
node orchestrator.js --bronze-dir=bronze

# Process only patients
node orchestrator.js --bronze-dir=bronze --entity=patient

# Process multiple entity types (requires loop script)
for entity in patient encounter diagnosis billing; do
  node orchestrator.js --bronze-dir=bronze --entity=$entity
done
```

### Custom Validation

Edit `validators.js` to add entity-specific rules:

```javascript
function validateCustomEntity(data, context) {
  const issues = [];

  // Your custom validation logic
  for (const record of data) {
    if (someCustomRule(record)) {
      issues.push(`Record ${i}: Custom validation failed`);
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}
```

### Programmatic Usage

```javascript
const { Orchestrator } = require("./transformations/orchestrator");

const orchestrator = new Orchestrator({
  maxIterations: 8,
  model: "claude",
  bronzeDir: "./bronze",
  outputDir: "./outputs",
});

// Transform single file
const result = await orchestrator.transformFile(
  "./bronze/patients.csv",
  "patient"
);

console.log(result);
// {
//   success: true,
//   fileName: "patients.csv",
//   recordsProcessed: 1200,
//   validationPassed: true,
//   outputPath: "./outputs/patient/converted_2026-04-07/output.json"
// }
```

## Next Steps

1. **Set up API keys** in `.env`
2. **Place raw files** in `bronze/` directory
3. **Run orchestrator**: `node transformations/orchestrator.js --bronze-dir=bronze`
4. **Check outputs** in `outputs/` directory
5. **Validate results** against expectations
6. **Use transformed data** for import

---

**Documentation Last Updated**: 2026-04-07
