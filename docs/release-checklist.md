# Release Checklist

## Pre-Release

- [ ] **Version Bump**: Update `package.json` version.
- [ ] **Changelog**: Update `CHANGELOG.md`.
- [ ] **Certification**: Run `npm run cert` and ensure it passes (GREEN).
- [ ] **Doctor**: Run `npm run doctor` to verify local config.

## Deployment

- [ ] Pull latest code on target server.
- [ ] `npm ci` to install fresh dependencies.
- [ ] `npx prisma migrate deploy` to apply DB changes.
- [ ] `npm run build` to recompile.
- [ ] Restart service (`pm2 restart sage`).

## Post-Release Verification

- [ ] Check logs for startup errors (`npm run doctor` in prod if possible).
- [ ] Test basic command (`!ping` or mention bot).
- [ ] Test LLM feature (if enabled): e.g. "Plan a movie night".
