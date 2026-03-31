'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Plus, MoreHorizontal } from 'lucide-react'
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

// Context menu for folders and reports
function ContextMenu({ x, y, items, onClose }: {
  x: number
  y: number
  items: { label: string; onClick: () => void; danger?: boolean }[]
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[140px] bg-stone-800 rounded-md py-1 shadow-xl border border-stone-600"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose() }}
          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stone-700 ${
            item.danger ? 'text-red-400' : 'text-stone-300'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

// Inline rename input
function RenameInput({ defaultValue, onSubmit, onCancel }: {
  defaultValue: string
  onSubmit: (name: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(defaultValue)
  return (
    <input
      autoFocus
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter' && value.trim()) onSubmit(value.trim())
        if (e.key === 'Escape') onCancel()
      }}
      onBlur={() => { if (value.trim()) onSubmit(value.trim()); else onCancel() }}
      className="w-full px-1 py-0.5 text-xs bg-stone-700 rounded text-white outline-none"
    />
  )
}

// Draggable report item
function DraggableReport({ report, activeReportId, onSelectReport, onContextMenu }: {
  report: Report
  activeReportId: string | null
  onSelectReport: (id: string) => void
  onContextMenu: (e: React.MouseEvent, reportId: string) => void
}) {
  return (
    <button
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('reportId', report.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={() => onSelectReport(report.id)}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, report.id) }}
      className={`w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded truncate cursor-grab active:cursor-grabbing ${
        activeReportId === report.id ? 'bg-blue-600/20 text-blue-400' : 'text-stone-400 hover:text-white hover:bg-stone-800'
      }`}
    >
      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate flex-1">{report.ticker}</span>
    </button>
  )
}

function FolderNode({ folder, reports, allFolders, activeReportId, onSelectReport, expanded, toggleExpand, onRefresh, onMoveReport }: {
  folder: ReportFolder
  reports: Report[]
  allFolders: ReportFolder[]
  activeReportId: string | null
  onSelectReport: (id: string) => void
  expanded: Set<string>
  toggleExpand: (id: string) => void
  onRefresh: () => void
  onMoveReport: (reportId: string, folderId: string | null) => void
}) {
  const isOpen = expanded.has(folder.id)
  const folderReports = reports.filter(r => r.folder_id === folder.id)
  const hasChildren = (folder.children?.length ?? 0) > 0 || folderReports.length > 0
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [addingSubfolder, setAddingSubfolder] = useState(false)
  const [reportMenu, setReportMenu] = useState<{ x: number; y: number; reportId: string } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleRename = async (name: string) => {
    await fetch(`/api/folders/${folder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setRenaming(false)
    onRefresh()
  }

  const handleDelete = async () => {
    await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' })
    onRefresh()
  }

  const handleAddSubfolder = async (name: string) => {
    await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId: folder.id }),
    })
    setAddingSubfolder(false)
    toggleExpand(folder.id)
    onRefresh()
  }

  const folderMenuItems = [
    { label: 'Rename', onClick: () => setRenaming(true) },
    { label: 'New Subfolder', onClick: () => { setAddingSubfolder(true); if (!isOpen) toggleExpand(folder.id) } },
    { label: 'Delete', onClick: handleDelete, danger: true },
  ]

  const buildReportMenuItems = (reportId: string) => {
    const items: { label: string; onClick: () => void; danger?: boolean }[] = []
    items.push({ label: 'Move to Root', onClick: () => onMoveReport(reportId, null) })
    allFolders
      .filter(f => f.id !== folder.id)
      .forEach(f => {
        items.push({ label: `Move to ${f.name}`, onClick: () => onMoveReport(reportId, f.id) })
      })
    items.push({ label: 'Delete Report', onClick: async () => {
      await fetch(`/api/reports/${reportId}`, { method: 'DELETE' })
      onRefresh()
    }, danger: true })
    return items
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const reportId = e.dataTransfer.getData('reportId')
    if (reportId) onMoveReport(reportId, folder.id)
  }

  return (
    <div>
      <div
        className={`group w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
          dragOver
            ? 'bg-blue-600/20 text-blue-400'
            : 'text-stone-400 hover:text-white hover:bg-stone-800'
        }`}
        onClick={() => toggleExpand(folder.id)}
        onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }) }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasChildren ? (
          isOpen ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />
        ) : <span className="w-3" />}
        {isOpen ? <FolderOpen className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /> : <Folder className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />}
        {renaming ? (
          <RenameInput defaultValue={folder.name} onSubmit={handleRename} onCancel={() => setRenaming(false)} />
        ) : (
          <span className="truncate flex-1">{folder.name}</span>
        )}
        <button
          onClick={e => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY }) }}
          className="hidden group-hover:block text-stone-500 hover:text-white flex-shrink-0"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={folderMenuItems} onClose={() => setContextMenu(null)} />
      )}

      {isOpen && (
        <div className="ml-3">
          {addingSubfolder && (
            <div className="px-2 py-0.5">
              <RenameInput defaultValue="" onSubmit={handleAddSubfolder} onCancel={() => setAddingSubfolder(false)} />
            </div>
          )}
          {folder.children?.map(child => (
            <FolderNode key={child.id} folder={child} reports={reports} allFolders={allFolders} activeReportId={activeReportId} onSelectReport={onSelectReport} expanded={expanded} toggleExpand={toggleExpand} onRefresh={onRefresh} onMoveReport={onMoveReport} />
          ))}
          {folderReports.map(report => (
            <div key={report.id} className="group relative">
              <DraggableReport
                report={report}
                activeReportId={activeReportId}
                onSelectReport={onSelectReport}
                onContextMenu={(e, id) => setReportMenu({ x: e.clientX, y: e.clientY, reportId: id })}
              />
              {reportMenu?.reportId === report.id && (
                <ContextMenu x={reportMenu.x} y={reportMenu.y} items={buildReportMenuItems(report.id)} onClose={() => setReportMenu(null)} />
              )}
            </div>
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
  const [rootReportMenu, setRootReportMenu] = useState<{ x: number; y: number; reportId: string } | null>(null)
  const [rootDragOver, setRootDragOver] = useState(false)

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

  const handleMoveReport = async (reportId: string, targetFolderId: string | null) => {
    await fetch(`/api/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: targetFolderId }),
    })
    onFoldersChange()
  }

  const buildRootReportMenu = (reportId: string) => {
    const items: { label: string; onClick: () => void; danger?: boolean }[] = []
    folders.forEach(f => {
      items.push({ label: `Move to ${f.name}`, onClick: () => handleMoveReport(reportId, f.id) })
    })
    items.push({ label: 'Delete Report', onClick: async () => {
      await fetch(`/api/reports/${reportId}`, { method: 'DELETE' })
      onFoldersChange()
    }, danger: true })
    return items
  }

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setRootDragOver(true)
  }

  const handleRootDragLeave = () => setRootDragOver(false)

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setRootDragOver(false)
    const reportId = e.dataTransfer.getData('reportId')
    if (reportId) handleMoveReport(reportId, null)
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Reports</span>
        <button onClick={() => setAdding(!adding)} className="text-stone-500 hover:text-white">
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
            className="w-full px-2 py-1 text-xs bg-stone-800 rounded text-white placeholder-stone-500 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {tree.map(folder => (
        <FolderNode key={folder.id} folder={folder} reports={reports} allFolders={folders} activeReportId={activeReportId} onSelectReport={onSelectReport} expanded={expanded} toggleExpand={toggleExpand} onRefresh={onFoldersChange} onMoveReport={handleMoveReport} />
      ))}

      {/* Root drop zone - drop here to move report out of folder */}
      <div
        className={`min-h-[24px] rounded transition-colors ${rootDragOver ? 'bg-blue-600/10 border border-dashed border-blue-500/40' : ''}`}
        onDragOver={handleRootDragOver}
        onDragLeave={handleRootDragLeave}
        onDrop={handleRootDrop}
      >
        {rootDragOver && (
          <p className="text-[10px] text-blue-400 text-center py-1">Drop to root</p>
        )}
      </div>

      {rootReports.map(report => (
        <div key={report.id} className="group relative">
          <DraggableReport
            report={report}
            activeReportId={activeReportId}
            onSelectReport={onSelectReport}
            onContextMenu={(e, id) => setRootReportMenu({ x: e.clientX, y: e.clientY, reportId: id })}
          />
          {rootReportMenu?.reportId === report.id && (
            <ContextMenu x={rootReportMenu.x} y={rootReportMenu.y} items={buildRootReportMenu(report.id)} onClose={() => setRootReportMenu(null)} />
          )}
        </div>
      ))}
    </div>
  )
}
