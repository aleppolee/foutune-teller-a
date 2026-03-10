import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API Key Missing" });
  }

  const { selectedMethod, formData } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.8 // 稍微調高一點點，增加占卜的靈感與豐富度
      }
    });

    const prompt = `
      你是一位融合了古老神祕學與現代深度心理學的「靈曦占卜師」。
      當前占卜方式：${selectedMethod?.name}。
      使用者提供的資訊：${JSON.stringify(formData)}。

      任務要求：
      1. 如果涉及日期，請精確考慮節氣與曆法換算（如八字、紫微）。
      2. 語氣風格：神祕、溫暖、充滿洞察力，且具備現代感。避免老掉牙的江湖術語，改用「能量流動」、「心理投射」、「生命節奏」等詞彙。
      3. 內容深度：不僅僅是預測，更要提供「為何如此」的心理分析與「如何應對」的行動指引。

      回傳格式 (JSON)：
      {
        "career": "關於事業、才華展現與職場能量的深度分析（約100-150字）",
        "health": "關於身心平衡、情緒健康與能量修復的建議...",
        "fortune": "關於物質世界、價值觀與金錢流向的洞察...",
        "love": "關於人際連結、親密關係與內心共振的解析...",
        "future": "未來一至三個月的關鍵轉折點與生命主題...",
        "summary": "一句能震懾靈魂、提供核心力量的短評。",
        "imagePrompt": "A high-quality, mystical artistic description for AI image generation. Theme: ${selectedMethod?.name} combined with ethereal cosmic elements. Dark fantasy style, cinematic lighting, 8k."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.status(200).json(JSON.parse(responseText));
  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ error: "命運連線不穩，請稍後再試。" });
  }
}
