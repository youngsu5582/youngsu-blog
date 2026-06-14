# AGENTS.md

Project-specific instructions for AI coding assistants working on `youngsu-blog`.

## Project

Personal technical blog built with Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui v4, MDX, Velite, Fuse.js, and Vitest.

Public site: `https://youngsu5582.today`

## Read first

1. `README.md`
2. `CONTEXT.md`
3. `docs/AI_SYNC.md`
4. `velite.config.ts`
5. `config/site.ts`
6. `config/navigation.ts`
7. Relevant content/schema/helper files for the task

## Safety rules

- Never commit `.env.local` or API keys.
- Do not invent personal facts; if writing profile/about/career content, use only provided context or ask.
- Treat unpublished drafts and uploaded images as user content.
- Keep company/private details out of posts unless the user explicitly asks.
- For SEO/metadata work, inspect actual routes and content schema before claiming behavior.

## Development workflow

Use pnpm.

```bash
pnpm install
pnpm test
pnpm build
```

Content validation and generation commands are documented in `README.md`.

Before completion:

```bash
git status --short --branch
git diff --check
pnpm test
pnpm build
```

If only docs changed, explain that build/test were skipped or not required.

## Content style

- Korean blog drafts should be natural first-person, casual, and non-AI-ish.
- Technical posts should include concrete examples, pitfalls, and operating notes.
- Keep profile/README clean and avoid dumping raw assistant summaries into public pages.

## Cross-account handoff

Use `CONTEXT.md` and `docs/AI_SYNC.md` for fresh AI/company-account sync. Return code changes as a diff/branch/PR; personal Hermes should do final content/privacy review before publishing.
