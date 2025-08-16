import { ReactNode, useEffect } from 'react'

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    function esc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" aria-label="Close">✕</button>
        </div>
        <div className="px-6 py-4 overflow-auto flex-1 text-sm text-zinc-700 dark:text-zinc-300">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-3 bg-zinc-50/60 dark:bg-zinc-800/40 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
