import { useEffect, useMemo, useRef, useState, createContext, useContext } from 'react'
import { createClient } from '@supabase/supabase-js'

// Enhanced URL configuration with better error handling
const getApiBase = () => {
  const rawBase = (import.meta.env.VITE_API_BASE ?? '/') as string
  return String(rawBase).replace(/\/+$/, '') || '/'
}

const API_BASE = getApiBase()
const createApiUrl = (path: string) => `${API_BASE === '/' ? '' : API_BASE}${path}`

// WebSocket URL derivation with improved logic
const deriveWebSocketUrl = () => {
  const envWsUrl = import.meta.env.VITE_WS_URL as string | undefined
  if (envWsUrl) return envWsUrl
  
  try {
    if (API_BASE && /^(http|https):\/\//.test(API_BASE)) {
      const url = new URL(API_BASE)
      return (url.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + url.host
    }
  } catch {}
  
  // Development environment detection
  if (location.port === '5173') return 'ws://localhost:8080'
  return location.origin.replace('http', 'ws')
}

const WEBSOCKET_URL = deriveWebSocketUrl()

// Supabase client initialization
let supabaseClient: ReturnType<typeof createClient> | null = null
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (SUPABASE_URL && SUPABASE_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY)
}

// Time context for real-time updates
const TimeContext = createContext<number>(Date.now())

// Custom hook for countdown functionality
function useAuctionCountdown(endTime: string) {
  const currentTime = useContext(TimeContext)
  const endTimestamp = useMemo(() => new Date(endTime).getTime(), [endTime])
  const remainingMs = Math.max(0, endTimestamp - currentTime)
  
  const seconds = Math.floor(remainingMs / 1000) % 60
  const minutes = Math.floor(remainingMs / 1000 / 60) % 60
  const hours = Math.floor(remainingMs / 1000 / 60 / 60)
  
  return { hours, minutes, seconds, isExpired: remainingMs === 0 }
}

