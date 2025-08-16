import { Toaster } from 'react-hot-toast'

export function ToasterPortal() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-lg rounded-lg border border-zinc-200 dark:border-zinc-700',
        success: { iconTheme: { primary: '#4f46e5', secondary: 'white' } },
        error: { iconTheme: { primary: '#dc2626', secondary: 'white' } }
      }}
    />
  )
}
