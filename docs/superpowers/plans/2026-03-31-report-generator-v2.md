# Report Generator v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing one-pager app into a stock research report generator with progressive fill UX, AI-powered analysis, folder management, and chat refinement.

**Architecture:** Next.js API routes handle report generation (yahoo-finance2 for market data, Claude/Gemini for analysis). Reports stored in Supabase. Frontend renders analyst reports with Framer Motion animations, receives data via synthetic SSE. Floating chat panel for iterative refinement.

**Tech Stack:** Next.js 16, React 19, Supabase, yahoo-finance2, Claude CLI (local) / Gemini SDK (deployed), Framer Motion, Recharts, Tailwind v4

**Spec:** `docs/superpowers/specs/2026-03-31-report-generator-v2-design.md`

**Existing project:** `/Volumes/PRO-G40/app-dev/one-pager` — currently a client-side one-pager editor with 3 templates (warm/modern/bold), EditorPanel, and PDF export. V2 replaces the main page but keeps PdfExport and the existing template code available at a separate route.

---

## File Structure

```
app/
├── page.tsx                          # NEW: Main v2 layout (sidebar + report area)
├── classic/page.tsx                  # MOVE: Old v1 page (keep accessible)
├── api/
│   ├── folders/
│   │   ├── route.ts                  # NEW: GET (list), POST (create)
│   │   └── [id]/route.ts            # NEW: PUT (rename/move), DELETE
│   ├── reports/
│   │   ├── route.ts                  # NEW: GET (list)
│   │   ├── generate/route.ts        # NEW: POST (generate + SSE stream)
│   │   └── [id]/
│   │       ├── route.ts             # NEW: GET (single), DELETE
│   │       ├── save/route.ts        # NEW: POST (version snapshot)
│   │       └── restore/route.ts     # NEW: POST (restore version)
│   └── chat/route.ts                # NEW: POST (chat refinement)
├── components/
│   ├── FolderTree.tsx                # NEW: Sidebar folder navigation
│   ├── ReportView.tsx                # NEW: Full analyst report layout
│   ├── ReportSection.tsx             # NEW: Animated section wrapper
│   ├── FloatingChat.tsx              # NEW: Toggle-able chat panel
│   ├── TickerInput.tsx               # NEW: Ticker input for new reports
│   ├── VersionBar.tsx                # NEW: Toolbar with version tabs + save/PDF
│   ├── AnimatedNumber.tsx            # NEW: Count-up number hook+component
│   ├── ChartSection.tsx              # NEW: Recharts with draw animation
│   ├── EditorPanel.tsx               # KEEP: v1 editor (used by classic route)
│   ├── PdfExport.tsx                 # KEEP: PDF export (reused)
│   └── templates/                    # KEEP: v1 templates (used by classic route)
│       ├── WarmTemplate.tsx
│       ├── ModernTemplate.tsx
│       └── BoldTemplate.tsx
lib/
├── types.ts                          # MODIFY: Add ReportData, Folder, etc.
├── supabase.ts                       # NEW: Supabase server client
├── market-data.ts                    # NEW: yahoo-finance2 wrapper
├── ai.ts                             # NEW: AI abstraction (claude/gemini switch)
├── ai-claude.ts                      # NEW: Claude CLI spawn wrapper
├── ai-gemini.ts                      # NEW: Gemini SDK wrapper
├── prompts.ts                        # NEW: AI prompt templates
└── data.ts                           # KEEP: v1 sample data (renamed from types export)
```

---

## Task 1: Foundation — Dependencies, Env, Types

**Files:**
- Modify: `package.json`
- Create: `.env.local`
- Modify: `lib/types.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Install new dependencies**

```bash
cd /Volumes/PRO-G40/app-dev/one-pager
npm install @supabase/supabase-js yahoo-finance2 framer-motion @google/generative-ai
```

- [ ] **Step 2: Create `.env.local`**

Create `.env.local` with:
```bash
# Supabase (willow-dash-tensw-todo)
NEXT_PUBLIC_SUPABASE_URL=https://axcfvieqsaphhvbkyzzv.supabase.co
SUPABASE_SECRET_KEY=<copy from willow-invt .env.local>

# AI Provider
AI_PROVIDER=claude
# GEMINI_API_KEY=<only for deployed>
```

Copy the `SUPABASE_SECRET_KEY` value from `/Volumes/PRO-G40/app-dev/willow-invt/.env.local` (the `SUPABASE_SECRET_KEY` or service_role key for `axcfvieqsaphhvbkyzzv`).

- [ ] **Step 3: Add ReportData types to `lib/types.ts`**

Keep existing `OnePagerData` and `SAMPLE_DATA` exports. Add new types after them:

```typescript
// === Report Generator v2 Types ===

export interface ReportHeader {
  companyName: string
  ticker: string
  exchange: string
  sector: string
  currentPrice: number
  marketCap: string
  high52w: number
  gapFromHigh: number
}

export interface ReportValuation {
  pe: number | null
  ps: number | null
  evEbitda: number | null
  peg: number | null
  pbr: number | null
}

export interface ReportGrowth {
  revenueGrowthYoy: number | null
  grossMargin: number | null
  operatingMargin: number | null
  fcfMargin: number | null
}

export interface ReportCharts {
  priceHistory: { date: string; price: number }[]
  revenueTrend: { quarter: string; revenue: number }[]
}

export interface ReportThesis {
  summary: string
  bullPoints: string[]
  bearPoints: string[]
}

export interface ReportVerdict {
  result: 'pass_tier1' | 'pass_tier2' | 'watch' | 'fail'
  reason: string
}

export interface ReportData {
  header: ReportHeader
  valuation: ReportValuation
  growth: ReportGrowth
  charts: ReportCharts
  thesis: ReportThesis
  verdict: ReportVerdict
}

export type ReportSectionKey = keyof ReportData

export interface Report {
  id: string
  title: string
  ticker: string
  folder_id: string | null
  status: 'generating' | 'complete' | 'error'
  data: Partial<ReportData>
  version: number
  created_at: string
  updated_at: string
}

export interface ReportVersion {
  id: string
  report_id: string
  version: number
  data: ReportData
  created_at: string
}

export interface ReportFolder {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
  created_at: string
  children?: ReportFolder[]
}

