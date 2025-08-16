import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@supabase/supabase-js'
import { api, WS_URL } from '../lib/net'
// New modular components (redesigned UI)
import { Navbar } from '../components/Navbar'
import { Layout } from '../components/Layout'
import { SidebarNav } from '../components/SidebarNav'
import { AuthForm as AuthPage } from '../components/AuthForm'
import { AuctionCard } from '../components/AuctionCard'
import { AdminDashboard as AdminPage } from '../components/AdminDashboard'
import { NotificationsPanel } from '../components/NotificationsPanel'
import { Brand } from '../components/Brand'
import { TimeProvider } from '../providers/TimeProvider'
import { ToasterPortal } from '../components/ToasterPortal'

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
  const [openAuctionId, setOpenAuctionId] = useState<string | null>(null)
  const openAuction = items.find(i => i.id === openAuctionId) || adminAuctions.find(i => i.id === openAuctionId)

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
    toast.custom((t) => <div className="px-4 py-3 bg-white dark:bg-zinc-800 rounded-lg shadow border border-zinc-200 dark:border-zinc-700 text-sm">New highest bid: <span className="font-semibold">${msg.amount}</span></div>)
      } else if (msg.type === 'auction:ended') {
        setItems((prev) => prev.map((a) => a.id === msg.auctionId ? { ...a, status: 'ended' } : a))
    toast('Auction ended', { icon: '⌛' })
      } else if (msg.type === 'auction:accepted') {
        setItems((prev) => prev.map((a) => a.id === msg.auctionId ? { ...a, status: 'closed', winnerId: msg.winnerId, currentPrice: msg.amount } : a))
    toast.success('Auction accepted & closed')
      } else if (msg.type === 'auction:rejected') {
        setItems((prev) => prev.map((a) => a.id === msg.auctionId ? { ...a, status: 'closed' } : a))
    toast.error('Auction rejected by seller')
      } else if (msg.type === 'offer:accepted') {
        setItems((prev) => prev.map((a) => a.id === msg.auctionId ? { ...a, status: 'closed', currentPrice: msg.amount } : a))
    toast.success('Counter-offer accepted')
      } else if (msg.type === 'notify') {
        // In-app notifications; only keep recent 20
        setNotifications((list) => {
          if (!session) return list
          if (msg.userId && session.user?.id && msg.userId !== session.user.id) return list
          const next = [{ id: Math.random().toString(36).slice(2), ...msg.payload, at: msg.at }, ...list]
          return next.slice(0, 20)
        })
    if (msg.payload?.type === 'outbid') toast('You have been outbid', { icon: '⚠️' })
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

  const sidebar = (
    <SidebarNav
      items={[
        { label: 'Live Auctions', onClick: () => setPage('live'), active: page === 'live' },
        session ? { label: 'Host Dashboard', onClick: () => setPage('admin'), active: page === 'admin' } : { label: 'Sign In', onClick: () => setPage('auth'), active: page === 'auth' },
      ].filter(Boolean) as any}
      footer={<div>BidSphere © {new Date().getFullYear()}</div>}
    />
  )

  return (
    <TimeProvider>
  <ToasterPortal />
  <Layout sidebar={sidebar}>
      <Navbar session={session} me={me} page={page} setPage={setPage} signOut={signOut} notifications={notifications} onOpen={() => setNotifyOpen((v) => !v)} />
      <main className="max-w-6xl mx-auto px-6 py-8 w-full">
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
                    <AuctionCard key={a.id} a={a} placeBid={placeBid} currentUserId={session?.user?.id || null} onOpen={(id) => setOpenAuctionId(id)} />
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
      {openAuction && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <button onClick={() => setOpenAuctionId(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500" aria-label="Close auction room">✕</button>
            <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
              <div className="p-6 space-y-4 md:col-span-1">
                <div className="aspect-video rounded-lg bg-gradient-to-br from-indigo-200 via-fuchsia-200 to-pink-100 dark:from-indigo-700/30 dark:via-fuchsia-700/20 dark:to-pink-700/10 flex items-center justify-center text-4xl font-bold text-indigo-600 dark:text-indigo-300">
                  {(openAuction.title || '?')[0]?.toUpperCase()}
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{openAuction.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{openAuction.description || 'No description'}</p>
                <div className="text-xs text-zinc-500">Auction ID: {openAuction.id}</div>
              </div>
              <div className="p-6 space-y-6 md:col-span-1">
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Current Bid</div>
                  <div className="text-4xl font-bold text-zinc-900 dark:text-white tabular-nums">${Number(openAuction.currentPrice).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Place Bid</div>
                  <form onSubmit={(e) => { e.preventDefault(); const input = (e.currentTarget.elements.namedItem('amount') as HTMLInputElement); const v = Number(input.value); if (!isNaN(v) && v > Number(openAuction.currentPrice)) placeBid(openAuction.id, v) }} className="space-y-3">
                    <input name="amount" type="number" min={Number(openAuction.currentPrice) + Number(openAuction.bidIncrement || 1)} defaultValue={Number(openAuction.currentPrice) + Number(openAuction.bidIncrement || 1)} className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => placeBid(openAuction.id, Number(openAuction.currentPrice) + Number(openAuction.bidIncrement || 1))} className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm">+Inc</button>
                      <button type="button" onClick={() => placeBid(openAuction.id, Number(openAuction.currentPrice) + 5)} className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm">+5</button>
                      <button type="submit" className="flex-1 px-4 py-2 rounded-lg border border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-sm">Bid</button>
                    </div>
                  </form>
                </div>
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {/* Placeholder for bid history - backend call untouched, would need a dedicated fetch. */}
                  <div className="text-xs text-zinc-500">Bid history will display here.</div>
                </div>
              </div>
              <div className="p-6 space-y-4 md:col-span-1">
                <div className="text-xs uppercase tracking-wide text-zinc-500">Notifications</div>
                <div className="space-y-2 max-h-72 overflow-auto pr-1 text-sm">
                  {notifications.slice(0,10).map(n => (
                    <div key={n.id} className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700">
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">{n.type}</div>
                      {n.amount && (<div className="text-zinc-600 dark:text-zinc-400">${Number(n.amount).toFixed(2)}</div>)}
                      <div className="text-xs text-zinc-500">{new Date(n.at || Date.now()).toLocaleTimeString()}</div>
                    </div>
                  ))}
                  {notifications.length === 0 && (<div className="text-xs text-zinc-500">No notifications yet.</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  </TimeProvider>
  )
}