import { ReactNode } from 'react'

export function Layout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-emerald-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">
      <aside className="hidden lg:flex w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
        {sidebar}
      </aside>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}
