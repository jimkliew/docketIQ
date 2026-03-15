/**
 * Transparency UI Components
 * Agents Panel, Architecture Panel, and Audit Panel
 */

import {
  AGENT_REGISTRY,
  AGENT_TYPES,
  getAgentColor,
  getAgentById,
  getAgentsByType,
  getCallers,
  getCallees,
} from "./agents.mjs";
import { auditLogger } from "./audit.mjs";

/**
 * Render transparency buttons (Agents, Architecture, Audit)
 */
export function renderTransparencyButtons() {
  return `
    <div class="transparency-buttons">
      <button class="transparency-btn" data-action="show-agents">
        <span class="transparency-icon">🤖</span>
        Agents
      </button>
      <button class="transparency-btn" data-action="show-architecture">
        <span class="transparency-icon">📊</span>
        Architecture
      </button>
      <button class="transparency-btn" data-action="show-audit">
        <span class="transparency-icon">📋</span>
        Audit Trail
      </button>
    </div>
  `;
}

/**
 * Render agent card
 */
function renderAgentCard(agent, isActive = false) {
  const color = getAgentColor(agent.type);
  const typeInfo = AGENT_TYPES[agent.type];
  const callers = getCallers(agent.id);
  const callees = getCallees(agent.id);

  return `
    <div class="agent-card ${isActive ? "agent-card-active" : ""}" data-agent-id="${agent.id}" style="border-left: 4px solid ${color}">
      <div class="agent-card-header">
        <h3 class="agent-card-title">${agent.name}</h3>
        <span class="agent-card-badge" style="background: ${color}20; color: ${color}">
          ${typeInfo.label}
        </span>
      </div>

      <div class="agent-card-section">
        <div class="agent-card-label">Model</div>
        <div class="agent-card-value">${agent.model}</div>
      </div>

      <div class="agent-card-section">
        <div class="agent-card-label">Prompt</div>
        <div class="agent-card-value agent-card-prompt">${agent.prompt}</div>
      </div>

      <div class="agent-card-section">
        <div class="agent-card-label">Skills</div>
        <div class="agent-card-chips">
          ${agent.skills.map((skill) => `<span class="agent-chip">${skill}</span>`).join("")}
        </div>
      </div>

      <div class="agent-card-section">
        <div class="agent-card-label">Tools</div>
        <div class="agent-card-chips">
          ${agent.tools.map((tool) => `<span class="agent-chip agent-chip-tool">${tool}</span>`).join("")}
        </div>
      </div>

      <div class="agent-card-section">
        <div class="agent-card-label">Can Be Called By</div>
        <div class="agent-card-value">${
          Array.isArray(agent.canBeCalled)
            ? agent.canBeCalled.join(", ")
            : agent.canBeCalled
        }</div>
      </div>

      <div class="agent-card-section">
        <div class="agent-card-label">Can Call</div>
        <div class="agent-card-value">${
          agent.canCall ? (Array.isArray(agent.canCall) ? agent.canCall.join(", ") : agent.canCall) : "None (terminal)"
        }</div>
      </div>

      <div class="agent-card-section">
        <div class="agent-card-label">Audit Points</div>
        <div class="agent-card-list">
          ${agent.auditPoints.map((point) => `<li>${point}</li>`).join("")}
        </div>
      </div>

      <div class="agent-card-actions">
        <button class="agent-card-btn" data-action="view-agent-data" data-agent-id="${agent.id}">
          View Generated Data
        </button>
        <button class="agent-card-btn agent-card-btn-secondary" data-action="view-agent-audit" data-agent-id="${agent.id}">
          View Audit Trail
        </button>
      </div>
    </div>
  `;
}

/**
 * Render Agents Panel
 */
