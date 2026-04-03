# HireNode — Comprehensive Plan of Action
### Agentic B2B SaaS for Autonomous Technical Interviews
**Stack: MERN | Target: Enterprise-Grade, Multi-Million Dollar Product**

---

## PART 0 — Product Vision Refinement

### The Core Problem We're Solving
Traditional hiring is broken in three ways:
1. **For HR:** Screening 200 resumes per role manually, scheduling calls, notetaking, calibrating interviewers, writing feedback — 60–70% of a recruiter's week is burned before a single qualified candidate reaches a hiring manager.
2. **For Candidates:** Opaque processes, ghosting after applying, unclear evaluation criteria, scheduling friction across time zones, and repetitive screening calls that feel like box-ticking.
3. **For the Business:** Mis-hires from gut-feel interviews cost 1–3x the annual salary. Inconsistent interview standards across teams create legal exposure (EEOC) and poor hiring quality.

### HireNode's Promise
> "From Job Description to Ranked Shortlist — Zero HR Hours."

HireNode is a **fully autonomous hiring co-pilot** that:
- Reads the JD and builds a custom interview rubric on its own.
- Conducts a live, adaptive voice interview with every applicant.
- Scores, ranks, and summarizes candidates in a single dashboard.
- Learns from HR overrides and gets smarter over time (RLHF loop).

### B2B Positioning & Monetization (Why This Is Worth Millions)

**Target Customers (ICP):**
- **Tier 1:** Mid-market tech startups (50–500 employees) hiring engineers, PMs, and data roles — high volume, low HR headcount.
- **Tier 2:** Staffing & RPO agencies running volume hiring for clients — massive ROI from automation.
- **Tier 3:** Enterprise HR teams running campus recruitment / bulk hiring drives.

**Pricing Model (SaaS Tiers):**

| Plan | Price | Limits | Target |
|---|---|---|---|
| Starter | ₹4,999/mo | 3 active roles, 100 interviews/mo | Early-stage startups |
| Growth | ₹19,999/mo | 20 active roles, 500 interviews/mo, white-label | Series A/B companies |
| Enterprise | Custom | Unlimited, SSO, on-prem option, SLA | Large enterprises, RPOs |

**Revenue Levers:**
- Per-interview overages (₹30–50/interview beyond plan limit)
- White-label fee for agencies (custom subdomain, branding)
- API access for ATS integrations (Workday, Greenhouse, Lever, BambooHR)
- AI calibration/consulting for enterprise onboarding

---

## PART 1 — Full Feature Map (What We're Building)

### HR-Facing Features (Zero-Effort Hiring)

#### 1.1 — Intelligent JD Ingestion
- Drag-and-drop JD upload (PDF/TXT/DOCX).
- AI extracts: role title, required skills, experience band, seniority, tech stack.
- Auto-generates **Interview Rubric** (weightages per competency) with HR review+edit UI.
- JD can also be **generated from scratch** — HR inputs role name and team context, AI writes the full JD.

#### 1.2 — Automated Candidate Outreach
- After a candidate applies, the system auto-sends a branded email with their unique, time-expiring interview link.
- Configurable: "Interview window opens in 24 hours and closes in 72 hours."
- Reminder emails at T-12h and T-2h before link expiry.
- HR sets this up once per role — never manually sends links again.

#### 1.3 — Live Pipeline Dashboard
- Per-role Kanban-style view: Applied → Shortlisted → Interview Scheduled → Completed → Reviewed → Hired/Rejected.
- Aggregate metrics per role: Avg. score, Screening pass rate, Drop-off rate, Time-to-complete.
- Color-coded heat map of candidate quality across all active roles at a glance.

#### 1.4 — AI-Ranked Shortlist (The "Top 10" View)
- Post-interview, candidates are ranked by composite weighted score.
- Each candidate card shows: Photo (from CV), Name, Score, One-line AI summary, and "View Full Report" CTA.
- HR can drag-and-drop to override AI ranking — this event is logged for RLHF.

