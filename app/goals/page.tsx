"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Target, Activity, Flame, Save, PieChart, AlertTriangle, TrendingDown, Info, Droplets, Dumbbell } from "lucide-react";

// ==========================================
// 🧠 FITNESS SCIENCE UTILITY FUNCTIONS
// ==========================================

const calculateBMR = (weight: number, height: number, age: number, gender: "male" | "female") => {
  // Mifflin-St Jeor Equation
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  return gender === "male" ? bmr + 5 : bmr - 161;
};

const calculateTDEE = (bmr: number, activityLevel: number) => Math.round(bmr * activityLevel);

const calculateTargetCalories = (tdee: number, bmr: number, goal: string, gender: "male" | "female") => {
  let target = tdee;
  let isCut = goal.includes("cut");

  // 1. Goal Intensity Mapping
  switch (goal) {
    case "mild_cut": target -= 350; break;
    case "moderate_cut": target -= 600; break;
    case "aggressive_cut": target -= 900; break;
    case "lean_bulk": target += 200; break;
    case "moderate_bulk": target += 350; break;
    case "aggressive_bulk": target += 500; break;
    case "maintain": default: break;
  }

  // 2. Safety Limits & Floor Constraints
  let wasCapped = false;
  if (isCut) {
    const absoluteFloor = gender === "male" ? 1500 : 1200;
    const metabolicFloor = bmr * 1.2;
    const maxSafeDeficit = tdee * 0.35;
    
    const minAllowedCalories = Math.max(absoluteFloor, metabolicFloor, tdee - maxSafeDeficit);
    
    if (target < minAllowedCalories) {
      target = minAllowedCalories;
      wasCapped = true;
    }
  }

  return { target: Math.round(target), wasCapped };
};

const calculateMacros = (calories: number, weight: number, goal: string) => {
  let proteinMultiplier = 2.0; // Base maintain
  let fatPercentage = 0.25;    // Base 25%

  if (goal.includes("cut")) {
    proteinMultiplier = 2.2; // Preserve muscle in deficit
    fatPercentage = 0.25;
  } else if (goal.includes("bulk")) {
    proteinMultiplier = 1.8; // Carbs are more protein-sparing in surplus
    fatPercentage = 0.25;    // Keep fat moderate to maximize carb performance
  }

  // Cap protein to prevent absurd diets (unless extremely heavy)
  let p = Math.min(weight * proteinMultiplier, 190);
  let f = (calories * fatPercentage) / 9;
  let c = (calories - (p * 4) - (f * 9)) / 4;

  return { p: Math.round(p), f: Math.round(f), c: Math.round(Math.max(c, 0)) };
};

// ==========================================
// 📱 THE REACT COMPONENT
// ==========================================

