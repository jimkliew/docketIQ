import { auditLogger } from "./audit.mjs";

const STOP_WORDS = new Set([
  "the",
  "and",
  "that",
  "with",
  "from",
  "this",
  "should",
  "would",
  "their",
  "there",
  "have",
  "about",
  "into",
  "when",
  "will",
  "they",
  "them",
  "than",
  "then",
  "also",
  "because",
  "while",
  "where",
  "which",
  "those",
  "these",
  "must",
  "need",
  "near",
  "your",
  "our",
  "rule",
  "final",
  "proposal",
  "proposed",
  "agency",
  "comment",
  "comments",
  "lead",
  "water",
  "reporting",
  "epa",
]);

const TOPICS = [
  {
    id: "lead-line-replacement",
    label: "Lead Service Line Replacement",
    keywords: ["lead service line", "lead pipe", "replacement", "replace lead lines", "full replacement"],
  },
  {
    id: "compliance-timeline",
    label: "Compliance Timeline",
    keywords: ["10-year", "10 year", "timeline", "deadline", "phased", "implementation flexibility"],
  },
  {
    id: "public-inventory-notice",
    label: "Public Inventory and Notice",
    keywords: ["public inventory", "public notice", "families", "clear notice", "easy to understand"],
  },
  {
    id: "sampling-testing",
    label: "Sampling and Testing",
    keywords: ["sampling", "testing", "sample", "lead action level", "tap sample"],
  },
  {
    id: "filters-protection",
    label: "Filters and Consumer Protection",
    keywords: ["filters", "filter", "consumer protection", "exceedance", "elevated lead"],
  },
  {
    id: "schools-child-care",
    label: "Schools and Child Care",
    keywords: ["school", "schools", "child care", "childcare", "children"],
  },
  {
    id: "funding-small-systems",
    label: "Funding and Small Systems Support",
    keywords: ["funding", "small systems", "rural systems", "technical assistance", "workforce"],
  },
];

const ARGUMENT_RULES = [
  {
    label: "EPA should require full lead service line replacement",
    topicId: "lead-line-replacement",
    stance: "support",
    keywords: ["full lead service line replacement", "replace lead lines", "full replacement", "lead pipe replacement"],
  },
  {
    label: "Rigid replacement mandates need more flexibility",
    topicId: "lead-line-replacement",
    stance: "oppose",
    keywords: ["rigid", "one-size-fits-all", "flexibility", "workforce", "access", "affordability"],
  },
  {
    label: "Utilities need phased deadlines and realistic sequencing",
    topicId: "compliance-timeline",
    stance: "support",
    keywords: ["10-year", "timeline", "phased", "deadline", "sequencing", "implementation flexibility"],
  },
  {
    label: "Public health protections should not be delayed by schedule flexibility",
    topicId: "compliance-timeline",
    stance: "oppose",
    keywords: ["should not be delayed", "sooner", "urgent", "protect children", "faster action"],
  },
  {
    label: "Families need clear public inventories and fast notice",
    topicId: "public-inventory-notice",
    stance: "support",
    keywords: ["public inventory", "public notice", "clear information", "families", "easy to find"],
  },
  {
    label: "Notice rules should prioritize accuracy and verified communication",
    topicId: "public-inventory-notice",
    stance: "oppose",
    keywords: ["verified information", "accurate information", "communication methods", "practical communication"],
  },
  {
    label: "Sampling should trigger action sooner",
    topicId: "sampling-testing",
    stance: "support",
    keywords: ["sampling", "testing", "lead action level", "trigger action", "tap sample"],
  },
  {
    label: "Schools and child care facilities need stronger testing",
    topicId: "schools-child-care",
    stance: "support",
    keywords: ["school", "schools", "child care", "childcare", "children", "families"],
  },
  {
    label: "Filters should be provided when lead risk is identified",
    topicId: "filters-protection",
    stance: "support",
    keywords: ["filters", "filter support", "certified filters", "consumer protection"],
  },
  {
    label: "Small and rural systems need funding and technical assistance",
    topicId: "funding-small-systems",
    stance: "support",
    keywords: ["funding", "technical assistance", "small systems", "rural systems", "contractors"],
  },
  {
    label: "Funding gaps can undermine implementation",
    topicId: "funding-small-systems",
    stance: "oppose",
    keywords: ["funding gaps", "cannot absorb", "technical support", "affordability", "service reliability"],
  },
];

