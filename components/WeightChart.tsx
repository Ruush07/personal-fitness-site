"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Loader2, Plus } from "lucide-react";

type WeightPoint = { date: string; weight: number };

export default function WeightChart() {
  const [data, setData] = useState<WeightPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const readWeightData = useCallback(async (): Promise<WeightPoint[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const { data: logs } = await supabase.from("weight_logs").select("weight, created_at").eq("user_id", session.user.id).order("created_at", { ascending: true }).limit(180);
    return (logs ?? []).map((log) => ({
      date: new Date(log.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weight: Number(log.weight),
    }));
  }, []);

  useEffect(() => {
    let active = true;
    void readWeightData().then((points) => {
      if (!active) return;
      setData(points);
      setLoading(false);
    });
    return () => { active = false; };
  }, [readWeightData]);

  const addWeight = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(weight);
    if (!Number.isFinite(value) || value < 20 || value > 500) {
      setMessage("Enter a weight between 20 and 500 kg.");
      return;
    }
    setSaving(true);
    setMessage("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setMessage("Please sign in to save a weigh-in.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("weight_logs").insert([{ user_id: session.user.id, weight: value }]);
    setSaving(false);
    if (error) {
      setMessage("Could not save this weigh-in. Please try again.");
      return;
    }
    setWeight("");
    setMessage("Weigh-in saved.");
    setData(await readWeightData());
  };

  if (loading) return <div className="flex h-72 items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900"><Activity className="animate-pulse text-blue-500" size={32} /></div>;

  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h2 className="flex items-center gap-2 text-lg font-bold text-white"><Activity size={18} className="text-blue-400" /> Weight progress</h2><p className="mt-1 text-sm text-neutral-500">Your saved weigh-ins over time</p></div>
        <form onSubmit={addWeight} className="flex gap-2">
          <label className="sr-only" htmlFor="weight-entry">Weight in kilograms</label>
          <input id="weight-entry" type="number" min="20" max="500" step="0.1" required value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Weight (kg)" className="w-32 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-blue-500" />
          <button disabled={saving} className="flex items-center gap-2 rounded-xl bg-neutral-800 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Log</button>
        </form>
      </div>
      {message && <p role="status" className="mb-3 text-sm text-neutral-400">{message}</p>}
      {data.length < 2 ? <div className="flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 text-center">
        <p className="text-sm text-neutral-400">{data.length === 0 ? "Log your first weigh-in to start the chart." : "Log one more weigh-in to see your trend."}</p>
        {data.length === 1 && <p className="mt-2 text-2xl font-bold text-white">{data[0].weight} kg</p>}
      </div> : <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis dataKey="date" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={[(min: number) => Math.max(0, min - 2), (max: number) => max + 2]} stroke="#737373" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}kg`} />
            <Tooltip contentStyle={{ backgroundColor: "#171717", border: "1px solid #262626", borderRadius: 12, color: "#fff" }} formatter={(value) => [`${value} kg`, "Weight"]} />
            <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: "#60a5fa" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>}
    </section>
  );
}
