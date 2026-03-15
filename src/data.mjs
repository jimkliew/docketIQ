const FIRST_NAMES = [
  "Avery",
  "Jordan",
  "Morgan",
  "Taylor",
  "Riley",
  "Cameron",
  "Rowan",
  "Parker",
  "Skyler",
  "Emerson",
  "Harper",
  "Quinn",
  "Dakota",
  "Logan",
  "Casey",
  "Sage",
  "Reese",
  "Kendall",
  "Alex",
  "Jamie",
];

const LAST_NAMES = [
  "Brooks",
  "Hayes",
  "Patel",
  "Kim",
  "Garcia",
  "Morgan",
  "Rivera",
  "Jackson",
  "Carter",
  "Bennett",
  "Coleman",
  "Murphy",
  "Reyes",
  "Ward",
  "Foster",
  "Simmons",
  "Nguyen",
  "Lopez",
  "Campbell",
  "Price",
];

const STATES = [
  "Michigan",
  "Ohio",
  "Pennsylvania",
  "Wisconsin",
  "New Jersey",
  "Illinois",
  "North Carolina",
  "Georgia",
  "Texas",
  "California",
];

const CITIES = [
  "Detroit",
  "Newark",
  "Pittsburgh",
  "Milwaukee",
  "Cleveland",
  "Chicago",
  "Philadelphia",
  "Charlotte",
  "Atlanta",
  "Houston",
];

const FACILITIES = [
  "elementary school",
  "child care center",
  "water main corridor",
  "service line inventory program",
  "community water system",
  "neighborhood replacement zone",
];

const COMMENT_PERIOD_START = Date.parse("2023-12-06T12:00:00Z");
const COMMENT_PERIOD_END = Date.parse("2024-02-05T18:00:00Z");

const CAMPAIGNS = [
  {
    organization: "Safe Water Families",
    stakeholderGroup: "Parents and Residents",
    count: 780,
    textVariants: [
      "EPA should finalize a rule that requires full lead service line replacement within 10 years, lowers the lead action level, and gives families clear public notice when sampling shows elevated lead. The final rule should also require certified filters for households affected by exceedances.",
    ],
  },
  {
    organization: "Municipal Flexibility Coalition",
    stakeholderGroup: "Local Water Utilities",
    count: 620,
    textVariants: [
      "EPA should not impose a rigid one-size-fits-all 10-year replacement requirement without stronger federal funding support and compliance flexibility for utilities facing workforce, access, and affordability constraints. Public inventories are useful, but the final rule should give systems practical implementation timelines.",
    ],
  },
  {
    organization: "Parents for Lead-Free Schools",
    stakeholderGroup: "School and Child Care Advocates",
    count: 410,
    textVariants: [
      "The final rule should require stronger testing and communication for schools and child care facilities because families need to know quickly when children may be exposed to lead in drinking water. Public inventories, school sampling, and filter access should work together.",
      "EPA should strengthen school and child care testing requirements and require timely communication to families when lead is found in drinking water. Public inventories and filter access are essential to protect children.",
      "Please strengthen school and child care sampling, require timely notice to families, and make sure utilities provide clear information and filter support when lead is detected. Children should not be the last to know.",
    ],
  },
  {
    organization: "Rural Systems Partnership",
    stakeholderGroup: "Rural Water Systems",
    count: 300,
    textVariants: [
      "EPA should support the goal of replacing lead service lines, but small and rural systems need phased deadlines, stable funding, and implementation flexibility to carry out inventories, sampling, and replacement work responsibly.",
      "The rule should move forward, but rural systems need realistic deadlines, funding certainty, and technical support to complete service line inventories, tap sampling, and lead pipe replacement without compromising service reliability.",
      "Please keep the public health goals of the rule while giving rural systems phased timelines, technical assistance, and funding support for replacement, sampling, and public notice obligations.",
    ],
  },
];

