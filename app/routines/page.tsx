"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Save, ListChecks, Loader2 } from "lucide-react";

export default function RoutineBuilder() {
  const [routineName, setRoutineName] = useState("");
  const [exercises, setExercises] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [myRoutines, setMyRoutines] = useState<any[]>([]);

  useEffect(() => {
    fetchRoutines();
  }, []);

  async function fetchRoutines() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('user_routines').select('*').order('created_at', { ascending: false });
    if (data) setMyRoutines(data);
  }

  const addExerciseField = () => setExercises([...exercises, ""]);
  
  const updateExercise = (index: number, value: string) => {
    const newEx = [...exercises];
    newEx[index] = value;
    setExercises(newEx);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const saveRoutine = async () => {
    if (!routineName || exercises.some(ex => !ex.trim())) return alert("Fill all fields");
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase.from('user_routines').insert([{
      user_id: session?.user.id,
      routine_name: routineName,
      exercises: exercises
    }]);

    setLoading(false);
    if (!error) {
      setRoutineName("");
      setExercises([""]);
      fetchRoutines();
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto pb-24">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        Routine Designer <ListChecks className="text-blue-500" />
      </h1>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 mb-10">
        <input 
          placeholder="Routine Name (e.g. Upper Body A)" 
          className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl mb-6 text-xl font-bold focus:border-blue-500 outline-none"
          value={routineName}
          onChange={(e) => setRoutineName(e.target.value)}
        />
        
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <div key={i} className="flex gap-2">
              <input 
                placeholder="Exercise name..."
                className="flex-1 bg-neutral-950 border border-neutral-800 p-3 rounded-xl outline-none"
                value={ex}
                onChange={(e) => updateExercise(i, e.target.value)}
              />
              <button onClick={() => removeExercise(i)} className="p-3 text-neutral-500 hover:text-red-500"><Trash2 size={20}/></button>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-6">
          <button onClick={addExerciseField} className="flex-1 py-3 bg-neutral-800 rounded-xl font-medium hover:bg-neutral-700">+ Add Exercise</button>
          <button onClick={saveRoutine} disabled={loading} className="flex-1 py-3 bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} Save Routine
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">My Custom Routines</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myRoutines.map((r) => (
          <div key={r.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
            <h3 className="font-bold text-lg text-blue-400">{r.routine_name}</h3>
            <p className="text-sm text-neutral-500 mt-1">{r.exercises.length} Exercises</p>
          </div>
        ))}
      </div>
    </div>
  );
}