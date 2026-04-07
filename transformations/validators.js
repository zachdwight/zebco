/**
 * Validators - Data validation rules for healthcare transformations
 *
 * Validates transformed data against expectations and provides detailed feedback
 * for AI iterative improvement
 */

const config = require("./config");

/**
 * Main validation function
 */
async function validateTransformation(data, entityType, context) {
  const validator = new Validator(entityType, context);
  return validator.validate(data);
}

class Validator {
  constructor(entityType, context) {
    this.entityType = entityType;
    this.context = context;
    this.entityConfig = config.entities[entityType] || {};
    this.issues = [];
    this.warnings = [];
  }

  validate(data) {
    // Ensure data is an array
    if (!Array.isArray(data)) {
      if (typeof data === "object" && data !== null) {
        data = [data];
      } else {
        return {
          passed: false,
          issues: ["Input data is not an object or array"],
          recordsValidated: 0,
        };
      }
    }

    if (data.length === 0) {
      return {
        passed: false,
        issues: ["No data records to validate"],
        recordsValidated: 0,
      };
    }

    // Run validation rules based on entity type
    const validator = this.getValidatorForEntity(this.entityType);
    return validator(data, this.context);
  }

  getValidatorForEntity(entityType) {
    switch (entityType) {
      case "patient":
        return validatePatients.bind(this);
      case "encounter":
        return validateEncounters.bind(this);
      case "diagnosis":
        return validateDiagnoses.bind(this);
      case "billing":
        return validateBilling.bind(this);
      case "provider":
        return validateProviders.bind(this);
      default:
        return validateGeneric.bind(this);
    }
  }
}

// ============================================================================
// Entity-Specific Validators
// ============================================================================

function validatePatients(data, context) {
  const issues = [];
  let validCount = 0;

  for (let i = 0; i < data.length; i++) {
    const record = data[i];

    // Required fields
    if (!record.first_name || record.first_name.trim() === "") {
      issues.push(`Record ${i}: Missing or empty first_name`);
      continue;
    }

    if (!record.last_name || record.last_name.trim() === "") {
      issues.push(`Record ${i}: Missing or empty last_name`);
      continue;
    }

    if (!record.dob) {
      issues.push(`Record ${i}: Missing date of birth`);
      continue;
    }

    // Validate DOB format (YYYY-MM-DD)
    if (!isValidDate(record.dob)) {
      issues.push(`Record ${i}: Invalid DOB format (should be YYYY-MM-DD): ${record.dob}`);
      continue;
    }

    // DOB should be reasonable (not in future, not too old)
    const dob = new Date(record.dob);
    const now = new Date();
    const age = (now - dob) / (1000 * 60 * 60 * 24 * 365.25);

    if (age < 0) {
      issues.push(`Record ${i}: DOB is in the future`);
      continue;
    }

    if (age > 150) {
      issues.push(`Record ${i}: Patient age (${Math.round(age)}) seems too old`);
      continue;
    }

    // Validate gender if present
    if (record.gender && !["M", "F", "O", "U"].includes(record.gender)) {
      issues.push(`Record ${i}: Invalid gender code: ${record.gender}`);
      continue;
    }

    // Validate phone format if present
    if (record.phone && !isValidPhoneFormat(record.phone)) {
      issues.push(`Record ${i}: Invalid phone format: ${record.phone}`);
      continue;
    }

    // Validate email if present
    if (record.email && !isValidEmail(record.email)) {
      issues.push(`Record ${i}: Invalid email format: ${record.email}`);
      continue;
    }

    validCount++;
  }

  const passed =
    issues.length === 0 &&
    (validCount / data.length) >=
      (config.validation.validationPassThreshold || 0.995);

  return {
    passed,
    issues: issues.length > 0 ? issues.slice(0, 20) : [],
    recordsValidated: data.length,
    recordsValid: validCount,
    validationRate: (validCount / data.length).toFixed(4),
  };
}

function validateEncounters(data, context) {
  const issues = [];
  let validCount = 0;

  for (let i = 0; i < data.length; i++) {
    const record = data[i];

    // Required fields
    if (!record.patient_id) {
      issues.push(`Record ${i}: Missing patient_id`);
      continue;
    }

    if (!record.encounter_date) {
      issues.push(`Record ${i}: Missing encounter_date`);
      continue;
    }

    if (!isValidDate(record.encounter_date)) {
      issues.push(
        `Record ${i}: Invalid encounter_date format (should be YYYY-MM-DD): ${record.encounter_date}`
      );
      continue;
    }

    // Encounter date should be reasonable (not too far in future)
    const encounterDate = new Date(record.encounter_date);
    const now = new Date();
    if (encounterDate > now) {
      const daysInFuture = (encounterDate - now) / (1000 * 60 * 60 * 24);
      if (daysInFuture > 7) {
        issues.push(`Record ${i}: Encounter date is ${Math.round(daysInFuture)} days in future`);
        continue;
      }
    }

    // Validate encounter_time if present
    if (record.encounter_time && !isValidTimeFormat(record.encounter_time)) {
      issues.push(`Record ${i}: Invalid encounter_time format: ${record.encounter_time}`);
      continue;
    }

    // Validate status
    const validStatuses = ["Completed", "Scheduled", "Cancelled"];
    if (record.status && !validStatuses.includes(record.status)) {
      issues.push(`Record ${i}: Invalid status: ${record.status}`);
      continue;
    }

    validCount++;
  }

  const passed =
    issues.length === 0 &&
    (validCount / data.length) >=
      (config.validation.validationPassThreshold || 0.995);

  return {
    passed,
    issues: issues.length > 0 ? issues.slice(0, 20) : [],
    recordsValidated: data.length,
    recordsValid: validCount,
  };
}

