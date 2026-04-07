# Transformation Code & Execution

This directory contains the code and logs for executing healthcare data transformations.

## Files

- **transform.js** — Main transformation orchestrator
  - Loads source data from `../inputs/`
  - Applies field mappings and transformations
  - Outputs results to `../outputs/`
  - Generates transformation logs

- **validators.js** — Data validation rules
  - Input validation (check source data quality)
  - Output validation (check target data quality)
  - Referential integrity checks
  - Format/type validation

- **lookups/** — Reference data
  - `icd_mappings.json` — ICD-9 to ICD-10 mappings
  - `provider_mappings.json` — Source to target provider ID mappings
  - `cpt_codes.json` — Valid CPT codes
  - `specialty_mappings.json` — Specialty/department mappings

- **logs/** — Execution records
  - `transform_[timestamp].log` — Detailed transformation log
  - `validation_results_[timestamp].json` — Validation results summary
  - `errors_[timestamp].log` — Errors and warnings

## Usage

### Run Full Transformation
```bash
node transform.js --entity=patient --source-file=inputs/patients/example_1/input.json --output-dir=outputs
```

### Run Validation Only
```bash
node validators.js --entity=patient --input-file=inputs/patients/example_1/input.json
```

### Generate Report
```bash
node transform.js --entity=* --report=true
```

## Transformation Process

1. **Load** source data from `../inputs/{entity}/{example}/input.{json|csv}`
2. **Validate Input** — Check source data quality
3. **Transform** — Apply field mappings per `../field_mappings/`
4. **Validate Output** — Check target data quality
5. **Write** results to `../outputs/{entity}/{example}/output.json`
6. **Log** all decisions, transformations, errors

## Example Transformation Run

```
SOURCE: inputs/patients/example_1/input.json
  └─ mrn: PM-0012847
  └─ phone: 6175554321
  └─ active: Y

TRANSFORM:
  ✓ mrn: PM-0012847 (no change)
  ✓ phone: (617) 555-4321 (formatted)
  ✓ active: true (Y → boolean)
  ✓ first_name: Margaret (MARGARET → title case)

OUTPUT: outputs/patients/example_1/output.json
  └─ mrn: PM-0012847
  └─ phone: (617) 555-4321
  └─ active: true
  └─ first_name: Margaret

VALIDATION:
  ✓ Phone format valid
  ✓ Boolean value correct
  ✓ Name format correct
  ✓ All required fields present

STATUS: PASSED
```

## Field Mapping Configuration

Transformation rules are defined in `../field_mappings/`:
- `{source_system}_to_{target_system}.md` — High-level mapping documentation
- `lookups/` — Code/lookup tables for complex mappings

Example mapping configuration:
```json
{
  "patient": {
    "field_mapping": {
      "mrn": { "target_field": "mrn", "transform": "trim" },
      "first_name": { "target_field": "first_name", "transform": "titleCase" },
      "phone": { "target_field": "phone", "transform": "formatPhone" },
      "active": { "target_field": "active", "transform": "toBoolean" }
    }
  }
}
```

## Error Handling

Errors are logged with context:
```
ERROR: Invalid CPT Code
  Record: line_item_12345
  Field: cpt_code
  Value: "99XXX" (should be 5 digits)
  Source: line_item_id ENC_584729
  Action: Skipped this line item, logged for review
```

## Validation Rules

### Input Validation
- Source data must be in expected format
- Required fields must be present
- Date fields must be parseable

### Output Validation
- All required target fields populated
- Format constraints met (phone, email, date, etc.)
- Referenced entities exist (foreign keys valid)
- No unexpected nulls in required fields

## Logging

All transformations are logged for audit trail:
```
[2026-04-07T10:15:23Z] LOAD: inputs/patients/example_1/input.json (1 record)
[2026-04-07T10:15:24Z] TRANSFORM: mrn=PM-0012847, phone=(617) 555-4321, active=true
[2026-04-07T10:15:24Z] VALIDATE: Input validation PASSED
[2026-04-07T10:15:24Z] VALIDATE: Output validation PASSED
[2026-04-07T10:15:24Z] WRITE: outputs/patients/example_1/output.json
[2026-04-07T10:15:24Z] SUCCESS: 1 record transformed
```

## Performance

For large-scale migrations:
- **Patients**: ~1,000 per second
- **Encounters**: ~500 per second
- **Diagnoses**: ~1,000 per second
- **Billing**: ~500 per second

Adjust batch size in `transform.js` config if needed.

---

**Last Updated**: 2026-04-07
