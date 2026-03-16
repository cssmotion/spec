# Contributing to the CSSMotion Spec

Thanks for your interest in contributing. The spec is a community effort — all feedback, proposals, and corrections are welcome.

## Ways to contribute

**Found a bug or ambiguity in the spec?**
Open an issue. Describe the problem clearly and, if possible, provide a manifest example that demonstrates it.

**Want to propose a new field or change?**
Open an issue first before writing a PR. Label it `proposal`. Describe:
- What problem it solves
- What the field/change looks like (JSON example)
- Whether it is a breaking change (major) or additive (minor)

**Submitting a PR?**
- Keep changes focused — one issue per PR
- If you add or change a schema field, update `README.md` accordingly
- If you add an example manifest, run `npm run validate:all` and confirm it passes
- All PRs require at least one review before merge

## Versioning rules

The spec follows semver:

- **PATCH** — typo fixes, clarifications, description changes
- **MINOR** — new optional fields (backward compatible)
- **MAJOR** — breaking changes to required fields, removals, or semantic changes

Breaking changes require a discussion issue with at least 7 days open before a PR is accepted.

## Running the validator locally

```bash
npm install
npm run validate:all
```

To validate your own manifest:

```bash
node tools/validate.js path/to/manifest.json
```

## Code of conduct

Be direct, be kind, assume good intent.