// Auction card component with enhanced UI
function AuctionItemCard({ auction, onPlaceBid }: { auction: any; onPlaceBid: (id: string, amount: number) => Promise<void> }) {
  const { hours, minutes, seconds, isExpired } = useAuctionCountdown(auction.endsAt)
  const [bidAmount, setBidAmount] = useState<string>('')
  const auctionStatus = String(auction.status || '').toLowerCase()
  const isSold = auctionStatus === 'closed'
  const hasEnded = auctionStatus === 'ended' || isExpired
  
  const statusConfig = isSold 
    ? { label: 'Sold', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    : hasEnded 
    ? { label: 'Ended', className: 'bg-rose-50 text-rose-700 border-rose-200' }
    : { label: 'Active', className: 'bg-blue-50 text-blue-700 border-blue-200' }

  const [winningBid, setWinningBid] = useState<number | null>(null)
  
  useEffect(() => {
    let cancelled = false
    async function fetchWinningBid() {
      try {
        if (isSold || hasEnded) {
          const response = await fetch(createApiUrl(`/api/auctions/${auction.id}/winner`))
          if (response.ok) {
            const winner = await response.json()
            if (!cancelled) setWinningBid(Number(winner.amount))
          }
        } else {
          setWinningBid(null)
        }
      } catch {}
    }
    fetchWinningBid()
    return () => { cancelled = true }
  }, [auction.id, isSold, hasEnded])

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2 flex-1 mr-3">{auction.title}</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        </div>
        
        {auction.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{auction.description}</p>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">
              {isSold ? 'Final Price' : 'Current Bid'}
            </span>
            <span className="text-3xl font-bold text-gray-900">
              ${Number(auction.currentPrice).toFixed(2)}
            </span>
          </div>
          
          {(!hasEnded && !isSold) && (
            <div className="text-center space-y-3">
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg py-2">
                Time remaining: {hours}h {minutes}m {seconds}s
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => onPlaceBid(auction.id, Number(auction.currentPrice) + 1)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                >
                  +$1
                </button>
                <button
                  onClick={() => onPlaceBid(auction.id, Number(auction.currentPrice) + 5)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                >
                  +$5
                </button>
                <input
                  type="number"
                  min={Number(auction.currentPrice) + Number(auction.bidIncrement || 1)}
                  step={1}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`$${(Number(auction.currentPrice) + Number(auction.bidIncrement || 1)).toFixed(2)}`}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  onClick={() => {
                    const amount = Number(bidAmount)
                    if (!isNaN(amount) && amount > 0) onPlaceBid(auction.id, amount)
                  }}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm"
                >
                  Bid
                </button>
              </div>
            </div>
          )}
          
          {hasEnded && !isSold && (
            <div className="text-center text-sm text-gray-600 bg-amber-50 rounded-lg py-3">
              Auction completed. Awaiting seller's decision.
            </div>
          )}
          
          {isSold && (
            <div className="text-center text-sm text-emerald-700 font-semibold bg-emerald-50 rounded-lg py-3">
              Successfully sold! {winningBid ? `Final price: $${winningBid.toFixed(2)}` : 'Transaction completed.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Enhanced navigation component
function NavigationHeader({ 
  userSession, 
  userProfile, 
  currentPage, 
  onPageChange, 
  onSignOut, 
  notifications, 
  onToggleNotifications 
}: { 
  userSession: any; 
  userProfile: { id: string; isAdmin: boolean } | null; 
  currentPage: string; 
  onPageChange: (page: 'auctions' | 'dashboard' | 'login') => void; 
  onSignOut: () => void;
  notifications: any[];
  onToggleNotifications: () => void;
}) {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">⚡</span>
              BidMaster
            </h1>
            {userSession && (
              <div className="flex gap-1">
                <button 
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 'auctions' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => onPageChange('auctions')}
                >
                  Live Auctions
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 'dashboard' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => onPageChange('dashboard')}
                >
                  Seller Dashboard
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {userSession ? (
              <>
                <button
                  onClick={onToggleNotifications}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="View notifications"
                >
                  <span className="text-2xl">🔔</span>
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {userSession.user.email}
                    </div>
                    {userProfile?.isAdmin && (
                      <div className="text-xs text-blue-600 font-medium">Administrator</div>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">
                      {userSession.user.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={onSignOut}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => onPageChange('login')}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
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

// Enhanced authentication page
function AuthenticationPage({ 
  email, 
  setEmail, 
  onSignIn, 
  onSignUp, 
  isSupabaseConfigured 
}: {
  email: string;
  setEmail: (email: string) => void;
  onSignIn: (e: React.FormEvent) => Promise<void>;
  onSignUp: (e: React.FormEvent) => Promise<void>;
  isSupabaseConfigured: boolean;
}) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [password, setPassword] = useState('')

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const passwordInput = document.getElementById('password-field') as HTMLInputElement
    if (passwordInput) passwordInput.value = password
    
    if (isRegistering) {
      await onSignUp(e)
    } else {
      await onSignIn(e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">⚡</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isRegistering ? 'Join BidMaster' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {isRegistering 
                ? 'Create your account to start bidding and selling' 
                : 'Sign in to access your BidMaster account'
              }
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password-field"
                type="password"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={isRegistering ? 'Create a secure password (6+ characters)' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              {isRegistering 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Register"
              }
            </button>
          </div>

          {!isSupabaseConfigured && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800">
                <strong>Development Mode:</strong> Authentication service not configured.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Live auctions display component
function LiveAuctionsView({ authHeaders, auctions, onPlaceBid }: { authHeaders: any; auctions: any[]; onPlaceBid: (id: string, amount: number) => Promise<void> }) {
  if (auctions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-8xl mb-6">⚡</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Active Auctions</h3>
        <p className="text-gray-600 text-lg">Check back soon for exciting new auctions!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {auctions.map((auction) => (
        <AuctionItemCard key={auction.id} auction={auction} onPlaceBid={onPlaceBid} />
      ))}
    </div>
  )
}

// Enhanced seller dashboard
function SellerDashboard(props: { 
  authHeaders: any; 
  onRefreshAuctions: () => Promise<void>; 
  onRefreshDashboard: () => Promise<void>; 
  dashboardAuctions: any[]; 
  notifications: any[]; 
  onCreateAuction: (e: React.FormEvent) => Promise<void>; 
  auctionTitle: string; 
  setAuctionTitle: any; 
  startPrice: number; 
  setStartPrice: any; 
  bidStep: number; 
  setBidStep: any; 
  liveTime: string; 
  setLiveTime: any; 
  duration: number; 
  setDuration: any; 
  onStartAuction: (id: string) => Promise<void>; 
  onResetAuction: (id: string) => Promise<void>; 
  onEndAuction: (id: string) => Promise<void>; 
  onAcceptBid: (id: string) => Promise<void>; 
  onRejectBid: (id: string) => Promise<void>; 
  onCounterOffer: (id: string, amount: number) => Promise<void>; 
}) {
  const [counterAmounts, setCounterAmounts] = useState<Record<string, string>>({})
  const [expandedBids, setExpandedBids] = useState<Record<string, boolean>>({})
  const [bidHistory, setBidHistory] = useState<Record<string, { items: any[]; offset: number; limit: number; hasMore: boolean }>>({})
  
  const { dashboardAuctions, notifications } = props
  
  const statistics = useMemo(() => {
    const stats = { total: dashboardAuctions.length, active: 0, scheduled: 0, completed: 0, sold: 0 }
    for (const auction of dashboardAuctions) {
      const status = String(auction.status || '').toLowerCase()
      if (status === 'live') stats.active++
      else if (status === 'scheduled') stats.scheduled++
      else if (status === 'ended') stats.completed++
      else if (status === 'closed') stats.sold++
    }
    return stats
  }, [dashboardAuctions])

  return (
    <div className="space-y-8">
      {/* Auction Creation Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Auction</h2>
        <form onSubmit={props.onCreateAuction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Auction Title
              </label>
              <input 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your item (e.g., Vintage watch, Art piece, etc.)"
                value={props.auctionTitle} 
                onChange={(e) => props.setAuctionTitle(e.target.value)} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Starting Price ($)
              </label>
              <input 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="number" 
                min={0} 
                step={1} 
                value={props.startPrice} 
                onChange={(e) => props.setStartPrice(Number(e.target.value))} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Minimum Bid Increment ($)
              </label>
              <input 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="number" 
                min={1} 
                step={1} 
                value={props.bidStep} 
                onChange={(e) => props.setBidStep(Number(e.target.value))} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Time
              </label>
              <input 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="datetime-local" 
                value={props.liveTime} 
                onChange={(e) => props.setLiveTime(e.target.value)} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                type="number" 
                min={1} 
                step={1} 
                value={props.duration} 
                onChange={(e) => props.setDuration(Number(e.target.value))} 
                required
              />
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Create Auction
          </button>
        </form>
      </div>

      {/* Statistics Overview */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{statistics.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-700">{statistics.active}</div>
            <div className="text-sm text-blue-600">Active</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-700">{statistics.scheduled}</div>
            <div className="text-sm text-amber-600">Scheduled</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-700">{statistics.completed}</div>
            <div className="text-sm text-purple-600">Completed</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-emerald-700">{statistics.sold}</div>
            <div className="text-sm text-emerald-600">Sold</div>
          </div>
        </div>
      </div>

      {/* Auction Management */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Your Auctions</h2>
        {dashboardAuctions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 text-lg">No auctions created yet. Start by creating your first auction above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dashboardAuctions.map((auction) => (
              <div key={auction.id} className="border border-gray-200 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{auction.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        auction.status === 'live' ? 'bg-blue-100 text-blue-700' :
                        auction.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
                        auction.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {auction.status}
                      </span>
                      <span>Current: ${Number(auction.currentPrice).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => props.onStartAuction(auction.id)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
                    >
                      Start
                    </button>
                    <button 
                      onClick={() => props.onResetAuction(auction.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => props.onEndAuction(auction.id)}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-colors"
                    >
                      End
                    </button>
                    <button 
                      onClick={() => props.onAcceptBid(auction.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => props.onRejectBid(auction.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={counterAmounts[auction.id] ?? ''}
                        onChange={(e) => setCounterAmounts((prev) => ({ ...prev, [auction.id]: e.target.value }))}
                        placeholder="Counter $"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={async () => {
                          const amount = Number(counterAmounts[auction.id])
                          if (!amount || isNaN(amount)) return
                          await props.onCounterOffer(auction.id, amount)
                        }}
                        className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg text-sm hover:bg-purple-50"
                      >
                        Counter
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Bid History Toggle */}
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      setExpandedBids((prev) => ({ ...prev, [auction.id]: !prev[auction.id] }))
                      if (!bidHistory[auction.id]) {
                        try {
                          const response = await fetch(createApiUrl(`/api/auctions/${auction.id}/bids?offset=0&limit=10`), { headers: props.authHeaders })
                          const data = await response.json()
                          setBidHistory((prev) => ({ 
                            ...prev, 
                            [auction.id]: { 
                              items: data.items || [], 
                              offset: 0, 
                              limit: 10, 
                              hasMore: !data.items || data.items.length >= 10 
                            } 
                          }))
                        } catch {}
                      }
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {expandedBids[auction.id] ? 'Hide bid history ▲' : 'Show bid history ▼'}
                  </button>
                  {expandedBids[auction.id] && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-4">
                      {(bidHistory[auction.id]?.items || []).length === 0 ? (
                        <div className="text-sm text-gray-500">No bids placed yet.</div>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {(bidHistory[auction.id]?.items || []).map((bid) => (
                            <li key={bid.id} className="py-2 text-sm flex justify-between">
                              <span className="text-gray-600">{new Date(bid.createdAt || bid.created_at || Date.now()).toLocaleString()}</span>
                              <span className="font-semibold text-gray-900">${Number(bid.amount).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {bidHistory[auction.id]?.hasMore && (
                        <div className="mt-3 text-right">
                          <button
                            onClick={async () => {
                              const currentHistory = bidHistory[auction.id] || { items: [], offset: 0, limit: 10, hasMore: false }
                              const nextOffset = currentHistory.offset + currentHistory.limit
                              try {
                                const response = await fetch(createApiUrl(`/api/auctions/${auction.id}/bids?offset=${nextOffset}&limit=${currentHistory.limit}`), { headers: props.authHeaders })
                                const data = await response.json()
                                const newItems = data.items || []
                                setBidHistory((prev) => ({
                                  ...prev,
                                  [auction.id]: {
                                    items: [...(prev[auction.id]?.items || []), ...newItems],
                                    offset: nextOffset,
                                    limit: currentHistory.limit,
                                    hasMore: newItems.length >= currentHistory.limit
                                  }
                                }))
                              } catch {}
                            }}
                            className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                          >
                            Load more bids
                          </button>
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

      {/* Recent Notifications */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-gray-600 text-lg">No recent activity.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 10).map((notification) => (
              <div key={notification.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">{notification.type}</span>
                  {notification.payload?.auctionId && (
                    <span className="text-gray-600 ml-2">
                      Auction: {notification.payload.auctionId}
                      {notification.payload?.amount && ` ($${Number(notification.payload.amount).toFixed(2)})`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Main application component
export function App() {
  const [currentPage, setCurrentPage] = useState<'auctions'|'dashboard'|'login'>('auctions')
  const [auctions, setAuctions] = useState<any[]>([])
  const [showCompletedAuctions, setShowCompletedAuctions] = useState(false)
  const [completedPage, setCompletedPage] = useState(0)
  const ITEMS_PER_PAGE = 12
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [auctionTitle, setAuctionTitle] = useState('')
  const [startPrice, setStartPrice] = useState(0)
  const [duration, setDuration] = useState(10)
  const [bidStep, setBidStep] = useState(1)
  const [liveTime, setLiveTime] = useState<string>(() => new Date(Date.now() + 60_000).toISOString().slice(0,16))
  const [userSession, setUserSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(!!(SUPABASE_URL && SUPABASE_KEY))
  const [systemDiagnostics, setSystemDiagnostics] = useState<any | null>(null)
  const [userProfile, setUserProfile] = useState<{ id: string; isAdmin: boolean } | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [dashboardAuctions, setDashboardAuctions] = useState<any[]>([])

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (userSession?.access_token) headers['authorization'] = `Bearer ${userSession.access_token}`
    return headers
  }, [userSession])

  async function loadAuctions() {
    try {
      const queryParams = showCompletedAuctions
        ? `?status=ended,closed&offset=${completedPage * ITEMS_PER_PAGE}&limit=${ITEMS_PER_PAGE}`
        : `?status=live&offset=0&limit=${ITEMS_PER_PAGE}`
      const response = await fetch(createApiUrl(`/api/auctions${queryParams}`))
      const data = await response.json()
      setAuctions(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      setAuctions([])
    }
  }

  async function loadUserProfile() {
    try {
      const response = await fetch(createApiUrl('/api/me'), { headers: authHeaders })
      if (response.ok) setUserProfile(await response.json())
    } catch {}
  }

  async function loadNotifications() {
    try {
      const response = await fetch(createApiUrl('/api/notifications'), { headers: authHeaders })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.items || [])
      }
    } catch {}
  }

  async function loadDashboardAuctions() {
    if (!userSession) return
    try {
      const hostResponse = await fetch(createApiUrl('/host/auctions'), { headers: authHeaders })
      if (hostResponse.ok) {
        const data = await hostResponse.json()
        setDashboardAuctions(data.items || [])
        return
      }
      const adminResponse = await fetch(createApiUrl('/admin/auctions'), { headers: authHeaders })
      if (adminResponse.ok) {
        const data = await adminResponse.json()
        setDashboardAuctions(data.items || [])
      }
    } catch {}
  }

  async function runSystemDiagnostics() {
    try {
      if (!userSession?.access_token) { 
        alert('Please sign in as administrator to run system diagnostics.') 
        return 
      }
      const response = await fetch(createApiUrl('/health/check'), {
        headers: { 'Authorization': `Bearer ${userSession.access_token}` }
      })
      setSystemDiagnostics(await response.json())
    } catch (e) {
      setSystemDiagnostics({ ok: false, error: String(e) })
    }
  }

  useEffect(() => {
    loadAuctions()
    if (userSession) {
      loadUserProfile()
      loadNotifications()
    }
  }, [userSession])

  useEffect(() => {
    if (currentPage === 'dashboard' && userSession) {
      loadDashboardAuctions()
      loadNotifications()
    }
  }, [currentPage, userSession])

  useEffect(() => {
    loadAuctions()
  }, [showCompletedAuctions, completedPage])

  // Supabase session management
  useEffect(() => {
    let cleanup: (() => void) | undefined
    async function initializeSupabase() {
      if (!supabaseClient) {
        try {
          const response = await fetch(createApiUrl('/config'))
          const config = await response.json()
          if (config?.supabaseUrl && config?.supabaseAnonKey) {
            supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey)
            setIsSupabaseConfigured(true)
          } else {
            setIsSupabaseConfigured(false)
          }
        } catch {}
      }
      if (!supabaseClient) return
      
      supabaseClient.auth.getSession().then(({ data }) => setUserSession(data.session))
      const { data: subscription } = supabaseClient.auth.onAuthStateChange((_event, session) => {
        setUserSession(session)
        if (session) setCurrentPage('auctions')
      })
      cleanup = () => subscription.subscription.unsubscribe()
    }
    initializeSupabase()
    return () => { if (cleanup) cleanup() }
  }, [])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!supabaseClient) return alert('Authentication service not configured')
    const passwordField = (document.getElementById('password-field') as HTMLInputElement)?.value || ''
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password: passwordField })
    if (error) alert(error.message)
  }
  
  async function handleSignOut() {
    if (!supabaseClient) return
    await supabaseClient.auth.signOut()
    setCurrentPage('auctions')
  }
  
  async function handleSignUp(e: React.FormEvent | React.MouseEvent) {
    e.preventDefault()
    if (!supabaseClient) return alert('Authentication service not configured')
    const passwordField = (document.getElementById('password-field') as HTMLInputElement)?.value || ''
    let redirectUrl = location.origin
    try {
      const response = await fetch(createApiUrl('/config'))
      const config = await response.json()
      if (config?.publicOrigin) redirectUrl = config.publicOrigin
    } catch {}
    const { error } = await supabaseClient.auth.signUp({ 
      email, 
      password: passwordField, 
      options: { emailRedirectTo: redirectUrl } 
    })
    if (error) alert(error.message)
    else alert('Verification email sent. Please check your email and verify your account.')
  }

  // WebSocket connection for real-time updates
  const websocketRef = useRef<WebSocket | null>(null)
  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL)
    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'bid:accepted') {
        setAuctions((prev) => prev.map((auction) => 
          auction.id === message.auctionId 
            ? { ...auction, currentPrice: message.amount } 
            : auction
        ))
      } else if (message.type === 'auction:ended') {
        setAuctions((prev) => prev.map((auction) => 
          auction.id === message.auctionId 
            ? { ...auction, status: 'ended' } 
            : auction
        ))
      } else if (message.type === 'auction:accepted') {
        setAuctions((prev) => prev.map((auction) => 
          auction.id === message.auctionId 
            ? { ...auction, status: 'closed', winnerId: message.winnerId, currentPrice: message.amount } 
            : auction
        ))
      } else if (message.type === 'auction:rejected') {
        setAuctions((prev) => prev.map((auction) => 
          auction.id === message.auctionId 
            ? { ...auction, status: 'closed' } 
            : auction
        ))
      } else if (message.type === 'offer:accepted') {
        setAuctions((prev) => prev.map((auction) => 
          auction.id === message.auctionId 
            ? { ...auction, status: 'closed', currentPrice: message.amount } 
            : auction
        ))
      } else if (message.type === 'notify') {
        setNotifications((list) => {
          if (!userSession) return list
          if (message.userId && userSession.user?.id && message.userId !== userSession.user.id) return list
          const newNotification = { 
            id: Math.random().toString(36).slice(2), 
            ...message.payload, 
            at: message.at 
          }
          return [newNotification, ...list].slice(0, 20)
        })
      }
    }
    websocketRef.current = ws
    return () => ws.close()
  }, [])

  // Time ticker for countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function createNewAuction(e: React.FormEvent) {
    e.preventDefault()
    if (!userSession) { 
      alert('Please sign in to create auctions.') 
      return 
    }
    const response = await fetch(createApiUrl('/api/auctions'), {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ 
        title: auctionTitle, 
        startingPrice: startPrice, 
        durationMinutes: duration, 
        bidIncrement: bidStep, 
        goLiveAt: new Date(liveTime).toISOString() 
      })
    })
    if (response.ok) {
      setAuctionTitle('')
      setStartPrice(0)
      setBidStep(1)
      loadAuctions()
      loadNotifications()
    } else {
      const errorText = await response.text()
      alert(errorText)
    }
  }

  async function placeBid(auctionId: string, amount: number) {
    if (!userSession) { 
      alert('Please sign in to place bids.') 
      return 
    }
    const response = await fetch(createApiUrl(`/api/auctions/${auctionId}/bids`), {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ amount })
    })
    if (!response.ok) alert(await response.text())
  }

  async function startAuction(auctionId: string) {
    const response = await fetch(createApiUrl(`/host/auctions/${auctionId}/start`), { 
      method: 'POST', 
      headers: authHeaders, 
      body: JSON.stringify({}) 
    })
    if (response.ok) { 
      loadDashboardAuctions()
      loadAuctions()
      return 
    }
    const adminResponse = await fetch(createApiUrl(`/admin/auctions/${auctionId}/start`), { 
      method: 'POST', 
      headers: authHeaders, 
      body: JSON.stringify({}) 
    })
    if (adminResponse.ok) { 
      loadDashboardAuctions()
      loadAuctions() 
    } else { 
      alert(await adminResponse.text()) 
    }
  }

  async function resetAuction(auctionId: string) {
    const response = await fetch(createApiUrl(`/host/auctions/${auctionId}/reset`), { 
      method: 'POST', 
      headers: authHeaders, 
      body: JSON.stringify({}) 
    })
    if (response.ok) { 
      loadDashboardAuctions()
      loadAuctions()
      return 
    }
    const adminResponse = await fetch(createApiUrl(`/admin/auctions/${auctionId}/reset`), { 
      method: 'POST', 
      headers: authHeaders, 
      body: JSON.stringify({}) 
    })
    if (adminResponse.ok) { 
      loadDashboardAuctions()
      loadAuctions() 
    } else { 
      alert(await adminResponse.text()) 
    }
  }

  async function endAuction(auctionId: string) {
    const response = await fetch(createApiUrl(`/api/auctions/${auctionId}/end`), { 
      method: 'POST', 
      headers: authHeaders, 
      body: JSON.stringify({}) 
    })
    if (response.ok) { 
      loadDashboardAuctions()
      loadNotifications()
      loadAuctions() 
    } else { 
      alert(await response.text()) 
    }
  }

  async function acceptBid(auctionId: string) {
    const response = await fetch(createApiUrl(`/api/auctions/${auctionId}/decision`), { 
      method: 'POST', 
      headers: authHeaders, 
      body: JSON.stringify({ action: 'accept' }) 
    })
    if (response.ok) { 
      loadNotifications()
      loadDashboardAuctions() 
    } else { 
      alert(await response.text()) 
    }
  }

  async function rejectBid(auctionId: string) {
    const response = await fetch(createApiUrl(`/api/auctions/${auctionId}/decision`), { 
      method: 'POST', 
      headers: authHeaders, 
      body: JSON.stringify({ action: 'reject' }) 
    })
    if (response.ok) { 
      loadNotifications()
      loadDashboardAuctions() 
    } else { 
      alert(await response.text()) 
    }
  }

  async function makeCounterOffer(auctionId: string, amount: number) {
    const response = await fetch(createApiUrl(`/api/auctions/${auctionId}/decision`), { 
      method: 'POST', 
      headers: authHeaders, 
      body: JSON.stringify({ action: 'counter', amount }) 
    })
    if (response.ok) { 
      loadNotifications() 
    } else { 
      alert(await response.text()) 
    }
  }

  // Show authentication page if not signed in and trying to access protected content
  if (!userSession && (currentPage === 'dashboard' || currentPage === 'login')) {
    return (
      <>
        <NavigationHeader 
          userSession={userSession} 
          userProfile={userProfile} 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
          onSignOut={handleSignOut} 
          notifications={notifications} 
          onToggleNotifications={() => setShowNotifications((prev) => !prev)} 
        />
        <AuthenticationPage 
          email={email} 
          setEmail={setEmail} 
          onSignIn={handleSignIn} 
          onSignUp={handleSignUp} 
          isSupabaseConfigured={isSupabaseConfigured} 
        />
      </>
    )
  }

  return (
    <TimeContext.Provider value={currentTime}>
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader 
          userSession={userSession} 
          userProfile={userProfile} 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
          onSignOut={handleSignOut} 
          notifications={notifications} 
          onToggleNotifications={() => setShowNotifications((prev) => !prev)} 
        />
        
        <main className="max-w-7xl mx-auto px-6 py-8">
          {currentPage === 'auctions' ? (
            <div>
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-3">Live Auctions</h2>
                <p className="text-gray-600 text-lg">Discover and bid on amazing items from sellers worldwide</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowCompletedAuctions((prev) => !prev)}
                    className="px-6 py-3 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {showCompletedAuctions ? 'Show Active Auctions' : 'Browse Completed Auctions'}
                  </button>
                </div>
              </div>
              <LiveAuctionsView
                authHeaders={authHeaders}
                auctions={auctions.filter((auction) => {
                  const status = String(auction.status || '').toLowerCase()
                  return showCompletedAuctions ? (status !== 'live') : (status === 'live')
                })}
                onPlaceBid={placeBid}
              />
              {showCompletedAuctions && (
                <div className="mt-8 flex justify-between items-center">
                  <button
                    onClick={() => setCompletedPage((prev) => Math.max(0, prev - 1))}
                    disabled={completedPage === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <div className="text-sm text-gray-600">Page {completedPage + 1}</div>
                  <button
                    onClick={() => setCompletedPage((prev) => prev + 1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : currentPage === 'dashboard' ? (
            <div>
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-3">Seller Dashboard</h2>
                <p className="text-gray-600 text-lg">Create and manage your auction listings</p>
              </div>
              <SellerDashboard
                authHeaders={authHeaders}
                onRefreshAuctions={loadAuctions}
                onRefreshDashboard={loadDashboardAuctions}
                dashboardAuctions={dashboardAuctions}
                notifications={notifications}
                onCreateAuction={createNewAuction}
                auctionTitle={auctionTitle}
                setAuctionTitle={setAuctionTitle}
                startPrice={startPrice}
                setStartPrice={setStartPrice}
                bidStep={bidStep}
                setBidStep={setBidStep}
                liveTime={liveTime}
                setLiveTime={setLiveTime}
                duration={duration}
                setDuration={setDuration}
                onStartAuction={startAuction}
                onResetAuction={resetAuction}
                onEndAuction={endAuction}
                onAcceptBid={acceptBid}
                onRejectBid={rejectBid}
                onCounterOffer={makeCounterOffer}
              />
            </div>
          ) : null}

          {/* Notifications Dropdown */}
          {showNotifications && userSession && (
            <div className="fixed right-6 top-20 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50">
              <div className="p-4 border-b border-gray-200 font-bold">Notifications</div>
              <div className="max-h-96 overflow-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-sm text-gray-600 text-center">No new notifications</div>
                ) : notifications.map((notification) => (
                  <div key={notification.id} className="p-4 border-b border-gray-100 text-sm">
                    <div className="font-semibold text-gray-900">{notification.type}</div>
                    <div className="text-gray-600">
                      {notification.title ? `${notification.title} — ` : ''}
                      {notification.amount ? `$${Number(notification.amount).toFixed(2)}` : ''}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(notification.at || Date.now()).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Diagnostics - Only for administrators */}
          {currentPage === 'auctions' && userProfile?.isAdmin && (
            <div className="mt-16 bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">System Diagnostics</h3>
                <button 
                  onClick={runSystemDiagnostics}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Run System Check
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Comprehensive system health check including database, Redis, Supabase, and email services.
              </p>
              {systemDiagnostics && (
                <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-auto text-sm">
                  {JSON.stringify(systemDiagnostics, null, 2)}
                </pre>
              )}
            </div>
          )}
        </main>
      </div>
    </TimeContext.Provider>
  )
}