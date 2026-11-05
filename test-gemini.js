require("dotenv").config({ path: ".env.local" });

const { GoogleGenAI } = require("@google/genai");

async function testGemini() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API key not found");
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const response = await ai.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: "Reply with exactly: TriQR Gemini connection successful",
    });

    console.log("Gemini Response:");
    console.log(response.output_text);

  } catch (error) {
    console.error("Gemini connection failed:");
    console.error(error.message);
  }
}

testGemini();