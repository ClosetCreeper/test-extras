// MORTALITY FILES CASTING PORTAL
// Dependencies: "pdfjs-dist": "^3.11.174", "pdf-lib": "^1.17.1"
// Storage buckets (both public): "template-pdfs", "signed-pdfs"

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const SUPABASE_URL = "https://kdnhetzdatwgbqiocikf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkbmhldHpkYXR3Z2JxaW9jaWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMTExMDAsImV4cCI6MjA4Nzg4NzEwMH0.G9xlu93KCK64V1VDc80uKk3jPVoV4YgKruumHStF1yU";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_PASSWORD = "mortality2024";

const FIELD_TYPES = [
  { type: "text",      label: "Text",      icon: "📝", w: 200, h: 32 },
  { type: "full_name", label: "Full Name", icon: "👤", w: 220, h: 32 },
  { type: "date",      label: "Date",      icon: "📅", w: 140, h: 32 },
  { type: "email",     label: "Email",     icon: "✉️",  w: 200, h: 32 },
  { type: "phone",     label: "Phone",     icon: "📞", w: 160, h: 32 },
  { type: "signature", label: "Signature", icon: "✍️",  w: 260, h: 80 },
  { type: "initials",  label: "Initials",  icon: "🖊️", w: 100, h: 60 },
  { type: "checkbox",  label: "Checkbox",  icon: "☑️",  w: 24,  h: 24 },
];

const SCRIPT_FONTS = [
  { name: "Dancing Script", css: "'Dancing Script', cursive" },
  { name: "Great Vibes",    css: "'Great Vibes', cursive" },
  { name: "Parisienne",     css: "'Parisienne', cursive" },
  { name: "Satisfy",        css: "'Satisfy', cursive" },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Great+Vibes&family=Parisienne&family=Satisfy&family=Google Sans:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --deep:#100142;--deep2:#1a0260;--pink:#FF47E2;
  --pink-dim:rgba(255,71,226,0.12);--pink-mid:rgba(255,71,226,0.35);
  --white:#fff;--cream:#f8f5ff;--border:#d4b8f0;
  --text:#100142;--text2:#5a4a7a;--rose:#e05555;
  --sh:0 4px 24px rgba(16,1,66,0.1);--sh2:0 12px 48px rgba(16,1,66,0.18);
  --r:12px;--rl:18px;
}
body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--text);min-height:100vh}

