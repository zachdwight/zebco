# Field Mapping Template

Use this template to document field-level mappings from source system to target system.

## Conversion Details

- **Source System**: [Name, e.g., "NextGen EHR v6.2"]
- **Target System**: [Name, e.g., "Epic EHR v2024"]
- **Entity Type**: [Patient|Encounter|Diagnosis|Billing|etc.]
- **Mapping Owner**: [Name/Role]
- **Date Created**: 2026-04-07
- **Last Updated**: 2026-04-07

---

## Field-by-Field Mapping

| Source Field | Source Type | Target Field | Target Type | Mapping Rule | Notes |
|--------------|-------------|--------------|-------------|--------------|-------|
| mrn | VARCHAR(20) | mrn | VARCHAR(20) | Direct 1:1 copy | Preserve original MRN for audit |
| patient_id | INT | patient_id | VARCHAR(36) | Assigned by target (surrogate key) | Do not import source ID; use for lookup only |
| first_name | VARCHAR(50) | first_name | VARCHAR(100) | Trim whitespace, title case | Convert "JOHN" → "John" |
| last_name | VARCHAR(50) | last_name | VARCHAR(100) | Trim whitespace, title case | Convert "SMITH" → "Smith" |
| [field] | [type] | [field] | [type] | [rule] | [notes] |

---

## Transformation Logic

### For Each Field

**Field Name**: [source_field_name]
- **Source Format**: [e.g., "YYYYMMDD or YYYY-MM-DD"]
- **Target Format**: [e.g., "YYYY-MM-DD"]
- **Transformation**: [e.g., "Parse source, convert to ISO 8601"]
- **Null Handling**: [e.g., "If source is null, set to 1900-01-01" or "Skip field in target"]
- **Validation**: [e.g., "Date must be between 1900 and today"]
- **Example**:
  ```
  Source: "20250715" → Target: "2025-07-15"
  Source: null → Target: [skip or default]
  ```

---

## Code Mapping Tables

### ICD Mappings (if ICD-9 → ICD-10)

| Source ICD-9 | Source Description | Target ICD-10 | Target Description | Confidence | Notes |
|--------------|-------------------|---------------|--------------------|------------|-------|
| 250.00 | Diabetes Type 2 without complications | E11.9 | Type 2 diabetes mellitus without complications | High | Standard mapping |
| 401.9 | Hypertension, unspecified | I10 | Essential (primary) hypertension | High | Standard mapping |
| [code] | [desc] | [code] | [desc] | [confidence] | [notes] |

**Mapping Source**: [e.g., "CMS General Equivalence Mappings (GEMs)"]
**Confidence Levels**:
- **High**: Direct 1:1 mapping, validated
- **Medium**: Reasonable approximation, may require review
- **Low**: Approximate or multiple possible targets; requires clinical review

### Provider ID Mappings

| Source Provider ID | Source Name | Target Provider ID | Target Name | NPI | Match Method |
|-------------------|-------------|-------------------|-------------|-----|--------------|
| DR_001 | Dr. James Mitchell | PROV_DR001 | James Mitchell, MD | 1234567890 | Manual lookup |
| [id] | [name] | [id] | [name] | [npi] | [method] |

**Match Methods**:
- **NPI Lookup**: Matched via National Provider Identifier (10 digits)
- **Name Match**: Matched by last name + specialty
- **Manual**: Manually researched and mapped
- **Email Match**: Matched via email address

### Department/Specialty Mappings

| Source Department | Target Department | Notes |
|------------------|------------------|-------|
| Cardiology | Cardiology | Direct match |
| Internal Medicine | General Internal Medicine | Slightly different name |
| [source] | [target] | [notes] |

---

## Lossy Transformations (Data Dropped)

Document any fields that will be dropped and why:

| Source Field | Data Type | Size | Reason for Dropping | Business Impact | Approval |
|--------------|-----------|------|-------------------|-----------------|----------|
| custom_field_1 | VARCHAR(500) | ~2KB | Not supported by target | Low - rarely used | [Name/Date] |
| [field] | [type] | [size] | [reason] | [impact] | [approval] |

---

## Edge Cases & Special Handling

### Case 1: [Description]
- **Scenario**: [When this happens]
- **Source Data Example**: [What the source looks like]
- **Target Expected**: [What should happen]
- **Transformation Logic**:
  ```
  [Pseudo-code or algorithm]
  ```

### Case 2: [Description]
- **Scenario**: [When this happens]
- **Source Data Example**: [What the source looks like]
- **Target Expected**: [What should happen]
- **Transformation Logic**:
  ```
  [Pseudo-code or algorithm]
  ```

### Example: Handling Null/Empty Phone Numbers
- **Scenario**: Source has phone field but it's empty or null
- **Source Data Example**: `phone: ""` or `phone: null` or `phone: "NOT PROVIDED"`
- **Target Expected**: Omit field or populate with standardized placeholder
- **Transformation Logic**:
  ```
  IF phone IS NULL OR phone = "" OR phone = "NOT PROVIDED"
    THEN omit from target output
  ELSE
    Strip non-digits, validate 10-digit US format
    Format as (XXX) XXX-XXXX
  ```

---

## Data Quality Checks

### Pre-Transformation Validation
Check source data before attempting transformation:
- [ ] No NULL values in required fields
- [ ] Date fields are in expected format (no garbage data)
- [ ] ICD/CPT codes exist in current code sets
- [ ] Provider IDs resolve to existing providers

### Post-Transformation Validation
Check target data after transformation:
- [ ] All records match source count (or documented variance)
- [ ] Required fields are populated
- [ ] Format constraints met (lengths, types)
- [ ] Referential integrity maintained (foreign keys valid)
- [ ] No data corruption or unexpected nulls

---

## Testing

### Unit Tests (Per-Field)

```
Test: ICD-9 to ICD-10 Mapping
  Input: "250.00"
  Expected: "E11.9"
  Status: PASS / FAIL

Test: Phone Number Formatting
  Input: "6175554321"
  Expected: "(617) 555-4321"
  Status: PASS / FAIL

Test: Null Phone Handling
  Input: null
  Expected: (field omitted)
  Status: PASS / FAIL
```

### Integration Tests (Full Records)

```
Test: Complete Patient Record Transformation
  Source File: inputs/patients/example_1/input.json
  Expected Output: outputs/patients/example_1/output.json
  Status: PASS / FAIL
  Variance: [notes on differences]
```

---

## Implementation Notes

### Code Location
- **Transformation Code**: `transformations/transform.js` (or .py, .sql, etc.)
- **Test Code**: `transformations/tests/test_mappings.js`
- **Lookup Tables**: `field_mappings/lookups/` directory

### Execution Steps
1. Read source data from `inputs/{entity_type}/{example}/`
2. Apply transformations using mapping rules
3. Output to `outputs/{entity_type}/{example}/`
4. Run validation tests
5. Compare to expected output
6. Log all decisions and mismatches

### Performance Considerations
- **Batch Size**: [e.g., "Process 1,000 records per batch"]
- **Lookup Performance**: [e.g., "Cache ICD mapping table in memory"]
- **Estimated Duration**: [e.g., "8,000 encounters × 0.5ms per record = 4 seconds"]

---

## Sign-Off

- **Mapping Reviewed By**: [Name/Role]
- **Approved For Use**: [Yes/No]
- **Compliance Verified**: [Yes/No]
- **Date Approved**: YYYY-MM-DD

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-04-07 | 1.0 | [Name] | Initial mapping |
| [date] | [version] | [author] | [changes] |

---

**Template Last Updated**: 2026-04-07
