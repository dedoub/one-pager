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
