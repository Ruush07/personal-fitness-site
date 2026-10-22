"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { normalizeExercises, PlannedExercise } from "@/lib/trainer";
import { Sparkles, Plus, Trash2, Save, ListChecks, Loader2, Dumbbell } from "lucide-react";

type Routine = { id: string; routine_name: string; exercises: unknown; created_at?: string };

export default function RoutineBuilder() {
  const router = useRouter();
  const [routineName, setRoutineName] = useState("");
  const [exercises, setExercises] = useState<PlannedExercise[]>([{ name: "", sets: 3, reps: 10, weight: 0 }]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [goal, setGoal] = useState("build muscle");
  const [experience, setExperience] = useState("beginner");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [equipment, setEquipment] = useState("Full gym");
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchRoutines = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push("/login");
    const { data, error: fetchError } = await supabase.from("user_routines").select("*").order("created_at", { ascending: false });
    if (fetchError) setError("Could not load your routines. Check your Supabase connection and try again.");
    if (data) setRoutines(data as Routine[]);
  }, [router]);

  useEffect(() => { void Promise.resolve().then(fetchRoutines); }, [fetchRoutines]);

  const updateExercise = (index: number, field: keyof PlannedExercise, value: string | number) => {
    setExercises((current) => current.map((exercise, i) => i === index ? { ...exercise, [field]: value } : exercise));
  };

  const buildRoutine = async () => {
    setGenerating(true);
    setError("");
    setMessage("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const response = await fetch("/api/trainer/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ goal, experience, daysPerWeek, equipment, focus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not build a routine.");
      setRoutineName(result.routine_name);
      setExercises(normalizeExercises(result.exercises));
      setMessage("Your draft is ready. Review the exercises and save it when you are happy with it.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not build a routine. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const saveRoutine = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanExercises = exercises.filter((exercise) => exercise.name.trim());
    if (!routineName.trim() || cleanExercises.length === 0) {
      setError("Add a routine name and at least one exercise.");
      return;
    }
    setLoading(true);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return router.push("/login");
    }
    const { error: saveError } = await supabase.from("user_routines").insert([{
      user_id: session.user.id,
      routine_name: routineName.trim(),
      exercises: cleanExercises,
    }]);
    setLoading(false);
    if (saveError) {
      setError("Could not save the routine. Please check your connection and try again.");
      return;
    }
    setRoutineName("");
    setExercises([{ name: "", sets: 3, reps: 10, weight: 0 }]);
    setMessage("Routine saved to your account.");
    await fetchRoutines();
  };

  return (
    <div className="mx-auto max-w-6xl p-6 pb-24 text-neutral-100 md:p-12">
      <header className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Your training plan</p>
        <h1 className="flex items-center gap-3 text-3xl font-bold">Routine Builder <ListChecks className="text-blue-500" /></h1>
        <p className="mt-2 max-w-2xl text-neutral-400">Build a routine around your goal, experience, schedule, and available equipment. Review every AI suggestion before saving it.</p>
      </header>

      <section className="mb-6 rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold"><Sparkles className="text-blue-400" size={20} /> Personalize a new routine</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-neutral-400">Main goal
            <select value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-white">
              <option>build muscle</option><option>get stronger</option><option>general fitness</option><option>fat loss</option>
            </select>
          </label>
          <label className="text-sm text-neutral-400">Experience
            <select value={experience} onChange={(e) => setExperience(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-white">
              <option>beginner</option><option>intermediate</option><option>advanced</option>
            </select>
          </label>
          <label className="text-sm text-neutral-400">Training days each week
            <select value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-white">
              {[2, 3, 4, 5, 6].map((days) => <option key={days} value={days}>{days} days</option>)}
            </select>
          </label>
          <label className="text-sm text-neutral-400">Available equipment
            <input value={equipment} onChange={(e) => setEquipment(e.target.value)} maxLength={300} className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-white" placeholder="Full gym, dumbbells..." />
          </label>
        </div>
        <label className="mt-4 block text-sm text-neutral-400">Optional focus
          <input value={focus} onChange={(e) => setFocus(e.target.value)} maxLength={120} className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-white" placeholder="For example: improve squat strength" />
        </label>
        <button type="button" onClick={buildRoutine} disabled={generating || !equipment.trim()} className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-500 disabled:opacity-50">
          {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} {generating ? "Building your draft…" : "Build a routine with AI"}
        </button>
        <p className="mt-3 text-xs text-neutral-500">AI-generated training ideas are general guidance, not medical advice. Stop if anything causes pain.</p>
      </section>

      <form onSubmit={saveRoutine} className="mb-10 rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold"><Dumbbell className="text-blue-400" size={20} /> Review and save routine</h2>
        <input required value={routineName} onChange={(e) => setRoutineName(e.target.value)} maxLength={60} placeholder="Routine name, e.g. Full Body A" className="mb-5 w-full rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-lg font-bold text-white outline-none focus:border-blue-500" />
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 rounded-2xl border border-neutral-800 bg-neutral-950 p-3">
              <input aria-label="Exercise name" value={exercise.name} onChange={(e) => updateExercise(index, "name", e.target.value)} placeholder="Exercise name" className="col-span-12 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-white sm:col-span-5" />
              <label className="col-span-4 text-xs text-neutral-500">Sets<input type="number" min={1} max={10} value={exercise.sets} onChange={(e) => updateExercise(index, "sets", Number(e.target.value))} className="mt-1 w-full rounded-lg bg-neutral-900 p-2 text-center text-white" /></label>
              <label className="col-span-4 text-xs text-neutral-500">Reps<input type="number" min={1} max={30} value={exercise.reps} onChange={(e) => updateExercise(index, "reps", Number(e.target.value))} className="mt-1 w-full rounded-lg bg-neutral-900 p-2 text-center text-white" /></label>
              <label className="col-span-3 text-xs text-neutral-500">Rest sec<input type="number" min={0} max={600} value={exercise.restSeconds ?? 90} onChange={(e) => updateExercise(index, "restSeconds", Number(e.target.value))} className="mt-1 w-full rounded-lg bg-neutral-900 p-2 text-center text-white" /></label>
              <button type="button" aria-label="Remove exercise" onClick={() => setExercises((current) => current.filter((_, i) => i !== index))} className="col-span-1 self-end rounded-lg p-2 text-neutral-500 hover:text-red-400"><Trash2 size={18} /></button>
              {exercise.reason && <p className="col-span-12 px-1 text-xs text-neutral-500">{exercise.reason}</p>}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => setExercises((current) => [...current, { name: "", sets: 3, reps: 10, weight: 0 }])} className="flex items-center justify-center gap-2 rounded-xl bg-neutral-800 px-4 py-3 font-medium hover:bg-neutral-700"><Plus size={18} /> Add exercise</button>
          <button type="submit" disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold hover:bg-blue-500 disabled:opacity-50">{loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save routine</button>
        </div>
      </form>

      {message && <p role="status" className="mb-5 rounded-xl border border-green-800 bg-green-950/30 p-3 text-sm text-green-300">{message}</p>}
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-800 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}

      <h2 className="mb-4 text-xl font-bold">My saved routines</h2>
      {routines.length === 0 ? <p className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center text-neutral-500">Your saved routines will show up here.</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          {routines.map((routine) => {
            const list = normalizeExercises(routine.exercises);
            return <article key={routine.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <h3 className="text-lg font-bold text-blue-300">{routine.routine_name}</h3>
              <p className="mt-1 text-sm text-neutral-500">{list.length} exercises · {list.reduce((sum, item) => sum + item.sets, 0)} planned sets</p>
              <p className="mt-3 text-sm text-neutral-300">{list.map((item) => item.name).join(" · ")}</p>
              <button onClick={() => router.push(`/workouts?routine=${encodeURIComponent(routine.id)}`)} className="mt-4 rounded-lg bg-neutral-800 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-700">Start this workout</button>
            </article>;
          })}
        </div>
      )}
    </div>
  );
}
