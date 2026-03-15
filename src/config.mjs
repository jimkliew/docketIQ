/**
 * Configuration Template for DocketIQ
 *
 * ⚠️ DO NOT PUT REAL API KEYS IN THIS FILE - IT IS TRACKED BY GIT
 *
 * For local development with real API keys:
 * 1. Copy this file to `config.local.mjs` in the same directory
 * 2. Add your real API keys to `config.local.mjs`
 * 3. The app will automatically use config.local.mjs if it exists
 * 4. config.local.mjs is gitignored and will never be committed
 *
 * Get API keys:
 * - Regulations.gov: https://open.gsa.gov/api/regulationsgov/
 * - OpenAI: https://platform.openai.com/api-keys
 *
 * For production:
 * Use environment variables injected at build time or a secure backend proxy.
 */

// Default configuration (safe to commit)
const config = {
  REGULATIONS_GOV_API_KEY: 'DEMO_KEY', // Public demo key from Regulations.gov
  OPENAI_API_KEY: '',                  // Not used unless config.local.mjs exists
  OPENAI_MODEL: 'gpt-4',              // Default model
};

export default config;
