/**
 * Agent Registry and Transparency System for DocketIQ
 * Color-coded agent types with full auditability
 */

export const AGENT_TYPES = {
  EXTRACT: {
    color: "#8b5cf6", // purple
    label: "Data Extraction",
    description: "Agents that retrieve and extract data from external sources",
  },
  ENRICH: {
    color: "#6366f1", // indigo
    label: "Data Enrichment",
    description: "Agents that enhance, normalize, and process data",
  },
  SCORE: {
    color: "#10b981", // green
    label: "Scoring & Analysis",
    description: "Agents that calculate sentiment, authority, and other metrics",
  },
  ACTION: {
    color: "#f97316", // orange
    label: "Actionable Insights",
    description: "Agents that generate recommendations and actionable outputs",
  },
};

export const AGENT_REGISTRY = [
  {
    id: "docket-fetcher",
    name: "Docket Fetcher",
    type: "EXTRACT",
    model: "REST API Client",
    prompt: "Fetch docket metadata from Regulations.gov API v4 including title, summary, agency, and posted date",
    skills: ["HTTP requests", "JSON parsing", "Error handling", "Rate limiting"],
    tools: ["Regulations.gov API v4", "Fetch API"],
    canBeCalled: ["User action", "loadDocket()"],
    canCall: ["document-fetcher", "comment-fetcher"],
    inputSchema: {
      docketId: "string (e.g., EPA-HQ-OW-2022-0801)",
    },
    outputSchema: {
      docket: "Object with title, summary, agency, dates",
    },
    auditPoints: ["API request", "API response", "Parsed metadata"],
    implementation: {
      file: "src/app.mjs",
      function: "loadDocket()",
      lines: "1424-1430",
      status: "implemented",
    },
    usageInApp: "Called when user clicks a sample docket button in Step 1",
    invokedBy: "User selecting docket → loadDocket() → fetchJson(docketUrl)",
  },
  {
    id: "document-fetcher",
    name: "Document Fetcher",
    type: "EXTRACT",
    model: "REST API Client",
    prompt: "Fetch all documents in a docket including attachments metadata using include=attachments parameter",
    skills: ["Pagination", "Attachment parsing", "Batch requests"],
    tools: ["Regulations.gov API v4", "Fetch API"],
    canBeCalled: ["docket-fetcher"],
    canCall: [],
    inputSchema: {
      docketId: "string",
      pageSize: "number (max 250)",
      includeAttachments: "boolean",
    },
    outputSchema: {
      documents: "Array of document objects with metadata and attachments",
    },
    auditPoints: ["API request URL", "API response", "Attachment extraction", "Document list"],
    implementation: {
      file: "src/app.mjs",
      function: "loadDocket()",
      lines: "1435-1503",
      status: "implemented",
    },
    usageInApp: "Called within loadDocket() to fetch documents for a docket",
    invokedBy: "loadDocket() → Promise.all([fetchJson(docketUrl), fetchJson(documentsUrl)])",
  },
  {
    id: "comment-fetcher",
    name: "Comment Fetcher",
    type: "EXTRACT",
    model: "REST API Client",
    prompt: "Fetch public comments for a document with attachment metadata and submitter information",
    skills: ["Comment pagination", "Attachment mapping", "Submitter normalization"],
    tools: ["Regulations.gov API v4", "Fetch API"],
    canBeCalled: ["docket-fetcher"],
    canCall: ["comment-normalizer"],
    inputSchema: {
      documentId: "string",
      pageSize: "number",
      includeAttachments: "boolean",
    },
    outputSchema: {
      comments: "Array of comment objects with text, submitter, org, attachments",
    },
    auditPoints: ["API request", "Raw comments", "Attachment mapping", "Final comment list"],
    implementation: {
      file: "src/app.mjs",
      function: "loadDocket()",
      lines: "1510-1527",
      status: "implemented",
    },
    usageInApp: "Fetches public comments for the target document in a docket",
    invokedBy: "loadDocket() → fetchJson(commentsUrl) → mapLiveComments()",
  },
  {
    id: "comment-normalizer",
    name: "Comment Normalizer",
    type: "ENRICH",
    model: "Text Processing",
    prompt: "Normalize comment text by removing extra whitespace, standardizing organization names, and extracting stakeholder groups",
    skills: ["Text normalization", "Entity resolution", "Stakeholder classification"],
    tools: ["String manipulation", "Regular expressions"],
    canBeCalled: ["comment-fetcher"],
    canCall: ["duplicate-detector"],
    inputSchema: {
      comments: "Array of raw comment objects",
    },
    outputSchema: {
      normalizedComments: "Array with cleaned text and standardized metadata",
    },
    auditPoints: ["Original text", "Normalized text", "Organization mapping"],
    implementation: {
      file: "src/pipeline.mjs",
      function: "normalizeText(), buildExactGroups()",
      lines: "176-178, 327-347",
      status: "implemented",
    },
    usageInApp: "Normalizes text and builds exact duplicate groups in pipeline",
    invokedBy: "runPipeline() → buildExactGroups() → normalizeText()",
  },
  {
    id: "duplicate-detector",
    name: "Duplicate Detector",
    type: "ENRICH",
    model: "MinHash + Jaccard Similarity",
    prompt: "Identify exact and near-duplicate comments to detect coordinated campaigns using minhash signatures and token similarity",
    skills: ["Text similarity", "Campaign detection", "Clustering", "Union-Find algorithm"],
    tools: ["MinHash", "Jaccard index", "Tokenization", "Stop words filtering"],
    canBeCalled: ["comment-normalizer"],
    canCall: ["topic-classifier"],
    inputSchema: {
      comments: "Array of normalized comments",
    },
    outputSchema: {
      clusters: "Array of campaign clusters with representatives",
      exactGroups: "Exact duplicate groups",
    },
    auditPoints: ["Token extraction", "MinHash signatures", "Similarity scores", "Cluster formation"],
    implementation: {
      file: "src/pipeline.mjs",
      function: "detectCampaigns()",
      lines: "349-418",
      status: "implemented",
    },
    usageInApp: "Detects coordinated campaigns using MinHash and Jaccard similarity",
    invokedBy: "runPipeline() → detectCampaigns() → UnionFind clustering",
  },
  {
    id: "topic-classifier",
    name: "Topic Classifier",
    type: "ENRICH",
    model: "Keyword Matching + Pattern Recognition",
    prompt: "Classify comments into policy topics based on keyword matching against canonical topic registry",
    skills: ["Multi-label classification", "Keyword extraction", "Topic inference"],
    tools: ["Keyword dictionaries", "Pattern matching"],
    canBeCalled: ["duplicate-detector"],
    canCall: ["argument-extractor"],
    inputSchema: {
      comment: "Comment object with source text",
      topicRegistry: "Array of topics with keywords",
    },
    outputSchema: {
      topicIds: "Array of matched topic IDs",
      confidence: "Confidence scores per topic",
    },
    auditPoints: ["Input text", "Matched keywords", "Topic assignments", "Confidence scores"],
    implementation: {
      file: "src/pipeline.mjs",
      function: "inferTopics()",
      lines: "248-259",
      status: "implemented",
    },
    usageInApp: "Classifies comments into topics using keyword matching",
    invokedBy: "runPipeline() → extractComment() → inferTopics()",
  },
  {
    id: "argument-extractor",
    name: "Argument Extractor",
    type: "ENRICH",
    model: "Rule-based NLP",
    prompt: "Extract normalized arguments, stance (support/oppose/mixed), and evidence spans from comment text",
    skills: ["Claim extraction", "Stance detection", "Evidence linking"],
    tools: ["Argument rules", "Stance keywords", "Pattern matching"],
    canBeCalled: ["topic-classifier"],
    canCall: ["authority-scorer", "sentiment-scorer"],
    inputSchema: {
      comment: "Comment with topics",
      topicIds: "Array of topic IDs",
    },
    outputSchema: {
      arguments: "Array of {label, stance, topicId, evidenceSpan}",
    },
    auditPoints: ["Matched argument patterns", "Stance keywords", "Evidence extraction"],
    implementation: {
      file: "src/pipeline.mjs",
      function: "inferArguments()",
      lines: "283-310",
      status: "implemented",
    },
    usageInApp: "Extracts arguments and stances from comment text",
    invokedBy: "runPipeline() → extractComment() → inferArguments()",
  },
  {
    id: "authority-scorer",
    name: "Authority Scorer",
    type: "SCORE",
    model: "Heuristic Scoring",
    prompt: "Score comment authority from 1-10 based on organization type, detail level, evidence quality, and expertise signals",
    skills: ["Expertise detection", "Detail analysis", "Organization classification"],
    tools: ["Scoring rubric", "Pattern matching"],
    canBeCalled: ["argument-extractor"],
    canCall: [],
    inputSchema: {
      comment: "Comment with org, text, arguments",
    },
    outputSchema: {
      authorityScore: "1-10 integer",
      reason: "Explanation string",
    },
    auditPoints: ["Scoring factors", "Score calculation", "Explanation generation"],
    implementation: {
      file: "src/app.mjs",
      function: "scoreAuthority()",
      lines: "965-994",
      status: "implemented",
    },
    usageInApp: "Scores comment authority based on organization and text length",
    invokedBy: "buildCommentTriageRows() → scoreAuthority()",
  },
  {
    id: "sentiment-scorer",
    name: "Sentiment Scorer",
    type: "SCORE",
    model: "Stance-based Analysis",
    prompt: "Calculate sentiment from -1.0 to 1.0 based on stance distribution, positive/negative keywords, and argument intensity",
    skills: ["Sentiment analysis", "Stance aggregation", "Keyword weighting"],
    tools: ["Sentiment keywords", "Stance mapping"],
    canBeCalled: ["argument-extractor"],
    canCall: [],
    inputSchema: {
      comment: "Comment with arguments and stance",
    },
    outputSchema: {
      sentimentScore: "-1.0 to 1.0 float",
      label: "support/oppose/mixed",
      explanation: "Reason string",
    },
    auditPoints: ["Stance counts", "Keyword matches", "Score calculation"],
    implementation: {
      file: "src/app.mjs",
      function: "scorePosition()",
      lines: "996-1067",
      status: "implemented",
    },
    usageInApp: "Calculates sentiment from argument stances and keywords",
    invokedBy: "buildCommentTriageRows() → scorePosition()",
  },
  {
    id: "graph-builder",
    name: "Knowledge Graph Builder",
    type: "ENRICH",
    model: "Graph Construction",
    prompt: "Build knowledge graph with nodes (comments, topics, arguments, orgs, campaigns) and edges (relationships) with evidence tracing",
    skills: ["Node creation", "Edge linking", "Evidence tracking", "Deduplication"],
    tools: ["Graph data structures", "Set operations"],
    canBeCalled: ["argument-extractor"],
    canCall: ["summary-generator"],
    inputSchema: {
      comments: "All comments",
      extractions: "Topic/argument data",
      clusters: "Campaign clusters",
    },
    outputSchema: {
      nodes: "Array of graph nodes with type, label, count, evidence",
      edges: "Array of edges with source, target, relation, evidence",
    },
    auditPoints: ["Node creation", "Edge creation", "Evidence linking", "Final graph"],
    implementation: {
      file: "src/pipeline.mjs",
      function: "buildKnowledgeGraph()",
      lines: "420-525",
      status: "implemented",
    },
    usageInApp: "Builds knowledge graph with nodes and edges for visualization",
    invokedBy: "runPipeline() → buildKnowledgeGraph()",
  },
  {
    id: "summary-generator",
    name: "Summary Generator",
    type: "ACTION",
    model: "Statistical Aggregation",
    prompt: "Generate analyst brief with volume stats, top topics, recurring arguments, disagreements, and ROI estimates - all source-linked",
    skills: ["Statistical analysis", "Text generation", "Evidence citation"],
    tools: ["Aggregation functions", "Template generation"],
    canBeCalled: ["graph-builder"],
    canCall: ["topic-view-builder"],
    inputSchema: {
      graph: "Knowledge graph",
      clusters: "Campaign data",
      comments: "Full comment set",
    },
    outputSchema: {
      summarySections: "Array of {title, body, evidenceIds}",
      metrics: "ROI, volume, campaign count",
    },
    auditPoints: ["Metric calculations", "Top items selection", "Summary generation", "Evidence linking"],
    implementation: {
      file: "src/pipeline.mjs",
      function: "summarize()",
      lines: "527-686",
      status: "implemented",
    },
    usageInApp: "Generates analyst brief with stats, arguments, and ROI",
    invokedBy: "runPipeline() → summarize()",
  },
  {
    id: "topic-view-builder",
    name: "Topic View Builder",
    type: "ACTION",
    model: "Topic-focused Aggregation",
    prompt: "Build per-topic views with stakeholder breakdowns, argument distribution, and evidence trails for deep-dive analysis",
    skills: ["Topic filtering", "Stakeholder counting", "Argument ranking"],
    tools: ["Filtering", "Grouping", "Sorting"],
    canBeCalled: ["summary-generator"],
    canCall: [],
    inputSchema: {
      comments: "All comments",
      extractions: "Topic/argument data",
      topicRegistry: "Available topics",
    },
    outputSchema: {
      topicViews: "Array of topic-specific analyses with evidence",
    },
    auditPoints: ["Topic filtering", "Stakeholder counts", "Argument ranking", "Evidence collection"],
    implementation: {
      file: "src/pipeline.mjs",
      function: "buildTopicViews()",
      lines: "688-737",
      status: "implemented",
    },
    usageInApp: "Builds per-topic views with stakeholder breakdowns",
    invokedBy: "runPipeline() → buildTopicViews()",
  },
  {
    id: "plain-language-translator",
    name: "Plain Language Translator",
    type: "ACTION",
    model: "OpenAI GPT-4",
    prompt: "Translate complex regulatory language into plain, accessible English that meets Plain Writing Act requirements. Simplify jargon, break down long sentences, and explain technical terms. Target 8th-grade reading level while maintaining accuracy.",
    skills: ["Regulatory text simplification", "Readability analysis", "Jargon translation", "Plain Writing Act compliance"],
    tools: ["OpenAI API", "Readability metrics", "Regulatory terminology database"],
    canBeCalled: ["docket-fetcher", "document-fetcher"],
    canCall: [],
    inputSchema: {
      text: "Complex regulatory text",
      maxLength: "Target word count for summary",
    },
    outputSchema: {
      plainText: "Simplified text at 8th-grade level",
      readabilityScore: "Flesch-Kincaid grade level",
      technicalTerms: "Array of explained terms",
    },
    auditPoints: ["Original text complexity", "LLM API request", "Simplified output", "Readability score"],
    implementation: {
      file: "src/app.mjs",
      function: "translateToPlainLanguage()",
      lines: "TBD",
      status: "in-progress",
    },
    usageInApp: "Generates plain-language summaries of dockets and regulations",
    invokedBy: "User action → translateToPlainLanguage() → OpenAI API",
  },
  {
    id: "heatmap-generator",
    name: "Document Heat-Map Generator",
    type: "ACTION",
    model: "Statistical Aggregation",
    prompt: "Generate visual heat-maps showing comment density and engagement patterns across document sections. Identify hot spots where public attention concentrates.",
    skills: ["Comment density calculation", "Section-level aggregation", "Visual encoding", "Engagement scoring"],
    tools: ["Comment-to-document mapping", "Color gradient generation", "Statistical aggregation"],
    canBeCalled: ["summary-generator", "User action"],
    canCall: [],
    inputSchema: {
      comments: "All comments with document references",
      documents: "Document structure with sections",
    },
    outputSchema: {
      heatmapData: "Array of {section, commentCount, engagementScore, color}",
      topSections: "Sections with highest comment density",
    },
    auditPoints: ["Comment-to-section mapping", "Density calculation", "Heat-map generation"],
    implementation: {
      file: "src/app.mjs",
      function: "generateDocumentHeatMap()",
      lines: "TBD",
      status: "in-progress",
    },
    usageInApp: "Visualizes which document sections receive most public comments",
    invokedBy: "renderHeatMapPanel() → generateDocumentHeatMap()",
  },
  {
    id: "timeline-analyzer",
    name: "Comment Timeline Analyzer",
    type: "ENRICH",
    model: "Time-Series Analysis",
    prompt: "Analyze comment submission patterns over time to identify surge periods, coordinated campaigns, and temporal trends. Detect unusual submission rates.",
    skills: ["Time-series analysis", "Surge detection", "Campaign timing identification", "Trend analysis"],
    tools: ["Date parsing", "Statistical analysis", "Anomaly detection"],
    canBeCalled: ["summary-generator"],
    canCall: ["duplicate-detector"],
    inputSchema: {
      comments: "Comments with timestamps",
    },
    outputSchema: {
      timeline: "Array of {date, count, isAnomaly}",
      surges: "Detected surge periods",
      dailyAverage: "Average comments per day",
    },
    auditPoints: ["Date extraction", "Timeline construction", "Anomaly detection", "Surge identification"],
    implementation: {
      file: "src/pipeline.mjs",
      function: "analyzeCommentTimeline()",
      lines: "TBD",
      status: "in-progress",
    },
    usageInApp: "Identifies coordinated campaign timing and organic vs. organized response patterns",
    invokedBy: "runPipeline() → analyzeCommentTimeline()",
  },
  {
    id: "fraud-detector",
    name: "Advanced Fraud Detector",
    type: "SCORE",
    model: "Pattern Recognition + ML",
    prompt: "Detect computer-generated comments, bot submissions, and potentially malattributed comments using pattern analysis, submission rate anomalies, and linguistic markers.",
    skills: ["Bot detection", "Submission rate analysis", "Linguistic pattern recognition", "Malattribution detection"],
    tools: ["Pattern matching", "Rate limiting analysis", "N-gram analysis", "Submission metadata"],
    canBeCalled: ["duplicate-detector", "timeline-analyzer"],
    canCall: [],
    inputSchema: {
      comments: "Comments with metadata (IP, timestamp, text)",
      submissionRates: "Comments per minute/hour",
    },
    outputSchema: {
      suspiciousComments: "Array of flagged comment IDs",
      botScore: "0-1 probability of being bot-generated",
      flags: "Array of detected issues",
    },
    auditPoints: ["Rate analysis", "Pattern detection", "Bot scoring", "Flag generation"],
    implementation: {
      file: "src/pipeline.mjs",
      function: "detectFraudulentComments()",
      lines: "TBD",
      status: "in-progress",
    },
    usageInApp: "Flags potentially fraudulent, bot-generated, or malattributed comments",
    invokedBy: "runPipeline() → detectFraudulentComments()",
  },
];

