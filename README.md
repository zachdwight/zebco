# Healthcare ELT Conversion Framework

**Transform healthcare data between EHR systems intelligently.** Uses AI to generate transformation code from documentation, validates against healthcare standards, and generates data lineage reports.

---

## 🎯 What It Does

Healthcare ELT is an **AI-powered data transformation platform** that automates the complex process of migrating healthcare data between different Electronic Health Record (EHR) systems, practice management systems, and accounting platforms.

Instead of manually writing transformation code, you:
1. **Document** your expectations (field mappings, rules, constraints)
2. **Upload** raw data files (CSV, Excel, XML, JSON)
3. **AI generates** transformation code automatically
4. **System validates** against healthcare standards (ICD, CPT, HIPAA)
5. **Auto-iterates** on failures, fixing issues intelligently
6. **Reports** data quality improvements with AI-driven provenance analysis

---

## ⚡ Quick Start (5 Minutes)

### 1. Setup
```bash
git clone https://github.com/zachdwight/zebco.git
cd zebco
npm install

# Configure AI
cp .env.example .env
# Edit .env: Add ANTHROPIC_API_KEY (or GOOGLE_API_KEY for Gemini)
```

### 2. Start Web Dashboard
```bash
npm start
# Open http://localhost:3000 in your browser
```

### 3. Transform Data
1. **Upload** a file (CSV, Excel, XML, JSON)
2. **Select** entity type or auto-detect
3. **Choose** AI model (Claude recommended)
4. **Start** transformation
5. **View** results & provenance report

---

## ✨ Key Features & Capabilities

### 🤖 AI-Powered Code Generation
- **Claude/Gemini/Local LLMs** generate transformation code automatically
- **Documentation-driven**: AI reads your expectations, field mappings, and schemas
- **Context-aware**: Provides examples and validates against healthcare standards
- **Self-correcting**: Iterates up to 8 times, fixing issues based on validation feedback

### 🏥 Healthcare-Specific
- **ICD Code Validation** — Validates ICD-9/ICD-10 codes against current code sets
- **CPT Code Handling** — Validates procedure codes and mappings
- **Healthcare Data Types** — Specialized handling for dates, phone numbers, provider IDs
- **HIPAA Compliance** — Built-in privacy controls, audit trails, encryption support
- **Provider Matching** — Validates provider credentials and NPI numbers

### 🔄 Intelligent Iteration & Self-Healing
- **Real-time Validation** — Checks output after each transformation attempt
- **Smart Retries** — AI sees validation errors and automatically fixes them
  - Example: "Email format invalid" → AI adds email validation to code
  - Example: "ICD code not found" → AI applies code mapping table
  - Example: "Phone format wrong" → AI reformats phone numbers
- **Configurable Attempts** — 1-10 iterations (default: 8)
- **Audit Trail** — Complete logs of each iteration and fix

### 📊 Data Quality & Provenance
- **Before/After Metrics** — Analyzes null rates, field types, completeness
- **Data Lineage** — Shows which source fields → target fields
- **AI Assessment** — Claude/Gemini analyzes quality improvements and risks
- **Quality Reports** — Both JSON (machine) and Markdown (human-readable)
- **Recommendations** — Suggests improvements based on actual data analysis

### 🌐 Web UI Dashboard
- **Drag-and-drop Upload** — Upload files with ease
- **Real-time Progress** — Watch transformation steps live
- **Live Logs** — Color-coded log output (info, success, error, warning)
- **Results Preview** — See transformed data immediately
- **One-Click Provenance** — Generate AI analysis with one button
- **Responsive Design** — Works on desktop, tablet, mobile

### 🛠️ Multiple Input/Output Formats
- **Input**: CSV, TSV, Excel (.xlsx, .xls), XML, JSON
- **Auto-Detection**: Detects format and entity type automatically
- **Standardized Output**: All transforms to clean JSON + validation reports
- **Metadata**: Includes transformation metadata and audit trails

