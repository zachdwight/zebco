# Data Schema & Definitions

Define the structure of input and output data for each healthcare entity type.

## Patient

### Input Schema (Source System)
```json
{
  "mrn": "string (source medical record number)",
  "patient_id": "string (source system primary key)",
  "first_name": "string",
  "last_name": "string",
  "dob": "string (YYYY-MM-DD)",
  "gender": "string (M|F|O|U)",
  "ssn": "string (XXX-XX-XXXX format, optional)",
  "phone": "string (varies by source system)",
  "email": "string (optional)",
  "address_line1": "string",
  "address_line2": "string (optional)",
  "city": "string",
  "state": "string (2-letter state code)",
  "zip": "string (5-digit or 9-digit)",
  "active": "boolean or string (Y/N, 1/0, true/false)",
  "created_date": "string (YYYY-MM-DD)",
  "modified_date": "string (YYYY-MM-DD)"
}
```

### Output Schema (Target System)
```json
{
  "patient_id": "string (target system primary key, often assigned by target)",
  "mrn": "string (source MRN, preserved for reference)",
  "first_name": "string",
  "last_name": "string",
  "dob": "string (YYYY-MM-DD, required)",
  "gender": "string (M|F|O|U, required)",
  "ssn": "string (XXX-XX-XXXX, optional)",
  "phone": "string (10-digit format: (XXX) XXX-XXXX)",
  "email": "string (valid email format, optional)",
  "address": "string (full address combined, optional)",
  "city": "string",
  "state": "string (2-letter code)",
  "zip": "string (5-digit)",
  "active": "boolean (true/false)",
  "import_source": "string (source system name)",
  "import_date": "string (ISO 8601, today's date)"
}
```

---

## Encounter (Visit/Appointment)

### Input Schema (Source System)
```json
{
  "encounter_id": "string (source encounter primary key)",
  "mrn": "string (patient MRN or ID)",
  "encounter_date": "string (YYYY-MM-DD)",
  "encounter_time": "string (HH:MM:SS, optional)",
  "provider_id": "string (source provider ID)",
  "provider_name": "string",
  "encounter_type": "string (e.g., Office Visit, Telehealth, ER, Inpatient)",
  "department": "string (e.g., Cardiology, Internal Medicine)",
  "chief_complaint": "string (patient's primary complaint)",
  "visit_notes": "text (clinical notes, may be large)",
  "status": "string (Completed, Scheduled, Cancelled)",
  "billing_status": "string (Billed, Unbilled, Denied)",
  "created_date": "string (YYYY-MM-DD)"
}
```

### Output Schema (Target System)
```json
{
  "encounter_id": "string (target system primary key)",
  "patient_id": "string (target patient ID, linked to Patient table)",
  "source_encounter_id": "string (preserve source ID for reference)",
  "encounter_date": "string (YYYY-MM-DD, required)",
  "encounter_time": "string (HH:MM:SS, optional)",
  "provider_id": "string (target provider ID, must exist in Provider table)",
  "encounter_type": "string (must be valid in target system)",
  "department": "string (optional, must be valid if provided)",
  "chief_complaint": "string (0-500 characters, truncate if needed)",
  "notes_summary": "string (0-1000 characters, truncated from visit_notes)",
  "status": "string (Completed|Scheduled|Cancelled)",
  "billing_status": "string (Billed|Unbilled|Denied)",
  "import_date": "string (ISO 8601)"
}
```

---

## Diagnosis (ICD Codes)

### Input Schema (Source System)
```json
{
  "diagnosis_id": "string (source primary key)",
  "encounter_id": "string or null (linked to encounter)",
  "mrn": "string (patient MRN)",
  "icd_code": "string (ICD-9 or ICD-10 code, e.g., 'E11.22')",
  "description": "string (description of diagnosis)",
  "diagnosis_date": "string (YYYY-MM-DD, may differ from encounter date)",
  "status": "string (Active, Resolved, Ruled Out)",
  "is_primary": "boolean or Y/N (primary vs. secondary)",
  "created_date": "string (YYYY-MM-DD)"
}
```

### Output Schema (Target System)
```json
{
  "diagnosis_id": "string (target primary key)",
  "encounter_id": "string (target encounter ID if applicable)",
  "patient_id": "string (target patient ID)",
  "icd_code": "string (ICD-10 code, must be valid for service date)",
  "description": "string",
  "diagnosis_date": "string (YYYY-MM-DD, required)",
  "status": "string (Active|Resolved|Ruled Out)",
  "is_primary": "boolean (true|false)",
  "mapped_from": "string (source ICD code if transformed, e.g., 'ICD-9: 250.00')",
  "import_date": "string (ISO 8601)"
}
```

