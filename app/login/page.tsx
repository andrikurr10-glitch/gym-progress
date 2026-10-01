"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/");
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 text-white">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/bgmerah.jpg')",
        }}
      />

      {/* Overlay */}
      <div className="fixed inset-0 z-10 bg-black/60" />

      {/* Content */}
      <div className="relative z-20 flex min-h-[90vh] items-center justify-center">
        <div className="w-full max-w-md">

          {/* Logo / Brand */}
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-950/50 shadow-lg shadow-red-950/20 backdrop-blur-sm">
              <span className="text-3xl">🏋️</span>
            </div>

            <p className="mt-4 text-xs font-semibold tracking-[0.25em] text-red-400">
              GYM PROGRESS
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/85 p-6 shadow-2xl backdrop-blur-md sm:p-8">

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold">
                Welcome Back
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Login untuk melanjutkan progress gym kamu.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Email
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3.5 text-white placeholder-zinc-600 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Password
                </label>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3.5 text-white placeholder-zinc-600 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-red-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

            </form>

            {/* Error Message */}
            {message && (
              <div className="mt-5 rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm leading-relaxed text-red-300">
                {message}
              </div>
            )}

            {/* Register */}
            <div className="mt-7 border-t border-zinc-800 pt-6 text-center">
              <p className="text-sm text-zinc-400">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-red-400 transition hover:text-red-300"
                >
                  Register
                </Link>
              </p>
            </div>

          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-zinc-500">
            Track your workout. Track your progress.
          </p>

        </div>
      </div>
    </main>
  );
}