import { ReactNode } from 'react'

interface BottomNavItem { label: string; onClick: () => void; active?: boolean; icon?: ReactNode }
export function BottomNav({ items }: { items: BottomNavItem[] }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 flex lg:hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-t border-zinc-200 dark:border-zinc-800">
      {items.map(i => (
        <button key={i.label} onClick={i.onClick} className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium ${i.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>{i.icon}<span>{i.label}</span></button>
      ))}
    </div>
  )
}
