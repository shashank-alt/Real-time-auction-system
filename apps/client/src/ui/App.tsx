import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { createClient } from '@supabase/supabase-js'
import { api, WS_URL } from '../lib/net'
// New modular components (redesigned UI)
import { Navbar } from '../components/Navbar'
import { AuthForm as AuthPage } from '../components/AuthForm'
import { AuctionCard } from '../components/AuctionCard'
import { AdminDashboard as AdminPage } from '../components/AdminDashboard'
import { NotificationsPanel } from '../components/NotificationsPanel'
import { Brand } from '../components/Brand'
import { TimeProvider } from '../providers/TimeProvider'

// Local lightweight context replacement removed; future: lift to provider if needed
let sb: ReturnType<typeof createClient> | null = null as any
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
if (SUPABASE_URL && SUPABASE_KEY) sb = createClient(SUPABASE_URL, SUPABASE_KEY)

// Time is provided globally via TimeProvider

// Navbar moved to components/Navbar

// Auth form moved to components/AuthForm

// Live auctions grid handled inline with modular AuctionCard now

// Admin dashboard moved to components/AdminDashboard

export function App() {
  const [page, setPage] = useState<'live'|'admin'|'auth'>('live')
  const [items, setItems] = useState<any[]>([])
  const [showListings, setShowListings] = useState(false)
  const [listPage, setListPage] = useState(0)
  const PAGE_SIZE = 12
  const [title, setTitle] = useState('')
  const [startingPrice, setStartingPrice] = useState(0)
  const [durationMinutes, setDurationMinutes] = useState(10)
  const [bidIncrement, setBidIncrement] = useState(1)
  const [goLiveAt, setGoLiveAt] = useState<string>(() => new Date(Date.now() + 60_000).toISOString().slice(0,16))
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [supaConfigured, setSupaConfigured] = useState(!!(SUPABASE_URL && SUPABASE_KEY))
  const [diag, setDiag] = useState<any | null>(null)
  const [me, setMe] = useState<{ id: string; isAdmin: boolean } | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [adminAuctions, setAdminAuctions] = useState<any[]>([])

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (session?.access_token) headers['authorization'] = `Bearer ${session.access_token}`
    return headers
  }, [session])

  async function load() {
    try {
      const qs = showListings
        ? `?status=ended,closed&offset=${listPage * PAGE_SIZE}&limit=${PAGE_SIZE}`
        : `?status=live&offset=0&limit=${PAGE_SIZE}`
      const res = await fetch(api(`/api/auctions${qs}`))
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      // backend may still be starting; degrade gracefully
      setItems([])
    }
  }

  async function loadMe() {
    try {
      const res = await fetch(api('/api/me'), { headers: authHeaders })
      if (res.ok) setMe(await res.json())
    } catch {}
  }

  async function loadNotifications() {
    try {
      const res = await fetch(api('/api/notifications'), { headers: authHeaders })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.items || [])
      }
    } catch {}
  }

  async function loadAdminAuctions() {
    if (!session) return
    try {
      // Prefer host-owned list if authenticated; fallback to global admin list
      const hostRes = await fetch(api('/host/auctions'), { headers: authHeaders })
      if (hostRes.ok) {
        const data = await hostRes.json(); setAdminAuctions(data.items || []); return
      }
      const res = await fetch(api('/admin/auctions'), { headers: authHeaders })
      if (res.ok) {
        const data = await res.json()
        setAdminAuctions(data.items || [])
      }
    } catch {}
  }

  async function runDiagnostics() {
    try {
      if (!session?.access_token) { alert('Please sign in as admin to run diagnostics.'); return }
      const res = await fetch(api('/health/check'), {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      setDiag(await res.json())
    } catch (e) {
      setDiag({ ok: false, error: String(e) })
    }
  }

  useEffect(() => {
    load()
    if (session) {
      loadMe()
      loadNotifications()
    }
  }, [session])

  // Load admin/host auctions when switching to Admin page or after login/logout
  useEffect(() => {
    if (page === 'admin' && session) {
      loadAdminAuctions()
      loadNotifications()
    }
  }, [page, session])

  // Reload auctions when listings toggle or page changes
  useEffect(() => {
    load()
  }, [showListings, listPage])

  // Supabase session
  useEffect(() => {
    let unsub: (() => void) | undefined
    async function ensureClient() {
      if (!sb) {
        try {
          const res = await fetch(api('/config'))
          const cfg = await res.json()
          if (cfg?.supabaseUrl && cfg?.supabaseAnonKey) {
            sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
            setSupaConfigured(true)
          } else {
            setSupaConfigured(false)
          }
        } catch {}
      }
      if (!sb) return
      if (!sb) return
      sb.auth.getSession().then(({ data }) => setSession(data.session))
      const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
        setSession(s)
        if (s) setPage('live')
      })
      unsub = () => sub.subscription.unsubscribe()
    }
    ensureClient()
    return () => { if (unsub) unsub() }
  }, [])

  async function signIn(e: FormEvent) {
    e.preventDefault()
  if (!sb) return alert('Supabase not configured')
    const pw = (document.getElementById('auth-pw') as HTMLInputElement)?.value || ''
    const { error } = await sb.auth.signInWithPassword({ email, password: pw })
    if (error) alert(error.message)
  }
  
  async function signOut() {
    if (!sb) return
    await sb.auth.signOut()
    setPage('live')
  }
  
  async function signUp(e: FormEvent | MouseEvent) {
    e.preventDefault()
    if (!sb) return alert('Supabase not configured')
    const pw = (document.getElementById('auth-pw') as HTMLInputElement)?.value || ''
    let redirect = location.origin
    try {
      const res = await fetch(api('/config'))
      const cfg = await res.json()
      if (cfg?.publicOrigin) redirect = cfg.publicOrigin
    } catch {}
    const { error } = await sb.auth.signUp({ email, password: pw, options: { emailRedirectTo: redirect } })
    if (error) alert(error.message)
    else alert('Verification email sent. Please verify your email, then log in.')
  }

  // WebSocket live updates
  const wsRef = useRef<WebSocket | null>(null)
  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    ws.onmessage = async (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'bid:accepted') {
        setItems((prev) => prev.map((a) => a.id === msg.auctionId ? { ...a, currentPrice: msg.amount } : a))
      } else if (msg.type === 'auction:ended') {
        setItems((prev) => prev.map((a) => a.id === msg.auctionId ? { ...a, status: 'ended' } : a))
      } else if (msg.type === 'auction:accepted') {
        setItems((prev) => prev.map((a) => a.id === msg.auctionId ? { ...a, status: 'closed', winnerId: msg.winnerId, currentPrice: msg.amount } : a))
      } else if (msg.type === 'auction:rejected') {
        setItems((prev) => prev.map((a) => a.id === msg.auctionId ? { ...a, status: 'closed' } : a))
      } else if (msg.type === 'offer:accepted') {
        setItems((prev) => prev.map((a) => a.id === msg.auctionId ? { ...a, status: 'closed', currentPrice: msg.amount } : a))
      } else if (msg.type === 'notify') {
        // In-app notifications; only keep recent 20
        setNotifications((list) => {
          if (!session) return list
          if (msg.userId && session.user?.id && msg.userId !== session.user.id) return list
          const next = [{ id: Math.random().toString(36).slice(2), ...msg.payload, at: msg.at }, ...list]
          return next.slice(0, 20)
        })
      }
    }
    wsRef.current = ws
    return () => ws.close()
  }, [])

  // Removed manual ticker; TimeProvider supplies time context

  async function createAuction(e: FormEvent) {
    e.preventDefault()
    if (!session) { alert('Please sign in to host auctions.'); return }
    const res = await fetch(api('/api/auctions'), {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title, startingPrice, durationMinutes, bidIncrement, goLiveAt: new Date(goLiveAt).toISOString() })
    })
    if (res.ok) {
      setTitle('')
      setStartingPrice(0)
      setBidIncrement(1)
      load()
      loadNotifications()
    } else {
      const t = await res.text(); alert(t)
    }
  }

  async function placeBid(id: string, amount: number) {
    if (!session) { alert('Please sign in to place bids.'); return }
    const res = await fetch(api(`/api/auctions/${id}/bids`), {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ amount })
    })
    if (!res.ok) alert(await res.text())
  }

  async function adminStart(id: string) {
    const res = await fetch(api(`/host/auctions/${id}/start`), { method: 'POST', headers: authHeaders, body: JSON.stringify({}) })
    if (res.ok) { loadAdminAuctions(); load(); return }
    const r2 = await fetch(api(`/admin/auctions/${id}/start`), { method: 'POST', headers: authHeaders, body: JSON.stringify({}) })
    if (r2.ok) { loadAdminAuctions(); load() } else { alert(await r2.text()) }
  }
  async function adminReset(id: string) {
    const res = await fetch(api(`/host/auctions/${id}/reset`), { method: 'POST', headers: authHeaders, body: JSON.stringify({}) })
    if (res.ok) { loadAdminAuctions(); load(); return }
    const r2 = await fetch(api(`/admin/auctions/${id}/reset`), { method: 'POST', headers: authHeaders, body: JSON.stringify({}) })
    if (r2.ok) { loadAdminAuctions(); load() } else { alert(await r2.text()) }
  }
  async function adminEnd(id: string) {
    const res = await fetch(api(`/api/auctions/${id}/end`), { method: 'POST', headers: authHeaders, body: JSON.stringify({}) })
    if (res.ok) { loadAdminAuctions(); loadNotifications(); load() } else { alert(await res.text()) }
  }
  async function adminAccept(id: string) {
    const res = await fetch(api(`/api/auctions/${id}/decision`), { method: 'POST', headers: authHeaders, body: JSON.stringify({ action: 'accept' }) })
    if (res.ok) { loadNotifications(); loadAdminAuctions(); } else { alert(await res.text()) }
  }
  async function adminReject(id: string) {
    const res = await fetch(api(`/api/auctions/${id}/decision`), { method: 'POST', headers: authHeaders, body: JSON.stringify({ action: 'reject' }) })
    if (res.ok) { loadNotifications(); loadAdminAuctions(); } else { alert(await res.text()) }
  }
  async function adminCounter(id: string, amount: number) {
    const res = await fetch(api(`/api/auctions/${id}/decision`), { method: 'POST', headers: authHeaders, body: JSON.stringify({ action: 'counter', amount }) })
    if (res.ok) { loadNotifications(); } else { alert(await res.text()) }
  }

  // Show auth page if not authenticated and trying to access protected content
  if (!session && (page === 'admin' || page === 'auth')) {
    return (
      <>
    <Navbar session={session} me={me} page={page} setPage={setPage} signOut={signOut} notifications={notifications} onOpen={() => setNotifyOpen((v) => !v)} />
  <AuthPage email={email} setEmail={setEmail} signIn={signIn} signUp={signUp} supabaseConfigured={supaConfigured} />
      </>
    )
  }

  return (
    <TimeProvider>
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar session={session} me={me} page={page} setPage={setPage} signOut={signOut} notifications={notifications} onOpen={() => setNotifyOpen((v) => !v)} />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {page === 'live' ? (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">Live Auctions on <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500">BidSphere</span></h2>
              <p className="text-slate-600 dark:text-slate-400">Where every bid counts, in real-time.</p>
              <div className="mt-4">
                <button
                  onClick={() => setShowListings((s) => !s)}
                  className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  {showListings ? 'Show Live Only' : 'Show Listings (Ended/Sold)'}
                </button>
              </div>
            </div>
            {/* Live auctions grid */}
            {(() => {
              const visible = items.filter((a) => {
                const st = String(a.status || '').toLowerCase()
                return showListings ? (st !== 'live') : (st === 'live')
              })
              if (visible.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏛️</div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No {showListings ? 'Listings' : 'Live Auctions'}</h3>
                    <p className="text-slate-600">Check back later or create your own auction!</p>
                  </div>
                )
              }
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visible.map((a) => (
                    <AuctionCard key={a.id} a={a} placeBid={placeBid} />
                  ))}
                </div>
              )
            })()}
            {showListings && (
              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={() => setListPage((p) => Math.max(0, p - 1))}
                  disabled={listPage === 0}
                  className="px-3 py-1 border border-slate-300 rounded-md disabled:opacity-50"
                >Prev</button>
                <div className="text-sm text-slate-600">Page {listPage + 1}</div>
                <button
                  onClick={() => setListPage((p) => p + 1)}
                  className="px-3 py-1 border border-slate-300 rounded-md"
                >Next</button>
              </div>
            )}
          </div>
        ) : page === 'admin' ? (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">Host Dashboard</h2>
              <p className="text-slate-600 dark:text-slate-400">Create and manage your BidSphere auctions</p>
            </div>
            <AdminPage
              authHeaders={authHeaders}
              load={load}
              loadAdminAuctions={loadAdminAuctions}
              adminAuctions={adminAuctions}
              notifications={notifications}
              createAuction={createAuction}
              title={title}
              setTitle={setTitle}
              startingPrice={startingPrice}
              setStartingPrice={setStartingPrice}
              bidIncrement={bidIncrement}
              setBidIncrement={setBidIncrement}
              goLiveAt={goLiveAt}
              setGoLiveAt={setGoLiveAt}
              durationMinutes={durationMinutes}
              setDurationMinutes={setDurationMinutes}
              adminStart={adminStart}
              adminReset={adminReset}
              adminEnd={adminEnd}
              adminAccept={adminAccept}
              adminReject={adminReject}
              adminCounter={adminCounter}
            />
          </div>
        ) : null}

        {/* Notifications dropdown */}
        {notifyOpen && session && (
          <div className="fixed right-6 top-20 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
            <div className="p-3 border-b border-slate-200 font-semibold">Notifications</div>
            <div className="max-h-96 overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-slate-600">No notifications yet</div>
              ) : notifications.map((n) => (
                <div key={n.id} className="p-3 border-b border-slate-100 text-sm">
                  <div className="font-medium text-slate-900">{n.type}</div>
                  <div className="text-slate-600">
                    {n.title ? `${n.title} — ` : ''}
                    {n.amount ? `$${Number(n.amount).toFixed(2)}` : ''}
                  </div>
                  <div className="text-xs text-slate-400">{new Date(n.at || Date.now()).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diagnostics Section - Only show on live page for admins */}
        {page === 'live' && me?.isAdmin && (
          <div className="mt-12 bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">System Diagnostics</h3>
              <button 
                onClick={runDiagnostics}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Run Checks
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Checks database, Redis, Supabase, SendGrid, and system configuration.
            </p>
            {diag && (
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(diag, null, 2)}
              </pre>
            )}
          </div>
        )}
    </main>
  </div>
  </TimeProvider>
  )
}