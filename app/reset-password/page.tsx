"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [checkingLink, setCheckingLink] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const checkRecoveryLink = async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      const hasAuthError = hash.has("error") || query.has("error");
      const code = hash.get("error_code") ?? query.get("error_code");

      if (hasAuthError) {
        if (active) {
          setLinkError(
            code === "otp_expired"
              ? "This reset link has expired or was already used. Request a new one to continue."
              : "This reset link is invalid. Request a new one to continue."
          );
          setCheckingLink(false);
        }
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionError || !data.session) {
        setLinkError("This reset link is missing or expired. Request a new one to continue.");
      }
      setCheckingLink(false);
    };

    void checkRecoveryLink();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      await supabase.auth.signOut();
      setComplete(true);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update the password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white">Choose a new password</h1>

        {checkingLink ? (
          <p className="mt-4 text-sm text-neutral-400">Checking your reset link…</p>
        ) : linkError ? (
          <>
            <p role="alert" className="mt-5 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-300">{linkError}</p>
            <Link href="/forgot-password" className="mt-5 inline-block text-sm text-blue-400 hover:text-blue-300">
              Request another reset link
            </Link>
          </>
        ) : complete ? (
          <>
            <p role="status" className="mt-5 rounded-lg border border-green-700 bg-green-950/40 p-3 text-sm text-green-300">
              Your password was updated. Sign in with your new password.
            </p>
            <Link href="/login" className="mt-5 inline-block text-sm text-blue-400 hover:text-blue-300">
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-neutral-400">Enter and confirm your new password.</p>
            {error && <p role="alert" className="mt-5 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label htmlFor="password" className="block text-sm text-neutral-300">New password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="confirm-password" className="block text-sm text-neutral-300">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
