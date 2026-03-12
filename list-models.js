import { GoogleGenerativeAI } from "@google/generative-ai";

async function list() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY environment variable.");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // 這裡直接嘗試抓取清單
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

list();
