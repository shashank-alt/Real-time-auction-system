interface AdminTableProps { auctions: any[]; onStart: (id: string) => void; onReset: (id: string) => void; onEnd: (id: string) => void; onAccept: (id: string) => void; onReject: (id: string) => void }
export function AdminTable({ auctions, onStart, onReset, onEnd, onAccept, onReject }: AdminTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Title</th>
            <th className="text-left px-4 py-2 font-medium">Status</th>
            <th className="text-left px-4 py-2 font-medium">Current</th>
            <th className="px-4 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {auctions.map(a => (
            <tr key={a.id} className="bg-white dark:bg-zinc-900/60">
              <td className="px-4 py-2 font-medium text-zinc-800 dark:text-zinc-100 max-w-[240px] truncate">{a.title}</td>
              <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'live' ? 'bg-green-100 text-green-700' : a.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'}`}>{a.status}</span></td>
              <td className="px-4 py-2 tabular-nums">${Number(a.currentPrice).toFixed(2)}</td>
              <td className="px-4 py-2">
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => onStart(a.id)} className="px-2 py-1 rounded bg-green-600 text-white text-xs">Start</button>
                  <button onClick={() => onReset(a.id)} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Reset</button>
                  <button onClick={() => onEnd(a.id)} className="px-2 py-1 rounded bg-orange-600 text-white text-xs">End</button>
                  <button onClick={() => onAccept(a.id)} className="px-2 py-1 rounded bg-emerald-600 text-white text-xs">Accept</button>
                  <button onClick={() => onReject(a.id)} className="px-2 py-1 rounded bg-red-600 text-white text-xs">Reject</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {auctions.length === 0 && (
        <div className="p-6 text-center text-sm text-zinc-500">No auctions found.</div>
      )}
    </div>
  )
}
