# Sage

[![CI](https://github.com/BokX1/Sage/actions/workflows/ci.yml/badge.svg)](https://github.com/BokX1/Sage/actions/workflows/ci.yml)

**Sage** is a context-aware Discord bot that remembers conversations, tracks relationships, and generates personalized responses using LLM-powered intelligence.

---

## Features

### 🧠 Intelligent Context

- **User Memory** — Learns and remembers user preferences, interests, and conversation history
- **Relationship Graph** — Tracks probabilistic relationships between users based on mentions, replies, and voice activity
- **Channel Summaries** — Automatic rolling summaries of channel conversations with configurable intervals

### 🎤 Voice Awareness

- **Voice Presence Tracking** — Monitors who's in voice channels
- **Overlap Detection** — Tracks which users spend time together in voice
- **Voice Analytics** — Uses voice data to enhance relationship understanding

### 🤖 Agentic Architecture

- **MoE Orchestration** — Mixture-of-Experts system with specialized modules (memory, social graph, summarizer, voice analytics)
- **Context Budgeting** — Smart token management to maximize relevant context within LLM limits
- **Prompt Composition** — Deterministic prompt blocks with style classification
- **Agent Tracing** — Full observability into routing decisions and expert contributions

### 💬 Chat Features

- **Wake Words** — Responds to configurable wake words (default: "sage", "hey sage")
- **Rate Limiting** — Configurable per-user rate limits
- **Cooldowns** — Channel-level cooldowns to prevent spam
- **Serious Mode** — Toggle for more formal responses

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/BokX1/Sage.git
cd Sage
npm ci

# Configure
cp .env.example .env
# Edit .env with your Discord token and database URL

# Database setup
npx prisma migrate dev

# Run
npm run dev
```

---

## Configuration

### Required

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_APP_ID` | Application ID from Discord Developer Portal |
| `DATABASE_URL` | Postgres or SQLite connection string |

### LLM Provider

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `pollinations` | `pollinations`, `gemini`, or `noop` |
| `POLLINATIONS_MODEL` | `gemini` | Model name for Pollinations API |
| `GEMINI_API_KEY` | — | Required if using native Gemini |

### Bot Behavior

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_MAX` | `5` | Max requests per window per user |
| `RATE_LIMIT_WINDOW_SEC` | `10` | Rate limit window in seconds |
| `SERIOUS_MODE` | `false` | Disable casual/humor responses |
| `WAKE_WORDS` | `sage` | Comma-separated trigger words |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |

### Admin Access

| Variable | Description |
|----------|-------------|
| `ADMIN_ROLE_IDS` | Comma-separated Discord role IDs with admin access |
| `ADMIN_USER_IDS` | Comma-separated Discord user IDs with admin access |

See `.env.example` for the complete list of ~50 configuration options.

---

## Commands

| Command | Description |
|---------|-------------|
| `/ping` | Check bot responsiveness |
| `/llm_ping` | Test LLM connection and latency |
| `/sage whoiswho [user]` | View relationship data for a user |
| `/sage relationship set` | Manually set relationship level (admin) |
| `/sage admin stats` | Bot statistics and uptime |
| `/sage admin relationship_graph [user]` | View full relationship graph |
| `/sage admin trace [trace_id]` | View agent decision traces |
| `/sage admin summarize [channel]` | Force channel summary generation |

---

## Development

```bash
npm run dev        # Start with hot reload
npm run build      # Compile TypeScript
npm run lint       # ESLint
npm test           # Vitest tests
npm run doctor     # Config + database check
npm run cert       # Full certification (lint + build + test + prisma)
```

### Database

```bash
npx prisma migrate dev   # Run migrations
npx prisma studio        # GUI database browser
npx prisma validate      # Schema validation
```

---

## Architecture

```
Discord Events → Ingest → Context Builder → LLM → Response
                   ↓
            ┌──────┴──────┐
            │   Storage   │
            ├─────────────┤
            │ UserProfile │  ← Memory
            │ Relationships│  ← Social graph
            │ Summaries   │  ← Channel context
            │ VoiceSessions│ ← Voice activity
            │ AgentTraces │  ← Observability
            └─────────────┘
```

### Core Modules (`src/core/`)

| Module | Purpose |
|--------|---------|
| `agentRuntime` | MoE orchestration, context budgeting, prompt composition |
| `awareness` | Message ring buffer, transcript building |
| `chat` | Chat engine, response generation |
| `llm` | Pollinations + Gemini providers, circuit breaker |
| `memory` | User profile storage and updates |
| `orchestration` | Router, governor, expert runners |
| `relationships` | Relationship graph, edge scoring, admin audit |
| `summary` | Channel summary scheduler and stores |
| `voice` | Voice tracking, overlap detection, session repo |

---

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Discord**: discord.js v14
- **Database**: Prisma ORM (Postgres/SQLite)
- **LLM**: Pollinations API (default) or Gemini
- **Validation**: Zod
- **Logging**: Pino
- **Testing**: Vitest

---

## License

MIT
