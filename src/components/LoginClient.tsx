"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("test_buyer@tradeit.com");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate test session");
      }

      localStorage.setItem("tradeit_test_user", email);
      router.push("/deal-room");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 shadow rounded-xl border border-gray-100">
        <div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
            TradeIt.tv B2B Escrow
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your Deal Room
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {errorMessage}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label 
                htmlFor="email-address" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setEmail("test_buyer@tradeit.com")}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Fill Test Buyer
            </button>
            <button
              type="button"
              onClick={() => setEmail("test_seller@tradeit.com")}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Fill Test Seller
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in to Deal Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}