export function renderAgentsPanel(state) {
  if (!state.showAgentsPanel) return "";

  const agentsByType = Object.keys(AGENT_TYPES).map((type) => ({
    type,
    info: AGENT_TYPES[type],
    agents: getAgentsByType(type),
  }));

  const activeAgentsForCurrentStep = getActiveAgentsForStep(state.step);

  return `
    <div class="transparency-panel">
      <div class="transparency-panel-header">
        <h2>🤖 Agents in DocketIQ</h2>
        <button class="transparency-close" data-action="close-agents">✕</button>
      </div>

      <div class="transparency-panel-body">
        <div class="agent-type-legend">
          ${Object.entries(AGENT_TYPES)
            .map(
              ([key, info]) => `
            <div class="legend-item">
              <span class="legend-color" style="background: ${info.color}"></span>
              <span class="legend-label">${info.label}</span>
              <span class="legend-desc">${info.description}</span>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="agent-current-step">
          <h3>Active Agents for Step ${state.step + 1}</h3>
          <p>These agents are generating the data you see on this page:</p>
          <div class="agent-step-badges">
            ${activeAgentsForCurrentStep
              .map(
                (id) => {
                  const agent = getAgentById(id);
                  if (!agent) return "";
                  const color = getAgentColor(agent.type);
                  return `<button class="agent-step-badge" style="background: ${color}20; border-color: ${color}; color: ${color}" data-action="scroll-to-agent" data-agent-id="${id}">
                    ${agent.name}
                  </button>`;
                }
              )
              .join("")}
          </div>
        </div>

        ${agentsByType
          .map(
            ({ type, info, agents }) => `
          <div class="agent-type-section">
            <h3 style="color: ${info.color}">
              <span class="agent-type-icon" style="background: ${info.color}20">
                ${getTypeIcon(type)}
              </span>
              ${info.label}
            </h3>
            <div class="agent-cards">
              ${agents.map((agent) => renderAgentCard(agent, activeAgentsForCurrentStep.includes(agent.id))).join("")}
            </div>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="transparency-panel-footer">
        <button class="transparency-nav-btn" data-action="close-agents">
          ← Back to App
        </button>
      </div>
    </div>
  `;
}

/**
 * Render Architecture Panel
 */
export function renderArchitecturePanel(state) {
  if (!state.showArchitecturePanel) return "";

  const architecture = getArchitectureForStep(state.step);

  return `
    <div class="transparency-panel">
      <div class="transparency-panel-header">
        <h2>📊 Architecture: Step ${state.step + 1}</h2>
        <button class="transparency-close" data-action="close-architecture">✕</button>
      </div>

      <div class="transparency-panel-body">
        <div class="architecture-overview">
          <h3>${architecture.title}</h3>
          <p>${architecture.description}</p>
        </div>

        <div class="architecture-flow">
          <h3>Data Flow</h3>
          <div class="flow-diagram">
            ${architecture.dataFlow
              .map(
                (step, index) => `
              <div class="flow-step">
                <div class="flow-step-number">${index + 1}</div>
                <div class="flow-step-content">
                  <h4>${step.stage}</h4>
                  <p>${step.description}</p>
                  <div class="flow-step-agents">
                    ${step.agents
                      .map((agentId) => {
                        const agent = getAgentById(agentId);
                        if (!agent) return "";
                        const color = getAgentColor(agent.type);
                        return `<span class="flow-agent" style="background: ${color}20; color: ${color}">${agent.name}</span>`;
                      })
                      .join("")}
                  </div>
                </div>
                ${index < architecture.dataFlow.length - 1 ? '<div class="flow-arrow">↓</div>' : ""}
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="architecture-io">
          <div class="architecture-io-col">
            <h3>Input Data</h3>
            <ul class="architecture-list">
              ${architecture.inputs.map((input) => `<li><strong>${input.name}:</strong> ${input.description}</li>`).join("")}
            </ul>
          </div>
          <div class="architecture-io-col">
            <h3>Processing</h3>
            <ul class="architecture-list">
              ${architecture.processing.map((proc) => `<li><strong>${proc.name}:</strong> ${proc.description}</li>`).join("")}
            </ul>
          </div>
          <div class="architecture-io-col">
            <h3>Output</h3>
            <ul class="architecture-list">
              ${architecture.outputs.map((output) => `<li><strong>${output.name}:</strong> ${output.description}</li>`).join("")}
            </ul>
          </div>
        </div>

        <div class="architecture-metrics">
          <h3>Performance Metrics</h3>
          <div class="metrics-grid">
            ${architecture.metrics
              .map(
                (metric) => `
              <div class="metric-card">
                <div class="metric-value">${metric.value}</div>
                <div class="metric-label">${metric.label}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>

      <div class="transparency-panel-footer">
        <button class="transparency-nav-btn" data-action="close-architecture">
          ← Back to App
        </button>
      </div>
    </div>
  `;
}

/**
 * Render Audit Trail Panel
 */
export function renderAuditPanel(state) {
  if (!state.showAuditPanel) return "";

  const summary = auditLogger.getSummary();
  const logs = auditLogger.logs;
  const agentLogs = {};

  logs.forEach((log) => {
    if (!agentLogs[log.agentId]) {
      agentLogs[log.agentId] = [];
    }
    agentLogs[log.agentId].push(log);
  });

  const depthLevel = state.auditDepthLevel || 0;

  return `
    <div class="transparency-panel">
      <div class="transparency-panel-header">
        <h2>📋 Audit Trail</h2>
        <button class="transparency-close" data-action="close-audit">✕</button>
      </div>

      <div class="transparency-panel-body">
        ${renderAuditSummary(summary)}

        <div class="audit-depth-controls">
          <label>Detail Level:</label>
          <div class="audit-depth-buttons">
            <button class="audit-depth-btn ${depthLevel === 0 ? "active" : ""}" data-action="set-audit-depth" data-depth="0">
              Summary
            </button>
            <button class="audit-depth-btn ${depthLevel === 1 ? "active" : ""}" data-action="set-audit-depth" data-depth="1">
              Details
            </button>
            <button class="audit-depth-btn ${depthLevel === 2 ? "active" : ""}" data-action="set-audit-depth" data-depth="2">
              Full Data
            </button>
          </div>
        </div>

        ${depthLevel === 0 ? renderAuditSummaryView(agentLogs) : ""}
        ${depthLevel === 1 ? renderAuditDetailsView(agentLogs) : ""}
        ${depthLevel === 2 ? renderAuditFullDataView(logs) : ""}

        <div class="audit-export">
          <h3>Export Audit Data</h3>
          <button class="audit-export-btn" data-action="export-audit-json">
            Download JSON
          </button>
          <button class="audit-export-btn" data-action="export-audit-csv">
            Download CSV
          </button>
        </div>
      </div>

      <div class="transparency-panel-footer">
        <button class="transparency-nav-btn" data-action="audit-prev-depth">
          ← Less Detail
        </button>
        <button class="transparency-nav-btn" data-action="close-audit">
          Close
        </button>
        <button class="transparency-nav-btn" data-action="audit-next-depth">
          More Detail →
        </button>
      </div>
    </div>
  `;
}

function renderAuditSummary(summary) {
  return `
    <div class="audit-summary">
      <div class="audit-summary-grid">
        <div class="audit-summary-card">
          <div class="audit-summary-value">${summary.totalLogs}</div>
          <div class="audit-summary-label">Total Log Entries</div>
        </div>
        <div class="audit-summary-card">
          <div class="audit-summary-value">${Object.keys(summary.agentCounts).length}</div>
          <div class="audit-summary-label">Agents Executed</div>
        </div>
        <div class="audit-summary-card">
          <div class="audit-summary-value">${summary.errors.length}</div>
          <div class="audit-summary-label">Errors</div>
        </div>
        <div class="audit-summary-card">
          <div class="audit-summary-value">${(summary.duration / 1000).toFixed(2)}s</div>
          <div class="audit-summary-label">Session Duration</div>
        </div>
      </div>
    </div>
  `;
}

function renderAuditSummaryView(agentLogs) {
  return `
    <div class="audit-by-agent">
      <h3>Activity by Agent</h3>
      ${Object.entries(agentLogs)
        .map(([agentId, logs]) => {
          const agent = getAgentById(agentId);
          const color = agent ? getAgentColor(agent.type) : "#6b7280";
          const errors = logs.filter((log) => log.type === "error");

          return `
            <div class="audit-agent-row" style="border-left-color: ${color}">
              <div class="audit-agent-name" style="color: ${color}">
                ${agent?.name || agentId}
              </div>
              <div class="audit-agent-stats">
                <span>${logs.length} actions</span>
                ${errors.length > 0 ? `<span class="audit-error-badge">${errors.length} errors</span>` : ""}
              </div>
              <button class="audit-view-btn" data-action="expand-agent-audit" data-agent-id="${agentId}">
                View Logs
              </button>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderAuditDetailsView(agentLogs) {
  return `
    <div class="audit-details">
      ${Object.entries(agentLogs)
        .map(([agentId, logs]) => {
          const agent = getAgentById(agentId);
          const color = agent ? getAgentColor(agent.type) : "#6b7280";

          return `
            <div class="audit-agent-section">
              <h3 style="color: ${color}">${agent?.name || agentId}</h3>
              <div class="audit-log-timeline">
                ${logs
                  .slice(0, 20)
                  .map(
                    (log) => `
                  <div class="audit-log-entry audit-log-${log.type}">
                    <div class="audit-log-time">${new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div class="audit-log-type">${log.type}</div>
                    <div class="audit-log-action">${log.action || log.type}</div>
                  </div>
                `
                  )
                  .join("")}
                ${logs.length > 20 ? `<div class="audit-more">...${logs.length - 20} more entries</div>` : ""}
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderAuditFullDataView(logs) {
  return `
    <div class="audit-full-data">
      <h3>Complete Audit Log (${logs.length} entries)</h3>
      <div class="audit-log-list">
        ${logs
          .slice(0, 100)
          .map(
            (log) => `
          <details class="audit-log-detail">
            <summary class="audit-log-summary">
              <span class="audit-log-id">${log.id}</span>
              <span class="audit-log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
              <span class="audit-log-type audit-log-type-${log.type}">${log.type}</span>
              <span class="audit-log-agent">${log.agentId}</span>
            </summary>
            <pre class="audit-log-data">${JSON.stringify(log, null, 2)}</pre>
          </details>
        `
          )
          .join("")}
        ${logs.length > 100 ? `<div class="audit-more">Showing first 100 of ${logs.length} entries. Export to see all.</div>` : ""}
      </div>
    </div>
  `;
}

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

function getActiveAgentsForStep(step) {
  switch (step) {
    case 0:
      return [];
    case 1:
      return ["docket-fetcher", "document-fetcher", "comment-fetcher", "llm-summarizer", "display-formatter"];
    case 2:
      return [
        "comment-normalizer",
        "duplicate-detector",
        "topic-classifier",
        "argument-extractor",
        "authority-scorer",
        "sentiment-scorer",
        "display-formatter",
      ];
    case 3:
      return ["graph-builder", "summary-generator", "topic-view-builder", "display-formatter"];
    case 4:
      return ["summary-generator", "topic-view-builder", "display-formatter"];
    default:
      return [];
  }
}

function getArchitectureForStep(step) {
  const architectures = {
    0: {
      title: "Docket Selection",
      description: "User chooses a docket ID from the sample list or enters a custom ID",
      dataFlow: [
        {
          stage: "User Input",
          description: "Docket ID entered or selected from dropdown",
          agents: [],
        },
        {
          stage: "Validation",
          description: "Basic format check for docket ID",
          agents: [],
        },
        {
          stage: "Display",
          description: "Show docket input form and educational content",
          agents: ["display-formatter"],
        },
      ],
      inputs: [{ name: "User Action", description: "Click or type docket ID" }],
      processing: [{ name: "Format Check", description: "Validate docket ID pattern" }],
      outputs: [{ name: "Ready State", description: "Button to load docket enabled" }],
      metrics: [{ value: "0", label: "API Calls" }, { value: "<1ms", label: "Response Time" }],
    },
    1: {
      title: "Docket Snapshot",
      description: "Fetch and display docket metadata, documents, and sample comments",
      dataFlow: [
        {
          stage: "API Fetch",
          description: "Parallel fetch of docket, documents, and comments from Regulations.gov",
          agents: ["docket-fetcher", "document-fetcher", "comment-fetcher"],
        },
        {
          stage: "Attachment Processing",
          description: "Parse attachment metadata from API responses",
          agents: ["attachment-processor"],
        },
        {
          stage: "LLM Summary (optional)",
          description: "Generate natural language summary if OpenAI key available",
          agents: ["llm-summarizer"],
        },
        {
          stage: "Display Formatting",
          description: "Format docket info, document list, and comment preview",
          agents: ["display-formatter"],
        },
      ],
      inputs: [
        { name: "Docket ID", description: "Validated docket identifier" },
        { name: "API Key", description: "Regulations.gov API key" },
        { name: "OpenAI Key", description: "Optional for LLM summary" },
      ],
      processing: [
        { name: "HTTP Requests", description: "3+ parallel API calls with include=attachments" },
        { name: "JSON Parsing", description: "Extract data and included attachments" },
        { name: "Metadata Mapping", description: "Link attachments to comments" },
      ],
      outputs: [
        { name: "Docket Metadata", description: "Title, summary, agency, dates" },
        { name: "Document List", description: "12 most recent documents with types" },
        { name: "Sample Comments", description: "20 comments with attachments" },
      ],
      metrics: [
        { value: "3-5", label: "API Calls" },
        { value: "1-3s", label: "Load Time" },
        { value: "12", label: "Documents" },
        { value: "20", label: "Comments" },
      ],
    },
    2: {
      title: "Comment Analysis",
      description: "Process comments through multi-agent pipeline to extract insights",
      dataFlow: [
        {
          stage: "Normalization",
          description: "Clean text, standardize organizations, classify stakeholders",
          agents: ["comment-normalizer"],
        },
        {
          stage: "Duplicate Detection",
          description: "Identify campaigns using MinHash and Jaccard similarity",
          agents: ["duplicate-detector"],
        },
        {
          stage: "Topic Classification",
          description: "Multi-label topic assignment via keyword matching",
          agents: ["topic-classifier"],
        },
        {
          stage: "Argument Extraction",
          description: "Extract claims, detect stance, link evidence",
          agents: ["argument-extractor"],
        },
        {
          stage: "Scoring",
          description: "Calculate authority and sentiment scores",
          agents: ["authority-scorer", "sentiment-scorer"],
        },
        {
          stage: "Visualization",
          description: "Render treemaps, histograms, and comment tables",
          agents: ["display-formatter"],
        },
      ],
      inputs: [
        { name: "Comments", description: "Raw comment text and metadata" },
        { name: "Topic Registry", description: "Canonical policy topics" },
        { name: "Scoring Rules", description: "Authority and sentiment heuristics" },
      ],
      processing: [
        { name: "Text Normalization", description: "Lowercase, remove punctuation, tokenize" },
        { name: "Campaign Clustering", description: "Union-Find algorithm for grouping" },
        { name: "Keyword Matching", description: "Pattern-based classification" },
        { name: "Statistical Scoring", description: "Heuristic-based metrics" },
      ],
      outputs: [
        { name: "Campaign Clusters", description: "Grouped duplicate comments" },
        { name: "Topic Assignments", description: "Multi-label per comment" },
        { name: "Authority Scores", description: "1-10 expertise ratings" },
        { name: "Sentiment Scores", description: "-1 to +1 stance ratings" },
      ],
      metrics: [
        { value: state.results?.comments?.length || "0", label: "Comments Processed" },
        { value: state.results?.summary?.campaignCount || "0", label: "Campaigns Detected" },
        { value: state.results?.topics?.length || "7", label: "Topics Identified" },
        { value: `${state.results?.elapsedMs?.toFixed(0) || "0"}ms`, label: "Processing Time" },
      ],
    },
    3: {
      title: "Agent Workflow Visualization",
      description: "Interactive city-map view of multi-agent collaboration",
      dataFlow: [
        {
          stage: "Graph Construction",
          description: "Build knowledge graph with nodes and edges",
          agents: ["graph-builder"],
        },
        {
          stage: "Agent Orchestration",
          description: "Simulate agent handoffs and data flow",
          agents: [],
        },
        {
          stage: "Visualization Rendering",
          description: "Draw agent bots, connectors, and ledger",
          agents: ["display-formatter"],
        },
      ],
      inputs: [
        { name: "Analysis Results", description: "Topics, arguments, campaigns" },
        { name: "Agent Registry", description: "Agent metadata and capabilities" },
      ],
      processing: [
        { name: "Graph Building", description: "Create nodes for all entities" },
        { name: "Edge Creation", description: "Link relationships with evidence" },
        { name: "Animation State", description: "Agent tick counter for progression" },
      ],
      outputs: [
        { name: "Knowledge Graph", description: "Nodes and edges with evidence IDs" },
        { name: "Visual Workflow", description: "Animated agent city map" },
        { name: "Handoff Ledger", description: "Step-by-step agent actions" },
      ],
      metrics: [
        { value: state.results?.graph?.nodes?.length || "0", label: "Graph Nodes" },
        { value: state.results?.graph?.edges?.length || "0", label: "Graph Edges" },
        { value: "6", label: "Agent Steps" },
      ],
    },
    4: {
      title: "Analyst Output",
      description: "Final summary with source-linked insights and metrics",
      dataFlow: [
        {
          stage: "Summary Generation",
          description: "Create analyst brief with evidence citations",
          agents: ["summary-generator"],
        },
        {
          stage: "Topic Views",
          description: "Build per-topic deep-dive analyses",
          agents: ["topic-view-builder"],
        },
        {
          stage: "Metrics Calculation",
          description: "Compute ROI, volume, and campaign statistics",
          agents: ["summary-generator"],
        },
        {
          stage: "Output Formatting",
          description: "Render summary sections and visualizations",
          agents: ["display-formatter"],
        },
      ],
      inputs: [
        { name: "Knowledge Graph", description: "Complete graph with evidence" },
        { name: "Campaign Data", description: "Clustered duplicates" },
        { name: "Comment Set", description: "All analyzed comments" },
      ],
      processing: [
        { name: "Statistical Aggregation", description: "Count topics, arguments, orgs" },
        { name: "Ranking", description: "Sort by frequency and intensity" },
        { name: "ROI Estimation", description: "Compare manual vs automated time" },
      ],
      outputs: [
        { name: "Summary Sections", description: "Volume, topics, arguments, disagreements" },
        { name: "Topic Views", description: "Per-topic stakeholder breakdowns" },
        { name: "ROI Metrics", description: "Hours saved estimate" },
      ],
      metrics: [
        { value: state.results?.summary?.canonicalUnits || "0", label: "Review Units" },
        { value: state.results?.summary?.hoursSaved?.toFixed(0) || "0", label: "Hours Saved" },
        { value: state.results?.summary?.topTopics?.length || "0", label: "Top Topics" },
      ],
    },
  };

  return architectures[step] || architectures[0];
}