const UNIQUE_PROFILES = [
  {
    count: 92,
    stakeholderGroup: "Public Health Organizations",
    organizations: [
      "Children's Drinking Water Project",
      "Center for Healthy Homes Research",
      "Midwest Exposure Science Institute",
      "Alliance for Pediatric Environmental Health",
    ],
    openings: [
      "Lead in drinking water remains a serious public health risk, especially for infants and young children.",
      "Our public health teams support stronger protections because there is no safe level of lead exposure in drinking water.",
      "The final rule should reflect what communities and clinicians already know about the harms of lead exposure.",
    ],
    clauses: [
      "EPA should require full lead service line replacement and stronger public notice when elevated lead is found.",
      "Lowering the lead action level will help trigger action sooner for families living with lead service lines.",
      "Certified filters should be made available quickly when sampling or inventories identify meaningful exposure risk.",
      "Families in {city}, {state} need clear information when a nearby {facility} is part of a lead response effort.",
    ],
  },
  {
    count: 118,
    stakeholderGroup: "Water Utilities",
    organizations: [
      "Great Lakes Water Authority",
      "Tri-State Municipal Water Association",
      "Capital Region Utility Network",
      "Riverbend Public Water District",
    ],
    openings: [
      "Our utility supports the public health goals of the proposal and wants the final rule to be operationally workable.",
      "We agree that inventories and replacement plans are necessary, but EPA should calibrate the implementation details carefully.",
      "The final rule should align strong public protections with realistic utility execution requirements.",
    ],
    clauses: [
      "EPA should preserve public inventories and replacement planning while giving utilities clear implementation sequencing.",
      "Sampling and notification rules should be strong but designed so utilities can communicate accurate, verified information quickly.",
      "The replacement mandate will be more effective if paired with stable funding, procurement flexibility, and workforce support.",
      "Utilities serving neighborhoods in {city}, {state} need clear federal direction before replacing every legacy line on accelerated timelines.",
    ],
  },
  {
    count: 86,
    stakeholderGroup: "State Drinking Water Regulators",
    organizations: [
      "Michigan Drinking Water Office",
      "Pennsylvania Bureau of Safe Drinking Water",
      "Ohio Office of Drinking Water",
      "Wisconsin Drinking Water Program",
    ],
    openings: [
      "States need a final rule that is clear enough to implement consistently and strong enough to protect public health.",
      "Our agency supports a rule that improves lead service line data, sampling, and communication with the public.",
      "Implementation experience suggests that the final rule should make state oversight easier, not more fragmented.",
    ],
    clauses: [
      "EPA should maintain public inventory requirements because they give states and communities a workable baseline for oversight.",
      "The final rule should make school and child care sampling easier to communicate and enforce across jurisdictions.",
      "Funding and flexibility for smaller systems remain important, but they should not weaken the expectation of full lead pipe replacement.",
      "State reviewers in {state} need consistent data from every {facility} affected by the rule.",
    ],
  },
  {
    count: 104,
    stakeholderGroup: "Parents and Community Groups",
    organizations: [
      "Moms for Safe Tap Water",
      "Neighborhood Water Watch",
      "Lead-Free Kids Coalition",
      "Community Pipes Action Network",
    ],
    openings: [
      "Parents should not need technical expertise to understand whether their children are exposed to lead in drinking water.",
      "Residents deserve straightforward information, fast notice, and real replacement plans when lead service lines are present.",
      "The final rule should be written from the perspective of the household receiving the water bill and trusting the tap.",
    ],
    clauses: [
      "Public inventories should be easy to find and easy to understand, not buried in technical filings.",
      "Families should receive timely notice and filter support when testing shows a possible lead risk.",
      "EPA should protect children by strengthening school and child care sampling and communications.",
      "Parents in {city}, {state} should know whether the line serving a nearby {facility} contains lead.",
    ],
  },
  {
    count: 96,
    stakeholderGroup: "Schools and Child Care Operators",
    organizations: [
      "National School Facilities Alliance",
      "Early Learning Water Safety Network",
      "Children First Operations Council",
      "Public Schools Infrastructure Forum",
    ],
    openings: [
      "Schools and child care facilities need clear requirements and actionable notice when lead is found.",
      "Child-serving facilities support stronger lead protections, but they need rules that are easy to implement and explain to families.",
      "The final rule should make school and child care sampling more protective and easier to communicate.",
    ],
    clauses: [
      "Testing in schools and child care settings should be more visible to families and community members.",
      "EPA should make it clear how quickly families, staff, and operators must be informed after elevated lead results.",
      "Filter access and public communication should accompany sampling so operators are not left improvising crisis responses.",
      "Facilities in {city}, {state} need guidance when a nearby {facility} becomes part of a lead service line response plan.",
    ],
  },
  {
    count: 110,
    stakeholderGroup: "Rural Water Systems",
    organizations: [
      "Rural Water Partners",
      "Small Systems Operations Council",
      "Heartland Water Providers",
      "Community Utility Support Network",
    ],
    openings: [
      "Rural systems support the public health direction of the rule but need more realistic implementation support.",
      "Small systems should not be forced to choose between compliance and maintaining reliable service.",
      "The final rule should recognize the staffing, procurement, and financing limits facing rural systems.",
    ],
    clauses: [
      "EPA should provide more flexibility on implementation sequencing while preserving the end goal of replacing lead lines.",
      "Funding support and technical assistance are necessary for inventories, sampling, and replacement to succeed in smaller systems.",
      "Public notice obligations should remain strong, but EPA should allow practical communication methods for small systems.",
      "Rural utilities in {state} need time to organize contractors for work affecting a {facility}.",
    ],
  },
  {
    count: 127,
    stakeholderGroup: "Environmental Justice and Housing Advocates",
    organizations: [
      "Justice for Safe Water",
      "Healthy Homes Action Lab",
      "Urban Infrastructure Equity Project",
      "Lead-Free Neighborhoods Alliance",
    ],
    openings: [
      "Lead exposure is an environmental justice issue because the households facing the highest risk often have the fewest resources to respond.",
      "Communities that have historically carried the burden of aging infrastructure need a rule that is both strong and transparent.",
      "The final rule should center the people most affected by legacy lead service lines and uneven information access.",
    ],
    clauses: [
      "Public inventories and replacement plans should be accessible to renters, homeowners, and community groups alike.",
      "EPA should require clear notice, filters, and strong follow-through when lead is detected in drinking water.",
      "School and child care protections are essential because children often face overlapping sources of lead exposure.",
      "Residents in {city}, {state} should not have to fight to learn whether a nearby {facility} is served by lead infrastructure.",
    ],
  },
  {
    count: 74,
    stakeholderGroup: "First-Time Residents",
    organizations: [
      "Local resident",
      "Concerned renter",
      "Neighborhood parent",
      "Town homeowner",
    ],
    openings: [
      "I am new to this issue, but I want cleaner drinking water.",
      "I am not an expert, but I want to understand whether my family is safe.",
      "I do not work in water policy, but this feels important for regular people.",
    ],
    clauses: [
      "Please make the rules easy to understand.",
      "I support better notice if lead is found.",
      "Families should get simple information and help.",
      "People in {city}, {state} should not need special knowledge to follow this.",
    ],
    clauseCount: 2,
    shortComment: true,
  },
  {
    count: 68,
    stakeholderGroup: "Affordability Concerned Residents",
    organizations: [
      "Ratepayer voice",
      "Concerned customer",
      "Water bill resident",
      "Local taxpayer",
    ],
    openings: [
      "I worry that this rule could raise water bills too fast.",
      "I am concerned about affordability if utilities have to move too quickly.",
      "I support safety, but I also worry about the cost to households.",
    ],
    clauses: [
      "Please do not make this too expensive for regular families.",
      "The timeline should be realistic.",
      "Funding should come before mandates.",
      "People in {city}, {state} are already dealing with high bills.",
    ],
    clauseCount: 2,
    shortComment: true,
  },
  {
    count: 55,
    stakeholderGroup: "Short Public Comments",
    organizations: [
      "Public submitter",
      "Resident comment",
      "Anonymous public voice",
      "Online commenter",
    ],
    openings: [
      "Support this rule.",
      "Please slow this down.",
      "Need more transparency.",
      "Worried about costs.",
    ],
    clauses: [
      "Protect kids.",
      "Give more time.",
      "Show the data.",
      "Keep bills down.",
    ],
    clauseCount: 1,
    shortComment: true,
    noBridge: true,
  },
];

