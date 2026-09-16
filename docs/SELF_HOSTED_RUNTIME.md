# Self-hosted runtime boundary

The public Next.js runtime and the Blog Admin editor use different filesystem roles.

- `/app` is the immutable application image. It contains the production dependencies,
  Velite output, and `.next` build artifact.
- `BLOG_REPO_ROOT` points to the mutable Blog checkout used by Admin filesystem and
  Git/PR operations. The homeserver mounts that checkout at `/workspace`.
- Editing an MDX file changes the workspace only. The public rendered site changes
  only after an explicit image build and guarded runtime replacement.

The default value of `BLOG_REPO_ROOT` remains the process working directory so local
`pnpm dev`, tests, and existing development workflows continue to work.

## Production image

`Dockerfile` uses a multi-stage build. The builder reads the content checkout and
runs `pnpm build`; the runner copies `.next`, `.velite`, `public`, and production
dependencies into the image and runs only `next start`.

The runtime must not mount the Blog checkout over `/app`. Mount it at `/workspace`
and set:

```yaml
environment:
  BLOG_REPO_ROOT: /workspace
volumes:
  - /home/yeongsu/docker/youngsu-blog:/workspace
```

A content edit can therefore be inspected and saved by Admin without changing the
running runtime artifact. Publishing is a separate build/deploy operation with
route and static-chunk verification.
