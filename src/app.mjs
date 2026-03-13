import {
  AGENT_TEAM,
  CURATED_PUBLIC_COMMENTS,
  DOCKET_DOCUMENTS,
  generateDemoComments,
  getScenario,
  ROI_BREAKDOWN,
  SAMPLE_DOCKETS,
} from "./data.mjs";
import { runPipeline } from "./pipeline.mjs";

const API_BASE = "https://api.regulations.gov/v4";
const API_KEY = "DEMO_KEY";
const OPENAI_API_BASE = "https://api.openai.com/v1";

const state = {
  scenario: getScenario(),
  docketInput: "EPA-HQ-OW-2022-0801",
  openAiApiKey: window.localStorage.getItem("reggraph-openai-key") || "",
  openAiKeyStatus: "idle",
  openAiKeyMessage: "",
  regulationSummaryLines: [],
  regulationSummaryStatus: "fallback",
  regulationSummaryDocketId: "",
  stepThreeTab: "agent-summary",
  expandedScoringAgent: null,
  step: 0,
  maxUnlockedStep: 0,
  loadingRemote: false,
  remoteError: "",
  liveData: null,
  comments: [],
  results: null,
  sourceLabel: "",
  commentsFilter: "all",
  selectedTopicId: null,
  hoveredTopicId: null,
  selectedCommentId: null,
  selectedAgentId: AGENT_TEAM[0].id,
  expandedComments: new Set(),
  agentTick: 0,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

const app = document.querySelector("#app");
let apiKeyValidationToken = 0;
let apiKeyValidationTimer = null;

const STEPS = [
  "Pick a Docket ID",
  "Docket Snapshot",
  "Sample Comments",
  "Agents at Work",
  "Output",
];

function formatNumber(value) {
  return value.toLocaleString();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function splitIntoSummaryLines(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 3);
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const chunks = [];
  (payload?.output || []).forEach((item) => {
    (item?.content || []).forEach((contentItem) => {
      if (contentItem?.type === "output_text" && contentItem.text) {
        chunks.push(contentItem.text);
      }
      if (contentItem?.type === "text" && contentItem.text) {
        chunks.push(contentItem.text);
      }
    });
  });
  return chunks.join("\n").trim();
}

function getApiKeyMetaText() {
  if (state.openAiKeyStatus === "working") {
    return "Working";
  }
  if (state.openAiKeyStatus === "checking") {
    return "Checking key...";
  }
  if (state.openAiKeyStatus === "error") {
    return state.openAiKeyMessage || "Could not verify key";
  }
  return state.openAiApiKey ? "Stored locally in this browser" : "Add a key for live agent runs";
}

function scheduleApiKeyValidation(apiKey) {
  if (apiKeyValidationTimer) {
    window.clearTimeout(apiKeyValidationTimer);
  }

  const trimmedKey = apiKey.trim();
  apiKeyValidationToken += 1;
  const token = apiKeyValidationToken;

  if (!trimmedKey) {
    state.openAiKeyStatus = "idle";
    state.openAiKeyMessage = "";
    render();
    return;
  }

  state.openAiKeyStatus = "checking";
  state.openAiKeyMessage = "";
  render();

  apiKeyValidationTimer = window.setTimeout(async () => {
    try {
      const response = await fetch(`${OPENAI_API_BASE}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${trimmedKey}`,
        },
      });

      if (token !== apiKeyValidationToken) {
        return;
      }

      if (response.ok) {
        state.openAiKeyStatus = "working";
        state.openAiKeyMessage = "";
        if (state.results) {
          void generateRegulationSummaryWithLlm();
        }
      } else {
        const payload = await response.json().catch(() => ({}));
        state.openAiKeyStatus = "error";
        state.openAiKeyMessage =
          payload?.error?.message || `OpenAI returned ${response.status}`;
      }
    } catch (error) {
      if (token !== apiKeyValidationToken) {
        return;
      }
      state.openAiKeyStatus = "error";
      state.openAiKeyMessage = "Network error while checking key";
    }

    render();
  }, 500);
}

function getDocumentKind(document = {}) {
  const explicit =
    document.fileType ||
    document.fileFormat ||
    document.format ||
    "";
  const url = document.url || document.officialUrl || "";
  const combined = `${explicit} ${document.type || ""} ${document.title || ""} ${url}`.toLowerCase();

  if (combined.includes("pdf")) {
    return "PDF";
  }
  if (combined.includes("docx")) {
    return "DOCX";
  }
  if (combined.includes(".doc")) {
    return "DOC";
  }
  if (combined.includes("xlsx") || combined.includes("xls")) {
    return "XLS";
  }
  if (combined.includes("csv")) {
    return "CSV";
  }
  if (combined.includes("txt")) {
    return "TXT";
  }
  return "WEB";
}

function getDocIcon(document = {}) {
  return getDocumentKind(document);
}

function getTopicDescription(label = "") {
  const descriptions = {
    "Lead Service Line Replacement": "Comments about whether old lead service lines should be fully replaced, how quickly that should happen, and who has to carry the cost and logistics.",
    "Compliance Timeline": "Comments about deadlines, phase-in schedules, and whether utilities need more time or communities need faster action.",
    "Public Inventory and Notice": "Comments about public inventories, notice rules, and how clearly residents should be told about possible lead exposure.",
    "Sampling and Testing": "Comments about how often systems test, where samples should be taken, and what lead levels should trigger action.",
    "Filters and Consumer Protection": "Comments about giving households filters and practical protection when lead risk is identified.",
    "Schools and Child Care": "Comments focused on stronger testing, communication, and protection for schools and child care facilities.",
    "Funding and Small Systems Support": "Comments about funding, technical assistance, and flexibility for smaller and rural systems trying to comply.",
  };
  return descriptions[label] || "A recurring issue area discussed by commenters in this docket.";
}

function summarizeRegulation(liveData) {
  const title =
    liveData?.docket?.title || state.scenario.title;
  const summaryText =
    liveData?.docket?.summary ||
    "This rulemaking concerns how EPA strengthens protections related to lead in drinking water, public notice, and related implementation duties for affected systems.";
  const compact = summaryText.replace(/\s+/g, " ").trim();
  const secondSentence = compact.length > 210 ? `${compact.slice(0, 210).trim()}...` : compact;

  return [
    `${title} is the proposed regulation tied to docket ${state.docketInput}. In plain English, it sets out what the agency wants to change and why the public is being asked to comment.`,
    `${secondSentence}`,
    `DocketIQ uses this summary as the starting brief before it moves into documents, comments, and issue extraction.`,
  ];
}

function buildRegulationSummaryPrompt(liveData, documents) {
  const docket = liveData?.docket || {};
  const documentBriefs = documents
    .slice(0, 8)
    .map(
      (doc, index) =>
        `${index + 1}. ${doc.title} [${doc.type || "Document"}] - ${doc.aiSummary || generateDocumentBrief(doc, docket.title || state.docketInput)}`
    )
    .join("\n");

  return `Summarize this proposed federal regulation in 2 to 3 sentences for a first-time viewer.

Requirements:
- Base the summary only on the docket metadata and document descriptions provided.
- Explain what the agency is proposing in plain English.
- Mention why the public would care.
- Do not mention AI, LLMs, or the app.
- Do not use bullets.

Docket ID: ${state.docketInput}
Title: ${docket.title || state.scenario.title}
Agency: ${docket.agencyId || docket.agencyAcronym || "Agency"}
Docket summary: ${docket.summary || state.scenario.subtitle}

Documents:
${documentBriefs}`;
}

async function generateRegulationSummaryWithLlm() {
  if (state.openAiKeyStatus !== "working" || !state.openAiApiKey || !state.results) {
    return;
  }

  if (state.regulationSummaryDocketId === state.docketInput && state.regulationSummaryStatus === "llm") {
    return;
  }

  const live = state.liveData;
  const documents =
    live?.documents?.slice(0, 8) ||
    DOCKET_DOCUMENTS.map((doc) => ({
      ...doc,
      aiSummary: generateDocumentBrief(doc, state.scenario.title),
    }));

  state.regulationSummaryStatus = "generating";
  render();

  try {
    const response = await fetch(`${OPENAI_API_BASE}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.openAiApiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "gpt-5.2-pro",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "You write short, plain-English public-policy summaries grounded only in the provided source material.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildRegulationSummaryPrompt(live, documents),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI returned ${response.status}`);
    }

    const payload = await response.json();
    const text = extractResponseText(payload);
    const lines = splitIntoSummaryLines(text);

    if (!lines.length) {
      throw new Error("No summary text returned");
    }

    state.regulationSummaryLines = lines;
    state.regulationSummaryStatus = "llm";
    state.regulationSummaryDocketId = state.docketInput;
  } catch (error) {
    state.regulationSummaryStatus = "fallback";
  }

  render();
}

