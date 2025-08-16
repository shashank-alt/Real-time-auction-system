import { useMemo } from 'react'

interface CreateAuctionFormProps {
  title: string; setTitle: (v: string) => void;
  startingPrice: number; setStartingPrice: (v: number) => void;
  bidIncrement: number; setBidIncrement: (v: number) => void;
  goLiveAt: string; setGoLiveAt: (v: string) => void;
  durationMinutes: number; setDurationMinutes: (v: number) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}
export function CreateAuctionForm(p: CreateAuctionFormProps) {
  const endsAt = useMemo(() => {
    const start = new Date(p.goLiveAt).getTime()
    return new Date(start + p.durationMinutes * 60000).toLocaleString()
  }, [p.goLiveAt, p.durationMinutes])
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={p.onSubmit} className="space-y-5">
        <div>
          <label className="label">Title</label>
          <input value={p.title} onChange={(e) => p.setTitle(e.target.value)} required className="input" placeholder="Vintage camera" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Starting Price</label>
            <input type="number" min={0} step={1} value={p.startingPrice} onChange={(e) => p.setStartingPrice(Number(e.target.value))} required className="input" />
          </div>
          <div>
            <label className="label">Bid Increment</label>
            <input type="number" min={1} step={1} value={p.bidIncrement} onChange={(e) => p.setBidIncrement(Number(e.target.value))} required className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Go Live At</label>
            <input type="datetime-local" value={p.goLiveAt} onChange={(e) => p.setGoLiveAt(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="label">Duration (min)</label>
            <input type="number" min={1} value={p.durationMinutes} onChange={(e) => p.setDurationMinutes(Number(e.target.value))} required className="input" />
          </div>
        </div>
        <button type="submit" className="btn w-full">Create Auction</button>
      </form>
      <div className="card p-6 space-y-4">
        <div className="text-sm font-medium text-zinc-500">Live Preview</div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-200 via-fuchsia-200 to-pink-100 dark:from-indigo-700/30 dark:via-fuchsia-700/20 dark:to-pink-700/10 h-40 flex items-center justify-center text-4xl font-bold text-indigo-600 dark:text-indigo-300">
          {(p.title || 'A')[0].toUpperCase()}
        </div>
        <div className="space-y-1">
          <div className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">{p.title || 'Auction Title'}</div>
          <div className="text-sm text-zinc-500">Starts: {new Date(p.goLiveAt).toLocaleString()}</div>
          <div className="text-sm text-zinc-500">Ends: {endsAt}</div>
          <div className="text-sm text-zinc-700 dark:text-zinc-300">Starting at ${p.startingPrice || 0} (+{p.bidIncrement || 1} inc)</div>
        </div>
      </div>
    </div>
  )
}