#### 1.5 — One-Click Report Export
- Excel/CSV export with: Candidate name, email, score breakdown, AI verdict, transcript link.
- Shareable PDF report per candidate for hiring managers who don't have HireNode access.
- Bulk action: Select N candidates → "Share Report with Hiring Manager" (sends email with PDF attachments).

#### 1.6 — Role Templates Library
- HR can save a "Role Template" (JD + rubric + question bank seed) for recurring roles (e.g., "Senior Backend Engi neer").
- Next hire: One click to clone the template and launch a new drive.

#### 1.7 — RLHF Override & Feedback Loop
- On any candidate's report, HR can: Flag as False Negative, Override AI Decision, or leave free-text feedback.
- These events feed a `RLHF_Logs` collection.
- Monthly, the system recalibrates Evaluator Agent system prompt strictness weights based on this dataset.
- Over 3–6 months, HireNode becomes calibrated to the specific company's hiring bar.

#### 1.8 — Team Collaboration
- Invite team members with roles: `Admin`, `HR Manager`, `Recruiter`, `Hiring Manager` (read-only).
- Hiring Managers get a sandboxed view — they see only their team's candidates, can leave comments, but cannot edit rubrics or launch drives.
- Activity feed per candidate: "Reviewed by Priya at 3:22 PM."

---

### Candidate-Facing Features (Zero Friction, Zero Anxiety)

#### 2.1 — Apply Page (Public-Facing, Minimal)
- Branded with the company's logo (white-label).
- Shows: Role title, location, 3-bullet JD summary.
- Single action: Upload CV (PDF). Name, Email auto-extracted from CV.
- No account creation, no lengthy forms.
- Instant visual feedback: "Your CV is being reviewed by our AI..." → progress bar → "✓ You're eligible! Check your email."

#### 2.2 — Interview Pre-Flight (The "Readiness Check")
- After clicking the interview link from email, candidate goes through a 3-step pre-flight:
  1. **Tech Check:** Browser compatibility, mic test (play back 3 seconds), camera preview.
  2. **Instructions Screen:** "This interview has 8 questions and will take ~25 minutes. Speak clearly and pause after each answer. There is no time limit per answer."
  3. **Warm-Up Question:** A non-scored, casual throwaway question ("Tell me one thing you did last weekend") to let them calibrate their voice and calm nerves before the real interview begins.
- This dramatically reduces drop-offs and poor performance due to nerves/tech issues.

#### 2.3 — The Live Interview Room
- Clean, focused UI. No distractions.
- AI Interviewer persona: Named (e.g., "Alex from HireNode") with avatar, making it feel like a real call.
- Clear indicator when AI is speaking (animated waveform) vs. when it's the candidate's turn (pulsing mic button + "Your turn" text).
- Progress indicator: "Question 3 of 8."
- No timer pressure — candidate-controlled "Done Answering" button.
- Subtle "Thinking..." overlay during AI processing so candidate knows the system is working.

#### 2.4 — Post-Interview Experience
- Immediate "Thank you" screen with estimated turnaround time ("HR will review results within 2 business days").
- Auto-email confirmation to candidate: "Your interview is complete. We'll be in touch."
- Optional: Candidate self-assessment — "How did you feel about the interview?" (1–5 stars + text). This is a powerful signal for AI calibration.

---

### Admin & Platform Features (Multi-Tenant SaaS Infrastructure)

#### 3.1 — Multi-Tenant Architecture
- Each company (tenant) is fully isolated: separate MongoDB namespace, separate API key context, separate branding.
- Tenant onboarding flow: Company name, logo upload, branded subdomain (`acme.hirenode.io`), primary color picker.

#### 3.2 — Anti-Cheating & Integrity Module
- Tab-switch detection: Logged and reported in HR dashboard ("Candidate switched tabs 3 times").
- Copy-paste detection on any text fields.
- Audio analysis flag: Sudden background voice detected → flagged as "Possible assistance."
- Optional: Face detection to flag if candidate leaves frame for >10 seconds.
- All flags appear as a "Integrity Score" on the candidate report — HR decides whether to act on them.

