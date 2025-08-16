import { useEffect, useRef } from 'react'

interface BidHistoryListProps { bids: any[]; currentUserId?: string | null }
export function BidHistoryList({ bids, currentUserId }: BidHistoryListProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [bids.length])
  return (
    <div ref={ref} className="max-h-72 overflow-auto pr-2 space-y-2 text-sm">
      {bids.length === 0 && (<div className="text-xs text-zinc-500">No bids yet.</div>)}
      {bids.map(b => {
        const mine = currentUserId && (b.userId === currentUserId || b.user_id === currentUserId)
        return (
          <div key={b.id} className={`p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/70 flex items-center justify-between gap-4 ${mine ? 'ring-2 ring-indigo-500' : ''}`}>
            <div className="flex-1">
              <div className="font-medium text-zinc-800 dark:text-zinc-200">${Number(b.amount).toFixed(2)}</div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">{new Date(b.createdAt || b.created_at || Date.now()).toLocaleTimeString()}</div>
            </div>
            {mine && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-medium">YOU</span>}
          </div>
        )
      })}
    </div>
  )
}
