'use client'

import { useActionState } from 'react'
import { login, signup } from '../actions'

export default function LoginPage() {
  const [loginState, loginAction, isLoginPending] = useActionState(login, null)
  const [signupState, signupAction, isSignupPending] = useActionState(signup, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-md">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          TradeIt B2B
        </h2>

        {/* Display Server Action Errors */}
        {(loginState?.error || signupState?.error) && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-500">
            {loginState?.error || signupState?.error}
          </div>
        )}

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            />
          </div>

          <div className="flex gap-4">
            <button
              formAction={loginAction}
              disabled={isLoginPending}
              className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoginPending ? 'Logging in...' : 'Log In'}
            </button>
            <button
              formAction={signupAction}
              disabled={isSignupPending}
              className="w-full rounded-md border border-gray-300 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isSignupPending ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}