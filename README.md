# 🔍 PRAMANA: Stateful Agentic Truth & Evidentiary Verification Engine

> **PRAMANA** (*Sanskrit प्रमाण* — "proof, reliable means of knowledge, accurate perception") is a full-stack, production-grade agentic system that extracts atomic claims from user statements, flags ambiguity, performs deterministic slot and evidence verification, detects timeline conflicts/gaps, and dynamically generates next-best non-leading questions.

---

## 🏛️ System Architecture

PRAMANA couples **ONE Core Agent Engine** with **THREE Operational Mode Configurations** (`investigation`, `hiring`, `diary`).

Deterministic business logic (cryptographic hash chains, slot validation, time normalization, conflict detection, and question linting) runs strictly in pure TypeScript. LLMs (`llama-3.3-70b-versatile` via Groq) are reserved exclusively for language parsing, semantic decomposition, and natural language formulation.

```
                              ┌────────────────────────────────────────┐
                              │            PRAMANA ENGINE              │
                              └──────────────────┬─────────────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   ▼                             ▼                             ▼
       ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
       │   INVESTIGATION MODE  │   │      HIRING MODE      │   │      DIARY MODE       │
       ├───────────────────────┤   ├───────────────────────┤   ├───────────────────────┤
       │ • Minute precision    │   │ • Day precision       │   │ • Hour precision      │
       │ • Forensic audit      │   │ • Scope verification  │   │ • Preserves ambiguity │
       │ • Non-leading coach   │   │ • No hiring score     │   │ • Parallel memories   │
       │ • Strict corroboration│   │ • Internal consistency│   │ • Warm reflective tone│
       └───────────────────────┘   └───────────────────────┘   └───────────────────────┘
```

---

## 🔄 LangGraph State Machine

The orchestration pipeline is built using `@langchain/langgraph`:

```
                             [Statement + Narrator + Date]
                                           │
                                           ▼
                                 ┌───────────────────┐
                                 │  EXTRACT_CLAIMS   │ (LLM / Structured Output)
                                 └─────────┬─────────┘
                                           │
                                           ▼
                                 ┌───────────────────┐
                                 │    CHECK_SLOTS    │ (Deterministic Slot Checker)
                                 └─────────┬─────────┘
                                           │
                                    Missing Slots?
                                    ┌──────┴──────┐
                            YES,    │             │   NO (or resolved)
                         no answer  ▼             ▼
             ┌─────────────────────────┐       ┌───────────────────┐
             │  GENERATE_CLARIFICATION │       │ EVALUATE_EVIDENCE │ (Conflict & Gap Detector)
             └─────────────┬───────────┘       └─────────┬─────────┘
                           │                             │
                           ▼                             ▼
                        [ END ]                ┌───────────────────┐
                 (Awaits User Answer)          │  GENERATE_COACH   │ (Question Linter Guardrail)
                                               └─────────┬─────────┘
                                                         │
                                                         ▼
                                                      [ END ]
```

---

## 📁 Repository Structure

```
.
├── app/
│   ├── layout.tsx                     # Dark-mode root layout
│   ├── page.tsx                       # Landing page with mode launchers
│   ├── case/
│   │   └── [id]/
│   │       └── page.tsx               # 3-column unified case workspace
│   └── api/
│       ├── agent/
│       │   └── route.ts               # LangGraph pipeline API endpoint
│       └── transcribe/
│           └── route.ts               # Groq Whisper v3 speech transcription API
├── components/
│   ├── mode-selector.tsx              # Mode switcher pill tabs
│   ├── statement-input.tsx            # Narrator, statement date & testimony input
│   ├── voice-input.tsx                # Multi-lingual voice assistant (Groq Whisper)
│   ├── claim-card.tsx                 # Atomic claim card with semantic slots
│   ├── clarification-gate.tsx         # Missing required slot resolution UI
│   ├── timeline.tsx                   # Chronological feed + React Flow graph view
│   ├── evidence-table.tsx             # Evidentiary records table & manual entry
│   ├── finding-card.tsx               # Anomaly & contradiction alert cards
│   ├── coach-panel.tsx                # Next-best non-leading question panel
│   ├── agent-activity.tsx             # Real-time LangGraph telemetry feed
│   └── hash-chain-status.tsx          # Cryptographic SHA-256 chain verification
├── agent/
│   ├── state.ts                       # LangGraph state channels & Annotation.Root
│   ├── schemas.ts                     # Zod schemas & TypeScript types
│   ├── prompts.ts                     # Cognitive interview system prompts
│   └── graph.ts                       # Compiled StateGraph & pipeline runner
├── tools/
│   ├── hash-chain.ts                  # SHA-256 chain calculation & verification
│   ├── slot-checker.ts                # Deterministic required slot audit
│   ├── time-normalizer.ts             # Relative & natural language time normalizer
│   ├── evidence-matcher.ts            # Spatial & temporal proximity matcher
│   ├── conflict-detector.ts           # Location/time conflict & dispute detector
│   ├── gap-detector.ts                # Unaccounted timeline interval detector
│   ├── question-linter.ts             # Cognitive interview non-leading rewriter
│   └── index.ts                       # Barrel export
├── modes/
│   ├── investigation.json             # Minute precision, strict corroboration
│   ├── hiring.json                    # Day precision, role continuity
│   └── diary.json                     # Hour precision, memory preservation
├── demo/
│   ├── investigation-case.json        # Meridian vault intrusion demo
│   ├── hiring-case.json               # Principal architect reference demo
│   ├── family-case.json               # 1994 lake trip recollection demo
│   └── evidence.csv                   # CSV evidentiary logs
├── supabase/
│   └── migrations/
│       └── 0001_init.sql              # PostgreSQL schema with foreign keys
├── .env.example                       # Environment template
├── ACKNOWLEDGEMENTS.md                # Citations and credits
└── README.md
```

