import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateAIResponse(userMessage: string): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    const prompt = `You are a helpful AI assistant for StackIt, a Q&A platform. 
    A user has asked: "${userMessage}"
    
    Please provide a helpful, accurate, and informative response. Keep your answer concise but comprehensive.
    If the question is about programming, provide code examples when relevant.
    If the question is general knowledge, provide factual information.
    Always be polite and professional in your response.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "I'm sorry, I couldn't generate a response at the moment. Please try again.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Failed to generate AI response");
  }
}