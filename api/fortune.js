import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  const { selectedMethod, formData, imageData } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: { responseMimeType: "application/json", temperature: 0.8 }
    });

    let promptContent = [
      `你是一位融合了古老神祕學、現代心理學與影像分析能力的「靈曦大導師」。
      當前占卜方式：${selectedMethod?.name}。
      使用者提供的資訊：${JSON.stringify(formData)}。
      
      任務要求：
      1. 根據所選方法提供深度解析。
      2. 如果使用者有上傳圖片（如手相或面相），請根據視覺特徵（紋路、神態、光澤）給出專業且具備洞察力的解讀。
      3. 語氣神祕且溫暖，內容字數約 100-200 字。
      
      回傳格式 (JSON)：
      {
        "career": "事業解析...",
        "health": "身心解析...",
        "fortune": "財運解析...",
        "love": "感情解析...",
        "future": "未來轉折...",
        "summary": "核心啟示...",
        "imagePrompt": "Short English prompt for AI image generation. Theme: ${selectedMethod?.name}, ethereal, cosmic."
      }`
    ];

    // 如果有圖片資料，加入到 Prompt 中
    if (imageData) {
      const parts = [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData.split(',')[1] // 移除 base64 前綴
          }
        },
        { text: promptContent[0] }
      ];
      const result = await model.generateContent(parts);
      return res.status(200).json(JSON.parse(result.response.text()));
    } else {
      const result = await model.generateContent(promptContent[0]);
      return res.status(200).json(JSON.parse(result.response.text()));
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ error: "靈力連動中斷，請稍後再試。" });
  }
}
