# ScholarPulse AI: Resilient Hybrid Vercel Deployment & Zero-Failure Architecture

A comprehensive plan to eliminate Vercel deployment and runtime failures by transitioning ScholarPulse AI into a full hybrid architecture with bundled landmark papers, resilient API response parsing, client-side arXiv parsing, browser credential storage, and direct client-side Gemini API fallback.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed based on your clarifying choices:
> - **Execution Mode**: **Full Hybrid Mode with Bundled Landmark Papers**. The app will never fail to load seminal papers like Attention Is All You Need, LoRA, FlashAttention, or DeepSeek-R1 because they are embedded directly into the frontend cache while simultaneously trying server endpoints if available.
> - **Storage & Authentication**: **Resilient Browser Storage with Optional Firebase Cloud Sync**. User accounts, saved papers, and RAG chat history persist across sessions using robust local storage, with graceful automatic synchronization to Firebase Firestore when credentials are provided.
> - **Zero-Crash API Client**: All HTTP requests are wrapped with content-type checking and safe fallback logic so that unexpected HTML responses (like Vercel 404 pages) will never trigger `Unexpected token 'T'` JSON parse exceptions.

---

## 1. Overview & Core Concept

ScholarPulse AI is an academic research platform designed for instant paper ingestion, structure-aware reading, multi-stage summarization, and grounded RAG Q&A. When deployed to serverless environments like Vercel, traditional single-server assumptions (persistent disk files in `./data`, long-running Node processes, and internal Express route rewrites) encounter cold starts, read-only filesystems, and gateway 404s.

This implementation transforms ScholarPulse AI into an **always-available, hybrid system**:
- **Instant First-Paint**: The app boots immediately with pre-indexed landmark papers (`Attention Is All You Need`, `LoRA`, `FlashAttention`, `DeepSeek-R1`) with zero network latency.
- **Resilient Ingestion**: Ingesting arXiv links, DOIs, or PDF files operates through a dual-engine: it queries the backend API first, and if the backend returns a 404 or non-JSON response, it seamlessly executes direct browser-side extraction via arXiv's Open Access API and PDF.js.
- **Fail-Safe AI Chat**: RAG deep chat and summarization attempt the server proxy first, and automatically fall back to direct `@google/genai` calls using `VITE_GEMINI_API_KEY` or `GEMINI_API_KEY` with ground-truth chunk citations.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Initial Visit / Zero State**:
   - The user opens the deployed Vercel URL.
   - The platform immediately loads *Attention Is All You Need* in the primary view with full executive summary, key equations (rendered via KaTeX), methodology, and citation export.
   - No red error banners appear on load.
2. **Account Sign In & Guest Access**:
   - The user opens the **Profile / Sign In** modal.
   - Clicking **Continue with Google** or entering an **Academic Email** immediately authenticates into the local workspace without waiting on or failing against serverless routes.
   - If Firebase credentials are configured in Vercel, the session is silently synced to Firestore.
3. **Paper Ingestion**:
   - The user clicks **Ingest Paper** and enters an arXiv ID (e.g., `2205.14135` for FlashAttention) or uploads a PDF.
   - The modal shows smooth progressive loading states: *Fetching metadata &rarr; Parsing academic sections &rarr; Generating vector chunks*.
   - If the backend returns HTML or is unreachable, the client parser completes the ingestion seamlessly in under 2 seconds.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Bundled Landmark Papers vs. Pure Server Fetch**
  - *Chosen Approach*: Embed the full pre-computed structured records for landmark papers in `src/data/landmarkPapers.ts`.
  - *Why*: Guarantees 100% uptime on the landing page even if Vercel serverless functions are cold or misconfigured.
  - *Alternatives Considered*: Requiring an initial network roundtrip to `/api/papers` on every page load, which led to the 404 error banner in your screenshot.

- **Decision 2: Resilient API Client with Safe JSON Parsing**
  - *Chosen Approach*: Replace raw `fetch().then(r => r.json())` with a guarded API client that checks `res.headers.get('content-type')` and handles non-JSON responses gracefully.
  - *Why*: Completely prevents `Unexpected token 'T', "The page c"... is not valid JSON` from ever crashing the UI.

- **Decision 3: Dual-Mode Gemini Invocations**
  - *Chosen Approach*: The RAG engine checks `/api/chat` first; if unavailable, it uses the client-side Google GenAI SDK.
  - *Why*: Allows Vercel users to provide `VITE_GEMINI_API_KEY` for instant client-side execution, while supporting server-side keys when running in Google AI Studio.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                     ScholarPulse AI - Hybrid Engine                    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌──────────────────────────────────┐            ┌──────────────────────────────────┐
│        Frontend Client           │            │    Backend Server (Express)      │
│     (Vite + React + Tailwind)    │            │     (Dev & AI Studio Server)     │
├──────────────────────────────────┤            ├──────────────────────────────────┤
│ • Bundled Landmark Paper Cache   │            │ • Multi-stage Map-Reduce Summarizer
│ • Safe JSON Parser (No 404 trap) │  Fallback  │ • Local Disk Cache (data/pdfs)   │
│ • Client arXiv & PDF.js Parser   │◄───────────│ • Express routes (/api/papers)   │
│ • Browser LocalStorage Store     │            │ • In-memory stores & Auth        │
│ • Direct Gemini Flash Client SDK │            └──────────────────────────────────┘
└──────────────────────────────────┘
```

### Component & File Changes
1. **`src/data/landmarkPapers.ts`**:
   - Contains complete pre-built structured metadata, sections, chunks, formulas, and citations for `paper_transformer`, `paper_lora`, and popular benchmarks.
2. **`src/services/api.ts`**:
   - Implements guarded `safeFetchJson()` that handles HTML error pages without throwing SyntaxErrors.
   - Provides instant fallback to bundled landmark papers when `/api/papers/:id` returns 404.
   - Direct browser-based arXiv metadata scraper and fallback ingestion.
3. **`src/components/AuthModal.tsx`**:
   - Uses resilient local authentication session management so users can sign in or explore immediately without failing on `/api/auth/login`.
4. **`vercel.json`**:
   - Configured cleanly with universal SPA rewrites to ensure Vercel routes all client navigation to `index.html` without breaking assets.
