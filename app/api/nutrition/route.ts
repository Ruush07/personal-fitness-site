import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Fallback to empty string prevents crash if env var is missing locally
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { mealText } = await req.json();

    // Using the explicit latest tag
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });//chalja bhai pls 

    const prompt = `
      You are an expert nutritionist. Analyze the following meal description and estimate the total calories, protein, carbs, and fats.
      Respond ONLY with a valid JSON object.

      Meal Description: "${mealText}"

      Expected JSON format:
      {
        "meal_name": "Short 3-word summary",
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fats": 0
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // SERVER LOG: This prints the raw AI output to your Vercel logs so we can see what it actually said
    console.log("RAW AI RESPONSE:", responseText);

    // BULLETPROOF JSON EXTRACTOR: 
    // This looks for the first '{' and the last '}' and grabs everything inside it, ignoring markdown.
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("AI did not return a valid JSON structure.");
    }

    // Parse the cleanly extracted JSON string
    const nutritionData = JSON.parse(jsonMatch[0]);

    return NextResponse.json(nutritionData);
    
  } catch (error) {
    // This logs the exact crash reason to Vercel
    console.error("AI ROUTE CRASHED:", error);
    return NextResponse.json({ error: "Failed to analyze meal" }, { status: 500 });
  }
}