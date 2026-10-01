"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";

type WeightLog = {
  id: number;
  weight: number;
  record_date: string;
  notes: string | null;
};

type WeightPoint = {
  date: string;
  weight: number;
};

export default function WeightPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [weight, setWeight] = useState("");
  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState("");

  // =========================
  // FETCH DATA
  // =========================

  const fetchWeightLogs = async () => {
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
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("record_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setWeightLogs(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchWeightLogs();
  }, []);

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setWeight("");
    setRecordDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setEditingId(null);
  };

  // =========================
  // SAVE
  // =========================

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!weight || Number(weight) <= 0) {
      setMessage("Masukkan berat badan yang valid.");
      return;
    }

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Session login tidak ditemukan.");
      setSaving(false);
      return;
    }

    // UPDATE
    if (editingId !== null) {
      const { error } = await supabase
        .from("weight_logs")
        .update({
          weight: Number(weight),
          record_date: recordDate,
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

      setMessage("Data berat badan berhasil diperbarui! ✏️");
    }

    // INSERT
    else {
      const { error } = await supabase
        .from("weight_logs")
        .insert({
          user_id: user.id,
          weight: Number(weight),
          record_date: recordDate,
          notes: notes || null,
        });

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage("Berat badan berhasil disimpan! ⚖️");
    }

    resetForm();
    setShowForm(false);
    setSaving(false);

    await fetchWeightLogs();
  };

  // =========================
  // EDIT
  // =========================

  const handleEdit = (item: WeightLog) => {
    setEditingId(item.id);
    setWeight(String(item.weight));
    setRecordDate(item.record_date);
    setNotes(item.notes || "");

    setMessage("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Yakin mau menghapus data berat badan ini?"
    );

    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Session login tidak ditemukan.");
      return;
    }

    const { error } = await supabase
      .from("weight_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Data berat badan berhasil dihapus. 🗑️");

    await fetchWeightLogs();
  };

  // =========================
  // CURRENT WEIGHT
  // =========================

  const currentWeight =
    weightLogs.length > 0
      ? weightLogs[0].weight
      : 0;

  // =========================
  // STARTING WEIGHT
  // =========================

  const startingWeight =
    weightLogs.length > 0
      ? weightLogs[weightLogs.length - 1].weight
      : 0;

  // =========================
  // WEIGHT CHANGE
  // =========================

  const weightChange =
    currentWeight - startingWeight;

  // =========================
  // GRAPH DATA
  // =========================

  const graphData = useMemo<WeightPoint[]>(() => {
    return [...weightLogs]
      .reverse()
      .map((item) => ({
        date: item.record_date,
        weight: Number(item.weight),
      }));
  }, [weightLogs]);

  // =========================
  // GRAPH SETTINGS
  // =========================

  const graphWidth = 800;
  const graphHeight = 320;

  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 30;
  const paddingBottom = 55;

  const innerWidth =
    graphWidth - paddingLeft - paddingRight;

  const innerHeight =
    graphHeight - paddingTop - paddingBottom;

  const maxWeight =
    graphData.length > 0
      ? Math.max(...graphData.map((item) => item.weight))
      : 0;

  const minWeight =
    graphData.length > 0
      ? Math.min(...graphData.map((item) => item.weight))
      : 0;

  const graphMax =
    maxWeight > 0
      ? Math.ceil(maxWeight + 2)
      : 10;

  const graphMin =
    minWeight > 0
      ? Math.max(0, Math.floor(minWeight - 2))
      : 0;

  const weightRange =
    graphMax - graphMin || 1;

  const getX = (index: number) => {
    if (graphData.length === 1) {
      return paddingLeft + innerWidth / 2;
    }

    return (
      paddingLeft +
      (index / (graphData.length - 1)) *
        innerWidth
    );
  };

  const getY = (value: number) => {
    return (
      paddingTop +
      innerHeight -
      ((value - graphMin) / weightRange) *
        innerHeight
    );
  };

  const graphPoints = graphData
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

  return (
    <main className="min-h-screen bg-transparent text-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">

        {/* =========================
            NAVIGATION
        ========================= */}

        <AppNav />

        {/* =========================
            HEADER
        ========================= */}

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-red-400">
              BODY WEIGHT
            </p>

            <h1 className="text-3xl font-bold">
              Weight Tracking
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Catat dan pantau perubahan berat badan kamu.
            </p>
          </div>

          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              }

              setShowForm(!showForm);
            }}
            className="w-full shrink-0 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400 sm:w-auto"
          >
            {showForm ? "Close" : "+ Add Weight"}
          </button>
        </header>

        {/* =========================
            MESSAGE
        ========================= */}

        {message && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 text-sm text-zinc-300 backdrop-blur-sm">
            {message}
          </div>
        )}

        {/* =========================
            FORM
        ========================= */}

        {showForm && (
          <section className="mb-6 rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">

            <div className="mb-5">
              <h2 className="text-xl font-bold">
                {editingId !== null
                  ? "Edit Weight"
                  : "Add Weight"}
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Masukkan berat badan kamu.
              </p>
            </div>

            <form
              onSubmit={handleSave}
              className="grid gap-4 sm:grid-cols-2"
            >

              {/* WEIGHT */}

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Weight
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={weight}
                    onChange={(e) =>
                      setWeight(e.target.value)
                    }
                    placeholder="68.5"
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 px-4 py-3 pr-12 text-white outline-none transition focus:border-red-500"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                    kg
                  </span>
                </div>
              </div>

              {/* DATE */}

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Date
                </label>

                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) =>
                    setRecordDate(e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 px-4 py-3 text-white outline-none transition focus:border-red-500"
                />
              </div>

              {/* NOTES */}

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm text-zinc-400">
                  Notes
                </label>

                <input
                  type="text"
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  placeholder="Contoh: setelah bangun tidur"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/90 px-4 py-3 text-white placeholder-zinc-600 outline-none transition focus:border-red-500"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-red-500 px-5 py-3.5 font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Update Weight"
                    : "Save Weight"}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="rounded-xl border border-zinc-700 px-5 py-3.5 font-semibold text-zinc-300 transition hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                )}

              </div>

            </form>
          </section>
        )}

        {/* =========================
            STATISTICS
        ========================= */}

        <div className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-6 backdrop-blur-sm">
            <p className="text-sm text-zinc-500">
              Current Weight
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {currentWeight}
              <span className="ml-1 text-base font-normal text-zinc-500">
                kg
              </span>
            </h2>
          </div>

          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-6 backdrop-blur-sm">
            <p className="text-sm text-zinc-500">
              Starting Weight
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {startingWeight}
              <span className="ml-1 text-base font-normal text-zinc-500">
                kg
              </span>
            </h2>
          </div>

          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-6 backdrop-blur-sm">
            <p className="text-sm text-zinc-500">
              Change
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {weightChange > 0 ? "+" : ""}
              {weightChange.toFixed(1)}
              <span className="ml-1 text-base font-normal text-zinc-500">
                kg
              </span>
            </h2>
          </div>

        </div>

        {/* =========================
            GRAPH
        ========================= */}

        <section className="mt-6 rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">

          <div className="mb-6">
            <p className="text-xs text-red-400">
              WEIGHT PROGRESS
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Weight History
            </h2>
          </div>

          {graphData.length === 0 ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl bg-zinc-950/90">
              <div className="text-center">
                <p className="text-zinc-400">
                  Belum ada data berat badan.
                </p>

                <p className="mt-1 text-sm text-zinc-600">
                  Klik Add Weight untuk mulai mencatat.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-zinc-950/90 p-2 sm:p-4">

              <svg
                viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                className="h-auto w-full"
                preserveAspectRatio="xMidYMid meet"
              >

                {/* GRID */}

                {[0, 1, 2, 3, 4].map((index) => {
                  const y =
                    paddingTop +
                    (index / 4) *
                      innerHeight;

                  const value =
                    graphMax -
                    (index / 4) *
                      weightRange;

                  return (
                    <g key={index}>
                      <line
                        x1={paddingLeft}
                        x2={
                          graphWidth -
                          paddingRight
                        }
                        y1={y}
                        y2={y}
                        stroke="currentColor"
                        className="text-zinc-800"
                      />

                      <text
                        x={paddingLeft - 10}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-zinc-600 text-[11px]"
                      >
                        {value.toFixed(0)}
                      </text>
                    </g>
                  );
                })}

                {/* LINE */}

                {graphData.length > 1 && (
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

                {/* POINTS */}

                {graphData.map((item, index) => {
                  const x = getX(index);
                  const y = getY(item.weight);

                  return (
                    <g key={`${item.date}-${index}`}>

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
                        {formatDate(item.date)} -{" "}
                        {item.weight} kg
                      </title>

                      <text
                        x={x}
                        y={y - 16}
                        textAnchor="middle"
                        className="fill-white text-[11px] font-medium"
                      >
                        {item.weight} kg
                      </text>

                      {(graphData.length <= 6 ||
                        index === 0 ||
                        index ===
                          graphData.length - 1) && (
                        <text
                          x={x}
                          y={
                            graphHeight -
                            paddingBottom +
                            25
                          }
                          textAnchor="middle"
                          className="fill-zinc-600 text-[11px]"
                        >
                          {formatDate(item.date)}
                        </text>
                      )}

                    </g>
                  );
                })}

              </svg>

            </div>
          )}

        </section>

        {/* =========================
            HISTORY
        ========================= */}

        <section className="mt-6 rounded-3xl border border-zinc-800/80 bg-zinc-900/90 p-5 backdrop-blur-sm sm:p-6">

          <div className="mb-5">
            <p className="text-xs text-red-400">
              HISTORY
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Weight History
            </h2>
          </div>

          {loading ? (
            <p className="text-zinc-500">
              Loading...
            </p>
          ) : weightLogs.length === 0 ? (
            <div className="rounded-2xl bg-zinc-950/90 p-6 text-center">
              <p className="text-zinc-500">
                Belum ada data berat badan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">

              {weightLogs.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl bg-zinc-950/90 p-4 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div>
                    <h3 className="font-semibold">
                      {item.weight} kg
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      {formatDate(item.record_date)}
                    </p>

                    {item.notes && (
                      <p className="mt-1 text-xs text-zinc-600">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        handleEdit(item)
                      }
                      className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(item.id)
                      }
                      className="rounded-xl border border-red-900/50 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-950/40"
                    >
                      Delete
                    </button>

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