#### 3.3 — ATS Integration Layer (Enterprise)
- Webhook support: On candidate completion, POST to any external ATS endpoint.
- Native integration adapters for: Greenhouse, Lever, Workday, BambooHR (built as modular plugins).
- This is a major enterprise unlock — companies don't abandon their existing ATS, HireNode plugs into it as the interview layer.

#### 3.4 — Usage Analytics (Internal, Super-Admin)
- Platform-level: Total interviews, API cost per interview, tenant revenue, churn signals.
- Tenant-level: Interviews used / plan limit, feature adoption, last login.

---

## PART 2 — Full Technical Architecture (MERN)

### 2.1 — Repository Structure

```
hirenode/
├── client/                     # React.js frontend
│   ├── src/
│   │   ├── apps/
│   │   │   ├── hr/             # HR Command Center
│   │   │   └── candidate/      # Candidate portal
│   │   ├── components/
│   │   │   ├── ui/             # Design system primitives
│   │   │   ├── interview/      # Interview room components
│   │   │   └── dashboard/      # HR dashboard components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── store/              # Zustand global state
│   │   ├── services/           # Axios API clients
│   │   └── utils/
│   └── public/
│
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   └── middleware/
│   │   ├── agents/             # LLM agent definitions
│   │   │   ├── ParserAgent.js
│   │   │   ├── InterviewerAgent.js
│   │   │   ├── EvaluatorAgent.js
│   │   │   └── RLHFAgent.js
│   │   ├── models/             # Mongoose schemas
│   │   ├── services/           # External API clients
│   │   │   ├── groq.service.js
│   │   │   ├── gemini.service.js
│   │   │   └── tts.service.js
│   │   ├── jobs/               # Background job queue
│   │   └── utils/
│   └── index.js
│
├── shared/                     # Shared types/constants
└── docker-compose.yml
```

### 2.2 — MongoDB Schema Design

#### `Tenants` Collection
```
{
  _id, companyName, subdomain, logoUrl, primaryColor,
  plan: { tier, interviewsLimit, interviewsUsed, renewalDate },
  apiKeys: { groq, gemini, googleTts },  // tenant-specific keys for enterprise
  settings: { interviewWindowHours, reminderEnabled, brandingEnabled },
  createdAt
}
```

#### `Jobs` Collection
```
{
  _id, tenantId, title, description, rawJdText,
  rubric: [{ competency, weight, description }],
  questionBank: [{ questionText, type, targetCompetency }],
  status: enum['active', 'paused', 'closed'],
  candidatesRequired: Number,
  stats: { applied, shortlisted, interviewed, avgScore },
  createdBy (userId), createdAt
}
```

#### `Candidates` Collection
```
{
  _id, tenantId, jobId,
  personal: { name, email, phone },
  cvUrl (S3), cvText (extracted),
  shortlistStatus: Boolean, shortlistReason (AI text),
  interviewToken: { token, expiresAt, usedAt },
  interview: {
    status: enum['pending','in_progress','completed','expired'],
    startedAt, completedAt, duration,
    conversationHistory: [{ role, content, timestamp }],
    audioSegmentRefs: [S3 keys]  // stored post-interview only
  },
  scores: {
    overall: Number,
    breakdown: [{ competency, score, reasoning }],
    integrityScore: Number,
    aiVerdict: enum['shortlist','hold','reject'],
    aiSummary: String (2-3 sentences)
  },
  hrOverride: { overridden: Boolean, newDecision, overriddenBy, reason, timestamp },
  candidateFeedback: { rating: Number, text: String },
  flags: [{ type, timestamp, detail }]   // cheating flags
}
```

#### `RLHF_Logs` Collection
```
{
  _id, tenantId, candidateId, jobId,
  originalAiVerdict, hrNewDecision,
  hrFeedback (text), overriddenBy,
  transcriptSnapshot, scoresSnapshot,
  processedForTraining: Boolean,
  timestamp
}
```

#### `Users` Collection (HR Team)
```
{
  _id, tenantId, name, email, passwordHash,
  role: enum['admin','hr_manager','recruiter','hiring_manager'],
  lastLogin, createdAt
}
```

