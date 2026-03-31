'use client'

import { Download, Save, RotateCcw, Eye, Layout } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { Report } from '@/lib/types'
import { TEMPLATES, type TemplateId } from './templates/shared'

export default function VersionBar({ report, versions, onSave, onRestore, onViewVersion, viewingVersionId, template, onTemplateChange }: {
  report: Report
  versions: { id: string; version: number; data?: Record<string, unknown>; created_at: string }[]
  onSave: () => void
  onRestore: (versionId: string) => void
  onViewVersion: (versionId: string | null) => void
  viewingVersionId: string | null
  template: TemplateId
  onTemplateChange: (t: TemplateId) => void
}) {
  const [showTemplates, setShowTemplates] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowTemplates(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handlePdf = async () => {
    const el = document.getElementById('report-content')
    if (!el) return
    const { default: html2canvas } = await import('html2canvas-pro')
    const { default: jsPDF } = await import('jspdf')
    const bgColor = template === 'newspaper' ? '#faf8f3' : template === 'executive' ? '#ffffff' : '#1c1917'
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: bgColor })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const w = pdf.internal.pageSize.getWidth()
    const h = (canvas.height * w) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, w, h)
    pdf.save(`${report.ticker}-report-v${report.version}.pdf`)
  }

  return (
    <div className="flex items-center justify-between px-4 h-[41px] border-b border-stone-700 bg-stone-900">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-white">{report.title}</h2>
        <div className="flex items-center gap-1">
          {versions.map(v => (
            <button
              key={v.id}
              onClick={() => onViewVersion(viewingVersionId === v.id ? null : v.id)}
              className={`px-2 py-0.5 text-[10px] rounded ${
                viewingVersionId === v.id ? 'bg-amber-600/20 text-amber-400' : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              v{v.version}
            </button>
          ))}
          <button
            onClick={() => onViewVersion(null)}
            className={`px-2 py-0.5 text-[10px] rounded font-medium ${
              !viewingVersionId ? 'bg-blue-600/20 text-blue-400' : 'bg-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            v{report.version} (live)
          </button>
          {viewingVersionId && (
            <button
              onClick={() => { onRestore(viewingVersionId) }}
              className="ml-2 flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
            >
              <RotateCcw className="w-3 h-3" /> Restore
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {viewingVersionId && (
          <span className="flex items-center gap-1 px-3 py-1.5 text-xs text-amber-400">
            <Eye className="w-3.5 h-3.5" /> Read-only
          </span>
        )}

        {/* Template Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-stone-800 hover:bg-stone-700 rounded-md text-stone-300"
          >
            <Layout className="w-3.5 h-3.5" />
            {TEMPLATES.find(t => t.id === template)?.label}
          </button>
          {showTemplates && (
            <div className="absolute right-0 top-full mt-1 bg-stone-800 rounded-md py-1 shadow-xl border border-stone-600 z-50 min-w-[120px]">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onTemplateChange(t.id); setShowTemplates(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stone-700 ${
                    template === t.id ? 'text-blue-400' : 'text-stone-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onSave}
          disabled={!!viewingVersionId}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-stone-800 hover:bg-slate-700 rounded-md text-stone-300 disabled:opacity-40"
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
