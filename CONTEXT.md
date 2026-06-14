# CONTEXT.md

Safe handoff context for a fresh AI session working on `youngsu-blog`.

## What this project is

Personal technical blog and content platform.

- Repo: `/home/yeongsu/docker/youngsu-blog`
- GitHub: `youngsu5582/youngsu-blog`
- Public site: `https://youngsu5582.today`
- Framework: Next.js 16 App Router + TypeScript
- Styling: Tailwind CSS v4 + shadcn/ui v4
- Content: MDX via Velite
- Search: Fuse.js
- Tests: Vitest
- Deploy: Vercel

## Read first

1. `README.md`
2. `AGENTS.md`
3. `CONTEXT.md`
4. `docs/AI_SYNC.md`
5. `velite.config.ts`
6. `config/site.ts`
7. `config/navigation.ts`
8. relevant `lib/*`, `components/*`, or `content/*` files for the task

## Security / privacy boundary

Never print, commit, or paste elsewhere:

- `.env.local` values or API keys
- private uploaded assets unless the user explicitly points to them
- unpublished personal/company-sensitive drafts unless the user explicitly asks
- private company details, internal URLs, credentials, or proprietary code

Use placeholders such as `[REDACTED]` for secrets.

## Common validation

```bash
pnpm test
pnpm build
git diff --check
git status --short --branch
```

If the task is content-only, at minimum run the repository's content validation/build command if available and explain any skipped checks.

## Content conventions

- Korean blog drafts: casual first-person, natural, not resume-like or AI-ish.
- Technical posts: practical examples, failure modes, tradeoffs, commands, and screenshots/assets when relevant.
- SEO/AEO/GEO work should inspect metadata, sitemap, robots, JSON-LD, content schema, and live behavior when possible.
- Keep public profile/README pages clean and intentional.

## Cross-account work split

Safe for another AI/company account:

- UI/component code patches
- SEO/schema review
- test improvements
- redacted content structure suggestions
- patch generation from tracked files

Keep personal Hermes responsible for:

- final privacy/content review
- publishing decisions
- handling real API keys or local `.env.local`
- deciding whether personal/company details can be public
