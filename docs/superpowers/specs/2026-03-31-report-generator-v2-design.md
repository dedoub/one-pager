# Report Generator v2 - Design Spec

## Overview

Stock research report generator with progressive fill UX. Users input a ticker, the system auto-generates a full analyst report with animated section-by-section rendering, then refine via floating chat with Claude/Gemini. Reports are organized in a folder tree with manual versioning.

## Core Concept

> Empty frames → data fills in progressively → sections animate as they arrive → user watches their report being built. Chat refinements trigger re-fill animations on affected sections.

## Screen Layout

```
┌──────────────┬──────────────────────────────────────────┐
│ Folder Tree  │  Report Area (full width)                │
│ (200px)      │                                          │
│              │  [Toolbar: title, version tabs, PDF btn] │
│ ▼ Research   │                                          │
│   CRWD  ◀   │  ┌── Header ────────────────────────┐    │
│   PLTR      │  │  Company · Price · MCap · Sector  │    │
│ ▼ Sectors   │  └──────────────────────────────────┘    │
│   Cyber     │  ┌── Valuation ──┐ ┌── Growth ──────┐    │
│ ▶ Archive   │  │  PE, PS, EV   │ │ Rev, Margin    │    │
│              │  └──────────────┘ └────────────────┘    │
│              │  ┌── Charts ───────────────────────┐    │
│ [+ Folder]  │  │  Price 12M     Revenue Trend     │    │
│              │  └─────────────────────────────────┘    │
│              │  ┌── Thesis ───────────────────────┐    │
│              │  │  Bull / Bear points              │    │
│              │  └─────────────────────────────────┘    │
│              │  ┌── Verdict ──────────────────────┐    │
│              │  │  PASS/FAIL + Tier + Reason       │    │
│              │  └─────────────────────────────────┘    │
│              │                                          │
│              │                    [Save v2]  [PDF]      │
└──────────────┴──────────────────────────────────────────┘
                                          ┌──────────────┐
                                          │ 💬 Chat      │
                                          │ (floating,   │
                                          │  toggleable) │
                                          └──────────────┘
```

## Animation System

| Event | Effect |
|-------|--------|
| Initial generation | Sections fade-in top→bottom sequentially. Numbers count up from 0. Chart lines draw progressively. |
| Chat modification | Affected section fades out → new content types in with fill effect |
| Empty section | Subtle background tint + placeholder text ("Ask Claude to fill this section") |
| Section loading | Pulse/skeleton animation while data arrives |

Implementation: Framer Motion for fade/slide, custom hooks for number countup and typewriter effects.

### Synthetic SSE Strategy

Claude CLI (`claude -p`) returns a complete response, not a stream. To achieve progressive fill UX:
1. AI generates full report as one JSON response
2. Server parses the complete JSON into sections
3. Server emits SSE events section-by-section with small delays (~200ms)
4. Frontend receives each section and triggers animation

Gemini can use `generateContentStream` for real streaming, but the same synthetic SSE approach is used for consistency.

## Architecture

```
[Browser]                      [Next.js API Routes]           [External]
  │                                │                              │
  ├─ Ticker input ───────────────> POST /api/reports/generate     │
  │                                ├─> yahoo-finance2 (market data + charts)
  │                                ├─> Supabase (existing research data)
  │                                ├─> AI call (analysis+thesis) ─┘
  │                                └─> Supabase (save report)
  │  ◀── SSE stream (synthetic, section-by-section) ──┘
  │                                │
  ├─ Chat message ──────────────> POST /api/chat
  │                                └─> AI call (modify sections)
  │  ◀── SSE (modified sections only) ──┘
  │                                │
  ├─ Save ──────────────────────> POST /api/reports/[id]/save
  ├─ Folder CRUD ───────────────> /api/folders
  └─ PDF ───────────────────────> Client-side (html2canvas+jsPDF)
```

### AI Dual Strategy

| Environment | Method | Model |
|-------------|--------|-------|
| Local (`next dev`) | `claude -p` via spawn | Claude Opus |
| Vercel (deployed) | `@google/generative-ai` SDK | Gemini 2.5 Flash |

Abstraction layer: `lib/ai.ts` exports `generateReport()` / `refineReport()`. Checks `process.env.AI_PROVIDER` (`claude` or `gemini`) to route.

