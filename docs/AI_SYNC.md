# AI Sync Workflow

Use this when blog work is split between personal Hermes and another AI/coding account.

## Safe startup prompt

```text
You are helping with my personal Next.js technical blog repository.

Read README.md, AGENTS.md, CONTEXT.md, and docs/AI_SYNC.md first.

Boundaries:
- Do not ask for or print .env.local values or API keys.
- Do not publish or expose personal/company-sensitive details unless explicitly provided for publication.
- Return changes as a unified diff, branch, or PR.

Task:
<describe the task>

Expected output:
1. Relevant files inspected.
2. Patch/plan.
3. Validation commands to run locally.
4. Privacy/content assumptions.
```

## Patch handoff

Ask for a narrow patch:

```bash
git diff > youngsu-blog-change.patch
```

Apply locally:

```bash
git apply --check youngsu-blog-change.patch
git apply youngsu-blog-change.patch
```

Then run:

```bash
pnpm test
pnpm build
git diff --check
```

## Do not send elsewhere

- `.env.local`
- API keys
- unpublished sensitive drafts
- private company/internal details
- raw personal data not intended for publication

## Return format

```text
Summary:
- <what changed>

Files changed:
- <path>: <reason>

Validation:
- <command>: <result or not run>

Content/privacy notes:
- <assumptions/redactions>
```
