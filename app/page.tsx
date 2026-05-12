"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase"; 
import { Activity, Flame, Utensils, LogOut, ChevronRight } from "lucide-react";
import WeightChart from "../components/WeightChart";

export default function Dashboard() {
  const router = useRouter();
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Central State for our Math & UI
  const [calorieTarget, setCalorieTarget] = useState(2000); 
  const [meals, setMeals] = useState<any[]>([]);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);

  // Fetch all user data when the dashboard loads
  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }
      
      setUserEmail(session.user.email ?? "Athlete");

      // 1. Fetch the custom goal from the Profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('target_calories')
        .eq('id', session.user.id)
        .single();

      if (profile && profile.target_calories) {
        setCalorieTarget(profile.target_calories);
      }

      // 2. Fetch today's meals from the Nutrition Logs table
      // We get midnight of today to only show today's food
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: logs } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (logs) {
        setMeals(logs);
        // Add up all the calories from today's meals
        const total = logs.reduce((sum, meal) => sum + meal.calories, 0);
        setCaloriesConsumed(total);
      }

      setIsLoading(false);
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // --- Math for the UI ---
  const caloriesRemaining = calorieTarget - caloriesConsumed;
  const isOverLimit = caloriesRemaining < 0;
  
  // Math for the Circular Progress Ring
  const progressPercentage = Math.min((caloriesConsumed / calorieTarget) * 100, 100);
  const ringCircumference = 2 * Math.PI * 45; // 45 is the radius of our SVG circle
  const strokeDashoffset = ringCircumference - (progressPercentage / 100) * ringCircumference;

  if (isLoading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-500">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12 overflow-y-auto">
      
      <header className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back,</h1>
          <h2 className="text-xl text-blue-500 font-semibold mt-1">{userEmail}</h2>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-red-500 transition-colors p-2 bg-neutral-900 rounded-lg border border-neutral-800">
          <LogOut size={16} /> Sign Out
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* THE NEW CIRCULAR CALORIE TRACKER */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* SVG Circular Ring */}
          <div className="relative flex items-center justify-center w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background Ring */}
              <circle cx="96" cy="96" r="45" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-neutral-800" />
              {/* Progress Ring */}
              <circle 
                cx="96" cy="96" r="45" stroke="currentColor" strokeWidth="12" fill="transparent" 
                className={`${isOverLimit ? 'text-red-500' : 'text-blue-500'} transition-all duration-1000 ease-in-out`}
                strokeDasharray={ringCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-4xl font-bold ${isOverLimit ? 'text-red-500' : 'text-white'}`}>
                {Math.abs(caloriesRemaining)}
              </span>
              <span className="text-xs text-neutral-400 font-medium mt-1">
                {isOverLimit ? "OVER LIMIT" : "REMAINING"}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex-1 w-full space-y-4">
            <div className="flex justify-between items-center bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-900 rounded-lg text-neutral-400"><Utensils size={18} /></div>
                <span className="text-neutral-300 font-medium">Daily Target</span>
              </div>
              <span className="font-bold text-lg">{calorieTarget}</span>
            </div>
            <div className="flex justify-between items-center bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Flame size={18} /></div>
                <span className="text-neutral-300 font-medium">Consumed</span>
              </div>
              <span className="font-bold text-lg">{caloriesConsumed}</span>
            </div>
          </div>
        </div>

        {/* TODAY'S MEALS LIST */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col h-full max-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-100">Today's Meals</h2>
            <button onClick={() => router.push('/nutrition')} className="text-sm text-blue-500 hover:text-blue-400 flex items-center">
              Log Meal <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {meals.length === 0 ? (
              <div className="text-center text-neutral-500 mt-10 text-sm">No meals logged today yet.</div>
            ) : (
              meals.map((meal, index) => (
                <div key={index} className="flex justify-between items-center bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <div className="truncate pr-4">
                    <p className="text-sm font-medium text-neutral-200 truncate">{meal.meal_name || "Custom Meal"}</p>
                    <p className="text-xs text-neutral-500 truncate">P:{meal.protein}g • C:{meal.carbs}g • F:{meal.fats}g</p>
                  </div>
                  <span className="text-blue-400 font-bold text-sm shrink-0">{meal.calories} cal</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <WeightChart />
      </div>

    </div>
  );
}