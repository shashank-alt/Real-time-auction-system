export function NotificationsPanel({ notifications }: { notifications: any[] }) {
  return (
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
  )
}