const STANCE_POSITIVE = [
  "support",
  "necessary",
  "critical",
  "should require",
  "should remain",
  "deserve",
  "essential",
  "non-negotiable",
];

const STANCE_NEGATIVE = [
  "should not",
  "oppose",
  "without exposing",
  "excessive cost",
  "burden",
  "not adequate",
  "cannot absorb",
];

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text) {
  return normalizeText(text)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function makeSet(tokens) {
  return new Set(tokens);
}

function jaccard(a, b) {
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function hashString(text, salt) {
  let hash = 2166136261 ^ salt;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function minhash(tokens) {
  const unique = [...new Set(tokens)];
  const salts = [17, 31, 53, 71, 97, 127];
  return salts.map((salt) =>
    unique.reduce((min, token) => Math.min(min, hashString(token, salt)), Number.MAX_SAFE_INTEGER)
  );
}

class UnionFind {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, index) => index);
    this.rank = Array.from({ length: size }, () => 0);
  }

  find(index) {
    if (this.parent[index] !== index) {
      this.parent[index] = this.find(this.parent[index]);
    }
    return this.parent[index];
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) {
      return;
    }
    if (this.rank[rootA] < this.rank[rootB]) {
      this.parent[rootA] = rootB;
    } else if (this.rank[rootA] > this.rank[rootB]) {
      this.parent[rootB] = rootA;
    } else {
      this.parent[rootB] = rootA;
      this.rank[rootA] += 1;
    }
  }
}

function inferTopics(text) {
  const normalized = normalizeText(text);
  const topics = TOPICS.filter((topic) =>
    topic.keywords.some((keyword) => normalized.includes(keyword.replace(/[^a-z0-9\s]/g, " ")))
  ).map((topic) => topic.id);

  if (topics.length > 0) {
    return topics;
  }

  return ["public-transparency"];
}

function inferOverallStance(text) {
  const normalized = normalizeText(text);
  let score = 0;
  for (const phrase of STANCE_POSITIVE) {
    if (normalized.includes(phrase)) {
      score += 1;
    }
  }
  for (const phrase of STANCE_NEGATIVE) {
    if (normalized.includes(phrase)) {
      score -= 1;
    }
  }
  if (score > 0) {
    return "support";
  }
  if (score < 0) {
    return "oppose";
  }
  return "mixed";
}

function inferArguments(text, topicIds) {
  const normalized = normalizeText(text);
  const matches = ARGUMENT_RULES.filter(
    (rule) =>
      topicIds.includes(rule.topicId) &&
      rule.keywords.some((keyword) => normalized.includes(keyword.replace(/[^a-z0-9\s]/g, " ")))
  );

  if (matches.length > 0) {
    return matches.map((match) => ({
      label: match.label,
      stance: match.stance,
      topicId: match.topicId,
    }));
  }

  const overallStance = inferOverallStance(text);
  return topicIds.map((topicId) => ({
    label:
      overallStance === "oppose"
        ? "The comment warns against administrative burden"
        : overallStance === "mixed"
          ? "The comment balances implementation and accountability"
          : "The comment supports stronger safeguards and disclosure",
    stance: overallStance,
    topicId,
  }));
}

function extractComment(comment) {
  const topics = inferTopics(comment.source_text);
  const argumentsFound = inferArguments(comment.source_text, topics);
  const organizations = [comment.organization].filter(Boolean);

  return {
    comment_id: comment.comment_id,
    topics,
    arguments: argumentsFound,
    organizations,
    stakeholder_group: comment.stakeholder_group || "Individual Submitter",
    summary_blurb: comment.source_text.split(". ").slice(0, 2).join(". ").trim(),
  };
}