### 2.3 — Full API Route Map

#### Auth Routes (`/api/auth`)
- `POST /register` — Tenant + Admin account creation (SaaS signup)
- `POST /login` — JWT issuance
- `POST /invite` — Invite team member (sends email with setup link)
- `POST /refresh` — JWT refresh
- `POST /logout`

#### Job Routes (`/api/jobs`)
- `POST /create` — Create job (with JD upload, triggers Parser Agent for rubric generation)
- `GET /` — List all jobs for tenant
- `GET /:jobId` — Job detail + stats
- `PATCH /:jobId` — Edit job settings/rubric
- `PATCH /:jobId/status` — Pause/close/reopen role
- `POST /generate-jd` — AI-generate JD from role name + context
- `GET /templates` — Fetch saved role templates
- `POST /templates` — Save current job as template

#### Candidate Routes (`/api/candidates`)
- `POST /apply` — Public endpoint: CV upload + job ID → triggers shortlist
- `GET /:jobId/list` — Paginated candidate list with sort/filter
- `GET /:candidateId` — Full candidate profile + scores + transcript
- `POST /bulk-action` — Select N candidates → bulk reject/advance/export

#### Interview Routes (`/api/interview`)
- `GET /validate-token/:token` — Validate interview link on candidate pre-flight
- `POST /start` — Initialize interview session, generate first question
- `POST /process-audio` — Core loop: audio blob → STT → LLM → TTS → return audio
- `POST /conclude` — Trigger Evaluator Agent, compute final scores
- `POST /heartbeat` — Liveness ping (detect if candidate closed tab mid-interview)
- `POST /flag` — Integrity event logging (tab switch, copy-paste, etc.)

#### HR Routes (`/api/hr`)
- `GET /dashboard` — Aggregate metrics (total roles, interviews today, pending reviews)
- `GET /export-report/:jobId` — Generate XLSX report
- `POST /share-report` — Email PDF reports to hiring managers
- `GET /pipeline/:jobId` — Kanban-style pipeline data

#### RLHF Routes (`/api/rlhf`)
- `POST /override` — Log HR override + flag for retraining
- `GET /logs` — View RLHF override history (admin only)
- `POST /apply-calibration` — Trigger re-calibration of Evaluator Agent prompts (scheduled/manual)

#### Tenant/Admin Routes (`/api/admin`)
- `GET /usage` — Interviews used, API cost estimate, plan status
- `PATCH /settings` — Update branding, email templates, interview window
- `POST /api-keys` — Store/update tenant API keys (encrypted)
- `GET /team` — List team members
- `DELETE /team/:userId` — Remove team member

#### Webhook Routes (`/api/webhooks`)
- `POST /configure` — Set ATS webhook endpoint URL
- `POST /test` — Send test payload to configured endpoint

### 2.4 — The Agentic Brain (Multi-Agent Architecture)

#### Agent 1: Parser Agent
**Trigger:** JD upload or CV upload.
**For JD:**
- Extract: title, required skills (hard/soft), experience range, seniority signals.
- Generate: Interview Rubric with 5–7 competencies and weights summing to 100.
- Generate: Seed question bank (10–15 questions tagged to competencies).
- Output stored to `Jobs.rubric` and `Jobs.questionBank`.

**For CV:**
- Extract: Name, email, phone, skills, experience in years, companies, education.
- Cross-reference: Match skills against JD's required skills. Compute match score.
- Decision: `isShortlisted` (boolean) + `shortlistReason` (2-line explanation).
- If shortlisted: Generate `interviewToken`, trigger outreach email.

**Prompt Strategy:** Structured JSON-output prompting. Gemini Flash for speed and cost.

#### Agent 2: Interviewer Agent
**Trigger:** Each `POST /api/interview/process-audio` call.
**Context passed each time:**
- JD rubric + competency weights
- Conversation history (all prior Q&A)
- Competencies covered so far vs. remaining
- Candidate's CV summary (to enable personalized questions)
- Interview stage (early/mid/late)