export interface ChatMessage {
  id: string
  report_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface SectionUpdate {
  section: ReportSectionKey
  data: ReportData[ReportSectionKey]
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json lib/types.ts
git commit -m "feat: add v2 dependencies and report data types"
```

---

## Task 2: Database — Supabase Migration

**Files:**
- Migration applied via Supabase MCP or SQL

- [ ] **Step 1: Apply migration**

Run the following SQL on the `axcfvieqsaphhvbkyzzv` Supabase project (willow-dash-tensw-todo). Use the Supabase MCP `apply_migration` tool or the dashboard SQL editor:

```sql
-- Report folders
create table report_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references report_folders(id) on delete cascade,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Reports
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

-- Auto-update updated_at trigger
create or replace function update_reports_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger reports_updated_at
  before update on reports
  for each row execute function update_reports_updated_at();

-- Report versions
create table report_versions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade not null,
  version int not null,
  data jsonb not null,
  created_at timestamptz default now()
);

-- Report chats
create table report_chats (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Indexes
create index idx_reports_folder on reports(folder_id);
create index idx_reports_ticker on reports(ticker);
create index idx_report_versions_report on report_versions(report_id);
create index idx_report_chats_report on report_chats(report_id);
```

- [ ] **Step 2: Verify tables exist**

Query each table to confirm:
```sql
select count(*) from report_folders;
select count(*) from reports;
select count(*) from report_versions;
select count(*) from report_chats;
```

All should return 0 (empty tables).

- [ ] **Step 3: Commit** (nothing to commit in code if done via MCP/dashboard)

---

## Task 3: Supabase Client + Market Data

**Files:**
- Create: `lib/supabase.ts`
- Create: `lib/market-data.ts`

- [ ] **Step 1: Create Supabase server client**

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}
```

- [ ] **Step 2: Create market data wrapper**

Create `lib/market-data.ts`:

```typescript
import yahooFinance from 'yahoo-finance2'
import type { ReportHeader, ReportValuation, ReportGrowth, ReportCharts } from './types'

export interface MarketData {
  header: ReportHeader
  valuation: ReportValuation
  growth: ReportGrowth
  charts: ReportCharts
}

export async function fetchMarketData(ticker: string): Promise<MarketData> {
  const [quote, chart] = await Promise.all([
    yahooFinance.quoteSummary(ticker, {
      modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'earningsTrend'],
    }),
    yahooFinance.chart(ticker, {
      period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      interval: '1wk',
    }),
  ])

  const price = quote.price
  const summary = quote.summaryDetail
  const keyStats = quote.defaultKeyStatistics
  const financial = quote.financialData

  const header: ReportHeader = {
    companyName: price?.longName ?? price?.shortName ?? ticker,
    ticker: ticker.toUpperCase(),
    exchange: price?.exchangeName ?? '',
    sector: '',  // Will be enriched by AI
    currentPrice: price?.regularMarketPrice ?? 0,
    marketCap: formatMarketCap(price?.marketCap ?? 0),
    high52w: summary?.fiftyTwoWeekHigh ?? 0,
    gapFromHigh: summary?.fiftyTwoWeekHigh
      ? ((price?.regularMarketPrice ?? 0) - summary.fiftyTwoWeekHigh) / summary.fiftyTwoWeekHigh * 100
      : 0,
  }

  const valuation: ReportValuation = {
    pe: summary?.trailingPE ?? keyStats?.trailingPE ?? null,
    ps: keyStats?.priceToSalesTrailing12Months ?? null,
    evEbitda: keyStats?.enterpriseToEbitda ?? null,
    peg: keyStats?.pegRatio ?? null,
    pbr: keyStats?.priceToBook ?? null,
  }

  const growth: ReportGrowth = {
    revenueGrowthYoy: financial?.revenueGrowth ?? null,
    grossMargin: financial?.grossMargins ?? null,
    operatingMargin: financial?.operatingMargins ?? null,
    fcfMargin: financial?.freeCashflow && financial?.totalRevenue
      ? financial.freeCashflow / financial.totalRevenue
      : null,
  }

  const quotes = chart.quotes ?? []
  const priceHistory = quotes
    .filter(q => q.date && q.close)
    .map(q => ({
      date: q.date!.toISOString().split('T')[0],
      price: Math.round(q.close! * 100) / 100,
    }))

  const charts: ReportCharts = {
    priceHistory,
    revenueTrend: [], // Quarterly revenue not available from yahoo-finance2 chart — AI will note this
  }

  return { header, valuation, growth, charts }
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
  return `$${value.toLocaleString()}`
}
```

- [ ] **Step 3: Verify market data fetches**

Create a quick test by running from the project root:
```bash
cd /Volumes/PRO-G40/app-dev/one-pager
npx tsx -e "import { fetchMarketData } from './lib/market-data.ts'; fetchMarketData('AAPL').then(d => console.log(JSON.stringify(d, null, 2))).catch(console.error);"
```

Verify it returns header with companyName, price, marketCap, and valuation metrics.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase.ts lib/market-data.ts
git commit -m "feat: add Supabase client and yahoo-finance2 market data wrapper"
```

---

## Task 4: AI Abstraction Layer

**Files:**
- Create: `lib/prompts.ts`
- Create: `lib/ai-claude.ts`
- Create: `lib/ai-gemini.ts`
- Create: `lib/ai.ts`

- [ ] **Step 1: Create prompt templates**

Create `lib/prompts.ts`:

```typescript
import type { MarketData, } from './market-data'

export function buildReportPrompt(ticker: string, marketData: MarketData, existingResearch?: Record<string, unknown>): string {
  return `You are a stock research analyst. Generate a structured analysis for ${ticker}.

MARKET DATA (pre-fetched, use as-is):
${JSON.stringify(marketData, null, 2)}

${existingResearch ? `PRIOR RESEARCH:\n${JSON.stringify(existingResearch, null, 2)}` : 'No prior research available.'}

Generate analysis in this exact JSON format:
{
  "thesis": {
    "summary": "2-3 sentence investment thesis",
    "bullPoints": ["3-5 bull case points"],
    "bearPoints": ["2-4 bear/risk points"]
  },
  "verdict": {
    "result": "pass_tier1 | pass_tier2 | watch | fail",
    "reason": "1 sentence verdict justification"
  },
  "sectorTag": "Primary sector (e.g. Cybersecurity, Cloud, Fintech)"
}

Rules:
- Be specific to ${ticker}, not generic
- Bull/bear points should reference actual metrics from the market data
- Verdict: pass_tier1 = strong buy, pass_tier2 = buy, watch = monitor, fail = avoid
- Return ONLY valid JSON, no markdown or explanation`
}

export function buildChatPrompt(
  reportData: Record<string, unknown>,
  chatHistory: { role: string; content: string }[],
  userMessage: string
): string {
  return `You are refining a stock research report. Here is the current report data:

${JSON.stringify(reportData, null, 2)}

CONVERSATION HISTORY:
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

USER REQUEST: ${userMessage}

Modify the report based on the user's request. Return ONLY the sections that changed as JSON:
{
  "sections": {
    "sectionKey": { ...updated section data... }
  }
}

Valid section keys: header, valuation, growth, charts, thesis, verdict
Return ONLY valid JSON, no markdown or explanation.`
}
```

- [ ] **Step 2: Create Claude CLI wrapper**

Create `lib/ai-claude.ts`:

```typescript
import { spawn } from 'child_process'

export async function callClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', ['-p', '--model', 'claude-opus-4-6'], {
      env: { ...process.env, PATH: process.env.PATH },
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => { stdout += data.toString() })
    proc.stderr.on('data', (data) => { stderr += data.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`))
      } else {
        resolve(stdout.trim())
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn claude: ${err.message}`))
    })

    proc.stdin.write(prompt)
    proc.stdin.end()

    // 5 minute timeout
    setTimeout(() => {
      proc.kill()
      reject(new Error('Claude CLI timed out after 5 minutes'))
    }, 5 * 60 * 1000)
  })
}
```

- [ ] **Step 3: Create Gemini SDK wrapper**

Create `lib/ai-gemini.ts`:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.1,
    },
  })

  const result = await model.generateContent(prompt)
  return result.response.text()
}
```

