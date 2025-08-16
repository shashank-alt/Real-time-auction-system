import { useEffect, useState } from 'react'
import { Brand } from './Brand'

export function Navbar({ session, me, page, setPage, signOut, notifications, onOpen }: { 
  session: any; 
  me: { id: string; isAdmin: boolean } | null; 
  page: string; 
  setPage: (page: 'live' | 'admin' | 'auth') => void; 
  signOut: () => void,
  notifications: any[],
  onOpen: () => void
}) {
  const [dark, setDark] = useState<boolean>(() => typeof localStorage !== 'undefined' && localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])
  return (
    <nav className="bg-white dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Brand />
            {session && (
              <div className="flex gap-1">
                <button 
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    page === 'live' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  onClick={() => setPage('live')}
                >
                  Live Auctions
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    page === 'admin' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  onClick={() => setPage('admin')}
                >
                  Host Dashboard
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDark(d => !d)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
              title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {dark ? '🌙' : '☀️'}
            </button>
            {session ? (
              <>
                <button
                  onClick={onOpen}
                  className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <span className="text-xl">🔔</span>
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
                      {notifications.length}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {session.user.email}
                    </div>
                    {me?.isAdmin && (<div className="text-xs text-indigo-400 font-medium">Admin</div>)}
                  </div>
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 dark:text-indigo-300 font-medium text-sm">
                      {session.user.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={signOut}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => setPage('auth')}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors dark:shadow-lg"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
