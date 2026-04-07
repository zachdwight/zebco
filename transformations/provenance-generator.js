/**
 * Data Provenance Generator
 *
 * Analyzes healthcare data transformations and generates comprehensive
 * provenance reports with AI-driven assessment of data quality, lineage, and impact.
 */

const fs = require("fs");
const path = require("path");
const { LLMClient } = require("./llm-client");

class ProvenanceGenerator {
  constructor(options = {}) {
    this.llmClient = new LLMClient({
      model: options.model || "claude",
    });
  }

  /**
   * Analyze transformation and generate provenance report
   */
  async generateProvenance(transformationData) {
    const {
      inputData,
      outputData,
      sourceFile,
      entityType,
      validationResult,
      model,
      iterationsUsed,
      timeMs,
    } = transformationData;

    // Analyze data quality
    const dataQualityAnalysis = this.analyzeDataQuality(inputData, outputData);

    // Generate AI-driven assessment
    const aiAssessment = await this.generateAIAssessment(
      inputData,
      outputData,
      dataQualityAnalysis,
      validationResult,
      entityType
    );

    // Build comprehensive provenance document
    const provenance = {
      timestamp: new Date().toISOString(),
      transformation: {
        sourceFile,
        entityType,
        recordsProcessed: Array.isArray(outputData) ? outputData.length : 1,
        model,
        iterationsUsed,
        timeMs,
        validationPassed: validationResult.passed,
      },
      dataQuality: dataQualityAnalysis,
      aiAssessment,
    };

    return provenance;
  }

  /**
   * Analyze data quality before/after transformation
   */
  analyzeDataQuality(inputData, outputData) {
    const inputAnalysis = this.analyzeDataset(inputData, "input");
    const outputAnalysis = this.analyzeDataset(outputData, "output");

    return {
      before: inputAnalysis,
      after: outputAnalysis,
      qualityDelta: this.calculateQualityDelta(inputAnalysis, outputAnalysis),
    };
  }

  /**
   * Analyze a dataset for quality metrics
   */
  analyzeDataset(data, type) {
    const normalized = Array.isArray(data) ? data : [data];
    const analysis = {
      recordCount: normalized.length,
      fieldCount: normalized.length > 0 ? Object.keys(normalized[0]).length : 0,
      nullRates: {},
      uniqueValueCounts: {},
      fieldTypes: {},
      issues: [],
    };

    if (normalized.length === 0) {
      return analysis;
    }

    // Analyze first 100 records (sample)
    const sample = normalized.slice(0, 100);

    for (const [field] of Object.entries(sample[0])) {
      const values = sample.map((r) => r[field]);
      const nonNullValues = values.filter(
        (v) => v !== null && v !== undefined && v !== ""
      );
      const nullCount = values.length - nonNullValues.length;

      // Calculate null rate
      analysis.nullRates[field] = (nullCount / values.length).toFixed(4);

      // Count unique values
      const uniqueValues = new Set(nonNullValues).size;
      analysis.uniqueValueCounts[field] = uniqueValues;

      // Detect field type
      analysis.fieldTypes[field] = this.detectFieldType(nonNullValues);

      // Flag issues
      const nullRate = parseFloat(analysis.nullRates[field]);
      if (nullRate > 0.5) {
        analysis.issues.push(
          `Field '${field}' is null in ${Math.round(nullRate * 100)}% of records`
        );
      }

      if (uniqueValues === sample.length) {
        analysis.issues.push(
          `Field '${field}' appears to have unique values for each record`
        );
      }
    }

    return analysis;
  }

  /**
   * Detect data type of field
   */
  detectFieldType(values) {
    if (values.length === 0) return "empty";

    const sample = values.slice(0, 10);

    // Check for date format
    if (sample.every((v) => /^\d{4}-\d{2}-\d{2}/.test(String(v)))) {
      return "date";
    }

    // Check for number
    if (sample.every((v) => !isNaN(v) && v !== "")) {
      return "number";
    }

    // Check for boolean
    if (sample.every((v) => ["true", "false", "T", "F", "Y", "N"].includes(String(v)))) {
      return "boolean";
    }

    // Check for email
    if (sample.every((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))) {
      return "email";
    }

    // Check for phone
    if (sample.every((v) => /^\d{10}$|^\(\d{3}\)\s\d{3}-\d{4}$/.test(String(v)))) {
      return "phone";
    }

    return "string";
  }

