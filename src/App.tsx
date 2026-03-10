import { useState, useEffect, useRef } from 'react'
import './App.css'

const Step = { SELECT_METHOD: 0, INPUT_DATA: 1, LOADING: 2, RESULT: 3 } as const;
type StepValue = typeof Step[keyof typeof Step];

// 統一圖標組件 (線性簡約風)
const Icons = {
  Tarot: () => (
    <svg className="method-icon-svg" viewBox="0 0 24 24"><path d="M5 3v18M19 3v18M5 7h14M5 17h14M9 3v18M15 3v18" /></svg>
  ),
  Palm: () => (
    <svg className="method-icon-svg" viewBox="0 0 24 24"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M6 18V11M18 11c0 5-2 7-6 7s-6-2-6-7" /></svg>
  ),
  Dream: () => (
    <svg className="method-icon-svg" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9 9.75 9.75 0 0 0-6.74-9.37Z" /></svg>
  ),
  IChing: () => (
    <svg className="method-icon-svg" viewBox="0 0 24 24"><path d="M3 5h18M3 9h8m2 0h8M3 13h18M3 17h8m2 0h8M3 21h18" /></svg>
  ),
  Bazi: () => (
    <svg className="method-icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 0 20M12 12h10" /></svg>
  )
};

interface FortuneMethod {
  id: string; name: string; icon: React.ReactNode; description: string;
  fields: { id: string; label: string; type: string; placeholder: string; required?: boolean }[];
}

const METHODS: FortuneMethod[] = [
  {
    id: 'tarot', name: '塔羅意象', icon: <Icons.Tarot />, description: '解構潛意識的視覺符號',
    fields: [
      { id: 'question', label: '詢問之事', type: 'text', placeholder: '你渴望洞悉什麼？', required: true },
      { id: 'focus', label: '目前的生命狀態', type: 'textarea', placeholder: '簡單描述你的處境...', required: true }
    ]
  },
  {
    id: 'palm', name: '靈曦手相', icon: <Icons.Palm />, description: '解讀掌紋間的能量流動',
    fields: [
      { id: 'photo', label: '手掌照片', type: 'file', placeholder: '', required: true },
      { id: 'question', label: '特別詢問 (選填)', type: 'text', placeholder: '財運、姻緣或健康', required: false }
    ]
  },
  {
    id: 'dream', name: '夢境解析', icon: <Icons.Dream />, description: '重組破碎的潛意識訊息',
    fields: [
      { id: 'dream', label: '夢境描述', type: 'textarea', placeholder: '色彩、物體、或某種揮之不去的感覺...', required: true }
    ]
  },
  {
    id: 'iching', name: '易經卦象', icon: <Icons.IChing />, description: '兩儀四象間的變動之理',
    fields: [
      { id: 'num1', label: '起卦數字 A', type: 'number', placeholder: '隨意輸入三位數', required: true },
      { id: 'num2', label: '起卦數字 B', type: 'number', placeholder: '隨意輸入三位數', required: true },
      { id: 'question', label: '占卜之事', type: 'text', placeholder: '近期面臨的選擇或困惑', required: true }
    ]
  },
  {
    id: 'bazi', name: '八字定數', icon: <Icons.Bazi />, description: '時空座標下的命運軌跡',
    fields: [
      { id: 'name', label: '姓名', type: 'text', placeholder: '請輸入全名', required: true },
      { id: 'birthdate', label: '出生日期', type: 'date', placeholder: '', required: true },
      { id: 'birthtime', label: '出生時辰', type: 'time', placeholder: '', required: true }
    ]
  }
];

