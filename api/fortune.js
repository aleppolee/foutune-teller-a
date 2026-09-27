import { GoogleGenerativeAI } from "@google/generative-ai";

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const methodGuidance = {
  tarot: "以使用者的「詢問之事」為唯一主題。先解讀問題背後的情緒與阻礙，再給出與該問題直接相關的建議。不要自行加入使用者沒有詢問的事業、財運或感情預測；所有回傳欄位都必須服務於這個問題。",
  palm: "以手掌照片可觀察到的掌紋與手型為依據，聚焦使用者的特別詢問。避免把無法從照片確認的內容說成確定事實，並提供務實、溫和的建議。",
  dream: "只解析夢境描述中的象徵、情緒與近期心理狀態。不要把夢境當成預言，也不要硬套與夢境無關的財運或感情結論。",
  iching: "依照起卦數字與占卜之事解讀變化趨勢。所有建議都要回應使用者的問題，說明目前局勢、可採取的行動與需要避免的事。",
  bazi: "依照出生日期、出生時辰與姓名提供性格和人生趨勢的象徵性解讀。內容要連結使用者提供的資料，不要做絕對或不可改變的斷言。"
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  const { selectedMethod, formData, imageData } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.8 }
    });

    const methodId = selectedMethod?.id || "unknown";
    const guidance = methodGuidance[methodId] || "緊扣使用者提供的資料與問題，不要添加未被詢問的主題。";
    const promptText = `你是一位融合了神祕學與現代心理學的「靈曦大導師」。
      當前占卜方式：${selectedMethod?.name}。
      使用者提供的資訊：${JSON.stringify(formData)}。

      這次占卜的專屬解讀規則：
      ${guidance}

      任務要求：
      1. 先找出使用者真正想知道的主題，再讓每一段內容都直接回應這個主題。
      2. career、fortune、love、health、future 只是介面欄位，不代表一定要談五個不相關的人生領域。
         如果某個欄位與提問無關，請把它解讀成「這個問題面向」的不同角度，而不是另起一個新主題。
      3. 不要捏造未提供的事實，不要做保證式或絕對的預言；語氣神祕、溫暖且具備洞察力。
      4. 額外提供與本次解讀相呼應的「幸運色」與「幸運數字」。

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

    const content = imageData
      ? [
          { inlineData: { mimeType: "image/jpeg", data: imageData.split(',')[1] } },
          { text: promptText }
        ]
      : promptText;

    let result;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        result = await model.generateContent(content);
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isTransient = /\[(429|500|503) [^\]]+\]/.test(message);
        if (!isTransient || attempt === 2) throw error;
        await sleep(1000 * 2 ** attempt);
      }
    }

    return res.status(200).json(JSON.parse(result.response.text()));
  } catch (error) {
    console.error("Gemini Error:", error);
    const message = error instanceof Error ? error.message : "Unknown Gemini API error";
    return res.status(500).json({ error: `靈力連動中斷：${message}` });
  }
}
