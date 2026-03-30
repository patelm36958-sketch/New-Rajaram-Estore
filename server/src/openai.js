import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This pulls from your .env file safely
});

export const generateAIResponse = async (prompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // gpt-5-nano isn't public; use 4o-mini for fast/cheap results
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return null;
  }
};