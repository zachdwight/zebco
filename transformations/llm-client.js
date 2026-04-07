/**
 * LLM Client - Unified interface for Claude, Gemini, and local LLMs
 *
 * Handles API calls to different LLM providers with consistent interface.
 */

const https = require("https");

class LLMClient {
  constructor(options = {}) {
    this.model = options.model || "claude";
    this.config = options.config || {};

    if (this.model === "claude") {
      this.initializeClaude();
    } else if (this.model === "gemini") {
      this.initializeGemini();
    } else if (this.model === "local") {
      this.initializeLocal();
    }
  }

  initializeClaude() {
    const apiKey = process.env.ANTHROPIC_API_KEY || this.config.apiKey;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable not set");
    }
    this.apiKey = apiKey;
    this.baseUrl = this.config.baseUrl || "https://api.anthropic.com/v1";
    this.model = this.config.modelId || "claude-opus-4-6"; // Latest Claude model
  }

  initializeGemini() {
    const apiKey = process.env.GOOGLE_API_KEY || this.config.apiKey;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable not set");
    }
    this.apiKey = apiKey;
    this.baseUrl = this.config.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
    this.model = this.config.modelId || "gemini-pro";
  }

  initializeLocal() {
    this.baseUrl = this.config.baseUrl || "http://localhost:11434";
    this.model = this.config.modelId || "mistral"; // Default local model
  }

  /**
   * Generate transformation code using LLM
   */
  async generateCode(prompt) {
    if (this.model === "claude") {
      return this.callClaude(prompt);
    } else if (this.model === "gemini") {
      return this.callGemini(prompt);
    } else if (this.model === "local") {
      return this.callLocal(prompt);
    }

    throw new Error(`Unknown model: ${this.model}`);
  }

  /**
   * Call Claude API
   */
  async callClaude(prompt) {
    const systemPrompt = `You are an expert JavaScript developer specializing in healthcare data transformations.
Generate clean, production-ready JavaScript code that transforms healthcare data according to specifications.
Always return ONLY the function code with no markdown, explanations, or additional text.`;

    const body = JSON.stringify({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const response = await this.makeRequest(
      `${this.baseUrl}/messages`,
      {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body
    );

    if (!response.content || response.content.length === 0) {
      throw new Error("Empty response from Claude API");
    }

    // Extract the code from the response
    const code = response.content[0].text;
    return this.cleanCode(code);
  }

  /**
   * Call Gemini API
   */
  async callGemini(prompt) {
    const systemPrompt = `You are an expert JavaScript developer specializing in healthcare data transformations.
Generate clean, production-ready JavaScript code that transforms healthcare data according to specifications.
Always return ONLY the function code with no markdown, explanations, or additional text.`;

    const body = JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.3, // Lower temperature for more consistent code generation
      },
    });

    const url = `${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`;
    const response = await this.makeRequest(
      url,
      {
        "Content-Type": "application/json",
      },
      body
    );

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("Empty response from Gemini API");
    }

    const code = response.candidates[0].content.parts[0].text;
    return this.cleanCode(code);
  }

  /**
   * Call local LLM (Ollama or similar)
   */
  async callLocal(prompt) {
    const systemPrompt = `You are an expert JavaScript developer specializing in healthcare data transformations.
Generate clean, production-ready JavaScript code that transforms healthcare data according to specifications.
Always return ONLY the function code with no markdown, explanations, or additional text.`;

    const body = JSON.stringify({
      model: this.model,
      prompt: `${systemPrompt}\n\n${prompt}`,
      stream: false,
      raw: true,
    });

    const response = await this.makeRequest(
      `${this.baseUrl}/api/generate`,
      {
        "Content-Type": "application/json",
      },
      body
    );

    const code = response.response || response.text;
    if (!code) {
      throw new Error("Empty response from local LLM");
    }

    return this.cleanCode(code);
  }

  /**
   * Make HTTP request
   */
  makeRequest(url, headers, body) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 300000, // 5 minute timeout for long-running requests
      };

      const protocol = urlObj.protocol === "https:" ? https : require("http");

      const req = protocol.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);

            if (res.statusCode >= 400) {
              reject(
                new Error(
                  `API error (${res.statusCode}): ${parsed.error?.message || parsed.message || data}`
                )
              );
            } else {
              resolve(parsed);
            }
          } catch (e) {
            if (res.statusCode >= 400) {
              reject(new Error(`API error (${res.statusCode}): ${data}`));
            } else {
              reject(new Error(`Failed to parse response: ${e.message}`));
            }
          }
        });
      });

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.write(body);
      req.end();
    });
  }

  /**
   * Clean code response (remove markdown, explanations, etc.)
   */
  cleanCode(code) {
    // Remove markdown code blocks
    let cleaned = code
      .replace(/```javascript\n?/g, "")
      .replace(/```js\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Remove any leading/trailing whitespace and comments about markdown
    cleaned = cleaned.split("\n").filter((line) => {
      const trimmed = line.trim();
      // Skip lines that are just explanatory text
      if (
        trimmed.startsWith("//") &&
        (trimmed.includes("javascript") || trimmed.includes("code"))
      ) {
        return false;
      }
      return true;
    });

    cleaned = cleaned.join("\n").trim();

    return cleaned;
  }

  /**
   * Validate that generated code is syntactically correct
   */
  validateCode(code) {
    try {
      new Function(code);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}

module.exports = { LLMClient };
