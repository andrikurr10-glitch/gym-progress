"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AppNav from "@/components/AppNav";

type Target = {
  id: number;
  target_name: string;
  target_type: string;
  target_value: number;
  start_value: number;
  deadline: string | null;
};

type WeightLog = {
  weight: number;
  record_date: string;
};

export default function TargetPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [targetName, setTargetName] = useState("Target Berat Badan");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const [{ data: targetData }, { data: weightData }] =
      await Promise.all([
        supabase
          .from("targets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("weight_logs")
          .select("weight, record_date")
          .eq("user_id", user.id)
          .order("record_date", { ascending: true }),
      ]);

    setTargets(targetData || []);
    setWeights(weightData || []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const currentWeight = useMemo(() => {
    if (weights.length === 0) return null;

    return Number(weights[weights.length - 1].weight);
  }, [weights]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!targetValue) {
      alert("Masukkan target berat badan.");
      return;
    }

    if (!currentWeight) {
      alert("Tambahkan data berat badan terlebih dahulu.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Silakan login terlebih dahulu.");
      return;
    }

    const payload = {
      target_name: targetName,
      target_type: "body_weight",
      target_value: Number(targetValue),
      start_value: currentWeight,
      deadline: deadline || null,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from("targets")
        .update(payload)
        .eq("id", editingId)
        .eq("user_id", user.id);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("targets").insert({
        ...payload,
        user_id: user.id,
      });

      if (error) {
        alert(error.message);
        return;
      }
    }

    resetForm();
    loadData();
  }

  function startEdit(target: Target) {
    setEditingId(target.id);
    setTargetName(target.target_name);
    setTargetValue(String(target.target_value));
    setDeadline(target.deadline || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id: number) {
    const confirmDelete = confirm(
      "Yakin ingin menghapus target ini?"
    );

    if (!confirmDelete) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("targets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  }

  function resetForm() {
    setEditingId(null);
    setTargetName("Target Berat Badan");
    setTargetValue("");
    setDeadline("");
  }

  function calculateProgress(target: Target) {
    if (!currentWeight) return 0;

    const start = Number(target.start_value);
    const targetWeight = Number(target.target_value);
    const current = Number(currentWeight);

    if (start === targetWeight) return 100;

    const totalDistance = targetWeight - start;
    const currentDistance = current - start;

    let progress =
      (currentDistance / totalDistance) * 100;

    if (totalDistance < 0) {
      progress =
        ((start - current) / (start - targetWeight)) * 100;
    }

    return Math.min(100, Math.max(0, progress));
  }

  function getRemaining(target: Target) {
    if (!currentWeight) return null;

    const difference =
      Number(target.target_value) - Number(currentWeight);

    return difference;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-transparent px-4 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <AppNav />

          <p className="text-zinc-400">
            Loading target...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 pb-28 pt-6 text-white lg:pb-10">
      <div className="mx-auto max-w-7xl">

        {/* NAVIGATION */}
        <AppNav />

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-sm font-medium text-red-400">
            Gym Progress
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Target
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Tentukan target dan pantau progresmu.
          </p>
        </div>

        {/* CURRENT WEIGHT */}
        <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 backdrop-blur-sm">
          <p className="text-sm text-zinc-400">
            Berat Saat Ini
          </p>

          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-bold">
              {currentWeight ?? "-"}
            </span>

            <span className="pb-1 text-zinc-400">
              kg
            </span>
          </div>

          {!currentWeight && (
            <Link
              href="/weight"
              className="mt-4 inline-block text-sm font-medium text-red-400 transition hover:text-red-300"
            >
              + Tambahkan berat badan
            </Link>
          )}
        </section>

        {/* FORM */}
        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 backdrop-blur-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit Target" : "Buat Target"}
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Target dimulai dari berat badanmu saat ini.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2"
          >
            {/* NAMA TARGET */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-zinc-400">
                Nama Target
              </label>

              <input
                type="text"
                value={targetName}
                onChange={(e) =>
                  setTargetName(e.target.value)
                }
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 outline-none transition focus:border-red-500"
              />
            </div>

            {/* TARGET BERAT */}
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Target Berat (kg)
              </label>

              <input
                type="number"
                step="0.1"
                min="0"
                value={targetValue}
                onChange={(e) =>
                  setTargetValue(e.target.value)
                }
                placeholder="Contoh: 75"
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 outline-none transition focus:border-red-500"
              />
            </div>

            {/* DEADLINE */}
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Deadline
              </label>

              <input
                type="date"
                value={deadline}
                onChange={(e) =>
                  setDeadline(e.target.value)
                }
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-white outline-none transition focus:border-red-500"
              />
            </div>

            {/* BUTTON */}
            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400 active:scale-[0.98]"
              >
                {editingId
                  ? "Update Target"
                  : "Simpan Target"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-300 transition hover:bg-zinc-800"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </section>

        {/* TARGET LIST */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Target Saya
            </h2>

            <span className="text-sm text-zinc-500">
              {targets.length} target
            </span>
          </div>

          {targets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/70 p-8 text-center backdrop-blur-sm">
              <div className="text-4xl">🎯</div>

              <h3 className="mt-4 font-semibold">
                Belum ada target
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Buat target berat badan pertamamu di atas.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {targets.map((target) => {
                const progress =
                  calculateProgress(target);

                const remaining =
                  getRemaining(target);

                return (
                  <article
                    key={target.id}
                    className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 backdrop-blur-sm"
                  >
                    {/* TITLE */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-red-400">
                          Body Weight
                        </p>

                        <h3 className="mt-1 text-xl font-semibold">
                          {target.target_name}
                        </h3>
                      </div>

                      <span className="text-2xl font-bold text-red-400">
                        {Math.round(progress)}%
                      </span>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="mt-5">
                      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* WEIGHT INFO */}
                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-zinc-950/80 p-3">
                        <p className="text-xs text-zinc-500">
                          Mulai
                        </p>

                        <p className="mt-1 font-semibold">
                          {target.start_value} kg
                        </p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950/80 p-3">
                        <p className="text-xs text-zinc-500">
                          Sekarang
                        </p>

                        <p className="mt-1 font-semibold">
                          {currentWeight} kg
                        </p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950/80 p-3">
                        <p className="text-xs text-zinc-500">
                          Target
                        </p>

                        <p className="mt-1 font-semibold">
                          {target.target_value} kg
                        </p>
                      </div>
                    </div>

                    {/* REMAINING */}
                    {remaining !== null && (
                      <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                        {Math.abs(remaining) < 0.01 ? (
                          <p className="font-medium text-red-400">
                            🎉 Target tercapai!
                          </p>
                        ) : remaining > 0 ? (
                          <p className="text-sm text-zinc-300">
                            Tinggal{" "}
                            <span className="font-semibold text-red-400">
                              {Math.abs(remaining).toFixed(1)} kg
                            </span>{" "}
                            lagi untuk mencapai target.
                          </p>
                        ) : (
                          <p className="text-sm text-zinc-300">
                            Kamu sudah{" "}
                            <span className="font-semibold text-red-400">
                              {Math.abs(remaining).toFixed(1)} kg
                            </span>{" "}
                            di atas target.
                          </p>
                        )}
                      </div>
                    )}

                    {/* DEADLINE */}
                    {target.deadline && (
                      <p className="mt-4 text-sm text-zinc-500">
                        Deadline:{" "}
                        <span className="text-zinc-300">
                          {new Date(
                            target.deadline + "T00:00:00"
                          ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </p>
                    )}

                    {/* ACTIONS */}
                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() =>
                          startEdit(target)
                        }
                        className="flex-1 rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-red-500/40 hover:bg-zinc-800 hover:text-red-400"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(target.id)
                        }
                        className="flex-1 rounded-2xl border border-red-900/50 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-950/40"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}