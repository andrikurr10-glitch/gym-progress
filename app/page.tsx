"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";

type Workout = {
  id: number;
  workout_date: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string | null;
  created_at: string;
};

type WeightLog = {
  weight: number;
  record_date: string;
};

type Target = {
  id: number;
  target_name: string;
  target_value: number;
  start_value: number;
  deadline: string | null;
};

export default function Home() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const [
      { data: workoutData, error: workoutError },
      { data: weightData, error: weightError },
      { data: targetData, error: targetError },
    ] = await Promise.all([
      supabase
        .from("workouts")
        .select(
          "id, workout_date, exercise_name, sets, reps, weight, notes, created_at"
        )
        .eq("user_id", user.id)
        .order("workout_date", { ascending: false })
        .order("created_at", { ascending: false }),

      supabase
        .from("weight_logs")
        .select("weight, record_date")
        .eq("user_id", user.id)
        .order("record_date", { ascending: true }),

      supabase
        .from("targets")
        .select(
          "id, target_name, target_value, start_value, deadline"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (workoutError) {
      console.error("Workout:", workoutError.message);
    }

    if (weightError) {
      console.error("Weight:", weightError.message);
    }

    if (targetError) {
      console.error("Target:", targetError.message);
    }

    setWorkouts(workoutData || []);
    setWeights(weightData || []);
    setTargets(targetData || []);

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =========================
     CURRENT WEIGHT
  ========================= */

  const currentWeight = useMemo(() => {
    if (weights.length === 0) return null;

    return Number(weights[weights.length - 1].weight);
  }, [weights]);

  /* =========================
     TOTAL SESSIONS
  ========================= */

  const totalSessions = useMemo(() => {
    const uniqueDates = new Set(
      workouts.map((workout) => workout.workout_date)
    );

    return uniqueDates.size;
  }, [workouts]);

  /* =========================
     STREAK
  ========================= */

  const streak = useMemo(() => {
    if (workouts.length === 0) return 0;

    const uniqueDates = Array.from(
      new Set(workouts.map((workout) => workout.workout_date))
    ).sort((a, b) => (a > b ? -1 : 1));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestDate = new Date(
      uniqueDates[0] + "T00:00:00"
    );

    const differenceFromToday = Math.floor(
      (today.getTime() - latestDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (differenceFromToday > 1) {
      return 0;
    }

    let currentStreak = 1;

    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = new Date(
        uniqueDates[i] + "T00:00:00"
      );

      const next = new Date(
        uniqueDates[i + 1] + "T00:00:00"
      );

      const difference = Math.floor(
        (current.getTime() - next.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (difference === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    return currentStreak;
  }, [workouts]);

  /* =========================
     LATEST WORKOUT
  ========================= */

  const latestWorkout = workouts[0] || null;

  /* =========================
     ACTIVE TARGET
  ========================= */

  const activeTarget = targets[0] || null;

  const targetProgress = useMemo(() => {
    if (!activeTarget || currentWeight === null) {
      return 0;
    }

    const start = Number(activeTarget.start_value);
    const target = Number(activeTarget.target_value);
    const current = Number(currentWeight);

    if (start === target) {
      return 100;
    }

    let progress = 0;

    if (target > start) {
      progress =
        ((current - start) / (target - start)) * 100;
    } else {
      progress =
        ((start - current) / (start - target)) * 100;
    }

    return Math.min(100, Math.max(0, progress));
  }, [activeTarget, currentWeight]);

  /* =========================
     TARGET REMAINING
  ========================= */

  const targetRemaining = useMemo(() => {
    if (!activeTarget || currentWeight === null) {
      return null;
    }

    return (
      Number(activeTarget.target_value) -
      Number(currentWeight)
    );
  }, [activeTarget, currentWeight]);

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-transparent px-4 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <AppNav />

          <p className="text-zinc-300">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 pb-28 pt-6 text-white lg:pb-10">
      <div className="mx-auto max-w-7xl">

        {/* =========================
            NAVIGATION
        ========================= */}

        <AppNav />

        {/* =========================
            HEADER
        ========================= */}

        <header className="mb-8">
          <p className="text-sm font-medium text-red-400">
            Gym Progress
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-zinc-300">
            Pantau perkembangan latihanmu.
          </p>
        </header>

        {/* =========================
            TOP STATS
        ========================= */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* CURRENT WEIGHT */}

          <Link
            href="/weight"
            className="rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-5 backdrop-blur-sm transition hover:border-red-500/40"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Berat Saat Ini
              </p>

              <span className="text-xl">⚖️</span>
            </div>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-bold">
                {currentWeight ?? "-"}
              </span>

              <span className="pb-1 text-zinc-500">
                kg
              </span>
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              {currentWeight
                ? "Update dari Weight Tracking"
                : "Belum ada data berat"}
            </p>
          </Link>

          {/* SESSIONS */}

          <Link
            href="/progress"
            className="rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-5 backdrop-blur-sm transition hover:border-red-500/40"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Workout Sessions
              </p>

              <span className="text-xl">🏋️</span>
            </div>

            <div className="mt-4">
              <span className="text-4xl font-bold">
                {totalSessions}
              </span>
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              Hari latihan tercatat
            </p>
          </Link>

          {/* STREAK */}

          <Link
            href="/workout"
            className="rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-5 backdrop-blur-sm transition hover:border-red-500/40 sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Current Streak
              </p>

              <span className="text-xl">🔥</span>
            </div>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-bold">
                {streak}
              </span>

              <span className="pb-1 text-zinc-500">
                hari
              </span>
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              Konsistensi latihan
            </p>
          </Link>
        </section>

        {/* =========================
            TARGET
        ========================= */}

        <section className="mt-6 rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <p className="text-sm text-zinc-400">
                Target Utama
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {activeTarget
                  ? activeTarget.target_name
                  : "Belum ada target"}
              </h2>
            </div>

            {activeTarget && (
              <div className="text-left sm:text-right">
                <p className="text-3xl font-bold text-red-400">
                  {Math.round(targetProgress)}%
                </p>

                <p className="text-xs text-zinc-500">
                  progress
                </p>
              </div>
            )}
          </div>

          {activeTarget ? (
            <>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-700"
                  style={{
                    width: `${targetProgress}%`,
                  }}
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">

                <div className="rounded-2xl bg-zinc-950/90 p-3">
                  <p className="text-xs text-zinc-500">
                    Mulai
                  </p>

                  <p className="mt-1 font-semibold">
                    {activeTarget.start_value} kg
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-950/90 p-3">
                  <p className="text-xs text-zinc-500">
                    Sekarang
                  </p>

                  <p className="mt-1 font-semibold">
                    {currentWeight ?? "-"} kg
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-950/90 p-3">
                  <p className="text-xs text-zinc-500">
                    Target
                  </p>

                  <p className="mt-1 font-semibold">
                    {activeTarget.target_value} kg
                  </p>
                </div>

              </div>

              {targetRemaining !== null && (
                <p className="mt-4 text-sm text-zinc-400">
                  {Math.abs(targetRemaining) < 0.01 ? (
                    <span className="font-medium text-red-400">
                      🎉 Target tercapai!
                    </span>
                  ) : targetRemaining > 0 ? (
                    <>
                      Tinggal{" "}
                      <span className="font-semibold text-red-400">
                        {Math.abs(targetRemaining).toFixed(1)} kg
                      </span>{" "}
                      lagi.
                    </>
                  ) : (
                    <>
                      Sudah{" "}
                      <span className="font-semibold text-red-400">
                        {Math.abs(targetRemaining).toFixed(1)} kg
                      </span>{" "}
                      di atas target.
                    </>
                  )}
                </p>
              )}

              <Link
                href="/target"
                className="mt-5 inline-block text-sm font-medium text-red-400 hover:text-red-300"
              >
                Lihat detail target →
              </Link>
            </>
          ) : (
            <div className="mt-5">
              <p className="text-sm text-zinc-500">
                Buat target berat badan untuk mulai
                memantau progress.
              </p>

              <Link
                href="/target"
                className="mt-4 inline-block rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                + Buat Target
              </Link>
            </div>
          )}
        </section>

        {/* =========================
            LOWER CONTENT
        ========================= */}

        <section className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* LATEST WORKOUT */}

          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">
                  Workout Terakhir
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {latestWorkout
                    ? latestWorkout.exercise_name
                    : "Belum ada workout"}
                </h2>
              </div>

              <span className="text-2xl">
                🏋️
              </span>
            </div>

            {latestWorkout ? (
              <div className="mt-5">

                <div className="grid grid-cols-3 gap-3">

                  <div className="rounded-2xl bg-zinc-950/90 p-4">
                    <p className="text-xs text-zinc-500">
                      Weight
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {latestWorkout.weight} kg
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-950/90 p-4">
                    <p className="text-xs text-zinc-500">
                      Sets
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {latestWorkout.sets}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-950/90 p-4">
                    <p className="text-xs text-zinc-500">
                      Reps
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {latestWorkout.reps}
                    </p>
                  </div>

                </div>

                <p className="mt-4 text-sm text-zinc-500">
                  {new Date(
                    latestWorkout.workout_date +
                      "T00:00:00"
                  ).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>

                {latestWorkout.notes && (
                  <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4">
                    <p className="text-xs text-zinc-500">
                      Catatan
                    </p>

                    <p className="mt-1 text-sm text-zinc-300">
                      {latestWorkout.notes}
                    </p>
                  </div>
                )}

                <Link
                  href="/workout"
                  className="mt-5 inline-block text-sm font-medium text-red-400 hover:text-red-300"
                >
                  Lihat semua workout →
                </Link>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-sm text-zinc-500">
                  Belum ada workout yang tercatat.
                </p>

                <Link
                  href="/workout"
                  className="mt-4 inline-block text-sm font-medium text-red-400"
                >
                  Tambahkan workout →
                </Link>
              </div>
            )}
          </div>

          {/* QUICK ACTION */}

          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">

            <p className="text-sm text-zinc-400">
              Quick Action
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Tetap konsisten 💪
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Catat workout dan berat badan secara
              rutin supaya progress kamu bisa terlihat
              dengan jelas.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <Link
                href="/workout"
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-4 font-semibold text-white transition hover:bg-red-400 active:scale-[0.98]"
              >
                <span className="text-xl">＋</span>
                Add Workout
              </Link>

              <Link
                href="/weight"
                className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 px-5 py-4 font-semibold text-zinc-200 transition hover:bg-zinc-800 active:scale-[0.98]"
              >
                <span>⚖️</span>
                Add Weight
              </Link>

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}