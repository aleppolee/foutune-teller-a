import { useState } from 'react'
import { GoogleGenerativeAI } from "@google/generative-ai";
import './App.css'

const Step = {
  SELECT_METHOD: 0,
  INPUT_DATA: 1,
  LOADING: 2,
  RESULT: 3
} as const;

type StepValue = typeof Step[keyof typeof Step];

interface FortuneMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  fields: { id: string; label: string; type: string; placeholder: string }[];
}

const METHODS: FortuneMethod[] = [
  {
    id: 'tarot',
    name: '塔羅',
    icon: '✦',
    description: '原型與視覺的指引',
    fields: [
      { id: 'question', label: '詢問之事', type: 'text', placeholder: '你渴望洞悉什麼？' },
      { id: 'focus', label: '目前處境', type: 'textarea', placeholder: '簡單描述你目前的生命狀態...' }
    ]
  },
  {
    id: 'bazi',
    name: '八字',
    icon: '☯',
    description: '時空的流動與定數',
    fields: [
      { id: 'name', label: '姓名', type: 'text', placeholder: '請輸入全名' },
      { id: 'birthdate', label: '出生日期', type: 'date', placeholder: '' },
      { id: 'birthtime', label: '出生時辰', type: 'time', placeholder: '' }
    ]
  },
  {
    id: 'astrology',
    name: '占星',
    icon: '✡',
    description: '星辰軌跡的交織',
    fields: [
      { id: 'birthdate', label: '出生日期', type: 'date', placeholder: '' },
      { id: 'birthplace', label: '出生地點', type: 'text', placeholder: '城市，國家' }
    ]
  },
  {
    id: 'ziwei',
    name: '紫微',
    icon: '✧',
    description: '斗數宮位的演繹',
    fields: [
      { id: 'name', label: '姓名', type: 'text', placeholder: '請輸入全名' },
      { id: 'birthdate', label: '出生日期 (西元)', type: 'date', placeholder: '' },
      { id: 'gender', label: '性別特質', type: 'select', placeholder: '' }
    ]
  }
];

interface FortuneResult {
  career: string;
  health: string;
  fortune: string;
  love: string;
  future: string;
  summary: string;
  imageKeyword: string;
}

function App() {
  const [step, setStep] = useState<StepValue>(Step.SELECT_METHOD);
  const [selectedMethod, setSelectedMethod] = useState<FortuneMethod | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [error, setError] = useState<string>('');

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  const handleMethodSelect = (method: FortuneMethod) => {
    setSelectedMethod(method);
    setStep(Step.INPUT_DATA);
  };

  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const startFortuneTelling = async () => {
    if (!apiKey) {
      setError('系統配置缺失：未找到 API 金鑰。');
      return;
    }
    setError('');
    setStep(Step.LOADING);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // 恢復為原本使用的 Pro 模型，並啟用 JSON 模式
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-pro",
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
          "imageKeyword": "一個代表此次氛圍的英文單詞，用於配圖（如：breeze, light, connection, road）。"
        }
      `;

      const apiResult = await model.generateContent(prompt);
      const apiResponse = await apiResult.response;
      let text = apiResponse.text();
      
      // 移除可能存在的 Markdown 標記或多餘空白
      text = text.replace(/```json|```/g, "").trim();
      
      // 尋找 JSON 的起始與結束位置，確保解析範圍正確
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) throw new Error("AI 回傳內容不包含有效的 JSON 格式");
      
      const cleanJson = text.substring(firstBrace, lastBrace + 1);
      const parsedResult: FortuneResult = JSON.parse(cleanJson);
      
      setResult(parsedResult);
      setStep(Step.RESULT);
    } catch (err: any) {
      console.error(err);
      setError(`連結失敗：${err.message || '請確認 API 金鑰權限'}`);
      setStep(Step.INPUT_DATA);
    }
  };

  return (
    <div className="container">
      <header className="fade-in">
        <h1 className="title">靈曦之諭</h1>
        <p className="subtitle">暗影揭示光芒所不能及之處</p>
      </header>

      {error && <p className="error-msg">{error}</p>}

      <main className="fade-in">
        {step === Step.SELECT_METHOD && (
          <div className="methods-grid">
            {METHODS.map(method => (
              <div key={method.id} className="method-card" onClick={() => handleMethodSelect(method)}>
                <span className="method-icon">{method.icon}</span>
                <span className="method-name">{method.name}</span>
                <p className="method-desc">{method.description}</p>
              </div>
            ))}
          </div>
        )}

        {step === Step.INPUT_DATA && selectedMethod && (
          <div className="form-container">
            <button className="btn-back" onClick={() => setStep(Step.SELECT_METHOD)}>← 返回</button>
            <h2 className="form-title">{selectedMethod.name}</h2>
            {selectedMethod.fields.map(field => (
              <div key={field.id} className="form-group">
                <label>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea 
                    placeholder={field.placeholder}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    rows={4}
                  />
                ) : field.type === 'select' ? (
                  <select onChange={(e) => handleInputChange(field.id, e.target.value)}>
                    <option value="">選擇性別</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                ) : (
                  <input 
                    type={field.type} 
                    placeholder={field.placeholder}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  />
                )}
              </div>
            ))}
            <button className="btn-primary" onClick={startFortuneTelling}>啟動靈曦</button>
          </div>
        )}

        {step === Step.LOADING && (
          <div className="loading-container">
            <div className="loader-line"></div>
            <p className="loading-text">正在讀取命運的迴響</p>
          </div>
        )}

        {step === Step.RESULT && result && (
          <div className="result-container">
            <button className="btn-back" onClick={() => setStep(Step.SELECT_METHOD)}>← 再次占卜</button>
            
            <div className="result-header">
              <img 
                src={`https://source.unsplash.com/featured/?${result.imageKeyword},blackandwhite`} 
                alt="命運視覺" 
                className="result-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1000&q=80";
                }}
              />
              <p className="result-meta">視覺意象已紀錄</p>
            </div>

            <div className="result-grid">
              <div className="result-item">
                <h3>事業與志業</h3>
                <p>{result.career}</p>
              </div>
              <div className="result-item">
                <h3>物質流動</h3>
                <p>{result.fortune}</p>
              </div>
              <div className="result-item">
                <h3>靈魂共振</h3>
                <p>{result.love}</p>
              </div>
              <div className="result-item">
                <h3>身心平衡</h3>
                <p>{result.health}</p>
              </div>
              <div className="result-item" style={{ gridColumn: '1 / -1' }}>
                <h3>命運長河</h3>
                <p>{result.future}</p>
              </div>
            </div>

            <div className="summary-block">
              <p className="summary-text">{result.summary}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
