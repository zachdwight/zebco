# Getting Started with Healthcare ELT

A quick guide to using this framework for healthcare data migrations.

## Project Overview

This project is structured around three core concepts:

1. **Inputs** — Source data exported from the legacy system
2. **Expectations** — Rules defining how to transform data and what success looks like
3. **Outputs** — Transformed data ready for import into the target system

The framework helps you document, execute, and validate healthcare data conversions while maintaining HIPAA compliance and data integrity.

## Quick Start

### Step 1: Set Up a New Conversion

Copy and fill out the expectations document:

```bash
cp expectations.md my_conversion_expectations.md
# Edit my_conversion_expectations.md with your specific conversion details
```

Fill in:
- Source system name and version
- Target system name and version
- Scope (which entities, date range, patient count)
- Data integrity rules
- Transformation rules (how fields map and change)
- Lossy transformations (what data is dropped, why)
- Validation rules (what makes the output acceptable)
- Success criteria

### Step 2: Document Field Mappings

Create a field mapping document for your source→target systems:

```bash
cp field_mappings/TEMPLATE_source_to_target.md field_mappings/NextGen_to_Epic.md
# Edit with your specific field mappings, code tables, edge cases
```

Document:
- Each field: source name/type → target name/type → transformation rule
- Code mappings (ICD-9→ICD-10, specialty names, provider IDs)
- Lossy transformations (fields you'll drop, why)
- Edge cases (null handling, date formats, etc.)
- Lookup tables (icd_mappings.json, provider_mappings.json)

### Step 3: Prepare Example Data

Place sample source data in `inputs/`:

```bash
inputs/
  patients/example_1/input.json
  encounters/example_1/input.json
  diagnoses/example_1/input.json
  billing/example_1/input.json
```

Each entity type should have at least 1-2 examples covering:
- Common cases
- Edge cases (nulls, unusual values, complex transformations)

### Step 4: Run Transformations

Execute the transformation code against examples:

```bash
node transformations/transform.js --entity=patient --source=inputs/patients/example_1/input.json
```

Output will be written to:
```bash
outputs/patients/example_1/output.json
```

### Step 5: Validate Results

Compare outputs to expectations:

1. **Open** `outputs/{entity}/example_{n}/output.json`
2. **Check** against `outputs/{entity}/example_{n}/notes.md`
3. **Verify** each transformation matches the expectations document
4. **Run** validation tests from `test_cases.md`

### Step 6: Document Findings

Create a notes file explaining transformations and approvals:

```bash
outputs/patients/example_1/notes.md
```

Include:
- What each field was transformed into and why
- Which transformations are lossy (data dropped)
- Validation results (all checks passed?)
- Sign-off (who approved the output?)

### Step 7: Prepare for Full Migration

Once examples are validated:

1. **Refine** transformation code based on learnings
2. **Test** at scale (run on full patient population)
3. **Validate** metrics meet success thresholds
4. **Document** any data quality issues found
5. **Get Approval** from stakeholders and compliance
6. **Schedule** cutover window
7. **Execute** migration and monitor

---

## Key Documents

### For Planning
- **expectations.md** — What the migration should accomplish
- **data_schema.md** — Structure of inputs and outputs
- **compliance.md** — HIPAA and data privacy rules

### For Execution
- **field_mappings/** — How fields map and transform
- **transformations/** — Code that performs the migration
- **inputs/** — Example source data
- **outputs/** — Example target data + notes

### For Validation
- **test_cases.md** — Checklist and validation rules
- **outputs/{entity}/{example}/notes.md** — Transformation documentation

---

## Common Workflows

### "How do I know what transformations to apply?"

1. Check `field_mappings/{source}_to_{target}.md`
2. Look at the transformation rule for each field
3. Check for special cases or edge cases section
4. Validate against `test_cases.md` rules

### "My data doesn't match the schema. What do I do?"

1. Check `data_schema.md` to understand expected format
2. Update your transformation code to handle the actual format
3. Document the variation in field_mappings
4. Add edge case to prevent similar issues

### "I dropped some data. Is that okay?"

1. Check `expectations.md` - is this transformation documented?
2. Check `field_mappings/` - does the mapping explain it?
3. If not documented: document the transformation and get approval
4. If documented: verify it's in the "lossy transformations" section with justification

### "How do I validate the output before import?"

1. Run all tests in `test_cases.md` validation checklist
2. Check metrics against success thresholds
3. Have clinical staff spot-check random records
4. Verify referential integrity (foreign keys)
5. Compare totals (record count, revenue, etc.) to source
6. Get compliance and clinical sign-off

### "Something failed during transformation. What now?"

1. Check `transformations/logs/` for error messages
2. Find the specific record that failed
3. Review field mapping rules for that field
4. Check if it's an edge case that needs special handling
5. Update transformation code to handle the case
6. Re-run the transformation
7. Update `test_cases.md` to prevent future issues

---

## Example Conversion: "Pending Office to Epic EHR"

Here's a real-world example of how to use this framework:

### 1. Set Up Expectations
```markdown
## Pending → Epic EHR

### Scope
- Entities: Patients, Encounters, Diagnoses, Billing
- Patients: ~1,200 active
- Encounters: ~8,000 (2015-present)
- Diagnoses: ~24,000
- Billing: ~12,000 line items

### Transformation Rules
- Dates: ISO 8601 (YYYY-MM-DD)
- Patient names: Title case
- ICD: ICD-9 → ICD-10 via CMS GEMs table
- Phone: Format as (XXX) XXX-XXXX
- Notes: Truncate to 1,000 chars

### Success Criteria
- 100% of patients have required fields
- 99.5% of records pass validation
- Revenue match within 1%
- Zero patient ID duplicates
```

### 2. Create Field Mapping
```markdown
## Pending → Epic Mapping

| Pending Field | Epic Field | Rule |
|---|---|---|
| MRN | MRN | Copy as-is |
| PATIENT_NAME_LAST | LAST_NAME | Title case |
| PATIENT_NAME_FIRST | FIRST_NAME | Title case |
| DOB | DATE_OF_BIRTH | MMDDYYYY → YYYY-MM-DD |
| PHONE_NUM | PHONE | Strip non-digits, format |
| ICD9_CODE | ICD10_CODE | CMS GEMs mapping |
```

### 3. Prepare Examples
```
inputs/patients/example_1/
  input.json (real Pending export, anonymized)
inputs/encounters/example_1/
  input.json (sample encounters)
inputs/diagnoses/example_1/
  input.json (sample diagnoses with ICD-9)
```

### 4. Run & Validate
```bash
node transformations/transform.js --entity=patient --source=inputs/patients/example_1/input.json
# Output: outputs/patients/example_1/output.json

# Check outputs/patients/example_1/notes.md for validation results
# All tests should pass
```

### 5. Document & Approve
```markdown
✓ All field transformations correct
✓ Phone format valid
✓ Name case correct
✓ No duplicates
✓ Approved by: [Name], Date: 2026-04-07
```

### 6. Scale & Monitor
- Run on all 1,200 patients
- Verify 99.5%+ pass validation
- Revenue match within 1%
- Get clinical sign-off
- Execute migration

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Transformation fails on specific record | Check edge case handling in field_mappings |
| Output doesn't match expected | Compare actual to output/notes.md transformation rules |
| Validation fails | Review test_cases.md rules; update transformation code |
| Data lost or incorrect | Check field_mappings for lossy transformation approval |
| Provider/code not found | Verify lookup tables in transformations/lookups/ |

---

## Questions?

Refer to:
- **"What should I do?"** → Start with `expectations.md` for your conversion
- **"How do I transform field X?"** → Check `field_mappings/`
- **"Is my output correct?"** → Check `outputs/{entity}/{example}/notes.md`
- **"What's the policy on X?"** → Check `compliance.md`

---

**Last Updated**: 2026-04-07