export const OFFICIAL_SOURCES = [
  {
    title: "Proposed Lead and Copper Rule Improvements",
    agency: "EPA",
    kind: "Proposed rule page",
    url: "https://www.epa.gov/ground-water-and-drinking-water/proposed-lead-and-copper-rule-improvements",
    note: "Plain-English overview of the proposed rule, FAQs, supporting materials, and docket ID EPA-HQ-OW-2022-0801.",
  },
  {
    title: "Lead and Copper Rule Improvements",
    agency: "EPA",
    kind: "Final rule page",
    url: "https://www.epa.gov/ground-water-and-drinking-water/lead-and-copper-rule-improvements",
    note: "Shows the final rule stage so users can see how a proposed rule moves to final action.",
  },
  {
    title: "Basics of the Regulatory Process",
    agency: "EPA",
    kind: "Rulemaking explainer",
    url: "https://www.epa.gov/laws-regulations/basics-regulatory-process",
    note: "Explains how agencies propose rules, take comments, and finalize regulations.",
  },
  {
    title: "Summary of the Administrative Procedure Act",
    agency: "EPA",
    kind: "Legal process explainer",
    url: "https://www.epa.gov/laws-regulations/summary-administrative-procedure-act",
    note: "Grounds the educational walkthrough in the formal notice-and-comment process.",
  },
  {
    title: "About EPA Dockets",
    agency: "EPA",
    kind: "Docket explainer",
    url: "https://www.epa.gov/dockets/about-epa-dockets",
    note: "Defines what a docket is and why it contains documents and comments.",
  },
  {
    title: "Commenting on EPA Dockets",
    agency: "EPA",
    kind: "Commenting guide",
    url: "https://www.epa.gov/dockets/commenting-epa-dockets",
    note: "Explains what public comments are and how they are submitted.",
  },
  {
    title: "Regulations.gov FAQ",
    agency: "Regulations.gov",
    kind: "Site FAQ",
    url: "https://www.regulations.gov/faq",
    note: "General public help page for finding dockets, documents, and comments.",
  },
  {
    title: "Federal Register API v1",
    agency: "Federal Register",
    kind: "Developer documentation",
    url: "https://www.federalregister.gov/developers/documentation/api/v1",
    note: "Public metadata source for rule notices, documents, and publication information.",
  },
  {
    title: "Regulations.gov API",
    agency: "GSA / Regulations.gov",
    kind: "Developer documentation",
    url: "https://open.gsa.gov/api/regulationsgov/",
    note: "Public API docs for docket, document, and comment metadata.",
  },
];

