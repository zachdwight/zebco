/**
 * XML Parser
 *
 * Parses XML files to JSON
 * Requires: npm install xml2js
 */

const fs = require("fs");

async function parseXML(filePath) {
  try {
    const parseString = require("xml2js").parseString;

    return new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf-8", (err, data) => {
        if (err) return reject(err);

        parseString(data, { explicitArray: false }, (err, result) => {
          if (err) return reject(err);

          // Convert XML structure to array of records
          // Assumes XML has a root element with repeating child elements
          const records = convertXMLtoArray(result);
          resolve(records);
        });
      });
    });
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      throw new Error("xml2js module not found. Install with: npm install xml2js");
    }
    throw error;
  }
}

/**
 * Convert XML parsed object to array of records
 * Handles various XML structures
 */
function convertXMLtoArray(obj) {
  // Find the root element (usually only one key at top level)
  const keys = Object.keys(obj);

  if (keys.length === 0) {
    return [];
  }

  const rootKey = keys[0];
  let data = obj[rootKey];

  // If data is not an array, make it one
  if (!Array.isArray(data)) {
    // Might be a single record or an object with array children
    if (typeof data === "object" && data !== null) {
      // Look for array properties
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          data = value;
          break;
        }
      }

      // If still not an array, wrap it
      if (!Array.isArray(data)) {
        data = [data];
      }
    } else {
      data = [data];
    }
  }

  // Flatten each record (convert nested objects to flat key-value pairs)
  return data.map((record) => flattenObject(record));
}

/**
 * Flatten nested object into single-level key-value pairs
 */
function flattenObject(obj, prefix = "") {
  const flattened = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      // Convert array to comma-separated string
      flattened[newKey] = value.join(", ");
    } else {
      flattened[newKey] = value || null;
    }
  }

  return flattened;
}

module.exports = { parseXML };
