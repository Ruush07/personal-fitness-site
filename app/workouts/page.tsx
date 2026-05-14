"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Dumbbell, Plus, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function WorkoutsPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<any[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [currentWorkout, setCurrentWorkout] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push("/login");

    const { data: userRoutines } = await supabase.from('user_routines').select('*');
    if (userRoutines && userRoutines.length > 0) {
      setRoutines(userRoutines);
      loadRoutine(userRoutines[0]);
    }
  };

  const loadRoutine = (routine: any) => {
    setSelectedRoutine(routine);
    setCurrentWorkout(routine.exercises.map((name: string) => ({ name, sets: 3, reps: 10, weight: 0 })));
    setSaveSuccess(false);
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const updated = [...currentWorkout];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentWorkout(updated);
  };

  const saveWorkoutLog = async () => {
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('workout_logs').insert([{
      user_id: session?.user.id,
      split_name: selectedRoutine.routine_name,
      exercises: currentWorkout
    }]);
    setIsSaving(false);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (routines.length === 0) {
    return (
      <div className="p-12 text-center h-full flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-neutral-700 mb-4" />
        <h2 className="text-xl font-bold">No routines found</h2>
        <p className="text-neutral-500 mb-6">Create your first routine in the Designer section.</p>
        <button onClick={() => router.push('/routines')} className="bg-blue-600 px-8 py-3 rounded-xl font-bold">Go to Designer</button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto pb-24">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">Active Volume <Dumbbell className="text-blue-500" /></h1>
      
      {/* Dynamic Tabs */}
      <div className="flex gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl mb-8 w-full overflow-x-auto no-scrollbar">
        {routines.map((r) => (
          <button
            key={r.id} onClick={() => loadRoutine(r)}
            className={`px-6 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${selectedRoutine?.id === r.id ? "bg-blue-600 text-white" : "text-neutral-400"}`}
          >
            {r.routine_name}
          </button>
        ))}
      </div>

      <div className="space-y-4 mb-8">
        {currentWorkout.map((ex, idx) => (
          <div key={idx} className="bg-neutral-900 border border-neutral-800 p-4 rounded-3xl">
            <h3 className="font-bold text-white mb-3 px-1">{ex.name}</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-[10px] uppercase text-neutral-500 block text-center mb-1">Sets</span>
                <input type="number" value={ex.sets} onChange={(e) => updateExercise(idx, 'sets', e.target.value)} className="w-full bg-neutral-950 p-3 rounded-xl text-center outline-none border border-neutral-800 focus:border-blue-500" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase text-neutral-500 block text-center mb-1">Reps</span>
                <input type="number" value={ex.reps} onChange={(e) => updateExercise(idx, 'reps', e.target.value)} className="w-full bg-neutral-950 p-3 rounded-xl text-center outline-none border border-neutral-800 focus:border-blue-500" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase text-neutral-500 block text-center mb-1">Kg</span>
                <input type="number" value={ex.weight} onChange={(e) => updateExercise(idx, 'weight', e.target.value)} className="w-full bg-neutral-950 p-3 rounded-xl text-center outline-none border border-neutral-800 focus:border-blue-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={saveWorkoutLog} disabled={isSaving || saveSuccess} className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 ${saveSuccess ? "bg-green-600" : "bg-blue-600"}`}>
        {isSaving ? <Loader2 className="animate-spin" /> : saveSuccess ? <CheckCircle2 /> : <Save />} {saveSuccess ? "Logged!" : "Save Workout"}
      </button>
    </div>
  );
}