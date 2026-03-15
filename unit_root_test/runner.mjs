#!/usr/bin/env node

/**
 * DocketIQ Unit Test Runner
 * Runs all unit tests and reports results
 */

import { runDataTests } from "./test_data.mjs";
import { runAgentTests } from "./test_agents.mjs";
import { runConfigTests } from "./test_config.mjs";

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function printHeader(title) {
  console.log(`\n${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
  console.log(`${COLORS.cyan}${title.padEnd(60)}${COLORS.reset}`);
  console.log(`${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);
}

function printTestResult(result) {
  const icon = result.pass ? '✓' : '✗';
  const color = result.pass ? COLORS.green : COLORS.red;
  console.log(`  ${color}${icon}${COLORS.reset} ${result.name}`);
  if (result.details) {
    console.log(`    ${COLORS.yellow}→ ${result.details}${COLORS.reset}`);
  }
}

function printSummary(allResults) {
  const total = allResults.length;
  const passed = allResults.filter(r => r.pass).length;
  const failed = total - passed;

  console.log(`\n${COLORS.blue}${'─'.repeat(60)}${COLORS.reset}`);
  console.log(`${COLORS.blue}Summary${COLORS.reset}`);
  console.log(`${COLORS.blue}${'─'.repeat(60)}${COLORS.reset}`);
  console.log(`  Total tests: ${total}`);
  console.log(`  ${COLORS.green}✓ Passed: ${passed}${COLORS.reset}`);
  if (failed > 0) {
    console.log(`  ${COLORS.red}✗ Failed: ${failed}${COLORS.reset}`);
  }
  console.log(`  ${COLORS.yellow}Success rate: ${((passed/total) * 100).toFixed(1)}%${COLORS.reset}`);
  console.log();

  return failed === 0;
}

async function runAllTests() {
  console.log(`\n${COLORS.blue}DocketIQ Unit Test Suite${COLORS.reset}`);
  console.log(`${COLORS.yellow}Testing project structure and best practices${COLORS.reset}\n`);

  const allResults = [];

  // Test Suite 1: Data Module
  printHeader("Data Module Tests (data.mjs)");
  const dataResults = runDataTests();
  dataResults.forEach(printTestResult);
  allResults.push(...dataResults);

  // Test Suite 2: Agents Module
  printHeader("Agent System Tests (agents.mjs)");
  const agentResults = runAgentTests();
  agentResults.forEach(printTestResult);
  allResults.push(...agentResults);

  // Test Suite 3: Config Module
  printHeader("Configuration Tests (config.mjs)");
  const configResults = runConfigTests();
  configResults.forEach(printTestResult);
  allResults.push(...configResults);

  // Print final summary
  const success = printSummary(allResults);

  if (!success) {
    console.log(`${COLORS.red}⚠ Some tests failed. Please review the output above.${COLORS.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${COLORS.green}✓ All tests passed! Project structure is healthy.${COLORS.reset}\n`);
    process.exit(0);
  }
}

runAllTests().catch(error => {
  console.error(`${COLORS.red}Test suite error:${COLORS.reset}`, error);
  process.exit(1);
});