function Typewriter({ text, speed = 25 }: { text: string, speed?: number }) {
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
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const todayEnergy = (new Date().getDate() * 7 + 60) % 40 + 60;

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
      setResult(data); setStep(Step.RESULT);
    } catch (err: any) {
      setError(`連動中斷：${err.message}`); setStep(Step.INPUT_DATA);
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
      <button className="sound-toggle" onClick={toggleAudio}>{isMuted ? 'MUTE' : 'PLAY'}</button>

      <header className="fade-in">
        <h1 className="title">靈曦之諭</h1>
        <p className="subtitle">THE ORACLE OF LUMINA</p>
      </header>

      {step === Step.SELECT_METHOD && (
        <div className="daily-energy fade-in">
          <span className="energy-label">ENERGY LEVEL</span>
          <div className="energy-bar"><div className="energy-fill" style={{width: `${todayEnergy}%`}}></div></div>
          <span className="energy-value">{todayEnergy}%</span>
        </div>
      )}

      {error && <p className="error-msg" style={{textAlign: 'center', color: '#f87171'}}>{error}</p>}

      <main>
        {step === Step.SELECT_METHOD && (
          <div className="methods-grid">
            {METHODS.map(m => (
              <div key={m.id} className="method-card" onClick={() => { setSelectedMethod(m); setStep(Step.INPUT_DATA); }}>
                {m.icon}
                <h2>{m.name}</h2>
                <p>{m.description}</p>
              </div>
            ))}
          </div>
        )}

        {step === Step.INPUT_DATA && selectedMethod && (
          <div className="form-container fade-in">
            <button className="btn-back" onClick={() => setStep(Step.SELECT_METHOD)} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',marginBottom:'40px',fontSize:'0.7rem',letterSpacing:'0.2rem'}}>← BACK</button>
            <div className="form-group">
              <label>SELECTED METHOD</label>
              <h2 style={{fontSize:'1.5rem',fontWeight:'300'}}>{selectedMethod.name}</h2>
            </div>
            {selectedMethod.fields.map(f => (
              <div key={f.id} className="form-group">
                <label>{f.label}</label>
                {f.type === 'textarea' ? <textarea onChange={e => setFormData({...formData, [f.id]: e.target.value})} /> :
                 f.type === 'file' ? <input type="file" accept="image/*" onChange={handleFileChange} /> :
                 <input type={f.type} placeholder={f.placeholder} onChange={e => setFormData({...formData, [f.id]: e.target.value})} />}
              </div>
            ))}
            <button className="btn-primary" onClick={startFortuneTelling} disabled={!isValid}>INVOLVE THE ORACLE</button>
          </div>
        )}

        {step === Step.LOADING && (
          <div className="loading-container fade-in" style={{textAlign:'center',padding:'100px 0'}}>
            <div className="mystic-orb"></div>
            <p className="subtitle">正在解析命運的頻率...</p>
          </div>
        )}

        {step === Step.RESULT && result && (
          <div className="result-container">
            <button className="btn-back" onClick={() => setStep(Step.SELECT_METHOD)} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',marginBottom:'40px',fontSize:'0.7rem',letterSpacing:'0.2rem'}}>← NEW SESSION</button>
            <div className="image-wrapper">
              <img 
                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(result.imagePrompt)}?width=1200&height=800&nologo=true&seed=${Date.now()}`} 
                className={`result-image ${imageLoaded ? 'loaded' : ''}`}
                onLoad={() => setImageLoaded(true)}
                alt="命運視覺"
              />
            </div>
            <div className="result-grid">
              {[
                {label:'事業與志業', val: result.career},
                {label:'物質流動', val: result.fortune},
                {label:'情感連結', val: result.love},
                {label:'能量狀態', val: result.health}
              ].map(item => (
                <div key={item.label} className="result-item">
                  <h3>{item.label}</h3>
                  <p><Typewriter text={item.val} /></p>
                </div>
              ))}
              <div className="result-item" style={{gridColumn:'1/-1'}}>
                <h3>未來轉折</h3>
                <p><Typewriter text={result.future} /></p>
              </div>
            </div>
            <div className="summary-block">
              <p className="summary-text"><Typewriter text={result.summary} speed={50} /></p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
