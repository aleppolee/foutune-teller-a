import { useState, useEffect, useRef } from 'react'
import './App.css'

const Step = { SELECT_METHOD: 0, INPUT_DATA: 1, LOADING: 2, RESULT: 3 } as const;
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
    id: 'tarot', name: '塔羅', icon: '✦', description: '原型與視覺的指引',
    fields: [
      { id: 'question', label: '詢問之事', type: 'text', placeholder: '你渴望洞悉什麼？', required: true },
      { id: 'focus', label: '目前處境', type: 'textarea', placeholder: '簡單描述目前生命狀態...', required: true }
    ]
  },
  {
    id: 'palm', name: '靈曦手相', icon: '✋', description: '命運在掌紋中流動',
    fields: [
      { id: 'photo', label: '上傳清晰手掌照', type: 'file', placeholder: '', required: true },
      { id: 'question', label: '特別想詢問的領域', type: 'text', placeholder: '如：財運、姻緣', required: false }
    ]
  },
  {
    id: 'dream', name: '靈曦解夢', icon: '🌙', description: '潛意識的碎片重組',
    fields: [
      { id: 'dream', label: '描述你的夢境', type: 'textarea', placeholder: '色彩、物體、或是那種揮之不去的感覺...', required: true }
    ]
  },
  {
    id: 'iching', name: '易經卦象', icon: '⛩️', description: '兩儀四象，乾坤之理',
    fields: [
      { id: 'num1', label: '起卦數字一', type: 'number', placeholder: '請輸入心中浮現的第一個三位數', required: true },
      { id: 'num2', label: '起卦數字二', type: 'number', placeholder: '請輸入心中的第二個三位數', required: true },
      { id: 'question', label: '占卜之事', type: 'text', placeholder: '近期面臨的選擇', required: true }
    ]
  },
  {
    id: 'bazi', name: '八字', icon: '☯', description: '時空的流動與定數',
    fields: [
      { id: 'name', label: '姓名', type: 'text', placeholder: '請輸入全名', required: true },
      { id: 'birthdate', label: '出生日期', type: 'date', placeholder: '', required: true },
      { id: 'birthtime', label: '出生時辰', type: 'time', placeholder: '', required: true }
    ]
  }
];

interface FortuneResult {
  career: string; health: string; fortune: string; love: string; future: string; summary: string; imagePrompt: string;
}

function Typewriter({ text, speed = 30 }: { text: string, speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i)); i++;
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
  const [imageData, setImageData] = useState<string | null>(null);
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 能量牆邏輯
  const todayEnergy = (new Date().getDate() * 7 + 60) % 40 + 60; // 模擬隨機 60-100

  useEffect(() => {
    if (!selectedMethod) return;
    const allFilled = selectedMethod.fields
      .filter(f => f.required)
      .every(f => (f.type === 'file' ? imageData : formData[f.id] && formData[f.id].trim() !== ''));
    setIsValid(allFilled);
  }, [formData, selectedMethod, imageData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startFortuneTelling = async () => {
    setError(''); setStep(Step.LOADING);
    try {
      const response = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedMethod, formData, imageData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data); setStep(Step.RESULT); setImageLoaded(false);
    } catch (err: any) {
      setError(`命運中斷：${err.message}`); setStep(Step.INPUT_DATA);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isMuted) audioRef.current.play(); else audioRef.current.pause();
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="container">
      <audio ref={audioRef} loop src="https://assets.mixkit.co/music/preview/mixkit-meditation-ambient-34.mp3" />
      <button className="sound-toggle" onClick={toggleAudio}>{isMuted ? '🔇' : '🔊'}</button>

      <header className="fade-in">
        <h1 className="title">靈曦之諭</h1>
        <p className="subtitle">暗影與星光的交會之處</p>
      </header>

      {step === Step.SELECT_METHOD && (
        <div className="daily-energy fade-in">
          <span className="energy-label">今日靈曦能量指數</span>
          <div className="energy-bar"><div className="energy-fill" style={{width: `${todayEnergy}%`}}></div></div>
          <span className="energy-value">{todayEnergy}</span>
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      <main className="fade-in">
        {step === Step.SELECT_METHOD && (
          <div className="methods-grid">
            {METHODS.map(m => (
              <div key={m.id} className="method-card" onClick={() => { setSelectedMethod(m); setStep(Step.INPUT_DATA); }}>
                <span className="method-icon">{m.icon}</span>
                <h2>{m.name}</h2>
                <p>{m.description}</p>
              </div>
            ))}
          </div>
        )}

        {step === Step.INPUT_DATA && selectedMethod && (
          <div className="form-container">
            <button className="btn-back" onClick={() => setStep(Step.SELECT_METHOD)}>← 返回</button>
            <h2 className="accent-text">{selectedMethod.name}</h2>
            {selectedMethod.fields.map(f => (
              <div key={f.id} className="form-group">
                <label>{f.label}</label>
                {f.type === 'textarea' ? <textarea onChange={e => setFormData({...formData, [f.id]: e.target.value})} rows={4} /> :
                 f.type === 'file' ? <input type="file" accept="image/*" onChange={handleFileChange} /> :
                 <input type={f.type} onChange={e => setFormData({...formData, [f.id]: e.target.value})} />}
              </div>
            ))}
            {imageData && <img src={imageData} className="preview-img" alt="預覽" />}
            <button className="btn-primary" onClick={startFortuneTelling} disabled={!isValid}>啟動靈曦儀式</button>
          </div>
        )}

        {step === Step.LOADING && (
          <div className="loading-container">
            <div className="mystic-orb"></div>
            <p className="loading-text">正在凝結未來的倒影...</p>
          </div>
        )}

        {step === Step.RESULT && result && (
          <div className="result-container">
            <button className="btn-back" onClick={() => setStep(Step.SELECT_METHOD)}>← 再次占卜</button>
            <div className="image-wrapper">
              {!imageLoaded && <div className="image-placeholder">正在召喚命運意象...</div>}
              <img 
                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(result.imagePrompt)}?width=1000&height=600&nologo=true&seed=${Date.now()}`} 
                className={`result-image ${imageLoaded ? 'loaded' : ''}`}
                onLoad={() => setImageLoaded(true)}
                alt="命運視覺"
              />
            </div>
            <div className="result-grid">
              {['career', 'fortune', 'love', 'health'].map(k => (
                <div key={k} className="result-item">
                  <h3>{k === 'career' ? '事業' : k === 'fortune' ? '財運' : k === 'love' ? '情感' : '身心'}</h3>
                  <p><Typewriter text={(result as any)[k]} /></p>
                </div>
              ))}
              <div className="result-item full"><h3>未來轉折</h3><p><Typewriter text={result.future} /></p></div>
            </div>
            <div className="summary-block"><p className="summary-text"><Typewriter text={result.summary} speed={60} /></p></div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
