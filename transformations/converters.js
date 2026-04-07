/**
 * Format Converters - Convert various input formats to standardized JSON
 *
 * Supports: CSV, Excel (.xlsx, .xls), XML, JSON, TSV
 */

const fs = require("fs");
const path = require("path");
const { parseCSV } = require("./parsers/csv-parser");
const { parseExcel } = require("./parsers/excel-parser");
const { parseXML } = require("./parsers/xml-parser");

/**
 * Convert any supported format to JSON
 */
async function convertToJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".csv":
      return await parseCSV(filePath);

    case ".tsv":
      return await parseCSV(filePath, { delimiter: "\t" });

    case ".xlsx":
    case ".xls":
      return await parseExcel(filePath);

    case ".xml":
      return await parseXML(filePath);

    case ".json":
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));

    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}

/**
 * Normalize data structure to ensure consistent format
 */
function normalizeData(data) {
  // Convert single object to array
  if (!Array.isArray(data)) {
    data = [data];
  }

  // Ensure all records have consistent structure
  const normalized = data.map((record) => {
    if (typeof record !== "object" || record === null) {
      return {};
    }

    // Convert empty strings to null
    const cleaned = {};
    for (const [key, value] of Object.entries(record)) {
      // Normalize key names: trim, lowercase, replace spaces
      const normalizedKey = key
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^\w_]/g, "");

      // Convert empty strings to null
      cleaned[normalizedKey] = value === "" || value === null ? null : value;
    }

    return cleaned;
  });

  return normalized;
}

/**
 * Detect data structure and suggest entity type
 */
function detectEntityType(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { type: "unknown", confidence: 0 };
  }

  const keys = Object.keys(data[0]).map((k) => k.toLowerCase());
  const keyString = JSON.stringify(keys);

  // Check for common patterns
  if (
    keys.some((k) => ["mrn", "patient_id", "patient_name"].includes(k)) ||
    keyString.includes("patient")
  ) {
    return { type: "patient", confidence: 0.9 };
  }

  if (
    keys.some((k) =>
      ["encounter_id", "encounter_date", "visit_date", "appointment"].includes(k)
    )
  ) {
    return { type: "encounter", confidence: 0.9 };
  }

  if (keys.some((k) => ["icd_code", "diagnosis_code", "diagnosis"].includes(k))) {
    return { type: "diagnosis", confidence: 0.9 };
  }

  if (
    keys.some((k) => ["cpt_code", "billing_code", "charge_amount", "line_item"].includes(k))
  ) {
    return { type: "billing", confidence: 0.9 };
  }

  if (keys.some((k) => ["provider_id", "provider_name", "npi"].includes(k))) {
    return { type: "provider", confidence: 0.9 };
  }

  return { type: "unknown", confidence: 0 };
}

/**
 * Generate data quality report
 */
function analyzeQuality(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { recordCount: 0, issues: [] };
  }

  const report = {
    recordCount: data.length,
    fieldCount: Object.keys(data[0]).length,
    issues: [],
    fieldAnalysis: {},
  };

  const sample = data.slice(0, 100); // Analyze first 100 records

  // Analyze each field
  for (const [key] of Object.entries(sample[0])) {
    const values = sample.map((r) => r[key]);
    const nullCount = values.filter((v) => v === null || v === undefined).length;
    const uniqueValues = new Set(values).size;
    const nullPercentage = (nullCount / values.length) * 100;

    report.fieldAnalysis[key] = {
      nullCount,
      nullPercentage: Math.round(nullPercentage),
      uniqueValues,
      sampleValues: uniqueValues <= 5 ? [...new Set(values)].slice(0, 3) : null,
    };

    // Flag potential issues
    if (nullPercentage > 50) {
      report.issues.push(`Field '${key}' is null in ${Math.round(nullPercentage)}% of records`);
    }

    if (uniqueValues === sample.length) {
      report.issues.push(`Field '${key}' appears to be unique for each record (possible ID/key)`);
    }
  }

  return report;
}

module.exports = {
  convertToJSON,
  normalizeData,
  detectEntityType,
  analyzeQuality,
};
