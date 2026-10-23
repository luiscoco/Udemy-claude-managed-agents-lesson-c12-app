# C12 · Interrupts, Cancellation and Cleanup

Executes a cleanup state machine with authored provider statuses. No remote interrupt or archive is issued by the local mode. Each run starts from a fresh local seed. The run journal stores results, not production workflow state.

## Concepts students will learn

- Independent cleanup deadline
- Interrupt acknowledgement is not a stop
- Confirm idle or terminated

## Configure and run

Use Node.js 24 or later. In PowerShell, from this repository's folder:

```powershell
node --version
npm ci
Copy-Item .env.example .env
notepad .env
```

No API key is required for the local experiment. Optional live commentary requires your own API key, agent ID and environment ID. It explains the local result; it does not activate the integration discussed in the lesson.

For the optional live path, set your API key, then run npm run setup if you do not already have resource IDs. The script creates the environment before a text-only agent, saves each ID immediately, and reuses IDs already configured. It uses CLAUDE_MODEL or the source default; choose a model available to your account. An uncertain network failure may have created a resource: inspect your account before retrying.

```powershell
npm start
```

Open `http://127.0.0.1:3012`. Navigation leads to `/guide.html#learning`, `/guide.html#run-guide`, `/architecture.html`, and the application lab. If you change `PORT`, use the configured port. Keep the terminal running; stop with Ctrl+C. `npm run dev` also starts the web application.

Select the first scenario, inspect its editable fields, press Run experiment, and compare the outcome and evidence with the table above. Select another scenario to investigate the boundary condition.

## Create your .env file

Copy `.env.example` to `.env` and enter your own values. Do not commit the real file. Restart the server after editing it. The example contains safe placeholders; optional settings may be left blank to use source defaults. Resource IDs and keys stay on the server.

```dotenv
ANTHROPIC_API_KEY=your_api_key
CLAUDE_MANAGED_AGENT_ID=your_agent_id
CLAUDE_MANAGED_ENVIRONMENT_ID=your_environment_id
PORT=3012
```

## How the app was build

### 1. Require a settled lifecycle observation

Only idle or terminated settles the authored status sequence. An interrupt request or rescheduling observation alone leaves remoteStop unconfirmed and cleanup pending.

Source: [src/lesson.ts](src/lesson.ts#L13) · selected statements

```typescript
const statuses = list(input, "statuses").map(String),
  settled = statuses.find((s) => s === "idle" || s === "terminated");

if (!settled)
  return report(
    "unconfirmed",
    "No settled state was observed before the cleanup window ended",
    { remoteStop: "unconfirmed", cleanup: "pending" },
    [
      "Close host admission",
      "Send interrupt through a fresh cleanup signal",
      "Poll within the independent deadline",
    ],
  );
```

### 2. Decide cleanup after confirming a stop

Termination needs no archive in this model. An idle session can still have pending cleanup when archiving fails, so stopping and cleaning up are separate outcomes.

Source: [src/lesson.ts](src/lesson.ts#L15)

```typescript
const cleanup =
  settled === "terminated"
    ? "not-needed"
    : flag(input, "archiveSucceeds")
      ? "archived"
      : "pending";
```

### 3. Report partial cleanup honestly

The result preserves the settled status and cleanup state. Its trace describes the independent cleanup signal a real adapter would need; this reducer does not send an interrupt or archive request.

Source: [src/lesson.ts](src/lesson.ts#L16)

```typescript
return report(
  cleanup === "pending" ? "paused" : "passed",
  "Remote stop and cleanup are distinct outcomes",
  { remoteStop: "confirmed", lastStatus: settled, cleanup },
  [
    "Do not reuse an aborted run signal",
    "Rescheduling is not settled",
    "Archive only after confirming idle",
  ],
);
```

### Check your understanding

Run **Confirm and archive** in the application. Compare the result with these scenario expectations:

```json
{
  "input": {
    "statuses": [
      "running",
      "rescheduling",
      "idle"
    ],
    "archiveSucceeds": true
  },
  "expectedOutcome": "passed",
  "checkEvidence": {
    "remoteStop": "confirmed"
  }
}
```

Then try **Preserve stop uncertainty**. Its expected outcome is `unconfirmed`; identify the condition or evidence field that explains the difference.

## Validation

```powershell
npm test
python scripts/verify-walkthrough.py
```

The source hash check detects when walkthrough excerpts need refreshing. Browser verification covers page navigation, readable text, mobile layout, dark mode, diagram and image routes. Local scenarios and live provider calls are recorded separately in the workspace verification report; local success is not evidence of a live provider operation.

## Repository contents

Application sources, student web pages, safe configuration example and documentation images are included. `node_modules`, `presentation`, `output`, `reviewed`, `v3`, `teaching-material`, build output, local journals, credentials and local resource files are ignored. Existing teaching videos and presentations remain in the original workspace.
