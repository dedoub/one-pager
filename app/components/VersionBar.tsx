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