```typescript
// lib/ai.ts
export async function generateReport(
  ticker: string,
  marketData: MarketData,
  existingResearch?: StockResearch
): Promise<ReportData> {
  if (process.env.AI_PROVIDER === 'claude') {
    return generateWithClaude(ticker, marketData, existingResearch)
  } else {
    return generateWithGemini(ticker, marketData, existingResearch)
  }
}
```

**AI responsibility**: Analysis and thesis only. AI receives pre-fetched market data and returns structured analysis (valuation commentary, thesis, verdict). It does NOT fetch financial data.

### Data Flow: Layered Sourcing

1. **Market data** (always): `yahoo-finance2` npm package fetches price, market cap, PE, PS, margins, chart data
2. **Existing research** (if available): `stock_research` table provides prior analysis (thesis, verdict, sector tags, trend notes)
3. **AI analysis**: Combines market data + existing research → generates valuation commentary, thesis points, verdict
4. **Manual refresh**: User can request "refresh data" via chat → re-fetches from yahoo-finance2

### Data Sourcing by Section

| Section | Source |
|---------|--------|
| header (price, mcap, sector) | yahoo-finance2 |
| valuation (PE, PS, EV/EBITDA) | yahoo-finance2 |
| growth (margins, revenue growth) | yahoo-finance2 |
| charts (price history, revenue trend) | yahoo-finance2 |
| thesis (bull/bear points) | AI (using market data + existing research) |
| verdict (pass/fail, reason) | AI |

## Environment Setup

### Dependencies (new)
```json
{
  "@supabase/supabase-js": "^2",
  "@google/generative-ai": "^0.24",
  "yahoo-finance2": "^2",
  "framer-motion": "^11"
}
```

### Environment Variables
```bash
# Supabase (willow-dash-tensw-todo)
NEXT_PUBLIC_SUPABASE_URL=https://axcfvieqsaphhvbkyzzv.supabase.co
SUPABASE_SECRET_KEY=...          # service_role key

# AI Provider
AI_PROVIDER=claude               # "claude" for local, "gemini" for Vercel
GEMINI_API_KEY=...               # only needed when AI_PROVIDER=gemini
```

### Authentication

Personal tool — no public auth required. API routes are protected by being a personal-use app. If deployed to Vercel, add basic token check via `API_SECRET` env var in headers.

## Database Schema

Using existing Supabase project (willow-dash-tensw-todo, `axcfvieqsaphhvbkyzzv`).

### `report_folders`
```sql
create table report_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references report_folders(id) on delete cascade,
  sort_order int default 0,
  created_at timestamptz default now()
);
```

### `reports`
```sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  ticker text not null,
  folder_id uuid references report_folders(id) on delete set null,
  status text not null default 'generating' check (status in ('generating', 'complete', 'error')),
  data jsonb not null default '{}',
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger reports_updated_at
  before update on reports
  for each row execute function update_updated_at();
```

### `report_versions`
```sql
create table report_versions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade not null,
  version int not null,
  data jsonb not null,
  created_at timestamptz default now()
);
```

### `report_chats`
```sql
create table report_chats (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);
```

## Report Data Structure (jsonb)

```typescript
interface ReportData {
  header: {
    companyName: string
    ticker: string
    exchange: string
    sector: string
    currentPrice: number
    marketCap: string      // e.g. "$82.3B"
    high52w: number
    gapFromHigh: number    // percentage
  }
  valuation: {
    pe: number | null
    ps: number | null
    evEbitda: number | null
    peg: number | null
    pbr: number | null
  }
  growth: {
    revenueGrowthYoy: number | null
    grossMargin: number | null
    operatingMargin: number | null
    fcfMargin: number | null
  }
  charts: {
    priceHistory: { date: string; price: number }[]
    revenueTrend: { quarter: string; revenue: number }[]
  }
  thesis: {
    summary: string
    bullPoints: string[]
    bearPoints: string[]
  }
  verdict: {
    result: 'pass_tier1' | 'pass_tier2' | 'watch' | 'fail'
    reason: string
  }
}
```

## API Routes

### `POST /api/reports/generate`
- Input: `{ ticker: string, folderId?: string }`
- Flow:
  1. Create report row with `status: 'generating'`
  2. Fetch market data via yahoo-finance2 (price, valuation, margins, charts)
  3. Check `stock_research` for existing analysis (thesis, verdict)
  4. Call AI with market data + existing research → get analysis (thesis, verdict)
  5. Compose full ReportData from market data + AI analysis
  6. Emit synthetic SSE events section-by-section (~200ms apart)
  7. Save complete data to report, set `status: 'complete'`
