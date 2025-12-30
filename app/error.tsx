'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App Error:', error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 px-4 dark:bg-zinc-900">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Something went wrong!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
        <button
          onClick={reset}
          className="group flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
        >
          <RefreshCcw className="h-4 w-4 transition-transform group-hover:rotate-180" />
          Try again
        </button>
      </div>
    </div>
  )
}
