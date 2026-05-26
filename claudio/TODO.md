Rolling tracker of in-flight + outstanding work in super-copy-to-md. Shared coordination surface between Gary and Claudio.

## Now

Next up, in priority order. Re-curated each session.

1. (empty — v2.0 just shipped; awaiting next direction)

## Other outstanding

- [ ] Triage any open items in the GitHub issues tracker — see [[reference_github_issues]].

## Glossary

- **Action** — a context-menu entry contributed by the extension (e.g. "Copy as markdown", "Copy link as markdown", "Copy image as markdown", "Copy as quote", "Copy page link").

## Context

- Chrome extension. Manifest + content scripts under `src/`; build via `build.ps1` / `npm run build`.
- Issues live on GitHub (gmccullo/super-copy-to-md/issues), not in the local `issues/` folder.
- Lint: `npm run lint` (ESLint flat config in `eslint.config.js`).
- Publishing artifacts (zip, store description, privacy policy) under `publishing/`.
- Current shipped version: v2.0.
