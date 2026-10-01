"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";

type Workout = {
  id: number;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  workout_date: string;
  notes: string | null;
};

type ProgressPoint = {
  date: string;
  weight: number;
};

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");

  // =========================
  // EDIT STATE
  // =========================
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [workoutDate, setWorkoutDate] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // =========================
  // GET WORKOUT DATA
  // =========================
  const fetchData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", user.id)
      .order("workout_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (!error) {
      setWorkouts(data || []);
    } else {
      setMessage(error.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =========================
  // RESET EDIT FORM
  // =========================
  const resetEditForm = () => {
    setEditingId(null);
    setWorkoutDate("");
    setExerciseName("");
    setSets("");
    setReps("");
    setWeight("");
    setNotes("");
    setShowEditForm(false);
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
    setShowEditForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // UPDATE WORKOUT
  // =========================
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId === null) return;

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Session login tidak ditemukan. Silakan login lagi.");
      setSaving(false);
      return;
    }

    if (!exerciseName || !sets || !reps || weight === "") {
      setMessage("Mohon isi Exercise, Sets, Reps, dan Weight.");
      setSaving(false);
      return;
    }

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

    resetEditForm();
    setSaving(false);

    await fetchData();
  };

  // =========================
  // DELETE WORKOUT
  // =========================
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Yakin ingin menghapus workout ini?\n\nData yang dihapus tidak dapat dikembalikan."
    );

    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Session login tidak ditemukan. Silakan login lagi.");
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

    await fetchData();
  };

  // =========================
  // EXERCISE LIST
  // =========================
  const exerciseList = useMemo(() => {
    return Array.from(
      new Set(workouts.map((workout) => workout.exercise_name))
    );
  }, [workouts]);

  useEffect(() => {
    if (
      exerciseList.length > 0 &&
      !exerciseList.includes(selectedExercise)
    ) {
      setSelectedExercise(exerciseList[0]);
    }

    if (exerciseList.length === 0) {
      setSelectedExercise("");
    }
  }, [exerciseList, selectedExercise]);

  // =========================
  // TOTAL SESSIONS
  // =========================
  const uniqueDates = new Set(
    workouts.map((workout) => workout.workout_date)
  );

  const totalSessions = uniqueDates.size;

  // =========================
  // TOTAL VOLUME
  // =========================
  const totalVolume = workouts.reduce((total, item) => {
    return total + item.sets * item.reps * item.weight;
  }, 0);

  // =========================
  // EXERCISE COUNT
  // =========================
  const exerciseCount: Record<string, number> = {};

  workouts.forEach((item) => {
    exerciseCount[item.exercise_name] =
      (exerciseCount[item.exercise_name] || 0) + 1;
  });

  const mostTrained =
    Object.entries(exerciseCount).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || "-";

  const exerciseTypes = exerciseList.length;

  // =========================
  // SELECTED EXERCISE DATA
  // =========================
  const selectedWorkouts = useMemo(() => {
    return workouts.filter(
      (workout) => workout.exercise_name === selectedExercise
    );
  }, [workouts, selectedExercise]);

  // =========================
  // GRAPH DATA
  // =========================
  const progressData = useMemo<ProgressPoint[]>(() => {
    const grouped: Record<string, number> = {};

    selectedWorkouts.forEach((workout) => {
      if (
        grouped[workout.workout_date] === undefined ||
        workout.weight > grouped[workout.workout_date]
      ) {
        grouped[workout.workout_date] = workout.weight;
      }
    });

    return Object.entries(grouped)
      .map(([date, weight]) => ({
        date,
        weight,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedWorkouts]);

  // =========================
  // PERSONAL BEST
  // =========================
  const personalBest =
    selectedWorkouts.length > 0
      ? Math.max(
          ...selectedWorkouts.map((item) => item.weight)
        )
      : 0;

  // =========================
  // LAST WORKOUT
  // =========================
  const lastWorkout =
    selectedWorkouts.length > 0
      ? selectedWorkouts[selectedWorkouts.length - 1]
      : null;

  // =========================
  // GRAPH SETTINGS
  // =========================
  const graphWidth = 800;
  const graphHeight = 320;

  const graphPaddingLeft = 55;
  const graphPaddingRight = 25;
  const graphPaddingTop = 30;
  const graphPaddingBottom = 55;

  const graphInnerWidth =
    graphWidth -
    graphPaddingLeft -
    graphPaddingRight;

  const graphInnerHeight =
    graphHeight -
    graphPaddingTop -
    graphPaddingBottom;

  const maxWeight =
    progressData.length > 0
      ? Math.max(
          ...progressData.map((item) => item.weight)
        )
      : 0;

  const graphMaxWeight =
    maxWeight > 0
      ? Math.ceil(maxWeight * 1.2)
      : 10;

  const getX = (index: number) => {
    if (progressData.length === 1) {
      return (
        graphPaddingLeft +
        graphInnerWidth / 2
      );
    }

    return (
      graphPaddingLeft +
      (index /
        (progressData.length - 1)) *
        graphInnerWidth
    );
  };

  const getY = (weight: number) => {
    return (
      graphPaddingTop +
      graphInnerHeight -
      (weight / graphMaxWeight) *
        graphInnerHeight
    );
  };

  const graphPoints = progressData
    .map((item, index) => {
      return `${getX(index)},${getY(item.weight)}`;
    })
    .join(" ");

  // =========================
  // DATE FORMAT
  // =========================
  const formatDate = (date: string) => {
    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <main className="min-h-screen bg-transparent px-4 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <AppNav />

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 text-sm text-zinc-400 backdrop-blur-sm">
            Loading progress...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 pb-28 pt-6 text-white lg:pb-10">
      <div className="mx-auto w-full max-w-7xl">

        {/* NAVIGATION */}
        <AppNav />

        {/* HEADER */}
        <header className="mb-8">
          <p className="text-sm font-medium text-red-400">
            YOUR DATA
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Progress
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Lihat perkembangan latihan kamu berdasarkan data workout.
          </p>
        </header>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 text-sm text-zinc-300 backdrop-blur-sm">
            {message}
          </div>
        )}

        {/* EDIT FORM */}
        {showEditForm && (
          <section className="mb-6 rounded-3xl border border-red-900/50 bg-zinc-900/95 p-5 backdrop-blur-sm sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-medium text-red-400">
                EDIT DATA
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Edit Workout
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                Perbarui data latihan kamu.
              </p>
            </div>

            <form
              onSubmit={handleUpdate}
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
                  required
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
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white outline-none transition focus:border-red-500"
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
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white outline-none transition focus:border-red-500"
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
                    required
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 pr-12 text-white outline-none transition focus:border-red-500"
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
                  placeholder="Catatan workout"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white placeholder-zinc-600 outline-none transition focus:border-red-500"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-red-500 px-5 py-3.5 font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : "Update Workout"}
                </button>

                <button
                  type="button"
                  onClick={resetEditForm}
                  className="rounded-xl border border-zinc-700 px-5 py-3.5 font-semibold text-zinc-300 transition hover:border-red-500/40 hover:bg-zinc-800 hover:text-red-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* STATISTICS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Sessions */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">
            <p className="text-sm text-zinc-400">
              Total Sessions
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {totalSessions}
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Hari latihan
            </p>
          </div>

          {/* Volume */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">
            <p className="text-sm text-zinc-400">
              Total Volume
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {totalVolume.toLocaleString("id-ID")}

              <span className="ml-1 text-base font-normal text-zinc-500">
                kg
              </span>
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Sets × reps × weight
            </p>
          </div>

          {/* Most Trained */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">
            <p className="text-sm text-zinc-400">
              Most Trained
            </p>

            <h2 className="mt-2 truncate text-2xl font-bold">
              {mostTrained}
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Exercise paling sering
            </p>
          </div>

          {/* Exercise Types */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">
            <p className="text-sm text-zinc-400">
              Exercise Types
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {exerciseTypes}
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Jenis exercise
            </p>
          </div>

        </div>

        {/* PROGRESS GRAPH */}
        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-xs font-medium text-red-400">
                STRENGTH PROGRESS
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Exercise Progress
              </h2>
            </div>

            {exerciseList.length > 0 && (
              <div className="w-full sm:w-56">
                <label className="mb-2 block text-xs text-zinc-400">
                  Choose Exercise
                </label>

                <select
                  value={selectedExercise}
                  onChange={(e) =>
                    setSelectedExercise(e.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-red-500"
                >
                  {exerciseList.map((exercise) => (
                    <option
                      key={exercise}
                      value={exercise}
                    >
                      {exercise}
                    </option>
                  ))}
                </select>
              </div>
            )}

          </div>

          {progressData.length === 0 ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl bg-zinc-950/80">
              <div className="text-center">
                <p className="text-zinc-400">
                  Belum ada data progress.
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Tambahkan workout terlebih dahulu.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full overflow-hidden rounded-2xl bg-zinc-950/80 p-2 sm:p-4">

              <div className="w-full">
                <svg
                  viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                  className="h-auto w-full"
                  preserveAspectRatio="xMidYMid meet"
                >

                  {/* GRID */}
                  {[0, 1, 2, 3, 4].map(
                    (index) => {
                      const y =
                        graphPaddingTop +
                        (index / 4) *
                          graphInnerHeight;

                      const value =
                        graphMaxWeight -
                        (index / 4) *
                          graphMaxWeight;

                      return (
                        <g key={index}>

                          <line
                            x1={graphPaddingLeft}
                            x2={
                              graphWidth -
                              graphPaddingRight
                            }
                            y1={y}
                            y2={y}
                            stroke="currentColor"
                            className="text-zinc-800"
                            strokeWidth="1"
                          />

                          <text
                            x={
                              graphPaddingLeft -
                              10
                            }
                            y={y + 4}
                            textAnchor="end"
                            className="fill-zinc-600 text-[11px]"
                          >
                            {Math.round(value)}
                          </text>

                        </g>
                      );
                    }
                  )}

                  {/* GRAPH LINE */}
                  {progressData.length > 1 && (
                    <polyline
                      points={graphPoints}
                      fill="none"
                      stroke="currentColor"
                      className="text-red-400"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* DATA POINTS */}
                  {progressData.map(
                    (item, index) => {
                      const x = getX(index);
                      const y = getY(
                        item.weight
                      );

                      return (
                        <g key={item.date}>

                          <circle
                            cx={x}
                            cy={y}
                            r="7"
                            className="fill-red-400"
                          />

                          <circle
                            cx={x}
                            cy={y}
                            r="12"
                            fill="none"
                            className="stroke-red-400/20"
                            strokeWidth="2"
                          />

                          <title>
                            {formatDate(
                              item.date
                            )}{" "}
                            - {item.weight} kg
                          </title>

                          <text
                            x={x}
                            y={y - 16}
                            textAnchor="middle"
                            className="fill-white text-[11px] font-medium"
                          >
                            {item.weight} kg
                          </text>

                          {(progressData.length <=
                            6 ||
                            index === 0 ||
                            index ===
                              progressData.length - 1 ||
                            index ===
                              Math.floor(
                                progressData.length / 2
                              )) && (
                            <text
                              x={x}
                              y={
                                graphHeight -
                                graphPaddingBottom +
                                25
                              }
                              textAnchor="middle"
                              className="fill-zinc-600 text-[11px]"
                            >
                              {formatDate(
                                item.date
                              )}
                            </text>
                          )}

                        </g>
                      );
                    }
                  )}

                </svg>
              </div>

            </div>
          )}

        </section>

        {/* PERSONAL BEST + LAST WORKOUT */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">

          {/* Personal Best */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 backdrop-blur-sm">

            <p className="text-xs font-medium text-red-400">
              PERSONAL BEST
            </p>

            <div className="mt-4 flex items-end justify-between">

              <div>
                <h2 className="text-2xl font-bold">
                  {selectedExercise || "-"}
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Beban tertinggi
                </p>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold text-red-400">
                  {personalBest}

                  <span className="ml-1 text-base font-normal text-zinc-500">
                    kg
                  </span>
                </p>
              </div>

            </div>

          </div>

          {/* Last Workout */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 backdrop-blur-sm">

            <p className="text-xs font-medium text-red-400">
              LAST WORKOUT
            </p>

            {lastWorkout ? (
              <div className="mt-4 flex items-end justify-between">

                <div>
                  <h2 className="text-2xl font-bold">
                    {lastWorkout.exercise_name}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    {formatDate(
                      lastWorkout.workout_date
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold">
                    {lastWorkout.weight} kg
                  </p>

                  <p className="text-sm text-zinc-500">
                    {lastWorkout.sets} ×{" "}
                    {lastWorkout.reps}
                  </p>
                </div>

              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                Belum ada workout.
              </p>
            )}

          </div>

        </div>

        {/* WORKOUT HISTORY */}
        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">

          <div className="mb-5">
            <p className="text-xs font-medium text-red-400">
              HISTORY
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Workout History
            </h2>
          </div>

          {workouts.length === 0 ? (
            <div className="rounded-2xl bg-zinc-950/80 p-6 text-center">
              <p className="text-zinc-500">
                Belum ada data workout.
              </p>
            </div>
          ) : (
            <div className="space-y-3">

              {[...workouts]
                .reverse()
                .map((workout) => (
                  <div
                    key={workout.id}
                    className="rounded-2xl bg-zinc-950/80 p-4"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      {/* INFO */}
                      <div className="min-w-0">
                        <h3 className="font-semibold">
                          {workout.exercise_name}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          {formatDate(
                            workout.workout_date
                          )}
                        </p>

                        {workout.notes && (
                          <p className="mt-1 truncate text-xs text-zinc-600">
                            {workout.notes}
                          </p>
                        )}
                      </div>

                      {/* RIGHT SIDE */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">

                        {/* VALUE */}
                        <div className="text-left sm:text-right">
                          <p className="font-semibold">
                            {workout.weight} kg
                          </p>

                          <p className="text-xs text-zinc-500">
                            {workout.sets} ×{" "}
                            {workout.reps}
                          </p>
                        </div>

                        {/* ACTION */}
                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              handleEdit(workout)
                            }
                            className="flex-1 rounded-xl border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:border-red-500/40 hover:bg-zinc-800 hover:text-red-400 sm:flex-none"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(workout.id)
                            }
                            disabled={
                              deletingId ===
                              workout.id
                            }
                            className="flex-1 rounded-xl border border-red-900/50 px-4 py-2 text-xs font-medium text-red-400 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
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