  /**
   * Calculate quality improvements/regressions
   */
  calculateQualityDelta(before, after) {
    const delta = {
      improvementAreas: [],
      riskAreas: [],
      completenessImprovement: 0,
      nullRateImprovement: {},
    };

    // Compare null rates field by field
    for (const field of Object.keys(before.nullRates)) {
      if (after.nullRates[field] !== undefined) {
        const beforeNull = parseFloat(before.nullRates[field]);
        const afterNull = parseFloat(after.nullRates[field]);
        const improvement = beforeNull - afterNull;

        if (improvement > 0.01) {
          delta.improvementAreas.push(
            `${field}: Reduced nulls from ${(beforeNull * 100).toFixed(1)}% to ${(afterNull * 100).toFixed(1)}%`
          );
        } else if (improvement < -0.01) {
          delta.riskAreas.push(
            `${field}: Increased nulls from ${(beforeNull * 100).toFixed(1)}% to ${(afterNull * 100).toFixed(1)}%`
          );
        }

        delta.nullRateImprovement[field] = improvement.toFixed(4);
      }
    }

    // Overall completeness
    const beforeCompleteness =
      Object.values(before.nullRates).reduce((sum, v) => sum + (1 - parseFloat(v)), 0) /
      Object.keys(before.nullRates).length;
    const afterCompleteness =
      Object.values(after.nullRates).reduce((sum, v) => sum + (1 - parseFloat(v)), 0) /
      Object.keys(after.nullRates).length;

    delta.completenessImprovement = (afterCompleteness - beforeCompleteness).toFixed(4);

    return delta;
  }

