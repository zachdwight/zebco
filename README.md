# Healthcare ELT Conversion Framework

A structured, AI-powered approach to Extract-Load-Transform healthcare data between different EHR and accounting systems.

## Overview

This project automates healthcare data migrations using AI agents. It reads raw files from source systems, uses Claude/Gemini/local LLMs to generate transformation code, executes the code, validates outputs, and iteratively improves until transformation rules are satisfied.

The framework combines:
- **Documentation-Driven Design**: Clear expectations, field mappings, schemas
- **AI Code Generation**: LLMs generate transformation code based on specifications
- **Iterative Validation**: Runs up to 8 iterations, self-healing on failures
- **HIPAA Compliance**: Built-in privacy, encryption, and audit trail support
- **Data Integrity**: Comprehensive validation against healthcare standards

## Directory Structure

```
healthcare-elt/
├── bronze/                    # 🆕 Raw input files (CSV, Excel, XML)
│   └── patients.csv
│
├── transformations/           # 🆕 AI-powered transformation engine
│   ├── orchestrator.js        # Main orchestration (AI + iteration)
│   ├── llm-client.js          # Claude/Gemini/Local LLM interface
│   ├── converters.js          # CSV/Excel/XML → JSON conversion
│   ├── validators.js          # Healthcare data validation rules
│   ├── config.js              # Configuration & defaults
│   ├── ORCHESTRATOR.md        # How to use the AI orchestrator
│   ├── parsers/               # Format-specific parsers
│   │   ├── csv-parser.js
│   │   ├── excel-parser.js
│   │   └── xml-parser.js
│   └── logs/                  # Execution logs
│
├── inputs/                    # Example source data
│   ├── patients/example_1/
│   └── encounters/example_1/
│
├── outputs/                   # Transformed outputs
│   ├── patients/example_1/
│   └── encounters/example_1/
│
├── field_mappings/            # Field transformation documentation
│   ├── TEMPLATE_source_to_target.md
│   └── lookups/               # Code mapping tables
│
├── expectations.md            # Transformation rules & success criteria
├── compliance.md              # HIPAA & privacy guidelines
├── data_schema.md             # Input/output structure definitions
├── test_cases.md              # Validation checklist
├── GETTING_STARTED.md         # Quick start guide
├── .env.example               # Environment variables template
└── package.json               # Node.js dependencies
```

## Quick Start: Web UI (Recommended)

### 1. Setup
```bash
# Install dependencies
npm install

# Configure API keys
cp .env.example .env
# Edit .env: Add ANTHROPIC_API_KEY (or GOOGLE_API_KEY for Gemini)
```

### 2. Start Web Server
```bash
npm start
# Server runs on http://localhost:3000
```

### 3. Use the Web Dashboard
1. Open **http://localhost:3000** in your browser
2. **Upload** a file (CSV, Excel, XML, JSON)
3. **Select** entity type (Patient, Encounter, etc.) or auto-detect
4. **Choose** AI model (Claude recommended)
5. **Set** max iterations (1-10)
6. Click **Start Transformation**
7. **Watch** real-time logs and progress
8. **View** results (transformed data, validation report, output preview)
9. **Generate** provenance report (AI analysis of data quality & lineage)

**Features**:
- 📤 Drag-and-drop file upload
- 🔄 Real-time progress tracking
- 📋 Live transformation logs (color-coded)
- ✅ Validation results and metrics
- 📊 Data quality assessment
- 📜 AI-generated provenance report
- 👁️ Output data preview

### Alternative: Command Line

For batch processing or automation:

```bash
# Transform all files in bronze directory
npm run transform

# Transform specific entity type
npm run transform:patient

# CLI with options
node transformations/orchestrator.js --bronze-dir=bronze --model=claude --max-iterations=8
```

## The AI-Powered Orchestrator

The orchestrator automates the entire transformation pipeline:

```
Raw File (CSV/Excel/XML)
    ↓ [1] Convert to JSON
JSON Data + Expectations
    ↓ [2] Load Context (mappings, schema, examples)
    ↓ [3] Call AI (Claude/Gemini/Local LLM)
AI Generates Transform Code
    ↓ [4] Execute Generated Code
Transformed Data
    ↓ [5] Validate Output
    ├─ ✅ Pass? → Write to outputs/
    └─ ❌ Fail? → Show errors to AI → Iterate (up to 8x)
```

