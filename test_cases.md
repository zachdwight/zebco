# Test Cases & Validation Checklist

Document test cases and validation rules for each conversion. Use this to verify outputs before cutover.

## Patient Validation Checklist

- [ ] **Count Match**: Row count matches source system
- [ ] **Uniqueness**: All patient IDs are unique (no duplicates)
- [ ] **Required Fields**: 100% have first_name, last_name, dob
- [ ] **Date Format**: All dob values are YYYY-MM-DD
- [ ] **Gender Codes**: All values are M, F, O, or U
- [ ] **Phone Format**: Valid format (10 digits or (XXX) XXX-XXXX)
- [ ] **Email Format**: Valid email addresses (if present)
- [ ] **SSN Unique**: All SSNs unique in target (no duplicates)
- [ ] **Address**: City and state match where present
- [ ] **Active Flag**: Boolean values (true/false), not Y/N or 1/0
- [ ] **Import Metadata**: All records have import_source and import_date

### Sample Test Queries
```sql
-- Check for duplicate patient IDs
SELECT patient_id, COUNT(*) FROM patients GROUP BY patient_id HAVING COUNT(*) > 1;

-- Check for missing required fields
SELECT COUNT(*) FROM patients WHERE first_name IS NULL OR last_name IS NULL OR dob IS NULL;

-- Check for invalid active flags
SELECT DISTINCT active FROM patients;

-- Validate phone format (if using regex)
SELECT phone FROM patients WHERE phone NOT REGEXP '^\\(\\d{3}\\)\\s\\d{3}-\\d{4}$';
```

---

## Encounter Validation Checklist

- [ ] **Count Match**: Row count matches source system
- [ ] **Patient Link**: All encounters link to valid patient_id
- [ ] **Date Range**: All encounter_date values within acceptable range
- [ ] **Date Format**: All dates are YYYY-MM-DD
- [ ] **Time Format**: All times (if present) are HH:MM:SS
- [ ] **Provider Exists**: All provider_id values exist in Provider table
- [ ] **Encounter Type Valid**: All types are valid in target system
- [ ] **Department Valid**: All departments (if present) are valid
- [ ] **Status Valid**: All status values are Completed|Scheduled|Cancelled
- [ ] **Billing Status Valid**: All billing_status values are Billed|Unbilled|Denied|Adjusted
- [ ] **Chief Complaint**: Populated for all records (not empty)
- [ ] **Notes Summary**: Not exceeding length limit (300 chars typical)

### Sample Test Queries
```sql
-- Check for orphaned encounters (no linked patient)
SELECT e.encounter_id FROM encounters e
LEFT JOIN patients p ON e.patient_id = p.patient_id
WHERE p.patient_id IS NULL;

-- Verify encounter dates are recent/valid
SELECT COUNT(*) FROM encounters WHERE encounter_date > CURDATE() OR encounter_date < '2000-01-01';

-- Check for missing provider links
SELECT e.encounter_id FROM encounters e
LEFT JOIN providers pr ON e.provider_id = pr.provider_id
WHERE pr.provider_id IS NULL;

-- Validate status values
SELECT DISTINCT status FROM encounters WHERE status NOT IN ('Completed', 'Scheduled', 'Cancelled');
```

---

## Diagnosis Validation Checklist

- [ ] **Count Match**: Row count matches source system (±2% tolerance)
- [ ] **Patient Link**: All diagnoses link to valid patient_id
- [ ] **ICD Code Format**: All ICD-10 codes valid format
- [ ] **ICD Code Valid**: All codes exist in current ICD-10 code set
- [ ] **Code Date Match**: ICD code is valid for diagnosis_date
- [ ] **Encounter Link**: If linked to encounter, encounter exists
- [ ] **Status Valid**: All status values are Active|Resolved|Ruled Out
- [ ] **Primary Flag**: At least one primary diagnosis per encounter (if required)

### Sample Test Queries
```sql
-- Check for invalid ICD-10 codes
SELECT d.icd_code FROM diagnoses d
LEFT JOIN icd10_codes i ON d.icd_code = i.code
WHERE i.code IS NULL;

-- Validate code for service date
SELECT d.icd_code, d.diagnosis_date FROM diagnoses d
WHERE d.icd_code NOT IN (
  SELECT code FROM icd10_codes
  WHERE effective_date <= d.diagnosis_date
    AND (end_date IS NULL OR end_date >= d.diagnosis_date)
);

-- Check for encounters without primary diagnosis
SELECT e.encounter_id FROM encounters e
LEFT JOIN diagnoses d ON e.encounter_id = d.encounter_id AND d.is_primary = true
WHERE d.diagnosis_id IS NULL;
```