  /**
   * Call AI to generate assessment
   */
  async generateAIAssessment(inputData, outputData, dataQualityAnalysis, validationResult, entityType) {
    const inputSample = Array.isArray(inputData)
      ? inputData.slice(0, 2)
      : [inputData];
    const outputSample = Array.isArray(outputData)
      ? outputData.slice(0, 2)
      : [outputData];

    const prompt = `You are a healthcare data quality expert. Analyze this data transformation and provide assessment.

TRANSFORMATION SUMMARY:
- Entity Type: ${entityType}
- Records Processed: ${Array.isArray(outputData) ? outputData.length : 1}
- Validation: ${validationResult.passed ? "PASSED" : "FAILED"}
${!validationResult.passed ? `- Issues: ${validationResult.issues?.join(", ")}` : ""}

SOURCE DATA SAMPLE (first 2 records):
${JSON.stringify(inputSample, null, 2)}

TRANSFORMED DATA SAMPLE (first 2 records):
${JSON.stringify(outputSample, null, 2)}

DATA QUALITY METRICS:
Before Transformation:
${JSON.stringify(dataQualityAnalysis.before, null, 2)}

After Transformation:
${JSON.stringify(dataQualityAnalysis.after, null, 2)}

Quality Delta:
${JSON.stringify(dataQualityAnalysis.qualityDelta, null, 2)}

YOUR TASK - Provide JSON with:
1. dataQualityImprovement: (string) Summary of improvements made
2. dataLoss: (string) Any data lost or fields removed (and why acceptable)
3. riskFactors: (array) Any concerns or risks identified
4. transformationExamples: (array) 2-3 concrete examples of transformations applied
5. recommendations: (array) Suggestions for improvement or validation
6. overallConfidence: (string) Assessment of transformation quality and reliability

Return ONLY valid JSON, no other text.`;

    try {
      const assessment = await this.llmClient.generateCode(prompt);

      // Parse JSON response
      let parsed;
      try {
        // Try to extract JSON from response (in case it has extra text)
        const jsonMatch = assessment.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(assessment);
        }
      } catch (e) {
        // If parsing fails, return the raw text
        parsed = {
          dataQualityImprovement: assessment,
          dataLoss: "Unable to parse structured assessment",
          riskFactors: [],
          transformationExamples: [],
          recommendations: [],
          overallConfidence: "Assessment provided in dataQualityImprovement field",
        };
      }

      return parsed;
    } catch (error) {
      return {
        dataQualityImprovement: "AI assessment generation failed",
        dataLoss: error.message,
        riskFactors: ["Unable to complete AI assessment"],
        transformationExamples: [],
        recommendations: ["Review transformation manually"],
        overallConfidence: "Low - assessment could not be generated",
      };
    }
  }

  /**
   * Write provenance report to files
   */
  async writeProvenanceFiles(provenance, outputDir) {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write JSON provenance
    const jsonPath = path.join(outputDir, "provenance.json");
    fs.writeFileSync(jsonPath, JSON.stringify(provenance, null, 2));

    // Write Markdown provenance
    const mdPath = path.join(outputDir, "provenance.md");
    const markdown = this.generateMarkdownReport(provenance);
    fs.writeFileSync(mdPath, markdown);

    return { jsonPath, mdPath };
  }

  /**
   * Generate human-readable Markdown report
   */
  generateMarkdownReport(provenance) {
    const { transformation, dataQuality, aiAssessment } = provenance;

    let md = `# Data Provenance Report

**Generated**: ${provenance.timestamp}

## Transformation Summary

- **Source File**: ${transformation.sourceFile}
- **Entity Type**: ${transformation.entityType}
- **Records Processed**: ${transformation.recordsProcessed}
- **LLM Model Used**: ${transformation.model}
- **Iterations Required**: ${transformation.iterationsUsed}
- **Processing Time**: ${transformation.timeMs}ms
- **Validation Status**: ${transformation.validationPassed ? "✅ PASSED" : "❌ FAILED"}

## Data Quality Analysis

### Before Transformation
- **Record Count**: ${dataQuality.before.recordCount}
- **Field Count**: ${dataQuality.before.fieldCount}
- **Issues Found**: ${dataQuality.before.issues.length}

#### Null Rates by Field
\`\`\`
${Object.entries(dataQuality.before.nullRates)
  .slice(0, 10)
  .map(([field, rate]) => `${field}: ${(parseFloat(rate) * 100).toFixed(1)}%`)
  .join("\n")}
\`\`\`

### After Transformation
- **Record Count**: ${dataQuality.after.recordCount}
- **Field Count**: ${dataQuality.after.fieldCount}

#### Null Rates by Field
\`\`\`
${Object.entries(dataQuality.after.nullRates)
  .slice(0, 10)
  .map(([field, rate]) => `${field}: ${(parseFloat(rate) * 100).toFixed(1)}%`)
  .join("\n")}
\`\`\`

### Quality Improvements
${
  dataQuality.qualityDelta.improvementAreas.length > 0
    ? dataQuality.qualityDelta.improvementAreas.map((area) => `- ${area}`).join("\n")
    : "- No significant improvements detected"
}

### Risk Areas
${
  dataQuality.qualityDelta.riskAreas.length > 0
    ? dataQuality.qualityDelta.riskAreas.map((risk) => `- ⚠️ ${risk}`).join("\n")
    : "- No risk areas identified"
}

## AI Assessment

### Data Quality Improvement
${aiAssessment.dataQualityImprovement}

### Data Loss
${aiAssessment.dataLoss}

### Risk Factors
${
  aiAssessment.riskFactors && aiAssessment.riskFactors.length > 0
    ? aiAssessment.riskFactors.map((risk) => `- ${risk}`).join("\n")
    : "- None identified"
}

### Transformation Examples
${
  aiAssessment.transformationExamples && aiAssessment.transformationExamples.length > 0
    ? aiAssessment.transformationExamples.map((ex) => `- ${ex}`).join("\n")
    : "- See generated code for details"
}

### Recommendations
${
  aiAssessment.recommendations && aiAssessment.recommendations.length > 0
    ? aiAssessment.recommendations.map((rec) => `- ${rec}`).join("\n")
    : "- No recommendations at this time"
}

### Overall Confidence
**${aiAssessment.overallConfidence}**

---

*Report generated by Healthcare ELT AI Provenance System*
`;

    return md;
  }
}

module.exports = { ProvenanceGenerator };