### 🔧 Flexible & Extensible
- **Multiple LLM Models** — Claude, Gemini, local LLMs (Ollama)
- **CLI or Web UI** — Choose what fits your workflow
- **Batch Processing** — Transform multiple files programmatically
- **Custom Entity Types** — Add support for any healthcare entity
- **Pluggable Validators** — Extend validation rules as needed

---

## 💡 Use Cases

### 1. **EHR System Migration**
Migrate patient records, encounters, diagnoses from one EHR to another (e.g., Epic → Cerner, NextGen → Medidata)

### 2. **Practice Management Integration**
Transform billing and patient data to integrate PM systems with accounting software

### 3. **Data Integration Projects**
Combine data from multiple healthcare systems into a data warehouse

### 4. **Compliance & Audit**
Generate complete provenance reports showing data transformations for compliance reviews

### 5. **Data Quality Improvement**
Identify and fix data quality issues during migration with AI-driven analysis

### 6. **Pilot Programs**
Quickly test transformation rules before full-scale migration

---

## 🏗️ Architecture

### Transformation Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ Raw File (CSV/Excel/XML/JSON)                              │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
        ┌──────────────────────────────┐
        │ 1. Auto-Detect Format & Type │
        │    Convert to Normalized JSON│
        └──────────────┬───────────────┘
                       ↓
        ┌──────────────────────────────────────┐
        │ 2. Load Context                      │
        │    - Expectations document           │
        │    - Field mappings                  │
        │    - Data schemas                    │
        │    - Example transformations         │
        └──────────────┬───────────────────────┘
                       ↓
        ┌──────────────────────────────────────┐
        │ 3. AI Code Generation                │
        │    Claude/Gemini/Local LLM           │
        │    Generates transform(data) code    │
        └──────────────┬───────────────────────┘
                       ↓
        ┌──────────────────────────────────────┐
        │ 4. Execute Transformation            │
        │    Run generated code on all records │
        └──────────────┬───────────────────────┘
                       ↓
        ┌──────────────────────────────────────┐
        │ 5. Validate Output                   │
        │    Healthcare-specific rules         │
        │    (ICD, CPT, dates, emails, etc.)   │
        └──────────────┬───────────────────────┘
                       ↓
           ┌───────────────────────┐
           │                       │
        ✅ PASS?              ❌ FAIL?
        │                       │
        ↓                       ↓
    ┌────────────┐      ┌──────────────┐
    │ Write      │      │ Show AI      │
    │ Results    │      │ error details│
    │ + Reports  │      │ Iterate (8x) │
    └────────────┘      └──────────────┘
