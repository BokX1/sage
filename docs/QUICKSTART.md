# ⚡ Quick Start Guide

**Get Sage running in 5 minutes — no coding experience required!**

---

## 📋 What You Need

Before starting, make sure you have:

| Item | Where to Get It | Time |
|:-----|:----------------|:-----|
| **Discord Account** | You probably have this already! | — |
| **Node.js** | [nodejs.org](https://nodejs.org/) → Click the big green "LTS" button | 2 min |
| **Docker Desktop** | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) | 3 min |

> 💡 **Why these?** Node.js runs the bot. Docker runs the database. That's it!

---

## 🤖 Step 1: Create Your Discord Bot (3 min)

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **"New Application"** → Name it "Sage" → Click **Create**
3. Click **"Bot"** in the left menu
4. Click **"Reset Token"** → Click **"Copy"**
5. **Save this token somewhere!** (You'll need it soon)

**Also copy the Application ID:**

- Go to **"General Information"** in the left menu
- Copy the **"Application ID"**

**Enable these settings on the Bot page:**

- ✅ PRESENCE INTENT
- ✅ SERVER MEMBERS INTENT  
- ✅ MESSAGE CONTENT INTENT
- Click **"Save Changes"**

---

## 📥 Step 2: Download Sage (1 min)

Open a terminal (Command Prompt on Windows, Terminal on Mac) and run:

```bash
git clone https://github.com/BokX1/Sage.git
cd Sage
npm install
```

> 📋 **Tip:** Just copy and paste these commands one at a time!

---

## ⚙️ Step 3: Run the Setup Wizard (2 min)

```bash
npm run onboard
```

The wizard will ask for:

- **DISCORD_TOKEN** → Paste your bot token from Step 1
- **DISCORD_APP_ID** → Paste your application ID from Step 1
- **DATABASE_URL** → Type `2` to use the easy default
- **POLLINATIONS_API_KEY** → Get one free at [pollinations.ai](https://pollinations.ai/)
- **Model** → Press Enter to use the default (gemini)

---

## 🚀 Step 4: Start Sage (1 min)

Make sure Docker Desktop is open, then run:

```bash
docker compose up -d db
npm run db:migrate
npm run dev
```

**You should see:**

```
[info] Logged in as Sage#1234
[info] Ready!
```

🎉 **Sage is running!** Keep this terminal window open.

---

## 🎮 Step 5: Invite Sage to Your Server

**Quick Method** (after running `npm run onboard`):

The setup wizard gives you a ready-to-use invite link! Just click it.

**Manual Method:**

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Select your Sage application
3. Click **"OAuth2"** → **"URL Generator"**
4. Check these **Scopes**:
   - ✅ `bot`
   - ✅ `applications.commands`
5. Check these **Bot Permissions**:
   - ✅ Send Messages (2048)
   - ✅ Read Message History (65536)
   - ✅ View Channels (1024)
   - ✅ Connect (1048576) — for voice awareness
6. Copy the URL at the bottom and open it in your browser
7. Select your server and click **Authorize**

> 💡 **Quick Link Format:** Replace `YOUR_APP_ID` with your Application ID:
>
> **Recommended (minimal permissions):**
>
> ```
> https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot%20applications.commands&permissions=1133568
> ```
>
> **Admin (full access):**
>
> ```
> https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot%20applications.commands&permissions=8
> ```

---

## ✅ Test It Works

In your Discord server, type:

```
Sage, hello!
```

Sage should respond! 🎊

---

## 🆘 Stuck?

| Problem | Solution |
|:--------|:---------|
| Sage not responding | Make sure the terminal is still running with `npm run dev` |
| Database error | Check Docker Desktop is running, then try `docker compose up -d db` |
| Token invalid | Go back to Discord Developer Portal and reset your token |

**Need more help?**

- Run `npm run doctor` to check your setup
- See the [full Getting Started guide](GETTING_STARTED.md)
- Check the [FAQ](FAQ.md)

---

<p align="center">
  <sub>Powered by <a href="https://pollinations.ai">Pollinations.ai</a> 🐝</sub>
</p>
