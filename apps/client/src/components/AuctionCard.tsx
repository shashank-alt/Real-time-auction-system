import { useState, useEffect } from 'react'
import { useCountdown } from '../hooks/useCountdown'
import { api } from '../lib/net'

export function AuctionCard({ a, placeBid }: { a: any; placeBid: (id: string, amount: number) => Promise<void> }) {
  const { h, m, s, done } = useCountdown(a.endsAt)
  const [custom, setCustom] = useState<string>('')
  const status = String(a.status || '').toLowerCase()
  const isClosed = status === 'closed'
  const isEnded = status === 'ended' || done
  const badge = isClosed ? { text: 'Sold', cls: 'bg-purple-100 text-purple-700' }
    : isEnded ? { text: 'Ended', cls: 'bg-red-100 text-red-700' }
    : { text: 'Live', cls: 'bg-green-100 text-green-700' }
  const [winnerAmt, setWinnerAmt] = useState<number | null>(null)
  useEffect(() => {
    let ignore = false
    async function fetchWinner() {
      try {
        if (isClosed || isEnded) {
          const res = await fetch(api(`/api/auctions/${a.id}/winner`))
          if (res.ok) {
            const w = await res.json()
            if (!ignore) setWinnerAmt(Number(w.amount))
          }
        } else {
          setWinnerAmt(null)
        }
      } catch {}
    }
    fetchWinner()
    return () => { ignore = true }
  }, [a.id, isClosed, isEnded])
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">{a.title}</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${badge.cls}`}>{badge.text}</div>
        </div>
        {a.description && (
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">{a.description}</p>
        )}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">{isClosed ? 'Final Price' : 'Current Bid'}</span>
            <span className="text-2xl font-bold text-slate-900">
              ${Number(a.currentPrice).toFixed(2)}
            </span>
          </div>
          {(!isEnded && !isClosed) && (
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-2">Ends in {h}h {m}m {s}s</div>
              <div className="flex gap-2 items-center">
                <button onClick={() => placeBid(a.id, Number(a.currentPrice) + 1)} className="flex-1 bg-indigo-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm">+$1</button>
                <button onClick={() => placeBid(a.id, Number(a.currentPrice) + 5)} className="flex-1 bg-indigo-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm">+$5</button>
                <input type="number" min={Number(a.currentPrice) + Number(a.bidIncrement || 1)} step={1} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={`$${(Number(a.currentPrice) + Number(a.bidIncrement || 1)).toFixed(2)}`} className="w-28 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
                <button onClick={() => { const v = Number(custom); if (!isNaN(v) && v > 0) placeBid(a.id, v) }} className="px-3 py-2 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors text-sm">Bid</button>
              </div>
            </div>
          )}
          {isEnded && !isClosed && (<div className="text-center text-sm text-slate-600">Auction ended. Awaiting seller decision.</div>)}
          {isClosed && (<div className="text-center text-sm text-purple-700 font-medium">Sold! {winnerAmt ? `Winner paid $${winnerAmt.toFixed(2)}` : 'Finalized.'}</div>)}
        </div>
      </div>
    </div>
  )
}
