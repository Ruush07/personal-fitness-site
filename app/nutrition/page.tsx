"use client";

import { useState } from "react";
import { Sparkles, Utensils, Send } from "lucide-react";
//import { supabase } from "../lib/supabase"; // Your database bridge

export default function NutritionPage() {
  const [mealText, setMealText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // This is the function we will wire up to the AI in the next step!
  const handleAnalyzeMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealText) return;
    
    setIsAnalyzing(true);
    
    try {
      // 1. Verify the user is actually logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You must be logged in to save meals.");

      // 2. Send the text to our new Next.js AI API Route
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealText }),
      });
      
      const aiData = await res.json();
      
      // Update the UI with the actual AI numbers!
      setResult(aiData);

      // 3. Save it permanently to Supabase!
      await supabase.from("nutrition_logs").insert({
        user_id: session.user.id,
        meal_name: aiData.meal_name,
        calories: aiData.calories,
        protein: aiData.protein,
        carbs: aiData.carbs,
        fats: aiData.fats
      });

      setMealText(""); // Clear the text box for the next meal
      
    } catch (error) {
      console.error("Error logging meal:", error);
      alert("Oops! Something went wrong with the AI or Database.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen text-neutral-100">
      
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          Smart Nutrition <Sparkles className="text-blue-500" />
        </h1>
        <p className="text-neutral-400 mt-2">Describe what you ate, and our AI will calculate the macros and log it for you.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT SIDE: The AI Input Form */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col h-full">
          <form onSubmit={handleAnalyzeMeal} className="flex flex-col h-full flex-1">
            <label className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
              <Utensils size={16} /> Meal Description
            </label>
            <textarea
              value={mealText}
              onChange={(e) => setMealText(e.target.value)}
              placeholder="e.g., I had 1 bowl approx 150gm daal and then 200gm paneer for lunch..."
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[200px]"
            />
            <button
              type="submit"
              disabled={isAnalyzing || !mealText}
              className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                "Analyzing with AI..."
              ) : (
                <>Analyze & Log <Send size={18} /></>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT SIDE: The Results Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
          {result ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="text-center pb-6 border-b border-neutral-800">
                <h2 className="text-5xl font-bold text-white mb-2">{result.calories}</h2>
                <p className="text-neutral-400 font-medium">Total Calories Logged</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <span className="text-neutral-400">Protein</span>
                  <span className="font-bold text-lg">{result.protein}g</span>
                </div>
                <div className="flex justify-between items-center bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <span className="text-neutral-400">Carbs</span>
                  <span className="font-bold text-lg">{result.carbs}g</span>
                </div>
                <div className="flex justify-between items-center bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <span className="text-neutral-400">Fats</span>
                  <span className="font-bold text-lg">{result.fats}g</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-4 py-12">
              <Sparkles size={48} className="opacity-20" />
              <p className="text-center max-w-[250px]">Waiting for your meal description...</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}