import { createContext, useEffect, useState, ReactNode } from 'react'

export const TimeContext = createContext<number>(Date.now())

export function TimeProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return <TimeContext.Provider value={now}>{children}</TimeContext.Provider>
}
