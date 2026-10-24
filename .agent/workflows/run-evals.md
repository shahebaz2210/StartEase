---
description: Run the evaluation sets and report results
---
1. Run the retrieval cases in data/eval/retrieval.json (top-3 hit rate and step-1 exactness).
2. Run out_of_scope.json and adversarial.json and compare with the expected behaviour.
3. Cache LLM responses and call Gemini sparingly to protect the free-tier quota.
4. Post a table of results against the targets in docs/acceptance-criteria.md (section E).
5. List the five worst failures and suggest fixes. Do not edit the catalogue without approval.
