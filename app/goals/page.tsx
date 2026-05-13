"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Target, Activity, Flame, Save } from "lucide-react";

export default function GoalsPage() {
  const router = useRouter(); 

  // Security Guard: Check if logged in (Only written once!)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkUser();
  }, [router]);

  // Biological Metrics
  const [currentWeight, setCurrentWeight] = useState(97);
  const [goalWeight, setGoalWeight] = useState(80);
  const [heightCm, setHeightCm] = useState(175); 
  const [age, setAge] = useState(20); 
  
  // Activity Multipliers
  const [activityLevel, setActivityLevel] = useState(1.55); 
  const [deficit, setDeficit] = useState(1000); 

  // The output states
  const [tdee, setTdee] = useState(0);
  const [targetCalories, setTargetCalories] = useState(0);

  // Math recalculation hook
  useEffect(() => {
    const bmr = (10 * currentWeight) + (6.25 * heightCm) - (5 * age) + 5;
    const calculatedTdee = Math.round(bmr * activityLevel);
    const finalTarget = calculatedTdee - deficit;

    setTdee(calculatedTdee);
    setTargetCalories(finalTarget);
  }, [currentWeight, heightCm, age, activityLevel, deficit]);

  // Real Database Save Logic
  const handleSaveGoals = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Please log in to save goals.");
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: session.user.id, 
          target_calories: targetCalories,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      alert(`Successfully saved! Your new daily target is ${targetCalories} kcal.`);
    } catch (error) {
      console.error("Error saving goals:", error);
      alert("Failed to save goals. Check console.");
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto min-h-screen text-neutral-100">
      
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          Macro Targets <Target className="text-blue-500" />
        </h1>
        <p className="text-neutral-400 mt-2">Adjust your biological metrics and weekly routine to calculate your exact caloric needs.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT/CENTER: The Calculator Controls */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Biological Metrics */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity size={20} className="text-green-500"/> Body Metrics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Current Weight (kg)</label>
                <input type="number" value={currentWeight} onChange={(e) => setCurrentWeight(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Goal Weight (kg)</label>
                <input type="number" value={goalWeight} onChange={(e) => setGoalWeight(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Height (cm)</label>
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Lifestyle & Goals */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Flame size={20} className="text-orange-500"/> Lifestyle & Pace
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-neutral-400 mb-3">Weekly Activity Level</label>
                <select 
                  value={activityLevel} 
                  onChange={(e) => setActivityLevel(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1.2}>Sedentary (Office job, little exercise)</option>
                  <option value={1.375}>Light (10k steps OR 1-3 gym days)</option>
                  <option value={1.55}>Moderate (10k steps AND 3-5 gym days)</option>
                  <option value={1.725}>Very Active (Heavy training 6-7 days)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-3">Target Weight Loss Pace</label>
                <select 
                  value={deficit} 
                  onChange={(e) => setDeficit(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={250}>0.25 kg per week (Sustainable)</option>
                  <option value={500}>0.5 kg per week (Recommended)</option>
                  <option value={750}>0.75 kg per week (Aggressive)</option>
                  <option value={1000}>1 kg per week (Very Aggressive)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: The Live Results */}
        <div className="bg-blue-600 rounded-3xl p-6 shadow-lg flex flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-blue-200 font-medium mb-1">Your Daily Target</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-6xl font-bold tracking-tighter">{targetCalories}</span>
              <span className="text-blue-200">kcal</span>
            </div>

            <div className="space-y-4 bg-blue-700/50 p-4 rounded-2xl border border-blue-500/30">
              <div className="flex justify-between items-center">
                <span className="text-blue-100 text-sm">Maintenance (TDEE)</span>
                <span className="font-semibold">{tdee} kcal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100 text-sm">Daily Deficit</span>
                <span className="font-semibold text-red-300">-{deficit} kcal</span>
              </div>
              <div className="w-full h-px bg-blue-500/30 my-2"></div>
              <div className="flex justify-between items-center text-xs text-blue-200">
                <span>Estimated time to goal:</span>
                <span className="font-medium">{Math.ceil(Math.abs(currentWeight - goalWeight) / (deficit / 500 * 0.5))} weeks</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSaveGoals}
            className="w-full bg-white text-blue-600 hover:bg-blue-50 py-4 rounded-xl font-bold transition-colors mt-8 flex items-center justify-center gap-2 relative z-10"
          >
            <Save size={20} /> Update My Dashboard
          </button>
          
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        </div>

      </div>
    </div>
  );
}