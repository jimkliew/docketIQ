/**
 * Comprehensive Agent Card System
 * Detailed cards for each agent with color-coding, prompts, I/O, capabilities, and limitations
 */

import { AGENT_REGISTRY, AGENT_TYPES, getAgentColor, getAgentById } from "./agents.mjs";

/**
 * Render a comprehensive agent card with all details
 */
export function renderAgentCard(agentId, options = {}) {
  const agent = getAgentById(agentId);
  if (!agent) return "";

  const { expanded = false, showActiveIndicator = false } = options;
  const color = getAgentColor(agent.type);
  const typeInfo = AGENT_TYPES[agent.type];

  return `
    <div class="agent-card-comprehensive ${expanded ? "expanded" : "collapsed"} ${showActiveIndicator ? "active" : ""}"
         data-agent-id="${agent.id}"
         style="--agent-color: ${color}">

      <!-- Card Header -->
      <div class="agent-card-header" style="background: linear-gradient(135deg, ${color}15 0%, ${color}05 100%)">
        <div class="agent-card-title-row">
          <div class="agent-type-badge" style="background: ${color}; color: white;">
            ${getTypeIcon(agent.type)} ${typeInfo.label}
          </div>
          ${showActiveIndicator ? `<div class="agent-active-pulse" style="background: ${color}"></div>` : ""}
        </div>
        <h2 class="agent-card-name">${agent.name}</h2>
        <p class="agent-card-tagline">${getAgentTagline(agent)}</p>
        <button class="agent-card-expand-btn" data-action="toggle-agent-card" data-agent-id="${agent.id}">
          ${expanded ? "Show Less ▲" : "Show More ▼"}
        </button>
      </div>

      ${expanded ? renderAgentCardExpanded(agent, color, typeInfo) : ""}
    </div>
  `;
}

/**
 * Render expanded agent card details
 */
function renderAgentCardExpanded(agent, color, typeInfo) {
  return `
    <!-- Model & Type -->
    <div class="agent-card-section">
      <div class="agent-card-section-header" style="border-left-color: ${color}">
        <span class="agent-card-icon">🤖</span>
        <h3>Model & Type</h3>
      </div>
      <div class="agent-card-content">
        <div class="agent-info-grid">
          <div class="agent-info-item">
            <label>Model</label>
            <span class="agent-info-value">${agent.model}</span>
          </div>
          <div class="agent-info-item">
            <label>Type</label>
            <span class="agent-info-value" style="color: ${color}">${typeInfo.label}</span>
          </div>
          <div class="agent-info-item agent-info-item-full">
            <label>Type Description</label>
            <span class="agent-info-value">${typeInfo.description}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- System Prompt -->
    <div class="agent-card-section">
      <div class="agent-card-section-header" style="border-left-color: ${color}">
        <span class="agent-card-icon">💬</span>
        <h3>System Prompt</h3>
      </div>
      <div class="agent-card-content">
        <div class="agent-prompt-box">
          <code>${agent.prompt}</code>
        </div>
        <p class="agent-prompt-note">
          This is the exact instruction given to the agent to define its behavior and output format.
        </p>
      </div>
    </div>

    <!-- Data Input -->
    <div class="agent-card-section">
      <div class="agent-card-section-header" style="border-left-color: ${color}">
        <span class="agent-card-icon">📥</span>
        <h3>Data Input</h3>
      </div>
      <div class="agent-card-content">
        <div class="agent-io-schema">
          ${renderInputSchema(agent.inputSchema, color)}
        </div>
        ${renderInputExample(agent, color)}
      </div>
    </div>

    <!-- Data Output -->
    <div class="agent-card-section">
      <div class="agent-card-section-header" style="border-left-color: ${color}">
        <span class="agent-card-icon">📤</span>
        <h3>Data Output</h3>
      </div>
      <div class="agent-card-content">
        <div class="agent-io-schema">
          ${renderOutputSchema(agent.outputSchema, color)}
        </div>
        ${renderOutputExample(agent, color)}
      </div>
    </div>

    <!-- Skills & Capabilities -->
    <div class="agent-card-section">
      <div class="agent-card-section-header" style="border-left-color: ${color}">
        <span class="agent-card-icon">⚡</span>
        <h3>Skills & Capabilities</h3>
      </div>
      <div class="agent-card-content">
        <h4>What This Agent Can Do:</h4>
        <ul class="agent-capability-list capability-can">
          ${agent.skills.map(skill => `<li><span class="capability-icon">✓</span>${skill}</li>`).join("")}
        </ul>

        <h4>What This Agent Cannot Do:</h4>
        <ul class="agent-capability-list capability-cannot">
          ${getAgentLimitations(agent).map(limitation => `<li><span class="capability-icon">✗</span>${limitation}</li>`).join("")}
        </ul>
      </div>
    </div>

    <!-- Tools & Dependencies -->
    <div class="agent-card-section">
      <div class="agent-card-section-header" style="border-left-color: ${color}">
        <span class="agent-card-icon">🛠️</span>
        <h3>Tools & Dependencies</h3>
      </div>
      <div class="agent-card-content">
        <div class="agent-tools-grid">
          ${agent.tools.map(tool => `
            <div class="agent-tool-chip" style="border-color: ${color}; color: ${color}">
              ${getToolIcon(tool)} ${tool}
            </div>
          `).join("")}
        </div>
      </div>
    </div>

    <!-- Agent Call Graph -->
    <div class="agent-card-section">
      <div class="agent-card-section-header" style="border-left-color: ${color}">
        <span class="agent-card-icon">🔗</span>
        <h3>Agent Relationships</h3>
      </div>
      <div class="agent-card-content">
        <div class="agent-call-graph">
          <div class="agent-call-section">
            <h4>Called By:</h4>
            <div class="agent-call-chips">
              ${renderCallerChips(agent, color)}
            </div>
          </div>
          <div class="agent-call-section">
            <h4>Can Call:</h4>
            <div class="agent-call-chips">
              ${renderCalleeChips(agent, color)}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Audit Points -->
    <div class="agent-card-section">
      <div class="agent-card-section-header" style="border-left-color: ${color}">
        <span class="agent-card-icon">📋</span>
        <h3>Audit Points</h3>
      </div>
      <div class="agent-card-content">
        <p class="audit-intro">This agent logs the following data points for full traceability:</p>
        <ol class="agent-audit-list">
          ${agent.auditPoints.map(point => `<li>${point}</li>`).join("")}
        </ol>
        <button class="agent-view-audit-btn" data-action="view-agent-audit" data-agent-id="${agent.id}" style="border-color: ${color}; color: ${color}">
          View Audit Trail for This Agent
        </button>
      </div>
    </div>

    <!-- Performance Metrics -->
    ${renderPerformanceMetrics(agent, color)}
  `;
}