function buildExactGroups(comments) {
  const groups = new Map();
  for (const comment of comments) {
    const key = normalizeText(comment.source_text);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(comment);
  }
  return [...groups.values()].map((group, index) => ({
    id: `exact-${String(index + 1).padStart(4, "0")}`,
    members: group,
    normalizedText: normalizeText(group[0].source_text),
    tokens: tokenize(group[0].source_text),
    tokenSet: makeSet(tokenize(group[0].source_text)),
    signature: minhash(tokenize(group[0].source_text)),
    organization: group[0].organization,
    stakeholderGroup: group[0].stakeholder_group,
    topicHints: inferTopics(group[0].source_text),
  }));
}

function detectCampaigns(exactGroups) {
  const uf = new UnionFind(exactGroups.length);

  const candidateIndices = exactGroups
    .map((group, index) => ({ group, index }))
    .filter(({ group }) => group.members.length >= 12);

  for (let left = 0; left < candidateIndices.length; left += 1) {
    for (let right = left + 1; right < candidateIndices.length; right += 1) {
      const a = candidateIndices[left];
      const b = candidateIndices[right];
      const similarity = jaccard(a.group.tokenSet, b.group.tokenSet);
      const sharedTopics = a.group.topicHints.filter((topic) => b.group.topicHints.includes(topic)).length;
      const sameOrganization = a.group.organization === b.group.organization;
      const sameStakeholder = a.group.stakeholderGroup === b.group.stakeholderGroup;

      if (
        (sameOrganization && sharedTopics > 0 && similarity >= 0.18) ||
        (sameOrganization && sameStakeholder && similarity >= 0.15) ||
        similarity >= 0.78
      ) {
        uf.union(a.index, b.index);
      }
    }
  }

  const merged = new Map();
  exactGroups.forEach((group, index) => {
    const root = uf.find(index);
    if (!merged.has(root)) {
      merged.set(root, []);
    }
    merged.get(root).push(group);
  });

  const clusters = [...merged.values()].map((groupSet, index) => {
    const members = groupSet.flatMap((group) => group.members);
    const organizationCounts = new Map();
    members.forEach((comment) => {
      organizationCounts.set(
        comment.organization,
        (organizationCounts.get(comment.organization) || 0) + 1
      );
    });
    const sponsor = [...organizationCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed Submitters";
    const exactGroupCount = groupSet.length;
    const maxExactGroupSize = Math.max(...groupSet.map((group) => group.members.length));
    const representative = [...members].sort(
      (a, b) => b.source_text.length - a.source_text.length
    )[0];
    const size = members.length;
    const campaignLike = maxExactGroupSize >= 12;
    return {
      id: `campaign-${String(index + 1).padStart(3, "0")}`,
      size,
      sponsor,
      detectionType:
        exactGroupCount === 1 && size > 1
          ? "Exact duplicate campaign"
          : exactGroupCount > 1 && campaignLike
            ? "Near-duplicate campaign"
            : "Unique submission",
      exactGroupCount,
      maxExactGroupSize,
      members,
      representative,
      campaignLike,
    };
  });

  return clusters;
}

function buildKnowledgeGraph(comments, extractions, clusters, canonicalCommentIds) {
  const nodes = new Map();
  const edges = new Map();

  function upsertNode(id, type, label, count = 1, meta = {}) {
    const existing = nodes.get(id);
    if (existing) {
      existing.count += count;
      existing.evidence_comment_ids = [
        ...new Set([...(existing.evidence_comment_ids || []), ...(meta.evidence_comment_ids || [])]),
      ].slice(0, 10);
      return;
    }
    nodes.set(id, {
      id,
      type,
      label,
      count,
      ...meta,
    });
  }

  function upsertEdge(source, target, relation, evidenceCommentId) {
    const key = `${source}|${target}|${relation}`;
    const existing = edges.get(key);
    if (existing) {
      existing.count += 1;
      if (!existing.evidence_comment_ids.includes(evidenceCommentId)) {
        existing.evidence_comment_ids.push(evidenceCommentId);
      }
      return;
    }
    edges.set(key, {
      source,
      target,
      relation,
      count: 1,
      evidence_comment_ids: [evidenceCommentId],
    });
  }

  const clusterByCommentId = new Map();
  clusters.forEach((cluster) => {
    cluster.members.forEach((comment) => {
      clusterByCommentId.set(comment.comment_id, cluster);
    });
    if (cluster.campaignLike) {
      upsertNode(`campaign:${cluster.id}`, "campaign", cluster.sponsor, cluster.size, {
        detectionType: cluster.detectionType,
        evidence_comment_ids: cluster.members.slice(0, 6).map((comment) => comment.comment_id),
      });
    }
  });

  comments.forEach((comment) => {
    const extraction = extractions.get(comment.comment_id);
    if (!canonicalCommentIds.has(comment.comment_id)) {
      return;
    }

    upsertNode(`comment:${comment.comment_id}`, "comment", comment.comment_id, 1, {
      evidence_comment_ids: [comment.comment_id],
    });

    const cluster = clusterByCommentId.get(comment.comment_id);
    if (cluster?.campaignLike) {
      upsertEdge(`comment:${comment.comment_id}`, `campaign:${cluster.id}`, "PART_OF_CAMPAIGN", comment.comment_id);
    }

    upsertNode(`stakeholder:${extraction.stakeholder_group}`, "stakeholder", extraction.stakeholder_group, 1, {
      evidence_comment_ids: [comment.comment_id],
    });
    upsertEdge(`comment:${comment.comment_id}`, `stakeholder:${extraction.stakeholder_group}`, "SUBMITTED_BY_GROUP", comment.comment_id);

    extraction.organizations.forEach((organization) => {
      upsertNode(`org:${organization}`, "organization", organization, 1, {
        evidence_comment_ids: [comment.comment_id],
      });
      upsertEdge(`comment:${comment.comment_id}`, `org:${organization}`, "ASSOCIATED_WITH", comment.comment_id);
    });

    extraction.topics.forEach((topicId) => {
      const topic = TOPICS.find((item) => item.id === topicId);
      upsertNode(`topic:${topicId}`, "topic", topic?.label || topicId, 1, {
        evidence_comment_ids: [comment.comment_id],
      });
      upsertEdge(`comment:${comment.comment_id}`, `topic:${topicId}`, "MENTIONS_TOPIC", comment.comment_id);
    });

    extraction.arguments.forEach((argument) => {
      upsertNode(`argument:${argument.label}`, "argument", argument.label, 1, {
        stance: argument.stance,
        topicId: argument.topicId,
        evidence_comment_ids: [comment.comment_id],
      });
      upsertEdge(`comment:${comment.comment_id}`, `argument:${argument.label}`, "MAKES_ARGUMENT", comment.comment_id);
      upsertEdge(`argument:${argument.label}`, `topic:${argument.topicId}`, argument.stance === "oppose" ? "OPPOSES" : "SUPPORTS", comment.comment_id);
      upsertEdge(`stakeholder:${extraction.stakeholder_group}`, `argument:${argument.label}`, "ADVANCES", comment.comment_id);
    });
  });

  return {
    nodes: [...nodes.values()],
    edges: [...edges.values()],
  };
}

function summarize(comments, extractions, clusters, collapseCampaigns) {
  const campaignByCommentId = new Map();
  clusters.forEach((cluster) => {
    cluster.members.forEach((comment) => {
      campaignByCommentId.set(comment.comment_id, cluster);
    });
  });

  const canonicalIds = new Set();
  clusters.forEach((cluster) => {
    if (cluster.campaignLike) {
      canonicalIds.add(cluster.representative.comment_id);
    } else {
      cluster.members.forEach((comment) => canonicalIds.add(comment.comment_id));
    }
  });

  const effectiveWeight = (commentId) => {
    if (!collapseCampaigns) {
      return 1;
    }
    const cluster = campaignByCommentId.get(commentId);
    if (!cluster?.campaignLike) {
      return 1;
    }
    return cluster.representative.comment_id === commentId ? 1 : 0;
  };

  const topicCounts = new Map();
  const argumentCounts = new Map();
  const organizationCounts = new Map();
  const disagreementCounts = new Map();

  comments.forEach((comment) => {
    const weight = effectiveWeight(comment.comment_id);
    if (weight === 0) {
      return;
    }
    const extraction = extractions.get(comment.comment_id);
    extraction.topics.forEach((topicId) => {
      topicCounts.set(topicId, (topicCounts.get(topicId) || 0) + weight);
    });
    extraction.arguments.forEach((argument) => {
      const key = `${argument.label}|${argument.stance}|${argument.topicId}`;
      if (!argumentCounts.has(key)) {
        argumentCounts.set(key, {
          label: argument.label,
          stance: argument.stance,
          topicId: argument.topicId,
          count: 0,
          evidence_comment_ids: [],
        });
      }
      const item = argumentCounts.get(key);
      item.count += weight;
      if (!item.evidence_comment_ids.includes(comment.comment_id)) {
        item.evidence_comment_ids.push(comment.comment_id);
      }

      const disagreementKey = argument.topicId;
      if (!disagreementCounts.has(disagreementKey)) {
        disagreementCounts.set(disagreementKey, { support: 0, oppose: 0 });
      }
      if (argument.stance === "support") {
        disagreementCounts.get(disagreementKey).support += weight;
      }
      if (argument.stance === "oppose") {
        disagreementCounts.get(disagreementKey).oppose += weight;
      }
    });
    extraction.organizations.forEach((organization) => {
      organizationCounts.set(organization, (organizationCounts.get(organization) || 0) + weight);
    });
  });

  const rawComments = comments.length;
  const campaignClusters = clusters.filter((cluster) => cluster.campaignLike);
  const canonicalUnits = new Set(
    clusters.flatMap((cluster) =>
      cluster.campaignLike ? [cluster.representative.comment_id] : cluster.members.map((comment) => comment.comment_id)
    )
  ).size;
  const baselineMinutes = rawComments * 2.8;
  const assistedMinutes = canonicalUnits * 4.5 + campaignClusters.length * 1.5;
  const hoursSaved = Math.max(0, (baselineMinutes - assistedMinutes) / 60);

  const rankedTopics = [...topicCounts.entries()]
    .map(([topicId, count]) => ({
      topicId,
      label: TOPICS.find((topic) => topic.id === topicId)?.label || topicId,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const rankedArguments = [...argumentCounts.values()].sort((a, b) => b.count - a.count);
  const rankedOrganizations = [...organizationCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  const disagreements = [...disagreementCounts.entries()]
    .map(([topicId, counts]) => ({
      topicId,
      label: TOPICS.find((topic) => topic.id === topicId)?.label || topicId,
      support: counts.support,
      oppose: counts.oppose,
      intensity: Math.min(counts.support, counts.oppose),
    }))
    .filter((item) => item.support > 0 && item.oppose > 0)
    .sort((a, b) => b.intensity - a.intensity);

  const summarySections = [
    {
      id: "volume",
      title: collapseCampaigns ? "Analyst Workload After Campaign Collapse" : "Raw Public Comment Volume",
      body: collapseCampaigns
        ? `The system reduced ${rawComments.toLocaleString()} submissions into ${canonicalUnits.toLocaleString()} substantive review units by collapsing ${campaignClusters.length} duplicate or coordinated campaigns. This workflow estimates ${hoursSaved.toFixed(0)} analyst hours saved while keeping every summary sentence linked back to source comments.`
        : `The docket contains ${rawComments.toLocaleString()} raw submissions, including several large campaigns that would dominate manual review queues. Without campaign collapse, identical or near-identical language obscures the unique substantive issues that analysts need to address.`,
      evidence_comment_ids: campaignClusters.flatMap((cluster) =>
        cluster.members.slice(0, 2).map((comment) => comment.comment_id)
      ).slice(0, 6),
    },
    {
      id: "topics",
      title: "Dominant Topics",
      body: `The most common topics are ${rankedTopics.slice(0, 3).map((item) => item.label).join(", ")}. Supportive comments emphasize full lead service line replacement, stronger public inventories and notice, filters, and more protective testing, while opposing or cautionary comments focus on timelines, implementation burden, and funding support for utilities and small systems.`,
      evidence_comment_ids: rankedArguments.flatMap((argument) => argument.evidence_comment_ids.slice(0, 1)).slice(0, 6),
    },
    {
      id: "arguments",
      title: "Recurring Arguments",
      body: `Top supportive arguments are "${rankedArguments.filter((item) => item.stance === "support").slice(0, 2).map((item) => item.label).join('" and "')}". The leading opposing arguments are "${rankedArguments.filter((item) => item.stance === "oppose").slice(0, 2).map((item) => item.label).join('" and "')}".`,
      evidence_comment_ids: rankedArguments.slice(0, 6).flatMap((item) => item.evidence_comment_ids.slice(0, 1)).slice(0, 6),
    },
    {
      id: "disagreements",
      title: "Notable Disagreements",
      body:
        disagreements.length > 0
          ? `The sharpest substantive disagreement is around ${disagreements[0].label}, where commenters disagree on how quickly and how rigidly EPA should require action while still protecting households from lead exposure. ${disagreements[1] ? `${disagreements[1].label} is the next major fault line, especially where public health urgency meets small-system implementation constraints.` : ""}`
          : "The comment set is mostly aligned around a single policy direction, with limited substantive disagreement beyond implementation details.",
      evidence_comment_ids: rankedArguments
        .filter((item) => item.stance === "support" || item.stance === "oppose")
        .slice(0, 6)
        .flatMap((item) => item.evidence_comment_ids.slice(0, 1))
        .slice(0, 6),
    },
  ];

  return {
    rawComments,
    campaignCount: campaignClusters.length,
    canonicalUnits,
    hoursSaved,
    topTopics: rankedTopics,
    topArguments: rankedArguments,
    topOrganizations: rankedOrganizations,
    disagreements,
    summarySections,
    canonicalIds,
  };
}

function buildTopicViews(comments, extractions, summary, collapseCampaigns) {
  const effectiveCommentIds = collapseCampaigns ? summary.canonicalIds : new Set(comments.map((comment) => comment.comment_id));
  return TOPICS.map((topic) => {
    const stakeholderCounts = new Map();
    const argumentCounts = new Map();
    const evidence = [];

    comments.forEach((comment) => {
      if (!effectiveCommentIds.has(comment.comment_id)) {
        return;
      }
      const extraction = extractions.get(comment.comment_id);
      if (!extraction.topics.includes(topic.id)) {
        return;
      }
      evidence.push(comment.comment_id);
      stakeholderCounts.set(
        extraction.stakeholder_group,
        (stakeholderCounts.get(extraction.stakeholder_group) || 0) + 1
      );
      extraction.arguments
        .filter((argument) => argument.topicId === topic.id)
        .forEach((argument) => {
          const key = `${argument.label}|${argument.stance}`;
          if (!argumentCounts.has(key)) {
            argumentCounts.set(key, {
              label: argument.label,
              stance: argument.stance,
              count: 0,
              evidence_comment_ids: [],
            });
          }
          const item = argumentCounts.get(key);
          item.count += 1;
          if (!item.evidence_comment_ids.includes(comment.comment_id)) {
            item.evidence_comment_ids.push(comment.comment_id);
          }
        });
    });

    return {
      ...topic,
      stakeholderCounts: [...stakeholderCounts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
      arguments: [...argumentCounts.values()].sort((a, b) => b.count - a.count),
      evidence_comment_ids: evidence.slice(0, 12),
    };
  });
}

export function runPipeline(comments, options = {}) {
  const startedAt = performance.now();

  // Log pipeline start
  auditLogger.logAgentAction("comment-normalizer", "started", {
    commentCount: comments.length
  });

  // Stage 1: Build exact groups (normalization)
  const exactGroups = buildExactGroups(comments);
  auditLogger.logTransformation("comment-normalizer", "text-normalization",
    { rawComments: comments.length },
    { exactGroups: exactGroups.length }
  );
  auditLogger.logAgentAction("comment-normalizer", "completed", {
    exactGroups: exactGroups.length
  });

  // Stage 2: Detect campaigns (duplicate detection)
  auditLogger.logAgentAction("duplicate-detector", "started", {
    exactGroups: exactGroups.length
  });
  const clusters = detectCampaigns(exactGroups).sort((a, b) => b.size - a.size);
  auditLogger.logMetric("duplicate-detector", "campaigns-detected", clusters.length, {
    totalComments: comments.length,
    campaignSizes: clusters.map(c => c.size)
  });
  auditLogger.logAgentAction("duplicate-detector", "completed", {
    campaigns: clusters.length
  });

  // Stage 3: Extract topics and arguments
  auditLogger.logAgentAction("topic-classifier", "started");
  auditLogger.logAgentAction("argument-extractor", "started");

  const extractions = new Map();
  comments.forEach((comment) => {
    extractions.set(comment.comment_id, extractComment(comment));
  });

  auditLogger.logMetric("topic-classifier", "comments-classified", comments.length, {
    uniqueTopics: new Set([...extractions.values()].flatMap(e => e.topics)).size
  });
  auditLogger.logAgentAction("topic-classifier", "completed");

  auditLogger.logMetric("argument-extractor", "arguments-extracted",
    [...extractions.values()].reduce((sum, e) => sum + e.arguments.length, 0), {
    commentsWithArguments: [...extractions.values()].filter(e => e.arguments.length > 0).length
  });
  auditLogger.logAgentAction("argument-extractor", "completed");

  // Stage 4: Generate summary
  auditLogger.logAgentAction("summary-generator", "started");
  const summary = summarize(comments, extractions, clusters, options.collapseCampaigns ?? true);
  auditLogger.logMetric("summary-generator", "sections-generated", summary.summarySections.length, {
    briefLength: summary.summarySections.reduce((sum, s) => sum + s.body.length, 0)
  });
  auditLogger.logAgentAction("summary-generator", "completed");

  // Stage 5: Build knowledge graph
  auditLogger.logAgentAction("graph-builder", "started");
  const graph = buildKnowledgeGraph(comments, extractions, clusters, summary.canonicalIds);
  auditLogger.logMetric("graph-builder", "graph-size", graph.nodes.length, {
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    nodeTypes: [...new Set(graph.nodes.map(n => n.type))]
  });
  auditLogger.logAgentAction("graph-builder", "completed");

  // Stage 6: Build topic views
  auditLogger.logAgentAction("topic-view-builder", "started");
  const topics = buildTopicViews(comments, extractions, summary, options.collapseCampaigns ?? true);
  auditLogger.logMetric("topic-view-builder", "topic-views-created", topics.length, {
    topicIds: topics.map(t => t.topicId)
  });
  auditLogger.logAgentAction("topic-view-builder", "completed");

  const stageTimings = [
    { label: "Ingest", detail: `${comments.length.toLocaleString()} comments loaded` },
    { label: "Deduplicate", detail: `${summary.campaignCount} campaigns detected` },
    { label: "Extract", detail: `${comments.length.toLocaleString()} comments classified` },
    { label: "Graph", detail: `${graph.nodes.length} nodes / ${graph.edges.length} edges` },
    { label: "Summarize", detail: `${summary.summarySections.length} analyst brief sections generated` },
  ];

  return {
    comments,
    clusters,
    extractions,
    graph,
    summary,
    topics,
    stageTimings,
    elapsedMs: performance.now() - startedAt,
  };
}
