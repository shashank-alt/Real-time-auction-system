import { ReactNode } from 'react'

interface Item { label: string; icon?: ReactNode; onClick: () => void; active?: boolean }
export function SidebarNav({ items, footer }: { items: Item[]; footer?: ReactNode }) {
  return (
    <nav className="flex-1 flex flex-col p-4 gap-2">
      {items.map(it => (
        <button key={it.label} onClick={it.onClick} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
          ${it.active ? 'bg-indigo-600 text-white shadow' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'}`}>{it.icon}<span>{it.label}</span></button>
      ))}
      <div className="mt-auto pt-4 text-xs text-zinc-500 dark:text-zinc-500/80">
        {footer}
      </div>
    </nav>
  )
}
