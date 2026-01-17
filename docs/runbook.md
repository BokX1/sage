# Sage Runbook

## Common Issues & Resolution

### 1. Bot not responding

- **Check Logs**: Look for `DISCORD_API_ERROR`.
- **Check Circuit Breaker**: If LLM features are failing, check logs for `[CircuitBreaker] Opened`. It will auto-reset after 1 minute.
- **Restart**: `pm2 restart sage` or `npm stop && npm start`.

### 2. LLM Failures

- **Symptoms**: Planner falls back to basic keyword matching; creative tasks fail.
- **Fix**: Check `LLM_PROVIDER` connectivity. Verify `POLLINATIONS_BASE_URL` is reachable.
- **Verify**: Run `npm run doctor` to check basic config.

### 3. Database Locked (SQLite)

- **Symptoms**: `PrismaClientKnownRequestError: Database is locked`.
- **Fix**: Ensure no other process (like Prisma Studio) is holding the lock. Stop the bot, close Studio, restart.

## Maintenance tasks

### Update Database Schema

```bash
npx prisma migrate deploy
```

### Rotate Tokens

1. Update `.env`.
2. Restart application.
