"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FitnessRoutine, getPersonalRecordHint, getProgressionHint, normalizeExercises, PlannedExercise, WorkoutLog, workoutScore } from "@/lib/trainer";
import { Dumbbell, Save, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export default function WorkoutsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [routines, setRoutines] = useState<FitnessRoutine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<FitnessRoutine | null>(null);
  const [currentWorkout, setCurrentWorkout] = useState<PlannedExercise[]>([]);
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const loadRoutine = useCallback((routine: FitnessRoutine) => {
    setSelectedRoutine(routine);
    setCurrentWorkout(normalizeExercises(routine.exercises).map((exercise) => ({ ...exercise, completed: false })));
    setSaveSuccess(false);
  }, []);

  const fetchUserData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push("/login");
    const [{ data: userRoutines, error: routinesError }, { data: logs }] = await Promise.all([
      supabase.from("user_routines").select("*").order("created_at", { ascending: true }),
      supabase.from("workout_logs").select("split_name, exercises, created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    if (routinesError) setError("Could not load your routines. Please try again.");
    setHistory((logs ?? []) as WorkoutLog[]);
    const loaded = (userRoutines ?? []) as FitnessRoutine[];
    setRoutines(loaded);
    const requestedId = searchParams.get("routine");
    const chosen = loaded.find((routine) => routine.id === requestedId) ?? loaded[0];
    if (chosen) loadRoutine(chosen);
    setIsLoading(false);
  }, [loadRoutine, router, searchParams]);

  useEffect(() => { void Promise.resolve().then(fetchUserData); }, [fetchUserData]);

  const updateExercise = (index: number, field: keyof PlannedExercise, value: string | number | boolean) => {
    setCurrentWorkout((current) => current.map((exercise, i) => i === index ? { ...exercise, [field]: value } : exercise));
  };

  const score = useMemo(() => workoutScore(currentWorkout), [currentWorkout]);

  const saveWorkoutLog = async () => {
    if (!selectedRoutine || currentWorkout.length === 0) return;
    setIsSaving(true);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsSaving(false);
      return router.push("/login");
    }
    const { data: saved, error: saveError } = await supabase.from("workout_logs").insert([{
      user_id: session.user.id,
      split_name: selectedRoutine.routine_name,
      exercises: currentWorkout,
    }]).select("split_name, exercises, created_at").single();
    setIsSaving(false);
    if (saveError) {
      setError("Workout could not be saved. Check your connection and try again.");
      return;
    }
    if (saved) setHistory((current) => [saved as WorkoutLog, ...current]);
    setSaveSuccess(true);
    window.setTimeout(() => setSaveSuccess(false), 4000);
  };

  if (isLoading) return <div className="p-10 text-center text-neutral-400">Loading your training…</div>;

  if (routines.length === 0) return (
    <div className="flex h-full flex-col items-center justify-center p-12 text-center">
      <AlertCircle size={48} className="mb-4 text-neutral-700" />
      <h2 className="text-xl font-bold">No saved routines yet</h2>
      <p className="mb-6 mt-2 text-neutral-500">Build one with AI or create your own routine first.</p>
      <button onClick={() => router.push("/routines")} className="rounded-xl bg-blue-600 px-6 py-3 font-bold">Open Routine Builder</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl p-6 pb-24 md:p-12">
      <header className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Train and track</p>
        <h1 className="flex items-center gap-3 text-3xl font-bold">Today&apos;s Workout <Dumbbell className="text-blue-500" /></h1>
        <p className="mt-2 text-neutral-400">Use the weight suggestions as a guide. Keep the load only if your reps feel controlled.</p>
      </header>

      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-2">
        {routines.map((routine) => <button key={routine.id} onClick={() => loadRoutine(routine)} className={`whitespace-nowrap rounded-xl px-4 py-2 font-medium transition-colors ${selectedRoutine?.id === routine.id ? "bg-blue-600 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}>{routine.routine_name}</button>)}
      </div>

      <div className="mb-6 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="flex items-center gap-2 text-sm font-semibold text-blue-300"><Sparkles size={16} /> Session score</p><p className="mt-1 text-3xl font-bold text-white">{score}<span className="text-lg text-neutral-400"> / 100</span></p></div>
          <p className="max-w-md text-sm text-neutral-300">Score is completed planned sets ÷ total planned sets. Mark an exercise done after finishing its planned sets. It rewards completion, not how heavy you lift.</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-900"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${score}%` }} /></div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-800 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
      <div className="mb-8 space-y-4">
        {currentWorkout.map((exercise, index) => (
          <article key={`${selectedRoutine?.id}-${index}`} className={`rounded-3xl border p-5 transition-colors ${exercise.completed ? "border-green-800 bg-green-950/20" : "border-neutral-800 bg-neutral-900"}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div><h2 className="font-bold text-white">{exercise.name}</h2>{exercise.reason && <p className="mt-1 text-sm text-neutral-400">{exercise.reason}</p>}</div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300"><input type="checkbox" checked={Boolean(exercise.completed)} onChange={(e) => updateExercise(index, "completed", e.target.checked)} className="h-4 w-4 accent-green-500" /> Done</label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["sets", "reps", "weight"] as const).map((field) => <label key={field} className="text-center text-[10px] uppercase tracking-wider text-neutral-500">{field === "weight" ? "Kg" : field}<input type="number" min={0} value={exercise[field]} onChange={(e) => updateExercise(index, field, Number(e.target.value))} className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-center text-base text-white outline-none focus:border-blue-500" /></label>)}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-blue-300">{getPersonalRecordHint(exercise, history)}</p>
            <p className="mt-3 text-xs leading-relaxed text-neutral-400">{getProgressionHint(exercise, history)}</p>
          </article>
        ))}
      </div>

      <button onClick={saveWorkoutLog} disabled={isSaving || saveSuccess} className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold ${saveSuccess ? "bg-green-700" : "bg-blue-600 hover:bg-blue-500"} disabled:opacity-70`}>
        {isSaving ? <Loader2 className="animate-spin" /> : saveSuccess ? <CheckCircle2 /> : <Save />} {saveSuccess ? `Saved · ${score}/100` : "Save workout"}
      </button>
    </div>
  );
}
