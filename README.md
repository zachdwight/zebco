# Healthcare ELT Conversion Framework

**Transform healthcare data between EHR systems intelligently.** Uses AI to generate transformation code from documentation, validates against healthcare standards, and generates data lineage reports.

---

## ⚠️ Legal Disclaimer

**HIPAA AWARE ≠ HIPAA COMPLIANT**

This framework is **HIPAA-aware** (provides guidance and tools to support compliance), but **using it does NOT automatically make your organization HIPAA compliant**. Your organization is fully responsible for:

- Obtaining Business Associate Agreements (BAAs) with all vendors
- Implementing and maintaining all security/encryption controls
- Training staff on HIPAA and proper PHI handling
- Conducting regular compliance audits
- Managing and retaining audit logs
- Following data retention/deletion policies
- **Having HIPAA legal counsel review your implementation**

**Consult with legal counsel before handling any Protected Health Information (PHI).**

See [compliance.md](compliance.md) for detailed requirements and responsibilities.

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

⚠️ **IMPORTANT: HIPAA AWARE ≠ HIPAA COMPLIANT**

This framework is **HIPAA-aware** (provides guidance and tools) but **NOT automatically compliant**. Your organization is responsible for:
- Obtaining Business Associate Agreements (BAAs)
- Implementing and managing encryption
- Configuring access controls and authentication
- Training staff on HIPAA requirements
- Conducting regular compliance audits
- Following data retention/deletion policies
- Having HIPAA legal counsel review your implementation

See [compliance.md](compliance.md) for detailed requirements and responsibilities.

---

✅ **HIPAA Awareness Features** — Built-in guidance for PHI handling
✅ **Audit Trail** — Complete logs of all transformations
✅ **Data Validation** — Ensures data integrity throughout
✅ **Privacy Controls** — De-identification guidelines included
✅ **Encryption Ready** — Supports encryption in transit/at rest
✅ **Compliance Guidance** — See [compliance.md](compliance.md) for detailed requirements

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

### Option 2: Command Line (for Automation/Batch/Scripts)

The CLI is perfect for automation, scheduled jobs, and batch processing. Full documentation in [transformations/ORCHESTRATOR.md](transformations/ORCHESTRATOR.md).

#### Quick Commands

```bash
# Transform all files in bronze directory
npm run transform

# Transform specific entity type
npm run transform:patient
npm run transform:encounter
npm run transform:diagnosis
npm run transform:billing

# See all available commands
npm run
```

#### Full CLI Options

```bash
node transformations/orchestrator.js [OPTIONS]
```

**Options:**

| Option | Values | Description | Default |
|--------|--------|-------------|---------|
| `--bronze-file` | path | Transform single file | — |
| `--bronze-dir` | path | Transform all files in directory | `./bronze` |
| `--entity` | type or `all` | Entity type (patient, encounter, etc.) or auto-detect all | `all` |
| `--model` | claude, gemini, local | Which LLM to use | `claude` |
| `--max-iterations` | 1-10 | Max retry attempts on validation failure | `8` |
| `--output-dir` | path | Where to write results | `./outputs` |
| `--log-dir` | path | Where to write logs | `./transformations/logs` |

#### Examples

**Transform single file with Claude:**
```bash
node transformations/orchestrator.js --bronze-file=bronze/patients.csv --entity=patient --model=claude
```

**Transform all files with Gemini (cheaper):**
```bash
node transformations/orchestrator.js --bronze-dir=bronze --model=gemini
```

**Transform with local LLM (offline, free):**
```bash
# First: Start local LLM
ollama serve mistral

# In another terminal:
node transformations/orchestrator.js --bronze-dir=bronze --model=local
```

**Batch transform specific entity type only:**
```bash
node transformations/orchestrator.js --bronze-dir=bronze --entity=patient --max-iterations=5
```

**Custom output directory:**
```bash
node transformations/orchestrator.js --bronze-dir=bronze --output-dir=/path/to/results
```

**Aggressive mode (fewer retries, faster):**
```bash
node transformations/orchestrator.js --bronze-dir=bronze --max-iterations=2
```

#### Batch Processing Scripts

**Transform all entity types sequentially:**
```bash
#!/bin/bash
for entity in patient encounter diagnosis billing provider; do
  echo "Transforming $entity..."
  node transformations/orchestrator.js --bronze-dir=bronze --entity=$entity
  if [ $? -ne 0 ]; then
    echo "Failed to transform $entity"
    exit 1
  fi
done
echo "All transformations complete!"
```

**Parallel processing (faster for large datasets):**
```bash
#!/bin/bash
# Transform multiple entity types in parallel
node transformations/orchestrator.js --bronze-dir=bronze --entity=patient &
node transformations/orchestrator.js --bronze-dir=bronze --entity=encounter &
node transformations/orchestrator.js --bronze-dir=bronze --entity=diagnosis &
node transformations/orchestrator.js --bronze-dir=bronze --entity=billing &

wait
echo "All transformations complete!"
```