### AI-Driven Iteration
- **Iteration 1**: AI generates code based on expectations
- **Validation**: Check against healthcare standards
- **Iteration 2-8**: If failures detected, AI sees specific errors and fixes them
  - E.g., "Record 5: Invalid email format" → AI adds email validation
  - E.g., "ICD code not found in code set" → AI applies code mapping table
- **Success**: Once validation passes, output is written

### Supported AI Models

| Model | Setup | Cost | Speed | Best For |
|-------|-------|------|-------|----------|
| **Claude** (Recommended) | `ANTHROPIC_API_KEY` | ~$0.003/1K tokens | Fast | Most reliable, healthcare-aware |
| **Gemini** | `GOOGLE_API_KEY` | Free tier available | Fast | Cost-effective alternative |
| **Local LLM** | `ollama serve mistral` | Free | Variable | Privacy, offline, no API calls |

See `transformations/ORCHESTRATOR.md` for detailed usage.

## Traditional Workflow (Documentation-First)

If you prefer to define transformations without AI:

1. **Define Inputs**: Place source system exports in `inputs/`
2. **Document Expectations**: Update `expectations.md` with rules for this specific conversion
3. **Create Field Mappings**: Document how source fields map to target fields in `field_mappings/`
4. **Write Transformation Code**: Manual implementation in `transformations/transform.js`
5. **Validate Outputs**: Check outputs against `test_cases.md`
6. **Review Results**: Logs and errors guide refinement

## Healthcare Entities Covered

- Patients (demographics, identifiers)
- Encounters (visits, appointments)
- Diagnoses (ICD codes, problem list)
- Procedures (CPT codes, treatments)
- Medications
- Lab Results
- Billing/Claims (CPT, ICD mapping, charges)
- Providers (staff, credentials)

## Key Principles

- **AI + Documentation**: AI generates code from documented expectations, not blind algorithms
- **Self-Healing**: Orchestrator iterates when validation fails, fixing issues automatically
- **Explicit over Implicit**: All transformations are documented and traceable
- **Lossy Transformations Must Be Approved**: If data is dropped, it's intentional and logged
- **Audit Trail**: Complete logs show every transformation decision and iteration
- **Compliance First**: HIPAA and data privacy constraints are non-negotiable
- **Validation First**: Comprehensive validation at each step, healthcare-specific rules
- **Flexibility**: Supports multiple input formats, LLM providers, and entity types

## Features

✅ **AI Code Generation** — Claude/Gemini/Local LLMs generate transformation code
✅ **Auto-Format Detection** — Handles CSV, Excel, XML, JSON automatically
✅ **Iterative Refinement** — Up to 8 self-healing iterations on validation failures
✅ **Healthcare-Specific** — ICD/CPT validation, date format handling, provider matching
✅ **HIPAA Compliant** — Built-in encryption, audit logs, privacy controls
✅ **Flexible I/O** — Bronze directory for raw files, standardized JSON outputs
✅ **Entity Types** — Patients, encounters, diagnoses, billing, providers, medications
✅ **Multi-Model Support** — Claude, Gemini, local LLMs (Ollama, etc.)
✅ **Comprehensive Validation** — Pre/post transformation checks, entity-specific rules
✅ **Detailed Logging** — Full audit trail of transformations and decisions
✅ **Web UI Dashboard** — Real-time progress, live logs, results visualization
✅ **Data Provenance** — AI-driven analysis of data quality, lineage, and recommendations

## Data Provenance

After transformation, the system generates a comprehensive **data provenance report** that includes:

- **Data Quality Metrics**: Before/after analysis (null rates, field types, completeness)
- **Transformation Lineage**: Which source fields became which target fields
- **Quality Assessment**: What improved, what risks were introduced, confidence level
- **AI Recommendations**: Suggested improvements based on data quality analysis
- **Full Audit Trail**: Every transformation decision documented

The provenance report is generated by Claude/Gemini/Local LLM analyzing the actual transformation and data to provide insights into:
- How well data quality improved
- Any data loss or field modifications
- Risk factors and recommendations
- Overall confidence in the transformation

Reports are saved as both JSON (machine-readable) and Markdown (human-readable).