---

## 🛠️ Deterministic Tooling

| Tool | Functionality | Deterministic Rules |
| :--- | :--- | :--- |
| `hash-chain.ts` | Tamper-evident narrative chain | `SHA256(prevHash \| narrator \| body \| createdAt)` |
| `slot-checker.ts` | Mode-specific required slot checks | Gathers missing `who`, `what`, `place`, `time_start` |
| `time-normalizer.ts` | Resolves relative time expressions | Maps phrases like *"yesterday at 3pm"* to ISO 8601 timestamps |
| `conflict-detector.ts` | Detects physical contradictions | Flags impossible co-location or conflicting times with verified logs |
| `gap-detector.ts` | Detects unaccounted timeline intervals | Flags unaccounted intervals exceeding mode thresholds (e.g. >2h) |
| `question-linter.ts` | Cognitive interview guardrail | Flags leading tags & adjectives; rewrites into open-ended inquiries |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template file to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the keys:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

*(Note: The system contains built-in resilient heuristic fallbacks and local memory persistence, enabling full demo exploration out-of-the-box even without active API keys).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Migrations (Supabase)

To apply the database schema in Supabase:
1. Open your Supabase Dashboard SQL Editor.
2. Run the migration script in `supabase/migrations/0001_init.sql`.
3. The script sets up `cases`, `statements`, `claims`, `clarifications`, `evidence`, and `findings` with cascading foreign keys and indexes.

---

## 🔬 Modes Overview

### 1. Forensic Investigation (`modes/investigation.json`)
- **Use Case**: Financial fraud, physical security intrusions, internal affairs.
- **Precision**: Minute-level.
- **Guardrails**: Strict witness attribution, non-leading cognitive interview prompts, physical colocation verification against keycard swipes, CCTV logs, and telemetric signals.

### 2. Candidate Reference Verification (`modes/hiring.json`)
- **Use Case**: Executive, principal, and senior staff reference checks.
- **Precision**: Day-level.
- **Guardrails**: Project ownership verification (sole vs team credit), corporate registry cross-checks, internal inconsistency detection without automated scoring.

### 3. Reflective Memory & Personal Diary (`modes/diary.json`)
- **Use Case**: Family histories, personal journals, memoirs.
- **Precision**: Hour-level.
- **Guardrails**: Preserves uncertainty, honors subjective memory divergences between family members without declaring winners.

---

## 🎙️ Integrated Multi-Lingual Voice Assistant

PRAMANA includes an integrated voice assistant powered by **Groq Whisper Large v3**:
- **Supported Languages**: Auto-Detect (`auto`), English (`en`), Hindi (`hi`, हिंदी), and Gujarati (`gu`, ગુજરાતી).
- **Architecture**:
  - Web Audio `MediaRecorder` captures audio with cross-browser codec negotiation (`audio/webm`, `audio/mp4`, `audio/ogg`).
  - Sends recording payload to `/api/transcribe`.
  - Transcribed text is automatically appended to the statement textarea for immediate claim extraction and verification.
- **Audio Feedback**: Live pulsing recording timer, animated audio waveform, and instant error handling.

---

## 🚀 Vercel & Supabase Deployment

### Path to Launch:
1. **Push repository to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete PRAMANA engine with voice assistant & Supabase"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) $\rightarrow$ *Add New Project* $\rightarrow$ Select your repository.
   - Vercel automatically detects Next.js (App Router).
3. **Configure Environment Variables**:
   In the Vercel project deployment screen, configure:
   - `GROQ_API_KEY`: Your Groq Cloud API key (for Llama 3.3 70B & Whisper v3).
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (`https://<ref>.supabase.co`).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
4. **Deploy**:
   - Click **Deploy**. Your app will be live at `https://<your-project>.vercel.app` with instant multi-lingual voice transcription and live truth-seeking verification!

---

## 📜 License & Acknowledgements

Created as part of the PRAMANA research architecture. For complete citations on cognitive interviewing, LangGraph, Groq, and Supabase, see [ACKNOWLEDGEMENTS.md](./ACKNOWLEDGEMENTS.md).