- On error: set `status: 'error'`, return partial data if available

### `POST /api/chat`
- Input: `{ reportId: string, message: string }`
- Context sent to AI:
  - Current `ReportData` (full)
  - Last 20 chat messages (to manage context window)
  - System prompt: "Return JSON with only the modified section keys and their updated data"
- AI response format: `{ sections: { [key: string]: object } }` (only changed sections)
- Updates `reports.data` by merging modified sections (no version bump)
- Saves user message + assistant response to `report_chats`

### `POST /api/reports/[id]/save`
- Copies current `data` to `report_versions` with incremented version
- Updates `reports.version`

### Version Switching
- `reports.data` is always the live working copy
- Version tabs load data from `report_versions` in **read-only mode**
- "Restore" button copies an old version's data back to `reports.data`
- Chat refinement only works on the live version

### `GET /api/reports` — List reports (with optional folder filter)
### `GET /api/reports/[id]` — Get single report with chat history
### `DELETE /api/reports/[id]` — Delete report

### `GET /api/folders` — List folder tree
### `POST /api/folders` — Create folder
### `PUT /api/folders/[id]` — Rename/move folder
### `DELETE /api/folders/[id]` — Delete folder (cascade, reports move to root)

## Frontend Components

```
app/
├── page.tsx                    # Main layout: sidebar + report area
├── components/
│   ├── FolderTree.tsx          # Collapsible folder navigation
│   ├── ReportView.tsx          # Full analyst report with animations
│   ├── ReportSection.tsx       # Individual section with fill animation
│   ├── FloatingChat.tsx        # Toggle-able chat panel (bottom-right)
│   ├── ChatMessage.tsx         # Chat bubble
│   ├── TickerInput.tsx         # New report creation input
│   ├── VersionBar.tsx          # Version tabs + Save/PDF buttons
│   ├── AnimatedNumber.tsx      # Count-up number animation
│   ├── ChartSection.tsx        # Recharts with draw animation
│   └── PdfExport.tsx           # html2canvas + jsPDF (existing)
├── lib/
│   ├── ai.ts                   # AI abstraction (claude/gemini switch)
│   ├── ai-claude.ts            # Claude CLI spawn wrapper
│   ├── ai-gemini.ts            # Gemini SDK wrapper
│   ├── supabase.ts             # Supabase client
│   ├── market-data.ts          # yahoo-finance2 wrapper
│   ├── types.ts                # ReportData, folder types
│   └── animations.ts           # Animation config/helpers
```

## Tech Stack

- **Framework**: Next.js (existing one-pager project)
- **DB**: Supabase (willow-dash-tensw-todo)
- **AI (local)**: Claude CLI (`claude -p` spawn, Opus)
- **AI (deployed)**: `@google/generative-ai` (Gemini 2.5 Flash)
- **Market Data**: yahoo-finance2
- **Charts**: Recharts
- **Animation**: Framer Motion
- **PDF**: html2canvas-pro + jsPDF
- **Styling**: Tailwind CSS

## Key User Flows

### 1. Create Report
1. Click "+" or type ticker in input
2. Empty report frame appears with placeholder sections
3. Market data fetches → header/valuation/growth sections fill with count-up animation
4. AI analysis arrives → thesis/verdict sections type in
5. Charts draw progressively
6. Report status changes to "complete"

### 2. Refine via Chat
1. Click floating chat button (bottom-right)
2. Chat panel slides in
3. Type feedback: "밸류에이션 좀 더 보수적으로 분석해줘"
4. Affected section(s) fade out → re-fill with updated content
5. Chat history preserved per report (last 20 messages sent as context)

### 3. Save Version
1. Click "Save" button
2. Current data snapshotted to `report_versions`
3. Version counter increments (v1 → v2)
4. Version tabs appear in toolbar for read-only switching
5. "Restore" button on old versions to bring back as live copy

### 4. Export PDF
1. Click "PDF" button
2. html2canvas captures report area
3. jsPDF generates A4 PDF
4. Auto-download

### 5. Organize Reports
1. Create folders in sidebar
2. Right-click → "Move to folder" for organization
3. Delete reports/folders (folder delete moves reports to root)
