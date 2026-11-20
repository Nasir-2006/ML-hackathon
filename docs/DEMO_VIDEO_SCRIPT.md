# Sentinel demo video script (about 90 seconds)

**Recording format:** 16:9 screen capture, browser window, captions or narration. Start at `/demo`. Use a seeded disposable database. Keep the video public/unlisted so reviewers can open it.

> All tool integrations and outputs shown here are simulated. No actual public alerts or emergency actions are sent.

## Shot list and narration

### 0:00–0:10 — The problem

**On screen:** `/demo`

**Say:** “Sentinel replaces repeated incident-response work across disconnected municipal tools with one resumable workflow. High-impact actions wait for a human, failures pause safely, and every consequential output gets an evidence record.”

### 0:10–0:25 — Baseline and honest metrics

**On screen:** Click **View measured impact** to open `/metrics`. Show the reference comparison and its illustrative-data notice.

**Say:** “This prototype shows how a comparison can be measured. The seeded 47-minute, six-system baseline and sample run durations are illustrative fixtures, not verified field results. A municipality would replace them with an approved time study before claiming real-world improvement.”

### 0:25–0:40 — Partial failure and recovery

**On screen:** Return to `/demo` and open **Open recovery scenario**. Show the incident procedure paused on the failed mass-SMS step. Open `/tools`; the SMS tool should be **Unavailable**. Click **Restore**, return to the incident, then click **Retry this step**.

**Say:** “A simulated SMS outage pauses the workflow without losing completed steps. After the tool is restored, the responder retries only the failed action. Because this is consequential and not yet approved, it returns to human review instead of executing.”

### 0:40–1:05 — Human approval

**On screen:** Open `/approvals`. Show the queued mass-SMS action and its parameters. Enter a responder name in the header if needed, add a short review note, and click **Approve & execute**.

**Say:** “The responder reviews the action and its scope before approving. Approval is attributed and logged; rejecting also requires a reason. The simulated tool runs only after approval.”

### 1:05–1:20 — Evidence

**On screen:** Open `/evidence`, select the new mass-SMS record, and show actor, approver, parameters, and receipt.

**Say:** “Every consequential output has a reviewable record linking the action to its approver, incident context, parameters, and tool receipt.”

### 1:20–1:30 — Close

**On screen:** Return to `/demo` or show the incident procedure.

**Say:** “Sentinel is a prototype for evaluation. Real emergency use would require authenticated users, approved municipal integrations, operational validation, and sign-off.”

## Before recording

- Deploy the app to a public URL and confirm `/demo` loads.
- Use a disposable database with seed data; the demo workflow can be changed by recording actions.
- Confirm the SMS simulator is unavailable before the recording. If necessary, restore it via `/tools`, then simulate an outage again.
- Use synthetic incident data only. Do not show real resident or responder information.
- Publish the video on YouTube, Loom, or a publicly accessible Drive link, then paste that URL into the project-link form.