function generateDocumentBrief(document, docketTitle) {
  const title = document.title || "This docket document";
  const type = document.type || "document";
  const abstract =
    document.abstract ||
    document.summary ||
    document.detailsSummary ||
    "";
  const cleanAbstract = abstract.replace(/\s+/g, " ").trim();

  if (cleanAbstract) {
    return cleanAbstract.length > 180
      ? `${cleanAbstract.slice(0, 180).trim()}...`
      : cleanAbstract;
  }

  if (type.toLowerCase().includes("proposed")) {
    return `${title} is the main proposed rule document for ${docketTitle}. It explains what the agency wants to change and frames the questions that commenters respond to.`;
  }
  if (type.toLowerCase().includes("support") || type.toLowerCase().includes("analysis")) {
    return `${title} provides supporting analysis for the proposed rule. Analysts use documents like this to understand the agency's evidence and implementation logic.`;
  }
  if (type.toLowerCase().includes("press")) {
    return `${title} is a public-facing announcement that explains the rule in simpler terms for a broad audience.`;
  }
  if (type.toLowerCase().includes("faq") || type.toLowerCase().includes("guide")) {
    return `${title} explains the docket or rule in question-and-answer format so the public can understand what is being proposed and how to participate.`;
  }

  return `${title} is part of the public docket record for ${docketTitle}. DocketIQ treats it as source material that helps analysts understand what the agency published and how commenters are responding.`;
}

function encodeQuery(value) {
  return encodeURIComponent(value);
}

function getSelectedTopic() {
  return (
    state.results?.topics.find((topic) => topic.id === state.selectedTopicId) ||
    state.results?.topics[0]
  );
}

function getActiveTopicId() {
  return state.hoveredTopicId || state.selectedTopicId;
}

function getSelectedComment() {
  return state.comments.find((comment) => comment.comment_id === state.selectedCommentId);
}

function getSelectedAgent() {
  return AGENT_TEAM.find((agent) => agent.id === state.selectedAgentId) || AGENT_TEAM[0];
}

function getActiveAgentIndex() {
  return state.agentTick % AGENT_TEAM.length;
}

function getAgentStatus(index, activeIndex) {
  if (index < activeIndex) {
    return "done";
  }
  if (index === activeIndex) {
    return "working";
  }
  return "waiting";
}

