/**
 * Excel Parser (.xlsx, .xls)
 *
 * Parses Excel files to JSON
 * Requires: npm install xlsx
 */

async function parseExcel(filePath) {
  try {
    const XLSX = require("xlsx");
    const workbook = XLSX.readFile(filePath);

    // Read first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      blankrows: false,
    });

    return data;
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      throw new Error(
        "xlsx module not found. Install with: npm install xlsx"
      );
    }
    throw error;
  }
}

module.exports = { parseExcel };
