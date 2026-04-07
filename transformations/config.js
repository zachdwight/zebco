/**
 * Configuration for Healthcare ELT Orchestrator
 *
 * Defines LLM settings, API endpoints, and default options
 */

module.exports = {
  // LLM Configuration
  llm: {
    claude: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      modelId: process.env.CLAUDE_MODEL || "claude-opus-4-6",
      baseUrl: "https://api.anthropic.com/v1",
      maxTokens: 4096,
      temperature: 0.3, // Lower temperature for consistent code generation
    },

    gemini: {
      apiKey: process.env.GOOGLE_API_KEY,
      modelId: process.env.GEMINI_MODEL || "gemini-pro",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      maxOutputTokens: 4096,
      temperature: 0.3,
    },

    local: {
      baseUrl: process.env.LOCAL_LLM_URL || "http://localhost:11434",
      modelId: process.env.LOCAL_MODEL || "mistral",
      timeout: 300000, // 5 minutes
    },
  },

  // Orchestrator defaults
  orchestrator: {
    maxIterations: 8,
    timeoutPerIteration: 120000, // 2 minutes per iteration
    validateAfterEachIteration: true,
    saveIntermediateResults: true,
  },

  // Data validation thresholds
  validation: {
    requiredFieldThreshold: 1.0, // 100% of required fields must be present
    validationPassThreshold: 0.995, // 99.5% of records must pass validation
    maxWarnings: 10, // Stop after this many warnings
    maxErrors: 5, // Stop after this many errors
  },

  // File handling
  files: {
    bronze: {
      maxSizeMB: 100,
      supportedFormats: [".csv", ".tsv", ".xlsx", ".xls", ".xml", ".json"],
    },
    output: {
      prettyPrint: true,
      indentation: 2,
    },
  },

  // Logging
  logging: {
    verbose: true,
    logDir: "./transformations/logs",
    logLevel: "info", // debug, info, warn, error
    preserveLogs: true, // Keep logs after completion
  },

  // Entity type configuration
  entities: {
    patient: {
      batchSize: 100,
      priority: 1,
      requiredFields: ["first_name", "last_name", "dob"],
    },
    encounter: {
      batchSize: 50,
      priority: 2,
      requiredFields: ["encounter_date", "patient_id"],
    },
    diagnosis: {
      batchSize: 100,
      priority: 3,
      requiredFields: ["icd_code"],
    },
    billing: {
      batchSize: 50,
      priority: 4,
      requiredFields: ["cpt_code", "patient_id"],
    },
    provider: {
      batchSize: 10,
      priority: 5,
      requiredFields: ["first_name", "last_name"],
    },
  },

  // Default prompts (can be customized)
  prompts: {
    systemRole: `You are an expert healthcare data transformation specialist with deep knowledge of:
- Electronic Health Records (EHR) systems and data models
- Healthcare data standards (HL7, FHIR, ICD, CPT)
- Data quality and validation principles
- JavaScript and data transformation patterns
- HIPAA compliance and patient privacy

Your task is to generate JavaScript code that reliably transforms healthcare data according to specifications.`,

    codeGenerationInstructions: `Generate a JavaScript function called "transform(data)" that:
1. Takes input data (array or single object) as parameter
2. Returns transformed data in the exact format specified
3. Handles edge cases (null values, type conversions, formatting)
4. Ensures all required fields are populated
5. Applies all field mappings and transformations
6. Includes basic error handling for invalid inputs

CRITICAL REQUIREMENTS:
- Return ONLY executable JavaScript code (no markdown, explanations, or backticks)
- The function must be immediately executable via "new Function(code)()(data)"
- Handle both single objects and arrays of objects
- Use standard JavaScript syntax (ES6 is OK)
- Include comments for complex transformations`,
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },

  // Advanced settings
  advanced: {
    cacheGeneratedCode: true,
    cacheDir: "./transformations/.cache",
    validateCodeBeforeExecution: true,
    sandboxExecution: false, // Set to true for additional security (requires vm2)
    trackExecutionMetrics: true,
  },
};
