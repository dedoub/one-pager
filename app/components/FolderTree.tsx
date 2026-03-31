'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Plus } from 'lucide-react'
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
