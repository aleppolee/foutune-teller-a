import { useState, useEffect, useRef } from 'react'
import './App.css'

const Step = { SELECT_METHOD: 0, INPUT_DATA: 1, LOADING: 2, RESULT: 3 } as const;
type StepValue = typeof Step[keyof typeof Step];

const Icons = {
  Tarot: () => (<svg className="method-icon-svg" viewBox="0 0 24 24"><path d="M5 3v18M19 3v18M5 7h14M5 17h14M9 3v18M15 3v18" /></svg>),
  Palm: () => (<svg className="method-icon-svg" viewBox="0 0 24 24"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M6 18V11M18 11c0 5-2 7-6 7s-6-2-6-7" /></svg>),
  Dream: () => (<svg className="method-icon-svg" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9 9.75 9.75 0 0 0-6.74-9.37Z" /></svg>),
  IChing: () => (<svg className="method-icon-svg" viewBox="0 0 24 24"><path d="M3 5h18M3 9h8m2 0h8M3 13h18M3 17h8m2 0h8M3 21h18" /></svg>),
  Bazi: () => (<svg className="method-icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 0 20M12 12h10" /></svg>)
};

interface FortuneMethod {
  id: string; name: string; icon: () => React.ReactNode; description: string;
  fields: { id: string; label: string; type: string; placeholder: string; required?: boolean }[];
}

const METHODS: FortuneMethod[] = [
  { id: 'tarot', name: '塔羅意象', icon: Icons.Tarot, description: '解構潛意識的視覺符號', fields: [{ id: 'question', label: '詢問之事', type: 'text', placeholder: '你渴望洞悉什麼？', required: true }, { id: 'focus', label: '目前處境', type: 'textarea', placeholder: '簡單描述...', required: true }] },
  { id: 'palm', name: '靈曦手相', icon: Icons.Palm, description: '解讀掌紋間的能量流動', fields: [{ id: 'photo', label: '手掌照片', type: 'file', placeholder: '', required: true }, { id: 'question', label: '特別詢問', type: 'text', placeholder: '財運、姻緣或健康', required: false }] },
  { id: 'dream', name: '夢境解析', icon: Icons.Dream, description: '重組破碎的潛意識訊息', fields: [{ id: 'dream', label: '夢境描述', type: 'textarea', placeholder: '色彩、物體、或某種感覺...', required: true }] },
  { id: 'iching', name: '易經卦象', icon: Icons.IChing, description: '兩儀四象間的變動之理', fields: [{ id: 'num1', label: '起卦數字 A', type: 'number', placeholder: '三位數', required: true }, { id: 'num2', label: '起卦數字 B', type: 'number', placeholder: '三位數', required: true }, { id: 'question', label: '占卜之事', type: 'text', placeholder: '困惑之事', required: true }] },
  { id: 'bazi', name: '八字定數', icon: Icons.Bazi, description: '時空座標下的命運軌跡', fields: [{ id: 'name', label: '姓名', type: 'text', placeholder: '全名', required: true }, { id: 'birthdate', label: '出生日期', type: 'date', placeholder: '', required: true }, { id: 'birthtime', label: '出生時辰', type: 'time', placeholder: '', required: true }] }
];

function Typewriter({ text, speed = 25 }: { text: string, speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0; const timer = setInterval(() => { setDisplayedText(text.substring(0, i)); i++; if (i > text.length) clearInterval(timer); }, speed);
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
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const energy = (new Date().getDate() * 7 + 60) % 40 + 60;

  const goToMethodSelection = () => {
    setStep(Step.SELECT_METHOD);
    setSelectedMethod(null);
    setFormData({});
    setImageData(null);
    setResult(null);
    setError('');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setImageData(reader.result as string); reader.readAsDataURL(file); }
  };

  const start = async () => {
    setError(''); setStep(Step.LOADING); setIsRevealed(false);
    try {
      const res = await fetch('/api/fortune', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ selectedMethod, formData, imageData }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data); setStep(Step.RESULT);
    } catch (err: any) { setError(err.message); setStep(Step.INPUT_DATA); }
  };

  const copyResult = () => {
    const text = `【靈曦之諭】\n\n核心啟示：${result.summary}\n\n幸運指引：顏色 - ${result.lucky.color} / 數字 - ${result.lucky.number}\n\n靈曦官方占卜結果`;
    navigator.clipboard.writeText(text);
    alert('諭旨已收錄至剪貼簿');
  };

  return (
    <div className="container">
      <audio ref={audioRef} loop src="https://upload.wikimedia.org/wikipedia/commons/4/49/SoundAudio_-_Forest_%28relaxing_music%29.opus" />
      <button className="sound-toggle" onClick={() => { if (audioRef.current) { isMuted ? audioRef.current.play() : audioRef.current.pause(); setIsMuted(!isMuted); } }}>{isMuted ? 'OFF' : 'ON'}</button>
      
      <header className={`site-header fade-in ${step !== Step.SELECT_METHOD ? 'compact' : ''}`}>
        <h1 className="title">靈曦之諭</h1>
        <p className="subtitle">THE ORACLE OF LUMINA</p>
      </header>

      {step === Step.SELECT_METHOD && (
        <>
          <div className="intro-block fade-in">
            <p className="eyebrow">CHOOSE YOUR PATH</p>
            <h2>選擇你的占卜方式</h2>
            <p>讓直覺帶你找到此刻最需要的答案。</p>
          </div>
          <div className="daily-energy fade-in">
            <span className="energy-label">LUMINA ENERGY</span>
            <div className="energy-bar"><div className="energy-fill" style={{width: `${energy}%`}}></div></div>
            <span className="energy-value">{energy}%</span>
          </div>
          <div className="methods-grid">
            {METHODS.map(m => (
              <button key={m.id} className="method-card" onClick={() => { setSelectedMethod(m); setStep(Step.INPUT_DATA); }}>
                {m.icon()}<h2>{m.name}</h2><p>{m.description}</p><span className="card-action">開始探索 <span aria-hidden="true">→</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === Step.INPUT_DATA && selectedMethod && (
        <div className="form-container content-panel fade-in">
          <button className="btn-back" onClick={goToMethodSelection}>← 返回占卜方式</button>
          <div className="section-heading">
            <p className="eyebrow">YOUR SELECTED PATH</p>
            <h2>{selectedMethod.name}</h2>
            <p>{selectedMethod.description}</p>
          </div>
          {selectedMethod.fields.map(f => (
            <div key={f.id} className={`form-group ${f.type === 'textarea' ? 'wide-field' : ''}`}>
              <label>{f.label}</label>
              {f.type === 'textarea' ? <textarea onChange={e => setFormData({...formData, [f.id]: e.target.value})} /> :
               f.type === 'file' ? <input type="file" onChange={handleFile} /> :
               <input type={f.type} placeholder={f.placeholder} onChange={e => setFormData({...formData, [f.id]: e.target.value})} />}
            </div>
          ))}
          <button className="btn-primary" onClick={start}>CONSULT THE ORACLE</button>
        </div>
      )}

      {step === Step.LOADING && (
        <div className="loading-container fade-in" style={{textAlign:'center',padding:'100px 0'}}>
          <div className="mystic-orb"></div>
          <p className="subtitle" style={{letterSpacing:'0.4rem'}}>正在讀取命運的頻率...</p>
        </div>
      )}

      {step === Step.RESULT && result && !isRevealed && (
        <div className="reveal-ritual" onClick={() => setIsRevealed(true)}>
          <div className="reveal-card"><Icons.Tarot /></div>
          <span>點擊揭示諭旨</span>
        </div>
      )}

      {step === Step.RESULT && result && isRevealed && (
        <div className="result-container fade-in">
          <div className="result-toolbar">
            <button className="btn-back" onClick={goToMethodSelection}>← 換一個占卜方式</button>
            <button className="share-button" onClick={copyResult}>SHARE</button>
          </div>

          <div className="result-grid">
            {[{l:'事業',v:result.career},{l:'財運',v:result.fortune},{l:'情感',v:result.love},{l:'能量',v:result.health}].map(i => (
              <div key={i.l} className="result-item"><h3>{i.l}</h3><p><Typewriter text={i.v} /></p></div>
            ))}
            <div className="result-item" style={{gridColumn:'1/-1'}}><h3>未來轉折</h3><p><Typewriter text={result.future} /></p></div>
          </div>

          <div className="lucky-guide fade-in">
            <div className="lucky-item"><span className="lucky-item-label">幸運顏色</span><span className="lucky-item-value">{result.lucky.color}</span></div>
            <div className="lucky-item"><span className="lucky-item-label">幸運數字</span><span className="lucky-item-value">{result.lucky.number}</span></div>
          </div>

          <div className="summary-block">
            <p className="summary-text"><Typewriter text={result.summary} speed={50} /></p>
          </div>
        </div>
      )}
      {error && <p style={{textAlign:'center',color:'#f87171',marginTop:'20px'}}>{error}</p>}
    </div>
  )
}

export default App