export default function GoalsPage() {
  // --- USER METRICS STATE ---
  const [weight, setWeight] = useState<string>("80");
  const [height, setHeight] = useState<string>("175"); 
  const [age, setAge] = useState<string>("20"); 
  const [gender, setGender] = useState<"male" | "female">("male");
  const [bodyFat, setBodyFat] = useState("average"); // lean, average, overweight, obese

  // --- LIFESTYLE STATE ---
  const [activity, setActivity] = useState(1.55); 
  const [experience, setExperience] = useState("intermediate"); // beginner, intermediate, advanced
  const [goal, setGoal] = useState("moderate_cut");

  // --- OUTPUT STATE ---
  const [results, setResults] = useState({
    bmr: 0, tdee: 0, target: 0, capped: false, weeklyChange: 0,
    macros: { p: 0, f: 0, c: 0 },
    warnings: [] as string[],
    insights: [] as string[]
  });

  // --- MASTER CALCULATION ENGINE ---
  useEffect(() => {
    const w = Number(weight) || 0;
    const h = Number(height) || 0;
    const a = Number(age) || 0;

    if (w === 0 || h === 0 || a === 0) return;

    // Run the Math
    const bmr = calculateBMR(w, h, a, gender);
    const tdee = calculateTDEE(bmr, activity);
    const { target, wasCapped } = calculateTargetCalories(tdee, bmr, goal, gender);
    const macros = calculateMacros(target, w, goal);
    
    // Weekly weight change: (daily difference * 7 days) / 7700 kcal per kg of fat
    const dailyDiff = target - tdee;
    const weeklyChange = (dailyDiff * 7) / 7700;

    // Generate Smart Warnings & Insights
    const msgs: string[] = [];
    const tips: string[] = [];

    if (wasCapped) msgs.push(`Calorie floor triggered. Deficit capped to prevent metabolic damage.`);
    if (goal === "aggressive_cut" && bodyFat === "lean") msgs.push(`Aggressive cuts at a lean body fat highly increase muscle loss risk.`);
    if (goal === "aggressive_bulk" && experience === "advanced") msgs.push(`Advanced lifters gain muscle slowly. A large surplus will mostly result in fat gain.`);
    
    if (goal.includes("cut")) {
      tips.push("High protein targets are active to preserve lean mass.");
      tips.push("A structured Push-Pull-Legs (PPL) routine is excellent here, but consider slightly reducing set volume if recovery drops.");
    } else if (goal.includes("bulk")) {
      tips.push("Carbs are elevated to drive gym performance and glycogen storage.");
      tips.push("Ensure progressive overload in your lifting to signal muscle growth.");
    }
    tips.push(`Target ~${Math.round(w * 0.035)}L of water daily based on your body mass.`);

    setResults({ bmr, tdee, target, capped: wasCapped, weeklyChange, macros, warnings: msgs, insights: tips });
  }, [weight, height, age, gender, bodyFat, activity, experience, goal]);

  // --- SAVE TO DATABASE ---
  const handleSaveGoals = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return alert("Please log in.");

      const { error } = await supabase.from('profiles').upsert({ 
        id: session.user.id, 
        target_calories: results.target,
        target_protein: results.macros.p,  
        target_carbs: results.macros.c,      
        target_fat: results.macros.f,          
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      alert("Science-based targets locked in and saved!");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto min-h-screen text-neutral-100 pb-24">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          Adaptive Macro Engine <Target className="text-blue-500" />
        </h1>
        <p className="text-neutral-400 mt-2">Dynamic targets based on clinical sports nutrition algorithms.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Input Forms */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Biological Metrics */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity size={20} className="text-green-500"/> Biology
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Weight (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Height (cm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value as "male"|"female")} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500">
                  <option value="male">M</option>
                  <option value="female">F</option>
                </select>
              </div>
            </div>
            
            <label className="block text-sm text-neutral-400 mb-2">Estimated Body Fat</label>
            <div className="flex gap-2 p-1 bg-neutral-950 border border-neutral-800 rounded-xl overflow-x-auto">
              {(['lean', 'average', 'overweight', 'obese']).map((bf) => (
                <button key={bf} onClick={() => setBodyFat(bf)} className={`flex-1 py-2 px-3 text-sm rounded-lg capitalize transition-all ${bodyFat === bf ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'}`}>
                  {bf}
                </button>
              ))}
            </div>
          </div>

          {/* Training & Goal Intensity */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Flame size={20} className="text-orange-500"/> Programming
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-neutral-400 mb-2 flex justify-between">
                  Activity Level <span className="text-blue-500">{Math.round(results.tdee)} TDEE</span>
                </label>
                <select value={activity} onChange={(e) => setActivity(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500">
                  <option value={1.2}>Sedentary (Office job, little exercise)</option>
                  <option value={1.375}>Light (10k steps OR 1-3 gym days)</option>
                  <option value={1.55}>Moderate (10k steps AND 3-5 gym days)</option>
                  <option value={1.725}>Very Active (Heavy training 6-7 days)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Lifting Experience</label>
                  <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500">
                    <option value="beginner">Beginner (0-1 yrs)</option>
                    <option value="intermediate">Intermediate (1-3 yrs)</option>
                    <option value="advanced">Advanced (3+ yrs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Target Strategy</label>
                  <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 outline-none focus:border-blue-500">
                    <optgroup label="Fat Loss">
                      <option value="mild_cut">Mild Cut</option>
                      <option value="moderate_cut">Moderate Cut</option>
                      <option value="aggressive_cut">Aggressive Cut</option>
                    </optgroup>
                    <optgroup label="Recomp / Maintain">
                      <option value="maintain">Maintenance</option>
                    </optgroup>
                    <optgroup label="Muscle Gain">
                      <option value="lean_bulk">Lean Bulk</option>
                      <option value="moderate_bulk">Moderate Bulk</option>
                      <option value="aggressive_bulk">Aggressive Bulk</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Warnings Rendering */}
          {results.warnings.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm space-y-2">
              {results.warnings.map((warn, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <p>{warn}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Output & Visualization */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Primary Calorie Card */}
          <div className="bg-blue-600 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-blue-200 font-medium mb-1">Prescribed Intake</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold tracking-tighter">
                  {results.target - 50} <span className="text-3xl text-blue-300 mx-1">-</span> {results.target + 50}
                </span>
                <span className="text-blue-200">kcal</span>
              </div>

              <h3 className="text-blue-200 font-medium mb-3 flex items-center gap-2">
                <PieChart size={16}/> Macro Architecture
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-blue-700/50 p-3 rounded-2xl border border-blue-500/30 text-center">
                  <span className="block text-blue-200 text-xs mb-1">Protein</span>
                  <span className="font-bold text-lg">{results.macros.p}g</span>
                  <span className="block text-blue-300/50 text-[10px] mt-1">{Math.round((results.macros.p*4/results.target)*100)}%</span>
                </div>
                <div className="bg-blue-700/50 p-3 rounded-2xl border border-blue-500/30 text-center">
                  <span className="block text-blue-200 text-xs mb-1">Carbs</span>
                  <span className="font-bold text-lg">{results.macros.c}g</span>
                  <span className="block text-blue-300/50 text-[10px] mt-1">{Math.round((results.macros.c*4/results.target)*100)}%</span>
                </div>
                <div className="bg-blue-700/50 p-3 rounded-2xl border border-blue-500/30 text-center">
                  <span className="block text-blue-200 text-xs mb-1">Fats</span>
                  <span className="font-bold text-lg">{results.macros.f}g</span>
                  <span className="block text-blue-300/50 text-[10px] mt-1">{Math.round((results.macros.f*9/results.target)*100)}%</span>
                </div>
              </div>

              <button onClick={handleSaveGoals} className="w-full bg-white text-blue-600 hover:bg-blue-50 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                <Save size={20} /> Update Dashboard Parameters
              </button>
            </div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          </div>

          {/* Timeline Projection Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <TrendingDown size={18} className={results.weeklyChange < 0 ? "text-blue-500" : "text-green-500 transform rotate-180"} /> 
              Progression Trajectory
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
                <span className="text-neutral-400 text-sm">Estimated Rate</span>
                <span className="text-white font-medium">
                  {results.weeklyChange > 0 ? "+" : ""}{results.weeklyChange.toFixed(2)} kg / week
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">12-Week Projection</span>
                <span className="text-white font-medium">
                  {results.weeklyChange > 0 ? "+" : ""}{(results.weeklyChange * 12).toFixed(1)} kg total
                </span>
              </div>
            </div>
          </div>

          {/* Advanced Insights Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Info size={18} className="text-blue-500" /> Protocol Insights
            </h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              {results.insights.map((tip, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-neutral-600">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}