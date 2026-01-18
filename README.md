# Sage v0.1 Beta

[![CI](https://github.com/BokX1/Sage/actions/workflows/ci.yml/badge.svg)](https://github.com/BokX1/Sage/actions/workflows/ci.yml)

A personalized Discord chatbot powered by Pollinations AI with user memory and adaptive responses.

## ✨ Features

- **Personalized Memory** - Remembers user preferences and adapts responses over time
- **Multi-LLM Support** - Works with Pollinations (default) or native Gemini
- **Smart Rate Limiting** - Prevents abuse with configurable limits
- **Structured Logging** - Production-ready logging with Pino
- **Type-Safe** - Built with TypeScript and strict validation

---

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/BokX1/Sage.git
cd Sage
npm ci

# Configure environment
cp .env.example .env
# Edit .env with your values

# Setup database
docker-compose up -d          # Start Postgres
npx prisma migrate dev        # Run migrations

# Run bot
npm run dev                   # Development mode
```

---

## ⚙️ Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token from [Discord Developer Portal](https://discord.com/developers/applications) |
| `DISCORD_APP_ID` | Your Discord application ID |
| `DATABASE_URL` | Database connection string |

### LLM Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `pollinations` | `pollinations` or `gemini` |
| `POLLINATIONS_MODEL` | `gemini` | Model to use with Pollinations |
| `GEMINI_API_KEY` | - | Required if using native Gemini |

### Bot Behavior

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_MAX` | `5` | Max requests per window |
| `RATE_LIMIT_WINDOW_SEC` | `10` | Rate limit window (seconds) |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |

---

## 🛠️ Development

```bash
npm run dev       # Start with hot reload
npm run build     # Compile TypeScript
npm run lint      # Run ESLint
npm test          # Run tests
npm run doctor    # Check configuration
npm run cert      # Full certification suite
```

### Database

```bash
docker-compose up -d      # Start Postgres
npx prisma migrate dev    # Run migrations
npx prisma studio         # Open DB GUI
```

---

## 🔐 Security

- `.env` files are gitignored — **never commit them**
- Use `.env.example` as a template
- If a token is exposed, **rotate it immediately**

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Discord.js     │────▶│  Chat Engine │────▶│  LLM Client │
│  (Events)       │     │  (Core)      │     │  (Provider) │
└─────────────────┘     └──────────────┘     └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ User Profile │
                        │ (Prisma DB)  │
                        └──────────────┘
```

- **Chat Engine** - Generates responses with LLM
- **User Profile** - Stores personalization memory per user
- **Profile Updater** - Background process to learn from conversations
- **Safety Gates** - Rate limiting and abuse prevention

---

## 🤖 Invite to Server

Replace `YOUR_APP_ID`:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=277025687552&scope=bot%20applications.commands
```

---

## 📄 License

MIT
