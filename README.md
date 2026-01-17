# Sage v0.1 Alpha

A Discord duo-companion bot powered by Pollinations AI.

## Prerequisites

- Node.js (LTS)
- npm (or pnpm if available)
- Docker (for Postgres, optional - can use SQLite for local dev)

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/BokX1/sage.git
cd sage
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your actual values (see Configuration below)

# 3. Setup database
docker-compose up -d          # Start Postgres
npx prisma migrate dev        # Run migrations

# 4. Run bot
npm run dev                   # Development mode
```

---

## Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Your Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications) |
| `DISCORD_APP_ID` | Your Discord application ID |
| `DATABASE_URL` | Database connection string |

### LLM Configuration (Pollinations)

Sage uses [Pollinations](https://pollinations.ai) as the default LLM brain.

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `pollinations` | LLM provider. |
| `POLLINATIONS_BASE_URL` | `https://gen.pollinations.ai/v1` | API endpoint |
| `POLLINATIONS_MODEL` | `gemini` | Model to use |

*Native Gemini support available via `LLM_PROVIDER=gemini`.*

### Other Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_MAX` | `5` | Max requests per window |
| `RATE_LIMIT_WINDOW_SEC` | `10` | Rate limit window in seconds |
| `AUTOPILOT_LEVEL` | `cautious` | `manual`, `cautious`, or `full` |
| `LOG_LEVEL` | `info` | Logging verbosity |

---

## 🔒 Security Best Practices

### Never Commit Secrets

- `.env` files are gitignored - **never commit them**
- Use `.env.example` as a template with placeholder values only
- If you accidentally expose a token, **rotate it immediately**

### Environment Setup

**Local Development:**

```bash
cp .env.example .env
# Edit .env with your actual secrets
```

**GitHub Actions / CI:**

- Add secrets via Repository Settings → Secrets and Variables → Actions
- Reference as `${{ secrets.DISCORD_TOKEN }}` in workflows

**Hosting Platforms (Railway, Render, Fly.io, etc.):**

- Use the platform's secrets/environment variable UI
- Never put secrets in your Dockerfile or code

### Verifying No Secrets in Code

```bash
# Scan for potential secrets (should return nothing)
git grep -i "token\|api_key\|secret" -- ':!*.example' ':!*.md'
```

---

## Running Locally

### Start Database

```bash
docker-compose up -d
```

### Run Migrations

```bash
npx prisma migrate dev
```

### Start Bot (Dev Mode)

```bash
npm run dev
```

### Start Bot (Production)

```bash
npm run build
npm start
```

### Run Diagnostics

```bash
npm run doctor
```

This will verify:

- Discord Token: `[PRESENT]` / `[MISSING]`
- Discord App ID: Present
- LLM Provider: `pollinations` (or your override)
- Pollinations Model: `deepseek` (or your override)
- Pollinations API Key: `[PRESENT]` / `[NOT SET - Optional]`

---

## Invite Bot to Server

Replace `YOUR_APP_ID` with your `DISCORD_APP_ID`:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=277025687552&scope=bot%20applications.commands
```

---

## Testing

```bash
npm test              # Run all tests
npm run lint          # Run linter
npm run build         # Build TypeScript
npm run cert          # Full certification suite
```

---

## Disabling LLM (Deterministic Mode)

To run without any LLM calls (faster, no API dependencies):

```env
LLM_PROVIDER=off
```

The bot will fall back to deterministic/rule-based responses.

---

## Architecture

Sage is a **Chat-Only Personalized Bot**.

1. **Chat Engine** - Generates single-turn responses using an LLM.
2. **Personalization Memory** - Maintains a compressed summary of user preferences and facts in the database (`UserProfile`).
3. **Profile Updater** - Background process that analyzes conversations to update the user's personality summary.
4. **Safety Gates** - Rate limits and serious mode switches prevent abuse.

There are NO complex tool execution loops, artifacts, or side-effects. Just pure conversation.

---

## License

MIT