```

### Key Components

| Component | Purpose |
|-----------|---------|
| **orchestrator.js** | Main engine coordinating the pipeline |
| **llm-client.js** | Unified interface to Claude, Gemini, local LLMs |
| **converters.js** | Auto-detects and converts formats to JSON |
| **validators.js** | Healthcare-specific validation rules |
| **provenance-generator.js** | AI-driven data quality analysis |
| **server.js** | Express.js web server with WebSocket support |

---

## 🤖 Supported AI Models

| Model | Setup | Cost | Speed | Best For |
|-------|-------|------|-------|----------|
| **Claude** 👑 | `ANTHROPIC_API_KEY` | ~$0.003/1K tokens | ⚡⚡ Fast | **Recommended:** Most reliable, healthcare-aware, best quality |
| **Gemini** | `GOOGLE_API_KEY` | Free tier available | ⚡⚡ Fast | Cost-conscious, good alternative |
| **Local LLM** | `ollama serve mistral` | Free | ⚡ Variable | Privacy-critical, offline operation, no API costs |

See [transformations/ORCHESTRATOR.md](transformations/ORCHESTRATOR.md) for detailed setup.

---

## 🏥 Healthcare Entities Supported

✅ **Patients** — Demographics, identifiers, contacts
✅ **Encounters** — Visits, appointments, admissions
✅ **Diagnoses** — ICD codes, problem lists, status
✅ **Procedures** — CPT codes, treatments
✅ **Billing** — Charges, line items, adjustments
✅ **Providers** — Staff, credentials, NPI numbers
✅ **Medications** — Drug information, dispensing
✅ **Lab Results** — Tests, values, reference ranges

Add more entity types by extending `validators.js` and updating field mappings.

---

## 📋 Output & Provenance

### Transformation Outputs

For each transformation, generates:

1. **output.json** — Transformed data in target format
2. **validation_report.json** — Structured validation results
3. **notes.md** — Human-readable transformation summary
4. **provenance.json** — Data quality analysis (AI-generated)
5. **provenance.md** — Provenance report (human-readable)

### Provenance Report Includes

✓ **Data Quality Metrics** (before/after analysis)
✓ **Transformation Lineage** (field mappings applied)
✓ **Risk Assessment** (data loss, validation issues)
✓ **AI Recommendations** (improvement suggestions)
✓ **Confidence Rating** (overall transformation quality)

Example metrics:
```json
{
  "dataQuality": {
    "before": { "nullRates": { "phone": 0.05, "email": 0.15 } },
    "after": { "nullRates": { "phone": 0.02, "email": 0.08 } },
    "improvement": "High - 60% reduction in null values"
  },
  "aiAssessment": {
    "dataQualityImprovement": "Standardized names, formatted phones, validated emails",
    "riskFactors": ["Email validation may be strict"],
    "recommendations": ["Consider relaxing email regex"],
    "overallConfidence": "High - 99.5% pass rate"
  }
}
```

---

## 📁 Project Structure

```
healthcare-elt/
├── transformations/              # AI transformation engine
│   ├── server.js                # Web server (Express)
│   ├── orchestrator.js           # Main orchestrator
│   ├── llm-client.js             # LLM interface
│   ├── converters.js             # Format conversion
│   ├── validators.js             # Healthcare validation
│   ├── provenance-generator.js   # Data quality analysis
│   ├── config.js                 # Configuration
│   ├── ORCHESTRATOR.md           # Detailed docs
│   └── public/                   # Web UI
│       ├── index.html
│       ├── css/style.css
│       └── js/app.js
│
├── bronze/                       # Raw input files
│   └── *.csv, *.xlsx, *.xml
│
├── outputs/                      # Transformed outputs
│   └── {entity_type}/converted_{date}/
│       ├── output.json
│       ├── validation_report.json
│       ├── notes.md
│       ├── provenance.json
│       └── provenance.md
│
├── expectations.md               # Transformation rules
├── data_schema.md                # Data structure definitions
├── compliance.md                 # HIPAA guidelines
├── field_mappings/               # Field mapping docs
├── test_cases.md                 # Validation rules
├── GETTING_STARTED.md            # Quick start guide
├── .env.example                  # Environment template
└── package.json                  # Dependencies
```

---

## 🔐 Security & Compliance

✅ **HIPAA Awareness** — Built-in guidance for PHI handling
✅ **Audit Trail** — Complete logs of all transformations
✅ **Data Validation** — Ensures data integrity throughout
✅ **Privacy Controls** — De-identification guidelines included
✅ **Encryption Ready** — Supports encryption in transit/at rest
✅ **Compliance Docs** — See [compliance.md](compliance.md) for details

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | This file — overview and quick start |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Detailed setup and workflow guide |
| [transformations/ORCHESTRATOR.md](transformations/ORCHESTRATOR.md) | AI orchestrator detailed docs |
| [expectations.md](expectations.md) | How to define transformation rules |
| [data_schema.md](data_schema.md) | Input/output structure definitions |
| [compliance.md](compliance.md) | HIPAA and privacy guidelines |
| [test_cases.md](test_cases.md) | Validation rules and test scenarios |
| [field_mappings/](field_mappings/) | System-specific mapping examples |

---

## 🎯 Key Principles

- **🤖 AI + Documentation**: AI generates code from documented expectations, not guesses
- **🔄 Self-Healing**: Auto-iterates on failures, fixing issues intelligently
- **📝 Explicit over Implicit**: All transformations documented and traceable
- **🚫 Lossy is Approved**: Data loss is intentional and documented
- **🔍 Audit Trail**: Complete logs of every transformation decision
- **🔐 Compliance First**: HIPAA and privacy non-negotiable
- **✅ Validation First**: Healthcare-specific validation at every step
- **🔧 Flexible**: Multiple formats, LLMs, entity types, deployment options

---

## 🚀 Workflows

### Option 1: Web UI (Recommended for Most Users)
```bash
npm start
# → Open http://localhost:3000
# → Upload file, select options, click "Start"
# → View results and generate provenance
```

### Option 2: Command Line (for Automation/Batch)
```bash
# Transform all files
npm run transform