// Simulated data sources - synthetic datasets for testing and demonstration
export const SIMULATED_DOCKETS = [
  {
    id: "EPA-HQ-OW-2022-0801",
    label: "EPA: Lead and Copper Rule Improvements",
    description: "Synthetic comment analysis dataset aligned to real EPA docket",
    commentCount: 2110,
    hasSimulatedData: true,
    campaigns: CAMPAIGNS,
    profiles: UNIQUE_PROFILES,
  },
];

// Real data sources - live from Regulations.gov API
export const REAL_DOCKETS = [
  {
    id: "FAA-2026-2295",
    label: "FAA: Boeing 787 Airworthiness Directives",
    description: "Live docket from Regulations.gov",
    agency: "FAA",
  },
  {
    id: "FMCSA-2014-0215",
    label: "FMCSA: Driver Exemptions - Epilepsy",
    description: "Live docket from Regulations.gov",
    agency: "FMCSA",
  },
];

// Combined catalog for UI display
export const SAMPLE_DOCKETS = [
  ...SIMULATED_DOCKETS.map(d => ({
    ...d,
    dataType: "simulated",
    badge: "🔵",
    commentCount: `${d.commentCount.toLocaleString()} (synthetic)`,
  })),
  ...REAL_DOCKETS.map(d => ({
    ...d,
    dataType: "real",
    badge: "🟢",
    commentCount: "Live from API",
  })),
];

