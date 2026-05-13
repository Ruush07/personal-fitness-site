"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Target, Activity, Flame, Save, PieChart, AlertTriangle, TrendingDown, Info } from "lucide-react";

const calculateBMR = (weight: number, height: number, age: number, gender: "male" | "female") => {
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  return gender === "male" ? bmr + 5 : bmr - 161;
};

const calculateTDEE = (bmr: number, activityLevel: number) => Math.round(bmr * activityLevel);

const calculateTargetCalories = (tdee: number, gender: "male" | "female", goal: string) => {
  let target = tdee;
  let isCut = goal.includes("cut");

  // Fixed Math: Perfectly aligns with exact 0.5kg and 1kg weekly deficits
  switch (goal) {
    case "mild_cut": target -= 250; break;
    case "moderate_cut": target -= 500; break;
    case "aggressive_cut": target -= 1000; break;
    case "lean_bulk": target += 250; break;
    case "moderate_bulk": target += 500; break;
    case "aggressive_bulk": target += 750; break;
    case "maintain": default: break;
  }

  let wasCapped = false;
  if (isCut) {
    // Only cap at absolute medical minimums so heavier users can utilize full 1000kcal deficits
    const absoluteFloor = gender === "male" ? 1500 : 1200;
    if (target < absoluteFloor) {
      target = absoluteFloor;
      wasCapped = true;
    }
  }
  return { target: Math.round(target), wasCapped };
};

const calculateMacros = (calories: number, weight: number, goal: string) => {
  let proteinMultiplier = goal.includes("cut") ? 2.2 : 1.8;
  let p = Math.min(weight * proteinMultiplier, 190);
  let f = (calories * 0.25) / 9;
  let c = (calories - (p * 4) - (f * 9)) / 4;
  return { p: Math.round(p), f: Math.round(f), c: Math.round(Math.max(c, 0)) };
};