/**
 * Render input schema
 */
function renderInputSchema(schema, color) {
  const entries = Object.entries(schema);
  if (entries.length === 0) return "<p>No input required</p>";

  return `
    <table class="agent-schema-table">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(([key, value]) => `
          <tr>
            <td><code style="color: ${color}">${key}</code></td>
            <td>${extractType(value)}</td>
            <td>${extractDescription(value)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

/**
 * Render output schema
 */
function renderOutputSchema(schema, color) {
  const entries = Object.entries(schema);
  if (entries.length === 0) return "<p>No structured output</p>";

  return `
    <table class="agent-schema-table">
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(([key, value]) => `
          <tr>
            <td><code style="color: ${color}">${key}</code></td>
            <td>${extractType(value)}</td>
            <td>${extractDescription(value)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

/**
 * Render input example
 */
function renderInputExample(agent, color) {
  const example = getInputExample(agent);
  if (!example) return "";

  return `
    <details class="agent-example-details">
      <summary style="color: ${color}">View Example Input</summary>
      <pre class="agent-example-code">${JSON.stringify(example, null, 2)}</pre>
    </details>
  `;
}

/**
 * Render output example
 */
function renderOutputExample(agent, color) {
  const example = getOutputExample(agent);
  if (!example) return "";

  return `
    <details class="agent-example-details">
      <summary style="color: ${color}">View Example Output</summary>
      <pre class="agent-example-code">${JSON.stringify(example, null, 2)}</pre>
    </details>
  `;
}

/**
 * Render caller chips
 */
function renderCallerChips(agent, currentColor) {
  if (!agent.canBeCalled || agent.canBeCalled.length === 0) {
    return `<span class="agent-call-none">User action or system trigger</span>`;
  }

  if (typeof agent.canBeCalled === "string") {
    return `<span class="agent-call-chip" style="border-color: ${currentColor}">${agent.canBeCalled}</span>`;
  }

  return agent.canBeCalled
    .map((callerId) => {
      const caller = getAgentById(callerId);
      const callerColor = caller ? getAgentColor(caller.type) : "#6b7280";
      return `<button class="agent-call-chip" style="border-color: ${callerColor}; color: ${callerColor}" data-action="scroll-to-agent" data-agent-id="${callerId}">
        ${caller?.name || callerId}
      </button>`;
    })
    .join("");
}

/**
 * Render callee chips
 */
function renderCalleeChips(agent, currentColor) {
  if (!agent.canCall || agent.canCall.length === 0) {
    return `<span class="agent-call-none">Terminal agent (no further calls)</span>`;
  }

  return agent.canCall
    .map((calleeId) => {
      const callee = getAgentById(calleeId);
      const calleeColor = callee ? getAgentColor(callee.type) : "#6b7280";
      return `<button class="agent-call-chip" style="border-color: ${calleeColor}; color: ${calleeColor}" data-action="scroll-to-agent" data-agent-id="${calleeId}">
        ${callee?.name || calleeId}
      </button>`;
    })
    .join("");
}

/**
 * Render performance metrics
 */
function renderPerformanceMetrics(agent, color) {
  const metrics = getAgentMetrics(agent);
  if (!metrics) return "";

  return `
    <div class="agent-card-section">
      <div class="agent-card-section-header" style="border-left-color: ${color}">
        <span class="agent-card-icon">📈</span>
        <h3>Performance Metrics</h3>
      </div>
      <div class="agent-card-content">
        <div class="agent-metrics-grid">
          ${Object.entries(metrics).map(([key, value]) => `
            <div class="agent-metric-card">
              <div class="agent-metric-value">${value}</div>
              <div class="agent-metric-label">${key}</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render agent gallery (all agents in grid)
 */
export function renderAgentGallery(options = {}) {
  const { activeAgentIds = [], expandedAgentId = null } = options;

  return `
    <div class="agent-gallery">
      <div class="agent-gallery-header">
        <h2>All DocketIQ Agents</h2>
        <p>Click any card to expand and see full details</p>
      </div>

      <!-- Color Legend -->
      <div class="agent-gallery-legend">
        ${Object.entries(AGENT_TYPES).map(([key, info]) => `
          <div class="legend-item">
            <span class="legend-swatch" style="background: ${info.color}"></span>
            <span class="legend-text">${info.label}</span>
          </div>
        `).join("")}
      </div>

      <!-- Agent Cards Grid -->
      <div class="agent-gallery-grid">
        ${AGENT_REGISTRY.map(agent =>
          renderAgentCard(agent.id, {
            expanded: expandedAgentId === agent.id,
            showActiveIndicator: activeAgentIds.includes(agent.id),
          })
        ).join("")}
      </div>
    </div>
  `;
}

/**
 * Render agents by type (grouped view)
 */
export function renderAgentsByType(options = {}) {
  const { activeAgentIds = [], expandedAgentId = null } = options;

  return `
    <div class="agent-by-type-view">
      ${Object.entries(AGENT_TYPES).map(([typeKey, typeInfo]) => {
        const agentsOfType = AGENT_REGISTRY.filter(agent => agent.type === typeKey);
        if (agentsOfType.length === 0) return "";

        return `
          <div class="agent-type-group">
            <div class="agent-type-group-header" style="background: ${typeInfo.color}15; border-left-color: ${typeInfo.color}">
              <h2 style="color: ${typeInfo.color}">
                ${getTypeIcon(typeKey)} ${typeInfo.label}
              </h2>
              <p>${typeInfo.description}</p>
              <span class="agent-type-count">${agentsOfType.length} agent${agentsOfType.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="agent-type-cards">
              ${agentsOfType.map(agent =>
                renderAgentCard(agent.id, {
                  expanded: expandedAgentId === agent.id,
                  showActiveIndicator: activeAgentIds.includes(agent.id),
                })
              ).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

// Helper functions

function getTypeIcon(type) {
  const icons = {
    EXTRACT: "⬇️",
    ENRICH: "⚙️",
    DISPLAY: "📺",
    SCORE: "📊",
    ACTION: "🎯",
  };
  return icons[type] || "🔧";
}

function getToolIcon(tool) {
  const icons = {
    "Regulations.gov API v4": "🌐",
    "Fetch API": "🌐",
    "OpenAI API": "🤖",
    "PDF.js": "📄",
    "Mammoth.js": "📝",
    "MinHash": "🔢",
    "Jaccard index": "🔢",
    "Graph schema": "📊",
  };

  for (const [key, icon] of Object.entries(icons)) {
    if (tool.includes(key)) return icon;
  }
  return "🔧";
}

function getAgentTagline(agent) {
  const taglines = {
    "docket-fetcher": "Retrieves docket metadata from Regulations.gov",
    "document-fetcher": "Fetches all documents and attachments for a docket",
    "comment-fetcher": "Pulls public comments with attachment metadata",
    "comment-normalizer": "Cleans and standardizes comment text and metadata",
    "duplicate-detector": "Identifies campaign clusters using similarity algorithms",
    "topic-classifier": "Multi-label topic assignment via keyword matching",
    "argument-extractor": "Extracts claims, stance, and evidence from text",
    "authority-scorer": "Scores expertise level from 1-10 based on signals",
    "sentiment-scorer": "Calculates sentiment from -1.0 to +1.0",
    "graph-builder": "Constructs knowledge graph with nodes and edges",
    "summary-generator": "Creates analyst brief with source-linked insights",
    "topic-view-builder": "Builds topic-focused deep-dive analyses",
    "display-formatter": "Formats data into user-friendly HTML",
    "attachment-processor": "Downloads and extracts text from file attachments",
    "llm-summarizer": "Generates natural language summaries via OpenAI",
  };
  return taglines[agent.id] || "Processes data for analysis";
}

function getAgentLimitations(agent) {
  const limitations = {
    "docket-fetcher": [
      "Cannot access dockets without valid API key",
      "Limited to public dockets only",
      "Subject to API rate limits (1000 req/hour)",
      "No access to restricted or embargoed dockets",
    ],
    "document-fetcher": [
      "Cannot download actual file contents (only metadata)",
      "Limited to 250 documents per request (pagination required)",
      "Cannot parse file contents automatically",
    ],
    "comment-fetcher": [
      "Cannot access non-public comments",
      "Maximum 5000 comments per query (API limit)",
      "No real-time updates (snapshot only)",
    ],
    "comment-normalizer": [
      "Cannot correct spelling or grammar errors",
      "Cannot resolve ambiguous organization names automatically",
      "Does not translate non-English text",
    ],
    "duplicate-detector": [
      "Cannot detect semantic duplicates (only textual similarity)",
      "May miss campaigns with high lexical variance",
      "Requires minimum 12 duplicates to form cluster",
    ],
    "topic-classifier": [
      "Limited to predefined topic registry",
      "Cannot invent new topics automatically",
      "Keyword-based (misses context-dependent mentions)",
    ],
    "argument-extractor": [
      "Rule-based only (no deep NLP)",
      "Cannot handle highly sarcastic or ironic text",
      "Limited to English language",
    ],
    "authority-scorer": [
      "Heuristic-based (not ML-based)",
      "Cannot verify actual credentials",
      "May misjudge unconventional expertise signals",
    ],
    "sentiment-scorer": [
      "Based on stance distribution (not tone analysis)",
      "Cannot detect subtle nuance or mixed sentiment",
      "Limited to support/oppose/mixed categories",
    ],
    "graph-builder": [
      "No semantic reasoning (structural only)",
      "Cannot infer implicit relationships",
      "Memory-bound for very large graphs (>100k nodes)",
    ],
    "summary-generator": [
      "Statistical aggregation only (no synthesis)",
      "Cannot generate novel insights beyond data",
      "English output only",
    ],
    "topic-view-builder": [
      "Cannot cross-reference between topics automatically",
      "Limited to single-topic drill-downs",
    ],
    "display-formatter": [
      "No accessibility auditing (manual review needed)",
      "Cannot auto-adapt to screen readers beyond standard HTML",
    ],
    "attachment-processor": [
      "Cannot process password-protected files",
      "No OCR for image-based PDFs",
      "Limited file size (browser memory constraints)",
    ],
    "llm-summarizer": [
      "Requires external API key (not free)",
      "Subject to OpenAI rate limits and costs",
      "No guarantee of factual accuracy (may hallucinate)",
      "Cannot access information beyond training cutoff",
    ],
  };

  return limitations[agent.id] || [
    "Operates within defined scope only",
    "Requires valid input data",
    "May fail with edge cases",
  ];
}

function extractType(value) {
  // Extract type from schema value like "string (e.g., EPA-HQ-OW-2022-0801)"
  if (typeof value === "string") {
    const match = value.match(/^(\w+)/);
    return match ? `<code>${match[1]}</code>` : "<code>unknown</code>";
  }
  return "<code>any</code>";
}

function extractDescription(value) {
  // Extract description from schema value
  if (typeof value === "string") {
    const match = value.match(/\((.+)\)/);
    return match ? match[1] : value;
  }
  return String(value);
}

function getInputExample(agent) {
  const examples = {
    "docket-fetcher": { docketId: "EPA-HQ-OW-2022-0801" },
    "comment-fetcher": { documentId: "EPA-HQ-OW-2022-0801-0001", pageSize: 250, includeAttachments: true },
    "duplicate-detector": { comments: [{ comment_id: "RGC-00001", source_text: "I support this rule..." }] },
    "topic-classifier": { comment: { source_text: "Lead service lines must be replaced..." }, topicRegistry: [] },
  };
  return examples[agent.id] || null;
}

function getOutputExample(agent) {
  const examples = {
    "docket-fetcher": { docket: { title: "Lead and Copper Rule Improvements", agency: "EPA", summary: "..." } },
    "duplicate-detector": { clusters: [{ id: "campaign-001", size: 780, sponsor: "Safe Water Families" }] },
    "topic-classifier": { topicIds: ["lead-line-replacement", "compliance-timeline"], confidence: [0.95, 0.82] },
  };
  return examples[agent.id] || null;
}

function getAgentMetrics(agent) {
  // Return null for now, can be populated with real metrics from audit logs
  return null;
}
