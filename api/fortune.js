import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  const { selectedMethod, formData, imageData } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.8 }
    });

    const promptText = `你是一位融合了神祕學與現代心理學的「靈曦大導師」。
      當前占卜方式：${selectedMethod?.name}。
      使用者提供的資訊：${JSON.stringify(formData)}。
      
      任務要求：
      1. 提供深度解析，語氣神祕、溫暖且具備洞察力。
      2. 額外提供今日的「幸運色」與「幸運數字」。

      回傳格式 (JSON)：
      {
        "career": "事業解析...",
        "fortune": "財運解析...",
        "love": "感情解析...",
        "health": "能量解析...",
        "future": "未來轉折...",
        "summary": "一句核心啟示。",
        "lucky": {
          "color": "中文顏色名稱",
          "number": "一個數字"
        }
      }`;

    let result;
    if (imageData) {
      result = await model.generateContent([
        { inlineData: { mimeType: "image/jpeg", data: imageData.split(',')[1] } },
        { text: promptText }
      ]);
    } else {
      result = await model.generateContent(promptText);
    }

    return res.status(200).json(JSON.parse(result.response.text()));
  } catch (error) {
    console.error("Gemini Error:", error);
    const message = error instanceof Error ? error.message : "Unknown Gemini API error";
    return res.status(500).json({ error: `靈力連動中斷：${message}` });
  }
}
