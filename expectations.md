# Transformation Expectations

Document the rules, constraints, and success criteria for each healthcare data conversion.

## Template for Each Conversion

```
## {Source System} → {Target System}

### Scope
- Entities being converted: [Patients, Encounters, Diagnoses, Billing, etc.]
- Date range: [e.g., 2020-01-01 to present]
- Patient count: [e.g., 500 active patients]
- Estimated records: [Encounters: 5000, Diagnoses: 15000, etc.]

### Data Integrity Rules
- [ ] All patient identifiers must map (MRN, patient ID, DOB match required)
- [ ] Encounter dates must not be modified
- [ ] ICD/CPT codes must remain valid (check against current code sets)
- [ ] Billing amounts must match source system exactly (no rounding)
- [ ] Provider credentials must be verified in target system

### Transformation Rules
- **Patient Names**: [e.g., "Last, First" → "First Last"]
- **Dates**: [e.g., format YYYY-MM-DD, handle nulls as "1900-01-01"?]
- **Phone Numbers**: [e.g., strip non-digits, format as (XXX) XXX-XXXX]
- **Diagnoses**: [e.g., ICD-9 → ICD-10 mapping required, use lookup table]
- **Billing**: [e.g., Combine line items with same CPT code, calculate totals]

### Lossy Transformations (Data Dropped or Modified)
- [ ] Free-text notes truncated to 255 chars? → Justification
- [ ] Custom fields dropped? → Which fields, why acceptable?
- [ ] Historical diagnoses older than [DATE]? → Intentional cutoff?

### Validation Rules
- Patients:
  - [ ] All required fields present (first name, last name, DOB)
  - [ ] No duplicate MRNs in target
  - [ ] Phone/email format valid
- Encounters:
  - [ ] Service dates fall within acceptable range
  - [ ] Provider exists in target system
  - [ ] Encounter type is valid in target system
- Diagnoses:
  - [ ] ICD codes are valid for date of service
  - [ ] At least one primary diagnosis per encounter
- Billing:
  - [ ] CPT codes are valid
  - [ ] Total charges ≥ sum of line items
  - [ ] No negative amounts except adjustments

### Success Criteria
- [ ] 100% of target records have required fields
- [ ] 99.5%+ of records pass validation rules
- [ ] 0 patient identifier mismatches
- [ ] 0 data integrity violations
- [ ] Audit log shows all transformations
- [ ] Manual QA sign-off obtained
```

## Example: Pending Patient Conversion

*Use this as a reference; replace with actual conversion details*

### Scope
- Entities: Patients, Encounters, Diagnoses, Billing
- Date range: 2015-01-01 to 2025-04-07
- Patient count: ~1,200 active
- Records: Encounters: ~8,000, Diagnoses: ~24,000, Line items: ~12,000

### Data Integrity Rules
- All MRNs must exist and be unique
- DOB must match source exactly (patient identity verification)
- Active encounters must have valid dates and providers
- Diagnoses must link to valid encounters

### Transformation Rules
- **Dates**: Convert all to ISO 8601 (YYYY-MM-DD)
- **Patient Name**: "LAST, FIRST" → "First Last" in target
- **ICD Mapping**: ICD-9 codes map to ICD-10 via provided lookup table
- **Billing**: Sum line items by encounter; flag discrepancies
- **Phone**: Strip non-digits, store as 10-digit string

### Lossy Transformations
- Custom "Problem Status" field (not supported in target) → Will be dropped, noted in logs
- Notes older than 2015 → Not migrated (scope limited to 2015 forward)

### Validation Rules
- **Patients**: 100% must have first name, last name, DOB, active flag
- **Encounters**: 100% must have patient ID, encounter date, provider ID
- **Diagnoses**: 100% must have ICD code, encounter ID, valid code for date
- **Billing**: CPT codes must be valid; amounts must be positive or adjustment-coded

### Success Criteria
- [ ] All 1,200 patients successfully loaded
- [ ] 100% encounter records match source count (8,000)
- [ ] 99%+ diagnoses have valid ICD-10 codes
- [ ] Billing total within $100 of source (rounding tolerance)
- [ ] Zero duplicate patients in target
