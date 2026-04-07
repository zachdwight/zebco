/**
 * CSV/TSV Parser
 *
 * Parses CSV and tab-separated files to JSON
 */

const fs = require("fs");
const readline = require("readline");

async function parseCSV(filePath, options = {}) {
  const {
    delimiter = ",",
    encoding = "utf-8",
    skipHeader = false,
    headerLine = 1,
  } = options;

  return new Promise((resolve, reject) => {
    const data = [];
    let headers = null;
    let lineNumber = 0;

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding }),
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
      lineNumber++;

      // Skip empty lines
      if (!line.trim()) {
        return;
      }

      // Parse CSV line (handle quoted fields)
      const fields = parseCSVLine(line, delimiter);

      if (!headers) {
        headers = fields;
        if (skipHeader) return;
      } else {
        // Convert row to object
        const record = {};
        for (let i = 0; i < headers.length; i++) {
          record[headers[i]] = fields[i] || null;
        }
        data.push(record);
      }
    });

    rl.on("close", () => {
      if (data.length === 0 && headers) {
        // Only headers, no data
        resolve([]);
      } else {
        resolve(data);
      }
    });

    rl.on("error", reject);
  });
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line, delimiter = ",") {
  const fields = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Add final field
  fields.push(current.trim());

  return fields;
}

module.exports = { parseCSV };