export const TIMELINE_STEPS = [
  {
    title: "Agency drafts a proposal",
    example: "EPA develops proposed changes to the Lead and Copper Rule.",
    detail: "The agency defines the problem, drafts regulatory text, prepares supporting analysis, and publishes a proposal so the public can react to specific ideas.",
    dateLabel: "November 30, 2023",
  },
  {
    title: "Proposed rule and support materials are posted",
    example: "The proposal, fact sheets, FAQs, and supporting materials are made public.",
    detail: "People can read what the agency is proposing, why it is proposing it, and what questions or tradeoffs matter most.",
    dateLabel: "EPA + Federal Register materials",
  },
  {
    title: "Public comment period opens",
    example: "The docket on Regulations.gov accepts public comments tied to the proposed rule.",
    detail: "This is where residents, utilities, states, advocates, businesses, and experts send feedback, evidence, and recommendations.",
    dateLabel: "Docket ID EPA-HQ-OW-2022-0801",
  },
  {
    title: "Agency reviews the record",
    example: "Staff review comments, attachments, campaigns, technical documents, and legal issues.",
    detail: "This is the heavy manual step. Analysts look for duplicate campaigns, recurring topics, substantive arguments, and evidence that matters for the final rule.",
    dateLabel: "Manual review bottleneck",
  },
  {
    title: "Agency finalizes the rule",
    example: "EPA issues a final Lead and Copper Rule Improvements action.",
    detail: "The final rule reflects the agency’s decisions after considering comments and revising the proposal where needed.",
    dateLabel: "October 8, 2024 announcement",
  },
];

export const RULEMAKING_PRIMER = [
  {
    title: "What is a docket?",
    text: "A docket is the public case file for a rulemaking. It gathers the notice, supporting materials, and public submissions in one place so the public and the agency can follow the record.",
  },
  {
    title: "What is a document?",
    text: "Documents are the official materials around a rulemaking, such as the proposed rule notice, fact sheets, technical support documents, FAQs, hearing notices, and final rule materials.",
  },
  {
    title: "What is a comment?",
    text: "A comment is feedback submitted by the public during the comment period. A comment might be one sentence, a detailed technical memo, a local government letter, or a form-letter campaign submitted by many people.",
  },
];

export const CURRENT_STATE_STEPS = [
  {
    title: "1. Read the rule and support documents",
    detail: "Analysts first learn what the agency proposed, what decisions are open, and what evidence already exists in the docket.",
  },
  {
    title: "2. Find and organize comments",
    detail: "Comments arrive in different styles and lengths. Some are substantive memos, some are short public submissions, and some are part of coordinated campaigns.",
  },
  {
    title: "3. Identify duplicates and recurring issues",
    detail: "Humans often need to spot repeated language, common stakeholder positions, and recurring themes before they can do deeper legal or policy analysis.",
  },
  {
    title: "4. Pull out arguments and evidence",
    detail: "Analysts separate volume from substance by identifying the actual claims being made and the evidence or data behind them.",
  },
  {
    title: "5. Draft issue summaries and response support",
    detail: "The agency then drafts structured issue summaries and response-to-comments support that can feed the final action.",
  },
  {
    title: "6. Legal, policy, and management review",
    detail: "Human review remains essential. Agencies still need defensible reasoning, source traceability, and policy judgment.",
  },
];

