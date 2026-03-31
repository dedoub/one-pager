'use client'

import type { ReportData } from '@/lib/types'
import type { TemplateId } from './templates/shared'
import NewspaperTemplate from './templates/NewspaperTemplate'
import ModernTemplate from './templates/ModernTemplate'
import ExecutiveTemplate from './templates/ExecutiveTemplate'
import CompactTemplate from './templates/CompactTemplate'

const templateMap = {
  newspaper: NewspaperTemplate,
  modern: ModernTemplate,
  executive: ExecutiveTemplate,
  compact: CompactTemplate,
} as const

export default function ReportView({ data, sectionUpdates, generating, template = 'newspaper' }: {
  data: Partial<ReportData>
  sectionUpdates: Map<string, unknown>
  generating: boolean
  template?: TemplateId
}) {
  const Template = templateMap[template]
  return <Template data={data} sectionUpdates={sectionUpdates} generating={generating} />
}
