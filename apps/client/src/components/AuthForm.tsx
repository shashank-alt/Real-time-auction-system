import { useState } from 'react'

export function AuthForm({ email, setEmail, signIn, signUp, supabaseConfigured }: {
  email: string;
  setEmail: (email: string) => void;
  signIn: (e: React.FormEvent) => Promise<void>;
  signUp: (e: React.FormEvent) => Promise<void>;
  supabaseConfigured: boolean;
}) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pwInput = document.getElementById('auth-pw') as HTMLInputElement
    if (pwInput) pwInput.value = password
    if (isSignUp) {
      await signUp(e)
    } else {
      await signIn(e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🏛️</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-600">
              {isSignUp ? 'Join AuctionHub to start bidding and hosting auctions' : 'Sign in to your AuctionHub account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                id="auth-pw"
                type="password"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder={isSignUp ? 'Create a password (min 6 characters)' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 hover:text-indigo-700 font-medium">
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
          {!supabaseConfigured && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800"><strong>Dev Mode:</strong> Supabase not configured. Authentication is disabled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