export const MISCONCEPTION_NOTES = [
  {
    title: "What people often get wrong",
    text: "It is not accurate to think one analyst simply reads every comment the same way from top to bottom and treats each comment like a vote.",
  },
  {
    title: "What is closer to the truth",
    text: "Agencies still need to review and consider the comment record, identify substantive issues, and support a defensible final action. The work is labor-intensive because comments vary in quality, duplication, evidence, and legal significance.",
  },
  {
    title: "Why AI helps",
    text: "AI can batch, normalize, cluster, classify, and draft source-linked summaries so humans spend more time on judgment and less time on repetitive triage.",
  },
];

export const DOCKET_DOCUMENTS = [
  {
    id: "DOC-001",
    title: "Proposed Lead and Copper Rule Improvements",
    type: "Proposed rule landing page",
    sourceSystem: "EPA",
    postedAt: "2023-11-30",
    officialUrl: "https://www.epa.gov/ground-water-and-drinking-water/proposed-lead-and-copper-rule-improvements",
    note: "Public entry point for the proposal, FAQs, and supporting materials.",
  },
  {
    id: "DOC-002",
    title: "Biden-Harris Administration Proposes to Strengthen the Lead and Copper Rule",
    type: "Press release",
    sourceSystem: "EPA",
    postedAt: "2023-11-30",
    officialUrl: "https://www.epa.gov/newsreleases/biden-harris-administration-proposes-strengthen-lead-and-copper-rule-protect-all",
    note: "Human-readable summary of what the proposed rule would change and why.",
  },
  {
    id: "DOC-003",
    title: "About EPA Dockets",
    type: "Process explainer",
    sourceSystem: "EPA",
    postedAt: "Evergreen",
    officialUrl: "https://www.epa.gov/dockets/about-epa-dockets",
    note: "Useful for teaching what the public case file contains.",
  },
  {
    id: "DOC-004",
    title: "Commenting on EPA Dockets",
    type: "Public guidance",
    sourceSystem: "EPA",
    postedAt: "Evergreen",
    officialUrl: "https://www.epa.gov/dockets/commenting-epa-dockets",
    note: "Explains how comments are submitted and why they matter.",
  },
  {
    id: "DOC-005",
    title: "Regulations.gov search for docket EPA-HQ-OW-2022-0801",
    type: "Docket search",
    sourceSystem: "Regulations.gov",
    postedAt: "Public docket",
    officialUrl: "https://www.regulations.gov/search?filter=docketId=EPA-HQ-OW-2022-0801",
    note: "Directs users to the public docket search experience.",
  },
];

export const CURATED_PUBLIC_COMMENTS = [
  {
    id: "PUB-001",
    submitter: "Parent advocacy coalition",
    stakeholder: "Parents and Residents",
    type: "Public comment",
    note: "Supports full line replacement, clearer public inventories, and filter support.",
  },
  {
    id: "PUB-002",
    submitter: "Large municipal utility",
    stakeholder: "Water Utilities",
    type: "Public comment",
    note: "Supports inventories and public health goals, but argues for more flexible timelines and funding.",
  },
  {
    id: "PUB-003",
    submitter: "State drinking water program",
    stakeholder: "State Regulators",
    type: "Public comment",
    note: "Supports stronger inventories and sampling but focuses on implementability and oversight consistency.",
  },
  {
    id: "PUB-004",
    submitter: "School facilities network",
    stakeholder: "Schools and Child Care",
    type: "Public comment",
    note: "Asks for stronger testing and clearer notice to families when lead is found.",
  },
  {
    id: "PUB-005",
    submitter: "Rural water association",
    stakeholder: "Rural Water Systems",
    type: "Public comment",
    note: "Supports the end goal but requests technical assistance, staffing support, and phased execution.",
  },
];

