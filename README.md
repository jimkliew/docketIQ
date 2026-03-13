# DocketIQ MVP

`DocketIQ` is a dependency-free hackathon demo for public comment intelligence in federal rulemaking. It now opens with an educational walkthrough of how rulemaking works, what a docket contains, how human review happens today, and how an agent team can turn a large public comment record into a traceable knowledge graph and analyst-ready summary.

## Run

Use any static web server from the project root:

```bash
cd /Users/jimliew/Projects/act-iac-hack
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Verify

```bash
cd /Users/jimliew/Projects/act-iac-hack
node scripts/verify.mjs
```

## Demo flow

1. Start on `Overview`, `Timeline`, and `Docket` to explain rulemaking in plain English using the EPA lead and copper case study.
2. Move to `Manual Review` to show the current human bottleneck and correct the “someone reads every comment the same way” misconception.
3. Open `Agents at Work` to show the animated handoff workflow and transparent prompts/tools.
4. Move to `Knowledge Graph` and `Analyst Summary` to show how comments become structured issues, arguments, and source-linked findings.
5. Finish on `ROI` and `Sources` to connect the product back to government benefit and official public documentation.

## Notes

- The educational content is anchored to official public EPA, Federal Register, and Regulations.gov links.
- The comment analysis dataset is synthetic and aligned to the real EPA lead and copper docket so the demo stays reliable and easy to explain.
- The extraction layer is deterministic so the demo runs locally without external APIs, but the prompts and workflow are designed to be LLM-ready.
