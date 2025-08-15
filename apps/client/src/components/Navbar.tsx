import React from 'react'

export function Navbar({ session, me, page, setPage, signOut, notifications, onOpen }: { 
  session: any; 
  me: { id: string; isAdmin: boolean } | null; 
  page: string; 
  setPage: (page: 'live' | 'admin' | 'auth') => void; 
  signOut: () => void,
  notifications: any[],
  onOpen: () => void
}) {
  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-slate-900">
              🏛️ AuctionHub
            </h1>
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
            {session ? (
              <>
                <button
                  onClick={onOpen}
                  className="relative p-2 rounded-full hover:bg-slate-100"
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
                    <div className="text-sm font-medium text-slate-900">
                      {session.user.email}
                    </div>
                    {me?.isAdmin && (
                      <div className="text-xs text-indigo-600 font-medium">Admin</div>
                    )}
                  </div>
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-medium text-sm">
                      {session.user.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={signOut}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => setPage('auth')}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
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
