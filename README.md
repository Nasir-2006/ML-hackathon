# Sentinel — Municipal Emergency Coordination

Sentinel is a demonstration prototype for coordinating a municipal emergency response across disconnected tools. It turns an incident playbook into a resumable workflow with approval gates for consequential actions, a recovery path for partial failures, and an evidence record for every consequential output.

> **Simulation only — not an emergency dispatch system.** Tool integrations are mocked and do not contact residents, responders, utility providers, or public warning systems. The app has no user authentication or production authorization controls. Do not use it to direct real emergency operations. Real deployment requires approved integrations, authentication/authorization, security review, operational testing, and municipal sign-off.

## Guided demo

Open `/demo` for a short walkthrough. It links to the sample recovery incident, tool status simulator, human approval queue, evidence ledger, and impact report.

The demo database is seeded with:

- Two completed sample playbooks and simulated tool receipts.
- One active procedure paused on a simulated mass-SMS outage.
- Evidence records for the seeded consequential outputs.
- An illustrative reference baseline for comparing the demo workflow.

### Important: interpret the metrics honestly

The seeded baseline (14 steps, 6 systems, 47 minutes, 3.4 reported errors per incident) is an **illustrative fixture**, not a verified municipal operations study. The completed sample workflow durations are also **simulated fixture values**, not measured field outcomes. They demonstrate how Sentinel can calculate a comparison; they do not establish real-world improvement. Replace the fixture with an approved, documented time study and validated error data before making operational or public impact claims.

## Features

- **Coordinated playbooks:** flood, fire, and severe-weather response sequences.
- **Human approval:** evacuation orders, mass SMS, utility notifications, and social posts pause before simulated execution.
- **Partial-failure recovery:** completed steps are preserved; retry only the failed step or skip it with a recorded reason. Consequential retries that have not already been approved return to human review.
- **Evidence ledger:** captures the action, actor, approver, input parameters, incident context, and simulated tool receipt.
- **Low-bandwidth support:** server-rendered pages, HTML form fallbacks, low-bandwidth mode, an app-shell service worker, and a browser-side offline action queue.
- **Impact report:** compares a documented reference fixture with workflow durations recorded in the app; the seeded figures are marked illustrative.

## Stack

- Next.js App Router and React
- PostgreSQL with Drizzle ORM
- Tailwind CSS
- Simulated integrations in `src/lib/tools.ts`

## Local development

Requirements: Node.js 20+ and PostgreSQL.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file and set `DATABASE_URL` to a PostgreSQL database you control:

   ```bash
   cp .env.example .env
   ```

3. Apply the Drizzle schema and (on an empty demo database) load sample data:

   ```bash
   npx drizzle-kit push
   node --env-file=.env scripts/seed.mjs
   ```

   The seed script intentionally skips the database if it already contains incidents. Use a new, disposable database to recreate the initial demo fixture.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000/demo`.

## Deploy a public demo

### PostgreSQL

Create a disposable PostgreSQL database with a provider such as Neon, Supabase, or another managed Postgres service. Keep credentials private. Do not commit `.env`; `.gitignore` excludes it.

Set the production `DATABASE_URL` in your hosting provider's environment variables. Before opening the public site, apply the schema against that database and, if desired, seed it with sample data:

```bash
DATABASE_URL='postgresql://…' npx drizzle-kit push
DATABASE_URL='postgresql://…' node scripts/seed.mjs
```

The production build needs the same `DATABASE_URL` configured in the hosting project. The public demo is unauthenticated and all tool actions are simulated; use only disposable demo data.

### Vercel

1. Push the project to a public GitHub repository (instructions below).
2. Import that repository in Vercel.
3. Configure `DATABASE_URL` in Vercel's project environment settings.
4. Deploy and open `/demo` to verify the public walkthrough.

The app's `drizzle.config.ts` reads `DATABASE_URL`, so schema changes can target the selected PostgreSQL database without editing a hardcoded connection string.

## Publish to GitHub

This workspace has no Git remote configured, so it does not yet have a public repository URL. After creating a repository on GitHub, run these commands from the project root (replace the URL with your repository URL):

```bash
git init
git add .
git commit -m "Build Sentinel emergency coordination demo"
git branch -M main
git remote add origin https://github.com/<owner>/<repository>.git
git push -u origin main
```

Confirm `.env` and other secrets are not staged before pushing. The `.env.example` file is safe to publish because it contains a local placeholder only.

## Demo recording

See [`docs/DEMO_VIDEO_SCRIPT.md`](docs/DEMO_VIDEO_SCRIPT.md) for a concise screen-recording script. The recording still needs to be captured and uploaded to a public service (YouTube, Loom, or a publicly viewable Drive link); this repository cannot create that external video URL on its own.

## Project submission links

Use [`docs/SUBMISSION_LINKS.md`](docs/SUBMISSION_LINKS.md) as the checklist for the project-link form. The repository URL and public demo-video URL must be filled in after those external publishing steps are complete. A live preview link is available from the project preview environment while it remains active; for a durable judging URL, deploy the project to Vercel or another public host.
