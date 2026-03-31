'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

export default function TickerInput({ onGenerate, generating }: {
  onGenerate: (ticker: string) => void
  generating: boolean
}) {
  const [ticker, setTicker] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ticker.trim() && !generating) {
      onGenerate(ticker.trim().toUpperCase())
      setTicker('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1.5">
      <div className="flex-1 relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          placeholder="Ticker..."
          disabled={generating}
          className="w-full pl-7 pr-2 py-1.5 text-xs bg-slate-800 rounded-md text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={!ticker.trim() || generating}
        className="px-2.5 py-1.5 text-xs bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
      >
        {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Go'}
      </button>
    </form>
  )
}