export const AGENT_TEAM = [
  {
    id: "source-retrieval",
    label: "Source Retrieval",
    accent: "signal",
    input: "Official EPA, Federal Register, and Regulations.gov links",
    tool: "URL fetch + metadata parser",
    output: "Docket metadata, document list, comment records",
    humanCheckpoint: "Confirm the docket and source links are the right rulemaking.",
    prompt: "Retrieve docket metadata, official documents, and public comment records for docket EPA-HQ-OW-2022-0801. Return source IDs, titles, URLs, and dates only.",
    tools: ["EPA pages", "Federal Register API", "Regulations.gov API"],
    packetLabel: "docket metadata",
  },
  {
    id: "rule-reader",
    label: "Rule Reader",
    accent: "gold",
    input: "Proposed rule documents and EPA explainer materials",
    tool: "Topic seeding prompt",
    output: "Canonical topic registry",
    humanCheckpoint: "Review whether the topic list matches the actual proposal.",
    prompt: "Extract the main policy issues raised by the proposed rule. Create plain-English topic labels and keep each one tied to the source document IDs.",
    tools: ["Document parser", "Topic registry schema"],
    packetLabel: "topic registry",
  },
  {
    id: "comment-triage",
    label: "Comment Triage",
    accent: "support",
    input: "Raw public comments",
    tool: "Normalization + duplicate detection",
    output: "Substantive review units and campaign clusters",
    humanCheckpoint: "Review clusters that may be false positives or mixed bundles.",
    prompt: "Normalize comment text, identify exact and near-duplicate campaigns, and choose one representative comment for each campaign cluster.",
    tools: ["Deduper", "Similarity model", "Cluster QA rules"],
    packetLabel: "comment batch",
  },
  {
    id: "topic-classifier",
    label: "Topic Classifier",
    accent: "support",
    input: "Comment spans + topic registry",
    tool: "Multi-label topic classification",
    output: "Topic assignments with confidence",
    humanCheckpoint: "Route low-confidence spans for analyst review.",
    prompt: "Assign each comment span to one or more existing topics. Use evidence text and confidence scores. Do not invent new topics unless nothing fits.",
    tools: ["Classifier", "Confidence thresholds", "Escalation queue"],
    packetLabel: "topic assignments",
  },
  {
    id: "argument-extractor",
    label: "Argument Extractor",
    accent: "gold",
    input: "Topic-tagged comment spans",
    tool: "Claim normalization prompt",
    output: "Arguments, stance, organizations, evidence spans",
    humanCheckpoint: "Check ambiguous stance and merged argument labels.",
    prompt: "Extract normalized arguments from each topic-tagged span, assign stance, and preserve the exact evidence span and source comment ID.",
    tools: ["Extraction prompt", "Schema validator", "Entity normalizer"],
    packetLabel: "argument records",
  },
  {
    id: "graph-builder",
    label: "Graph Builder",
    accent: "signal",
    input: "Topics, arguments, organizations, campaigns, comments",
    tool: "Graph writer",
    output: "Knowledge graph nodes and edges",
    humanCheckpoint: "Spot-check that each node shown in the UI has evidence.",
    prompt: "Write graph nodes and edges for docket, documents, comments, campaigns, topics, arguments, organizations, and stakeholder groups. Keep source IDs on every visible object.",
    tools: ["Graph schema", "Node merger", "Traceability store"],
    packetLabel: "graph edges",
  },
  {
    id: "summary-qa",
    label: "Summary + QA",
    accent: "support",
    input: "Knowledge graph and evidence IDs",
    tool: "Summary generator + citation checker",
    output: "Analyst brief with source-linked statements",
    humanCheckpoint: "Reject unsupported claims and route uncertain items to human review.",
    prompt: "Produce an analyst-ready summary of the main issues, stakeholder positions, campaigns, and disagreements. Every sentence must cite source comment IDs.",
    tools: ["Summary generator", "Citation checker", "QA rules"],
    packetLabel: "draft summary",
  },
];

