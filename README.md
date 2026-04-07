# Healthcare ELT Conversion Framework

A structured approach to Extract-Load-Transform healthcare data between different EHR and accounting systems.

## Overview

This project manages healthcare data migrations from a source system (legacy EHR, practice management, accounting) to a target system. The framework uses documented inputs, explicit expectations, and validated outputs to ensure data integrity and HIPAA compliance.

## Directory Structure

- **expectations.md** — Transformation rules, success criteria, and constraints
- **compliance.md** — HIPAA and privacy guidelines for handling PHI
- **data_schema.md** — Input/output data structure definitions
- **field_mappings/** — System-specific field mapping documentation
  - `{source_system}_to_{target_system}.md` — Detailed mappings for each conversion
- **inputs/** — Example source data exports
  - `{entity_type}/example_{n}/` — Patient, encounter, diagnosis, billing records, etc.
- **outputs/** — Expected/validated target data
  - `{entity_type}/example_{n}/` — Results after transformation
- **transformations/** — Code and execution logs
  - `transform.js` — Main transformation logic
  - `validators.js` — Data validation rules
  - `logs/` — Execution logs and error reports
- **test_cases.md** — Validation checklist and test scenarios

## Usage

1. **Define Inputs**: Place source system exports in `inputs/`
2. **Document Expectations**: Update `expectations.md` with rules for this specific conversion
3. **Create Field Mappings**: Document how source fields map to target fields
4. **Run Transformations**: Execute code in `transformations/`
5. **Validate Outputs**: Check outputs against test_cases.md
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

- **Explicit over Implicit**: All transformations must be documented
- **Lossy Transformations Must Be Approved**: If data is dropped or modified, it must be intentional
- **Audit Trail**: Logs show every transformation decision
- **Compliance First**: HIPAA and data privacy constraints are non-negotiable
- **Validation**: Every output must be validated before use
