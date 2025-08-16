import { useState, useEffect, useRef } from 'react'
import { useCountdown } from '../hooks/useCountdown'
import { api } from '../lib/net'

interface AuctionCardProps { a: any; placeBid: (id: string, amount: number) => Promise<void>; currentUserId?: string | null; onOpen?: (id: string) => void; key?: string }
export function AuctionCard({ a, placeBid, currentUserId, onOpen }: AuctionCardProps) {
  const { h, m, s, done } = useCountdown(a.endsAt)
  const [custom, setCustom] = useState<string>('')
  const status = String(a.status || '').toLowerCase()
  const isClosed = status === 'closed'
  const isEnded = status === 'ended' || done
  const badge = isClosed ? { text: 'Sold', cls: 'bg-purple-100 text-purple-700' }
    : isEnded ? { text: 'Ended', cls: 'bg-red-100 text-red-700' }
    : { text: 'Live', cls: 'bg-green-100 text-green-700' }
  const [winnerAmt, setWinnerAmt] = useState<number | null>(null)
  const priceRef = useRef(Number(a.currentPrice))
  const [flash, setFlash] = useState(false)
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
  useEffect(() => {
    if (Number(a.currentPrice) !== priceRef.current) {
      priceRef.current = Number(a.currentPrice)
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 600)
      return () => clearTimeout(t)
    }
  }, [a.currentPrice])
  return (
    <div className="group bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-slate-200 dark:border-zinc-700 overflow-hidden hover:shadow-xl transition-all">
      <div className="relative">
        {/* Image / Placeholder */}
        <div className="h-40 w-full bg-gradient-to-br from-indigo-200 via-fuchsia-200 to-pink-100 dark:from-indigo-700/30 dark:via-fuchsia-700/20 dark:to-pink-700/10 flex items-center justify-center text-4xl font-bold text-indigo-600 dark:text-indigo-300 select-none">
          {a.imageUrl ? (
            <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover" />
          ) : (
            <span>{(a.title || '?')[0]?.toUpperCase()}</span>
          )}
          <div className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur bg-white/80 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-700 ${badge.cls}">{badge.text}</div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2 pr-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => onOpen?.(a.id)} title="Open auction room">{a.title}</h3>
          <button onClick={() => onOpen?.(a.id)} className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300">Open</button>
        </div>
        {a.description && (
          <p className="text-slate-600 dark:text-zinc-400 text-sm mb-2 line-clamp-2">{a.description}</p>
        )}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-400">{isClosed ? 'Final Price' : 'Current Bid'}</span>
            <span className={`text-2xl font-bold text-slate-900 dark:text-white tabular-nums ${flash ? 'animate-pulse scale-105 transition-transform' : ''}`}>
              ${Number(a.currentPrice).toFixed(2)}
            </span>
          </div>
          {(!isEnded && !isClosed && currentUserId !== a.sellerId) && (
            <div className="text-center">
              <div className="text-sm text-slate-600 dark:text-zinc-400 mb-2">Ends in {h}h {m}m {s}s</div>
              <div className="flex gap-2 items-center">
                <button onClick={() => placeBid(a.id, Number(a.currentPrice) + 1)} className="flex-1 bg-indigo-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">+$1</button>
                <button onClick={() => placeBid(a.id, Number(a.currentPrice) + 5)} className="flex-1 bg-indigo-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">+$5</button>
                <input type="number" min={Number(a.currentPrice) + Number(a.bidIncrement || 1)} step={1} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={`$${(Number(a.currentPrice) + Number(a.bidIncrement || 1)).toFixed(2)}`} className="w-24 px-3 py-2 border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
                <button onClick={() => { const v = Number(custom); if (!isNaN(v) && v > 0) placeBid(a.id, v) }} className="px-3 py-2 border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 rounded-lg font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">Bid</button>
              </div>
            </div>
          )}
          {isEnded && !isClosed && (<div className="text-center text-sm text-slate-600">Auction ended. Awaiting seller decision.</div>)}
          {(!isEnded && !isClosed && currentUserId === a.sellerId) && (
            <div className="text-center text-xs text-amber-600 font-medium">Seller view – bidding disabled.</div>
          )}
          {isClosed && (<div className="text-center text-sm text-purple-700 dark:text-purple-400 font-medium">Sold! {winnerAmt ? `Winner paid $${winnerAmt.toFixed(2)}` : 'Finalized.'}</div>)}
        </div>
      </div>
    </div>
  )
}
