# Question Subagents

This setup uses three coordinated subagents:

- `Writer`: enriches and rewrites open-ended questions.
- `Critic Pro`: audits with deterministic rules and optional LLM decisions.
- `Orchestrator`: executes the full pipeline and ships artifacts.

## Pipeline

Execution order:

1. `LLM Writer` (bootstrap enrichment)
2. `LLM Critic`
3. `Rule Critic` (blocking authority)
4. `Fix Pass`
5. `Gate Evaluation`

## OpenRouter Setup

Required environment variable:

```bash
export OPENROUTER_API_KEY="<your_key>"
```

Optional override:

```bash
export OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
```

Provider/model settings live in:

- `subagents/config/pipeline.json`
- `require_llm` is enabled by default, so orchestrator runs are LLM-only.
- recommended model split is preconfigured:
  - writer: `anthropic/claude-sonnet-4.6`
  - critic: `openai/gpt-5.2`
  - orchestrator summary: `openai/gpt-5.2`

## Prompt Assets

- `subagents/prompts/orchestrator.system.md`
- `subagents/prompts/writer.system.md`
- `subagents/prompts/critic.system.md`

All prompts require JSON-only responses.

## Commands

Core commands:

```bash
npm run questions:critic:pro
npm run questions:writer
npm run questions:orchestrate
```

Planned rollout commands:

```bash
npm run questions:orchestrate:pilot
npm run questions:orchestrate:full
npm run questions:orchestrate:dry
```

## Output Artifacts

Generated in `Banks/`:

- `final-pack.json` (shippable questions only)
- `needs-verification.json` (excluded backlog)
- `final-pack.qa-report.json` (distribution/dedupe/fix metrics)
- `final-pack.summary.md` (human-readable run summary)
- `final-pack.summary.json` (compact machine-readable summary)
- `question-orchestrator-report*.json` (run metadata)

## Hybrid Schema Support

Writer enriches each question with these fields while preserving existing ones:

- `prompt_ar`
- `hint_ar`
- `accepted_answers_ar`
- `reject_answers_ar`
- `explanation_ar`
- `difficulty_1to5`
- `tags`
- `acceptance_rules`
- `verification` (`verified|needs_verification`)

Legacy fields remain compatible for import:

- `question_ar`
- `answer_ar`
- `acceptable_answers_ar`

## Configuration

Edit these files to tune behavior:

- `subagents/config/rubric.json`
- `subagents/config/quality_gates.json`
- `subagents/config/source_policy.json`
- `subagents/config/house_style.json`
- `subagents/config/category_rules.json`
- `subagents/config/custom_checks.json`
- `subagents/config/writer_overrides.json`
- `subagents/config/pipeline.json`

## Troubleshooting

1. `MISSING_API_KEY`:
- Set `OPENROUTER_API_KEY`.

2. `INVALID_JSON` from LLM:
- Keep prompt strict JSON-only.
- Re-run; client retries automatically.

3. Gates not passing:
- Check `Banks/question-critic-pro-report.json`.
- Run fix pass or relax thresholds in `quality_gates.json` only if intentional.

4. Too many items in verification backlog:
- Inspect `needs-verification.json`.
- Add trusted sources or tighten/clarify prompts.

## Feedback Memory

Add persistent style rules:

```bash
npm run questions:feedback:add -- "Prefer one clear clue in each 400-point question."
```
