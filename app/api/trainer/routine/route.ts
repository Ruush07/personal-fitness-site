import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const allowedGoals = new Set(["build muscle", "get stronger", "general fitness", "fat loss"]);
const allowedExperience = new Set(["beginner", "intermediate", "advanced"]);

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Authentication is not configured yet." }, { status: 503 });
  }
  if (!accessToken) return NextResponse.json({ error: "Please sign in to build a routine." }, { status: 401 });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI routine building is not configured yet. Add GEMINI_API_KEY to the app environment." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const goal = String(body.goal ?? "").slice(0, 40);
    const experience = String(body.experience ?? "").slice(0, 20);
    const equipment = String(body.equipment ?? "").slice(0, 300);
    const daysPerWeek = Math.min(6, Math.max(2, Number(body.daysPerWeek) || 3));
    const focus = String(body.focus ?? "").slice(0, 120);

    if (!allowedGoals.has(goal) || !allowedExperience.has(experience) || !equipment.trim()) {
      return NextResponse.json({ error: "Choose a goal and experience level, and describe the equipment you have." }, { status: 400 });
    }

    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Create a practical, conservative strength-training routine for a general adult. Use only the equipment listed. Do not give medical advice, diagnose injuries, or promise results. Keep workouts to 4-6 exercises, use sensible beginner volume, and include a short reason per exercise. Return only JSON with this shape: {"routine_name":"...","exercises":[{"name":"...","sets":3,"reps":8,"rest_seconds":90,"reason":"..."}]}. Goal: ${goal}. Experience: ${experience}. Days per week: ${daysPerWeek}. Equipment: ${equipment}. Optional focus: ${focus || "balanced full-body development"}.`;
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The routine response was not valid JSON.");

    const parsed = JSON.parse(match[0]) as { routine_name?: unknown; exercises?: unknown };
    if (typeof parsed.routine_name !== "string" || !Array.isArray(parsed.exercises)) {
      throw new Error("The routine response was missing required fields.");
    }

    const exercises = parsed.exercises.slice(0, 8).flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const exercise = entry as Record<string, unknown>;
      if (typeof exercise.name !== "string" || !exercise.name.trim()) return [];
      const bounded = (value: unknown, min: number, max: number, fallback: number) => {
        const number = Number(value);
        return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback;
      };
      return [{
        name: exercise.name.trim().slice(0, 80),
        sets: bounded(exercise.sets, 1, 5, 3),
        reps: bounded(exercise.reps, 4, 20, 8),
        weight: 0,
        restSeconds: bounded(exercise.rest_seconds, 30, 300, 90),
        reason: typeof exercise.reason === "string" ? exercise.reason.slice(0, 180) : "Chosen to support your stated training goal.",
      }];
    });

    if (!exercises.length) throw new Error("The routine did not contain usable exercises.");
    return NextResponse.json({ routine_name: parsed.routine_name.slice(0, 60), exercises });
  } catch (error) {
    console.error("AI routine generation failed:", error);
    return NextResponse.json({ error: "Could not build a routine right now. Please try again." }, { status: 502 });
  }
}
