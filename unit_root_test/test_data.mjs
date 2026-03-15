/**
 * Unit tests for data.mjs
 */

import {
  SAMPLE_DOCKETS,
  SIMULATED_DOCKETS,
  REAL_DOCKETS,
  generateDemoComments,
  getScenario,
} from "../src/data.mjs";

export function runDataTests() {
  const results = [];

  // Test 1: SAMPLE_DOCKETS structure
  results.push({
    name: "SAMPLE_DOCKETS has correct structure",
    pass: SAMPLE_DOCKETS.length === 3 &&
          SAMPLE_DOCKETS.every(d => d.id && d.label && d.dataType && d.badge),
    details: `Found ${SAMPLE_DOCKETS.length} dockets`,
  });

  // Test 2: Data type separation
  const simCount = SAMPLE_DOCKETS.filter(d => d.dataType === 'simulated').length;
  const realCount = SAMPLE_DOCKETS.filter(d => d.dataType === 'real').length;
  results.push({
    name: "1 simulated and 2 real dockets",
    pass: simCount === 1 && realCount === 2,
    details: `Simulated: ${simCount}, Real: ${realCount}`,
  });

  // Test 3: Badge icons
  results.push({
    name: "Simulated dockets have 🔵 badge",
    pass: SAMPLE_DOCKETS.filter(d => d.dataType === 'simulated').every(d => d.badge === '🔵'),
    details: "All simulated dockets have correct badge",
  });

  results.push({
    name: "Real dockets have 🟢 badge",
    pass: SAMPLE_DOCKETS.filter(d => d.dataType === 'real').every(d => d.badge === '🟢'),
    details: "All real dockets have correct badge",
  });

  // Test 4: Simulated data structure
  results.push({
    name: "SIMULATED_DOCKETS has required fields",
    pass: SIMULATED_DOCKETS.every(d =>
      d.hasSimulatedData && d.campaigns && d.profiles
    ),
    details: `${SIMULATED_DOCKETS.length} simulated docket(s) with full structure`,
  });

  // Test 5: Real data structure
  results.push({
    name: "REAL_DOCKETS has required fields",
    pass: REAL_DOCKETS.every(d => d.agency && d.description),
    details: `${REAL_DOCKETS.length} real docket(s) with agency info`,
  });

  // Test 6: Generate demo comments
  const comments = generateDemoComments();
  results.push({
    name: "generateDemoComments produces valid output",
    pass: Array.isArray(comments) && comments.length > 0 &&
          comments.every(c => c.comment_id && c.source_text),
    details: `Generated ${comments.length} comments`,
  });

  // Test 7: Scenario structure
  const scenario = getScenario();
  results.push({
    name: "getScenario returns valid scenario",
    pass: scenario.title && scenario.docketId && scenario.subtitle,
    details: `Scenario: ${scenario.title}`,
  });

  return results;
}
