"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (requestError) throw requestError;

      // Keep the response generic so the page does not reveal whether an account exists.
      setMessage("If an account exists for that email, password reset instructions will be sent.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not request a reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Enter the email address on your account and we’ll send a reset link.
        </p>

        {message && <p role="status" className="mt-5 rounded-lg border border-green-700 bg-green-950/40 p-3 text-sm text-green-300">{message}</p>}
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label htmlFor="email" className="block text-sm text-neutral-300">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          <Link href="/login" className="text-blue-400 hover:text-blue-300">Back to sign in</Link>
        </p>
      </section>
    </div>
  );
}
