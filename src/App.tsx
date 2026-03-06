import { useState } from 'react'
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

  const handleMethodSelect = (method: FortuneMethod) => {
    setSelectedMethod(method);
    setStep(Step.INPUT_DATA);
  };

  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const startFortuneTelling = async () => {
    setError('');
    setStep(Step.LOADING);

    try {
      // 呼叫 Vercel Serverless Function API
      const response = await fetch('/api/fortune', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedMethod,
          formData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '伺服器請求失敗');
      }

      const data: FortuneResult = await response.json();
      setResult(data);
      setStep(Step.RESULT);
    } catch (err: any) {
      console.error(err);
      setError(`占卜失敗：${err.message || '請確認網路連線'}`);
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