**Behavior:**
- Stage 1 (Q1–2): Warm and open. "Walk me through..." style.
- Stage 2 (Q3–6): Technical depth. Stack-specific. Adaptive — if an answer reveals weakness, probe deeper; if strong, advance.
- Stage 3 (Q7–8): Behavioral/situational. STAR-format expected.
- If a candidate gives a vague answer: One follow-up ("Can you elaborate on how you handled X specifically?").
- Tracks which competencies have been assessed to ensure full rubric coverage.

**Output per call:**
- `nextQuestion` (text)
- `competencyAssessed` (from this answer)
- `preliminaryScore` (0–10 for this answer, used internally)
- `interviewStatus` (continue / conclude)

#### Agent 3: Evaluator Agent
**Trigger:** `POST /api/interview/conclude`
**Input:** Full conversation history + JD rubric + competency weights.
**Output:**
- Score per competency (0–100) with 1-sentence reasoning each.
- Overall weighted score.
- 2–3 sentence summary (written as if for a hiring manager).
- Final verdict: `shortlist` / `hold` / `reject` with confidence level.
- Red flags list (if any).

**Prompt Strategy:** Chain-of-thought prompting. Evaluate each answer segment independently, then synthesize. Output as strict JSON.

#### Agent 4: RLHF Calibration Agent
**Trigger:** Monthly batch run (or admin-triggered).
**Input:** All `RLHF_Logs` since last calibration (HR overrides).
**Output:**
- Analysis of bias patterns ("HR consistently overrides AI rejects for candidates with < 3 YoE").
- Suggested system prompt parameter adjustments for Evaluator Agent.
- New calibration version saved to DB, applied to future interviews.

---

## PART 3 — External API Usage Plan

| API | Purpose | Usage Pattern | Cost Control |
|---|---|---|---|
| **Groq (Whisper)** | Speech-to-Text | Per audio segment (~15–30s chunks) | Stream audio in chunks, not full recording |
| **Gemini Flash** | Interviewer Agent, Parser Agent | Per interview turn | Use Flash (not Pro) for all real-time calls |
| **Gemini Pro** | Evaluator Agent | Once per interview conclusion | Acceptable latency, higher quality |
| **Google Cloud TTS** | AI voice output | Per question generated | Cache repeated phrases ("Could you elaborate?") |
| **AWS S3 / Cloudflare R2** | CV storage, audio archives | Per upload | Lifecycle rules: auto-delete audio after 90 days |
| **Resend / SendGrid** | Transactional emails | Per outreach + reminder event | Template-based, batched |

**Cost Architecture for ₹1k/month Constraint (Development/MVP):**
- Use Groq free tier (dev) — 14,400 min/month Whisper.
- Use Gemini free tier — 1,500 req/day Flash.
- Google Cloud TTS — $4/1M characters (tiny for MVP).
- MongoDB Atlas free tier (M0) for MVP.
- Scale: Each interview costs approximately ₹3–8 in API costs at volume. Priced accordingly in plans.

---

## PART 4 — Frontend Architecture Deep Dive

### 4.1 — Two Separate React Apps (Single Monorepo)

**App 1: HR Portal** (`hirenode.io/hr/*`)
- Protected by JWT auth.
- Full dashboard, pipeline, reports, settings.

**App 2: Candidate Portal** (`acme.hirenode.io/apply/:jobId`)
- Public-facing, white-labeled per tenant.
- No auth — token-based access to interview room.

### 4.2 — State Management Strategy
- **Zustand** for global HR app state (current tenant, user, active job filter).
- **React Query (TanStack Query)** for all server state (jobs, candidates, dashboard stats) — handles caching, background refetch, pagination cleanly.
- **React Refs** (not state) for all in-flight interview audio blobs — zero re-renders during interview loop.
- **Context API** for lightweight cross-component signals (interview status: listening/processing/AI-speaking).

### 4.3 — The Interview Room — Technical Deep Dive

The interview room is the most complex and performance-critical component.

