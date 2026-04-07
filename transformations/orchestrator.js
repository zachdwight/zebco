#!/usr/bin/env node

/**
 * Healthcare ELT Orchestrator
 *
 * Reads raw files from bronze/ directory, calls AI to generate transformation code,
 * executes the code, validates outputs, and iterates on failures (up to max iterations).
 *
 * Usage:
 *   node orchestrator.js --bronze-file=inputs/patients.csv --entity=patient
 *   node orchestrator.js --bronze-dir=bronze/ --entity=all
 *   node orchestrator.js --bronze-file=bronze/encounters.xlsx --entity=encounter --max-iterations=8
 */

const fs = require("fs");
const path = require("path");
const { LLMClient } = require("./llm-client");
const { convertToJSON } = require("./converters");
const { validateTransformation } = require("./validators");
const config = require("./config");

class Orchestrator {
  constructor(options = {}) {
    this.options = {
      maxIterations: options.maxIterations || 8,
      model: options.model || "claude", // claude, gemini, local
      bronzeDir: options.bronzeDir || "./bronze",
      outputDir: options.outputDir || "./outputs",
      logDir: options.logDir || "./transformations/logs",
      verbose: options.verbose !== false,
      ...options,
    };

    this.llmClient = new LLMClient({
      model: this.options.model,
      config: config.llm[this.options.model],
    });

    this.log("Orchestrator initialized", {
      model: this.options.model,
      maxIterations: this.options.maxIterations,
      bronzeDir: this.options.bronzeDir,
    });
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data && this.options.verbose) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Transform a single file from bronze
   */
  async transformFile(filePath, entityType) {
    const startTime = Date.now();
    const fileName = path.basename(filePath);

    this.log(`\n${"=".repeat(80)}`);
    this.log(`Processing: ${fileName} (${entityType})`);
    this.log(`${"=".repeat(80)}`);

    try {
      // Step 1: Read and convert to JSON
      this.log(`[1/5] Converting to JSON format...`);
      const jsonData = await this.convertBronzeFile(filePath);
      this.log(`Converted ${Array.isArray(jsonData) ? jsonData.length : 1} record(s)`);

      // Step 2: Load context (expectations, field mappings, schema)
      this.log(`[2/5] Loading transformation context...`);
      const context = await this.loadContext(entityType);

      // Step 3: Iterative transformation with AI
      this.log(`[3/5] Generating and executing transformation code...`);
      let transformedData = await this.iterativeTransform(jsonData, entityType, context);

      // Step 4: Validate output
      this.log(`[4/5] Validating transformed data...`);
      const validationResult = await validateTransformation(
        transformedData,
        entityType,
        context
      );

      if (!validationResult.passed) {
        this.log(`⚠️  Validation issues found:`, validationResult.issues);
      }

      // Step 5: Write output
      this.log(`[5/5] Writing output files...`);
      const outputPath = await this.writeOutput(
        transformedData,
        entityType,
        fileName,
        validationResult,
        jsonData
      );

      const duration = Date.now() - startTime;
      this.log(`\n✅ SUCCESS: ${fileName} transformed in ${duration}ms`, {
        recordsProcessed: Array.isArray(transformedData) ? transformedData.length : 1,
        validationPassed: validationResult.passed,
        outputPath,
      });

      return {
        success: true,
        fileName,
        entityType,
        recordsProcessed: Array.isArray(transformedData) ? transformedData.length : 1,
        validationPassed: validationResult.passed,
        outputPath,
        duration,
      };
    } catch (error) {
      this.log(`❌ ERROR: ${fileName}`, error.message);
      return {
        success: false,
        fileName,
        entityType,
        error: error.message,
      };
    }
  }

  /**
   * Convert bronze file (CSV, Excel, XML, JSON) to standardized JSON
   */
  async convertBronzeFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    this.log(`Detected format: ${ext}`);

