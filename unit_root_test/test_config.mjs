/**
 * Unit tests for config.mjs
 */

import config from "../src/config.mjs";

export function runConfigTests() {
  const results = [];

  // Test 1: Config object exists
  results.push({
    name: "Config object exists",
    pass: typeof config === 'object' && config !== null,
    details: "Config loaded successfully",
  });

  // Test 2: Required config keys
  const requiredKeys = ['REGULATIONS_GOV_API_KEY', 'OPENAI_API_KEY', 'OPENAI_MODEL'];
  results.push({
    name: "Config has all required keys",
    pass: requiredKeys.every(key => key in config),
    details: `Found ${Object.keys(config).length} config keys`,
  });

  // Test 3: API key defaults
  results.push({
    name: "REGULATIONS_GOV_API_KEY has default value",
    pass: config.REGULATIONS_GOV_API_KEY === 'DEMO_KEY',
    details: `Value: ${config.REGULATIONS_GOV_API_KEY}`,
  });

  // Test 4: Model default
  results.push({
    name: "OPENAI_MODEL has default value",
    pass: typeof config.OPENAI_MODEL === 'string' && config.OPENAI_MODEL.length > 0,
    details: `Model: ${config.OPENAI_MODEL}`,
  });

  return results;
}