.nav{background:var(--deep);padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:62px;position:sticky;top:0;z-index:200;box-shadow:0 2px 24px rgba(255,71,226,0.2);border-bottom:1px solid rgba(255,71,226,0.3)}
.nav-logo{font-family:'Google Sans',serif;font-size:17px;color:#fff;letter-spacing:1.5px;display:flex;align-items:center;gap:10px}
.nav-logo-accent{color:#FF47E2}
.nav-tabs{display:flex;gap:4px}
.nav-tab{padding:7px 16px;border-radius:8px;background:transparent;border:none;color:rgba(255,255,255,0.55);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s}
.nav-tab:hover{background:rgba(255,71,226,0.12);color:#fff}
.nav-tab.active{background:#FF47E2;color:var(--deep);font-weight:700}

.page{max-width:1100px;margin:0 auto;padding:36px 24px}
.page-title{font-family:'Google Sans',serif;font-size:27px;color:var(--deep);margin-bottom:6px;letter-spacing:.5px}
.page-sub{color:var(--text2);font-size:15px;margin-bottom:28px}
.card{background:var(--white);border-radius:var(--rl);border:1px solid var(--border);box-shadow:var(--sh);overflow:hidden}
.card-body{padding:24px}

.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;text-decoration:none;white-space:nowrap}
.btn-primary{background:var(--deep);color:#fff}.btn-primary:hover{background:var(--deep2);transform:translateY(-1px)}
.btn-pink{background:#FF47E2;color:var(--deep)}.btn-pink:hover{background:#e030cc;transform:translateY(-1px);box-shadow:0 4px 14px rgba(255,71,226,0.4)}
.btn-outline{background:transparent;border:1.5px solid var(--border);color:var(--text)}.btn-outline:hover{border-color:#FF47E2;color:#FF47E2}
.btn-danger{background:var(--rose);color:#fff}.btn-danger:hover{background:#c03030}
.btn-sm{padding:5px 13px;font-size:13px}.btn-lg{padding:13px 26px;font-size:15px}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important}

.form-group{margin-bottom:18px}
.form-label{display:block;font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.6px;margin-bottom:7px}
.form-input,.form-select,.form-textarea{width:100%;padding:9px 13px;border:1.5px solid var(--border);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--text);background:var(--cream);transition:border-color .2s;outline:none}
.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:#FF47E2;background:#fff;box-shadow:0 0 0 3px var(--pink-dim)}
.form-textarea{resize:vertical;min-height:72px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}

.table{width:100%;border-collapse:collapse}
.table th{padding:11px 15px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text2);border-bottom:2px solid var(--border)}
.table td{padding:13px 15px;border-bottom:1px solid #ede8f8;font-size:14px}
.table tr:last-child td{border-bottom:none}.table tr:hover td{background:var(--cream)}

.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 11px;border-radius:20px;font-size:12px;font-weight:700}
.badge-pending{background:#fff3cd;color:#856404}.badge-completed{background:#dcfce7;color:#15803d}
.badge-pink{background:var(--pink-dim);color:#9b0078}

.overlay{position:fixed;inset:0;background:rgba(16,1,66,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
.modal{background:#fff;border-radius:var(--rl);width:100%;max-width:700px;max-height:92vh;overflow-y:auto;box-shadow:var(--sh2);animation:slideUp .25s ease}
.modal-lg{max-width:900px}.modal-xl{max-width:1100px}
.modal-hd{padding:22px 26px;border-bottom:1px solid #ede8f8;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#fff;z-index:2}
.modal-title{font-family:'Google Sans',serif;font-size:19px;color:var(--deep)}
.modal-body{padding:26px}.modal-ft{padding:18px 26px;border-top:1px solid #ede8f8;display:flex;gap:10px;justify-content:flex-end}
@keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}

.alert{padding:13px 17px;border-radius:var(--r);font-size:14px;margin-bottom:16px}
.alert-info{background:var(--pink-dim);color:#7b0068;border:1px solid var(--pink-mid)}
.alert-warn{background:#fef3c7;color:#92400e;border:1px solid #fcd34d}
.alert-error{background:#fee2e2;color:#991b1b;border:1px solid #fca5a5}

.text-muted{color:var(--text2);font-size:14px}
.empty-state{text-align:center;padding:48px;color:var(--text2)}.empty-state .icon{font-size:46px;margin-bottom:12px}
.flex{display:flex}.flex-between{display:flex;align-items:center;justify-content:space-between}.flex-center{display:flex;align-items:center;justify-content:center}
.gap-2{gap:8px}.gap-3{gap:12px}.mb-4{margin-bottom:16px}.mb-6{margin-bottom:24px}.mt-4{margin-top:16px}
.tag{display:inline-block;padding:3px 10px;background:var(--pink-dim);color:#9b0078;border-radius:20px;font-size:12px;font-weight:700}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.spin{display:inline-block;width:16px;height:16px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spinA .7s linear infinite}
@keyframes spinA{to{transform:rotate(360deg)}}

.prog-wrap{background:#ede8f8;border-radius:100px;height:7px;overflow:hidden;margin:14px 0}
.prog-bar{height:100%;background:linear-gradient(90deg,var(--deep),#FF47E2);border-radius:100px;transition:width .5s ease}

.portal-hero{background:var(--deep);padding:52px 24px;text-align:center;color:#fff;position:relative;overflow:hidden}
.portal-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(255,71,226,0.18) 0%,transparent 70%);pointer-events:none}
.portal-title{font-family:'Google Sans',serif;font-size:28px;color:#fff;margin-bottom:6px;letter-spacing:1px}
.portal-title-accent{color:#FF47E2}
.portal-sub{color:rgba(255,255,255,0.6);font-size:15px}
.task-card{background:#fff;border:1.5px solid #ede8f8;border-radius:var(--r);padding:18px;display:flex;align-items:center;justify-content:space-between;transition:all .2s}
.task-card:hover{border-color:#FF47E2;box-shadow:var(--sh)}.task-card.done{border-color:#86efac;background:#f0fdf4}
.success-screen{text-align:center;padding:56px 24px}
.success-icon{width:80px;height:80px;background:linear-gradient(135deg,var(--deep),#FF47E2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px}

.builder-layout{display:grid;grid-template-columns:230px 1fr;gap:0;height:calc(100vh - 62px);overflow:hidden}
.builder-sidebar{background:var(--deep);padding:20px 14px;overflow-y:auto;display:flex;flex-direction:column;gap:5px;border-right:1px solid rgba(255,71,226,0.2)}
.builder-sidebar-title{color:rgba(255,71,226,0.6);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin:10px 0 6px}
.field-chip{background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,71,226,0.15);border-radius:10px;padding:9px 12px;color:rgba(255,255,255,0.85);font-size:13px;font-weight:500;cursor:grab;display:flex;align-items:center;gap:8px;transition:all .2s;user-select:none}
.field-chip:hover{background:rgba(255,71,226,0.15);border-color:#FF47E2}.field-chip:active{cursor:grabbing}
.builder-main{overflow:auto;background:#1a1a2e;display:flex;justify-content:center;padding:28px}
.pdf-canvas-wrap{position:relative;display:inline-block;box-shadow:0 8px 48px rgba(0,0,0,.5)}
.pdf-canvas{display:block}
.field-overlay{position:absolute;cursor:move;user-select:none}
.field-overlay.selected .field-inner{outline:2.5px solid #FF47E2!important;outline-offset:1px}
.field-inner{width:100%;height:100%;display:flex;align-items:center;background:rgba(255,71,226,0.1);border:1.5px solid rgba(255,71,226,0.5);border-radius:4px;font-size:12px;color:#9b0078;font-weight:700;padding:0 6px;pointer-events:none;white-space:nowrap;overflow:hidden}
.sig-field-inner{background:rgba(255,71,226,0.07);border:2px dashed rgba(255,71,226,0.5);justify-content:center}
.check-field-inner{border-radius:3px;justify-content:center;font-size:14px}
.resize-handle{position:absolute;bottom:-4px;right:-4px;width:12px;height:12px;background:#FF47E2;border-radius:2px;cursor:se-resize}

.sig-container{border:1.5px solid var(--border);border-radius:var(--r);overflow:hidden}
.sig-tabs{display:flex;border-bottom:1.5px solid #ede8f8}
.sig-tab{flex:1;padding:10px;border:none;background:transparent;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;color:var(--text2);cursor:pointer;transition:all .2s}
.sig-tab.active{background:var(--pink-dim);color:#7b0068;border-bottom:2.5px solid #FF47E2}
.sig-tab:hover:not(.active){background:var(--cream)}
.sig-draw-area{background:var(--cream);position:relative}
.sig-canvas-el{display:block;width:100%;cursor:crosshair;touch-action:none}
.sig-footer{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#fff;border-top:1px solid #ede8f8}
.sig-hint{font-size:11px;color:var(--text2)}
.sig-clear-btn{background:none;border:1px solid #ede8f8;border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--text2)}
.sig-clear-btn:hover{border-color:var(--rose);color:var(--rose)}
.sig-type-area{padding:20px 16px;background:var(--cream)}
.sig-type-input{width:100%;border:none;background:transparent;font-size:13px;color:var(--text);outline:none;font-family:'DM Sans',sans-serif;margin-bottom:16px;border-bottom:1px solid #ede8f8;padding-bottom:8px}
.sig-type-input::placeholder{color:#b8a8d0}
.sig-font-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sig-font-btn{padding:14px 8px;border:1.5px solid #ede8f8;border-radius:10px;background:#fff;cursor:pointer;transition:all .2s;text-align:center}
.sig-font-btn:hover,.sig-font-btn.selected{border-color:#FF47E2;background:var(--pink-dim)}

.pdf-viewer-wrap{position:relative;display:inline-block}
.pdf-viewer-canvas{display:block}
.sign-field-overlay{position:absolute;cursor:pointer}
.sign-field-box{width:100%;height:100%;border:2px dashed rgba(255,71,226,0.6);border-radius:4px;background:rgba(255,71,226,0.08);display:flex;align-items:center;justify-content:center;font-size:11px;color:#9b0078;font-weight:700;transition:all .2s;text-align:center;padding:2px}
.sign-field-box.filled{border-color:#86efac;border-style:solid;background:rgba(134,239,172,0.1);color:#15803d}
.sign-field-box:hover{background:rgba(255,71,226,0.14)}
.sign-field-sig{width:100%;height:100%;object-fit:contain;padding:2px}

.member-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #ede8f8}
.member-row:last-child{border-bottom:none}
.member-input{flex:1;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;background:var(--cream);outline:none}
.member-input:focus{border-color:#FF47E2}

.login-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--deep);position:relative;overflow:hidden}
.login-screen::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(255,71,226,0.18) 0%,transparent 70%);pointer-events:none}
.login-card{background:#fff;border-radius:var(--rl);padding:40px;width:100%;max-width:400px;box-shadow:var(--sh2);position:relative;z-index:1;animation:slideUp .3s ease}
.login-logo{text-align:center;margin-bottom:28px}
.login-title{font-family:'Google Sans',serif;font-size:20px;color:var(--deep);text-align:center;margin-bottom:6px}
.login-sub{font-size:13px;color:var(--text2);text-align:center;margin-bottom:24px}

@media(max-width:768px){
  .grid-2{grid-template-columns:1fr}.form-row{grid-template-columns:1fr}
  .nav-tabs{display:none}.page{padding:20px 14px}
  .builder-layout{grid-template-columns:1fr;height:auto}
}
`;

// ════════════════════════════════════════════════
// ADMIN LOGIN GATE
// ════════════════════════════════════════════════
function AdminLogin({ onSuccess }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem("mf_admin_auth", "1");
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPw("");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card" style={shake ? { animation: "shake .4s ease" } : {}}>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
        <div className="login-logo">
          <img src="/logo.png" alt="Logo" style={{ height: 40, marginBottom: 12 }} />
          <div style={{ fontFamily: "'Google Sans',serif", fontSize: 15, color: "var(--deep)", letterSpacing: 1.5 }}>
            MORTALITY FILES <span style={{ color: "#FF47E2" }}>CASTING</span>
          </div>
        </div>
        <h2 className="login-title">Admin Access</h2>
        <p className="login-sub">Enter the password to continue</p>
        {error && <div className="alert alert-error" style={{ fontSize: 13, textAlign: "center" }}>Incorrect password. Please try again.</div>}
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="Enter password…"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && attempt()}
            autoFocus
          />
        </div>
        <button className="btn btn-pink" style={{ width: "100%", justifyContent: "center" }} onClick={attempt}>
          Unlock →
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// SIGNATURE INPUT — Draw OR Type in script font
// ════════════════════════════════════════════════
function SignatureInput({ height = 140, onChange, value, isInitials = false }) {
  const [mode, setMode] = useState("draw");
  const [typedText, setTypedText] = useState("");
  const [selectedFont, setSelectedFont] = useState(0);
  const drawRef = useRef(null);
  const exportRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);

  useEffect(() => {
    const c = drawRef.current;
    if (!c) return;
    c.width = c.offsetWidth || 500;
    c.height = height;
    const ctx = c.getContext("2d");
    ctx.strokeStyle = "#100142";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (value && mode === "draw") {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
  }, [height, mode]);

  useEffect(() => {
    if (mode !== "type") return;
    const c = exportRef.current;
    if (!c) return;
    c.width = 500;
    c.height = 120;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 500, 120);
    if (!typedText.trim()) { onChange && onChange(null); return; }
    const f = SCRIPT_FONTS[selectedFont];
    ctx.font = `${isInitials ? 54 : 46}px ${f.css}`;
    ctx.fillStyle = "#100142";
    ctx.textBaseline = "middle";
    if (isInitials) { ctx.textAlign = "center"; ctx.fillText(typedText, 250, 60); }
    else { ctx.textAlign = "left"; ctx.fillText(typedText, 16, 60); }
    onChange && onChange(c.toDataURL());
  }, [typedText, selectedFont, mode]);

  const gp = (e, c) => { const r = c.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const sd = (e) => { drawing.current = true; const p = gp(e, drawRef.current); last.current = p; const ctx = drawRef.current.getContext("2d"); ctx.beginPath(); ctx.arc(p.x,p.y,1,0,Math.PI*2); ctx.fillStyle="#100142"; ctx.fill(); };
  const md = (e) => { if (!drawing.current) return; e.preventDefault(); const c = drawRef.current; const ctx = c.getContext("2d"); const p = gp(e,c); ctx.beginPath(); ctx.moveTo(last.current.x,last.current.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last.current = p; };
  const ed = () => { if (!drawing.current) return; drawing.current = false; onChange && onChange(drawRef.current.toDataURL()); };
  const clr = () => { drawRef.current.getContext("2d").clearRect(0,0,drawRef.current.width,drawRef.current.height); onChange && onChange(null); };
  const sw = (m) => { setMode(m); onChange && onChange(null); if (m==="draw") setTypedText(""); };

  return (
    <div className="sig-container">
      <div className="sig-tabs">
        <button className={`sig-tab ${mode==="draw"?"active":""}`} type="button" onClick={() => sw("draw")}>✍️ Draw</button>
        <button className={`sig-tab ${mode==="type"?"active":""}`} type="button" onClick={() => sw("type")}>🔤 Type</button>
      </div>
      {mode === "draw" ? (
        <div className="sig-draw-area">
          <canvas ref={drawRef} className="sig-canvas-el" style={{height}} onMouseDown={sd} onMouseMove={md} onMouseUp={ed} onMouseLeave={ed} onTouchStart={sd} onTouchMove={md} onTouchEnd={ed} />
          <div className="sig-footer">
            <span className="sig-hint">Draw your {isInitials?"initials":"signature"} above</span>
            <button className="sig-clear-btn" type="button" onClick={clr}>Clear</button>
          </div>
        </div>
      ) : (
        <div className="sig-type-area">
          <input className="sig-type-input" placeholder={isInitials?"Type your initials…":"Type your full name…"} value={typedText} onChange={e=>setTypedText(e.target.value)} autoFocus />
          <p style={{fontSize:12,color:"var(--text2)",marginBottom:10,fontWeight:700}}>Choose a style:</p>
          <div className="sig-font-grid">
            {SCRIPT_FONTS.map((f,i) => (
              <button key={f.name} type="button" className={`sig-font-btn ${selectedFont===i?"selected":""}`} onClick={() => setSelectedFont(i)}>
                <span style={{fontFamily:f.css,fontSize:isInitials?26:22,color:"#100142",display:"block",lineHeight:1.4}}>
                  {typedText||(isInitials?"AB":"Your Name")}
                </span>
                <span style={{fontSize:10,color:"var(--text2)",marginTop:4,display:"block"}}>{f.name}</span>
              </button>
            ))}
          </div>
          <canvas ref={exportRef} style={{display:"none"}} width={500} height={120} />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
// RENDER PDF PAGE
// ════════════════════════════════════════════════
async function renderPage(url, pageNum, scale = 1.5) {
  const pdf = await pdfjsLib.getDocument(url).promise;
  const page = await pdf.getPage(pageNum);
  const vp = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = vp.width; canvas.height = vp.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
  return { canvas, width: vp.width, height: vp.height, numPages: pdf.numPages };
}

// ════════════════════════════════════════════════
// GENERATE SIGNED PDF
// ════════════════════════════════════════════════
async function generateSignedPdf(templatePdfUrl, fields, formData, pdfDims, scale) {
  const bytes = await fetch(templatePdfUrl).then(r => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(bytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  for (const field of fields) {
    const val = formData[field.id];
    if (!val) continue;
    const pageIndex = (field.page || 1) - 1;
    const page = pages[Math.min(pageIndex, pages.length - 1)];
    const { width: pW, height: pH } = page.getSize();
    const sx = pW / (pdfDims.w / scale);
    const sy = pH / (pdfDims.h / scale);
    const pdfX = (field.x / scale) * sx;
    const pdfY = pH - ((field.y / scale) * sy) - (field.h / scale) * sy;
    const fW = (field.w / scale) * sx;
    const fH = (field.h / scale) * sy;
    if (field.type === "signature" || field.type === "initials") {
      if (typeof val === "string" && val.startsWith("data:image")) {
        const imgBytes = await fetch(val).then(r => r.arrayBuffer());
        const img = await pdfDoc.embedPng(imgBytes);
        page.drawImage(img, { x: pdfX, y: pdfY, width: fW, height: fH });
      }
    } else if (field.type === "checkbox") {
      if (val) page.drawText("x", { x: pdfX+2, y: pdfY+4, size: Math.min(fH-4,13), font, color: rgb(0.06,0.01,0.26) });
    } else {
      const txt = typeof val === "string" ? val : String(val);
      const fontSize = field.fontSize || Math.min(11, fH * 0.6);
      page.drawLine({ start:{x:pdfX,y:pdfY}, end:{x:pdfX+fW,y:pdfY}, thickness:0.4, color:rgb(0.75,0.72,0.86) });
      page.drawText(txt, { x:pdfX+2, y:pdfY+4, size:fontSize, font, color:rgb(0.06,0.01,0.26), maxWidth:fW-4 });
    }
  }
  return await pdfDoc.save();
}

// ════════════════════════════════════════════════
// FIELD INPUT POPUP
// ════════════════════════════════════════════════
function FieldInput({ field, current, onDone }) {
  const [val, setVal] = useState(current || (field.type==="checkbox" ? false : ""));
  const submit = () => { if (field.required && !val && val!==true) { alert("This field is required."); return; } onDone(val||null); };
  return (
    <div>
      {field.type==="signature"||field.type==="initials" ? (
        <><p style={{color:"var(--text2)",fontSize:13,marginBottom:14}}>Draw or type your {field.type==="initials"?"initials":"signature"}:</p>
        <SignatureInput height={field.type==="initials"?100:150} value={val} onChange={setVal} isInitials={field.type==="initials"} /></>
      ) : field.type==="checkbox" ? (
        <label style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",fontSize:15,padding:"8px 0"}}>
          <input type="checkbox" checked={!!val} onChange={e=>setVal(e.target.checked)} style={{width:20,height:20,accentColor:"#FF47E2"}} />
          <span>Check to confirm</span>
        </label>
      ) : (
        <><label className="form-label">{field.label}{field.required&&" *"}</label>
        <input autoFocus className="form-input" style={{textAlign:"left",fontSize:field.fontSize?Math.max(12,Math.min(field.fontSize,18)):14}} type={field.type==="date"?"date":field.type==="email"?"email":field.type==="phone"?"tel":"text"} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
        {field.fontSize&&<p style={{fontSize:11,color:"var(--text2)",marginTop:5}}>Will render at {field.fontSize}px in the PDF</p>}</>
      )}
      <div style={{marginTop:20,display:"flex",justifyContent:"flex-end",gap:10}}>
        <button className="btn btn-outline" onClick={()=>onDone(null)}>Skip</button>
        <button className="btn btn-pink" onClick={submit}>Done ✓</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// PDF SIGNING VIEW
// ════════════════════════════════════════════════
function PdfSigningView({ template, onSubmit, onCancel }) {
  const SCALE = 1.5;
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [activeField, setActiveField] = useState(null);
  const [canvasDims, setCanvasDims] = useState({w:0,h:0});
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!template?.pdf_url) return;
    renderPage(template.pdf_url, currentPage, SCALE).then(({canvas,width,height,numPages:np}) => {
      const c = canvasRef.current;
      if (!c) return;
      c.width=width; c.height=height;
      c.getContext("2d").drawImage(canvas,0,0);
      setCanvasDims({w:width,h:height});
      setNumPages(np);
    });
  }, [template, currentPage]);

  const set = (id,val) => { setFormData(p=>({...p,[id]:val})); setActiveField(null); setErrors(p=>({...p,[id]:null})); };

  const handleSubmit = async () => {
    const errs={};
    for (const f of template.fields) if (f.required && !formData[f.id]) errs[f.id]=true;
    if (Object.keys(errs).length>0) { setErrors(errs); alert("Please fill in all required fields (highlighted in pink)."); return; }
    setSubmitting(true);
    const pdfBytes = await generateSignedPdf(template.pdf_url, template.fields, formData, {w:canvasDims.w,h:canvasDims.h}, SCALE);
    await onSubmit(formData, pdfBytes);
    setSubmitting(false);
  };

  const pageFields = template.fields.filter(f => (f.page || 1) === currentPage);
  const totalRequired = template.fields.filter(f => f.required).length;
  const totalFilled = template.fields.filter(f => f.required && formData[f.id]).length;

  return (
    <div>
      <div className="alert alert-info">Click each highlighted field to fill it in. Fields marked * are required.</div>
      {/* Page navigation */}
      {numPages > 1 && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:14}}>
          <button className="btn btn-outline btn-sm" onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}>← Prev</button>
          <span style={{fontSize:13,fontWeight:700,color:"var(--text2)"}}>Page {currentPage} of {numPages}</span>
          <button className="btn btn-outline btn-sm" onClick={()=>setCurrentPage(p=>Math.min(numPages,p+1))} disabled={currentPage===numPages}>Next →</button>
          {/* Page indicator dots */}
          <div style={{display:"flex",gap:5,marginLeft:4}}>
            {Array.from({length:numPages},(_,i)=>{
              const pageNum=i+1;
              const hasFields=template.fields.some(f=>(f.page||1)===pageNum);
              const hasRequired=template.fields.some(f=>(f.page||1)===pageNum&&f.required&&!formData[f.id]);
              return <div key={pageNum} onClick={()=>setCurrentPage(pageNum)} style={{width:10,height:10,borderRadius:"50%",cursor:"pointer",background:currentPage===pageNum?"#FF47E2":hasRequired?"#e05555":hasFields?"#86efac":"#d4b8f0",transition:"all .2s"}} title={`Page ${pageNum}`}/>;
            })}
          </div>
        </div>
      )}
      <div style={{overflow:"auto",background:"#1a1a2e",padding:20,borderRadius:12,marginBottom:20}}>
        <div className="pdf-viewer-wrap" style={{width:canvasDims.w,margin:"0 auto",position:"relative"}}>
          <canvas ref={canvasRef} className="pdf-viewer-canvas" />
          {pageFields.map(f => {
            const filled = !!formData[f.id];
            const isErr = !!errors[f.id];
            const isText = !["signature","initials","checkbox"].includes(f.type);
            return (
              <div key={f.id} className="sign-field-overlay" style={{left:f.x,top:f.y,width:f.w,height:f.h}} onClick={()=>setActiveField(f)}>
                {(f.type==="signature"||f.type==="initials")&&filled
                  ? <img src={formData[f.id]} className="sign-field-sig" alt="sig" />
                  : <div className={`sign-field-box ${filled?"filled":""}`} style={{
                      ...(isErr?{borderColor:"#e05555",background:"rgba(224,85,85,0.1)",color:"#c03030"}:{}),
                      ...(filled&&isText?{justifyContent:"flex-start",paddingLeft:4,fontSize:f.fontSize||11,fontFamily:"Helvetica, Arial, sans-serif",letterSpacing:0}:{})
                    }}>
                      {filled
                        ? (f.type==="checkbox"?"✓":formData[f.id])
                        : `${FIELD_TYPES.find(t=>t.type===f.type)?.icon} ${f.label}${f.required?" *":""}`}
                    </div>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
        <span style={{fontSize:13,color:"var(--text2)"}}>{totalFilled}/{totalRequired} required fields filled</span>
        <div style={{display:"flex",gap:12}}>
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-pink btn-lg" onClick={handleSubmit} disabled={submitting}>
            {submitting?<><span className="spin"/> Generating PDF…</>:"✍️ Sign & Submit"}
          </button>
        </div>
      </div>
      {activeField && (
        <div className="overlay"><div className="modal">
          <div className="modal-hd">
            <h2 className="modal-title">{FIELD_TYPES.find(t=>t.type===activeField.type)?.icon} {activeField.label}</h2>
            <button className="btn btn-outline btn-sm" onClick={()=>setActiveField(null)}>✕</button>
          </div>
          <div className="modal-body">
            <FieldInput field={activeField} current={formData[activeField.id]} onDone={val=>set(activeField.id,val)} />
          </div>
        </div></div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
// TEMPLATE BUILDER
// ════════════════════════════════════════════════
function TemplateBuilder({ template, onSave, onCancel }) {
  const [name,setName] = useState(template?.name||"");
  const [description,setDescription] = useState(template?.description||"");
  const [pdfUrl,setPdfUrl] = useState(template?.pdf_url||null);
  const [pdfDims,setPdfDims] = useState({w:template?.pdf_width||0,h:template?.pdf_height||0});
  const [fields,setFields] = useState(template?.fields||[]);
  const [selectedId,setSelectedId] = useState(null);
  const [dragging,setDragging] = useState(null);
  const [resizing,setResizing] = useState(null);
  const [scale] = useState(1.5);
  const [uploading,setUploading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [currentPage,setCurrentPage] = useState(1);
  const [numPages,setNumPages] = useState(1);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!pdfUrl) return;
    renderPage(pdfUrl,currentPage,scale).then(({canvas,width,height,numPages:np}) => {
      const c = canvasRef.current; if(!c) return;
      c.width=width; c.height=height; c.getContext("2d").drawImage(canvas,0,0);
      setPdfDims({w:width,h:height});
      setNumPages(np);
    });
  },[pdfUrl,currentPage,scale]);

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    setUploading(true);
    const fname = `template_${Date.now()}.pdf`;
    const {error} = await supabase.storage.from("template-pdfs").upload(fname,file,{contentType:"application/pdf",upsert:true});
    if (!error) { const {data:{publicUrl}} = supabase.storage.from("template-pdfs").getPublicUrl(fname); setPdfUrl(publicUrl); setCurrentPage(1); }
    else alert(`Upload failed: ${error.message}`);
    setUploading(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData("fieldType"); if(!fieldType) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const def = FIELD_TYPES.find(f=>f.type===fieldType);
    const id = `f_${Date.now()}`;
    setFields(p=>[...p,{id,type:fieldType,label:def.label,x:Math.max(0,e.clientX-rect.left-def.w/2),y:Math.max(0,e.clientY-rect.top-def.h/2),w:def.w,h:def.h,required:true,page:currentPage}]);
    setSelectedId(id);
  };
  const onFMD = (e,id) => { e.stopPropagation();e.preventDefault();setSelectedId(id);const f=fields.find(f=>f.id===id);const rect=wrapRef.current.getBoundingClientRect();setDragging({id,offX:e.clientX-rect.left-f.x,offY:e.clientY-rect.top-f.y}); };
  const onRMD = (e,id) => { e.stopPropagation();e.preventDefault();const f=fields.find(f=>f.id===id);setResizing({id,startX:e.clientX,startY:e.clientY,startW:f.w,startH:f.h}); };
  const onMM = useCallback((e) => {
    if (dragging) { const rect=wrapRef.current.getBoundingClientRect();setFields(p=>p.map(f=>f.id===dragging.id?{...f,x:Math.max(0,Math.min(e.clientX-rect.left-dragging.offX,pdfDims.w-20)),y:Math.max(0,Math.min(e.clientY-rect.top-dragging.offY,pdfDims.h-20))}:f)); }
    if (resizing) { const dx=e.clientX-resizing.startX,dy=e.clientY-resizing.startY;setFields(p=>p.map(f=>f.id===resizing.id?{...f,w:Math.max(40,resizing.startW+dx),h:Math.max(20,resizing.startH+dy)}:f)); }
  },[dragging,resizing,pdfDims]);
  const onMU = useCallback(()=>{setDragging(null);setResizing(null);},[]);
  const delField = (id) => {setFields(p=>p.filter(f=>f.id!==id));setSelectedId(null);};

  const saveTemplate = async () => {
    if (!name.trim()) { alert("Please enter a template name"); return; }
    setSaving(true);
    const payload = {name:name.trim(),description,pdf_url:pdfUrl,pdf_width:pdfDims.w,pdf_height:pdfDims.h,fields};
    if (template?.id) await supabase.from("contract_templates").update(payload).eq("id",template.id);
    else await supabase.from("contract_templates").insert(payload);
    setSaving(false); onSave();
  };
  const sel = fields.find(f=>f.id===selectedId);
  const pageFields = fields.filter(f=>(f.page||1)===currentPage);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 62px)"}}>
      <div style={{background:"#100142",borderBottom:"1px solid rgba(255,71,226,0.3)",padding:"10px 18px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button className="btn btn-sm" style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"#fff"}} onClick={onCancel}>← Back</button>
        <input className="form-input" style={{width:220,background:"rgba(255,255,255,0.08)",color:"#fff",borderColor:"rgba(255,71,226,0.3)"}} placeholder="Template name…" value={name} onChange={e=>setName(e.target.value)} />
        <input className="form-input" style={{width:260,background:"rgba(255,255,255,0.08)",color:"#fff",borderColor:"rgba(255,71,226,0.3)"}} placeholder="Description (optional)" value={description} onChange={e=>setDescription(e.target.value)} />
        <label className="btn btn-sm" style={{cursor:"pointer",background:"transparent",border:"1px solid rgba(255,71,226,0.4)",color:"#fff"}}>
          {uploading?<><span className="spin"/> Uploading…</>:"📎 Upload PDF"}
          <input type="file" accept="application/pdf" style={{display:"none"}} onChange={handleUpload} />
        </label>
        {/* Page navigation in toolbar */}
        {numPages > 1 && (
          <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:4}}>
            <button className="btn btn-sm" style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",padding:"4px 10px"}} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}>‹</button>
            <span style={{color:"rgba(255,255,255,0.8)",fontSize:13,whiteSpace:"nowrap"}}>Pg {currentPage}/{numPages}</span>
            <button className="btn btn-sm" style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",padding:"4px 10px"}} onClick={()=>setCurrentPage(p=>Math.min(numPages,p+1))} disabled={currentPage===numPages}>›</button>
          </div>
        )}
        <div style={{flex:1}} />
        {sel && <div style={{display:"flex",alignItems:"center",gap:8}}>
          <input className="form-input" style={{width:150,background:"rgba(255,255,255,0.08)",color:"#fff",borderColor:"rgba(255,71,226,0.3)",fontSize:13}} placeholder="Label" value={sel.label} onChange={e=>setFields(p=>p.map(f=>f.id===sel.id?{...f,label:e.target.value}:f))} />
          {(sel.type==="text"||sel.type==="full_name"||sel.type==="date"||sel.type==="email"||sel.type==="phone") && (
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.5)",whiteSpace:"nowrap"}}>Font size</span>
              <input type="number" min="6" max="72" className="form-input" style={{width:68,background:"rgba(255,255,255,0.08)",color:"#fff",borderColor:"rgba(255,71,226,0.3)",fontSize:13,padding:"6px 8px"}} placeholder="11" value={sel.fontSize||""} onChange={e=>setFields(p=>p.map(f=>f.id===sel.id?{...f,fontSize:parseInt(e.target.value)||null}:f))} />
              <span style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>px</span>
            </div>
          )}
          <label style={{display:"flex",alignItems:"center",gap:5,fontSize:13,color:"rgba(255,255,255,0.7)",whiteSpace:"nowrap"}}>
            <input type="checkbox" checked={!!sel.required} onChange={e=>setFields(p=>p.map(f=>f.id===sel.id?{...f,required:e.target.checked}:f))} /> Required
          </label>
          <button className="btn btn-danger btn-sm" onClick={()=>delField(sel.id)}>🗑</button>
        </div>}
        <button className="btn btn-pink" onClick={saveTemplate} disabled={saving}>{saving?<><span className="spin"/> Saving…</>:"💾 Save Template"}</button>
      </div>

      <div className="builder-layout" style={{flex:1}}>
        <div className="builder-sidebar">
          <div className="builder-sidebar-title">Drag Fields</div>
          <p style={{color:"rgba(255,255,255,0.3)",fontSize:11,marginBottom:8}}>Drag onto the document</p>
          {FIELD_TYPES.map(ft=>(
            <div key={ft.type} className="field-chip" draggable onDragStart={e=>e.dataTransfer.setData("fieldType",ft.type)}>
              <span>{ft.icon}</span><span>{ft.label}</span>
            </div>
          ))}
          {fields.length>0&&<><div className="builder-sidebar-title">Placed Fields</div>
            {fields.map(f=>(
              <div key={f.id} className="field-chip" style={{cursor:"pointer",...(selectedId===f.id?{borderColor:"#FF47E2",background:"rgba(255,71,226,0.15)"}:{})}} onClick={()=>{setSelectedId(f.id);setCurrentPage(f.page||1);}}>
                <span>{FIELD_TYPES.find(t=>t.type===f.type)?.icon}</span>
                <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis"}}>{f.label}</span>
                <span style={{fontSize:10,color:"rgba(255,71,226,0.6)",marginRight:4}}>p{f.page||1}</span>
                <button style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13}} onClick={e=>{e.stopPropagation();delField(f.id);}}>✕</button>
              </div>
            ))}
          </>}
        </div>
        <div className="builder-main" onMouseMove={onMM} onMouseUp={onMU} onClick={()=>setSelectedId(null)}>
          {!pdfUrl?(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,color:"rgba(255,255,255,0.4)"}}>
              <img src="/logo.png" alt="Logo" style={{height:22}} /><p style={{fontSize:16}}>Upload a PDF to get started</p>
              <label className="btn btn-pink" style={{cursor:"pointer"}}>📎 Upload PDF<input type="file" accept="application/pdf" style={{display:"none"}} onChange={handleUpload} /></label>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
              {/* Page nav below toolbar inside canvas area */}
              {numPages > 1 && (
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button className="btn btn-sm" style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,71,226,0.3)",color:"#fff"}} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}>← Prev Page</button>
                  <div style={{display:"flex",gap:5}}>
                    {Array.from({length:numPages},(_,i)=>{
                      const pg=i+1;
                      const hasFields=fields.some(f=>(f.page||1)===pg);
                      return <div key={pg} onClick={()=>setCurrentPage(pg)} style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,fontWeight:700,background:currentPage===pg?"#FF47E2":hasFields?"rgba(255,71,226,0.2)":"rgba(255,255,255,0.08)",color:currentPage===pg?"#100142":"#fff",border:currentPage===pg?"none":"1px solid rgba(255,71,226,0.2)",transition:"all .2s"}}>{pg}</div>;
                    })}
                  </div>
                  <button className="btn btn-sm" style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,71,226,0.3)",color:"#fff"}} onClick={()=>setCurrentPage(p=>Math.min(numPages,p+1))} disabled={currentPage===numPages}>Next Page →</button>
                </div>
              )}
              <div ref={wrapRef} className="pdf-canvas-wrap" style={{width:pdfDims.w,height:pdfDims.h,minWidth:pdfDims.w}} onDragOver={e=>e.preventDefault()} onDrop={onDrop}>
                <canvas ref={canvasRef} className="pdf-canvas" />
                {pageFields.map(f=>(
                  <div key={f.id} className={`field-overlay ${selectedId===f.id?"selected":""}`} style={{left:f.x,top:f.y,width:f.w,height:f.h}} onMouseDown={e=>onFMD(e,f.id)}>
                    <div className={`field-inner ${(f.type==="signature"||f.type==="initials")?"sig-field-inner":""} ${f.type==="checkbox"?"check-field-inner":""}`}>
                      {f.type==="signature"?`✍️ ${f.label}`:f.type==="initials"?"🖊️":f.type==="checkbox"?"☑":f.label}
                    </div>
                    {selectedId===f.id&&<div className="resize-handle" onMouseDown={e=>onRMD(e,f.id)} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// FAMILY PORTAL
// ════════════════════════════════════════════════
function FamilyPortal({ token }) {
  const [family,setFamily] = useState(null);
  const [assignments,setAssignments] = useState([]);
  const [templates,setTemplates] = useState({});
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);
  const [activeDoc,setActiveDoc] = useState(null);

  useEffect(()=>{load();},[]);

  const load = async () => {
    setLoading(true);
    const {data:fam,error:fe} = await supabase.from("families").select("*").eq("link_token",token).single();
    if (fe||!fam) { setError("Family not found. Please check your link."); setLoading(false); return; }
    setFamily(fam);
    const {data:assigns} = await supabase.from("assignments").select("*").eq("family_id",fam.id).order("created_at");
    setAssignments(assigns||[]);
    const ids=[...new Set((assigns||[]).map(a=>a.template_id))];
    const {data:tpls} = await supabase.from("contract_templates").select("*").in("id",ids.length?ids:["none"]);
    const map={}; (tpls||[]).forEach(t=>map[t.id]=t); setTemplates(map);
    setLoading(false);
  };

  const handleSign = async (assignment,formData,pdfBytes) => {
    const now=new Date().toISOString();
    const filename=`signed_${assignment.id}_${Date.now()}.pdf`;
    await supabase.storage.from("signed-pdfs").upload(filename,new Blob([pdfBytes],{type:"application/pdf"}),{contentType:"application/pdf",upsert:true});
    const {data:{publicUrl}} = supabase.storage.from("signed-pdfs").getPublicUrl(filename);
    await supabase.from("assignments").update({status:"completed",signed_data:formData,signed_at:now,pdf_url:publicUrl}).eq("id",assignment.id);
    setActiveDoc(null); load();
  };

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:14,background:"#100142"}}><div style={{width:38,height:38,border:"3px solid #FF47E2",borderTopColor:"transparent",borderRadius:"50%",animation:"spinA .8s linear infinite"}}/><p style={{color:"rgba(255,255,255,0.6)",fontFamily:"'DM Sans',sans-serif"}}>Loading…</p></div>;
  if (error) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#100142"}}><div style={{textAlign:"center"}}><img src="/logo.png" alt="Logo" style={{height:22}} /><p style={{color:"#FF47E2",fontSize:17,fontFamily:"'DM Sans',sans-serif"}}>{error}</p></div></div>;

  const completed=assignments.filter(a=>a.status==="completed").length;
  const total=assignments.length;

  return (
    <div style={{minHeight:"100vh",background:"var(--cream)"}}>
      <div className="portal-hero">
        <img src="/logo.png" alt="Logo" style={{height:60}} />
        <div className="portal-title"><span className="portal-title-accent">Mortality Files</span> Casting Portal</div>
        <div style={{color:"#FF47E2",fontFamily:"'Google Sans',serif",fontSize:12,letterSpacing:2,textTransform:"uppercase",margin:"8px 0 6px"}}>{family.name} Family</div>
        <div className="portal-sub">Please complete all required documents below</div>
      </div>
      <div className="page" style={{maxWidth:720}}>
        {total>0&&completed===total?(
          <div className="success-screen">
            <div className="success-icon">✅</div>
            <h2 style={{fontFamily:"'Google Sans',serif",fontSize:22,marginBottom:10,color:"#100142"}}>All Done!</h2>
            <p style={{color:"var(--text2)",fontSize:15}}>All documents have been signed. Thank you!</p>
          </div>
        ):(
          <>
            <div className="card mb-6"><div className="card-body">
              <div className="flex-between mb-4"><span style={{fontWeight:700}}>Progress</span><span className="badge badge-pink">{completed}/{total} complete</span></div>
              <div className="prog-wrap"><div className="prog-bar" style={{width:`${total?(completed/total)*100:0}%`}}/></div>
              <p className="text-muted" style={{fontSize:13}}>{total-completed} document{total-completed!==1?"s":""} remaining</p>
            </div></div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {assignments.map(a=>{
                const tpl=templates[a.template_id]; const done=a.status==="completed";
                return (
                  <div key={a.id} className={`task-card ${done?"done":""}`}>
                    <div>
                      <h3 style={{fontSize:15,fontWeight:700,marginBottom:4}}>{tpl?.name||"…"}</h3>
                      <p style={{fontSize:13,color:"var(--text2)"}}>For: <strong>{a.member_name}</strong></p>
                      {done&&<p style={{color:"#15803d",fontSize:12,marginTop:4}}>✓ Signed {a.signed_at?new Date(a.signed_at).toLocaleDateString():""}</p>}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      {done?(<><span style={{fontSize:24}}>✅</span>{a.pdf_url&&<a href={a.pdf_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">⬇ PDF</a>}</>)
                        :<button className="btn btn-pink" onClick={()=>setActiveDoc(a)}>✍️ Sign Now</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {activeDoc&&templates[activeDoc.template_id]&&(
        <div className="overlay"><div className="modal modal-xl">
          <div className="modal-hd">
            <div><div className="modal-title">{templates[activeDoc.template_id].name}</div><p style={{fontSize:13,color:"var(--text2)",marginTop:4}}>For: {activeDoc.member_name}</p></div>
            <button className="btn btn-outline btn-sm" onClick={()=>setActiveDoc(null)}>✕ Close</button>
          </div>
          <div className="modal-body">
            <PdfSigningView template={templates[activeDoc.template_id]} onSubmit={(data,pdfBytes)=>handleSign(activeDoc,data,pdfBytes)} onCancel={()=>setActiveDoc(null)} />
          </div>
        </div></div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
// ADMIN TABS
// ════════════════════════════════════════════════
function TemplatesTab() {
  const [templates,setTemplates]=useState([]);const [loading,setLoading]=useState(true);const [editing,setEditing]=useState(null);
  useEffect(()=>{load();},[]);
  const load=async()=>{setLoading(true);const{data}=await supabase.from("contract_templates").select("*").order("created_at",{ascending:false});setTemplates(data||[]);setLoading(false);};
  const del=async(id)=>{if(!confirm("Delete this template?"))return;await supabase.from("contract_templates").delete().eq("id",id);load();};
  if(editing!==null)return<TemplateBuilder template={editing==="new"?null:editing} onSave={()=>{setEditing(null);load();}} onCancel={()=>setEditing(null)}/>;
  if(loading)return<div className="empty-state"><div className="icon">⏳</div><p>Loading…</p></div>;
  return(
    <div className="page">
      <div className="flex-between mb-6"><div><h1 className="page-title">Contract Templates</h1><p className="page-sub">Upload PDFs and place fields for signing</p></div><button className="btn btn-pink" onClick={()=>setEditing("new")}>+ New Template</button></div>
      {templates.length===0?<div className="empty-state"><div className="icon">📋</div><p>No templates yet.</p></div>:(
        <div className="grid-2">{templates.map(t=>(
          <div key={t.id} className="card"><div className="card-body">
            <h3 style={{fontFamily:"'Google Sans',serif",fontSize:18,marginBottom:6,color:"#100142"}}>{t.name}</h3>
            {t.description&&<p className="text-muted" style={{marginBottom:10}}>{t.description}</p>}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
              {(t.fields||[]).map(f=><span key={f.id} className="tag">{FIELD_TYPES.find(ft=>ft.type===f.type)?.icon} {f.label}</span>)}
              {!t.pdf_url&&<span style={{color:"var(--rose)",fontSize:13}}>⚠️ No PDF uploaded</span>}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-pink btn-sm" onClick={()=>setEditing(t)}>✏️ Edit</button>
              {t.pdf_url&&<a href={t.pdf_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">👁 View</a>}
              <button className="btn btn-danger btn-sm" onClick={()=>del(t.id)}>🗑</button>
            </div>
          </div></div>
        ))}</div>
      )}
    </div>
  );
}

function FamiliesTab() {
  const [families,setFamilies]=useState([]);const [templates,setTemplates]=useState([]);const [allAssigns,setAllAssigns]=useState({});
  const [loading,setLoading]=useState(true);const [showCreate,setShowCreate]=useState(false);const [showAssign,setShowAssign]=useState(null);
  const [newName,setNewName]=useState("");const [creating,setCreating]=useState(false);const [members,setMembers]=useState([{name:"",templateId:""}]);
  const [saving,setSaving]=useState(false);const [copied,setCopied]=useState(null);
  useEffect(()=>{load();},[]);
  const load=async()=>{
    setLoading(true);
    const [{data:fams},{data:tpls}]=await Promise.all([supabase.from("families").select("*").order("created_at",{ascending:false}),supabase.from("contract_templates").select("id,name").order("name")]);
    setFamilies(fams||[]);setTemplates(tpls||[]);
    if(fams?.length){const{data:a}=await supabase.from("assignments").select("*").in("family_id",fams.map(f=>f.id));const m={};(a||[]).forEach(x=>{if(!m[x.family_id])m[x.family_id]=[];m[x.family_id].push(x);});setAllAssigns(m);}
    setLoading(false);
  };
  const createFamily=async()=>{if(!newName.trim())return;setCreating(true);await supabase.from("families").insert({name:newName.trim()});setNewName("");setShowCreate(false);setCreating(false);load();};
  const deleteFamily=async(id)=>{if(!confirm("Delete this family?"))return;await supabase.from("families").delete().eq("id",id);load();};
  const openAssign=async(fam)=>{const{data:ex}=await supabase.from("assignments").select("*").eq("family_id",fam.id);setMembers(ex?.length?ex.map(a=>({id:a.id,name:a.member_name,templateId:a.template_id,status:a.status})):[{name:"",templateId:""}]);setShowAssign(fam);};
  const saveAssignments=async()=>{setSaving(true);await supabase.from("assignments").delete().eq("family_id",showAssign.id).eq("status","pending");const rows=members.filter(m=>m.name.trim()&&m.templateId&&m.status!=="completed").map(m=>({family_id:showAssign.id,member_name:m.name.trim(),template_id:m.templateId}));if(rows.length)await supabase.from("assignments").insert(rows);setSaving(false);setShowAssign(null);load();};
  const copyLink=(token)=>{navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?family=${token}`);setCopied(token);setTimeout(()=>setCopied(null),2000);};
  if(loading)return<div className="empty-state"><div className="icon">⏳</div><p>Loading…</p></div>;
  return(
    <div>
      <div className="flex-between mb-6"><div><h1 className="page-title">Families</h1><p className="page-sub">Manage groups and assign documents</p></div><button className="btn btn-pink" onClick={()=>setShowCreate(true)}>+ New Family</button></div>
      {families.length===0?<div className="empty-state"><div className="icon">👨‍👩‍👧‍👦</div><p>No families yet.</p></div>:(
        <div className="card"><table className="table">
          <thead><tr><th>Family</th><th>Forms</th><th>Progress</th><th>Portal Link</th><th>Actions</th></tr></thead>
          <tbody>{families.map(f=>{const a=allAssigns[f.id]||[];const done=a.filter(x=>x.status==="completed").length;return(
            <tr key={f.id}>
              <td><strong>{f.name}</strong></td><td>{a.length||<span className="text-muted">—</span>}</td>
              <td>{a.length>0?(<div style={{display:"flex",alignItems:"center",gap:8}}><div className="prog-wrap" style={{margin:0,width:70}}><div className="prog-bar" style={{width:`${(done/a.length)*100}%`}}/></div><span style={{fontSize:12}}>{done}/{a.length}</span></div>):<span className="text-muted">—</span>}</td>
              <td><button className="btn btn-outline btn-sm" onClick={()=>copyLink(f.link_token)}>{copied===f.link_token?"✅ Copied!":"📋 Copy Link"}</button></td>
              <td><div className="flex gap-2"><button className="btn btn-pink btn-sm" onClick={()=>openAssign(f)}>Manage</button><button className="btn btn-outline btn-sm" onClick={()=>window.open(`${window.location.origin}${window.location.pathname}?family=${f.link_token}`,"_blank")}>Preview</button><button className="btn btn-danger btn-sm" onClick={()=>deleteFamily(f.id)}>🗑</button></div></td>
            </tr>
          );})}</tbody>
        </table></div>
      )}
      {showCreate&&<div className="overlay"><div className="modal">
        <div className="modal-hd"><h2 className="modal-title">New Family</h2><button className="btn btn-outline btn-sm" onClick={()=>setShowCreate(false)}>✕</button></div>
        <div className="modal-body"><div className="form-group"><label className="form-label">Family Name</label><input className="form-input" placeholder="e.g. Smith Family" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createFamily()} autoFocus /></div></div>
        <div className="modal-ft"><button className="btn btn-outline" onClick={()=>setShowCreate(false)}>Cancel</button><button className="btn btn-pink" onClick={createFamily} disabled={creating||!newName.trim()}>{creating?"Creating…":"Create"}</button></div>
      </div></div>}
      {showAssign&&<div className="overlay"><div className="modal modal-lg">
        <div className="modal-hd"><h2 className="modal-title">Assign Docs — {showAssign.name}</h2><button className="btn btn-outline btn-sm" onClick={()=>setShowAssign(null)}>✕</button></div>
        <div className="modal-body">
          <div className="alert alert-info">Add members and assign a form to each. Signed docs are locked.</div>
          {members.map((m,i)=>(
            <div key={i} className="member-row">
              <input className="member-input" placeholder="Name" value={m.name} disabled={m.status==="completed"} onChange={e=>setMembers(p=>p.map((x,j)=>j===i?{...x,name:e.target.value}:x))} />
              <select className="form-select" style={{flex:1}} value={m.templateId} disabled={m.status==="completed"} onChange={e=>setMembers(p=>p.map((x,j)=>j===i?{...x,templateId:e.target.value}:x))}>
                <option value="">— Select Form —</option>{templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {m.status==="completed"?<span className="badge badge-completed">✓ Signed</span>:<button className="btn btn-danger btn-sm" onClick={()=>setMembers(p=>p.filter((_,j)=>j!==i))}>✕</button>}
            </div>
          ))}
          <button className="btn btn-outline mt-4" onClick={()=>setMembers(p=>[...p,{name:"",templateId:""}])}>+ Add Person</button>
        </div>
        <div className="modal-ft"><button className="btn btn-outline" onClick={()=>setShowAssign(null)}>Cancel</button><button className="btn btn-pink" onClick={saveAssignments} disabled={saving}>{saving?"Saving…":"Save"}</button></div>
      </div></div>}
    </div>
  );
}

function DocumentsTab() {
  const [data,setData]=useState([]);const [loading,setLoading]=useState(true);const [filter,setFilter]=useState("all");
  useEffect(()=>{load();},[]);
  const load=async()=>{setLoading(true);const{data:d}=await supabase.from("assignments").select("*,families(name),contract_templates(name)").order("created_at",{ascending:false});setData(d||[]);setLoading(false);};
  const filtered=filter==="all"?data:data.filter(d=>d.status===filter);
  const signedCount=data.filter(d=>d.status==="completed").length;
  if(loading)return<div className="empty-state"><div className="icon">⏳</div><p>Loading…</p></div>;
  return(
    <div>
      <div className="flex-between mb-6"><div><h1 className="page-title">Signed Documents</h1><p className="page-sub">{signedCount} signed PDF{signedCount!==1?"s":""} ready to download</p></div><div className="flex gap-2">{["all","completed","pending"].map(f=><button key={f} className={`btn btn-sm ${filter===f?"btn-pink":"btn-outline"}`} onClick={()=>setFilter(f)}>{f==="all"?"All":f.charAt(0).toUpperCase()+f.slice(1)}</button>)}</div></div>
      {filtered.length===0?<div className="empty-state"><div className="icon">📄</div><p>No documents found.</p></div>:(
        <div className="card"><table className="table">
          <thead><tr><th>Family</th><th>Member</th><th>Document</th><th>Status</th><th>Signed</th><th>PDF</th></tr></thead>
          <tbody>{filtered.map(d=>(
            <tr key={d.id}>
              <td><strong>{d.families?.name}</strong></td><td>{d.member_name}</td><td>{d.contract_templates?.name}</td>
              <td><span className={`badge ${d.status==="completed"?"badge-completed":"badge-pending"}`}>{d.status==="completed"?"✓ Signed":"⏳ Pending"}</span></td>
              <td>{d.signed_at?new Date(d.signed_at).toLocaleDateString():"—"}</td>
              <td>{d.pdf_url?<a href={d.pdf_url} target="_blank" rel="noreferrer" className="btn btn-pink btn-sm">⬇ Download PDF</a>:"—"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}

function SetupCheck({ children }) {
  if (SUPABASE_URL==="https://YOUR_PROJECT.supabase.co") return(
    <div className="page" style={{maxWidth:700,marginTop:50}}><div className="card"><div className="card-body">
      <h2 style={{fontFamily:"'Google Sans',serif",fontSize:22,marginBottom:14,color:"#100142"}}>⚙️ Setup Required</h2>
      <div className="alert alert-warn">Configure your Supabase credentials before using this app.</div>
      <p style={{marginBottom:14,lineHeight:1.7}}>Open <code>src/App.jsx</code> and replace these at the top:</p>
      <div style={{background:"#100142",color:"#FF47E2",padding:16,borderRadius:10,fontFamily:"monospace",fontSize:13,marginBottom:20}}>
        <div>const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";</div>
        <div>const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";</div>
      </div>
      <p style={{fontWeight:700,marginBottom:10}}>SQL to run in Supabase SQL Editor:</p>
      <pre style={{background:"#100142",color:"#6ee7b7",padding:16,borderRadius:10,fontFamily:"monospace",fontSize:12,overflowX:"auto",whiteSpace:"pre-wrap"}}>{`create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  link_token text unique not null default encode(gen_random_bytes(16),'hex'),
  created_at timestamptz default now()
);
create table contract_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  pdf_url text,
  pdf_width float,
  pdf_height float,
  fields jsonb not null default '[]',
  created_at timestamptz default now()
);
create table assignments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  member_name text not null,
  template_id uuid references contract_templates(id) on delete cascade,
  status text default 'pending',
  signed_data jsonb,
  signed_at timestamptz,
  pdf_url text,
  created_at timestamptz default now()
);`}</pre>
      <p style={{marginTop:14,fontSize:13,color:"var(--text2)"}}>Create <strong>two public storage buckets</strong>: <code>template-pdfs</code> and <code>signed-pdfs</code>.</p>
      <p style={{marginTop:10,fontSize:13,color:"var(--text2)"}}>Add to <code>package.json</code>: <code>"pdfjs-dist": "^3.11.174"</code> and <code>"pdf-lib": "^1.17.1"</code></p>
    </div></div></div>
  );
  return children;
}

export default function App() {
  const [tab,setTab]=useState("families");
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("mf_admin_auth") === "1");

  const params=new URLSearchParams(window.location.search);
  const familyToken=params.get("family");

  // Family portal — no auth needed
  if(familyToken)return<div><style>{CSS}</style><FamilyPortal token={familyToken}/></div>;

  // Admin — require password
  if (!authed) return <div><style>{CSS}</style><AdminLogin onSuccess={() => setAuthed(true)} /></div>;

  return(
    <div>
      <style>{CSS}</style>
      <nav className="nav">
        <div className="nav-logo"><img src="/logo.png" alt="Logo" style={{height:22}} /><span>MORTALITY FILES <span className="nav-logo-accent">CASTING</span></span></div>
        <div className="nav-tabs">
          {[{id:"families",label:"👨‍👩‍👧‍👦 Families"},{id:"templates",label:"📋 Templates"},{id:"documents",label:"📄 Signed Docs"}].map(t=>(
            <button key={t.id} className={`nav-tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <button className="btn btn-sm" style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.6)",fontSize:12}} onClick={()=>{sessionStorage.removeItem("mf_admin_auth");setAuthed(false);}}>🔒 Lock</button>
      </nav>
      <SetupCheck>
        {tab==="templates"?<TemplatesTab/>:<div className="page">{tab==="families"&&<FamiliesTab/>}{tab==="documents"&&<DocumentsTab/>}</div>}
      </SetupCheck>
    </div>
  );
}
