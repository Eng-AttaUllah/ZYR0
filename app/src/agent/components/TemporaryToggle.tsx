'use client'

import { Ghost } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Temporary-chat switch (ChatGPT-style): while it is on, nothing written in
 * the conversation is persisted to `agent_researches` / `agent_messages`, so
 * the run never appears in the sidebar history.
 */
export function TemporaryToggle({
  active,
  onToggle,
  className,
}: {
  active: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title="Temporary chat — messages are never saved to your history"
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95',
        active
          ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
          : 'border-white/10 bg-[#1a1a1e]/60 text-[#6a6a6f] hover:text-white hover:bg-white/5',
        className
      )}
    >
      <Ghost className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">Temporary</span>
    </button>
  )
}
