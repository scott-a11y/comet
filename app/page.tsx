import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

const HAS_CLERK = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="absolute top-4 right-4">
        {HAS_CLERK ? (
          <>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10',
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </>
        ) : (
          <Link
            href="/buildings"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Buildings
          </Link>
        )}
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            Comet
          </h1>
          <p className="text-2xl text-slate-300 mb-4">
            Shop Layout Tool for Cabinet & Wood Shops
          </p>
          <p className="text-lg text-slate-400 mb-12">
            Design optimal layouts for machines, electrical, dust collection, and compressed air systems
          </p>

          {HAS_CLERK ? (
            <>
              <SignedIn>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/buildings"
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-lg"
                  >
                    View Buildings
                  </Link>
                  <Link
                    href="/equipment"
                    className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors text-lg"
                  >
                    Manage Equipment
                  </Link>
                </div>
              </SignedIn>

              <SignedOut>
                <div className="mb-8">
                  <SignInButton mode="modal">
                    <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-lg">
                      Get Started
                    </button>
                  </SignInButton>
                </div>
                <p className="text-slate-400 mb-8">
                  Sign in to start designing your shop layouts
                </p>
              </SignedOut>
            </>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link
                href="/buildings"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-lg"
              >
                View Buildings
              </Link>
              <Link
                href="/equipment"
                className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors text-lg"
              >
                Manage Equipment
              </Link>
            </div>
          )}

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <div className="text-blue-400 text-4xl mb-3">🏭</div>
              <h3 className="text-white font-semibold text-lg mb-2">Buildings & Zones</h3>
              <p className="text-slate-400 text-sm">
                Define your shop layout with warehouse, office, and yard zones
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <div className="text-blue-400 text-4xl mb-3">⚡</div>
              <h3 className="text-white font-semibold text-lg mb-2">Equipment & Power</h3>
              <p className="text-slate-400 text-sm">
                Track machines with electrical specs, dust collection, and compressed air requirements
              </p>
            </div>
            
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <div className="text-blue-400 text-4xl mb-3">📐</div>
              <h3 className="text-white font-semibold text-lg mb-2">Layout Design</h3>
              <p className="text-slate-400 text-sm">
                Create multiple layout scenarios with drag-and-drop equipment placement
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}