# Release Process

This project follows **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`.

## Changelog

- Update `CHANGELOG.md` for every user-facing change.
- Group entries by version and date.
- Note any migrations, configuration changes, or breaking behavior.

## Release checklist

1. **Update version** in `package.json` and `CHANGELOG.md`.
2. **Run validations**:
   - `npm run lint`
   - `npm run build`
   - `npm run test`
3. **Review database migrations** (if applicable) and document required steps.
4. **Confirm config changes** and update documentation if new env vars are added.
5. **Tag the release** and publish artifacts if applicable.

## PR review expectations

- PRs should include a concise summary, test results, and any operational notes.
- Risky changes (provider payloads, tool routing, or memory handling) should include targeted tests.
- Avoid modifying prompt strings or timeouts unless fixing a documented bug.
