import { useState, useEffect } from 'react'
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
  fields: { id: string; label: string; type: string; placeholder: string; required?: boolean }[];
}

const METHODS: FortuneMethod[] = [
  {
    id: 'tarot',
    name: '塔羅',
    icon: '✦',
    description: '原型與視覺的指引',
    fields: [
      { id: 'question', label: '詢問之事', type: 'text', placeholder: '你渴望洞悉什麼？', required: true },
      { id: 'focus', label: '目前處境', type: 'textarea', placeholder: '簡單描述你目前的生命狀態...', required: true }
    ]
  },
  {
    id: 'bazi',
    name: '八字',
    icon: '☯',
    description: '時空的流動與定數',
    fields: [
      { id: 'name', label: '姓名', type: 'text', placeholder: '請輸入全名', required: true },
      { id: 'birthdate', label: '出生日期', type: 'date', placeholder: '', required: true },
      { id: 'birthtime', label: '出生時辰', type: 'time', placeholder: '', required: true }
    ]
  },
  {
    id: 'astrology',
    name: '占星',
    icon: '✡',
    description: '星辰軌跡的交織',
    fields: [
      { id: 'birthdate', label: '出生日期', type: 'date', placeholder: '', required: true },
      { id: 'birthplace', label: '出生地點', type: 'text', placeholder: '城市，國家', required: true }
    ]
  },
  {
    id: 'ziwei',
    name: '紫微',
    icon: '✧',
    description: '斗數宮位的演繹',
    fields: [
      { id: 'name', label: '姓名', type: 'text', placeholder: '請輸入全名', required: true },
      { id: 'birthdate', label: '出生日期 (西元)', type: 'date', placeholder: '', required: true },
      { id: 'gender', label: '性別特質', type: 'select', placeholder: '', required: true }
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
  imagePrompt: string;
}

// 打字機效果組件
function Typewriter({ text, speed = 30 }: { text: string, speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <>{displayedText}</>;
}

function App() {
  const [step, setStep] = useState<StepValue>(Step.SELECT_METHOD);
  const [selectedMethod, setSelectedMethod] = useState<FortuneMethod | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isValid, setIsValid] = useState(false);

  // 初始化時讀取舊紀錄
  useEffect(() => {
    const saved = localStorage.getItem('last_fortune');
    if (saved) {
      setResult(JSON.parse(saved));
      // 如果有舊紀錄，可以選擇是否直接顯示，這裡我們維持在選擇介面，但提供「查看上次結果」
    }
  }, []);

  // 驗證欄位
  useEffect(() => {
    if (!selectedMethod) return;
    const allFilled = selectedMethod.fields
      .filter(f => f.required)
      .every(f => formData[f.id] && formData[f.id].trim() !== '');
    setIsValid(allFilled);
  }, [formData, selectedMethod]);

  const handleMethodSelect = (method: FortuneMethod) => {
    setSelectedMethod(method);
    setFormData({});
    setStep(Step.INPUT_DATA);
  };

  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const startFortuneTelling = async () => {
    if (!isValid) {
      setError('請填寫所有必填欄位，命運需要明確的引導。');
      return;
    }
    setError('');
    setStep(Step.LOADING);

    try {
      const response = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedMethod, formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '靈力連動失敗');
      }

      const data: FortuneResult = await response.json();
      setResult(data);
      localStorage.setItem('last_fortune', JSON.stringify(data));
      setStep(Step.RESULT);
    } catch (err: any) {
      console.error(err);
      setError(`占卜中斷：${err.message}`);
      setStep(Step.INPUT_DATA);
    }
  };

  return (
    <div className="container">
      <header className="fade-in">
        <h1 className="title">靈曦之諭</h1>
        <p className="subtitle">解鎖暗影中的智慧，指引靈魂的流向</p>
      </header>

      {error && <p className="error-msg" style={{color: '#ff4d4d', textAlign: 'center'}}>{error}</p>}

      <main className="fade-in">
        {step === Step.SELECT_METHOD && (
          <div className="methods-grid">
            {METHODS.map(method => (
              <div key={method.id} className="method-card" onClick={() => handleMethodSelect(method)}>
                <span className="method-icon">{method.icon}</span>
                <h2 className="method-name" style={{margin: '10px 0'}}>{method.name}</h2>
                <p className="method-desc" style={{fontSize: '0.9rem', color: '#888'}}>{method.description}</p>
              </div>
            ))}
            {result && (
              <div 
                className="method-card" 
                style={{borderColor: 'var(--accent)', gridColumn: '1 / -1'}} 
                onClick={() => setStep(Step.RESULT)}
              >
                <span className="method-icon">📜</span>
                <h2 className="method-name">回顧上次諭旨</h2>
              </div>
            )}
          </div>
        )}

        {step === Step.INPUT_DATA && selectedMethod && (
          <div className="form-container">
            <button className="btn-back" onClick={() => setStep(Step.SELECT_METHOD)} style={{background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginBottom: '20px'}}>← 返回選擇</button>
            <h2 className="form-title" style={{marginBottom: '30px', color: 'var(--accent)'}}>{selectedMethod.name} 占卜</h2>
            {selectedMethod.fields.map(field => (
              <div key={field.id} className="form-group">
                <label>{field.label} {field.required && <span style={{color: 'var(--primary-glow)'}}>*</span>}</label>
                {field.type === 'textarea' ? (
                  <textarea 
                    placeholder={field.placeholder}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    rows={4}
                  />
                ) : field.type === 'select' ? (
                  <select onChange={(e) => handleInputChange(field.id, e.target.value)}>
                    <option value="">選擇性別</option>
                    <option value="male">乾 (男)</option>
                    <option value="female">坤 (女)</option>
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
            <button 
              className="btn-primary" 
              onClick={startFortuneTelling}
              disabled={!isValid}
            >
              開啟命運之門
            </button>
          </div>
        )}

        {step === Step.LOADING && (
          <div className="loading-container">
            <div className="mystic-orb"></div>
            <p className="loading-text" style={{letterSpacing: '0.3rem'}}>正在凝結時空的碎片...</p>
          </div>
        )}

        {step === Step.RESULT && result && (
          <div className="result-container">
            <button className="btn-back" onClick={() => setStep(Step.SELECT_METHOD)} style={{background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginBottom: '20px'}}>← 重新占卜</button>
            
            <div className="result-header">
              <img 
                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(result.imagePrompt)}?width=1000&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`} 
                alt="命運視覺" 
                className="result-image"
              />
            </div>

            <div className="result-grid">
              <div className="result-item">
                <h3>事業與天職</h3>
                <p><Typewriter text={result.career} /></p>
              </div>
              <div className="result-item">
                <h3>財富流動</h3>
                <p><Typewriter text={result.fortune} /></p>
              </div>
              <div className="result-item">
                <h3>情感連結</h3>
                <p><Typewriter text={result.love} /></p>
              </div>
              <div className="result-item">
                <h3>身心平衡</h3>
                <p><Typewriter text={result.health} /></p>
              </div>
              <div className="result-item" style={{ gridColumn: '1 / -1' }}>
                <h3>未來趨勢</h3>
                <p><Typewriter text={result.future} /></p>
              </div>
            </div>

            <div className="summary-block">
              <p className="summary-text">
                <Typewriter text={result.summary} speed={50} />
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
