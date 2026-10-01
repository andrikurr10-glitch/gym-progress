"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AppNav() {
  const router = useRouter();

  async function handleLogout() {
    const confirmLogout = confirm("Yakin ingin logout?");

    if (!confirmLogout) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/login");
  }

  return (
    <>
      {/* TOP NAV */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* LEFT */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-2 text-sm font-medium text-red-400 backdrop-blur transition hover:border-red-500/40 hover:bg-zinc-900"
          >
            ← Dashboard
          </Link>

          <Link
            href="/workout"
            className="hidden rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-2 text-sm text-zinc-300 backdrop-blur transition hover:border-red-500/40 hover:text-red-400 lg:block"
          >
            Workout
          </Link>

          <Link
            href="/progress"
            className="hidden rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-2 text-sm text-zinc-300 backdrop-blur transition hover:border-red-500/40 hover:text-red-400 lg:block"
          >
            Progress
          </Link>

          <Link
            href="/weight"
            className="hidden rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-2 text-sm text-zinc-300 backdrop-blur transition hover:border-red-500/40 hover:text-red-400 lg:block"
          >
            Weight
          </Link>

          <Link
            href="/target"
            className="hidden rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-2 text-sm text-zinc-300 backdrop-blur transition hover:border-red-500/40 hover:text-red-400 lg:block"
          >
            Target
          </Link>
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="w-fit rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 backdrop-blur transition hover:bg-red-900/40"
        >
          Logout
        </button>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">

          <Link
            href="/"
            className="flex flex-col items-center gap-1 px-1 py-3 text-xs text-red-400"
          >
            <span className="text-lg">⌂</span>
            Home
          </Link>

          <Link
            href="/workout"
            className="flex flex-col items-center gap-1 px-1 py-3 text-xs text-zinc-400 hover:text-red-400"
          >
            <span className="text-lg">🏋️</span>
            Workout
          </Link>

          <Link
            href="/progress"
            className="flex flex-col items-center gap-1 px-1 py-3 text-xs text-zinc-400 hover:text-red-400"
          >
            <span className="text-lg">📈</span>
            Progress
          </Link>

          <Link
            href="/weight"
            className="flex flex-col items-center gap-1 px-1 py-3 text-xs text-zinc-400 hover:text-red-400"
          >
            <span className="text-lg">⚖️</span>
            Weight
          </Link>

          <Link
            href="/target"
            className="flex flex-col items-center gap-1 px-1 py-3 text-xs text-zinc-400 hover:text-red-400"
          >
            <span className="text-lg">🎯</span>
            Target
          </Link>

        </div>
      </nav>
    </>
  );
}