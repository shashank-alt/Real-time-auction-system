import { useEffect, useState } from 'react'

export function Timer({ endsAt, warnSeconds = 30 }: { endsAt: string | number | Date; warnSeconds?: number }) {
  const [left, setLeft] = useState<number>(() => new Date(endsAt).getTime() - Date.now())
  useEffect(() => {
    const id = setInterval(() => setLeft(new Date(endsAt).getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [endsAt])
  if (left <= 0) return <span className="font-semibold text-red-600">Ended</span>
  const h = Math.floor(left / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  const s = Math.floor((left % 60000) / 1000)
  const warn = left / 1000 <= warnSeconds
  return (
    <span className={`tabular-nums font-semibold ${warn ? 'text-amber-600 animate-pulse' : 'text-zinc-700 dark:text-zinc-200'}`}>{h}h {m}m {s}s</span>
  )
}
