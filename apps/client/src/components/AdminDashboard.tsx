import { useMemo, useState } from 'react'
import { api } from '../lib/net'

export function AdminDashboard(props: { 
  authHeaders: any; 
  load: () => Promise<void>; 
  loadAdminAuctions: () => Promise<void>; 
  adminAuctions: any[]; 
  notifications: any[]; 
  createAuction: (e: React.FormEvent) => Promise<void>; 
  title: string; 
  setTitle: any; 
  startingPrice: number; 
  setStartingPrice: any; 
  bidIncrement: number; 
  setBidIncrement: any; 
  goLiveAt: string; 
  setGoLiveAt: any; 
  durationMinutes: number; 
  setDurationMinutes: any; 
  adminStart: (id: string) => Promise<void>; 
  adminReset: (id: string) => Promise<void>; 
  adminEnd: (id: string) => Promise<void>; 
  adminAccept: (id: string) => Promise<void>; 
  adminReject: (id: string) => Promise<void>; 
  adminCounter: (id: string, amount: number) => Promise<void>; 
}) {
  const [counterAmt, setCounterAmt] = useState<Record<string, string>>({})
  const [openBids, setOpenBids] = useState<Record<string, boolean>>({})
  const [bidPages, setBidPages] = useState<Record<string, { items: any[]; offset: number; limit: number; done: boolean }>>({})
  const { adminAuctions, notifications } = props
  const stats = useMemo(() => {
    const s = { total: adminAuctions.length, live: 0, scheduled: 0, ended: 0, closed: 0 }
    for (const a of adminAuctions) {
      const st = String(a.status || '').toLowerCase()
      if (st in s) (s as any)[st]++
    }
    return s
  }, [adminAuctions])

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Create New Auction</h2>
        <form onSubmit={props.createAuction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Auction Title</label>
              <input className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Vintage camera, rare collectible, etc." value={props.title} onChange={(e) => props.setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Starting Price ($)</label>
              <input className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" type="number" min={0} step={1} value={props.startingPrice} onChange={(e) => props.setStartingPrice(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bid Increment ($)</label>
              <input className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" type="number" min={1} step={1} value={props.bidIncrement} onChange={(e) => props.setBidIncrement(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Go Live At</label>
              <input className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" type="datetime-local" value={props.goLiveAt} onChange={(e) => props.setGoLiveAt(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
              <input className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" type="number" min={1} step={1} value={props.durationMinutes} onChange={(e) => props.setDurationMinutes(Number(e.target.value))} required />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors">Create Auction</button>
        </form>
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Dashboard Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-slate-900">{stats.total}</div><div className="text-sm text-slate-600">Total Auctions</div></div>
          <div className="bg-green-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-green-700">{stats.live}</div><div className="text-sm text-green-600">Live Now</div></div>
          <div className="bg-blue-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-blue-700">{stats.scheduled}</div><div className="text-sm text-blue-600">Scheduled</div></div>
          <div className="bg-gray-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-gray-700">{stats.ended + stats.closed}</div><div className="text-sm text-gray-600">Completed</div></div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Manage Your Auctions</h2>
        {adminAuctions.length === 0 ? (
          <div className="text-center py-8"><div className="text-4xl mb-4">📋</div><p className="text-slate-600">No auctions created yet. Create your first auction above!</p></div>
        ) : (
          <div className="space-y-4">
            {adminAuctions.map((a) => (
              <div key={a.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{a.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'live' ? 'bg-green-100 text-green-700' : a.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{a.status}</span>
                      <span>Current: ${Number(a.currentPrice).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => props.adminStart(a.id)} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors">Start</button>
                    <button onClick={() => props.adminReset(a.id)} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors">Reset</button>
                    <button onClick={() => props.adminEnd(a.id)} className="px-3 py-1 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 transition-colors">End</button>
                    <button onClick={() => props.adminAccept(a.id)} className="px-3 py-1 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition-colors">Accept</button>
                    <button onClick={() => props.adminReject(a.id)} className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors">Reject</button>
                    <button onClick={async () => { const amt = Number(counterAmt[a.id]); if (!amt || isNaN(amt)) return; await props.adminCounter(a.id, amt) }} className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors">Counter</button>
                    <div className="flex items-center gap-2 ml-2">
                      <input type="number" min={1} step={1} value={counterAmt[a.id] ?? ''} onChange={(e) => setCounterAmt((m) => ({ ...m, [a.id]: e.target.value }))} placeholder="Counter $" className="w-28 px-2 py-1 border border-slate-300 rounded-md text-sm" />
                      <button onClick={async () => { const amt = Number(counterAmt[a.id]); if (!amt || isNaN(amt)) return; await props.adminCounter(a.id, amt) }} className="px-3 py-1 border border-purple-600 text-purple-600 rounded-md text-sm hover:bg-purple-50">Send</button>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <button onClick={async () => { setOpenBids((m) => ({ ...m, [a.id]: !m[a.id] })); if (!bidPages[a.id]) { try { const res = await fetch(api(`/api/auctions/${a.id}/bids?offset=0&limit=10`), { headers: props.authHeaders }); const data = await res.json(); setBidPages((m) => ({ ...m, [a.id]: { items: data.items || [], offset: 0, limit: 10, done: !data.items || data.items.length < 10 } })); } catch {} } }} className="text-sm text-slate-600 hover:text-slate-900">{openBids[a.id] ? 'Hide bids ▲' : 'Show bids ▼'}</button>
                  {openBids[a.id] && (
                    <div className="mt-2 bg-slate-50 rounded-md p-3">
                      {(bidPages[a.id]?.items || []).length === 0 ? (
                        <div className="text-sm text-slate-500">No bids yet.</div>
                      ) : (
                        <ul className="divide-y divide-slate-200">{(bidPages[a.id]?.items || []).map((b) => (<li key={b.id} className="py-2 text-sm flex justify-between"><span className="text-slate-600">{new Date(b.createdAt || b.created_at || Date.now()).toLocaleString()}</span><span className="font-medium text-slate-900">${Number(b.amount).toFixed(2)}</span></li>))}</ul>
                      )}
                      {!bidPages[a.id]?.done && (
                        <div className="mt-2 text-right">
                          <button onClick={async () => { const page = bidPages[a.id] || { items: [], offset: 0, limit: 10, done: false }; const nextOffset = page.offset + page.limit; try { const res = await fetch(api(`/api/auctions/${a.id}/bids?offset=${nextOffset}&limit=${page.limit}`), { headers: props.authHeaders }); const data = await res.json(); const more = data.items || []; setBidPages((m) => ({ ...m, [a.id]: { items: [...(m[a.id]?.items || []), ...more], offset: nextOffset, limit: page.limit, done: more.length < page.limit } })); } catch {} }} className="text-sm px-3 py-1 border border-slate-300 rounded-md hover:bg-slate-100">Load more</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Recent Notifications</h2>
        {notifications.length === 0 ? (
          <div className="text-center py-8"><div className="text-4xl mb-4">🔔</div><p className="text-slate-600">No notifications yet.</p></div>
        ) : (
          <div className="space-y-3">{notifications.slice(0, 10).map((n) => (<div key={n.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div><div className="flex-1"><span className="font-medium text-slate-900">{n.type}</span>{n.payload?.auctionId && (<span className="text-slate-600 ml-2">Auction: {n.payload.auctionId}{n.payload?.amount && ` ($${Number(n.payload.amount).toFixed(2)})`}</span>)}</div></div>))}</div>
        )}
      </div>
    </div>
  )
}
