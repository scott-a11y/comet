'use client'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast'

function isAuthEnabledClient() {
  // Client-side only: we can only rely on NEXT_PUBLIC_* vars.
  // If no publishable key is present, do NOT mount ClerkProvider.
  return !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
}

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {isAuthEnabledClient() ? (
        <ClerkProvider publishableKey={clerkPublishableKey}>
          {children}
        </ClerkProvider>
      ) : (
        children
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
}