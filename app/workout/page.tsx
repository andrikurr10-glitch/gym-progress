"use client";

import { useEffect, useState } from "react";
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
};

export default function WorkoutPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const [workoutDate, setWorkoutDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  // =========================
  // GET WORKOUTS
  // =========================
  const fetchWorkouts = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Kamu belum login.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user.id)
      .order("workout_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setWorkouts(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  // =========================
  // RESET FORM
  // =========================
  const resetForm = () => {
    setWorkoutDate(new Date().toISOString().split("T")[0]);
    setExerciseName("");
    setSets("");
    setReps("");
    setWeight("");
    setNotes("");
    setEditingId(null);
  };

  // =========================
  // SAVE / UPDATE WORKOUT
  // =========================
  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Session login tidak ditemukan. Silakan login lagi."
      );
      setSaving(false);
      return;
    }

    if (!exerciseName || !sets || !reps || weight === "") {
      setMessage(
        "Mohon isi Exercise, Sets, Reps, dan Weight."
      );
      setSaving(false);
      return;
    }

    // UPDATE
    if (editingId !== null) {
      const { error } = await supabase
        .from("workouts")
        .update({
          workout_date: workoutDate,
          exercise_name: exerciseName,
          sets: Number(sets),
          reps: Number(reps),
          weight: Number(weight),
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId)
        .eq("user_id", user.id);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage("Workout berhasil diperbarui! ✏️");
    }

    // INSERT
    else {
      const { error } = await supabase.from("workouts").insert({
        user_id: user.id,
        workout_date: workoutDate,
        exercise_name: exerciseName,
        sets: Number(sets),
        reps: Number(reps),
        weight: Number(weight),
        notes: notes || null,
      });

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage("Workout berhasil disimpan! 💪");
    }

    resetForm();
    setSaving(false);
    setShowForm(false);

    await fetchWorkouts();
  };

  // =========================
  // EDIT WORKOUT
  // =========================
  const handleEdit = (workout: Workout) => {
    setEditingId(workout.id);
    setWorkoutDate(workout.workout_date);
    setExerciseName(workout.exercise_name);
    setSets(String(workout.sets));
    setReps(String(workout.reps));
    setWeight(String(workout.weight));
    setNotes(workout.notes || "");

    setMessage("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // DELETE WORKOUT
  // =========================
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Yakin mau menghapus workout ini?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Session login tidak ditemukan.");
      setDeletingId(null);
      return;
    }

    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
      setDeletingId(null);
      return;
    }

    setMessage("Workout berhasil dihapus. 🗑️");

    setDeletingId(null);

    await fetchWorkouts();
  };

  // =========================
  // TODAY
  // =========================
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const todayWorkouts = workouts.filter(
    (workout) => workout.workout_date === today
  );

  return (
    <main className="min-h-screen bg-transparent px-4 pb-28 pt-5 text-white lg:pb-10">
      <div className="mx-auto w-full max-w-7xl">

        {/* NAVIGATION */}
        <AppNav />

        {/* HEADER */}
        <header className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
          <div>
            <p className="text-xs font-medium tracking-wider text-red-400 sm:text-sm">
              TRAINING
            </p>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Workout
            </h1>

            <p className="mt-1 text-sm text-zinc-400">
              Catat dan kelola latihanmu.
            </p>
          </div>

          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              }

              setShowForm(!showForm);
            }}
            className="shrink-0 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400 active:scale-[0.98]"
          >
            {showForm
              ? "Close"
              : "+ Add Workout"}
          </button>
        </header>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 text-sm text-zinc-300 backdrop-blur-sm">
            {message}
          </div>
        )}

        {/* FORM */}
        {showForm && (
          <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">

            <div className="mb-5">
              <p className="text-xs font-medium text-red-400">
                {editingId !== null
                  ? "EDIT DATA"
                  : "NEW SESSION"}
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {editingId !== null
                  ? "Edit Workout"
                  : "Add Workout"}
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                {editingId !== null
                  ? "Perbarui data latihan kamu."
                  : "Catat latihan yang kamu lakukan."}
              </p>
            </div>

            <form
              onSubmit={handleSaveWorkout}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >

              {/* DATE */}
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Date
                </label>

                <input
                  type="date"
                  value={workoutDate}
                  onChange={(e) =>
                    setWorkoutDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white outline-none transition focus:border-red-500"
                />
              </div>

              {/* EXERCISE */}
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Exercise
                </label>

                <select
                  value={exerciseName}
                  onChange={(e) =>
                    setExerciseName(e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white outline-none transition focus:border-red-500"
                >
                  <option value="" disabled>
                    Select exercise
                  </option>

                  <option>Bench Press</option>
                  <option>Squat</option>
                  <option>Deadlift</option>
                  <option>Shoulder Press</option>
                  <option>Lat Pulldown</option>
                  <option>Barbell Row</option>
                  <option>Bicep Curl</option>
                  <option>Tricep Pushdown</option>
                  <option>Leg Press</option>
                  <option>Leg Curl</option>
                  <option>Other</option>
                </select>
              </div>

              {/* SETS */}
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Sets
                </label>

                <input
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(e) =>
                    setSets(e.target.value)
                  }
                  placeholder="3"
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white placeholder-zinc-600 outline-none transition focus:border-red-500"
                />
              </div>

              {/* REPS */}
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Reps
                </label>

                <input
                  type="number"
                  min="1"
                  value={reps}
                  onChange={(e) =>
                    setReps(e.target.value)
                  }
                  placeholder="10"
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white placeholder-zinc-600 outline-none transition focus:border-red-500"
                />
              </div>

              {/* WEIGHT */}
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Weight
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={weight}
                    onChange={(e) =>
                      setWeight(e.target.value)
                    }
                    placeholder="40"
                    required
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 pr-12 text-white placeholder-zinc-600 outline-none transition focus:border-red-500"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                    kg
                  </span>
                </div>
              </div>

              {/* NOTES */}
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Notes
                </label>

                <input
                  type="text"
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  placeholder="Contoh: terakhir cukup berat"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white placeholder-zinc-600 outline-none transition focus:border-red-500"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-red-500 px-5 py-3.5 font-semibold text-white transition hover:bg-red-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Update Workout"
                    : "Save Workout"}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="rounded-xl border border-zinc-700 px-5 py-3.5 font-semibold text-zinc-300 transition hover:border-red-500/40 hover:bg-zinc-800 hover:text-red-400"
                  >
                    Cancel
                  </button>
                )}

              </div>
            </form>
          </section>
        )}

        {/* TODAY'S WORKOUT */}
        <section className="mb-6">

          <div className="mb-4 flex items-center justify-between gap-4">

            <div>
              <p className="text-xs font-medium text-red-400">
                TODAY
              </p>

              <h2 className="text-xl font-semibold">
                Today's Workout
              </h2>
            </div>

            <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-xs text-zinc-400">
              {todayWorkouts.length} exercises
            </span>

          </div>

          {loading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 text-center text-sm text-zinc-500 backdrop-blur-sm">
              Loading workout...
            </div>
          ) : todayWorkouts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/70 p-8 text-center backdrop-blur-sm">

              <div className="text-4xl">
                🏋️
              </div>

              <p className="mt-4 text-zinc-300">
                Belum ada workout hari ini.
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Klik Add Workout untuk mencatat latihan.
              </p>

            </div>
          ) : (
            <div className="space-y-3">

              {todayWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 backdrop-blur-sm"
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    {/* WORKOUT INFO */}
                    <div className="min-w-0">

                      <p className="text-xs font-medium uppercase tracking-wider text-red-400">
                        Exercise
                      </p>

                      <h3 className="mt-1 font-semibold">
                        {workout.exercise_name}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-500">
                        {workout.notes ||
                          "No notes"}
                      </p>

                    </div>

                    {/* STATS + ACTIONS */}
                    <div className="flex items-center justify-between gap-4 sm:justify-end">

                      <div className="text-right">
                        <p className="font-semibold">
                          {workout.weight} kg
                        </p>

                        <p className="text-xs text-zinc-500">
                          {workout.sets} ×{" "}
                          {workout.reps}
                        </p>
                      </div>

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            handleEdit(workout)
                          }
                          className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-red-500/40 hover:bg-zinc-800 hover:text-red-400"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              workout.id
                            )
                          }
                          disabled={
                            deletingId ===
                            workout.id
                          }
                          className="rounded-xl border border-red-900/50 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-950/40 disabled:opacity-50"
                        >
                          {deletingId ===
                          workout.id
                            ? "..."
                            : "Delete"}
                        </button>

                      </div>

                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}