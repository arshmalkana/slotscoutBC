# SlotScout (slotscout.ca)

Checks any spot in British Columbia, rule by rule, for recreational target shooting. Specs: *BC Shoot Check: Product Requirements* and *Addendum A, Text-to-Map and Browser Capture* (the addendum wins where they conflict). Monthly steps are in `RUNBOOK.md`.

## Hard rules (Addendum A 10.6)

- Never mark anything green, approve a looser change, or approve your own extraction. Prepare the review packet and stop. `make approve` and `make signoff` are for people only; never run them.
- Never output coordinates from reading text. Every extracted field must carry the exact quote it came from. Code, not you, finds places in official datasets and draws shapes.
- In agent mode, the second pass is done by a fresh subagent given only the source text and the schema, never the first answer.
- Follow robots.txt and site terms. Never use the browser to get around a site's rules. For BC Laws, use the confirmed API (only when `bclaws.api_confirmed = true` in `config.toml`) or the person's copy in `inbox/`.
- When a source fails, a check fails or the AI runs disagree, record it and turn the affected area grey. Never fix a failure by loosening a rule or a threshold.
- Keep the API key in `.env` only. No user data in any prompt: models receive public legal text and notices only.
- Commit after each step with a clear message, so every change can be traced.

## Where things are

```
packages/engine     Rule catalogue and verdict logic (shared by API, map, finder, pipeline)
packages/pipeline   Text-to-map pipeline CLI: pull, split, queue, extract, build, validate, review-packet, test, release, monthly
apps/api            Check API; also serves the built site
apps/web            The website
sources/registry.yaml  Every source: owner, URL, method, cadence, freshness limit
config.toml         Pipeline settings (no secrets)
inbox/              Files a person drops in by hand (BC Laws copies until API permission arrives)
raw/<YYYY-MM>/      Every pulled file, unchanged, with SHA-256 (large GIS bodies are git-ignored; manifests are committed)
queue/pending/      One task per text unit; queue/answers/run1, run2: the two independent extractions
prompts/, schema/   Versioned prompts and JSON schemas
rules/              Built rule features, one file per rule ID; only approved ones count fully
review/<YYYY-MM>/   Review packets for the person
releases/<YYYY-MM>/ Release packages (built only after approval and legal sign-off)
reports/            Change reports, test reports, run logs, status.json
data/               Registers the site reads (release pointer, coverage, bylaw register, regression set)
```

## Agent-mode extraction

`make extract` writes `queue/AGENT_TASKS.md` when no API key is set. For each listed task: read `queue/pending/<task>.json` and the prompt in `prompts/`, write the answer to `queue/answers/run1/<task>.json` in the schema from `schema/`, quoting the source verbatim for every field, leaving unknown fields null and listing them in `uncertain`. Then start a fresh subagent with only the source text, prompt and schema for run 2. Then `make build`.

## Checks before committing

`npm run typecheck && npm test && make validate`. Run `make test` (regression) before any release candidate: it stops on any false green.
