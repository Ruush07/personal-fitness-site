"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Target, Activity, Flame, Save, PieChart } from "lucide-react";

export default function GoalsPage() {
  const router = useRouter(); 

  // Security Guard
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkUser();
  }, [router]);

  // Bug Fix: Using strings for initial state prevents the annoying leading '0'
  const [currentWeight, setCurrentWeight] = useState<string | number>("80");
  const [goalWeight, setGoalWeight] = useState<string | number>("89");
  const [heightCm, setHeightCm] = useState<string | number>("175"); 
  const [age, setAge] = useState<string | number>("20"); 
  
  const [activityLevel, setActivityLevel] = useState(1.55); 
  const [pace, setPace] = useState(500); 

  // The output states
  const [tdee, setTdee] = useState(0);
  const [targetCalories, setTargetCalories] = useState(0);
  const [isGaining, setIsGaining] = useState(false);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0 });

  // Math recalculation hook
  useEffect(() => {
    const weight = Number(currentWeight) || 0;
    const goal = Number(goalWeight) || 0;
    const height = Number(heightCm) || 0;
    const currentAge = Number(age) || 0;

    // 1. Determine if Bulking or Cutting
    const gaining = goal > weight;
    setIsGaining(gaining);

    // 2. Base Math
    const bmr = (10 * weight) + (6.25 * height) - (5 * currentAge) + 5;
    const calculatedTdee = Math.round(bmr * activityLevel);
    
    // 3. Surplus vs Deficit
    const finalTarget = gaining ? calculatedTdee + pace : calculatedTdee - pace;

    // 4. Calculate Macros (Standard Lifter Split)
    const proteinGrams = Math.round(weight * 2.2); // 2.2g per kg
    const fatGrams = Math.round((finalTarget * 0.25) / 9); // 25% of calories from fat
    const carbGrams = Math.round((finalTarget - (proteinGrams * 4) - (fatGrams * 9)) / 4);

    setTdee(calculatedTdee);
    setTargetCalories(finalTarget > 0 ? finalTarget : 0);
    setMacros({
      protein: proteinGrams > 0 ? proteinGrams : 0,
      fat: fatGrams > 0 ? fatGrams : 0,
      carbs: carbGrams > 0 ? carbGrams : 0
    });
  }, [currentWeight, goalWeight, heightCm, age, activityLevel, pace]);

  // Real Database Save Logic
  const handleSaveGoals = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return alert("Please log in to save goals.");

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
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity size={20} className="text-green-500"/> Body Metrics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Current Weight (kg)</label>
                <input type="number" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Goal Weight (kg)</label>
                <input type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Height (cm)</label>
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Flame size={20} className="text-orange-500"/> Lifestyle & Pace
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-neutral-400 mb-3">Weekly Activity Level</label>
                <select value={activityLevel} onChange={(e) => setActivityLevel(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500">
                  <option value={1.2}>Sedentary (Office job, little exercise)</option>
                  <option value={1.375}>Light (10k steps OR 1-3 gym days)</option>
                  <option value={1.55}>Moderate (10k steps AND 3-5 gym days)</option>
                  <option value={1.725}>Very Active (Heavy training 6-7 days)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-3">Target Pace</label>
                <select value={pace} onChange={(e) => setPace(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500">
                  <option value={250}>0.25 kg per week (Sustainable)</option>
                  <option value={500}>0.5 kg per week (Recommended)</option>
                  <option value={750}>0.75 kg per week (Aggressive)</option>
                  <option value={1000}>1 kg per week (Very Aggressive)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Results */}
        <div className="bg-blue-600 rounded-3xl p-6 shadow-lg flex flex-col justify-between text-white relative overflow-hidden h-full">
          <div className="relative z-10">
            <h3 className="text-blue-200 font-medium mb-1">Your Daily Target</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-6xl font-bold tracking-tighter">{targetCalories}</span>
              <span className="text-blue-200">kcal</span>
            </div>

            <div className="space-y-4 bg-blue-700/50 p-4 rounded-2xl border border-blue-500/30 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-blue-100 text-sm">Maintenance (TDEE)</span>
                <span className="font-semibold">{tdee} kcal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100 text-sm">{isGaining ? "Daily Surplus" : "Daily Deficit"}</span>
                <span className={`font-semibold ${isGaining ? 'text-green-300' : 'text-red-300'}`}>
                  {isGaining ? "+" : "-"}{pace} kcal
                </span>
              </div>
            </div>

            {/* NEW MACRO DISPLAY */}
            <h3 className="text-blue-200 font-medium mb-3 flex items-center gap-2">
              <PieChart size={16}/> Daily Macros
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-700/50 p-3 rounded-xl border border-blue-500/30 text-center">
                <span className="block text-blue-200 text-xs mb-1">Protein</span>
                <span className="font-bold">{macros.protein}g</span>
              </div>
              <div className="bg-blue-700/50 p-3 rounded-xl border border-blue-500/30 text-center">
                <span className="block text-blue-200 text-xs mb-1">Carbs</span>
                <span className="font-bold">{macros.carbs}g</span>
              </div>
              <div className="bg-blue-700/50 p-3 rounded-xl border border-blue-500/30 text-center">
                <span className="block text-blue-200 text-xs mb-1">Fats</span>
                <span className="font-bold">{macros.fat}g</span>
              </div>
            </div>

          </div>

          <button onClick={handleSaveGoals} className="w-full bg-white text-blue-600 hover:bg-blue-50 py-4 rounded-xl font-bold transition-colors mt-8 flex items-center justify-center gap-2 relative z-10">
            <Save size={20} /> Update My Dashboard
          </button>
          
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        </div>

      </div>
    </div>
  );
}