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
    <div className={className}>
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
            className="py-4 text-center text-[10px] text-stone-400 italic font-serif"
          >
            Awaiting data...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
