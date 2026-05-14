import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { mealText } = await req.json();

    // MUST use the -latest tag here so Vercel can find it
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Your stricter prompt
    const prompt = `
      You are an expert nutritionist. Analyze the following meal description and estimate the total calories, protein, carbs, and fats.
      Respond ONLY with a valid JSON object. Do not include any markdown formatting, explanations, or plain text. only return the specifics asked in json format

      Meal Description: "${mealText}"

      Expected JSON format:
      {
        "meal_name": "Short 3-word summary of the food",
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fats": 0
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // We still keep the basic `.replace()` just in case it ignores your strict prompt
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const nutritionData = JSON.parse(cleanJson);

    return NextResponse.json(nutritionData);
    
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Failed to analyze meal" }, { status: 500 });
  }
}