    try {
      const data = await convertToJSON(filePath);
      return data;
    } catch (error) {
      throw new Error(`Failed to convert ${ext} file: ${error.message}`);
    }
  }

  /**
   * Load transformation context (expectations, mappings, schema)
   */
  async loadContext(entityType) {
    const context = {
      entityType,
      expectations: null,
      fieldMappings: null,
      schema: null,
      examples: null,
    };

    // Load expectations
    const expectationsPath = path.join(__dirname, "../expectations.md");
    if (fs.existsSync(expectationsPath)) {
      context.expectations = fs.readFileSync(expectationsPath, "utf-8");
    }

    // Load field mappings (look for any *to* mapping docs)
    const fieldMappingsDir = path.join(__dirname, "../field_mappings");
    if (fs.existsSync(fieldMappingsDir)) {
      const files = fs.readdirSync(fieldMappingsDir);
      const mappingFile = files.find((f) => f.includes("to") && f.endsWith(".md"));
      if (mappingFile) {
        context.fieldMappings = fs.readFileSync(
          path.join(fieldMappingsDir, mappingFile),
          "utf-8"
        );
      }
    }

    // Load data schema
    const schemaPath = path.join(__dirname, "../data_schema.md");
    if (fs.existsSync(schemaPath)) {
      context.schema = fs.readFileSync(schemaPath, "utf-8");
    }

    // Load example outputs for this entity type
    const exampleDir = path.join(__dirname, `../outputs/${entityType}/example_1`);
    if (fs.existsSync(exampleDir)) {
      const outputFile = path.join(exampleDir, "output.json");
      const notesFile = path.join(exampleDir, "notes.md");
      if (fs.existsSync(outputFile)) {
        context.examples = {
          output: require(outputFile),
          notes: fs.existsSync(notesFile) ? fs.readFileSync(notesFile, "utf-8") : null,
        };
      }
    }

    this.log(`Loaded context for entity type: ${entityType}`);
    return context;
  }

  /**
   * Iteratively transform data with AI, retrying on validation failure
   */
  async iterativeTransform(inputData, entityType, context) {
    let iteration = 0;
    let transformationCode = null;
    let transformedData = null;
    let lastError = null;

    while (iteration < this.options.maxIterations) {
      iteration++;
      this.log(`\n--- Iteration ${iteration}/${this.options.maxIterations} ---`);

      try {
        // Call LLM to generate transformation code
        this.log(`Calling ${this.options.model} to generate transformation code...`);
        transformationCode = await this.generateTransformationCode(
          inputData,
          entityType,
          context,
          iteration,
          lastError
        );

        this.log(`Generated ${transformationCode.length} bytes of code`);

        // Execute the generated code
        this.log(`Executing transformation code...`);
        transformedData = await this.executeTransformation(
          transformationCode,
          inputData
        );

        // Validate the result
        this.log(`Validating output...`);
        const validationResult = await validateTransformation(
          transformedData,
          entityType,
          context
        );

        if (validationResult.passed) {
          this.log(`✅ Validation PASSED on iteration ${iteration}`);
          return transformedData;
        }

        // Validation failed, prepare for retry
        lastError = {
          iteration,
          issues: validationResult.issues,
          failureCount: (validationResult.issues || []).length,
        };

        this.log(
          `⚠️  Validation failed: ${lastError.failureCount} issue(s). Will retry...`,
          lastError.issues
        );

        if (iteration < this.options.maxIterations) {
          this.log(`Retrying (iteration ${iteration + 1}/${this.options.maxIterations})`);
        }
      } catch (error) {
        lastError = {
          iteration,
          error: error.message,
          code: transformationCode ? "generated" : "generation-failed",
        };

        this.log(`❌ Error on iteration ${iteration}: ${error.message}`);

        if (iteration >= this.options.maxIterations) {
          throw new Error(
            `Failed after ${this.options.maxIterations} iterations: ${error.message}`
          );
        }
      }
    }

    throw new Error(
      `Transformation did not converge after ${this.options.maxIterations} iterations`
    );
  }

  /**
   * Call LLM to generate transformation code
   */
  async generateTransformationCode(inputData, entityType, context, iteration, lastError) {
    const sampleData = Array.isArray(inputData)
      ? inputData.slice(0, 2)
      : inputData;

    let prompt = `You are a healthcare data transformation expert. Generate JavaScript code to transform data according to the expectations and field mappings.

ENTITY TYPE: ${entityType}

INPUT DATA SAMPLE (${Array.isArray(inputData) ? inputType.length + " records" : "single record"}):
${JSON.stringify(sampleData, null, 2)}

EXPECTATIONS & RULES:
${context.expectations}

FIELD MAPPINGS:
${context.fieldMappings}

SCHEMA:
${context.schema}

EXAMPLE OUTPUT:
${JSON.stringify(context.examples?.output, null, 2)}
${context.examples?.notes ? `\nEXAMPLE NOTES:\n${context.examples.notes}` : ""}

Your task:
1. Write a JavaScript function called \`transform(data)\` that transforms the input
2. Return transformed data in the exact format specified in the schema
3. Handle edge cases (null values, type conversions, formatting)
4. Ensure all required fields are populated
5. Apply all field mappings and transformations from the documentation

IMPORTANT:
- Return ONLY the JavaScript function code (no explanations, no markdown, no triple backticks)
- The function must be executable JavaScript
- Use standard JavaScript syntax
- Handle both single objects and arrays
- Include error handling for invalid data`;

    if (iteration > 1 && lastError) {
      prompt += `\n\nPREVIOUS ITERATION FAILED (Iteration ${lastError.iteration}):
${lastError.issues ? `Issues:\n${JSON.stringify(lastError.issues, null, 2)}` : lastError.error}

FIXES NEEDED:
- Review the validation errors above
- Adjust your transformation code to fix these specific issues
- Pay special attention to the failing fields`;
    }

    const code = await this.llmClient.generateCode(prompt);
    return code;
  }

  /**
   * Execute transformation code safely
   */
  async executeTransformation(code, inputData) {
    try {
      // Create a function from the code
      const transformFunction = new Function(code);

      // Call the function with the input data
      const result = transformFunction()(inputData);

      return result;
    } catch (error) {
      throw new Error(
        `Code execution failed: ${error.message}\nCode:\n${code.substring(0, 200)}...`
      );
    }
  }

  /**
   * Write output files and documentation
   */
  async writeOutput(transformedData, entityType, bronzeFileName, validationResult, originalData) {
    const timestamp = new Date().toISOString().slice(0, 10);
    const outputSubDir = path.join(
      this.options.outputDir,
      entityType,
      `converted_${timestamp}`
    );

    // Ensure directory exists
    if (!fs.existsSync(outputSubDir)) {
      fs.mkdirSync(outputSubDir, { recursive: true });
    }

    // Write transformed data
    const outputJsonPath = path.join(outputSubDir, "output.json");
    fs.writeFileSync(outputJsonPath, JSON.stringify(transformedData, null, 2));

    // Write validation report
    const validationReportPath = path.join(outputSubDir, "validation_report.json");
    fs.writeFileSync(
      validationReportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          entityType,
          sourceFile: bronzeFileName,
          recordsProcessed: Array.isArray(transformedData) ? transformedData.length : 1,
          validationPassed: validationResult.passed,
          issues: validationResult.issues || [],
        },
        null,
        2
      )
    );

    // Write notes/documentation
    const notesPath = path.join(outputSubDir, "notes.md");
    const notes = `# Transformation Report

**Generated**: ${new Date().toISOString()}
**Source File**: ${bronzeFileName}
**Entity Type**: ${entityType}
**Records Processed**: ${Array.isArray(transformedData) ? transformedData.length : 1}

## Validation Status
${validationResult.passed ? "✅ **PASSED**" : "❌ **FAILED**"}

${
  validationResult.issues && validationResult.issues.length > 0
    ? `### Issues Found (${validationResult.issues.length}):\n${validationResult.issues
        .map((i) => `- ${i}`)
        .join("\n")}`
    : ""
}

## Output
- **JSON**: \`output.json\`
- **Validation Report**: \`validation_report.json\`

## Next Steps
${validationResult.passed ? "Ready for import into target system." : "Fix validation issues and re-run transformation."}
`;

    fs.writeFileSync(notesPath, notes);

    return outputJsonPath;
  }

  /**
   * Generate provenance report for transformation
   */
  async generateProvenance(inputData, outputData, entityType, validationResult, outputPath) {
    try {
      const { ProvenanceGenerator } = require("./provenance-generator");

      this.log(`Generating provenance report for ${entityType}...`);

      const generator = new ProvenanceGenerator({
        model: this.options.model,
      });

      const provenance = await generator.generateProvenance({
        inputData,
        outputData,
        sourceFile: "migration",
        entityType,
        validationResult,
        model: this.options.model,
        iterationsUsed: 1,
        timeMs: 0,
      });

      await generator.writeProvenanceFiles(provenance, outputPath);

      this.log(`✅ Provenance report generated`);

      return provenance;
    } catch (error) {
      this.log(`⚠️  Provenance generation failed: ${error.message}`, "warn");
      return null;
    }
  }

  /**
   * Discover and process all bronze files in a directory
   */
  async processBronzeDirectory(entityType = "all") {
    if (!fs.existsSync(this.options.bronzeDir)) {
      this.log(`Bronze directory not found: ${this.options.bronzeDir}`);
      return [];
    }

    const results = [];
    const files = fs.readdirSync(this.options.bronzeDir);

    for (const file of files) {
      const filePath = path.join(this.options.bronzeDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        // Determine entity type from file name if not specified
        const detectedType = this.detectEntityType(file);

        if (entityType === "all" || entityType === detectedType) {
          const result = await this.transformFile(filePath, detectedType);
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Detect entity type from file name
   */
  detectEntityType(fileName) {
    const lower = fileName.toLowerCase();
    if (lower.includes("patient")) return "patient";
    if (lower.includes("encounter") || lower.includes("visit")) return "encounter";
    if (lower.includes("diagnosis") || lower.includes("diagnos")) return "diagnosis";
    if (lower.includes("billing") || lower.includes("charge")) return "billing";
    if (lower.includes("provider") || lower.includes("staff")) return "provider";
    if (lower.includes("medication") || lower.includes("med")) return "medication";
    if (lower.includes("lab")) return "lab";
    return "unknown";
  }
}

/**
 * CLI Entry Point
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  let bronzeFile = null;
  let bronzeDir = null;
  let entityType = "all";

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith("--bronze-file=")) {
      bronzeFile = arg.split("=")[1];
    } else if (arg.startsWith("--bronze-dir=")) {
      bronzeDir = arg.split("=")[1];
    } else if (arg.startsWith("--entity=")) {
      entityType = arg.split("=")[1];
    } else if (arg.startsWith("--max-iterations=")) {
      options.maxIterations = parseInt(arg.split("=")[1]);
    } else if (arg.startsWith("--model=")) {
      options.model = arg.split("=")[1];
    }
  }

  const orchestrator = new Orchestrator(options);

  try {
    let results;

    if (bronzeFile) {
      const result = await orchestrator.transformFile(bronzeFile, entityType);
      results = [result];
    } else if (bronzeDir) {
      options.bronzeDir = bronzeDir;
      results = await orchestrator.processBronzeDirectory(entityType);
    } else {
      results = await orchestrator.processBronzeDirectory(entityType);
    }

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    const successful = results.filter((r) => r.success).length;
    console.log(
      `✅ Successful: ${successful}/${results.length} (${Math.round((successful / results.length) * 100)}%)`
    );

    for (const result of results) {
      if (result.success) {
        console.log(`  ✓ ${result.fileName} → ${result.recordsProcessed} records`);
      } else {
        console.log(`  ✗ ${result.fileName}: ${result.error}`);
      }
    }

    process.exit(successful === results.length ? 0 : 1);
  } catch (error) {
    console.error("Fatal error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { Orchestrator };
