# 🚨 Sentinel — Municipal Emergency Coordination

**Turning emergency response playbooks into coordinated, resumable workflows.**

Sentinel is a full-stack demonstration project I built to explore how technology can improve coordination during municipal emergencies.

It brings different emergency response activities into one workflow, with human approval gates, recovery mechanisms, and an evidence trail for important actions.

Instead of treating an emergency response as a collection of disconnected tasks, Sentinel organizes it into a structured process that can be monitored, resumed, and reviewed.

> ⚠️ **Simulation Only — Not a Real Emergency Dispatch System**
>
> Sentinel is a demonstration prototype. All tool integrations are simulated and do not contact real residents, emergency responders, utility providers, or public warning systems. It is not intended for real emergency operations.

---

## 🌐 Project Links

| Resource | Link |
|---|---|
| 🚀 Live Demo | [Open Sentinel](https://ml-hackathon-eta.vercel.app/) |
| 💻 GitHub Repository | [View Source Code](https://github.com/Nasir-2006/ML-hackathon) |
| 🎥 Demo Video | https://drive.google.com/file/d/17oyTjQRjmhGbW3vF68f-wxME6KEzD11o/view?usp=sharing |

---

## ✨ What I Built

I designed Sentinel around a simple idea: **an emergency response workflow should not lose its progress just because one step fails.**

The application demonstrates how multiple response activities can be coordinated while keeping consequential decisions under human control.

### 🚒 1. Coordinated Emergency Playbooks

- Structured response workflows for floods, fires, and severe weather.
- Organizes emergency procedures into individual steps.
- Tracks workflow progress and completed actions.
- Allows an incident procedure to resume after interruption.

### 🛡️ 2. Human Approval System

Certain actions require human approval before simulated execution, including:

- Evacuation orders.
- Mass SMS notifications.
- Utility notifications.
- Social media announcements.

This creates an approval checkpoint before consequential actions proceed.

### 🔄 3. Failure Recovery

What happens when one step fails?

Sentinel demonstrates a recovery mechanism:

- Preserves successfully completed steps.
- Allows retrying only the failed step.
- Supports skipping a failed step with a recorded reason.
- Sends consequential retries that lack approval back for human review.

### 📋 4. Evidence Ledger

Important actions are recorded in an evidence ledger.

Records include:

- Action performed.
- Actor and approver.
- Input parameters.
- Incident context.
- Simulated tool receipt.

This makes it possible to review what happened during a workflow.

### 📶 5. Low-Bandwidth Support

I also included features intended to demonstrate resilience in environments with limited connectivity:

- Server-rendered pages.
- HTML form fallbacks.
- Low-bandwidth mode.
- App-shell service worker.
- Browser-side offline action queue.

### 📊 6. Impact Report

The application includes an impact report that compares a reference baseline with recorded workflow durations.

**Important:** The current baseline and sample workflow results are illustrative simulated data, not verified municipal operational measurements. They demonstrate the reporting mechanism rather than proving real-world improvements.

---

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Full-stack application and routing |
| React | User interface |
| TypeScript | Application logic and type safety |
| PostgreSQL | Database |
| Drizzle ORM | Database schema and queries |
| Tailwind CSS | Styling and responsive UI |
| Neon | Managed PostgreSQL hosting |
| Vercel | Application deployment |
| Git & GitHub | Version control and source hosting |

---

## 🏗️ How It Works

The main workflow follows this general sequence:

1. An incident is selected.
2. The corresponding emergency playbook is loaded.
3. Individual response steps are executed through simulated integrations.
4. Consequential actions pause for human approval.
5. Successful actions are preserved in the workflow.
6. Failed actions can be retried or skipped with a recorded reason.
7. Important actions are captured in the evidence ledger.
8. Workflow information is presented through the impact report.

---

## 🖥️ Guided Demo

The application includes a guided walkthrough at:

👉 [Open Sentinel Demo](https://ml-hackathon-eta.vercel.app/demo)

The demo includes:

- Sample emergency playbooks.
- Simulated tool status.
- Human approval queue.
- Evidence ledger.
- Impact report.
- A sample incident demonstrating recovery after a simulated mass-SMS outage.

---

## ⚙️ Local Setup

Want to run Sentinel locally?

### Requirements

- Node.js 20+
- PostgreSQL
- npm

### 1. Clone the repository

```bash
git clone https://github.com/Nasir-2006/ML-hackathon.git
cd ML-hackathon
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file:

```bash
cp .env.example .env
```

Add your own PostgreSQL connection string:

```env
DATABASE_URL=your_postgresql_connection_string
```

**Keep your `.env` file private. Never commit database credentials to GitHub.**

### 4. Apply the database schema

```bash
npx drizzle-kit push
```

### 5. Seed the demo database

For a fresh, empty demo database:

```bash
node --env-file=.env scripts/seed.mjs
```

The seed script skips databases that already contain incidents. Use a new, disposable database if you want to recreate the initial demo data.

### 6. Start the development server

```bash
npm run dev
```

Open:

http://localhost:3000/demo

---

## ☁️ Deployment

I deployed Sentinel using **Vercel** with **Neon PostgreSQL**.

The deployment process involved:

1. Publishing the source code to GitHub.
2. Connecting the GitHub repository to Vercel.
3. Creating a PostgreSQL database on Neon.
4. Configuring `DATABASE_URL` in Vercel environment variables.
5. Applying the Drizzle database schema to Neon.
6. Deploying the application and verifying the live demo.

The application uses environment-based database configuration, so database credentials do not need to be hardcoded into the source code.

---

## ⚠️ Limitations & Future Improvements

Sentinel is currently a demonstration prototype, not a production-ready emergency management platform.

Some areas that would need further development include:

- User authentication and role-based authorization.
- Real, approved emergency-service integrations.
- Stronger security and access controls.
- Production-grade offline synchronization.
- Operational testing and reliability evaluation.
- Validated municipal response data.
- Official municipal approval and deployment.

The current integrations are mocked, and the application does not provide production authorization controls.

---

## 🎯 What This Project Helped Me Explore

Building Sentinel gave me practical experience with:

- Full-stack application development.
- Working with Next.js and React.
- PostgreSQL database integration.
- Database schema management using Drizzle ORM.
- Environment variables and secret management.
- Git and GitHub workflows.
- Deploying a full-stack application using Vercel.
- Debugging database and deployment issues.
- Designing workflows with approval and recovery mechanisms.

It also helped me understand how different parts of a full-stack application work together, from the frontend and backend to the database and cloud deployment.

---

## 🎥 Demo Video

**Project walkthrough:** Coming soon.

*I will add the public demo recording link here once it is recorded and uploaded.*

---

## 👨‍💻 Author

**Nasir(FA24-BCS-081) 
  Ahmad Akhtar(FA25-BCS-011)
  Huzaifa Bhatti(FA25-BCS-12)**

Computer Science Student | Full-Stack & AI/ML Enthusiast

- GitHub: [Nasir-2006](https://github.com/Nasir-2006)
- Project: [Sentinel — Municipal Emergency Coordination](https://github.com/Nasir-2006/ML-hackathon)

---

*Built as a demonstration project to explore resilient workflows, human oversight, and emergency coordination through software.*