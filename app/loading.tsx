import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="flex h-[50vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
        </div>
    )
}
