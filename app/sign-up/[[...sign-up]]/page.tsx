import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Join Comet</h1>
          <p className="text-gray-600 mt-2">Create your account to start designing shop layouts</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
              card: 'shadow-lg',
            },
          }}
        />
      </div>
    </div>
  )
}