---

## Billing Line Items Validation Checklist

- [ ] **Count Match**: Row count matches source system (±1% tolerance)
- [ ] **Patient Link**: All items link to valid patient_id
- [ ] **Encounter Link**: All items link to valid encounter_id
- [ ] **CPT Code Valid**: All codes exist in current CPT code set
- [ ] **CPT Code Active**: All codes are active for service_date
- [ ] **Quantity > 0**: All quantities are positive integers
- [ ] **Unit Price > 0**: All unit prices are positive decimals
- [ ] **Total = Qty × Unit Price**: Math checks out
- [ ] **Charges Non-Negative**: All charges are ≥ 0 (except adjustments)
- [ ] **Total Revenue Match**: Sum of all charges matches source within 1%

### Sample Test Queries
```sql
-- Validate CPT codes
SELECT li.cpt_code FROM line_items li
LEFT JOIN cpt_codes c ON li.cpt_code = c.code
WHERE c.code IS NULL;

-- Check math: total_charge should equal quantity × unit_price
SELECT line_item_id, quantity, unit_price, total_charge
FROM line_items
WHERE total_charge != (quantity * unit_price);

-- Verify total revenue matches source
SELECT SUM(total_charge) as migrated_total FROM line_items;
-- Compare to: SELECT SUM(charge_amount) FROM source_billing_table;

-- Check for negative amounts that aren't adjustments
SELECT * FROM line_items
WHERE total_charge < 0 AND status != 'Adjusted';
```

---

## Provider Validation Checklist

- [ ] **Count Match**: Row count matches source (may exclude inactive)
- [ ] **Name Populated**: All providers have first and last name (or display_name)
- [ ] **NPI Valid**: All NPI numbers are 10 digits (if required)
- [ ] **NPI Unique**: All NPIs are unique (no duplicates)
- [ ] **Specialty Valid**: All specialties are valid in target system
- [ ] **Active Flag**: Boolean values for active status
- [ ] **Credentials Match**: Titles (MD, DO, PA, NP) are valid

### Sample Test Queries
```sql
-- Check for duplicate NPIs
SELECT npi, COUNT(*) FROM providers WHERE npi IS NOT NULL GROUP BY npi HAVING COUNT(*) > 1;

-- Validate NPI format (10 digits)
SELECT provider_id, npi FROM providers WHERE npi NOT REGEXP '^[0-9]{10}$';

-- Check for missing required fields
SELECT * FROM providers WHERE name IS NULL OR npi IS NULL;
```

---

## Data Quality Metrics

### Success Thresholds
Define what "success" looks like for this conversion:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Record Count Match | 99%+ | Investigate >1% variance |
| Data Completeness (required fields) | 100% | Fix before import |
| Validation Rule Pass Rate | 99.5%+ | Review failures |
| Duplicate ID Count | 0 | Fix all duplicates |
| Referential Integrity (foreign keys) | 100% | Fix orphaned records |
| Data Type Errors | 0 | Fix format issues |

### Example Metrics Report
```
PATIENTS
  Total Records: 1,200
  Validation Passed: 1,200 (100%)
  Duplicates Found: 0
  ✅ READY FOR IMPORT

ENCOUNTERS
  Total Records: 8,000
  Validation Passed: 7,960 (99.5%)
  Failures: 40 (review needed)
  Orphaned Records: 0
  ⚠️ REVIEW FAILURES BEFORE IMPORT

DIAGNOSES
  Total Records: 24,000
  Validation Passed: 23,650 (98.5%)
  Invalid ICD Codes: 350
  ❌ FIX INVALID CODES BEFORE IMPORT

BILLING
  Total Records: 12,000
  Validation Passed: 12,000 (100%)
  Revenue Match to Source: 99.98% ($450,240.12 vs $450,291.34)
  ✅ READY FOR IMPORT
```

---

## Pre-Import Checklist

Before moving data to production:

- [ ] All validation tests passed
- [ ] Metrics meet thresholds
- [ ] Failures reviewed and documented
- [ ] Lossy transformations approved by stakeholders
- [ ] Audit logs generated and reviewed
- [ ] Backup of target system created
- [ ] Rollback procedure tested and ready
- [ ] Go/No-Go meeting held with all stakeholders
- [ ] Clinical staff spot-check random records (sample 10-20 patients)
- [ ] Compliance officer sign-off obtained
- [ ] Import window scheduled and communicated

---

**Last Updated**: 2026-04-07