**Audio Capture Flow:**
1. `getUserMedia()` → `MediaRecorder` API → records in `audio/webm`.
2. On candidate pressing "Done" (or VAD silence detection after 2s):
   - Stop `MediaRecorder` → collect blob.
   - Store blob in a `useRef` (no re-render).
   - POST blob + `conversationHistory` to `/api/interview/process-audio`.
3. While waiting for response → show "AI Processing..." animation.
4. On response:
   - Receive audio buffer (TTS output).
   - Create `AudioContext` → decode buffer → play via `AudioContext.destination`.
   - Simultaneously: show AI waveform animation.
   - Append to conversation history ref.
   - Update question number state.

**VAD (Voice Activity Detection):**
- Use `AudioContext.createAnalyser()` to monitor volume levels.
- If volume drops below threshold for 2s after candidate has spoken → auto-trigger submission (optional, configurable per drive).
- This gives the "smart enough to know when you're done" feel.

**AI Waveform Visualizer:**
- Use `AnalyserNode` on the TTS audio output — real waveform data from actual audio.
- Render via `<canvas>` with `requestAnimationFrame` loop.
- Framer Motion for the outer glow/pulse animation.
- Result: waveform moves with the AI's actual voice, not a fake animation.

### 4.4 — Key UI Screens Summary

| Screen | Route | Auth | Description |
|---|---|---|---|
| SaaS Landing | `/` | Public | Marketing page, pricing, sign up |
| HR Signup/Login | `/auth/*` | Public | Tenant creation + login |
| HR Dashboard | `/hr/dashboard` | HR Auth | Aggregate metrics, all roles |
| Role Detail | `/hr/roles/:jobId` | HR Auth | Pipeline, candidate list |
| Candidate Report | `/hr/candidates/:id` | HR Auth | Full scores, transcript, RLHF |
| Settings | `/hr/settings` | Admin Auth | Branding, team, billing |
| Apply Page | `/:tenantSlug/apply/:jobId` | Public | CV upload |
| Pre-flight | `/:tenantSlug/preflight/:token` | Token | Tech check + instructions |
| Interview Room | `/:tenantSlug/interview/:token` | Token | Live interview |
| Thank You | `/:tenantSlug/complete` | Public | Post-interview confirmation |

---

## PART 5 — Development Phases & Milestones

### Phase 0 — Foundation (Week 1–2)
**Goal:** Skeleton is up, data flows end-to-end.

- [ ] Monorepo setup (client + server folders, shared config).
- [ ] Express server with middleware (CORS, Helmet, Morgan, rate-limiter).
- [ ] MongoDB Atlas connection + Mongoose model stubs.
- [ ] JWT auth middleware (register, login, refresh).
- [ ] React app scaffold (Vite + Tailwind + React Router).
- [ ] Zustand store + React Query setup.
- [ ] Environment config (dotenv, all API keys wired).
- [ ] Basic CI: ESLint + Prettier enforced.

**Milestone:** A logged-in HR user can hit a `/dashboard` endpoint and get back `{ status: 'ok' }`.

---

### Phase 1 — CV Ingestion & Shortlisting (Week 3–4)
**Goal:** HR can create a role, a candidate can apply, AI decides shortlist.

- [ ] `POST /api/jobs/create` — JD upload, Parser Agent extracts rubric.
- [ ] HR job creation UI — JD upload zone, rubric review/edit screen.
- [ ] `POST /api/candidates/apply` — Public apply page, CV upload.
- [ ] Parser Agent: CV text extraction (use `pdf-parse` library), cross-ref with JD.
- [ ] Shortlist decision + Interview Token generation.
- [ ] Transactional email via Resend (shortlist notification with interview link).
- [ ] HR can see candidates in the pipeline (Applied → Shortlisted states).

**Milestone:** End-to-end: Upload JD → apply with CV → AI shortlists → email with interview link arrives.

---

### Phase 2 — The Interview Loop (Week 5–7)
**Goal:** Full live interview works. This is the hardest phase.