---

## Billing Line Item

### Input Schema (Source System)
```json
{
  "line_item_id": "string",
  "encounter_id": "string",
  "mrn": "string",
  "cpt_code": "string (5-digit CPT code, e.g., '99213')",
  "cpt_description": "string",
  "charge_amount": "number (decimal, e.g., 150.00)",
  "units": "integer (quantity of procedure)",
  "icd_codes": "string or array (primary diagnosis code(s))",
  "service_date": "string (YYYY-MM-DD, may differ from encounter_date)",
  "provider_id": "string",
  "status": "string (Billed, Unbilled, Denied, Adjusted)"
}
```

### Output Schema (Target System)
```json
{
  "line_item_id": "string (target primary key)",
  "encounter_id": "string (target encounter ID)",
  "patient_id": "string (target patient ID)",
  "cpt_code": "string (5-digit CPT code, must be valid)",
  "quantity": "integer (default: 1)",
  "unit_price": "number (decimal, 2 places)",
  "total_charge": "number (decimal, 2 places, = quantity × unit_price)",
  "primary_diagnosis": "string (ICD-10 code for billing)",
  "service_date": "string (YYYY-MM-DD)",
  "status": "string (Billed|Unbilled|Denied|Adjusted)",
  "import_date": "string (ISO 8601)"
}
```

---

## Provider (Staff/Clinician)

### Input Schema (Source System)
```json
{
  "provider_id": "string (source ID, e.g., NPI or internal ID)",
  "first_name": "string",
  "last_name": "string",
  "title": "string (MD, DO, PA, NP, etc.)",
  "specialty": "string (Cardiology, etc.)",
  "npi": "string (National Provider Identifier, 10 digits, optional)",
  "phone": "string",
  "email": "string",
  "active": "boolean or Y/N"
}
```

### Output Schema (Target System)
```json
{
  "provider_id": "string (target primary key)",
  "name": "string (Last, First)",
  "title": "string (MD|DO|PA|NP|RN|etc.)",
  "specialty": "string (must be valid in target system)",
  "npi": "string (10 digits, required in most systems)",
  "phone": "string (10-digit format)",
  "email": "string",
  "active": "boolean (true|false)",
  "verified_in_target": "boolean (must be true before import)"
}
```

---

## Lab Result

### Input Schema (Source System)
```json
{
  "result_id": "string",
  "encounter_id": "string or null",
  "mrn": "string",
  "test_name": "string (e.g., 'Complete Blood Count')",
  "test_code": "string (LOINC or internal code)",
  "result_value": "string or number (varies by test)",
  "result_unit": "string (e.g., 'mg/dL', 'K/uL')",
  "normal_range": "string (e.g., '4.5-11.0')",
  "result_date": "string (YYYY-MM-DD)",
  "status": "string (Final, Preliminary, Cancelled)"
}
```

### Output Schema (Target System)
```json
{
  "result_id": "string (target primary key)",
  "patient_id": "string (target patient ID)",
  "encounter_id": "string or null (target encounter ID)",
  "test_name": "string",
  "test_code": "string (LOINC preferred)",
  "result_value": "string (keep original format)",
  "result_unit": "string",
  "normal_range": "string",
  "result_date": "string (YYYY-MM-DD)",
  "status": "string (Final|Preliminary|Cancelled)",
  "import_date": "string (ISO 8601)"
}
```

---

## Schema Notes

### Field Naming Conventions
- Source schemas preserve original system naming
- Target schemas use snake_case consistently
- Use explicit NULL/null for optional fields not present
- Use 0-based counts (units, quantity)

### Required vs. Optional
- **Required**: Fields marked in output schema with comment
- **Optional**: Fields may be null or omitted
- Document business rules for required fields (e.g., "patient must have DOB")

### Data Type Handling
- **Dates**: ISO 8601 format (YYYY-MM-DD) in output
- **Decimals**: 2 decimal places for currency, 4+ for scientific values
- **Booleans**: Prefer true/false over Y/N or 1/0 in target
- **Text**: Trim whitespace; truncate if length limits exist
- **Codes**: Validate against authoritative code sets (ICD, CPT, LOINC)

---

**Last Updated**: 2026-04-07
