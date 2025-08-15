import { useContext, useMemo } from 'react'
import { TimeContext } from '../providers/TimeProvider'

export function useCountdown(targetIso: string) {
  const now = useContext(TimeContext)
  const ends = useMemo(() => new Date(targetIso).getTime(), [targetIso])
  const ms = Math.max(0, ends - now)
  const s = Math.floor(ms / 1000) % 60
  const m = Math.floor(ms / 1000 / 60) % 60
  const h = Math.floor(ms / 1000 / 60 / 60)
  return { h, m, s, done: ms === 0 }
}
