import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize the Gemini AI using the key from your .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // Grab the text the user typed in the frontend
    const { mealText } = await req.json();

    // 2. Select the fastest AI model for text processing
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // 3. Write a strict Prompt System Instruction
    const prompt = `
      You are an expert nutritionist. Analyze the following meal description and estimate the total calories, protein, carbs, and fats.
      Respond ONLY with a valid JSON object. Do not include any markdown formatting, explanations, or plain text.

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

    // 4. Send to Gemini and wait for the response
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // 5. Clean up the AI's response to ensure it's pure data, then convert it to a Javascript Object
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const nutritionData = JSON.parse(cleanJson);

    // Send the data back to the frontend!
    return NextResponse.json(nutritionData);
    
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Failed to analyze meal" }, { status: 500 });
  }
}