**Scheduled daily transformation (cron):**
```bash
# Add to crontab (crontab -e)
0 2 * * * cd /path/to/healthcare-elt && node transformations/orchestrator.js --bronze-dir=bronze --model=gemini >> logs/daily.log 2>&1
```

#### Programmatic Usage (Node.js)

Use the CLI-free, directly in your code:

```javascript
const { Orchestrator } = require('./transformations/orchestrator');

async function transformData() {
  const orchestrator = new Orchestrator({
    maxIterations: 8,
    model: 'claude',
    bronzeDir: './bronze',
    outputDir: './outputs',
    verbose: true
  });

  try {
    const result = await orchestrator.transformFile(
      './bronze/patients.csv',
      'patient'
    );

    if (result.success) {
      console.log(`✅ Transformed ${result.recordsProcessed} records`);
      console.log(`Validation: ${result.validationPassed ? 'PASSED' : 'FAILED'}`);
      console.log(`Output: ${result.outputPath}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

transformData();
```

#### Output Files

Each transformation creates:

```
outputs/
└── {entity_type}/
    └── converted_{date}/
        ├── output.json              # Transformed data
        ├── validation_report.json   # Validation results
        ├── notes.md                 # Human-readable summary
        ├── provenance.json          # Data quality analysis
        └── provenance.md            # Provenance report
```

#### Exit Codes

CLI returns meaningful exit codes for scripting:

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Transformation failed |
| `2` | Invalid arguments |
| `3` | File not found |
| `4` | API error |

Use in scripts:
```bash
node transformations/orchestrator.js --bronze-file=patients.csv
if [ $? -eq 0 ]; then
  echo "Success!"
else
  echo "Transformation failed with code $?"
fi
```

#### Real-World Scenarios

**Scenario 1: Daily EHR Export Processing**
```bash
#!/bin/bash
# Run nightly at 2 AM via cron
DATE=$(date +%Y%m%d)
SOURCE_DIR="/mnt/ehr-export/$DATE"
OUTPUT_DIR="/mnt/ehr-transformed/$DATE"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Source directory not found: $SOURCE_DIR"
  exit 1
fi

node /opt/healthcare-elt/transformations/orchestrator.js \
  --bronze-dir="$SOURCE_DIR" \
  --output-dir="$OUTPUT_DIR" \
  --model=claude \
  --max-iterations=8

if [ $? -eq 0 ]; then
  # Archive results
  tar -czf "$OUTPUT_DIR/archive.tar.gz" "$OUTPUT_DIR/*.json"
  # Notify on success
  mail -s "EHR Transform Success: $DATE" admin@hospital.org < /dev/null
else
  # Alert on failure
  mail -s "EHR Transform FAILED: $DATE" admin@hospital.org < /dev/null
  exit 1
fi
```

**Scenario 2: CI/CD Integration (GitHub Actions)**
```yaml
name: Healthcare Data Transform
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  transform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm install

      - name: Download source data
        run: aws s3 sync s3://ehr-exports/latest ./bronze/

      - name: Transform data
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npm run transform

      - name: Upload results
        run: aws s3 sync ./outputs s3://ehr-transformed/

      - name: Notify Slack
        run: curl -X POST ${{ secrets.SLACK_WEBHOOK }} -d '{"text":"EHR transformation complete"}'
```

**Scenario 3: Monitor Multiple Transformations**
```bash
#!/bin/bash
# Process multiple file types with progress monitoring
TYPES=("patient" "encounter" "diagnosis" "billing")
FAILED=0

for type in "${TYPES[@]}"; do
  echo "Processing $type..."
  node transformations/orchestrator.js --bronze-dir=bronze --entity=$type

  if [ $? -ne 0 ]; then
    echo "❌ FAILED: $type"
    ((FAILED++))
  else
    echo "✅ SUCCESS: $type"
  fi
done

echo ""
echo "========== SUMMARY =========="
echo "Total types: ${#TYPES[@]}"
echo "Failed: $FAILED"
echo "Success: $((${#TYPES[@]} - FAILED))"

exit $FAILED
```

#### Troubleshooting CLI

**Issue: "Command not found: node"**
```bash
# Make sure Node.js is installed
node --version

# If not installed, install from nodejs.org or:
brew install node  # macOS
apt-get install nodejs  # Ubuntu/Debian
```

**Issue: "ANTHROPIC_API_KEY not set"**
```bash
# Set environment variable
export ANTHROPIC_API_KEY=sk-...

# Or create .env file
echo "ANTHROPIC_API_KEY=sk-..." > .env

# Verify
echo $ANTHROPIC_API_KEY
```

**Issue: "Bronze directory not found"**
```bash
# Create bronze directory
mkdir -p bronze

# Add files
cp /path/to/data.csv bronze/

# Verify
ls -la bronze/
```

**Issue: "Transformation failed after 8 iterations"**
```bash
# Check logs for details
cat transformations/logs/transform_*.log

# Try with more iterations
node transformations/orchestrator.js --bronze-file=data.csv --max-iterations=10

# Or try different model
node transformations/orchestrator.js --bronze-file=data.csv --model=gemini
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
