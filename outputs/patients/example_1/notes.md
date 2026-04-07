# Patient Example 1 - Transformation Notes

## Input
- Source: `inputs/patients/example_1/input.json`
- Source System: [Name of source EHR/PM system]

## Transformations Applied

| Field | Input | Output | Transformation Rule |
|-------|-------|--------|-------------------|
| mrn | PM-0012847 | PM-0012847 | Preserved as reference |
| patient_id | PAT_10234 | PT_5847293 | Assigned new ID by target system |
| first_name | MARGARET | Margaret | Converted to title case (was all caps) |
| last_name | JOHNSON | Johnson | Converted to title case (was all caps) |
| dob | 1965-03-22 | 1965-03-22 | Already in ISO format, no change |
| gender | F | F | Preserved as-is |
| ssn | 123-45-6789 | 123-45-6789 | Preserved in XXX-XX-XXXX format |
| phone | 6175554321 | (617) 555-4321 | Formatted to (XXX) XXX-XXXX |
| email | m.johnson@email.com | m.johnson@email.com | Preserved as-is |
| address_line1 | 456 Oak Street | (in address field) | Combined into single address field |
| address_line2 | (empty) | (in address field) | Combined into single address field |
| city | Boston | Boston | Preserved as-is |
| state | MA | MA | Preserved as-is |
| zip | 02115 | 02115 | Preserved as-is |
| active | Y | true | Converted to boolean |
| created_date | 2018-05-10 | (not in output) | Not required by target system |
| modified_date | 2025-11-15 | (not in output) | Not required by target system |

## Validation Results

✅ **PASSED**
- Patient ID is unique in target system
- DOB matches source exactly
- All required fields present
- Phone format is valid
- SSN format is valid
- Email is valid format
- Active flag correctly converted
- No missing data in required fields

## Data Integrity
- No data dropped (address_line2 was already empty in input)
- No lossy transformations
- SSN retained (required for patient verification)
- Original MRN preserved for reference

## Sign-Off
- Reviewed by: [Name/Role]
- Approved for import: [Yes/No]
- Date: 2026-04-07