export const ROI_BREAKDOWN = [
  {
    label: "Manual first-pass intake",
    manual: "2 to 4 minutes per raw comment",
    assisted: "Collapsed into substantive units before humans review",
  },
  {
    label: "Issue spotting and duplicate detection",
    manual: "Done by analysts across thousands of records",
    assisted: "Automated clustering and representative selection",
  },
  {
    label: "Argument extraction and synthesis",
    manual: "Spreadsheet and memo work",
    assisted: "Structured graph + source-linked summaries",
  },
  {
    label: "Human role after AI",
    manual: "Everything",
    assisted: "Policy judgment, QA, exceptions, legal defensibility",
  },
];

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function pickDistinct(rng, list, count) {
  const pool = [...list];
  const items = [];
  while (pool.length > 0 && items.length < count) {
    const index = Math.floor(rng() * pool.length);
    items.push(pool.splice(index, 1)[0]);
  }
  return items;
}

function formatDate(rng) {
  const timestamp =
    COMMENT_PERIOD_START +
    Math.floor(rng() * (COMMENT_PERIOD_END - COMMENT_PERIOD_START));
  return new Date(timestamp).toISOString();
}

function makeSubmitter(rng) {
  return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
}

function fillTemplate(text, rng) {
  return text
    .replaceAll("{city}", pick(rng, CITIES))
    .replaceAll("{state}", pick(rng, STATES))
    .replaceAll("{facility}", pick(rng, FACILITIES));
}

function buildUniqueComment(profile, rng, index) {
  const org = pick(rng, profile.organizations);
  const opening = fillTemplate(pick(rng, profile.openings), rng);
  const clauseCount = profile.clauseCount || 3;
  const clauses = pickDistinct(rng, profile.clauses, clauseCount).map((clause) =>
    fillTemplate(clause, rng)
  );
  const bridge = profile.noBridge
    ? ""
    : index % 3 === 0
      ? "The final rule should be easy for families and utilities to understand."
      : index % 3 === 1
        ? "EPA should separate urgent public health protections from avoidable paperwork."
        : "The public will judge this rule by whether it improves transparency and follow-through.";

  return {
    organization: org,
    stakeholderGroup: profile.stakeholderGroup,
    submitterName: makeSubmitter(rng),
    sourceText: [opening, clauses.join(" "), bridge].filter(Boolean).join(" "),
  };
}

export function getScenario() {
  return {
    title: "EPA Lead and Copper Rule Improvements",
    docketId: "EPA-HQ-OW-2022-0801",
    subtitle:
      "Educational walkthrough of a real public rulemaking record, paired with a synthetic comment dataset that shows how AI can help analysts review public input at scale.",
    analystNeed:
      "Agency staff need to understand the docket, review documents, consider public comments, detect campaigns, extract issues, and draft defensible summaries without losing traceability.",
    sourceSystem: "EPA + Federal Register + Regulations.gov",
  };
}

export function generateDemoComments() {
  const rng = createRng(20260313);
  const comments = [];
  let counter = 1;

  for (const campaign of CAMPAIGNS) {
    for (let index = 0; index < campaign.count; index += 1) {
      comments.push({
        comment_id: `RGC-${String(counter).padStart(5, "0")}`,
        submitter_name: makeSubmitter(rng),
        organization: campaign.organization,
        stakeholder_group: campaign.stakeholderGroup,
        timestamp: formatDate(rng),
        source_text: campaign.textVariants[index % campaign.textVariants.length],
      });
      counter += 1;
    }
  }

  for (const profile of UNIQUE_PROFILES) {
    for (let index = 0; index < profile.count; index += 1) {
      const comment = buildUniqueComment(profile, rng, index);
      comments.push({
        comment_id: `RGC-${String(counter).padStart(5, "0")}`,
        submitter_name: comment.submitterName,
        organization: comment.organization,
        stakeholder_group: comment.stakeholderGroup,
        timestamp: formatDate(rng),
        source_text: comment.sourceText,
      });
      counter += 1;
    }
  }

  return comments;
}