export default function GoalsPage() {
  const [weight, setWeight] = useState<string>("97");
  const [height, setHeight] = useState<string>("175"); 
  const [age, setAge] = useState<string>("20"); 
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activity, setActivity] = useState(1.55); 
  const [goal, setGoal] = useState("aggressive_cut");

  const [results, setResults] = useState({ bmr: 0, tdee: 0, target: 0, capped: false, weeklyChange: 0, macros: { p: 0, f: 0, c: 0 }, warnings: [] as string[] });

  useEffect(() => {
    const w = Number(weight) || 0; const h = Number(height) || 0; const a = Number(age) || 0;
    if (w === 0 || h === 0 || a === 0) return;

    const bmr = calculateBMR(w, h, a, gender);
    const tdee = calculateTDEE(bmr, activity);
    const { target, wasCapped } = calculateTargetCalories(tdee, gender, goal);
    const macros = calculateMacros(target, w, goal);
    
    const weeklyChange = ((target - tdee) * 7) / 7700;
    
    const msgs: string[] = [];
    if (wasCapped) msgs.push(`Calorie floor triggered. Deficit capped at ${gender === "male" ? 1500 : 1200} kcal to prevent metabolic damage.`);

    setResults({ bmr, tdee, target, capped: wasCapped, weeklyChange, macros, warnings: msgs });
  }, [weight, height, age, gender, activity, goal]);

  const handleSaveGoals = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("Please log in.");
    await supabase.from('profiles').upsert({ id: session.user.id, target_calories: results.target, target_protein: results.macros.p, target_carbs: results.macros.c, target_fat: results.macros.f, updated_at: new Date().toISOString() });
    alert("Science-based targets locked in!");
  };

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto min-h-screen text-neutral-100 pb-24">
      <header className="mb-10"><h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">Adaptive Macro Engine <Target className="text-blue-500" /></h1></header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Activity size={20} className="text-green-500"/> Biology</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div><label className="block text-sm text-neutral-400 mb-2">Weight (kg)</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500" /></div>
              <div><label className="block text-sm text-neutral-400 mb-2">Height (cm)</label><input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500" /></div>
              <div><label className="block text-sm text-neutral-400 mb-2">Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500" /></div>
              <div><label className="block text-sm text-neutral-400 mb-2">Gender</label><select value={gender} onChange={(e) => setGender(e.target.value as "male"|"female")} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500"><option value="male">M</option><option value="female">F</option></select></div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Flame size={20} className="text-orange-500"/> Programming</h2>
            <div className="space-y-5">
              <div><label className="block text-sm text-neutral-400 mb-2 flex justify-between">Activity Level <span className="text-blue-500">{Math.round(results.tdee)} TDEE</span></label>
                <select value={activity} onChange={(e) => setActivity(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500">
                  <option value={1.2}>Sedentary (Office job)</option><option value={1.375}>Light (10k steps / 1-3 days)</option><option value={1.55}>Moderate (10k steps + 3-5 days)</option><option value={1.725}>Very Active (6-7 days)</option>
                </select>
              </div>
              <div><label className="block text-sm text-neutral-400 mb-2">Target Strategy</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500">
                  <optgroup label="Fat Loss"><option value="mild_cut">Mild Cut (-0.25 kg/week)</option><option value="moderate_cut">Moderate Cut (-0.5 kg/week)</option><option value="aggressive_cut">Aggressive Cut (-1 kg/week)</option></optgroup>
                  <optgroup label="Recomp / Maintain"><option value="maintain">Maintenance</option></optgroup>
                  <optgroup label="Muscle Gain"><option value="lean_bulk">Lean Bulk (+0.25 kg/week)</option><option value="moderate_bulk">Moderate Bulk (+0.5 kg/week)</option><option value="aggressive_bulk">Aggressive Bulk (+0.75 kg/week)</option></optgroup>
                </select>
              </div>
            </div>
          </div>
          {results.warnings.length > 0 && ( <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm space-y-2">{results.warnings.map((warn, i) => <div key={i} className="flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> <p>{warn}</p></div>)}</div>)}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-blue-600 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-blue-200 font-medium mb-1">Prescribed Intake</h3>
              <div className="flex items-baseline gap-2 mb-6"><span className="text-5xl font-bold tracking-tighter">{results.target - 50} <span className="text-3xl text-blue-300 mx-1">-</span> {results.target + 50}</span><span className="text-blue-200">kcal</span></div>
              <h3 className="text-blue-200 font-medium mb-3 flex items-center gap-2"><PieChart size={16}/> Macro Architecture</h3>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-blue-700/50 p-3 rounded-2xl border border-blue-500/30 text-center"><span className="block text-blue-200 text-xs mb-1">Protein</span><span className="font-bold text-lg">{results.macros.p}g</span></div>
                <div className="bg-blue-700/50 p-3 rounded-2xl border border-blue-500/30 text-center"><span className="block text-blue-200 text-xs mb-1">Carbs</span><span className="font-bold text-lg">{results.macros.c}g</span></div>
                <div className="bg-blue-700/50 p-3 rounded-2xl border border-blue-500/30 text-center"><span className="block text-blue-200 text-xs mb-1">Fats</span><span className="font-bold text-lg">{results.macros.f}g</span></div>
              </div>
              <button onClick={handleSaveGoals} className="w-full bg-white text-blue-600 hover:bg-blue-50 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"><Save size={20} /> Update Dashboard</button>
            </div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><TrendingDown size={18} className={results.weeklyChange < 0 ? "text-blue-500" : "text-green-500 transform rotate-180"} /> Progression Trajectory</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-800"><span className="text-neutral-400 text-sm">Estimated Rate</span><span className="text-white font-medium">{results.weeklyChange > 0 ? "+" : ""}{results.weeklyChange.toFixed(2)} kg / week</span></div>
              <div className="flex justify-between items-center"><span className="text-neutral-400 text-sm">12-Week Projection</span><span className="text-white font-medium">{results.weeklyChange > 0 ? "+" : ""}{(results.weeklyChange * 12).toFixed(1)} kg total</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}