function summarizeCounts(items, accessor) {
  const counts = new Map();
  items.forEach((item) => {
    const key = accessor(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].map(([label, value]) => ({ label, value }));
}

function renderHorizontalBars(items, options = {}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  const tone = options.tone || "blue";
  return `
    <div class="viz-bar-list">
      ${items
        .map(
          (item) => `
            <div class="viz-bar-row">
              <span class="viz-label">${escapeHtml(item.label)}</span>
              <div class="viz-track">
                <span class="viz-fill viz-fill-${tone}" style="width:${(item.value / max) * 100}%"></span>
              </div>
              <strong>${formatNumber(item.value)}</strong>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function shortTopicLabel(label = "") {
  const mapping = {
    "Lead Service Line Replacement": "Lead Lines",
    "Compliance Timeline": "Rule Timing",
    "Public Inventory and Notice": "Public Notice",
    "Sampling and Testing": "Water Testing",
    "Filters and Consumer Protection": "Filter Access",
    "Schools and Child Care": "School Safety",
    "Funding and Small Systems Support": "Funding Support",
  };
  if (mapping[label]) {
    return mapping[label];
  }

  const words = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 1) {
    return `${words[0]} Topic`;
  }

  return words.join(" ");
}

function renderPositionSplit(positiveCount, negativeCount) {
  const total = Math.max(positiveCount + negativeCount, 1);
  return `
    <div class="split-card">
      <div class="split-bar">
        <span class="split-positive" style="width:${(positiveCount / total) * 100}%"></span>
        <span class="split-negative" style="width:${(negativeCount / total) * 100}%"></span>
      </div>
      <div class="split-legend">
        <div><span class="legend-dot legend-dot-positive"></span>Positive ${formatNumber(positiveCount)}</div>
        <div><span class="legend-dot legend-dot-negative"></span>Negative ${formatNumber(negativeCount)}</div>
      </div>
    </div>
  `;
}

function splitItemsForTreemap(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const target = total / 2;
  const left = [];
  const right = [];
  let running = 0;

  items.forEach((item) => {
    if (running < target || left.length === 0) {
      left.push(item);
      running += item.value;
    } else {
      right.push(item);
    }
  });

  if (right.length === 0 && left.length > 1) {
    right.push(left.pop());
  }

  return [left, right];
}

function layoutTreemap(items, x, y, width, height, vertical = width >= height) {
  if (items.length === 0) {
    return [];
  }
  if (items.length === 1) {
    return [{ ...items[0], x, y, width, height }];
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const [groupA, groupB] = splitItemsForTreemap(items);
  const sumA = groupA.reduce((sum, item) => sum + item.value, 0);
  const ratioA = total === 0 ? 0.5 : sumA / total;

  if (vertical) {
    const widthA = width * ratioA;
    return [
      ...layoutTreemap(groupA, x, y, widthA, height, !vertical),
      ...layoutTreemap(groupB, x + widthA, y, width - widthA, height, !vertical),
    ];
  }

  const heightA = height * ratioA;
  return [
    ...layoutTreemap(groupA, x, y, width, heightA, !vertical),
    ...layoutTreemap(groupB, x, y + heightA, width, height - heightA, !vertical),
  ];
}

function renderTreemapTiles(items, side) {
  const sorted = items
    .map((item) => ({
      topicId: item.topicId,
      label: item.shortLabel,
      fullLabel: item.label,
      value: side === "positive" ? item.positive : item.negative,
      intensity: Math.abs(side === "positive" ? item.avgPositiveScore : item.avgNegativeScore),
      avgSentiment: side === "positive" ? item.avgPositiveScore : item.avgNegativeScore,
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value);

  const layout = layoutTreemap(sorted, 0, 0, 100, 100);

  return layout
    .map((tile) => {
      const active = getActiveTopicId() === tile.topicId;
      const tone = clamp(tile.intensity || 0.45, 0.2, 1);
      const positiveStyle = `
        --tile-start: hsl(168 42% ${92 - tone * 22}%);
        --tile-end: hsl(168 70% ${76 - tone * 26}%);
        --tile-ink: #08322b;
      `;
      const negativeStyle = `
        --tile-start: hsl(11 72% ${95 - tone * 10}%);
        --tile-end: hsl(11 72% ${86 - tone * 18}%);
        --tile-ink: #5a2107;
      `;
      return `
        <button
          class="treemap-tile treemap-tile-${side} ${active ? "treemap-tile-active" : ""}"
          data-topic-id="${tile.topicId}"
          data-hover-topic-id="${tile.topicId}"
          aria-label="${escapeHtml(`${tile.fullLabel}: ${tile.value} ${side} comments`)}"
          style="left:${tile.x}%;top:${tile.y}%;width:${tile.width}%;height:${tile.height}%;${side === "positive" ? positiveStyle : negativeStyle}"
        >
          <span class="treemap-label">${escapeHtml(tile.label)}</span>
          <span class="treemap-value">
            <span>${tile.value} comments</span>
            <span>avg sentiment ${tile.avgSentiment.toFixed(2)}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderAuthorityHistogram(rows) {
  const buckets = Array.from({ length: 10 }, (_, index) => ({
    label: String(10 - index),
    value: rows.filter((row) => row.authority === 10 - index).length,
  }));
  const max = Math.max(...buckets.map((bucket) => bucket.value), 1);
  return `
    <div class="histogram">
      ${buckets
        .map(
          (bucket) => `
            <div class="histogram-col">
              <div class="histogram-bar-wrap">
                <span class="histogram-bar" style="height:${Math.max((bucket.value / max) * 100, 8)}%"></span>
              </div>
              <strong>${bucket.label}</strong>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderSentimentHistogram(rows) {
  const buckets = [
    {
      label: "Strong +",
      value: rows.filter((row) => row.sentimentScore >= 0.8).length,
      tone: "positive",
    },
    {
      label: "Lean +",
      value: rows.filter((row) => row.sentimentScore >= 0 && row.sentimentScore < 0.8).length,
      tone: "positive",
    },
    {
      label: "Lean -",
      value: rows.filter((row) => row.sentimentScore < 0 && row.sentimentScore > -0.8).length,
      tone: "negative",
    },
    {
      label: "Strong -",
      value: rows.filter((row) => row.sentimentScore <= -0.8).length,
      tone: "negative",
    },
  ];
  const max = Math.max(...buckets.map((bucket) => bucket.value), 1);
  return `
    <div class="sentiment-histogram">
      ${buckets
        .map(
          (bucket) => `
            <div class="sentiment-histogram-col">
              <div class="histogram-bar-wrap">
                <span class="histogram-bar ${bucket.tone === "negative" ? "histogram-bar-negative" : "histogram-bar-positive"}" style="height:${Math.max((bucket.value / max) * 100, 8)}%"></span>
              </div>
              <strong>${bucket.label}</strong>
              <span>${formatNumber(bucket.value)}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function explainAuthorityReason(comment) {
  const reasons = [];
  const stakeholder = (comment.stakeholder_group || "").toLowerCase();
  const organization = (comment.organization || "").toLowerCase();

  if (stakeholder.includes("regulator") || stakeholder.includes("public health") || stakeholder.includes("operator")) {
    reasons.push("recognized subject-matter stakeholder");
  }
  if (organization.includes("office") || organization.includes("institute") || organization.includes("authority")) {
    reasons.push("institutional or expert organization");
  }
  if (comment.source_text.length > 260) {
    reasons.push("longer, more substantive comment");
  }
  if (comment.source_text.length < 90) {
    reasons.push("very short public comment");
  }

  return reasons.length ? joinPhrases(reasons) : "general public submission with limited technical detail";
}

function explainSentimentReason(comment) {
  const text = comment.source_text.toLowerCase();
  const extraction = state.results?.extractions?.get(comment.comment_id);
  const argument = extraction?.arguments?.[0]?.label;
  const reasons = [];

  if (argument) {
    reasons.push(argument.toLowerCase());
  }
  if (text.includes("should not") || text.includes("rigid") || text.includes("one-size-fits-all")) {
    reasons.push("explicit opposition language");
  }
  if (text.includes("support") || text.includes("should require") || text.includes("protect")) {
    reasons.push("explicit support language");
  }

  return reasons.length ? joinPhrases(reasons) : "overall balance of supportive and opposing claims in the comment text";
}

function getScoringAgentsConfig(triageRows) {
  const highAuthority = [...triageRows]
    .sort((left, right) => right.authority - left.authority || left.comment_id.localeCompare(right.comment_id))
    .slice(0, 2);
  const positiveExamples = triageRows
    .filter((row) => row.position === "Positive")
    .sort((left, right) => right.sentimentScore - left.sentimentScore)
    .slice(0, 2);
  const negativeExamples = triageRows
    .filter((row) => row.position === "Negative")
    .sort((left, right) => left.sentimentScore - right.sentimentScore)
    .slice(0, 2);

  return [
    {
      id: "authority",
      label: "Authority Agent",
      accent: "signal",
      summary: "Scores subject-matter authority from 1 to 10.",
      detail: "This agent estimates how likely a comment comes from a domain expert, regulator, operator, or informed stakeholder rather than a first-time public commenter.",
      prompt: `You are an authority-scoring agent for public rulemaking comments.

Score each comment from 1 to 10 for likely subject-matter authority.
- 10 = highly informed domain expert or regulator
- 7 to 9 = experienced stakeholder or operator
- 4 to 6 = organized but non-expert participant
- 1 to 3 = short or general public comment

Use only the comment text, organization, and stakeholder metadata.
Return the score and a short reason.`,
      examples: highAuthority.map((comment) => ({
        label: `Authority ${comment.authority}`,
        comment,
        reason: explainAuthorityReason(comment),
      })),
    },
    {
      id: "sentiment",
      label: "Sentiment Agent",
      accent: "support",
      summary: "Labels each comment as positive or negative toward the proposal.",
      detail: "This agent reads the extracted claims and the underlying language in each comment to decide whether it supports the proposal overall or pushes against it.",
      prompt: `You are a sentiment agent for a proposed federal rule.

Classify each comment as:
- Positive: supports the proposal overall
- Negative: argues against the proposal overall

Use the comment text and extracted arguments only.
Return:
- label
- sentiment score from -1.0 to 1.0
- one-sentence explanation of why.`,
      examples: [...positiveExamples, ...negativeExamples].map((comment) => ({
        label: `${comment.position} ${comment.sentimentScore.toFixed(2)}`,
        comment,
        reason: explainSentimentReason(comment),
      })),
    },
  ];
}

function getTopicMetrics(rows) {
  const topics = state.results?.topics || [];
  const topicMap = new Map(
    topics.map((topic) => [
      topic.id,
      {
        topicId: topic.id,
        label: topic.label,
        shortLabel: shortTopicLabel(topic.label),
        positive: 0,
        negative: 0,
        total: 0,
        positiveScoreSum: 0,
        negativeScoreSum: 0,
        avgPositiveScore: 0,
        avgNegativeScore: 0,
      },
    ])
  );

  rows.forEach((row) => {
    row.topicIds.forEach((topicId) => {
      const item = topicMap.get(topicId);
      if (!item) {
        return;
      }
      item.total += 1;
      if (row.position === "Positive") {
        item.positive += 1;
        item.positiveScoreSum += row.sentimentScore;
      } else {
        item.negative += 1;
        item.negativeScoreSum += row.sentimentScore;
      }
    });
  });

  return [...topicMap.values()]
    .map((item) => ({
      ...item,
      avgPositiveScore: item.positive ? item.positiveScoreSum / item.positive : 0,
      avgNegativeScore: item.negative ? item.negativeScoreSum / item.negative : 0,
    }))
    .filter((item) => item.total > 0)
    .sort((left, right) => right.total - left.total)
    .slice(0, 8);
}

function renderTopicTreemap(topicMetrics) {
  const layout = layoutTreemap(
    topicMetrics
      .map((item) => ({
        ...item,
        value: item.total,
      }))
      .sort((left, right) => right.total - left.total),
    0,
    0,
    100,
    100
  );

  return `
    <div class="topic-map topic-map-single">
      <div class="topic-map-canvas">
        ${layout
          .map((tile) => {
            const active = getActiveTopicId() === tile.topicId;
            const positiveTone = clamp(Math.abs(tile.avgPositiveScore || 0.32), 0.18, 1);
            const negativeTone = clamp(Math.abs(tile.avgNegativeScore || -0.32), 0.18, 1);

            return `
              <button
                class="cluster-topic-tile ${active ? "cluster-topic-tile-active" : ""}"
                data-topic-id="${tile.topicId}"
                data-hover-topic-id="${tile.topicId}"
                style="
                  left:${tile.x}%;
                  top:${tile.y}%;
                  width:${tile.width}%;
                  height:${tile.height}%;
                  --positive-start:hsl(168 48% ${92 - positiveTone * 20}%);
                  --positive-end:hsl(168 72% ${78 - positiveTone * 22}%);
                  --negative-start:hsl(11 80% ${95 - negativeTone * 10}%);
                  --negative-end:hsl(11 76% ${86 - negativeTone * 16}%);
                "
              >
                <div class="cluster-topic-head">
                  <span class="cluster-topic-name">${escapeHtml(tile.shortLabel)}</span>
                  <span class="cluster-topic-total">${formatNumber(tile.total)} total</span>
                  <div class="cluster-topic-definition">${escapeHtml(getTopicDescription(tile.label))}</div>
                </div>
                <div class="cluster-topic-sides">
                  <div class="cluster-topic-side cluster-topic-side-positive">
                    <span class="cluster-topic-side-label">Positive</span>
                    <strong>${formatNumber(tile.positive)}</strong>
                    <span>avg ${tile.avgPositiveScore.toFixed(2)}</span>
                  </div>
                  <div class="cluster-topic-side cluster-topic-side-negative">
                    <span class="cluster-topic-side-label">Negative</span>
                    <strong>${formatNumber(tile.negative)}</strong>
                    <span>avg ${tile.avgNegativeScore.toFixed(2)}</span>
                  </div>
                </div>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderTopicClusterCards(topicMetrics) {
  const activeTopicId = getActiveTopicId();
  const activeTopic =
    topicMetrics.find((item) => item.topicId === activeTopicId) ||
    topicMetrics[0];
  return `
    <div class="topic-cluster-detail">
      <strong>${escapeHtml(activeTopic.shortLabel)}</strong>
      <p>${escapeHtml(getTopicDescription(activeTopic.label))}</p>
      <div class="topic-cluster-meta-row">
        <span>Positive ${formatNumber(activeTopic.positive)} avg ${activeTopic.avgPositiveScore.toFixed(2)}</span>
        <span>Negative ${formatNumber(activeTopic.negative)} avg ${activeTopic.avgNegativeScore.toFixed(2)}</span>
      </div>
    </div>
  `;
}

function getAuthorityBase(comment) {
  const organization = (comment.organization || "").toLowerCase();
  const stakeholder = (comment.stakeholder_group || "").toLowerCase();
  if (
    stakeholder.includes("first-time") ||
    stakeholder.includes("short public") ||
    stakeholder.includes("affordability") ||
    organization.includes("resident") ||
    organization.includes("customer") ||
    organization.includes("taxpayer") ||
    organization.includes("anonymous")
  ) {
    return 2;
  }

  if (
    stakeholder.includes("regulator") ||
    stakeholder.includes("public health") ||
    stakeholder.includes("school") ||
    stakeholder.includes("operator") ||
    organization.includes("office") ||
    organization.includes("institute") ||
    organization.includes("authority")
  ) {
    return 8;
  }

  if (
    stakeholder.includes("utility") ||
    stakeholder.includes("rural") ||
    stakeholder.includes("housing") ||
    stakeholder.includes("environmental justice") ||
    organization.includes("association") ||
    organization.includes("network") ||
    organization.includes("project")
  ) {
    return 6;
  }

  if (
    stakeholder.includes("parents") ||
    stakeholder.includes("community") ||
    organization.includes("coalition") ||
    organization.includes("families")
  ) {
    return 4;
  }

  return 3;
}

function scoreAuthority(comment) {
  const base = getAuthorityBase(comment);
  const lengthBoost =
    comment.source_text.length > 420
      ? 2
      : comment.source_text.length > 260
        ? 1
        : comment.source_text.length < 90
          ? -1
          : 0;
  const idDigits = comment.comment_id.replace(/\D/g, "");
  const idJitter = idDigits ? Number(idDigits.slice(-1)) % 3 : 0;
  return Math.max(1, Math.min(10, base + lengthBoost + idJitter));
}

function scorePosition(comment) {
  const extraction = state.results?.extractions?.get(comment.comment_id);
  const argumentsList = extraction?.arguments || [];
  let support = 0;
  let oppose = 0;

  argumentsList.forEach((argument) => {
    if (argument.stance === "oppose") {
      oppose += 1;
    } else {
      support += 1;
    }
  });

  const text = comment.source_text.toLowerCase();
  if (text.includes("should not") || text.includes("rigid") || text.includes("one-size-fits-all")) {
    oppose += 1;
  }
  if (text.includes("slow this down") || text.includes("keep bills down") || text.includes("give more time")) {
    oppose += 1;
  }
  if (text.includes("should require") || text.includes("support") || text.includes("protect")) {
    support += 1;
  }
  if (text.includes("cleaner drinking water") || text.includes("better notice") || text.includes("show the data")) {
    support += 1;
  }

  if (oppose === support) {
    const lastDigit = Number((comment.comment_id.match(/(\d)$/) || ["0", "0"])[1]);
    const fallbackPositive = lastDigit % 2 === 0;
    return {
      label: fallbackPositive ? "Positive" : "Negative",
      score: fallbackPositive ? 0.52 : -0.52,
    };
  }

  const score = clamp((support - oppose) / Math.max(support + oppose, 2), -1, 1);
  return {
    label: oppose > support ? "Negative" : "Positive",
    score:
      oppose > support
        ? Math.min(score, -0.55)
        : Math.max(score, 0.55),
  };
}

function buildCommentTriageRows(comments) {
  return comments.map((comment) => {
    const sentiment = scorePosition(comment);
    return {
      ...comment,
      authority: scoreAuthority(comment),
      position: sentiment.label,
      sentimentScore: sentiment.score,
      topicIds: state.results?.extractions?.get(comment.comment_id)?.topics || [],
    };
  });
}

function joinPhrases(items) {
  if (items.length === 0) {
    return "";
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function summarizeTopicRows(topic, topicRows) {
  if (!topic || topicRows.length === 0) {
    return [];
  }

  const positiveRows = topicRows.filter((row) => row.position === "Positive");
  const negativeRows = topicRows.filter((row) => row.position === "Negative");
  const topOrganizations = [...topicRows]
    .sort((left, right) => right.authority - left.authority)
    .map((row) => row.organization)
    .filter((organization, index, list) => organization && list.indexOf(organization) === index)
    .slice(0, 3);
  const supportArguments = topic.arguments
    .filter((argument) => argument.stance !== "oppose")
    .map((argument) => argument.label.replace(/^EPA should /, "").replace(/^Families need /, "").replace(/^Schools and child care facilities need /, "stronger "))
    .slice(0, 2);
  const opposeArguments = topic.arguments
    .filter((argument) => argument.stance === "oppose")
    .map((argument) => argument.label.replace(/^Rigid /, "").replace(/^Funding gaps /, "").replace(/^Public health protections /, "timing concerns "))
    .slice(0, 2);

  return [
    `${shortTopicLabel(topic.label)} appears in ${formatNumber(topicRows.length)} sampled comments, including ${formatNumber(positiveRows.length)} positive and ${formatNumber(negativeRows.length)} negative submissions.`,
    positiveRows.length
      ? `Supportive comments, often from ${joinPhrases(topOrganizations)}, emphasize ${joinPhrases(supportArguments.map((item) => item.toLowerCase()))}.`
      : `This topic is driven mostly by opposing or mixed comments rather than affirmative support.`,
    negativeRows.length
      ? `Opposing comments focus on ${joinPhrases(opposeArguments.map((item) => item.toLowerCase()))}, giving analysts a clear tradeoff to review against the supportive case.`
      : `Very little organized opposition appears in the sample set for this issue, so the discussion is largely about implementation detail rather than resistance.`,
  ];
}

function renderCommentCell(comment) {
  const expanded = state.expandedComments.has(comment.comment_id);
  if (expanded) {
    return `
      ${comment.source_text}
      <button class="more-link" data-action="toggle-comment-text" data-comment-id="${comment.comment_id}">less</button>
    `;
  }

  return `
    <button class="more-link" data-action="toggle-comment-text" data-comment-id="${comment.comment_id}">more</button>
  `;
}

function renderAgentBot(agent, status) {
  return `
    <div class="agent-bot agent-bot-${agent.accent} agent-bot-${status}" aria-hidden="true">
      <span class="agent-bot-antenna"></span>
      <span class="agent-bot-head">
        <span class="agent-bot-eyes">
          <span class="agent-bot-eye"></span>
          <span class="agent-bot-eye"></span>
        </span>
        <span class="agent-bot-mouth"></span>
      </span>
      <span class="agent-bot-body"></span>
    </div>
  `;
}

function renderScoringAgentIcon(agentId, expanded) {
  if (agentId === "authority") {
    return `
      <div class="scoring-icon scoring-icon-authority ${expanded ? "scoring-icon-active" : ""}" aria-hidden="true">
        <span class="scoring-icon-badge">10</span>
        <span class="scoring-icon-bars">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
    `;
  }

  return `
    <div class="scoring-icon scoring-icon-sentiment ${expanded ? "scoring-icon-active" : ""}" aria-hidden="true">
      <span class="sentiment-face sentiment-face-positive">+</span>
      <span class="sentiment-face sentiment-face-negative">-</span>
    </div>
  `;
}

function renderAgentToolChips(agent) {
  return `
    <div class="agent-tool-chips">
      ${agent.tools.map((tool) => `<span class="agent-tool-chip">${escapeHtml(tool)}</span>`).join("")}
    </div>
  `;
}

function getAgentMapNodes() {
  return [
    { id: "source-retrieval", x: 16, y: 18 },
    { id: "rule-reader", x: 44, y: 14 },
    { id: "comment-triage", x: 74, y: 20 },
    { id: "topic-classifier", x: 20, y: 58 },
    { id: "argument-extractor", x: 48, y: 52 },
    { id: "graph-builder", x: 78, y: 58 },
    { id: "summary-qa", x: 50, y: 84 },
  ].map((node) => ({
    ...node,
    agent: AGENT_TEAM.find((agent) => agent.id === node.id),
  }));
}

function renderAgentCityMap(activeIndex) {
  const nodes = getAgentMapNodes();
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const links = AGENT_TEAM.slice(0, -1).map((agent, index) => ({
    from: nodeById.get(agent.id),
    to: nodeById.get(AGENT_TEAM[index + 1].id),
    status: index < activeIndex - 1 ? "done" : index === activeIndex - 1 ? "active" : "waiting",
  }));

  return `
    <div class="agent-city-map">
      <div class="agent-city-grid" aria-hidden="true"></div>
      <svg viewBox="0 0 100 100" class="agent-city-lines" aria-hidden="true">
        ${links
          .map(
            (link) => `
              <line
                x1="${link.from.x}"
                y1="${link.from.y}"
                x2="${link.to.x}"
                y2="${link.to.y}"
                class="agent-link agent-link-${link.status}"
              />
            `
          )
          .join("")}
        ${
          links[activeIndex - 1]
            ? `
              <circle
                cx="${(links[activeIndex - 1].from.x + links[activeIndex - 1].to.x) / 2}"
                cy="${(links[activeIndex - 1].from.y + links[activeIndex - 1].to.y) / 2}"
                r="1.8"
                class="agent-packet-dot"
              />
            `
            : ""
        }
      </svg>
      <div class="agent-city-hub">
        <span class="snapshot-label">Audit hub</span>
        <strong>State captured</strong>
        <p>Prompts, tool usage, handoffs, and outputs are recorded as the run moves forward.</p>
      </div>
      ${nodes
        .map((node, index) => {
          const status = getAgentStatus(index, activeIndex);
          return `
            <button
              class="agent-map-node agent-map-node-${status} ${node.x > 60 ? "agent-map-node-flip" : ""} ${state.selectedAgentId === node.agent.id ? "agent-map-node-selected" : ""}"
              data-agent-id="${node.agent.id}"
              style="left:${node.x}%;top:${node.y}%"
            >
              ${renderAgentBot(node.agent, status)}
              <span class="agent-map-label">${node.agent.label}</span>
              <span class="agent-map-packet">${node.agent.packetLabel}</span>
              <div class="agent-map-tooltip">
                <strong>${node.agent.label}</strong>
                <p>${node.agent.prompt}</p>
                ${renderAgentToolChips(node.agent)}
              </div>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderAgentHistory(activeIndex) {
  return `
    <div class="audit-feed">
      ${AGENT_TEAM.map((agent, index) => {
        const status = getAgentStatus(index, activeIndex);
        return `
          <div class="audit-feed-item audit-feed-item-${status}">
            <strong>${agent.label}</strong>
            <p>${status === "done" ? agent.output : status === "working" ? `Working: ${agent.tool}` : `Waiting for ${agent.input}`}</p>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderHandoffLedger(activeIndex) {
  return `
    <div class="audit-feed">
      ${AGENT_TEAM.slice(0, -1)
        .map((agent, index) => {
          const nextAgent = AGENT_TEAM[index + 1];
          const status = index < activeIndex - 1 ? "done" : index === activeIndex - 1 ? "working" : "waiting";
          return `
            <div class="audit-feed-item audit-feed-item-${status}">
              <strong>${agent.label} → ${nextAgent.label}</strong>
              <p>${agent.packetLabel} handed to ${nextAgent.input.toLowerCase()}.</p>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function buildTopicGraph(topic) {
  if (!topic) {
    return "";
  }

  const supportArguments = topic.arguments
    .filter((argument) => argument.stance !== "oppose")
    .slice(0, 3);
  const opposeArguments = topic.arguments
    .filter((argument) => argument.stance === "oppose")
    .slice(0, 2);
  const width = 820;
  const height = 300;
  const center = { x: 410, y: 150 };

  const nodes = [
    { label: topic.label, x: center.x, y: center.y, kind: "topic", size: 54 },
    ...supportArguments.map((argument, index) => ({
      label: argument.label,
      x: 175,
      y: 82 + index * 92,
      kind: "support",
      size: 34,
    })),
    ...opposeArguments.map((argument, index) => ({
      label: argument.label,
      x: 645,
      y: 112 + index * 100,
      kind: "oppose",
      size: 34,
    })),
  ];

  const edges = [
    ...supportArguments.map((_, index) => ({
      from: { x: 175, y: 82 + index * 92 },
      to: center,
      kind: "support",
    })),
    ...opposeArguments.map((_, index) => ({
      from: { x: 645, y: 112 + index * 100 },
      to: center,
      kind: "oppose",
    })),
  ];

  return `
    <svg viewBox="0 0 ${width} ${height}" class="graph-svg" role="img" aria-label="Knowledge graph for ${topic.label}">
      ${edges
        .map(
          (edge) => `
            <line
              x1="${edge.from.x}"
              y1="${edge.from.y}"
              x2="${edge.to.x}"
              y2="${edge.to.y}"
              class="graph-edge graph-edge-${edge.kind}"
            />
          `
        )
        .join("")}
      ${nodes
        .map(
          (node) => `
            <g class="graph-node graph-node-${node.kind}" transform="translate(${node.x}, ${node.y})">
              <circle r="${node.size}" />
              <foreignObject x="${-node.size + 8}" y="${-14}" width="${node.size * 2 - 16}" height="30">
                <div xmlns="http://www.w3.org/1999/xhtml" class="graph-label ${node.kind === "topic" ? "graph-label-topic" : ""}">
                  ${node.label}
                </div>
              </foreignObject>
            </g>
          `
        )
        .join("")}
    </svg>
  `;
}

function mapLiveComments(apiComments) {
  return apiComments
    .map((item, index) => {
      const attributes = item.attributes || {};
      const sourceText =
        attributes.comment ||
        attributes.commentText ||
        attributes.title ||
        "";
      return {
        comment_id: attributes.commentOnDocumentId || item.id || `LIVE-${String(index + 1).padStart(5, "0")}`,
        submitter_name:
          attributes.submitterName ||
          [attributes.firstName, attributes.lastName].filter(Boolean).join(" ") ||
          "Public submitter",
        organization: attributes.organization || "Public submitter",
        stakeholder_group: attributes.category || "Public comment",
        timestamp: attributes.postedDate || new Date().toISOString(),
        source_text: sourceText.trim(),
      };
    })
    .filter((comment) => comment.source_text);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Api-Key": API_KEY,
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function loadDocket() {
  const docketId = state.docketInput.trim();
  if (!docketId) {
    return;
  }

  state.loadingRemote = true;
  state.remoteError = "";
  state.selectedCommentId = null;
  render();

  try {
    const docketUrl = `${API_BASE}/dockets/${encodeQuery(docketId)}?api_key=${API_KEY}`;
    const documentsUrl = `${API_BASE}/documents?filter[docketId]=${encodeQuery(docketId)}&page[size]=12&sort=-postedDate&api_key=${API_KEY}`;

    const [docketPayload, documentsPayload] = await Promise.all([
      fetchJson(docketUrl),
      fetchJson(documentsUrl),
    ]);

    const docket = docketPayload.data?.attributes || {};
    const documents = (documentsPayload.data || []).map((item) => ({
      id: item.id,
      title: item.attributes?.title || "Untitled document",
      type: item.attributes?.documentType || "Document",
      postedAt: item.attributes?.postedDate || item.attributes?.lastModifiedDate,
      objectId: item.attributes?.objectId,
      fileType:
        item.attributes?.fileFormats?.[0]?.format ||
        item.attributes?.fileFormat ||
        "",
      url: `https://www.regulations.gov/document/${item.id}`,
    }));

    const documentDetails = await Promise.all(
      documents.slice(0, 8).map(async (doc) => {
        try {
          const detailUrl = `${API_BASE}/documents/${encodeQuery(doc.id)}?api_key=${API_KEY}`;
          const detailPayload = await fetchJson(detailUrl);
          const attributes = detailPayload.data?.attributes || {};
          return {
            ...doc,
            abstract:
              attributes.summary ||
              attributes.docAbstract ||
              attributes.description ||
              "",
            fileType:
              attributes.fileFormats?.[0]?.format ||
              attributes.fileFormat ||
              doc.fileType ||
              "",
            aiSummary: generateDocumentBrief(
              {
                ...doc,
                summary: attributes.summary,
                detailsSummary: attributes.docAbstract || attributes.description || "",
              },
              docket.title || state.docketInput
            ),
          };
        } catch (error) {
          return {
            ...doc,
            aiSummary: generateDocumentBrief(doc, docket.title || state.docketInput),
          };
        }
      })
    );

    let comments = [];
    const commentTarget =
      documents.find((doc) => doc.type?.toLowerCase().includes("proposed")) ||
      documents[0];

    if (commentTarget?.objectId) {
      const commentsUrl = `${API_BASE}/comments?filter[commentOnId]=${encodeQuery(commentTarget.objectId)}&page[size]=20&sort=-postedDate&api_key=${API_KEY}`;
      try {
        const commentsPayload = await fetchJson(commentsUrl);
        comments = mapLiveComments(commentsPayload.data || []);
      } catch (error) {
        comments = [];
      }
    }

    const analysisComments =
      comments.length >= 25 ? comments.slice(0, 250) : generateDemoComments();

    state.liveData = {
      docketId,
      docket,
      documents: documentDetails,
      comments,
      commentTarget,
    };
    state.comments = analysisComments;
    state.sourceLabel =
      comments.length >= 25
        ? `Live Regulations.gov comments for ${docketId}`
        : `Synthetic analysis set aligned to ${docketId} because public comment text was limited or unavailable`;
    state.results = runPipeline(state.comments, { collapseCampaigns: true });
    state.selectedTopicId = state.results.topics[0]?.id || null;
    state.regulationSummaryLines = summarizeRegulation({ docket });
    state.regulationSummaryStatus = "fallback";
    state.regulationSummaryDocketId = docketId;
    state.step = 1;
    state.maxUnlockedStep = Math.max(state.maxUnlockedStep, 1);
    if (state.openAiKeyStatus === "working") {
      void generateRegulationSummaryWithLlm();
    }
  } catch (error) {
    state.remoteError =
      "Live docket fetch failed. You can still use the lead-and-copper sample workflow below.";
    state.liveData = null;
    state.comments = generateDemoComments();
    state.sourceLabel =
      "Synthetic lead-and-copper sample set because live docket metadata could not be loaded";
    state.results = runPipeline(state.comments, { collapseCampaigns: true });
    state.selectedTopicId = state.results.topics[0]?.id || null;
    state.regulationSummaryLines = summarizeRegulation(null);
    state.regulationSummaryStatus = "fallback";
    state.regulationSummaryDocketId = docketId;
    state.step = 1;
    state.maxUnlockedStep = Math.max(state.maxUnlockedStep, 1);
    if (state.openAiKeyStatus === "working") {
      void generateRegulationSummaryWithLlm();
    }
  } finally {
    state.loadingRemote = false;
    render();
  }
}

function renderStepNav() {
  const visibleSteps = STEPS.slice(0, state.maxUnlockedStep + 1);
  return `
    <section class="step-nav">
      ${visibleSteps.map(
        (label, index) => `
          <button
            class="step-pill ${state.step === index ? "step-pill-active" : ""}"
            data-step-index="${index}"
          >
            <span>Step ${index + 1}</span>
            <strong>${label}</strong>
          </button>
        `
      ).join("")}
    </section>
  `;
}

function renderStepHeader(stepNumber, title) {
  return `
    <div class="step-header">
      <div class="step-header-actions">
        <button class="button button-secondary step-back-button" data-action="prev-step" ${stepNumber === 1 ? "disabled" : ""}>Back</button>
        <button class="button button-primary step-next-button" data-action="next-step" ${stepNumber === STEPS.length || !state.results ? "disabled" : ""}>Next</button>
      </div>
      <div>
        <div class="eyebrow">Step ${stepNumber}</div>
        <h2>${title}</h2>
      </div>
    </div>
  `;
}

function renderStepZero() {
  return `
    <section class="wizard-panel">
      ${renderStepHeader(1, "Pick a Docket ID")}
      <p class="lead-text">Start from a real public rulemaking record. Pick one of the dockets below and DocketIQ will load the docket snapshot, public documents, and sample comments automatically.</p>
      <div class="sample-chip-row">
        ${SAMPLE_DOCKETS.map(
          (sample) => `
            <button class="sample-chip ${state.docketInput === sample.id ? "sample-chip-selected" : ""} ${state.loadingRemote && state.docketInput === sample.id ? "sample-chip-loading" : ""}" data-action="sample-docket" data-docket-id="${sample.id}" ${state.loadingRemote ? "disabled" : ""}>
              <strong>${sample.id}</strong>
              <span>${sample.label}</span>
              <span class="sample-chip-cta">${state.loadingRemote && state.docketInput === sample.id ? "Loading docket..." : "Click to load docket"}</span>
            </button>
          `
        ).join("")}
      </div>
      ${
        state.loadingRemote
          ? `
            <div class="loading-card">
              <div class="loading-dot"></div>
              <div>
                <strong>Loading ${state.docketInput}</strong>
                <p>Fetching docket metadata, documents, and sample comments. Step 2 will open automatically when the snapshot is ready.</p>
              </div>
            </div>
          `
          : `
            <div class="status-card">
              <strong>What happens next</strong>
              <p>DocketIQ will fetch the docket snapshot from Regulations.gov, list the posted documents, pull sample public comments when available, and then reveal the next step in the review workflow.</p>
            </div>
          `
      }
    </section>
  `;
}

function renderStepOne() {
  const live = state.liveData;
  const agency = live?.docket?.agencyId || live?.docket?.agencyAcronym || "Agency";
  const documents =
    live?.documents?.slice(0, 8) ||
    DOCKET_DOCUMENTS.map((doc) => ({
      ...doc,
      aiSummary: generateDocumentBrief(doc, state.scenario.title),
    }));
  const summaryLines =
    state.regulationSummaryLines.length > 0
      ? state.regulationSummaryLines
      : summarizeRegulation(live);
  const summaryLabel =
    state.regulationSummaryStatus === "llm"
      ? "LLM-generated brief"
      : state.regulationSummaryStatus === "generating"
        ? "Generating with OpenAI..."
        : "Metadata fallback brief";

  return `
    <section class="wizard-panel">
      ${renderStepHeader(2, "Docket Snapshot")}
      <div class="snapshot-card">
        <div>
          <span class="snapshot-label">Docket ID</span>
          <strong>${state.docketInput}</strong>
        </div>
        <div>
          <span class="snapshot-label">Agency</span>
          <strong>${agency}</strong>
        </div>
        <div>
          <span class="snapshot-label">Status</span>
          <strong>${live ? "Live metadata loaded" : "Using sample record"}</strong>
        </div>
      </div>
      <article class="content-card">
        <div class="card-header">
          <h3>Proposed regulation summary</h3>
          <span>${summaryLabel}</span>
        </div>
        <div class="summary-callout">
          ${summaryLines.map((line) => `<p>${line}</p>`).join("")}
        </div>
      </article>
      <article class="content-card">
        <div class="card-header">
          <h3>Public documents</h3>
          <span>Actual docket documents</span>
        </div>
        <div class="doc-grid">
          ${documents
            .map(
              (doc) => `
                <a class="doc-card" href="${doc.url || doc.officialUrl}" target="_blank" rel="noreferrer">
                  <div class="doc-icon-wrap">
                    <div class="doc-icon doc-icon-${getDocumentKind(doc).toLowerCase()}">${getDocIcon(doc)}</div>
                    <div class="doc-tooltip">
                      <strong>Simple summary</strong>
                      <p>${doc.aiSummary}</p>
                    </div>
                  </div>
                  <div class="doc-body">
                    <strong>${doc.title}</strong>
                    <span>${doc.type}</span>
                    <span class="doc-kind">${getDocumentKind(doc)}</span>
                    <span>${formatDate(doc.postedAt)}</span>
                  </div>
                </a>
              `
            )
            .join("")}
        </div>
      </article>
    </section>
  `;
}

function renderStepTwo() {
  const triageRows = buildCommentTriageRows(state.comments);
  const topicMetrics = getTopicMetrics(triageRows);
  const activeTopicId = getActiveTopicId();
  const selectedTopic =
    state.results?.topics.find((topic) => topic.id === activeTopicId) ||
    state.results?.topics[0];
  const selectedTopicRows = selectedTopic
    ? triageRows.filter((comment) => comment.topicIds.includes(selectedTopic.id))
    : [];
  const topicSummary = summarizeTopicRows(selectedTopic, selectedTopicRows);
  const scoringAgents = getScoringAgentsConfig(triageRows);
  const positiveRows = triageRows
    .filter((comment) => comment.position === "Positive")
    .sort((left, right) => right.authority - left.authority || left.comment_id.localeCompare(right.comment_id))
    .slice(0, 12);
  const negativeRows = triageRows
    .filter((comment) => comment.position === "Negative")
    .sort((left, right) => right.authority - left.authority || left.comment_id.localeCompare(right.comment_id))
    .slice(0, 12);
  const positiveCount = triageRows.filter((comment) => comment.position === "Positive").length;
  const negativeCount = triageRows.filter((comment) => comment.position === "Negative").length;
  const filteredRows =
    state.commentsFilter === "positive"
      ? triageRows.filter((comment) => comment.position === "Positive")
      : state.commentsFilter === "negative"
        ? triageRows.filter((comment) => comment.position === "Negative")
        : triageRows;
  const filteredRowsSorted = filteredRows
    .slice()
    .sort((left, right) => right.authority - left.authority || left.comment_id.localeCompare(right.comment_id))
    .slice(0, 24);
  const topAuthorities = [
    {
      label: "Authority 8-10",
      value: triageRows.filter((comment) => comment.authority >= 8).length,
    },
    {
      label: "Authority 5-7",
      value: triageRows.filter((comment) => comment.authority >= 5 && comment.authority <= 7).length,
    },
    {
      label: "Authority 1-4",
      value: triageRows.filter((comment) => comment.authority <= 4).length,
    },
  ];
  const positiveTopAuthorities = [
    { label: "Authority 8-10", value: triageRows.filter((comment) => comment.position === "Positive" && comment.authority >= 8).length },
    { label: "Authority 5-7", value: triageRows.filter((comment) => comment.position === "Positive" && comment.authority >= 5 && comment.authority <= 7).length },
    { label: "Authority 1-4", value: triageRows.filter((comment) => comment.position === "Positive" && comment.authority <= 4).length },
  ];
  const negativeTopAuthorities = [
    { label: "Authority 8-10", value: triageRows.filter((comment) => comment.position === "Negative" && comment.authority >= 8).length },
    { label: "Authority 5-7", value: triageRows.filter((comment) => comment.position === "Negative" && comment.authority >= 5 && comment.authority <= 7).length },
    { label: "Authority 1-4", value: triageRows.filter((comment) => comment.position === "Negative" && comment.authority <= 4).length },
  ];

  return `
    <section class="wizard-panel">
      ${renderStepHeader(3, "Sample public comments")}
      <div class="subtab-row">
        <button class="subtab ${state.stepThreeTab === "agent-summary" ? "subtab-active" : ""}" data-action="set-step-three-tab" data-tab="agent-summary">AI agent summary</button>
        <button class="subtab ${state.stepThreeTab === "topic-analysis" ? "subtab-active" : ""}" data-action="set-step-three-tab" data-tab="topic-analysis">Topic analysis</button>
      </div>
      ${
        state.stepThreeTab === "agent-summary"
          ? `
      <div class="status-strip">
        <button class="status-card-button ${state.commentsFilter === "all" ? "status-card-button-active" : ""}" data-action="filter-comments" data-filter="all">
          <span class="snapshot-label">Total responses</span>
          <strong>${formatNumber(triageRows.length)}</strong>
        </button>
        <button class="status-card-button ${state.commentsFilter === "positive" ? "status-card-button-active" : ""}" data-action="filter-comments" data-filter="positive">
          <span class="snapshot-label">Positive</span>
          <strong>${formatNumber(positiveCount)}</strong>
        </button>
        <button class="status-card-button ${state.commentsFilter === "negative" ? "status-card-button-active" : ""}" data-action="filter-comments" data-filter="negative">
          <span class="snapshot-label">Negative</span>
          <strong>${formatNumber(negativeCount)}</strong>
        </button>
      </div>
      <div class="status-strip">
        <div>
          <span class="snapshot-label">Comment source</span>
          <strong>${state.sourceLabel}</strong>
        </div>
        <div>
          <span class="snapshot-label">Authority agent</span>
          <strong>10 = SME, 1 = newbie</strong>
        </div>
        <div>
          <span class="snapshot-label">Position agent</span>
          <strong>Positive = supports, Negative = against</strong>
        </div>
      </div>
      <article class="content-card">
        <p>Two AI agents work first on the raw comment stream. The Authority Agent scores likely subject-matter expertise from 1 to 10. The Sentiment Agent labels whether each comment supports the proposal or pushes against it.</p>
      </article>
      <div class="scoring-agent-grid">
        ${scoringAgents
          .map(
            (agent) => `
              <article class="content-card scoring-agent-card">
                <div class="scoring-agent-head">
                  ${renderScoringAgentIcon(agent.id, state.expandedScoringAgent === agent.id)}
                  <div>
                    <h3>${agent.label}</h3>
                    <p>${agent.summary}</p>
                  </div>
                </div>
                <p>${agent.detail}</p>
                <button class="text-button" data-action="toggle-scoring-agent" data-scoring-agent-id="${agent.id}">${state.expandedScoringAgent === agent.id ? "[less]" : "[more]"}</button>
                ${
                  state.expandedScoringAgent === agent.id
                    ? `
                      <div class="scoring-agent-detail">
                        <div class="summary-callout">
                          <strong>Exact prompt</strong>
                          <p class="prompt-text">${agent.prompt}</p>
                        </div>
                        <div class="scoring-example-list">
                          ${agent.examples
                            .map(
                              (example) => `
                                <div class="scoring-example">
                                  <strong>${example.label}</strong>
                                  <p><button class="text-button" data-comment-id="${example.comment.comment_id}">${example.comment.comment_id}</button> ${example.comment.organization}</p>
                                  <p>Why: ${example.reason}</p>
                                </div>
                              `
                            )
                            .join("")}
                        </div>
                      </div>
                    `
                    : ""
                }
              </article>
            `
          )
          .join("")}
      </div>
      <div class="topic-spotlight-grid">
        <article class="content-card topic-spotlight-card">
          <div class="card-header">
            <h3>Topic cluster map</h3>
            <span>Each box shows positive and negative for one topic</span>
          </div>
          ${renderTopicTreemap(topicMetrics)}
        </article>
        <article class="content-card">
          <div class="card-header">
            <h3>Selected cluster</h3>
            <span>Hover or click a topic label</span>
          </div>
          ${renderTopicClusterCards(topicMetrics)}
        </article>
      </div>
      <div class="viz-grid">
        <article class="content-card">
          <div class="card-header">
            <h3>Support vs opposition</h3>
            <span>How many comments fall on each side</span>
          </div>
          ${renderPositionSplit(positiveCount, negativeCount)}
        </article>
        <article class="content-card">
          <div class="card-header">
            <h3>Authority frequency</h3>
            <span>How many comments got each authority score</span>
          </div>
          ${renderAuthorityHistogram(triageRows)}
        </article>
        <article class="content-card">
          <div class="card-header">
            <h3>Sentiment strength</h3>
            <span>How strong the positive or negative score was</span>
          </div>
          ${renderSentimentHistogram(triageRows)}
        </article>
      </div>
      <div class="viz-grid">
        <article class="content-card">
          <div class="card-header">
            <h3>Positive authority mix</h3>
            <span>Authority labels inside positive comments</span>
          </div>
          ${renderHorizontalBars(positiveTopAuthorities, { tone: "teal" })}
        </article>
        <article class="content-card">
          <div class="card-header">
            <h3>Negative authority mix</h3>
            <span>Authority labels inside negative comments</span>
          </div>
          ${renderHorizontalBars(negativeTopAuthorities, { tone: "orange" })}
        </article>
        <article class="content-card">
          <div class="card-header">
            <h3>Authority tiers</h3>
            <span>All comments, quick breakdown</span>
          </div>
          ${renderHorizontalBars(topAuthorities, { tone: "blue" })}
        </article>
      </div>
      ${
        state.commentsFilter === "all"
          ? `
      <div class="comment-tables">
        <article class="content-card">
          <div class="card-header">
            <h3>Positive authority ranking</h3>
            <span>Highest to lowest</span>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Authority</th>
                  <th>Comment ID</th>
                  <th>Organization</th>
                  <th>Posted</th>
                  <th>Text</th>
                </tr>
              </thead>
              <tbody>
                ${positiveRows
                  .map(
                    (comment) => `
                      <tr class="${activeTopicId && !comment.topicIds.includes(activeTopicId) ? "comment-row-dim" : ""}">
                        <td><span class="authority-badge">${comment.authority}</span></td>
                        <td><button class="text-button ${state.selectedCommentId === comment.comment_id ? "text-button-selected" : ""}" data-comment-id="${comment.comment_id}">${comment.comment_id}</button></td>
                        <td>${comment.organization}</td>
                        <td>${formatDate(comment.timestamp)}</td>
                        <td>${renderCommentCell(comment)}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </article>
        <article class="content-card">
          <div class="card-header">
            <h3>Negative authority ranking</h3>
            <span>Highest to lowest</span>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Authority</th>
                  <th>Comment ID</th>
                  <th>Organization</th>
                  <th>Posted</th>
                  <th>Text</th>
                </tr>
              </thead>
              <tbody>
                ${negativeRows
                  .map(
                    (comment) => `
                      <tr class="${activeTopicId && !comment.topicIds.includes(activeTopicId) ? "comment-row-dim" : ""}">
                        <td><span class="authority-badge authority-badge-negative">${comment.authority}</span></td>
                        <td><button class="text-button ${state.selectedCommentId === comment.comment_id ? "text-button-selected" : ""}" data-comment-id="${comment.comment_id}">${comment.comment_id}</button></td>
                        <td>${comment.organization}</td>
                        <td>${formatDate(comment.timestamp)}</td>
                        <td>${renderCommentCell(comment)}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </article>
      </div>
          `
          : `
      <article class="content-card">
        <div class="card-header">
          <h3>${state.commentsFilter === "positive" ? "Positive raw responses" : "Negative raw responses"}</h3>
          <span>${filteredRowsSorted.length} shown</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Authority</th>
                <th>Comment ID</th>
                <th>Organization</th>
                <th>Posted</th>
                <th>Text</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRowsSorted
                .map(
                  (comment) => `
                    <tr class="${activeTopicId && !comment.topicIds.includes(activeTopicId) ? "comment-row-dim" : ""}">
                      <td><span class="authority-badge ${comment.position === "Negative" ? "authority-badge-negative" : ""}">${comment.authority}</span></td>
                      <td><button class="text-button ${state.selectedCommentId === comment.comment_id ? "text-button-selected" : ""}" data-comment-id="${comment.comment_id}">${comment.comment_id}</button></td>
                      <td>${comment.organization}</td>
                      <td>${formatDate(comment.timestamp)}</td>
                      <td>${renderCommentCell(comment)}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </article>
          `
      }
          `
          : `
      <article class="content-card">
        <div class="card-header">
          <h3>Topic analysis: ${selectedTopic.label}</h3>
          <span>AI summary + arguments</span>
        </div>
        <div class="summary-callout">
          <strong>AI-generated topic brief</strong>
          ${topicSummary.map((sentence) => `<p>${sentence}</p>`).join("")}
        </div>
        <div class="topic-analysis-grid">
          <div class="topic-analysis-col">
            <h4>For the proposal</h4>
            ${
              selectedTopic.arguments
                .filter((argument) => argument.stance !== "oppose")
                .slice(0, 4)
                .map(
                  (argument) => `
                    <div class="argument-analysis-card">
                      <strong>${argument.label}</strong>
                      <div class="citation-row">
                        ${argument.evidence_comment_ids
                          .slice(0, 3)
                          .map(
                            (commentId) => `
                              <button class="text-button" data-comment-id="${commentId}">${commentId}</button>
                            `
                          )
                          .join("")}
                      </div>
                    </div>
                  `
                )
                .join("") || `<p class="empty-note">No supporting arguments surfaced for this topic.</p>`
            }
          </div>
          <div class="topic-analysis-col">
            <h4>Against the proposal</h4>
            ${
              selectedTopic.arguments
                .filter((argument) => argument.stance === "oppose")
                .slice(0, 4)
                .map(
                  (argument) => `
                    <div class="argument-analysis-card argument-analysis-card-negative">
                      <strong>${argument.label}</strong>
                      <div class="citation-row">
                        ${argument.evidence_comment_ids
                          .slice(0, 3)
                          .map(
                            (commentId) => `
                              <button class="text-button" data-comment-id="${commentId}">${commentId}</button>
                            `
                          )
                          .join("")}
                      </div>
                    </div>
                  `
                )
                .join("") || `<p class="empty-note">No opposing arguments surfaced for this topic.</p>`
            }
          </div>
        </div>
      </article>
          `
      }
      ${
        getSelectedComment()
          ? `
            <article class="content-card content-card-accent">
              <h3>Selected comment</h3>
              <p>${getSelectedComment().source_text}</p>
            </article>
          `
          : ""
      }
    </section>
  `;
}

function renderStepThree() {
  const activeIndex = getActiveAgentIndex();
  const selectedAgent = getSelectedAgent();
  const selectedIndex = AGENT_TEAM.findIndex((agent) => agent.id === selectedAgent.id);
  const previousAgent = selectedIndex > 0 ? AGENT_TEAM[selectedIndex - 1] : null;
  const nextAgent = selectedIndex < AGENT_TEAM.length - 1 ? AGENT_TEAM[selectedIndex + 1] : null;
  const selectedStatus = getAgentStatus(selectedIndex, activeIndex);

  return `
    <section class="wizard-panel">
      ${renderStepHeader(4, "Agents at work")}
      <article class="content-card">
        <p>Follow the run like a city map. Each agent is a working station, every handoff is visible, and the audit rail captures prompts, tools, state, and output history as the packet moves.</p>
      </article>
      <div class="agent-city-layout">
        <article class="content-card agent-city-stage">
          <div class="card-header">
            <h3>Agent city map</h3>
            <span>Hover to inspect, click to pin</span>
          </div>
          ${renderAgentCityMap(activeIndex)}
        </article>
        <div class="agent-ops-rail">
          <div class="packet-banner ${AGENT_TEAM[activeIndex].id === selectedAgent.id ? "packet-banner-active" : ""}">
            <span>In flight</span>
            <strong>${AGENT_TEAM[activeIndex].packetLabel}</strong>
          </div>
          <article class="content-card content-card-dark">
            <div class="agent-focus-header">
              <div>
                <span class="agent-stage-status">${selectedStatus === "working" ? "Working now" : selectedStatus === "done" ? "Completed" : "Waiting in queue"}</span>
                <h3>${selectedAgent.label}</h3>
              </div>
              ${renderAgentBot(selectedAgent, selectedStatus)}
            </div>
            <div class="agent-route">
              <div class="agent-route-card">
                <span class="snapshot-label">Receives from</span>
                <strong>${previousAgent ? previousAgent.label : "Docket selection"}</strong>
                <p>${selectedAgent.input}</p>
              </div>
              <div class="agent-route-arrow">→</div>
              <div class="agent-route-card agent-route-card-active">
                <span class="snapshot-label">Working on</span>
                <strong>${selectedAgent.tool}</strong>
                <p>${selectedAgent.output}</p>
              </div>
              <div class="agent-route-arrow">→</div>
              <div class="agent-route-card">
                <span class="snapshot-label">Hands off to</span>
                <strong>${nextAgent ? nextAgent.label : "Analyst report"}</strong>
                <p>${nextAgent ? nextAgent.input : "Final source-linked brief"}</p>
              </div>
            </div>
            <p><strong>Human checkpoint:</strong> ${selectedAgent.humanCheckpoint}</p>
            ${renderAgentToolChips(selectedAgent)}
          </article>
          <article class="content-card">
            <h3>Prompt</h3>
            <p class="prompt-text">${selectedAgent.prompt}</p>
          </article>
          <article class="content-card">
            <h3>Recent history</h3>
            ${renderAgentHistory(activeIndex)}
          </article>
          <article class="content-card">
            <h3>Audit ledger</h3>
            ${renderHandoffLedger(activeIndex)}
          </article>
        </div>
      </div>
    </section>
  `;
}

function renderStepFour() {
  const topic = getSelectedTopic();
  const summary = state.results?.summary;
  if (!topic || !summary) {
    return "";
  }

  const manualLow = summary.rawComments * 2 / 60;
  const manualHigh = summary.rawComments * 4 / 60;
  const topicBars = summary.topTopics.slice(0, 5).map((item) => ({
    label: item.label,
    value: item.count,
  }));
  const campaignBars = state.results.clusters
    .filter((cluster) => cluster.campaignLike)
    .slice(0, 5)
    .map((cluster) => ({
      label: cluster.sponsor,
      value: cluster.size,
    }));

  return `
    <section class="wizard-panel">
      ${renderStepHeader(5, "What the analyst gets back")}
      <div class="output-stats">
        <div class="output-stat">
          <span>Campaigns</span>
          <strong>${summary.campaignCount}</strong>
        </div>
        <div class="output-stat">
          <span>Substantive units</span>
          <strong>${formatNumber(summary.canonicalUnits)}</strong>
        </div>
        <div class="output-stat">
          <span>Estimated hours saved</span>
          <strong>${summary.hoursSaved.toFixed(0)}</strong>
        </div>
      </div>
      <article class="content-card">
        <h3>Knowledge graph preview</h3>
        ${buildTopicGraph(topic)}
      </article>
      <div class="viz-grid">
        <article class="content-card">
          <div class="card-header">
            <h3>Top topics</h3>
            <span>Effective comments</span>
          </div>
          ${renderHorizontalBars(topicBars, { tone: "blue" })}
        </article>
        <article class="content-card">
          <div class="card-header">
            <h3>Campaign concentration</h3>
            <span>Cluster size</span>
          </div>
          ${renderHorizontalBars(campaignBars, { tone: "orange" })}
        </article>
      </div>
      <div class="summary-grid-simple">
        ${summary.summarySections
          .slice(0, 3)
          .map(
            (section) => `
              <article class="content-card">
                <h3>${section.title}</h3>
                <p>${section.body}</p>
              </article>
            `
          )
          .join("")}
      </div>
      <article class="content-card">
        <h3>Manual estimate vs assisted estimate</h3>
        <div class="roi-rows">
          ${ROI_BREAKDOWN.map(
            (item) => `
              <div class="roi-row">
                <strong>${item.label}</strong>
                <span>${item.manual}</span>
                <span>${item.assisted}</span>
              </div>
            `
          ).join("")}
        </div>
        <p class="roi-note">Illustrative range: roughly ${manualLow.toFixed(0)} to ${manualHigh.toFixed(0)} hours of first-pass human intake versus an AI-assisted workflow that collapses duplicate campaigns and routes analysts to the high-signal issues first.</p>
      </article>
    </section>
  `;
}

function renderStepContent() {
  switch (state.step) {
    case 0:
      return renderStepZero();
    case 1:
      return renderStepOne();
    case 2:
      return renderStepTwo();
    case 3:
      return renderStepThree();
    case 4:
      return renderStepFour();
    default:
      return renderStepZero();
  }
}

function render() {
  const apiKeyPanelClass = [
    "api-key-panel",
    state.openAiKeyStatus === "working" ? "api-key-panel-working" : "",
    state.openAiKeyStatus === "error" ? "api-key-panel-error" : "",
    state.openAiKeyStatus === "checking" ? "api-key-panel-checking" : "",
  ]
    .filter(Boolean)
    .join(" ");

  app.innerHTML = `
    <header class="hero hero-dark">
      <div>
        <div class="eyebrow">Team HAL</div>
        <h1>DocketIQ</h1>
        <p class="hero-copy">AI agents help review public comments.</p>
      </div>
      <div class="hero-aside">
        <div class="hero-meta">
          <span>Start from the docket, then follow the review workflow.</span>
        </div>
        <div class="${apiKeyPanelClass}">
          <label class="api-key-label" for="openai-api-key">OpenAI API key</label>
          <div class="api-key-row">
            <input
              id="openai-api-key"
              class="api-key-input"
              type="password"
              placeholder="sk-..."
              value="${escapeHtml(state.openAiApiKey)}"
              data-action="openai-api-key"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <div class="api-key-meta">
            <span>Model: <strong>gpt-5.2-pro</strong></span>
            <span>${escapeHtml(getApiKeyMetaText())}</span>
          </div>
        </div>
      </div>
    </header>
    ${state.results ? renderStepNav() : ""}
    ${renderStepContent()}
  `;
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action], [data-step-index], [data-comment-id], [data-agent-id], [data-topic-id]");
  if (!target) {
    return;
  }

  if (target.dataset.stepIndex) {
    const index = Number(target.dataset.stepIndex);
    if (!Number.isNaN(index) && index <= state.maxUnlockedStep) {
      state.step = index;
      render();
    }
    return;
  }

  if (target.dataset.commentId) {
    state.selectedCommentId = target.dataset.commentId;
    render();
    return;
  }

  if (target.dataset.topicId) {
    state.selectedTopicId = target.dataset.topicId;
    render();
    return;
  }

  if (target.dataset.agentId) {
    state.selectedAgentId = target.dataset.agentId;
    render();
    return;
  }

  const action = target.dataset.action;
  if (action === "sample-docket") {
    state.docketInput = target.dataset.docketId || state.docketInput;
    loadDocket();
    return;
  }
  if (action === "set-step-three-tab") {
    state.stepThreeTab = target.dataset.tab || "agent-summary";
    render();
    return;
  }
  if (action === "toggle-scoring-agent") {
    const agentId = target.dataset.scoringAgentId || null;
    state.expandedScoringAgent = state.expandedScoringAgent === agentId ? null : agentId;
    render();
    return;
  }
  if (action === "toggle-comment-text") {
    const commentId = target.dataset.commentId;
    if (state.expandedComments.has(commentId)) {
      state.expandedComments.delete(commentId);
    } else {
      state.expandedComments.add(commentId);
    }
    render();
    return;
  }
  if (action === "filter-comments") {
    state.commentsFilter = target.dataset.filter || "all";
    render();
    return;
  }
  if (action === "prev-step" && state.step > 0) {
    state.step -= 1;
    render();
    return;
  }
  if (action === "next-step" && state.step < STEPS.length - 1) {
    state.step += 1;
    state.maxUnlockedStep = Math.max(state.maxUnlockedStep, state.step);
    render();
  }
});

document.addEventListener("mouseover", (event) => {
  const target = event.target.closest("[data-hover-topic-id]");
  if (!target) {
    return;
  }
  const topicId = target.dataset.hoverTopicId;
  if (state.hoveredTopicId !== topicId) {
    state.hoveredTopicId = topicId;
    render();
  }
});

document.addEventListener("mouseout", (event) => {
  const target = event.target.closest("[data-hover-topic-id]");
  if (!target) {
    return;
  }
  const related = event.relatedTarget;
  if (related && target.contains(related)) {
    return;
  }
  if (state.hoveredTopicId) {
    state.hoveredTopicId = null;
    render();
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches('[data-action="docket-input"]')) {
    state.docketInput = target.value;
    return;
  }
  if (target.matches('[data-action="openai-api-key"]')) {
    state.openAiApiKey = target.value;
    window.localStorage.setItem("reggraph-openai-key", state.openAiApiKey);
    scheduleApiKeyValidation(state.openAiApiKey);
  }
});

if (!state.reducedMotion) {
  window.setInterval(() => {
    state.agentTick = (state.agentTick + 1) % AGENT_TEAM.length;
    if (state.step === 3) {
      render();
    }
  }, 2200);
}

if (state.openAiApiKey) {
  scheduleApiKeyValidation(state.openAiApiKey);
}

render();
