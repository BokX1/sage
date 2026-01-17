# Sage Deployment Guide

## Overview

Sage is a Node.js + TypeScript application using Prisma (SQLite/Postgres) and Discord.js.

## Environment Variables

Ensure the following are set in `.env` (production) or environment:

- `DISCORD_TOKEN`: Production bot token.
- `DISCORD_APP_ID`: Application ID.
- `DATABASE_URL`: Connection string (e.g. `file:./dev.db` or Postgres URL).
- `LLM_PROVIDER`: `pollinations` (default).
- `POLLINATIONS_MODEL`: `deepseek` (default, or `openai`, `mistral`, `llama`).
- `LOG_LEVEL`: `info` (or `debug` for troubleshooting).

## Deployment Steps (Docker - Recommended)

*(Docker support pending in future phases, currently running as Node process)*

## Deployment Steps (Manual / VM)

1. **Clone & Install**

   ```bash
   git clone <repo>
   cd Sage
   npm ci
   ```

2. **Build**

   ```bash
   npm run build
   ```

3. **Database**

   ```bash
   npx prisma migrate deploy
   ```

4. **Verify**

   ```bash
   npm run doctor
   ```

5. **Run**

   ```bash
   npm start
   ```

   (Uses `node dist/index.js`)

## Process Management

Use `pm2` or `systemd` to keep the process alive.

```bash
pm2 start dist/index.js --name sage
```