# Transform specific entity type
npm run transform:patient

# CLI with custom options
node transformations/orchestrator.js --bronze-dir=bronze --model=claude --max-iterations=8
```

### Option 3: Documentation-First (Advanced)
For complete control, manually define transformations:
1. Document in `expectations.md`
2. Map fields in `field_mappings/`
3. Write code in `transformations/`
4. Validate with `test_cases.md`

---

## 📊 Sample Transformation

**Input** (patients.csv):
```csv
PATIENT_NAME_FIRST,PATIENT_NAME_LAST,DOB,PHONE_NUM
JOHN,SMITH,19650322,6175554321
MARY,JOHNSON,19720815,
```

**AI-Generated Code** (transform function):
```javascript
function transform(data) {
  return data.map(r => ({
    first_name: r.PATIENT_NAME_FIRST?.toLowerCase().replace(/^\w/, c => c.toUpperCase()) || null,
    last_name: r.PATIENT_NAME_LAST?.toLowerCase().replace(/^\w/, c => c.toUpperCase()) || null,
    dob: r.DOB ? `${r.DOB.slice(0,4)}-${r.DOB.slice(4,6)}-${r.DOB.slice(6)}` : null,
    phone: r.PHONE_NUM ? `(${r.PHONE_NUM.slice(0,3)}) ${r.PHONE_NUM.slice(3,6)}-${r.PHONE_NUM.slice(6)}` : null
  }));
}
```

**Output** (output.json):
```json
[
  {
    "first_name": "John",
    "last_name": "Smith",
    "dob": "1965-03-22",
    "phone": "(617) 555-4321"
  },
  {
    "first_name": "Mary",
    "last_name": "Johnson",
    "dob": "1972-08-15",
    "phone": null
  }
]
```

**Validation Report**:
```json
{
  "recordsProcessed": 2,
  "validationPassed": true,
  "issues": [],
  "recordsValid": 2
}
```

**Provenance Report** (AI-generated):
```
✅ Data Quality Improvement: Standardized name case, formatted phones, validated dates
⚠️ Risk Areas: 1 record missing phone number (acceptable)
✨ Recommendations: Consider phone validation rules for missing values
🎯 Overall Confidence: High - 100% pass rate
```

---

## 🛠️ Development

### Requirements
- Node.js 14+
- npm 6+

### Install Dependencies
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Configure: ANTHROPIC_API_KEY, GOOGLE_API_KEY, LOCAL_LLM_URL
```

### Running Tests
```bash
npm test
```

### Contributing
Contributions welcome! Submit issues and pull requests on GitHub.

---

## 📄 License

MIT License — See LICENSE file for details

---

## 🤝 Support & Resources

- **Documentation**: See [GETTING_STARTED.md](GETTING_STARTED.md)
- **Detailed Orchestrator Docs**: See [transformations/ORCHESTRATOR.md](transformations/ORCHESTRATOR.md)
- **Healthcare Guidelines**: See [compliance.md](compliance.md)
- **Issues & Discussions**: GitHub issues and discussions
- **Examples**: See `inputs/` and `outputs/` directories for sample transformations

---

**Transform healthcare data intelligently. Document expectations. Let AI handle the rest.** 🚀
