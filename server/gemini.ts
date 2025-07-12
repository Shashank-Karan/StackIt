import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateAIResponse(userMessage: string): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("Gemini API key is not configured");
      throw new Error("Gemini API key is not configured");
    }

    console.log("Generating AI response for:", userMessage.substring(0, 100) + "...");

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

    console.log("Gemini API response received successfully");
    
    const responseText = response.text;
    if (!responseText) {
      console.error("Empty response from Gemini API");
      return "I'm sorry, I couldn't generate a response at the moment. Please try again.";
    }

    return responseText;
  } catch (error: any) {
    console.error("Detailed error generating AI response:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status
    });
    
    // Return a more specific error message based on the error type
    if (error.message?.includes('API key')) {
      throw new Error("API key configuration issue. Please check your Gemini API key.");
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      throw new Error("API quota exceeded. Please try again later.");
    } else if (error.message?.includes('network') || error.message?.includes('connection')) {
      throw new Error("Network connection issue. Please check your internet connection.");
    } else {
      throw new Error("AI service temporarily unavailable. Please try again in a few moments.");
    }
  }
}