# HIPAA & Data Compliance Guidelines

Healthcare data migrations require strict adherence to privacy and security regulations.

## HIPAA Compliance (US)

### Protected Health Information (PHI)
The following elements are considered PHI and must be handled with care:
- Patient names, addresses, phone numbers, emails
- Medical record numbers, patient account numbers
- Dates (birth, admission, discharge, death)
- Biometric identifiers
- Healthcare provider identifiers
- Insurance information
- Diagnoses, treatment plans, medication lists

### Requirements
- **Encryption in Transit**: Use TLS 1.2+ for all data transfers
- **Encryption at Rest**: If storing intermediate data locally, encrypt with AES-256
- **Access Control**: Only authorized personnel access migration systems/logs
- **Audit Logs**: Maintain complete audit trail of who accessed what, when
- **Minimum Necessary**: Only migrate data required for the target system
- **Data Retention**: Delete source/intermediate data after migration verification
- **Business Associate Agreement (BAA)**: Verify BAA in place with target system provider

### Prohibited Actions
- ❌ Do NOT test migrations with production patient data on unencrypted systems
- ❌ Do NOT store credentials or connection strings in code/logs
- ❌ Do NOT transmit PHI via email or unencrypted channels
- ❌ Do NOT retain source data after verified cutover without documented reason
- ❌ Do NOT modify audit logs or hide transformation decisions

## Data Privacy & De-identification

### When Safe Harboring Data
If de-identification is required (e.g., for testing):
- Remove all 18 HIPAA identifiers listed above
- Do NOT use real patient names in test data
- Do NOT use sequential patient IDs (use random IDs)
- Do NOT retain any linkage between real and test IDs
- Document de-identification method

### Example De-identified Patient
```json
{
  "patient_id": "PT_8394729",  // Randomized, not real MRN
  "first_name": "John",         // Fictional
  "last_name": "Smith",         // Fictional
  "dob": "1970-01-15",           // Fictional (age preserved)
  "gender": "M"                  // Non-identifying
  // No phone, email, address, etc.
}
```

## Security Practices

### Development/Testing
- Use de-identified test data in development
- Test transformations in isolated environment (not connected to production)
- Never commit credentials, API keys, or connection strings
- Use environment variables for sensitive config

### Execution
- Run migrations in HIPAA-compliant environment (VPN, trusted network)
- Log all data access and transformations
- Verify data integrity post-migration (checksums, record counts)
- Retain audit logs for 6+ years

### Documentation
- Document why each data element is being migrated
- Document lossy transformations and business justification
- Document validation results and sign-offs
- Document any data quality issues found

## Data Retention Policy

### During Migration
- Keep source data encrypted and access-restricted
- Keep logs in secure location (not shared drive or email)
- Delete unverified intermediate copies

### Post-Migration
- Delete source data **30 days after cutover verification** (unless required by law)
- Retain transformation logs and audit trail for **6 years minimum**
- Retain validation reports for **2 years minimum**
- Document any data retained beyond cutover with business justification

## Incident Response

### Data Breach Protocol
If PHI is exposed or lost:
1. **Immediately** notify information security team
2. Evaluate scope: How much data? Which patients? Time exposure?
3. Follow HIPAA breach notification rules:
   - Notify affected individuals within **60 days**
   - Notify media if 500+ individuals affected
   - Notify HHS Department of Health & Human Services
4. Preserve all evidence (logs, copies, communications)
5. Document corrective actions

## Checklist for Each Migration

- [ ] BAA in place with target system provider?
- [ ] Data encrypted in transit (TLS 1.2+)?
- [ ] Intermediate data encrypted at rest (AES-256)?
- [ ] Only authorized personnel have access?
- [ ] Audit logs enabled and retained?
- [ ] De-identified test data used in development?
- [ ] All transformation decisions documented?
- [ ] Validation results reviewed and approved?
- [ ] Source data deletion plan documented?
- [ ] 6-year audit log retention policy confirmed?

---

**Last Updated**: 2026-04-07
**Reviewed By**: [Name/Role]
