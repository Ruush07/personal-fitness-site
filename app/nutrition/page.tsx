"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Sparkles, Utensils, Loader2, Flame } from "lucide-react";

export default function NutritionPage() {
  const router = useRouter();
  
  const [mealInput, setMealInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [todaysLogs, setTodaysLogs] = useState<any[]>([]);
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  useEffect(() => {
    const fetchLogs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: logs } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (logs) {
        setTodaysLogs(logs);
        const totals = logs.reduce((acc, log) => ({
          calories: acc.calories + log.calories,
          protein: acc.protein + log.protein,
          carbs: acc.carbs + log.carbs,
          fats: acc.fats + log.fats // FIXED: changed from log.fat to log.fats
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
        
        setDailyTotals(totals);
      }
    };
    
    fetchLogs();
  }, [router]);

  const handleAnalyzeMeal = async () => {
    if (!mealInput.trim()) return;
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealText: mealInput }) 
      });

      if (!response.ok) throw new Error("AI failed to process meal");
      const aiData = await response.json();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: newLog, error } = await supabase
        .from('nutrition_logs')
        .insert([{
          user_id: session.user.id,
          log_date: new Date().toISOString().split('T')[0],
          meal_name: aiData.meal_name, 
          calories: aiData.calories,
          protein: aiData.protein,
          carbs: aiData.carbs,
          fats: aiData.fats // FIXED: changed from fat to fats
        }])
        .select()
        .single();

      if (error) {
        console.error("SUPABASE ERROR:", error);
        throw new Error(`Database Error: ${error.message}`);
      }

      setTodaysLogs([newLog, ...todaysLogs]);
      setDailyTotals(prev => ({
        calories: prev.calories + newLog.calories,
        protein: prev.protein + newLog.protein,
        carbs: prev.carbs + newLog.carbs,
        fats: prev.fats + newLog.fats // FIXED
      }));
      
      setMealInput(""); 

    } catch (error: any) {
      console.error("FRONTEND CRASH:", error);
      // FIXED: The real error will now actually show up on your screen!
      alert(`THE REAL ERROR: ${error.message || "Unknown crash"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen text-neutral-100 pb-24">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          AI Nutrition <Utensils className="text-orange-500" />
        </h1>
        <p className="text-neutral-400 mt-2">Describe your meal naturally. Let Gemini do the math.</p>
      </header>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-2 shadow-lg flex items-center gap-2 mb-10 transition-all focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/50">
        <input 
          type="text" 
          value={mealInput}
          onChange={(e) => setMealInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeMeal()}
          placeholder="e.g., 3 scrambled eggs, a slice of sourdough..."
          className="flex-1 bg-transparent border-none p-4 text-white placeholder:text-neutral-500 outline-none"
          disabled={isAnalyzing}
        />
        <button 
          onClick={handleAnalyzeMeal}
          disabled={isAnalyzing || !mealInput.trim()}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white p-4 rounded-2xl font-bold transition-all flex items-center gap-2"
        >
          {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
          <span className="hidden md:inline">{isAnalyzing ? "Analyzing..." : "Log Meal"}</span>
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Today's Intake</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col justify-center items-center">
            <span className="text-neutral-400 text-xs mb-1 flex items-center gap-1"><Flame size={12}/> Calories</span>
            <span className="text-2xl font-bold text-white">{dailyTotals.calories}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col justify-center items-center">
            <span className="text-blue-400 text-xs mb-1">Protein</span>
            <span className="text-2xl font-bold text-white">{dailyTotals.protein}g</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col justify-center items-center">
            <span className="text-green-400 text-xs mb-1">Carbs</span>
            <span className="text-2xl font-bold text-white">{dailyTotals.carbs}g</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col justify-center items-center">
            <span className="text-orange-400 text-xs mb-1">Fats</span>
            <span className="text-2xl font-bold text-white">{dailyTotals.fats}g</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {todaysLogs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-neutral-800 rounded-3xl text-neutral-500">
            <Utensils size={32} className="mx-auto mb-3 opacity-20" />
            <p>You haven't logged any meals today.</p>
          </div>
        ) : (
          todaysLogs.map((log) => (
            <div key={log.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                {/* FIXED: Changed log.food_desc to log.meal_name */}
                <h3 className="font-bold text-white text-lg capitalize">{log.meal_name}</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex gap-4 text-sm font-medium">
                <div className="text-neutral-300">{log.calories} <span className="text-neutral-500 text-xs font-normal">kcal</span></div>
                <div className="text-blue-300">{log.protein}g <span className="text-blue-500/50 text-xs font-normal">P</span></div>
                <div className="text-green-300">{log.carbs}g <span className="text-green-500/50 text-xs font-normal">C</span></div>
                <div className="text-orange-300">{log.fats}g <span className="text-orange-500/50 text-xs font-normal">F</span></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}