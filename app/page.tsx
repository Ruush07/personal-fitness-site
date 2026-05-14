"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, Flame, Dumbbell, Footprints } from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Athlete");
  const [userId, setUserId] = useState<string | null>(null);
  
  // Macros & Targets
  const [targets, setTargets] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const [consumed, setConsumed] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  
  // Daily Metrics (Steps & Active Burn)
  const [steps, setSteps] = useState<number | "">("");
  const [metricsId, setMetricsId] = useState<string | null>(null);
  const [savingSteps, setSavingSteps] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setUserId(session.user.id);
    if (session.user.email) setUserName(session.user.email.split('@')[0]);

    // 1. Fetch Targets
    const { data: profile } = await supabase
      .from('profiles')
      .select('target_calories, target_protein, target_carbs, target_fat')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      setTargets({
        calories: profile.target_calories || 2000,
        protein: profile.target_protein || 150,
        carbs: profile.target_carbs || 200,
        fat: profile.target_fat || 65
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // 2. Fetch Today's Consumed Macros (FIXED: using log_date and fats)
    const { data: logs } = await supabase
      .from('nutrition_logs')
      .select('calories, protein, carbs, fats')
      .eq('user_id', session.user.id)
      .eq('log_date', todayStr);

    if (logs) {
      const totals = logs.reduce((acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fat: acc.fat + (log.fats || 0) // Mapping DB 'fats' back to UI 'fat'
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      setConsumed(totals);
    }

    // 3. Fetch Today's Steps
    const { data: metrics } = await supabase
      .from('daily_metrics')
      .select('id, steps')
      .eq('user_id', session.user.id)
      .eq('log_date', todayStr)
      .single();

    if (metrics) {
      setMetricsId(metrics.id);
      setSteps(metrics.steps || "");
    }

    setLoading(false);
  };

  // Step Tracker Save Function
  const handleSaveSteps = async () => {
    if (!userId || steps === "") return;
    setSavingSteps(true);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const stepsNum = Number(steps);

    if (metricsId) {
      // Update existing record
      await supabase.from('daily_metrics').update({ steps: stepsNum }).eq('id', metricsId);
    } else {
      // Insert new record
      const { data } = await supabase
        .from('daily_metrics')
        .insert([{ user_id: userId, log_date: todayStr, steps: stepsNum }])
        .select()
        .single();
      if (data) setMetricsId(data.id);
    }
    setSavingSteps(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-neutral-950"><Activity className="text-blue-500 animate-pulse" size={32} /></div>;

  // --- DYNAMIC MATH ENGINE (SAFE & NO DOUBLE-COUNTING) ---
const stepBurn = (Number(steps) || 0) * 0.04; // Est. 0.04 kcal per step

// SAFE: Budget stays locked to their explicit target. Steps do not unlock more food.
const totalBudget = targets.calories; 

// Net Energy = What they ate minus what they burned through steps
const netCalories = consumed.calories - stepBurn;

// Remaining food calories left to eat for the day based strictly on the target ceiling
const remaining = Math.max(Math.round(totalBudget - consumed.calories), 0);

// Blue Eaten Ring Logic (Tracks food consumption against the strict budget)
const calPercentage = Math.min((consumed.calories / totalBudget) * 100, 100) || 0;
const outerRadius = 50;
const outerCircum = 2 * Math.PI * outerRadius;
const outerOffset = outerCircum - (calPercentage / 100) * outerCircum;

// Orange Ghost Ring Logic (Visual representation of extra activity, cap at 1000kcal for scale)
const ghostPercentage = Math.min((stepBurn / 1000) * 100, 100) || 0;
const innerRadius = 38;
const innerCircum = 2 * Math.PI * innerRadius;
const innerOffset = innerCircum - (ghostPercentage / 100) * innerCircum;

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto min-h-screen text-neutral-100 pb-24">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Welcome back homie, <span className="text-blue-500 capitalize">{userName}</span>
        </h1>
        <p className="text-neutral-400">Here is your daily overview. Stay on track.</p>
      </header>

      {/* NEW: Step & Active Burn Tracker */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-sm mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-1/2">
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl hidden sm:block"><Footprints size={24} /></div>
          <div className="w-full">
            <h3 className="font-bold text-white text-sm">Daily Steps</h3>
            <input 
                type="number" 
                value={steps}
                onChange={(e) => {
                const val = e.target.value;
                // If the input is cleared, set it to "", otherwise convert to a number
                setSteps(val === "" ? "" : Number(val));
              }}
                onBlur={handleSaveSteps}
                placeholder="e.g. 8000"
                className="bg-transparent border-b border-neutral-700 w-full text-white outline-none focus:border-orange-500 py-1 transition-colors"
            />
          </div>
        </div>
        <div className="text-right border-l border-neutral-800 pl-4 w-1/2">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Active Burn</p>
          <p className="text-xl sm:text-2xl font-bold text-orange-500 flex items-center justify-end gap-1">
            <Flame size={16}/> {Math.round(stepBurn)} <span className="text-xs text-neutral-500 font-normal">kcal</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* DYNAMIC SVG DASHBOARD */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <h3 className="text-lg font-bold text-white w-full text-left flex items-center justify-between mb-4">
            <span className="flex items-center gap-2"><Flame size={18} className="text-blue-500" /> Net Energy</span>
          </h3>
          
          <div className="relative w-48 h-48 flex items-center justify-center mb-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Outer Track (Budget) */}
              <circle cx="60" cy="60" r={outerRadius} fill="none" stroke="#262626" strokeWidth="8" />
              {/* Outer Blue Fill (Consumed) */}
              <circle cx="60" cy="60" r={outerRadius} fill="none" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" strokeDasharray={outerCircum} strokeDashoffset={outerOffset} className="transition-all duration-1000 ease-out" />
              
              {/* Inner Track */}
              <circle cx="60" cy="60" r={innerRadius} fill="none" stroke="#262626" strokeWidth="6" />
              {/* Inner Orange Ghost Fill (Active Burn) */}
              <circle cx="60" cy="60" r={innerRadius} fill="none" stroke="#f97316" strokeWidth="6" strokeLinecap="round" strokeDasharray={innerCircum} strokeDashoffset={innerOffset} className="transition-all duration-1000 ease-out opacity-80" />
            </svg>
            
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-3xl font-bold text-white tracking-tighter">{Math.round(netCalories)}</span>
              <span className="text-neutral-500 text-xs mt-1">Net kcal</span>
            </div>
          </div>
          
          <div className="w-full flex justify-between text-sm mt-4 px-4">
            <div className="text-center">
              <p className="text-neutral-500 text-xs">Consumed</p>
              <p className="text-white font-bold">{consumed.calories}</p>
            </div>
            <div className="text-center border-l border-neutral-800 pl-4">
              <p className="text-neutral-500 text-xs">Budget</p>
              <p className="text-white font-bold">{Math.round(totalBudget)}</p>
            </div>
            <div className="text-center border-l border-neutral-800 pl-4">
              <p className="text-neutral-500 text-xs">Remaining</p>
              <p className="text-green-400 font-bold">{remaining}</p>
            </div>
          </div>
        </div>

        {/* MACROS */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
          <h3 className="text-lg font-bold text-white mb-6">Macro Ranges</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-blue-400 font-medium text-sm">Protein</span>
                <span className="text-white font-bold text-sm">{consumed.protein}g <span className="text-neutral-500 font-normal">/ {targets.protein - 10}-{targets.protein + 10}g</span></span>
              </div>
              <div className="w-full bg-neutral-950 rounded-full h-3 border border-neutral-800 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((consumed.protein / targets.protein) * 100, 100) || 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-green-400 font-medium text-sm">Carbs</span>
                <span className="text-white font-bold text-sm">{consumed.carbs}g <span className="text-neutral-500 font-normal">/ {targets.carbs - 15}-{targets.carbs + 15}g</span></span>
              </div>
              <div className="w-full bg-neutral-950 rounded-full h-3 border border-neutral-800 overflow-hidden">
                <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((consumed.carbs / targets.carbs) * 100, 100) || 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-orange-400 font-medium text-sm">Fats</span>
                <span className="text-white font-bold text-sm">{consumed.fat}g <span className="text-neutral-500 font-normal">/ {targets.fat - 5}-{targets.fat + 5}g</span></span>
              </div>
              <div className="w-full bg-neutral-950 rounded-full h-3 border border-neutral-800 overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((consumed.fat / targets.fat) * 100, 100) || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => window.location.href='/workouts'}>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Dumbbell size={24} /></div>
            <div><h3 className="font-bold text-white">Log Workout</h3><p className="text-sm text-neutral-400">Track your volume for today</p></div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm hover:border-orange-500/50 transition-colors cursor-pointer" onClick={() => window.location.href='/nutrition'}>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl"><Flame size={24} /></div>
            <div><h3 className="font-bold text-white">Log Meal</h3><p className="text-sm text-neutral-400">Scan or type what you ate</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}