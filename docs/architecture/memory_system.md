# Sage Memory System Architecture

This document details how the bot manages memory, context, and summarization. The system uses a hybrid approach with immediate context (working memory), short-term rolling summaries, and long-term profiles.

## 1. High-Level Flow

The memory lifecycle consists of three main phases:
1.  **Ingestion & Immediate Response**: Building context for the current turn.
2.  **Background Summarization (Channel)**: Compressing channel history into rolling and long-term summaries.
3.  **Background Updates (User)**: Updating individual user profiles based on interactions.

## 2. Memory Context (The "Working Memory")

**File:** `src/core/agentRuntime/contextBuilder.ts`

When a user sends a message, `buildContextMessages` assembles the "Context" sent to the LLM. It prioritizes information based on token budgets combined dynamically:

| Priority | Component | Type | Description |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | **Base System** | Static | Core persona instructions. |
| **High** | **User Profile** | Long-Term | "User Personalization" - Stable facts about the specific user (e.g., "Likes sci-fi"). |
| **High** | **Channel Profile** | Long-Term | "Profile Summary" - The long-term "vibe" or history of the channel. |
| Medium | **Rolling Summary** | Short-Term | "Rolling Summary" - Summary of the last ~2 hours/120 messages. |
| Medium | **Social Graph** | Dynamic | `RelationshipHints` - Who is friends with whom (D7). |
| Low | **Transcript** | Review | `RecentTranscript` - Raw message logs of the immediate conversation. |

**Key Concept: "Dynamic Memory"**
The system dynamically allocates space. if the `Transcript` is too long, it is truncated in favor of the `User Profile` and `Base System`. This is the "Context Budgeter".

## 3. Short-Term Memory (Rolling Channel Summary)

**Files:**
- `src/core/summary/channelSummaryScheduler.ts`
- `src/core/summary/summarizeChannelWindow.ts` (Function: `summarizeChannelWindow`)

**Mechanism:**
- **Trigger**: The scheduler runs every tick (configurable, e.g., 60s). It checks for "dirty" channels (channels with new messages).
- **Condition**: If enough messages (e.g., >10) or enough time (e.g., >15m) has passed since the last summary.
- **Process**:
    1.  Fetch the last ~120 raw messages.
    2.  Send to LLM with `System: You are a summarization engine...`.
    3.  **Output**: A JSON object (`StructuredSummary`) containing:
        -   `summaryText` (Narrative)
        -   `topics` (List of active topics)
        -   `threads` (Ongoing discussions)
        -   `unresolved` (Questions not yet answered)
- **Storage**: Saved to DB `ChannelSummary` table with `kind = 'rolling'`.

## 4. Long-Term Memory

### A. Channel Long-Term Memory (Profile)
**File:** `src/core/summary/summarizeChannelWindow.ts` (Function: `summarizeChannelProfile`)

**Mechanism:**
- **Trigger**: Runs periodically after a rolling summary update.
- **Process**:
    -   **Input**: The *previous* Long-Term Profile + The *latest* Rolling Summary.
    -   **Prompt**: "Update the long-term profile summary for this channel."
    -   **Goal**: condense the rolling summary into permanent history, discarding transient chatter.
- **Storage**: Saved to DB `ChannelSummary` table with `kind = 'profile'`.

### B. User Long-Term Memory (User Profile)
**File:** `src/core/memory/profileUpdater.ts`

**Mechanism:**
- **Trigger**: After the bot replies to a user.
- **Process**:
    -   **Input**: Current User Profile + Latest [User Message, Bot Reply].
    -   **Prompt**: "Store ONLY stable preferences and facts... If nothing new, return previous."
    -   **Constraint**: Max 800 chars.
- **Storage**: Saved to DB `UserProfile` table (`summary` column).

## 5. The Complete Flow (Step-by-Step)

1.  **User Sends Message**: stored in `ChannelMessage` (Prisma).
2.  **Context Assembly**:
    -   Fetching `UserProfile` for the author.
    -   Fetching latest `ChannelSummary` (rolling & profile).
    -   Fetching recent raw `ChannelMessage`s.
    -   *Logic*: `buildContextMessages` creates the prompt.
3.  **LLM Generation**: Bot generates a reply using this context.
4.  **Bot Reply**: Sent to Discord & stored in `ChannelMessage`.
5.  **Side Effects (Async)**:
    -   **User Memory**: `profileUpdater` runs. If the user said "My name is John", the `UserProfile` is updated to include "Name is John".
    -   **Channel Scheduler**: Marks the channel as "dirty".
6.  **Scheduler Tick (Later)**:
    -   Notices the channel is dirty.
    -   Generates a new **Rolling Summary** (incorporating the recent "My name is John" interaction).
    -   If enough time passed, merges Rolling Summary into **Channel Profile**.

## 6. Summary Channel vs Summary Store
- **Summary Store**: The database and code (`PrismaChannelSummaryStore`) that holds the data.
- **Summary Channel**: Often refers to the *scheduler* capability that keeps these summaries up to date automatically. The bot can also "Force Summarize" via command/tools, which triggers the scheduler logic immediately.
