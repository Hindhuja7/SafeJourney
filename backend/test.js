import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Return JSON: {\"score\": 5, \"reason\": \"Test successful\"}",
  });
  console.log("Gemini API Response:\n", response.text);
}

test();