- [ ] Interview token validation route.
- [ ] Pre-flight screen: mic test, camera preview, instructions.
- [ ] `POST /api/interview/start` — Fetch first question from Interviewer Agent.
- [ ] `MediaRecorder` audio capture in React.
- [ ] `POST /api/interview/process-audio` — Full chain: Groq STT → Gemini Interviewer → Google TTS.
- [ ] Audio playback in frontend + waveform visualizer via `AnalyserNode`.
- [ ] Conversation history management (sent with each request, accumulated in ref).
- [ ] Interview conclude trigger (agent decides when 8 questions are covered).
- [ ] Heartbeat + tab-switch integrity detection.
- [ ] Thank you screen + candidate confirmation email.

**Milestone:** A candidate can complete a full end-to-end AI interview. It sounds and feels like a real call.

---

### Phase 3 — Evaluation & HR Review (Week 8–9)
**Goal:** HR sees meaningful, actionable results.

- [ ] Evaluator Agent: Full transcript → JSON scores per competency.
- [ ] Score storage in `Candidates.scores`.
- [ ] Candidate Report screen: Score rings (circular progress), transcript UI.
- [ ] AI summary and verdict display.
- [ ] Integrity flags display on report.
- [ ] Ranked shortlist view on role detail page.
- [ ] XLSX export route + download button.
- [ ] HR Override + RLHF log write.

**Milestone:** After an interview completes, HR sees a ranked list with scores and a downloadable report in < 30 seconds.

---

### Phase 4 — Multi-Tenant & Polish (Week 10–11)
**Goal:** Make it a real SaaS product, not a prototype.

- [ ] Tenant isolation middleware (every request scoped to `tenantId` from JWT).
- [ ] Tenant onboarding flow: company name, logo, subdomain, color.
- [ ] White-label apply/interview pages (logo, primary color applied).
- [ ] Team invite flow (email invite → setup account → role-based access).
- [ ] Usage tracking middleware (increment `interviewsUsed` per tenant).
- [ ] Plan limit enforcement (429 response when limit hit, upgrade prompt).
- [ ] Role templates: save and clone.
- [ ] Bulk candidate actions (bulk reject, bulk export).

**Milestone:** Two separate companies can sign up, run independent drives, and see only their own data.

---

### Phase 5 — Enterprise Hardening (Week 12–14)
**Goal:** Ship it to paying beta customers. Make it bulletproof.

- [ ] Webhook system for ATS integrations.
- [ ] Rate limiting per tenant + global.
- [ ] Error handling and retry logic on all API calls (Groq, Gemini, TTS).
- [ ] AWS S3 / Cloudflare R2 for CV and audio storage (remove local storage).
- [ ] Background job queue (Bull + Redis) for: post-interview evaluation, email sending, RLHF batch processing.
- [ ] RLHF Calibration Agent batch job.
- [ ] Candidate self-assessment collection.
- [ ] Full mobile responsiveness for candidate portal (HR portal desktop-only is acceptable).
- [ ] Load testing interview endpoint (target: 50 concurrent interviews without degradation).
- [ ] Security audit: Input validation, rate limits, token expiry, CORS policies, API key encryption at rest.

**Milestone:** 5 beta companies run live hiring drives. Zero critical bugs. Latency < 3s per interview turn.

---

## PART 6 — Non-Obvious Engineering Decisions

### 6.1 — Why Not WebSockets for the Interview Loop?
HTTP request-response (REST) is chosen intentionally over WebSockets for the core interview loop. Each turn is a discrete, stateless transaction (audio in → audio out). REST gives us: simpler retry logic, easier horizontal scaling, and no persistent connection management. The "feel" of real-time comes from UX design (instant feedback states), not from WebSockets.

### 6.2 — Conversation History as Client Payload
Instead of storing conversation state server-side per session, the full `conversationHistory` array is sent with every request to `/process-audio`. This is intentional: stateless server, easier scaling, no session lookup latency. The client is the source of truth for in-progress interview state.

### 6.3 — `multer.memoryStorage()` — Why It Matters
Audio blobs must never touch disk. `memoryStorage()` keeps the buffer in RAM → passed directly to Groq API as a stream → Groq responds → result piped to Gemini. No intermediate file writes. This shaves 50–200ms per turn in latency.

