'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Report, ReportFolder, ReportData, ChatMessage, SectionUpdate } from '@/lib/types'
import type { TemplateId } from './components/templates/shared'
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
  const [versions, setVersions] = useState<{ id: string; version: number; data: Record<string, unknown>; created_at: string }[]>([])
  const [generating, setGenerating] = useState(false)
  const [sectionUpdates, setSectionUpdates] = useState<Map<string, unknown>>(new Map())
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null)
  const [viewingVersionData, setViewingVersionData] = useState<Partial<ReportData> | null>(null)
  const [template, setTemplate] = useState<TemplateId>('newspaper')

  const loadData = useCallback(async () => {
    const [fRes, rRes] = await Promise.all([
      fetch('/api/folders').then(r => r.json()),
      fetch('/api/reports').then(r => r.json()),
    ])
    setFolders(fRes)
    setReports(rRes)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const loadReport = useCallback(async (id: string) => {
    const res = await fetch(`/api/reports/${id}`)
    const data = await res.json()
    setActiveReport(data)
    setChats(data.chats ?? [])
    setVersions(data.versions ?? [])
    setSectionUpdates(new Map(Object.entries(data.data ?? {})))
  }, [])

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
      let eventName = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

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

  const handleChat = useCallback(async (message: string) => {
    if (!activeReport) return

    setChats(prev => [...prev, { id: crypto.randomUUID(), report_id: activeReport.id, role: 'user', content: message, created_at: new Date().toISOString() }])

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: activeReport.id, message }),
    })

    const data = await res.json()

    if (!res.ok) {
      setChats(prev => [...prev, {
        id: crypto.randomUUID(),
        report_id: activeReport.id,
        role: 'assistant',
        content: `Error: ${data.error ?? 'Failed to process message'}`,
        created_at: new Date().toISOString(),
      }])
      return
    }

    for (const [key, value] of Object.entries(data.sections ?? {})) {
      setSectionUpdates(prev => new Map(prev).set(key, value))
    }

    setActiveReport(prev => prev ? { ...prev, data: data.updatedData } : null)

    setChats(prev => [...prev, {
      id: crypto.randomUUID(),
      report_id: activeReport.id,
      role: 'assistant',
      content: data.message ?? `Updated sections: ${Object.keys(data.sections ?? {}).join(', ')}`,
      created_at: new Date().toISOString(),
    }])
  }, [activeReport])

  const handleSave = useCallback(async () => {
    if (!activeReport) return
    const res = await fetch(`/api/reports/${activeReport.id}/save`, { method: 'POST' })
    const data = await res.json()
    setActiveReport(prev => prev ? { ...prev, version: data.version } : null)
    await loadReport(activeReport.id)
  }, [activeReport, loadReport])

  return (
    <div className="flex h-screen bg-stone-900 text-white">
      {/* Sidebar */}
      <div className="w-56 border-r border-stone-700 flex flex-col bg-stone-900">
        <div className="h-[41px] flex items-center px-3 border-b border-stone-700">
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
              viewingVersionId={viewingVersionId}
              template={template}
              onTemplateChange={setTemplate}
              onViewVersion={(versionId) => {
                if (!versionId) {
                  setViewingVersionId(null)
                  setViewingVersionData(null)
                  return
                }
                setViewingVersionId(versionId)
                const ver = versions.find(v => v.id === versionId)
                if (ver?.data) {
                  setViewingVersionData(ver.data as Partial<ReportData>)
                }
              }}
              onRestore={async (versionId) => {
                await fetch(`/api/reports/${activeReport.id}/restore`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ versionId })
                })
                const res = await fetch(`/api/reports/${activeReport.id}`)
                const updated = await res.json()
                setActiveReport(updated)
                setVersions(updated.versions ?? [])
                setSectionUpdates(new Map(Object.entries(updated.data ?? {})))
                setViewingVersionId(null)
                setViewingVersionData(null)
              }}
            />
            <div className="flex-1 overflow-y-auto p-6 bg-stone-800">
              <ReportView
                data={viewingVersionData ?? activeReport.data as Partial<ReportData>}
                sectionUpdates={viewingVersionId ? new Map() : sectionUpdates}
                generating={generating}
                template={template}
              />
            </div>
          </>
        ) : generating ? (
          <div className="flex-1 overflow-y-auto p-6 bg-stone-800">
            <ReportView
              data={{}}
              sectionUpdates={sectionUpdates}
              generating={generating}
              template={template}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-stone-800">
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