- [ ] **Step 4: Create AI abstraction**

Create `lib/ai.ts`:

```typescript
import { callClaude } from './ai-claude'
import { callGemini } from './ai-gemini'
import { buildReportPrompt, buildChatPrompt } from './prompts'
import type { MarketData } from './market-data'
import type { ReportData, ReportThesis, ReportVerdict } from './types'

async function callAI(prompt: string): Promise<string> {
  if (process.env.AI_PROVIDER === 'claude') {
    return callClaude(prompt)
  }
  return callGemini(prompt)
}

function parseJSON(text: string): Record<string, unknown> {
  // Extract JSON from possible markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = jsonMatch ? jsonMatch[1].trim() : text.trim()
  try {
    return JSON.parse(raw)
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${(e as Error).message}\nRaw response: ${raw.slice(0, 500)}`)
  }
}

export async function generateAnalysis(
  ticker: string,
  marketData: MarketData,
  existingResearch?: Record<string, unknown>
): Promise<{ thesis: ReportThesis; verdict: ReportVerdict; sectorTag: string }> {
  const prompt = buildReportPrompt(ticker, marketData, existingResearch)
  const response = await callAI(prompt)
  const parsed = parseJSON(response)

  return {
    thesis: parsed.thesis as ReportThesis,
    verdict: parsed.verdict as ReportVerdict,
    sectorTag: (parsed.sectorTag as string) ?? '',
  }
}

