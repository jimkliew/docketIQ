# DocketIQ MVP

`DocketIQ` is a dependency-free hackathon demo for public comment intelligence in federal rulemaking. It starts from a real docket ID, loads public rulemaking documents, triages sample comments with transparent AI scoring agents, visualizes topic clusters, and shows an auditable multi-agent review workflow.

## Run

Use any static web server from the project root:

```bash
cd /Users/jimliew/Projects/act-iac-hack
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Optional OpenAI key

The app now includes an `OpenAI API key` field in the top-right header.

- If a valid key is present, the Step 2 proposed-rule summary is generated with OpenAI from docket metadata and document context.
- If no key is present, the app falls back to a local metadata summary.
- The key is stored only in browser local storage for this demo.

## Verify

```bash
cd /Users/jimliew/Projects/act-iac-hack
node scripts/verify.mjs
```

## Demo flow

1. `Pick a Docket ID`
   Load one of the sample public dockets and let the app fetch the docket snapshot automatically.
2. `Docket Snapshot`
   Show the proposed-rule summary and the actual public documents in the docket, including file-type icons and hover summaries.
3. `Sample Public Comments`
   Show the `Authority Agent` and `Sentiment Agent`, the topic-cluster map, interactive response filters, and the topic analysis view.
4. `Agents at Work`
   Show the city-map style agent workflow with visible handoffs, prompts, tools, recent history, and audit ledger.
5. `Output`
   Show the analyst-facing summary, knowledge graph preview, campaign concentration, and estimated time savings.

## Notes

- The educational content is anchored to official public EPA, Federal Register, and Regulations.gov links.
- The comment analysis dataset is synthetic and aligned to the real EPA lead and copper docket so the demo stays reliable and easy to explain.
- The extraction layer is still deterministic for the comment pipeline so the demo runs locally without requiring external APIs.
- Step 2 summary generation is LLM-backed when a working OpenAI key is available.
