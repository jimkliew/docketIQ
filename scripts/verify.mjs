import { generateDemoComments } from "../src/data.mjs";
import { runPipeline } from "../src/pipeline.mjs";

globalThis.performance = globalThis.performance || { now: () => Date.now() };

const comments = generateDemoComments();
const results = runPipeline(comments, { collapseCampaigns: true });

if (comments.length < 2800) {
  throw new Error(`Expected at least 2800 demo comments, received ${comments.length}`);
}

if (results.summary.campaignCount < 4) {
  throw new Error(`Expected at least 4 campaign clusters, received ${results.summary.campaignCount}`);
}

if (results.summary.canonicalUnits >= comments.length) {
  throw new Error("Campaign collapse did not reduce analyst review units.");
}

if (results.graph.nodes.length < 20 || results.graph.edges.length < 30) {
  throw new Error("Knowledge graph did not produce enough structure.");
}

if (results.summary.summarySections.some((section) => section.evidence_comment_ids.length === 0)) {
  throw new Error("Each summary section must retain traceability evidence.");
}

console.log("Verification passed.");
console.log(
  JSON.stringify(
    {
      comments: comments.length,
      campaigns: results.summary.campaignCount,
      canonicalUnits: results.summary.canonicalUnits,
      graphNodes: results.graph.nodes.length,
      graphEdges: results.graph.edges.length,
      hoursSaved: Number(results.summary.hoursSaved.toFixed(1)),
    },
    null,
    2
  )
);
