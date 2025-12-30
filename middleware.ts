import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/buildings(.*)',  // TEMP DIAGNOSTIC
])

const isProtectedRoute = createRouteMatcher([  '/buildings(.*)',
  '/equipment(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // If Clerk isn't configured, we skip calling protect(). This prevents
  // build-time / local-dev failures when keys are absent.
  const hasClerk = !!process.env.CLERK_SECRET_KEY && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!hasClerk) return

  if (!isPublicRoute(req)) {
    if (isProtectedRoute(req)) await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!api(?:/|$)|trpc(?:/|$)|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}