/**
 * Get agent color by type
 */
export function getAgentColor(type) {
  return AGENT_TYPES[type]?.color || "#6b7280";
}

/**
 * Get agents by type
 */
export function getAgentsByType(type) {
  return AGENT_REGISTRY.filter((agent) => agent.type === type);
}

/**
 * Get agent by ID
 */
export function getAgentById(id) {
  return AGENT_REGISTRY.find((agent) => agent.id === id);
}

/**
 * Get all agents that can call a specific agent
 */
export function getCallers(agentId) {
  return AGENT_REGISTRY.filter((agent) =>
    agent.canCall?.includes?.(agentId)
  );
}

/**
 * Get all agents that a specific agent can call
 */
export function getCallees(agentId) {
  const agent = getAgentById(agentId);
  if (!agent || !agent.canCall) return [];
  return agent.canCall.map(getAgentById).filter(Boolean);
}

/**
 * Get agent call graph
 */
export function getAgentCallGraph() {
  const nodes = AGENT_REGISTRY.map((agent) => ({
    id: agent.id,
    name: agent.name,
    type: agent.type,
    color: getAgentColor(agent.type),
  }));

  const edges = [];
  AGENT_REGISTRY.forEach((agent) => {
    if (agent.canCall) {
      agent.canCall.forEach((calleeId) => {
        edges.push({
          source: agent.id,
          target: calleeId,
          label: "calls",
        });
      });
    }
  });

  return { nodes, edges };
}
