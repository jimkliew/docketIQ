/**
 * Unit tests for agents.mjs
 */

import {
  AGENT_REGISTRY,
  AGENT_TYPES,
  getAgentById,
  getAgentsByType,
  getCallers,
  getCallees,
} from "../src/agents.mjs";

export function runAgentTests() {
  const results = [];

  // Test 1: AGENT_TYPES completeness
  const requiredTypes = ['EXTRACT', 'ENRICH', 'DISPLAY', 'SCORE', 'ACTION'];
  results.push({
    name: "AGENT_TYPES has all required types",
    pass: requiredTypes.every(type => AGENT_TYPES[type]),
    details: `Found ${Object.keys(AGENT_TYPES).length} agent types`,
  });

  // Test 2: Each agent type has required fields
  results.push({
    name: "Each AGENT_TYPE has color, label, description",
    pass: Object.values(AGENT_TYPES).every(type =>
      type.color && type.label && type.description
    ),
    details: "All agent types properly configured",
  });

  // Test 3: AGENT_REGISTRY structure
  results.push({
    name: "AGENT_REGISTRY has 15 agents",
    pass: AGENT_REGISTRY.length === 15,
    details: `Found ${AGENT_REGISTRY.length} agents`,
  });

  // Test 4: Each agent has required fields
  results.push({
    name: "Each agent has all required fields",
    pass: AGENT_REGISTRY.every(agent =>
      agent.id &&
      agent.name &&
      agent.type &&
      agent.model &&
      agent.prompt &&
      agent.skills &&
      agent.tools &&
      agent.canBeCalled &&
      agent.canCall &&
      agent.inputSchema &&
      agent.outputSchema
    ),
    details: "All agents have complete metadata",
  });

  // Test 5: Agent type validation
  results.push({
    name: "All agent types are valid",
    pass: AGENT_REGISTRY.every(agent => AGENT_TYPES[agent.type]),
    details: "All agents reference valid types",
  });

  // Test 6: getAgentById function
  const testAgent = getAgentById("docket-fetcher");
  results.push({
    name: "getAgentById returns correct agent",
    pass: testAgent && testAgent.id === "docket-fetcher",
    details: testAgent ? testAgent.name : "Agent not found",
  });

  // Test 7: getAgentsByType function
  const extractAgents = getAgentsByType("EXTRACT");
  results.push({
    name: "getAgentsByType returns agents of correct type",
    pass: Array.isArray(extractAgents) &&
          extractAgents.every(a => a.type === "EXTRACT"),
    details: `Found ${extractAgents.length} EXTRACT agents`,
  });

  // Test 8: Color coding distribution
  const typeDistribution = AGENT_REGISTRY.reduce((acc, agent) => {
    acc[agent.type] = (acc[agent.type] || 0) + 1;
    return acc;
  }, {});
  results.push({
    name: "Agents distributed across all types",
    pass: Object.keys(typeDistribution).length === 5,
    details: Object.entries(typeDistribution)
      .map(([type, count]) => `${type}:${count}`)
      .join(", "),
  });

  // Test 9: getCallers function
  const callers = getCallers("sentiment-scorer");
  results.push({
    name: "getCallers returns valid results",
    pass: Array.isArray(callers),
    details: `${callers.length} agents can call sentiment-scorer`,
  });

  // Test 10: getCallees function
  const callees = getCallees("docket-fetcher");
  results.push({
    name: "getCallees returns valid results",
    pass: Array.isArray(callees),
    details: `docket-fetcher can call ${callees.length} agents`,
  });

  return results;
}
