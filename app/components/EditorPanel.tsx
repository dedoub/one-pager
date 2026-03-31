'use client'

import { OnePagerData, BulletPoint, ChartDataPoint, MetricItem } from '@/lib/types'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 py-3 px-1 text-sm font-medium text-gray-700 hover:text-gray-900">
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {title}
      </button>
      {open && <div className="pb-4 space-y-3">{children}</div>}
    </div>
  )
}

function Field({ label, value, onChange, multiline = false, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder}
          className="w-full px-3 py-2 text-sm bg-gray-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition" />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 text-sm bg-gray-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition" />
      )}
    </div>
  )
}

function BulletEditor({ items, onChange, label }: { items: BulletPoint[]; onChange: (items: BulletPoint[]) => void; label: string }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input value={item.text} onChange={e => {
              const next = [...items]; next[i] = { text: e.target.value }; onChange(next)
            }} className="flex-1 px-3 py-1.5 text-sm bg-gray-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none" />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...items, { text: '' }])}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
          <Plus className="w-3.5 h-3.5" /> Add item
        </button>
      </div>
    </div>
  )
}

function MetricEditor({ items, onChange }: { items: MetricItem[]; onChange: (items: MetricItem[]) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">Key Metrics (max 4)</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input value={item.label} onChange={e => {
              const next = [...items]; next[i] = { ...next[i], label: e.target.value }; onChange(next)
            }} placeholder="Label" className="flex-1 px-3 py-1.5 text-sm bg-gray-50 rounded-lg outline-none" />
            <input value={item.value} onChange={e => {
              const next = [...items]; next[i] = { ...next[i], value: e.target.value }; onChange(next)
            }} placeholder="Value" className="w-20 px-3 py-1.5 text-sm bg-gray-50 rounded-lg outline-none" />
            <input value={item.suffix || ''} onChange={e => {
              const next = [...items]; next[i] = { ...next[i], suffix: e.target.value }; onChange(next)
            }} placeholder="%" className="w-12 px-2 py-1.5 text-sm bg-gray-50 rounded-lg outline-none" />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {items.length < 4 && (
          <button onClick={() => onChange([...items, { label: '', value: '' }])}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
            <Plus className="w-3.5 h-3.5" /> Add metric
          </button>
        )}
      </div>
    </div>
  )
}

function ChartEditor({ items, onChange, label }: { items: ChartDataPoint[]; onChange: (items: ChartDataPoint[]) => void; label: string }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input value={item.name} onChange={e => {
              const next = [...items]; next[i] = { ...next[i], name: e.target.value }; onChange(next)
            }} placeholder="Label" className="flex-1 px-3 py-1.5 text-sm bg-gray-50 rounded-lg outline-none" />
            <input type="number" value={item.value} onChange={e => {
              const next = [...items]; next[i] = { ...next[i], value: Number(e.target.value) }; onChange(next)
            }} placeholder="0" className="w-20 px-3 py-1.5 text-sm bg-gray-50 rounded-lg outline-none" />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...items, { name: '', value: 0 }])}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
          <Plus className="w-3.5 h-3.5" /> Add data point
        </button>
      </div>
    </div>
  )
}

export default function EditorPanel({ data, onChange }: { data: OnePagerData; onChange: (data: OnePagerData) => void }) {
  const update = <K extends keyof OnePagerData>(key: K, value: OnePagerData[K]) => {
    onChange({ ...data, [key]: value })
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-0">
      {/* Template selector */}
      <div className="pb-4 border-b border-gray-200">
        <label className="text-xs text-gray-500 mb-2 block">Template</label>
        <div className="grid grid-cols-3 gap-2">
          {(['warm', 'modern', 'bold'] as const).map(t => (
            <button key={t} onClick={() => update('template', t)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                data.template === t
                  ? t === 'warm' ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                  : t === 'modern' ? 'bg-indigo-100 text-indigo-800 ring-2 ring-indigo-300'
                  : 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Section title="Header" defaultOpen>
        <Field label="Company Name" value={data.companyName} onChange={v => update('companyName', v)} />
        <Field label="Headline" value={data.headline} onChange={v => update('headline', v)} />
        <Field label="Highlight Number" value={data.highlightNumber} onChange={v => update('highlightNumber', v)} placeholder="25%" />
        <Field label="Subtitle" value={data.subtitle} onChange={v => update('subtitle', v)} />
      </Section>

      <Section title="Content — Left Column">
        <Field label="Introduction" value={data.introText} onChange={v => update('introText', v)} multiline />
        <Field label="Objectives Section Title" value={data.objectivesTitle} onChange={v => update('objectivesTitle', v)} />
        <BulletEditor items={data.objectives} onChange={v => update('objectives', v)} label="Objectives" />
        <Field label="Solution Section Title" value={data.solutionTitle} onChange={v => update('solutionTitle', v)} />
        <Field label="Solution Text" value={data.solutionText} onChange={v => update('solutionText', v)} multiline />
        <Field label="Results Section Title" value={data.resultsTitle} onChange={v => update('resultsTitle', v)} />
        <BulletEditor items={data.results} onChange={v => update('results', v)} label="Results" />
      </Section>

      <Section title="Data — Right Column">
        <MetricEditor items={data.metrics} onChange={v => update('metrics', v)} />
        <Field label="Chart 1 Title" value={data.chartTitle} onChange={v => update('chartTitle', v)} />
        <ChartEditor items={data.chartData} onChange={v => update('chartData', v)} label="Chart 1 Data" />
        <Field label="Chart 2 Title" value={data.chart2Title} onChange={v => update('chart2Title', v)} />
        <ChartEditor items={data.chart2Data} onChange={v => update('chart2Data', v)} label="Chart 2 Data" />
      </Section>

      <Section title="Conclusion">
        <Field label="Title" value={data.conclusionTitle} onChange={v => update('conclusionTitle', v)} />
        <Field label="Text" value={data.conclusionText} onChange={v => update('conclusionText', v)} multiline />
      </Section>
    </div>
  )
}
