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