export async function refineReport(
  reportData: Partial<ReportData>,
  chatHistory: { role: string; content: string }[],
  userMessage: string
): Promise<Record<string, unknown>> {
  const prompt = buildChatPrompt(reportData, chatHistory, userMessage)
  const response = await callAI(prompt)
  const parsed = parseJSON(response)
  return (parsed.sections as Record<string, unknown>) ?? parsed
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/prompts.ts lib/ai-claude.ts lib/ai-gemini.ts lib/ai.ts
git commit -m "feat: add AI abstraction layer with Claude CLI and Gemini support"
```

---

## Task 5: Folder & Report CRUD API Routes

**Files:**
- Create: `app/api/folders/route.ts`
- Create: `app/api/folders/[id]/route.ts`
- Create: `app/api/reports/route.ts`
- Create: `app/api/reports/[id]/route.ts`
- Create: `app/api/reports/[id]/save/route.ts`

- [ ] **Step 1: Folder CRUD routes**

Create `app/api/folders/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('report_folders')
    .select('*')
    .order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const sb = getSupabase()
  const { data, error } = await sb
    .from('report_folders')
    .insert({ name: body.name, parent_id: body.parent_id ?? null })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

Create `app/api/folders/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const sb = getSupabase()
  const { data, error } = await sb
    .from('report_folders')
    .update({ name: body.name, parent_id: body.parent_id })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getSupabase()
  const { error } = await sb.from('report_folders').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Report list & single routes**

Create `app/api/reports/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const folderId = req.nextUrl.searchParams.get('folder_id')
  const sb = getSupabase()

  let query = sb.from('reports').select('id, title, ticker, folder_id, status, version, created_at, updated_at').order('updated_at', { ascending: false })

  if (folderId === 'null') {
    query = query.is('folder_id', null)
  } else if (folderId) {
    query = query.eq('folder_id', folderId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

Create `app/api/reports/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getSupabase()

  const [reportRes, chatsRes, versionsRes] = await Promise.all([
    sb.from('reports').select('*').eq('id', id).single(),
    sb.from('report_chats').select('*').eq('report_id', id).order('created_at'),
    sb.from('report_versions').select('id, version, created_at').eq('report_id', id).order('version'),
  ])

  if (reportRes.error) return NextResponse.json({ error: reportRes.error.message }, { status: 500 })

  return NextResponse.json({
    ...reportRes.data,
    chats: chatsRes.data ?? [],
    versions: versionsRes.data ?? [],
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getSupabase()
  const { error } = await sb.from('reports').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Version save route**

Create `app/api/reports/[id]/save/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getSupabase()

  // Get current report
  const { data: report, error: getErr } = await sb.from('reports').select('data, version').eq('id', id).single()
  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 500 })

  const newVersion = report.version + 1

  // Save snapshot + bump version
  const [snapRes, updateRes] = await Promise.all([
    sb.from('report_versions').insert({
      report_id: id,
      version: report.version,
      data: report.data,
    }),
    sb.from('reports').update({ version: newVersion }).eq('id', id),
  ])

  if (snapRes.error) return NextResponse.json({ error: snapRes.error.message }, { status: 500 })
  if (updateRes.error) return NextResponse.json({ error: updateRes.error.message }, { status: 500 })

  return NextResponse.json({ version: newVersion })
}
```

- [ ] **Step 4: Version restore route**

Create `app/api/reports/[id]/restore/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { versionId } = await req.json()
  if (!versionId) return NextResponse.json({ error: 'versionId required' }, { status: 400 })

  const sb = getSupabase()

  // Get the version data
  const { data: ver, error: verErr } = await sb
    .from('report_versions')
    .select('data')
    .eq('id', versionId)
    .eq('report_id', id)
    .single()
  if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 })

  // Overwrite live report data
  const { error: updateErr } = await sb
    .from('reports')
    .update({ data: ver.data })
    .eq('id', id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, data: ver.data })
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/
git commit -m "feat: add folder and report CRUD API routes with version restore"
```

---

## Task 6: Report Generate API (SSE)

**Files:**
- Create: `app/api/reports/generate/route.ts`

- [ ] **Step 1: Create generate route with synthetic SSE**

Create `app/api/reports/generate/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { fetchMarketData } from '@/lib/market-data'
import { generateAnalysis } from '@/lib/ai'
import type { ReportData, SectionUpdate } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { ticker, folderId } = await req.json()
  if (!ticker) return new Response('ticker required', { status: 400 })

  const sb = getSupabase()

  // Create report row with 'generating' status
  const { data: report, error: createErr } = await sb
    .from('reports')
    .insert({
      title: `${ticker.toUpperCase()} Analysis`,
      ticker: ticker.toUpperCase(),
      folder_id: folderId ?? null,
      status: 'generating',
    })
    .select('id')
    .single()

  if (createErr) return new Response(JSON.stringify({ error: createErr.message }), { status: 500 })

  const reportId = report.id

  // SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Send report ID immediately
        send('reportId', { id: reportId })

        // 1. Fetch market data
        const marketData = await fetchMarketData(ticker)

        // 2. Emit market data sections with delays
        const sections: SectionUpdate[] = [
          { section: 'header', data: marketData.header },
          { section: 'valuation', data: marketData.valuation },
          { section: 'growth', data: marketData.growth },
          { section: 'charts', data: marketData.charts },
        ]

        for (const update of sections) {
          send('section', update)
          await delay(200)
        }

        // 3. Check existing research in willow-invt DB
        let existingResearch: Record<string, unknown> | undefined
        try {
          const { data: research } = await sb
            .from('stock_research')
            .select('*')
            .ilike('ticker', ticker)
            .order('scan_date', { ascending: false })
            .limit(1)
            .single()
          if (research) existingResearch = research
        } catch {
          // No existing research, that's fine
        }

        // 4. AI analysis
        const analysis = await generateAnalysis(ticker, marketData, existingResearch)

        // Enrich header with sector from AI
        const enrichedHeader = { ...marketData.header, sector: analysis.sectorTag }
        send('section', { section: 'header', data: enrichedHeader })
        await delay(200)

        send('section', { section: 'thesis', data: analysis.thesis })
        await delay(200)

        send('section', { section: 'verdict', data: analysis.verdict })

        // 5. Save complete report
        const fullData: ReportData = {
          header: enrichedHeader,
          valuation: marketData.valuation,
          growth: marketData.growth,
          charts: marketData.charts,
          thesis: analysis.thesis,
          verdict: analysis.verdict,
        }

        await sb.from('reports').update({ data: fullData, status: 'complete' }).eq('id', reportId)

        send('done', { status: 'complete' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        await sb.from('reports').update({ status: 'error' }).eq('id', reportId)
        send('error', { message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/reports/generate/route.ts
git commit -m "feat: add report generation API with synthetic SSE streaming"
```

---

## Task 7: Chat API

**Files:**
- Create: `app/api/chat/route.ts`

- [ ] **Step 1: Create chat route**

Create `app/api/chat/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { refineReport } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { reportId, message } = await req.json()
  if (!reportId || !message) return NextResponse.json({ error: 'reportId and message required' }, { status: 400 })

  const sb = getSupabase()

  // Get current report data
  const { data: report, error: reportErr } = await sb
    .from('reports')
    .select('data')
    .eq('id', reportId)
    .single()
  if (reportErr) return NextResponse.json({ error: reportErr.message }, { status: 500 })

  // Get last 20 chat messages
  const { data: history } = await sb
    .from('report_chats')
    .select('role, content')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false })
    .limit(20)

  const chatHistory = (history ?? []).reverse()

  // Save user message
  await sb.from('report_chats').insert({ report_id: reportId, role: 'user', content: message })

  // Call AI
  const modifiedSections = await refineReport(report.data, chatHistory, message)

  // Merge modified sections into report data
  const updatedData = { ...report.data }
  for (const [key, value] of Object.entries(modifiedSections)) {
    if (key in updatedData || ['header', 'valuation', 'growth', 'charts', 'thesis', 'verdict'].includes(key)) {
      (updatedData as Record<string, unknown>)[key] = value
    }
  }

  // Save updated report + assistant message
  const assistantMsg = `Updated sections: ${Object.keys(modifiedSections).join(', ')}`
  await Promise.all([
    sb.from('reports').update({ data: updatedData }).eq('id', reportId),
    sb.from('report_chats').insert({ report_id: reportId, role: 'assistant', content: assistantMsg }),
  ])

  return NextResponse.json({
    sections: modifiedSections,
    updatedData,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: add chat refinement API route"
```

---

## Task 8: Move V1 + New Main Layout

> **Note:** This task imports components created in Tasks 9-11. The app will not build/run until those tasks are also complete. Commit anyway — the build will be verified in Task 12.

**Files:**
- Move: `app/page.tsx` → `app/classic/page.tsx`
- Create: `app/page.tsx` (new v2 main page)

- [ ] **Step 1: Move v1 page to /classic**

```bash
cd /Volumes/PRO-G40/app-dev/one-pager
mkdir -p app/classic
```

Copy `app/page.tsx` to `app/classic/page.tsx`. Keep original `app/page.tsx` for now (will be overwritten in next step). The classic page imports stay the same since components are in `app/components/`.

Update the imports in `app/classic/page.tsx` to use relative paths that point up one level:
- `'./components/...'` → `'../components/...'`
- `'@/lib/...'` stays the same

- [ ] **Step 2: Create new v2 main page**

Create `app/page.tsx`:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Report, ReportFolder, ReportData, ChatMessage, SectionUpdate } from '@/lib/types'
import FolderTree from './components/FolderTree'
import ReportView from './components/ReportView'
import TickerInput from './components/TickerInput'
import FloatingChat from './components/FloatingChat'
import VersionBar from './components/VersionBar'

export default function Home() {
  const [folders, setFolders] = useState<ReportFolder[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [activeReport, setActiveReport] = useState<Report | null>(null)
  const [chats, setChats] = useState<ChatMessage[]>([])
  const [versions, setVersions] = useState<{ id: string; version: number; created_at: string }[]>([])
  const [generating, setGenerating] = useState(false)
  const [sectionUpdates, setSectionUpdates] = useState<Map<string, unknown>>(new Map())

  // Load folders and reports
  const loadData = useCallback(async () => {
    const [fRes, rRes] = await Promise.all([
      fetch('/api/folders').then(r => r.json()),
      fetch('/api/reports').then(r => r.json()),
    ])
    setFolders(fRes)
    setReports(rRes)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Load single report
  const loadReport = useCallback(async (id: string) => {
    const res = await fetch(`/api/reports/${id}`)
    const data = await res.json()
    setActiveReport(data)
    setChats(data.chats ?? [])
    setVersions(data.versions ?? [])
    setSectionUpdates(new Map(Object.entries(data.data ?? {})))
  }, [])

  // Generate new report
  const handleGenerate = useCallback(async (ticker: string) => {
    setGenerating(true)
    setSectionUpdates(new Map())
    setActiveReport(null)

    const res = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker }),
    })

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let reportId = ''

    if (reader) {
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        let eventName = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventName = line.slice(7)
          } else if (line.startsWith('data: ') && eventName) {
            const payload = JSON.parse(line.slice(6))

            if (eventName === 'reportId') {
              reportId = payload.id
            } else if (eventName === 'section') {
              const update = payload as SectionUpdate
              setSectionUpdates(prev => new Map(prev).set(update.section, update.data))
            } else if (eventName === 'done') {
              // Reload full report
              if (reportId) await loadReport(reportId)
              await loadData()
            } else if (eventName === 'error') {
              console.error('Generation error:', payload.message)
            }
            eventName = ''
          }
        }
      }
    }

    setGenerating(false)
  }, [loadReport, loadData])

  // Chat send
  const handleChat = useCallback(async (message: string) => {
    if (!activeReport) return

    setChats(prev => [...prev, { id: crypto.randomUUID(), report_id: activeReport.id, role: 'user', content: message, created_at: new Date().toISOString() }])

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: activeReport.id, message }),
    })

    const data = await res.json()

    // Animate updated sections
    for (const [key, value] of Object.entries(data.sections ?? {})) {
      setSectionUpdates(prev => new Map(prev).set(key, value))
    }

    // Update active report data
    setActiveReport(prev => prev ? { ...prev, data: data.updatedData } : null)

    setChats(prev => [...prev, {
      id: crypto.randomUUID(),
      report_id: activeReport.id,
      role: 'assistant',
      content: `Updated sections: ${Object.keys(data.sections ?? {}).join(', ')}`,
      created_at: new Date().toISOString(),
    }])
  }, [activeReport])

  // Save version
  const handleSave = useCallback(async () => {
    if (!activeReport) return
    const res = await fetch(`/api/reports/${activeReport.id}/save`, { method: 'POST' })
    const data = await res.json()
    setActiveReport(prev => prev ? { ...prev, version: data.version } : null)
    // Reload versions list
    await loadReport(activeReport.id)
  }, [activeReport, loadReport])

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <div className="w-56 border-r border-slate-800 flex flex-col">
        <div className="p-3 border-b border-slate-800">
          <TickerInput onGenerate={handleGenerate} generating={generating} />
        </div>
        <FolderTree
          folders={folders}
          reports={reports}
          activeReportId={activeReport?.id ?? null}
          onSelectReport={loadReport}
          onFoldersChange={loadData}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeReport ? (
          <>
            <VersionBar
              report={activeReport}
              versions={versions}
              onSave={handleSave}
              onRestore={async (versionId) => {
                await fetch(`/api/reports/${activeReport.id}/restore`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ versionId })
                })
                const res = await fetch(`/api/reports/${activeReport.id}`)
                const updated = await res.json()
                setActiveReport(updated.report)
                setVersions(updated.versions)
              }}
            />
            <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
              <ReportView
                data={activeReport.data as Partial<ReportData>}
                sectionUpdates={sectionUpdates}
                generating={generating}
              />
            </div>
          </>
        ) : generating ? (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
            <ReportView
              data={{}}
              sectionUpdates={sectionUpdates}
              generating={generating}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-900">
            <div className="text-center text-slate-500">
              <p className="text-lg font-medium">Enter a ticker to generate a report</p>
              <p className="text-sm mt-1">or select an existing report from the sidebar</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating chat */}
      {activeReport && (
        <FloatingChat
          chats={chats}
          onSend={handleChat}
          reportTicker={activeReport.ticker}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx app/classic/
git commit -m "feat: new v2 main page layout, move v1 to /classic"
```

---

## Task 9: Ticker Input + Folder Tree Components

**Files:**
- Create: `app/components/TickerInput.tsx`
- Create: `app/components/FolderTree.tsx`

- [ ] **Step 1: Create TickerInput**

Create `app/components/TickerInput.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

export default function TickerInput({ onGenerate, generating }: {
  onGenerate: (ticker: string) => void
  generating: boolean
}) {
  const [ticker, setTicker] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ticker.trim() && !generating) {
      onGenerate(ticker.trim().toUpperCase())
      setTicker('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1.5">
      <div className="flex-1 relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          placeholder="Ticker..."
          disabled={generating}
          className="w-full pl-7 pr-2 py-1.5 text-xs bg-slate-800 rounded-md text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={!ticker.trim() || generating}
        className="px-2.5 py-1.5 text-xs bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
      >
        {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Go'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create FolderTree**

Create `app/components/FolderTree.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Plus, Trash2 } from 'lucide-react'
import type { ReportFolder, Report } from '@/lib/types'

function buildTree(folders: ReportFolder[]): ReportFolder[] {
  const map = new Map<string, ReportFolder>()
  const roots: ReportFolder[] = []
  folders.forEach(f => map.set(f.id, { ...f, children: [] }))
  map.forEach(f => {
    if (f.parent_id && map.has(f.parent_id)) {
      map.get(f.parent_id)!.children!.push(f)
    } else {
      roots.push(f)
    }
  })
  return roots
}

function FolderNode({ folder, reports, activeReportId, onSelectReport, expanded, toggleExpand }: {
  folder: ReportFolder
  reports: Report[]
  activeReportId: string | null
  onSelectReport: (id: string) => void
  expanded: Set<string>
  toggleExpand: (id: string) => void
}) {
  const isOpen = expanded.has(folder.id)
  const folderReports = reports.filter(r => r.folder_id === folder.id)
  const hasChildren = (folder.children?.length ?? 0) > 0 || folderReports.length > 0

  return (
    <div>
      <button
        onClick={() => toggleExpand(folder.id)}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded"
      >
        {hasChildren ? (
          isOpen ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />
        ) : <span className="w-3" />}
        {isOpen ? <FolderOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> : <Folder className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
        <span className="truncate">{folder.name}</span>
      </button>
      {isOpen && (
        <div className="ml-3">
          {folder.children?.map(child => (
            <FolderNode key={child.id} folder={child} reports={reports} activeReportId={activeReportId} onSelectReport={onSelectReport} expanded={expanded} toggleExpand={toggleExpand} />
          ))}
          {folderReports.map(report => (
            <button
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded truncate ${
                activeReportId === report.id ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{report.ticker}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FolderTree({ folders, reports, activeReportId, onSelectReport, onFoldersChange }: {
  folders: ReportFolder[]
  reports: Report[]
  activeReportId: string | null
  onSelectReport: (id: string) => void
  onFoldersChange: () => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const tree = buildTree(folders)
  const rootReports = reports.filter(r => !r.folder_id)

  const handleAddFolder = async () => {
    if (!newName.trim()) return
    await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setNewName('')
    setAdding(false)
    onFoldersChange()
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Reports</span>
        <button onClick={() => setAdding(!adding)} className="text-slate-500 hover:text-white">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {adding && (
        <div className="px-2 pb-1">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') setAdding(false) }}
            onBlur={() => { if (!newName.trim()) setAdding(false) }}
            placeholder="Folder name..."
            className="w-full px-2 py-1 text-xs bg-slate-800 rounded text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {tree.map(folder => (
        <FolderNode key={folder.id} folder={folder} reports={reports} activeReportId={activeReportId} onSelectReport={onSelectReport} expanded={expanded} toggleExpand={toggleExpand} />
      ))}

      {/* Root-level reports (no folder) */}
      {rootReports.map(report => (
        <button
          key={report.id}
          onClick={() => onSelectReport(report.id)}
          className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded truncate ${
            activeReportId === report.id ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{report.ticker}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/components/TickerInput.tsx app/components/FolderTree.tsx
git commit -m "feat: add TickerInput and FolderTree sidebar components"
```

---

## Task 10: ReportView + ReportSection with Animations

**Files:**
- Create: `app/components/AnimatedNumber.tsx`
- Create: `app/components/ReportSection.tsx`
- Create: `app/components/ChartSection.tsx`
- Create: `app/components/ReportView.tsx`

- [ ] **Step 1: Create AnimatedNumber**

Create `app/components/AnimatedNumber.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'

export default function AnimatedNumber({ value, duration = 800, decimals = 1, suffix = '' }: {
  value: number | null
  duration?: number
  decimals?: number
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === null) return
    const start = performance.now()
    const from = 0
    const to = value

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(from + (to - from) * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])

  if (value === null) return <span className="text-slate-600">N/A</span>
  return <span>{display.toFixed(decimals)}{suffix}</span>
}
```

- [ ] **Step 2: Create ReportSection**

Create `app/components/ReportSection.tsx`:

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

export default function ReportSection({ title, filled, children, className = '' }: {
  title: string
  filled: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">
        {title}
      </div>
      <AnimatePresence mode="wait">
        {filled ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-6 text-center text-xs text-slate-600 bg-slate-800/30 rounded border border-dashed border-slate-700"
          >
            Waiting for data...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 3: Create ChartSection**

Create `app/components/ChartSection.tsx`:

```typescript
'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

export function PriceChart({ data }: { data: { date: string; price: number }[] }) {
  if (!data.length) return <div className="h-32 flex items-center justify-center text-xs text-slate-600">No data</div>

  // Show every 4th label to avoid crowding
  const simplified = data.map((d, i) => ({
    ...d,
    label: i % Math.ceil(data.length / 6) === 0 ? d.date.slice(5) : '',
  }))

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={simplified}>
        <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 8, fill: '#64748b' }} width={40} domain={['auto', 'auto']} />
        <Tooltip contentStyle={{ fontSize: 10, background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }} labelStyle={{ color: '#94a3b8' }} />
        <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function RevenueTrendChart({ data }: { data: { quarter: string; revenue: number }[] }) {
  if (!data.length) return <div className="h-32 flex items-center justify-center text-xs text-slate-600">No quarterly data</div>

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data}>
        <XAxis dataKey="quarter" tick={{ fontSize: 8, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 8, fill: '#64748b' }} width={40} />
        <Tooltip contentStyle={{ fontSize: 10, background: '#1e293b', border: '1px solid #334155', borderRadius: 6 }} />
        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 4: Create ReportView**

Create `app/components/ReportView.tsx`:

```typescript
'use client'

import type { ReportData, ReportHeader, ReportValuation, ReportGrowth, ReportCharts, ReportThesis, ReportVerdict } from '@/lib/types'
import ReportSection from './ReportSection'
import AnimatedNumber from './AnimatedNumber'
import { PriceChart, RevenueTrendChart } from './ChartSection'
import { motion } from 'framer-motion'

function MetricRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{children}</span>
    </div>
  )
}

function VerdictBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    pass_tier1: 'bg-emerald-500/20 text-emerald-400',
    pass_tier2: 'bg-blue-500/20 text-blue-400',
    watch: 'bg-amber-500/20 text-amber-400',
    fail: 'bg-red-500/20 text-red-400',
  }
  const labels: Record<string, string> = {
    pass_tier1: 'PASS — TIER 1',
    pass_tier2: 'PASS — TIER 2',
    watch: 'WATCH',
    fail: 'FAIL',
  }
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colors[result] ?? colors.watch}`}>
      {labels[result] ?? result}
    </span>
  )
}

export default function ReportView({ data, sectionUpdates, generating }: {
  data: Partial<ReportData>
  sectionUpdates: Map<string, unknown>
  generating: boolean
}) {
  // Merge stored data with live section updates
  const header = (sectionUpdates.get('header') ?? data.header) as ReportHeader | undefined
  const valuation = (sectionUpdates.get('valuation') ?? data.valuation) as ReportValuation | undefined
  const growth = (sectionUpdates.get('growth') ?? data.growth) as ReportGrowth | undefined
  const charts = (sectionUpdates.get('charts') ?? data.charts) as ReportCharts | undefined
  const thesis = (sectionUpdates.get('thesis') ?? data.thesis) as ReportThesis | undefined
  const verdict = (sectionUpdates.get('verdict') ?? data.verdict) as ReportVerdict | undefined

  return (
    <div className="max-w-3xl mx-auto space-y-4" id="report-content">
      {/* Header */}
      <ReportSection title="" filled={!!header}>
        {header && (
          <div className="bg-gradient-to-r from-slate-800 to-blue-900/40 rounded-lg p-5">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-white">{header.companyName}</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {header.ticker} &bull; {header.exchange} {header.sector && `&bull; ${header.sector}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">${header.currentPrice?.toLocaleString()}</div>
                <div className="text-xs text-slate-400">MCap {header.marketCap}</div>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-slate-400">
              <span>52W High: ${header.high52w?.toLocaleString()}</span>
              <span className={header.gapFromHigh < 0 ? 'text-red-400' : 'text-emerald-400'}>
                Gap: {header.gapFromHigh?.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </ReportSection>

      {/* Valuation + Growth grid */}
      <div className="grid grid-cols-2 gap-4">
        <ReportSection title="Valuation" filled={!!valuation} className="bg-slate-800/40 p-4">
          {valuation && (
            <div className="space-y-1.5">
              <MetricRow label="P/E"><AnimatedNumber value={valuation.pe} suffix="x" /></MetricRow>
              <MetricRow label="P/S"><AnimatedNumber value={valuation.ps} suffix="x" /></MetricRow>
              <MetricRow label="EV/EBITDA"><AnimatedNumber value={valuation.evEbitda} suffix="x" /></MetricRow>
              <MetricRow label="PEG"><AnimatedNumber value={valuation.peg} suffix="x" /></MetricRow>
              <MetricRow label="P/B"><AnimatedNumber value={valuation.pbr} suffix="x" /></MetricRow>
            </div>
          )}
        </ReportSection>

        <ReportSection title="Growth & Margins" filled={!!growth} className="bg-slate-800/40 p-4">
          {growth && (
            <div className="space-y-1.5">
              <MetricRow label="Revenue Growth">
                <span className={(growth.revenueGrowthYoy ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  <AnimatedNumber value={growth.revenueGrowthYoy ? growth.revenueGrowthYoy * 100 : null} suffix="%" />
                </span>
              </MetricRow>
              <MetricRow label="Gross Margin"><AnimatedNumber value={growth.grossMargin ? growth.grossMargin * 100 : null} suffix="%" /></MetricRow>
              <MetricRow label="Operating Margin"><AnimatedNumber value={growth.operatingMargin ? growth.operatingMargin * 100 : null} suffix="%" /></MetricRow>
              <MetricRow label="FCF Margin"><AnimatedNumber value={growth.fcfMargin ? growth.fcfMargin * 100 : null} suffix="%" /></MetricRow>
            </div>
          )}
        </ReportSection>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <ReportSection title="Price (12M)" filled={!!charts} className="bg-slate-800/40 p-4">
          {charts && <PriceChart data={charts.priceHistory} />}
        </ReportSection>
        <ReportSection title="Revenue Trend" filled={!!charts} className="bg-slate-800/40 p-4">
          {charts && <RevenueTrendChart data={charts.revenueTrend} />}
        </ReportSection>
      </div>

      {/* Thesis */}
      <ReportSection title="Investment Thesis" filled={!!thesis} className="bg-slate-800/40 p-4">
        {thesis && (
          <div className="space-y-3">
            <p className="text-sm text-slate-300 leading-relaxed">{thesis.summary}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-semibold text-emerald-400 uppercase mb-1.5">Bull Case</div>
                <ul className="space-y-1">
                  {thesis.bullPoints.map((p, i) => (
                    <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                      <span className="text-emerald-500 mt-0.5">+</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-red-400 uppercase mb-1.5">Bear Case</div>
                <ul className="space-y-1">
                  {thesis.bearPoints.map((p, i) => (
                    <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                      <span className="text-red-500 mt-0.5">-</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </ReportSection>

      {/* Verdict */}
      <ReportSection title="Verdict" filled={!!verdict} className="bg-slate-800/40 p-4">
        {verdict && (
          <div className="flex items-center gap-3">
            <VerdictBadge result={verdict.result} />
            <span className="text-sm text-slate-300">{verdict.reason}</span>
          </div>
        )}
      </ReportSection>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/components/AnimatedNumber.tsx app/components/ReportSection.tsx app/components/ChartSection.tsx app/components/ReportView.tsx
git commit -m "feat: add ReportView with animated sections, number countup, and charts"
```

---

## Task 11: Floating Chat + Version Bar

**Files:**
- Create: `app/components/FloatingChat.tsx`
- Create: `app/components/VersionBar.tsx`

- [ ] **Step 1: Create FloatingChat**

Create `app/components/FloatingChat.tsx`:

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ChatMessage } from '@/lib/types'

export default function FloatingChat({ chats, onSend, reportTicker }: {
  chats: ChatMessage[]
  onSend: (message: string) => Promise<void>
  reportTicker: string
}) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const msg = input.trim()
    setInput('')
    setSending(true)
    await onSend(msg)
    setSending(false)
  }

  return (
    <>
      {/* Toggle button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-3.5 shadow-lg shadow-blue-600/30"
          >
            <MessageCircle className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-80 h-[480px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 bg-slate-800">
              <div>
                <span className="text-sm font-semibold text-white">Chat</span>
                <span className="text-xs text-slate-400 ml-2">{reportTicker}</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chats.length === 0 && (
                <p className="text-xs text-slate-500 text-center mt-8">
                  Ask to refine the report...
                </p>
              )}
              {chats.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-300 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-700">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Message..."
                  disabled={sending}
                  className="flex-1 px-3 py-2 text-xs bg-slate-800 rounded-lg text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="px-3 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 2: Create VersionBar**

Create `app/components/VersionBar.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Download, Save, RotateCcw } from 'lucide-react'
import type { Report } from '@/lib/types'

export default function VersionBar({ report, versions, onSave, onRestore }: {
  report: Report
  versions: { id: string; version: number; created_at: string }[]
  onSave: () => void
  onRestore: (versionId: string) => void
}) {
  const [viewingVersion, setViewingVersion] = useState<string | null>(null)

  const handlePdf = async () => {
    const el = document.getElementById('report-content')
    if (!el) return
    const { default: html2canvas } = await import('html2canvas-pro')
    const { default: jsPDF } = await import('jspdf')
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0f172a' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const w = pdf.internal.pageSize.getWidth()
    const h = (canvas.height * w) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, w, h)
    pdf.save(`${report.ticker}-report-v${report.version}.pdf`)
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-white">{report.title}</h2>
        <div className="flex items-center gap-1">
          {versions.map(v => (
            <button
              key={v.id}
              onClick={() => setViewingVersion(viewingVersion === v.id ? null : v.id)}
              className={`px-2 py-0.5 text-[10px] rounded ${
                viewingVersion === v.id
                  ? 'bg-amber-600/20 text-amber-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              v{v.version}
            </button>
          ))}
          <span className="px-2 py-0.5 text-[10px] rounded bg-blue-600/20 text-blue-400 font-medium">
            v{report.version} (live)
          </span>
          {viewingVersion && (
            <button
              onClick={() => { onRestore(viewingVersion); setViewingVersion(null) }}
              className="ml-2 flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
            >
              <RotateCcw className="w-3 h-3" /> Restore
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300"
        >
          <Save className="w-3.5 h-3.5" /> Save
        </button>
        <button
          onClick={handlePdf}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded-md text-white"
        >
          <Download className="w-3.5 h-3.5" /> PDF
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/components/FloatingChat.tsx app/components/VersionBar.tsx
git commit -m "feat: add FloatingChat panel and VersionBar toolbar"
```

---

## Task 12: Integration Test + Fix

- [ ] **Step 1: Start dev server and verify the app loads**

```bash
cd /Volumes/PRO-G40/app-dev/one-pager
npm run dev
```

Open http://localhost:3000 in browser. Verify:
- Sidebar with ticker input renders
- Empty state message shows ("Enter a ticker to generate a report")
- No console errors

- [ ] **Step 2: Test folder creation**

In the sidebar, click the `+` button and create a folder named "Test". Verify it appears in the tree.

- [ ] **Step 3: Test report generation**

Type "AAPL" in ticker input and click Go. Verify:
- Report sections appear one by one with fade-in animation
- Numbers count up
- Price chart renders
- Thesis and verdict sections fill in after AI call completes
- Report appears in sidebar

- [ ] **Step 4: Test chat refinement**

Click the floating chat button. Type "밸류에이션을 좀 더 보수적으로 분석해줘". Verify:
- User message appears in chat
- Report sections update (thesis/verdict should change)
- Assistant confirmation appears

- [ ] **Step 5: Test save and PDF**

Click "Save" button. Verify version counter increments. Click "PDF" button and verify a PDF downloads.

- [ ] **Step 6: Fix any issues found during testing**

Fix TypeScript errors, layout issues, API route bugs, etc.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "fix: integration fixes for report generator v2"
```

---

## Task 13: V1 Classic Route Cleanup

**Files:**
- Create: `app/classic/page.tsx`

- [ ] **Step 1: Ensure v1 page works at /classic**

Create `app/classic/page.tsx` with the original v1 page content:

```typescript
'use client'

import { useState, useRef } from 'react'
import { OnePagerData, SAMPLE_DATA } from '@/lib/types'
import dynamic from 'next/dynamic'
import EditorPanel from '../components/EditorPanel'
import PdfExport from '../components/PdfExport'
import { FileText } from 'lucide-react'

const WarmTemplate = dynamic(() => import('../components/templates/WarmTemplate'), { ssr: false })
const ModernTemplate = dynamic(() => import('../components/templates/ModernTemplate'), { ssr: false })
const BoldTemplate = dynamic(() => import('../components/templates/BoldTemplate'), { ssr: false })

function TemplateRenderer({ data }: { data: OnePagerData }) {
  switch (data.template) {
    case 'modern': return <ModernTemplate data={data} />
    case 'bold': return <BoldTemplate data={data} />
    default: return <WarmTemplate data={data} />
  }
}

export default function ClassicPage() {
  const [data, setData] = useState<OnePagerData>(SAMPLE_DATA)
  const previewRef = useRef<HTMLDivElement>(null)

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">One-Pager Generator</h1>
            <p className="text-xs text-gray-500">Edit data on the left, preview on the right</p>
          </div>
        </div>
        <PdfExport targetRef={previewRef} />
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="w-[420px] bg-white border-r border-gray-200 shrink-0 overflow-hidden">
          <EditorPanel data={data} onChange={setData} />
        </div>
        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div className="w-full max-w-[680px]">
            <div ref={previewRef} className="a4-page bg-white shadow-2xl rounded-sm overflow-hidden">
              <TemplateRenderer data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify /classic route loads**

Open http://localhost:3000/classic and verify the original one-pager editor works (warm/modern/bold templates, editor panel, PDF export).

- [ ] **Step 3: Commit**

```bash
git add app/classic/
git commit -m "feat: move v1 one-pager editor to /classic route"
```
