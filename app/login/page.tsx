"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Next.js router for redirecting
import { supabase } from "../lib/supabase"; // Your database bridge
import { Activity, Flame, Plus, Utensils, LogOut } from "lucide-react";
import WeightChart from "../components/WeightChart";

export default function Dashboard() {
  const router = useRouter();
  
  // New state to hold the logged-in user's data
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Existing tracker state
  const [calorieTarget, setCalorieTarget] = useState(2500); 
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [mealInput, setMealInput] = useState("");

  const caloriesRemaining = calorieTarget - caloriesConsumed;
  const isOverLimit = caloriesRemaining < 0;

  // THIS IS THE SECURITY CHECK: It runs the moment the page loads
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // If no session exists, kick them to the login page!
        router.push("/login");
      } else {
        // If they are logged in, save their email to show on the screen
        setUserEmail(session.user.email ?? "Athlete");
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  // Function to securely log out
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleLogMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealInput) return;
    setCaloriesConsumed((prev) => prev + parseInt(mealInput));
    setMealInput(""); 
  };

  // Show a blank dark screen while checking security to prevent flashing
  if (isLoading) return <div className="min-h-screen bg-neutral-950"></div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12">
      
      <header className="mb-10 flex justify-between items-start">
        <div>
          {/* Dynamic Greeting! */}
          <h1 className="text-3xl font-bold tracking-tight">Welcome back,</h1>
          <h2 className="text-xl text-blue-500 font-semibold mt-1">{userEmail}</h2>
          <p className="text-neutral-400 mt-2">Here is your daily summary.</p>
        </div>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-red-500 transition-colors p-2 bg-neutral-900 rounded-lg border border-neutral-800"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calorie Tracker Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Utensils size={24} />
            </div>
            <h2 className="text-xl font-semibold">Nutrition</h2>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <span className={`text-5xl font-bold tracking-tighter ${isOverLimit ? 'text-red-500' : 'text-neutral-100'}`}>
              {Math.abs(caloriesRemaining)}
            </span>
            <span className="text-neutral-400 mt-2 font-medium">
              {isOverLimit ? "calories over limit" : "calories remaining"}
            </span>
          </div>

          <form onSubmit={handleLogMeal} className="flex gap-2 mt-4">
            <input
              type="number"
              placeholder="Add calories..."
              value={mealInput}
              onChange={(e) => setMealInput(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors"
            >
              <Plus size={24} />
            </button>
          </form>
        </div>

        {/* Streak Card */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-300">Workout Streak</h2>
              <p className="text-3xl font-bold mt-1">4 Days</p>
            </div>
            <div className="p-4 bg-orange-500/10 rounded-full text-orange-500">
              <Flame size={32} />
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-300">Daily Steps</h2>
              <p className="text-3xl font-bold mt-1">8,432</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-full text-green-500">
              <Activity size={32} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <WeightChart />
      </div>

    </div>
  );
}