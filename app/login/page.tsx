"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; // Importing the connection we made earlier!
import { Dumbbell } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Function to handle creating a new account
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the confirmation link!");
    }
    setLoading(false);
  };

  // Function to handle logging in
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Logged in successfully! Redirecting...");
      // Later, we will tell the app to go back to the Dashboard here
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
      
      {/* The Login Card */}
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 mb-4">
            <Dumbbell size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Athlete Portal</h1>
          <p className="text-neutral-400 mt-2 text-center">Sign in to track your progress and access your routines.</p>
        </div>

        {/* The Form */}
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="you@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Feedback Message (Errors or Success) */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.includes("error") ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
              {message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Sign In"}
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              Sign Up
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}