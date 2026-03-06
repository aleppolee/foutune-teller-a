import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 從環境變數讀取 API Key (Vercel Serverless Function 環境)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "伺服器未設定 API Key，請檢查 Vercel 環境變數。" });
  }

  const { selectedMethod, formData } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro", // 切換至使用者指定的 2.5 版本
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const prompt = `
      你是一位極具現代感且洞察力深刻的占卜師，擅長將神祕學轉化為溫暖且有力量的心理指引。
      當前占卜方式：${selectedMethod?.name}。
      使用者提供的資訊：${JSON.stringify(formData)}。

      重要提示：如果使用者提供的是西元/國曆日期（birthdate），請你根據該日期自動換算為對應的「農曆」或「干支曆」進行解析。
      請以「白話、親切、且直指內心核心」的口吻進行解析。
      請用現代人能感同身受的語言（例如：焦慮、內耗、共感、職場定位等）來解釋命運。

      你必須回傳一個「純 JSON 物件」，嚴禁包含任何 Markdown 標籤（如 \`\`\`json）或額外文字。
      格式要求如下（內容必須使用繁體中文）：
      {
        "career": "關於事業發展與個人價值的白話分析與建議...",
        "health": "針對目前能量與身心狀態的關懷與提醒...",
        "fortune": "關於物質生活與金錢觀念的務實建議...",
        "love": "關於人際關係與靈魂連結的感性洞察...",
        "future": "未來發展的具體方向與需要把握的轉折點...",
        "summary": "一句溫暖、有力量且平易近人的核心啟示。",
        "imagePrompt": "一段豐富且具備藝術感的英文敘述，用於 AI 生成一張代表此次占卜氛圍的圖像（例如：'A mystical tarot-style illustration of a glowing phoenix rising from ashes, golden hour, cinematic lighting'）。"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 解析並回傳
    return res.status(200).json(JSON.parse(responseText));
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "生成占卜結果時發生錯誤" });
  }
}
