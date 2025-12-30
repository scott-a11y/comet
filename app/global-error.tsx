'use client'

import { AlertCircle } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body className="antialiased">
                <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-zinc-900">
                    <div className="flex max-w-md flex-col items-center gap-4">
                        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
                            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                            Critical Error
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            {error.message || 'Something went really wrong. We apologize for the inconvenience.'}
                        </p>
                        <button
                            onClick={reset}
                            className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
