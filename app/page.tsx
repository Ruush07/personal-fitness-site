"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, Flame, Dumbbell, Trophy } from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Athlete");
  
  // These are the targets we will fetch from the database
  const [targets, setTargets] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65
  });

  // Placeholder for what the user has actually eaten today (since we haven't built the food logger yet)
  const [consumed, setConsumed] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Grab the user's email prefix to use as a name (e.g., "aarush4724@gmail.com" -> "aarush4724")
      if (session.user.email) {
        setUserName(session.user.email.split('@')[0]);
      }

      // Fetch their saved targets from the database
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
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <Activity className="text-blue-500 animate-pulse" size={32} />
      </div>
    );
  }

  // Calculate percentages for the rings and bars
  const calPercentage = Math.min((consumed.calories / targets.calories) * 100, 100) || 0;
  const proPercentage = Math.min((consumed.protein / targets.protein) * 100, 100) || 0;
  const carbPercentage = Math.min((consumed.carbs / targets.carbs) * 100, 100) || 0;
  const fatPercentage = Math.min((consumed.fat / targets.fat) * 100, 100) || 0;

  // Math for the SVG Calorie Ring stroke
  const circleRadius = 50;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeOffset = circleCircumference - (calPercentage / 100) * circleCircumference;

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto min-h-screen text-neutral-100">
      
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Welcome back, <span className="text-blue-500">{userName}</span>
        </h1>
        <p className="text-neutral-400">Here is your daily overview. Stay on track.</p>
      </header>

      {/* TOP ROW: Calories & Macros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* The Fixed SVG Calorie Ring */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <h3 className="text-lg font-bold text-white mb-4 w-full text-left flex items-center gap-2">
            <Flame size={18} className="text-orange-500" /> Daily Calories
          </h3>
          
          <div className="relative w-48 h-48 flex items-center justify-center mb-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={circleRadius} fill="none" stroke="#262626" strokeWidth="8" />
              <circle 
                cx="60" cy="60" r={circleRadius} fill="none" stroke="#3b82f6" strokeWidth="8" 
                strokeLinecap="round" 
                strokeDasharray={circleCircumference} 
                strokeDashoffset={strokeOffset} 
                className="transition-all duration-1000 ease-out" 
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-3xl font-bold text-white tracking-tighter">{consumed.calories}</span>
              <span className="text-neutral-500 text-xs mt-1">/ {targets.calories - 100} - {targets.calories + 100} kcal</span>
            </div>
          </div>
          <p className="text-sm text-neutral-400">
            You have <span className="text-white font-semibold">{targets.calories - consumed.calories}</span> kcal remaining today.
          </p>
        </div>

        {/* Scaled Macro Progress Bars */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
          <h3 className="text-lg font-bold text-white mb-6">Macro Ranges</h3>
          <div className="space-y-6">
            
            {/* Protein */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-blue-400 font-medium text-sm">Protein</span>
                <span className="text-white font-bold text-sm">{consumed.protein}g <span className="text-neutral-500 font-normal">/ {targets.protein - 10}-{targets.protein + 10}g</span></span>
              </div>
              <div className="w-full bg-neutral-950 rounded-full h-3 border border-neutral-800">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${proPercentage}%` }}></div>
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-green-400 font-medium text-sm">Carbs</span>
                <span className="text-white font-bold text-sm">{consumed.carbs}g <span className="text-neutral-500 font-normal">/ {targets.carbs - 15}-{targets.carbs + 15}g</span></span>
              </div>
              <div className="w-full bg-neutral-950 rounded-full h-3 border border-neutral-800">
                <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${carbPercentage}%` }}></div>
              </div>
            </div>

            {/* Fats */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-orange-400 font-medium text-sm">Fats</span>
                <span className="text-white font-bold text-sm">{consumed.fat}g <span className="text-neutral-500 font-normal">/ {targets.fat - 5}-{targets.fat + 5}g</span></span>
              </div>
              <div className="w-full bg-neutral-950 rounded-full h-3 border border-neutral-800">
                <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${fatPercentage}%` }}></div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => window.location.href='/workouts'}>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <Dumbbell size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white">Log Workout</h3>
              <p className="text-sm text-neutral-400">Track your volume for today</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm hover:border-orange-500/50 transition-colors cursor-pointer" onClick={() => window.location.href='/nutrition'}>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
              <Flame size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white">Log Meal</h3>
              <p className="text-sm text-neutral-400">Scan or type what you ate</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}