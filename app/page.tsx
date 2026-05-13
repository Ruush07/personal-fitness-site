"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Dumbbell, Plus, Save, History, Loader2, CheckCircle2 } from "lucide-react";

const templates = {
  Push: ["Bench Press", "Overhead Press", "Incline Dumbbell Press", "Tricep Pushdowns", "Lateral Raises"],
  Pull: ["Deadlifts", "Barbell Rows", "Pull-ups", "Face Pulls", "Bicep Curls"],
  Legs: ["Squats", "Leg Press", "Romanian Deadlifts", "Leg Extensions", "Calf Raises"]
};

export default function WorkoutsPage() {
  const router = useRouter();
  
  // States
  const [activeSplit, setActiveSplit] = useState<"Push" | "Pull" | "Legs">("Push");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [currentWorkout, setCurrentWorkout] = useState(
    templates.Push.map(ex => ({ name: ex, sets: 3, reps: 10, weight: 0 }))
  );

  // Security Guard
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
    };
    checkUser();
  }, [router]);

  const handleSplitChange = (split: "Push" | "Pull" | "Legs") => {
    setActiveSplit(split);
    setCurrentWorkout(templates[split].map(ex => ({ name: ex, sets: 3, reps: 10, weight: 0 })));
    setSaveSuccess(false); // Reset success state when switching tabs
  };

  const updateExercise = (index: number, field: string, value: number | string) => {
    const updated = [...currentWorkout];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentWorkout(updated);
  };

  const addCustomExercise = () => {
    setCurrentWorkout([...currentWorkout, { name: "New Exercise", sets: 3, reps: 10, weight: 0 }]);
  };

  // The Real Database Save Logic
  const saveWorkoutLog = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");

      const { error } = await supabase
        .from('workout_logs')
        .insert([{
          user_id: session.user.id,
          split_name: activeSplit,
          exercises: currentWorkout // Supabase handles the JSON conversion automatically!
        }]);

      if (error) throw error;
      
      setSaveSuccess(true);
      
      // Clear the success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Failed to log workout. Check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto min-h-screen text-neutral-100 pb-24">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Active Volume <Dumbbell className="text-blue-500" />
          </h1>
          <p className="text-neutral-400 mt-2">Log your daily sets, reps, and load.</p>
        </div>
        <button className="hidden md:flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
          <History size={18} /> View History
        </button>
      </header>

      {/* Routine Selector */}
      <div className="flex gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl mb-8 w-fit overflow-x-auto">
        {(["Push", "Pull", "Legs"] as const).map((split) => (
          <button
            key={split}
            onClick={() => handleSplitChange(split)}
            className={`px-6 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeSplit === split 
                ? "bg-blue-600 text-white shadow-lg" 
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            {split} Day
          </button>
        ))}
      </div>

      {/* The Logger */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm mb-8">
        <div className="grid grid-cols-12 gap-4 mb-4 px-4 text-sm font-semibold text-neutral-400">
          <div className="col-span-12 md:col-span-6">Exercise</div>
          <div className="col-span-4 md:col-span-2 text-center">Sets</div>
          <div className="col-span-4 md:col-span-2 text-center">Reps</div>
          <div className="col-span-4 md:col-span-2 text-center">Weight (kg)</div>
        </div>

        <div className="space-y-3">
          {currentWorkout.map((exercise, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              
              {/* Editable Exercise Name */}
              <div className="col-span-12 md:col-span-6">
                <input 
                  type="text" 
                  value={exercise.name}
                  onChange={(e) => updateExercise(idx, "name", e.target.value)}
                  className="w-full bg-transparent font-medium text-white outline-none focus:border-b border-blue-500"
                />
              </div>
              
              <div className="col-span-4 md:col-span-2">
                <input 
                  type="number" 
                  value={exercise.sets}
                  onChange={(e) => updateExercise(idx, "sets", Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-center text-white outline-none focus:border-blue-500"
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <input 
                  type="number" 
                  value={exercise.reps}
                  onChange={(e) => updateExercise(idx, "reps", Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-center text-white outline-none focus:border-blue-500"
                />
              </div>
              <div className="col-span-4 md:col-span-2">
                <input 
                  type="number" 
                  value={exercise.weight}
                  onChange={(e) => updateExercise(idx, "weight", Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-center text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={addCustomExercise}
          className="w-full mt-6 py-4 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={18} /> Add Custom Exercise
        </button>
      </div>

      <button 
        onClick={saveWorkoutLog} 
        disabled={isSaving || saveSuccess}
        className={`w-full md:w-auto md:px-12 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${
          saveSuccess 
            ? "bg-green-600 hover:bg-green-700 text-white" 
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isSaving ? (
          <Loader2 size={20} className="animate-spin" />
        ) : saveSuccess ? (
          <CheckCircle2 size={20} />
        ) : (
          <Save size={20} />
        )}
        {isSaving ? "Saving..." : saveSuccess ? "Workout Logged!" : `Log ${activeSplit} Workout`}
      </button>
    </div>
  );
}