### 6.4 — TTS Audio Caching
AI interviewers repeat certain phrases: "Interesting, can you tell me more?", "Thanks, moving to the next question." Pre-generate these as cached audio buffers at startup. Never call TTS for these filler phrases. Saves API credits and improves response time.

### 6.5 — Gemini Flash for Interviewer, Gemini Pro for Evaluator
The Interviewer Agent needs speed (< 1.5s ideally). Gemini Flash is fast and sufficient for generating the next question from conversation context. The Evaluator Agent runs once per interview, asynchronously, and needs higher reasoning quality — Gemini Pro is the right tool here. Latency doesn't matter for evaluation.

### 6.6 — Scoring Happens Offline
`/api/interview/conclude` does NOT block the candidate's "thank you" screen. The candidate sees the completion screen immediately. The Evaluator Agent runs as a background job (Bull queue). HR doesn't see scores instantly — they see a "Processing..." indicator on the candidate card for ~30–60 seconds. This is the correct UX — don't make the candidate wait.

---

## PART 7 — Design System Principles

### Visual Language
- **Background:** `#0F172A` (Slate 900) — reduces eye strain in long HR sessions.
- **Primary Accent:** `#38BDF8` (Sky 400) — trustworthy, tech-forward, not aggressive.
- **Success:** `#34D399` (Emerald) — shortlisted, high scores.
- **Warning:** `#FBBF24` (Amber) — hold/review states.
- **Danger:** `#F87171` (Red 400) — rejection, flags.
- **Typography:** `IBM Plex Mono` for data/scores (conveys precision), `Inter` for body copy.
- **Candidate portal:** Slightly warmer, less corporate — `#0F172A` bg with `#7DD3FC` accent. More breathing room, larger text, calmer.

### Component Architecture
- Design system primitives in `components/ui/` — `Button`, `Badge`, `Card`, `Modal`, `Spinner`, `Progress`, `Avatar`.
- All primitives built with Tailwind class-variance-authority (CVA) variants.
- No UI library dependency — custom components give us full white-label flexibility.

---

## PART 8 — Go-To-Market Strategy (Brief)

### Beta Launch (Month 4)
- 5 design partner companies (startups with active hiring needs).
- Free during beta. Collect: interview recordings (with consent), override data, qualitative feedback.
- Goal: Prove that HR hours saved per hire > 10 hours.

### Metrics That Matter to Investors
- **Time-to-shortlist:** JD upload → ranked shortlist (target: < 48 hours including candidate scheduling window).
- **HR hours saved per hire:** Benchmark 12–15 hours manual → 0.5 hours with HireNode.
- **Interview completion rate:** % of invited candidates who complete the interview.
- **Override rate:** % of AI verdicts HR reverses (proxy for AI quality — target < 15%).
- **Candidate NPS:** Post-interview rating (target > 7/10).

### Moat
1. **RLHF per tenant:** The more a company uses HireNode, the more calibrated it becomes to their specific hiring bar. Switching cost increases over time.
2. **Interview data flywheel:** Aggregate (anonymized) data from thousands of interviews improves all agents over time. First-mover advantage.
3. **ATS integration depth:** Once plugged into Greenhouse or Workday, switching is painful.

---

## SUMMARY — Build Order

```
Phase 0: Foundation & Auth (2 weeks)
    ↓
Phase 1: JD + CV Ingestion, Parser Agent (2 weeks)
    ↓
Phase 2: Live Interview Loop — Core Product (3 weeks)
    ↓
Phase 3: Evaluation, Scoring, HR Reports (2 weeks)
    ↓
Phase 4: Multi-Tenant, Whitelabel, Team Features (2 weeks)
    ↓
Phase 5: Enterprise Hardening, Background Jobs, Security (3 weeks)
    ↓
Beta Launch with 5 Design Partners
    ↓
Iterate on RLHF calibration + ATS integrations
    ↓
Series A pitch with proven HR hours-saved metric
```

**Total estimated timeline to beta: 14 weeks (3.5 months) with 1–2 developers.**

---
*HireNode — Built for the recruiters who are tired of being recruiters.*