function validateDiagnoses(data, context) {
  const issues = [];
  let validCount = 0;

  for (let i = 0; i < data.length; i++) {
    const record = data[i];

    // Required fields
    if (!record.icd_code) {
      issues.push(`Record ${i}: Missing ICD code`);
      continue;
    }

    // Validate ICD-10 format (basic check)
    if (!isValidICDCode(record.icd_code)) {
      issues.push(`Record ${i}: Invalid ICD code format: ${record.icd_code}`);
      continue;
    }

    if (!record.diagnosis_date) {
      issues.push(`Record ${i}: Missing diagnosis_date`);
      continue;
    }

    if (!isValidDate(record.diagnosis_date)) {
      issues.push(`Record ${i}: Invalid diagnosis_date format: ${record.diagnosis_date}`);
      continue;
    }

    // Validate status if present
    const validStatuses = ["Active", "Resolved", "Ruled Out"];
    if (record.status && !validStatuses.includes(record.status)) {
      issues.push(`Record ${i}: Invalid status: ${record.status}`);
      continue;
    }

    validCount++;
  }

  const passed =
    issues.length === 0 &&
    (validCount / data.length) >=
      (config.validation.validationPassThreshold || 0.995);

  return {
    passed,
    issues: issues.length > 0 ? issues.slice(0, 20) : [],
    recordsValidated: data.length,
    recordsValid: validCount,
  };
}

function validateBilling(data, context) {
  const issues = [];
  let validCount = 0;

  for (let i = 0; i < data.length; i++) {
    const record = data[i];

    // Required fields
    if (!record.cpt_code) {
      issues.push(`Record ${i}: Missing CPT code`);
      continue;
    }

    // Validate CPT code (5 digits)
    if (!/^\d{5}$/.test(record.cpt_code)) {
      issues.push(`Record ${i}: Invalid CPT code format: ${record.cpt_code}`);
      continue;
    }

    if (!record.patient_id) {
      issues.push(`Record ${i}: Missing patient_id`);
      continue;
    }

    // Validate amount
    if (record.total_charge === undefined || record.total_charge === null) {
      issues.push(`Record ${i}: Missing total_charge`);
      continue;
    }

    const charge = parseFloat(record.total_charge);
    if (isNaN(charge)) {
      issues.push(`Record ${i}: Invalid charge amount: ${record.total_charge}`);
      continue;
    }

    // Charge should not be negative (except for adjustments)
    if (charge < 0 && record.status !== "Adjusted") {
      issues.push(`Record ${i}: Negative charge without adjustment status`);
      continue;
    }

    validCount++;
  }

  const passed =
    issues.length === 0 &&
    (validCount / data.length) >=
      (config.validation.validationPassThreshold || 0.995);

  return {
    passed,
    issues: issues.length > 0 ? issues.slice(0, 20) : [],
    recordsValidated: data.length,
    recordsValid: validCount,
  };
}

function validateProviders(data, context) {
  const issues = [];
  let validCount = 0;

  for (let i = 0; i < data.length; i++) {
    const record = data[i];

    // Required fields
    if (!record.first_name || record.first_name.trim() === "") {
      issues.push(`Record ${i}: Missing first_name`);
      continue;
    }

    if (!record.last_name || record.last_name.trim() === "") {
      issues.push(`Record ${i}: Missing last_name`);
      continue;
    }

    // Validate NPI if present (10 digits)
    if (record.npi && !/^\d{10}$/.test(record.npi)) {
      issues.push(`Record ${i}: Invalid NPI format (should be 10 digits): ${record.npi}`);
      continue;
    }

    validCount++;
  }

  const passed =
    issues.length === 0 &&
    (validCount / data.length) >=
      (config.validation.validationPassThreshold || 0.995);

  return {
    passed,
    issues: issues.length > 0 ? issues.slice(0, 20) : [],
    recordsValidated: data.length,
    recordsValid: validCount,
  };
}

function validateGeneric(data, context) {
  // Basic validation for unknown entity types
  const issues = [];

  if (!Array.isArray(data) || data.length === 0) {
    issues.push("No data to validate");
  }

  // Check for missing fields
  if (data.length > 0) {
    const keys = Object.keys(data[0]);
    if (keys.length === 0) {
      issues.push("No fields in data records");
    }
  }

  return {
    passed: issues.length === 0,
    issues,
    recordsValidated: data.length,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function isValidDate(dateString) {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso8601Regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function isValidTimeFormat(timeString) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(timeString);
}

function isValidPhoneFormat(phone) {
  // Accept various US phone formats
  return /^(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})$/.test(
    phone.replace(/\D/g, "")
  );
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidICDCode(code) {
  // ICD-10: A00-Z99.ZZ format (alphanumeric, periods allowed)
  return /^[A-Z]\d{2}(\.[A-Z\d]{1,2})?$/.test(code);
}

module.exports = {
  validateTransformation,
  Validator,
};
