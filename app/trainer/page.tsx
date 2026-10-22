"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FitnessRoutine, normalizeExercises, WorkoutLog, workoutScore } from "@/lib/trainer";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CalendarDays, Dumbbell, Sparkles } from "lucide-react";

function localDay(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export default function TrainerPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<FitnessRoutine[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");
      const [{ data: routineData }, { data: logData }] = await Promise.all([
        supabase.from("user_routines").select("*").order("created_at", { ascending: true }),
        supabase.from("workout_logs").select("split_name, exercises, created_at").order("created_at", { ascending: false }).limit(100),
      ]);
      setRoutines((routineData ?? []) as FitnessRoutine[]);
      setLogs((logData ?? []) as WorkoutLog[]);
      setLoading(false);
    };
    void load();
  }, [router]);

  const recommendation = useMemo(() => {
    if (!routines.length) return null;
    const lastTrained = (routine: FitnessRoutine) => logs.find((log) => log.split_name === routine.routine_name)?.created_at ?? "";
    const untrainedToday = routines.filter((routine) => localDay(new Date(lastTrained(routine) || 0)) !== localDay(new Date()));
    if (!untrainedToday.length) return null;
    return [...untrainedToday].sort((a, b) => lastTrained(a).localeCompare(lastTrained(b)))[0];
  }, [routines, logs]);

  const weeklySessions = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    const key = localDay(day);
    return { day: day.toLocaleDateString(undefined, { weekday: "short" }), sessions: logs.filter((log) => log.created_at && localDay(new Date(log.created_at)) === key).length };
  }), [logs]);

  const todaysLogs = logs.filter((log) => log.created_at && localDay(new Date(log.created_at)) === localDay(new Date()));
  const hasCompletionData = todaysLogs.some((log) => normalizeExercises(log.exercises).some((exercise) => typeof exercise.completed === "boolean"));
  const todayScore = hasCompletionData ? Math.max(...todaysLogs.map((log) => workoutScore(normalizeExercises(log.exercises)))) : null;

  if (loading) return <div className="p-10 text-center text-neutral-400">Loading your training profile…</div>;

  return (
    <div className="mx-auto max-w-6xl p-6 pb-24 md:p-12">
      <header className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Personal training</p>
        <h1 className="flex items-center gap-3 text-3xl font-bold">Your AI Fitness Coach <Sparkles className="text-blue-500" /></h1>
        <p className="mt-2 text-neutral-400">Workout picks use the routines you saved and the sessions you logged. You stay in control of every weight and plan.</p>
      </header>

      {recommendation ? <section className="mb-6 rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-950/70 to-neutral-900 p-6 md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-300"><CalendarDays size={16} /> Suggested for today</p>
            <h2 className="text-2xl font-bold text-white">{recommendation.routine_name}</h2>
            <p className="mt-2 max-w-xl text-neutral-300">{logs.some((log) => log.split_name === recommendation.routine_name) ? `This is the saved routine you have logged least recently. It has ${normalizeExercises(recommendation.exercises).length} exercises.` : "You have not logged this saved routine yet, so it is a good place to start."}</p>
            <p className="mt-3 text-xs text-neutral-500">This is a rotation suggestion based on your logs, not a recovery assessment. Skip training or choose another routine if you need rest.</p>
          </div>
          <button onClick={() => router.push(`/workouts?routine=${encodeURIComponent(recommendation.id)}`)} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-500"><Dumbbell size={18} /> Start workout</button>
        </div>
      </section> : routines.length === 0 ? <section className="mb-6 rounded-3xl border border-dashed border-neutral-800 p-8 text-center">
        <Dumbbell className="mx-auto mb-3 text-neutral-600" />
        <h2 className="text-xl font-bold">Save your first routine</h2>
        <p className="mt-2 text-neutral-400">Once you save routines, I can suggest one based on your recent training.</p>
        <button onClick={() => router.push("/routines")} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-bold">Build a routine</button>
      </section> : <section className="mb-6 rounded-3xl border border-green-900/70 bg-green-950/20 p-8 text-center">
        <Activity className="mx-auto mb-3 text-green-400" />
        <h2 className="text-xl font-bold">You have logged all your saved routines today</h2>
        <p className="mt-2 text-neutral-400">Take a rest day or choose light movement if that feels good. You can train again when you are ready.</p>
      </section>}

      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-neutral-400"><Activity size={16} className="text-blue-400" /> Today&apos;s workout score</p>
          <p className="mt-3 text-4xl font-bold text-white">{todayScore === null ? "—" : `${todayScore}`}<span className="text-lg text-neutral-500">{todayScore === null ? "" : "/100"}</span></p>
          <p className="mt-2 text-xs text-neutral-500">{todayScore === null ? "Complete and save a workout to get a score." : "Based on the share of planned sets marked done."}</p>
        </section>
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 md:col-span-2">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-white">Training this week</h2><span className="text-xs text-neutral-500">Sessions logged</span></div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySessions}>
                <CartesianGrid stroke="#262626" vertical={false} />
                <XAxis dataKey="day" stroke="#737373" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="#737373" tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={{ backgroundColor: "#171717", border: "1px solid #262626", borderRadius: 12, color: "#fff" }} />
                <Bar dataKey="sessions" name="Sessions" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 font-bold text-white">Your saved routines</h2>
        {routines.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{routines.map((routine) => <button key={routine.id} onClick={() => router.push(`/workouts?routine=${encodeURIComponent(routine.id)}`)} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left hover:border-blue-500/50"><span className="block font-semibold text-white">{routine.routine_name}</span><span className="mt-1 block text-sm text-neutral-500">{normalizeExercises(routine.exercises).length} exercises</span></button>)}</div> : <p className="text-sm text-neutral-500">No routines saved yet.</p>}
      </section>
    </div>
  );
}
