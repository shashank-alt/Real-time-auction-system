interface InvoiceCardProps { invoice: any }
export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const inv = invoice || {}
  return (
    <div className="max-w-2xl mx-auto card p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Invoice</h1>
        <span className="text-xs uppercase tracking-wide text-zinc-500">#{inv.id || '—'}</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-6 text-sm">
        <div>
          <div className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">Item</div>
          <div className="text-zinc-900 dark:text-zinc-100 font-semibold">{inv.itemTitle || 'Auction Item'}</div>
          <div className="text-zinc-500">Auction ID: {inv.auctionId || '—'}</div>
        </div>
        <div>
          <div className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">Seller</div>
          <div className="text-zinc-900 dark:text-zinc-100">{inv.sellerEmail || '—'}</div>
          <div className="mt-2 font-medium text-zinc-700 dark:text-zinc-300 mb-1">Buyer</div>
          <div className="text-zinc-900 dark:text-zinc-100">{inv.buyerEmail || '—'}</div>
        </div>
        <div>
          <div className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">Amount</div>
          <div className="text-xl font-bold tabular-nums">${Number(inv.amount || 0).toFixed(2)}</div>
        </div>
        <div>
          <div className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">Date</div>
          <div className="text-zinc-900 dark:text-zinc-100">{inv.date ? new Date(inv.date).toLocaleString() : new Date().toLocaleString()}</div>
        </div>
      </div>
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 flex justify-end">
        <button onClick={() => window.print()} className="btn">Download PDF</button>
      </div>
    </div>
  )
}
