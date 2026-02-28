// EXTRAS CASTING MANAGEMENT SYSTEM
// 
// SETUP INSTRUCTIONS:
// 1. Create a Supabase project at https://supabase.com
// 2. Run the SQL schema in your Supabase SQL editor (see SetupCheck component)
// 3. Replace SUPABASE_URL and SUPABASE_ANON_KEY below with your project values
// 4. Enable Storage in Supabase and create a bucket called "signed-pdfs" (set to public)
//

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// CONFIGURATION — Replace with your Supabase credentials
// ============================================================
const SUPABASE_URL = "https://kdnhetzdatwgbqiocikf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkbmhldHpkYXR3Z2JxaW9jaWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMTExMDAsImV4cCI6MjA4Nzg4NzEwMH0.G9xlu93KCK64V1VDc80uKk3jPVoV4YgKruumHStF1yU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// STYLES
// ============================================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #1a1a2e; --ink-light: #4a4a6a; --cream: #faf8f4; --gold: #c9a84c;
    --gold-light: #f0e6c8; --gold-dark: #9e7e30; --sage: #6b8f71; --rose: #c97070;
    --white: #ffffff; --border: #e8e0d0;
    --shadow: 0 4px 24px rgba(26,26,46,0.08); --shadow-lg: 0 12px 48px rgba(26,26,46,0.15);
    --radius: 12px; --radius-lg: 20px;
  }
  body { font-family:'DM Sans',sans-serif; background:var(--cream); color:var(--ink); min-height:100vh; }
  .nav { background:var(--ink); padding:0 32px; display:flex; align-items:center; justify-content:space-between; height:64px; position:sticky; top:0; z-index:100; box-shadow:0 2px 20px rgba(0,0,0,0.3); }
  .nav-logo { font-family:'Playfair Display',serif; font-size:22px; color:var(--gold); }
  .nav-logo span { color:#fff; }
  .nav-tabs { display:flex; gap:4px; }
  .nav-tab { padding:8px 18px; border-radius:8px; background:transparent; border:none; color:rgba(255,255,255,0.6); font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; cursor:pointer; transition:all 0.2s; }
  .nav-tab:hover { background:rgba(255,255,255,0.08); color:white; }
  .nav-tab.active { background:var(--gold); color:var(--ink); font-weight:600; }
  .page { max-width:1100px; margin:0 auto; padding:40px 24px; }
  .page-title { font-family:'Playfair Display',serif; font-size:32px; color:var(--ink); margin-bottom:8px; }
  .page-subtitle { color:var(--ink-light); font-size:15px; margin-bottom:32px; }
  .card { background:var(--white); border-radius:var(--radius-lg); border:1px solid var(--border); box-shadow:var(--shadow); overflow:hidden; }
  .card-body { padding:24px; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .btn { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; border-radius:10px; border:none; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; text-decoration:none; }
  .btn-primary { background:var(--ink); color:white; }
  .btn-primary:hover { background:#2d2d5e; transform:translateY(-1px); box-shadow:0 4px 12px rgba(26,26,46,0.3); }
  .btn-gold { background:var(--gold); color:var(--ink); }
  .btn-gold:hover { background:var(--gold-dark); transform:translateY(-1px); }
  .btn-outline { background:transparent; border:1.5px solid var(--border); color:var(--ink); }
  .btn-outline:hover { border-color:var(--gold); color:var(--gold-dark); }
  .btn-danger { background:var(--rose); color:white; }
  .btn-danger:hover { background:#b05555; }
  .btn-sm { padding:6px 14px; font-size:13px; }
  .btn-lg { padding:14px 28px; font-size:16px; }
  .btn:disabled { opacity:0.5; cursor:not-allowed; transform:none !important; }
  .form-group { margin-bottom:20px; }
  .form-label { display:block; font-size:13px; font-weight:600; color:var(--ink-light); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; }
  .form-input,.form-select,.form-textarea { width:100%; padding:10px 14px; border:1.5px solid var(--border); border-radius:10px; font-family:'DM Sans',sans-serif; font-size:14px; color:var(--ink); background:var(--cream); transition:border-color 0.2s; outline:none; }
  .form-input:focus,.form-select:focus,.form-textarea:focus { border-color:var(--gold); background:white; }
  .form-textarea { resize:vertical; min-height:80px; }
  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .table { width:100%; border-collapse:collapse; }
  .table th { padding:12px 16px; text-align:left; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--ink-light); border-bottom:2px solid var(--border); }
  .table td { padding:14px 16px; border-bottom:1px solid var(--border); font-size:14px; }
  .table tr:last-child td { border-bottom:none; }
  .table tr:hover td { background:var(--cream); }
  .badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; }
  .badge-pending { background:#fff3cd; color:#856404; }
  .badge-completed { background:#d1fae5; color:#065f46; }
  .badge-gold { background:var(--gold-light); color:var(--gold-dark); }
  .modal-overlay { position:fixed; inset:0; background:rgba(26,26,46,0.6); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
  .modal { background:white; border-radius:var(--radius-lg); width:100%; max-width:680px; max-height:90vh; overflow-y:auto; box-shadow:var(--shadow-lg); animation:slideUp 0.3s ease; }
  .modal-lg { max-width:860px; }
  .modal-xl { max-width:1000px; }
  .modal-header { padding:24px 28px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; background:white; z-index:1; }
  .modal-title { font-family:'Playfair Display',serif; font-size:22px; }
  .modal-body { padding:28px; }
  .modal-footer { padding:20px 28px; border-top:1px solid var(--border); display:flex; gap:12px; justify-content:flex-end; }
  @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .sig-pad-container { border:2px dashed var(--border); border-radius:var(--radius); background:var(--cream); position:relative; overflow:hidden; }
  .sig-pad-container:hover { border-color:var(--gold); }
  .sig-pad { display:block; width:100%; cursor:crosshair; touch-action:none; }
  .sig-pad-label { position:absolute; bottom:12px; left:50%; transform:translateX(-50%); font-size:12px; color:var(--ink-light); pointer-events:none; white-space:nowrap; }
  .sig-clear { position:absolute; top:8px; right:8px; background:white; border:1px solid var(--border); border-radius:6px; padding:4px 10px; font-size:12px; cursor:pointer; font-family:'DM Sans',sans-serif; }
  .sig-clear:hover { border-color:var(--rose); color:var(--rose); }
  .portal-hero { background:var(--ink); padding:48px 24px; text-align:center; color:white; }
  .portal-hero-title { font-family:'Playfair Display',serif; font-size:36px; color:var(--gold); margin-bottom:8px; }
  .portal-hero-sub { color:rgba(255,255,255,0.7); font-size:16px; }
  .task-card { background:white; border:1.5px solid var(--border); border-radius:var(--radius); padding:20px; display:flex; align-items:center; justify-content:space-between; transition:all 0.2s; }
  .task-card:hover { border-color:var(--gold); box-shadow:var(--shadow); }
  .task-card.completed { border-color:#6ee7b7; background:#f0fdf4; }
  .task-info h3 { font-size:16px; font-weight:600; margin-bottom:4px; }
  .task-info p { font-size:13px; color:var(--ink-light); }
  .progress-bar-wrap { background:var(--border); border-radius:100px; height:8px; overflow:hidden; margin:16px 0; }
  .progress-bar { height:100%; background:linear-gradient(90deg, var(--gold), var(--sage)); border-radius:100px; transition:width 0.5s ease; }
  .success-screen { text-align:center; padding:60px 24px; }
  .success-icon { width:80px; height:80px; background:#d1fae5; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 24px; font-size:36px; }
  .field-type-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:24px; }
  .field-type-btn { padding:14px; border:2px solid var(--border); border-radius:var(--radius); background:white; cursor:pointer; text-align:center; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
  .field-type-btn:hover { border-color:var(--gold); background:var(--gold-light); }
  .field-list { display:flex; flex-direction:column; gap:10px; }
  .field-item { background:var(--cream); border:1.5px solid var(--border); border-radius:var(--radius); padding:14px 16px; }
  .doc-field-group { margin-bottom:24px; }
  .doc-field-label { font-size:13px; font-weight:600; color:var(--ink-light); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; display:block; }
  .doc-field-required::after { content:' *'; color:var(--rose); }
  .member-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--border); }
  .member-row:last-child { border-bottom:none; }
  .member-name-input { flex:1; padding:8px 12px; border:1.5px solid var(--border); border-radius:8px; font-family:'DM Sans',sans-serif; font-size:14px; background:var(--cream); outline:none; }
  .alert { padding:14px 18px; border-radius:var(--radius); font-size:14px; margin-bottom:16px; }
  .alert-info { background:#dbeafe; color:#1e40af; border:1px solid #93c5fd; }
  .alert-warn { background:#fef3c7; color:#92400e; border:1px solid #fcd34d; }
  .divider { border:none; border-top:1px solid var(--border); margin:24px 0; }
  .text-muted { color:var(--ink-light); font-size:14px; }
  .empty-state { text-align:center; padding:48px; color:var(--ink-light); }
  .empty-state .icon { font-size:48px; margin-bottom:12px; }
  .flex { display:flex; }
  .flex-between { display:flex; align-items:center; justify-content:space-between; }
  .flex-center { display:flex; align-items:center; justify-content:center; }
  .gap-2 { gap:8px; }
  .gap-3 { gap:12px; }
  .mb-4 { margin-bottom:16px; }
  .mb-6 { margin-bottom:24px; }
  .mt-4 { margin-top:16px; }
  .tag { display:inline-block; padding:3px 10px; background:var(--gold-light); color:var(--gold-dark); border-radius:20px; font-size:12px; font-weight:600; }
  .spinner { display:inline-block; width:18px; height:18px; border:2.5px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  @media(max-width:768px) { .grid-2{grid-template-columns:1fr;} .form-row{grid-template-columns:1fr;} .field-type-grid{grid-template-columns:repeat(2,1fr);} .nav-tabs{display:none;} .page{padding:24px 16px;} }
`;

const FIELD_TYPES = [
  { type:"text", label:"Text Field", icon:"📝" },
  { type:"full_name", label:"Full Name", icon:"👤" },
  { type:"date", label:"Date", icon:"📅" },
  { type:"email", label:"Email", icon:"✉️" },
  { type:"phone", label:"Phone", icon:"📞" },
  { type:"signature", label:"Signature", icon:"✍️" },
  { type:"checkbox", label:"Checkbox", icon:"☑️" },
  { type:"textarea", label:"Long Text", icon:"📄" },
  { type:"heading", label:"Heading", icon:"🔤" },
];

// ============================================================
// SIGNATURE PAD
// ============================================================
function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = 140;
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (value) { const img = new Image(); img.onload = () => ctx.drawImage(img,0,0); img.src = value; }
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const startDraw = (e) => {
    drawing.current = true;
    const pos = getPos(e, canvasRef.current);
    lastPos.current = pos;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath(); ctx.arc(pos.x, pos.y, 1, 0, Math.PI*2);
    ctx.fillStyle = "#1a1a2e"; ctx.fill();
  };

  const draw = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current.toDataURL());
  };

  const clear = () => {
    canvasRef.current.getContext("2d").clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    onChange(null);
  };

  return (
    <div className="sig-pad-container">
      <canvas ref={canvasRef} className="sig-pad" style={{height:"140px"}}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
      <span className="sig-pad-label">Sign here</span>
      <button className="sig-clear" onClick={clear} type="button">Clear</button>
    </div>
  );
}

// ============================================================
// DOCUMENT FORM (family fills this out)
// ============================================================
function DocumentForm({ template, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    for (const field of template.fields) {
      if (field.required && field.type !== "heading" && (!formData[field.id] || formData[field.id] === "")) {
        errs[field.id] = "This field is required";
      }
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
  };

  const set = (id, val) => setFormData(p => ({ ...p, [id]: val }));

  return (
    <div>
      <div className="alert alert-info">Please fill out all required fields and sign where indicated.</div>
      {template.fields.map(field => (
        <div key={field.id} className="doc-field-group">
          {field.type === "heading" ? (
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:16,paddingTop:8,borderTop:"1px solid var(--border)"}}>{field.label}</h3>
          ) : (
            <>
              <label className={`doc-field-label ${field.required ? "doc-field-required" : ""}`}>{field.label}</label>
              {field.type === "signature" ? (
                <SignaturePad value={formData[field.id]} onChange={val => set(field.id, val)} />
              ) : field.type === "textarea" ? (
                <textarea className="form-textarea" rows={4} value={formData[field.id]||""} onChange={e => set(field.id, e.target.value)} placeholder={field.placeholder||""} />
              ) : field.type === "checkbox" ? (
                <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                  <input type="checkbox" checked={!!formData[field.id]} onChange={e => set(field.id, e.target.checked)} style={{width:18,height:18}} />
                  <span style={{fontSize:14}}>{field.checkboxLabel || "I agree"}</span>
                </label>
              ) : (
                <input className="form-input"
                  type={field.type==="date"?"date":field.type==="email"?"email":field.type==="phone"?"tel":"text"}
                  value={formData[field.id]||""}
                  onChange={e => set(field.id, e.target.value)}
                  placeholder={field.placeholder||""} />
              )}
              {errors[field.id] && <p style={{color:"var(--rose)",fontSize:12,marginTop:4}}>{errors[field.id]}</p>}
            </>
          )}
        </div>
      ))}
      <div style={{display:"flex",gap:12,justifyContent:"flex-end",paddingTop:24,borderTop:"1px solid var(--border)"}}>
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <><span className="spinner" /> Signing...</> : "✍️ Sign & Submit"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// GENERATE PDF (HTML blob uploaded to storage)
// ============================================================
async function buildSignedHtml(assignment, template) {
  const d = assignment.signed_data || {};
  let body = `<html><head><style>
    body{font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:40px;color:#1a1a2e;}
    h1{font-size:28px;margin-bottom:8px;} .meta{color:#666;font-size:13px;margin-bottom:32px;}
    .field{margin-bottom:20px;} .fl{font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;color:#666;margin-bottom:6px;}
    .fv{font-size:15px;border-bottom:1.5px solid #ccc;padding-bottom:8px;min-height:28px;}
    .heading{font-size:16px;font-weight:bold;margin:24px 0 8px;} img.sig{max-height:80px;border:1px solid #eee;padding:4px;}
  </style></head><body>
  <h1>${template.name}</h1>
  <div class="meta">Signed by: ${assignment.member_name} | Date: ${new Date(assignment.signed_at).toLocaleDateString()}</div>`;
  for (const f of template.fields) {
    if (f.type === "heading") body += `<div class="heading">${f.label}</div>`;
    else if (f.type === "signature") body += `<div class="field"><div class="fl">${f.label}</div>${d[f.id] ? `<img class="sig" src="${d[f.id]}" />` : ""}</div>`;
    else body += `<div class="field"><div class="fl">${f.label}</div><div class="fv">${d[f.id] || ""}</div></div>`;
  }
  body += `</body></html>`;
  return body;
}

// ============================================================
// FAMILY PORTAL (passwordless)
// ============================================================
function FamilyPortal({ token }) {
  const [family, setFamily] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDoc, setActiveDoc] = useState(null);

  useEffect(() => { loadFamily(); }, []);

  const loadFamily = async () => {
    setLoading(true);
    const { data: fam, error: fe } = await supabase.from("families").select("*").eq("link_token", token).single();
    if (fe || !fam) { setError("Family not found. Please check your link."); setLoading(false); return; }
    setFamily(fam);
    const { data: assigns } = await supabase.from("assignments").select("*").eq("family_id", fam.id).order("created_at");
    setAssignments(assigns || []);
    const tplIds = [...new Set((assigns||[]).map(a=>a.template_id))];
    const { data: tpls } = await supabase.from("contract_templates").select("*").in("id", tplIds.length>0 ? tplIds : ["none"]);
    const map = {}; (tpls||[]).forEach(t => map[t.id]=t);
    setTemplates(map);
    setLoading(false);
  };

  const handleSign = async (assignment, formData) => {
    const template = templates[assignment.template_id];
    const now = new Date().toISOString();
    const html = await buildSignedHtml({ ...assignment, signed_data: formData, signed_at: now }, template);
    const blob = new Blob([html], { type: "text/html" });
    const filename = `${assignment.id}_${Date.now()}.html`;
    await supabase.storage.from("signed-pdfs").upload(filename, blob, { contentType:"text/html", upsert:true });
    const { data: { publicUrl } } = supabase.storage.from("signed-pdfs").getPublicUrl(filename);
    await supabase.from("assignments").update({ status:"completed", signed_data:formData, signed_at:now, pdf_url:publicUrl }).eq("id", assignment.id);
    setActiveDoc(null);
    loadFamily();
  };

  if (loading) return <div className="flex-center" style={{height:"100vh",flexDirection:"column",gap:16}}><div style={{width:40,height:40,border:"3px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><p style={{color:"var(--ink-light)"}}>Loading your documents...</p></div>;
  if (error) return <div className="flex-center" style={{height:"100vh"}}><div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>❌</div><p style={{color:"var(--rose)",fontSize:18}}>{error}</p></div></div>;

  const completed = assignments.filter(a=>a.status==="completed").length;
  const total = assignments.length;
  const allDone = total > 0 && completed === total;

  return (
    <div>
      <div className="portal-hero">
        <div className="portal-hero-title">Welcome, {family.name} Family</div>
        <div className="portal-hero-sub">Please complete all required documents below</div>
      </div>
      <div className="page" style={{maxWidth:720}}>
        {allDone ? (
          <div className="success-screen">
            <div className="success-icon">✅</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,marginBottom:12}}>All Done!</h2>
            <p style={{color:"var(--ink-light)",fontSize:16}}>All documents have been signed and submitted. Thank you!</p>
          </div>
        ) : (
          <>
            <div className="card mb-6">
              <div className="card-body">
                <div className="flex-between mb-4">
                  <span style={{fontWeight:600}}>Progress</span>
                  <span className="badge badge-gold">{completed}/{total} complete</span>
                </div>
                <div className="progress-bar-wrap"><div className="progress-bar" style={{width:`${total ? (completed/total)*100 : 0}%`}} /></div>
                <p className="text-muted" style={{fontSize:13}}>{total-completed} document{total-completed!==1?"s":""} remaining</p>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {assignments.map(a => {
                const tpl = templates[a.template_id];
                const done = a.status === "completed";
                return (
                  <div key={a.id} className={`task-card ${done?"completed":""}`}>
                    <div className="task-info">
                      <h3>{tpl?.name || "Loading..."}</h3>
                      <p>For: <strong>{a.member_name}</strong></p>
                      {done && <p style={{color:"var(--sage)",fontSize:12,marginTop:4}}>✓ Signed {a.signed_at ? new Date(a.signed_at).toLocaleDateString() : ""}</p>}
                    </div>
                    {done ? <span style={{fontSize:28}}>✅</span> : (
                      <button className="btn btn-primary" onClick={() => setActiveDoc(a)}>✍️ Sign Now</button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {activeDoc && templates[activeDoc.template_id] && (
        <div className="modal-overlay">
          <div className="modal modal-xl">
            <div className="modal-header">
              <div>
                <div className="modal-title">{templates[activeDoc.template_id].name}</div>
                <p style={{fontSize:13,color:"var(--ink-light)",marginTop:4}}>For: {activeDoc.member_name}</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setActiveDoc(null)}>✕ Close</button>
            </div>
            <div className="modal-body">
              <DocumentForm template={templates[activeDoc.template_id]} onSubmit={data => handleSign(activeDoc, data)} onCancel={() => setActiveDoc(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADMIN: FAMILIES TAB
// ============================================================
function FamiliesTab() {
  const [families, setFamilies] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(null);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [allAssignments, setAllAssignments] = useState({});
  const [members, setMembers] = useState([{name:"",templateId:""}]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: fams }, { data: tpls }] = await Promise.all([
      supabase.from("families").select("*").order("created_at", { ascending:false }),
      supabase.from("contract_templates").select("*").order("name"),
    ]);
    setFamilies(fams||[]);
    setTemplates(tpls||[]);
    if (fams && fams.length > 0) {
      const { data: assigns } = await supabase.from("assignments").select("*").in("family_id", fams.map(f=>f.id));
      const map = {};
      (assigns||[]).forEach(a => { if(!map[a.family_id]) map[a.family_id]=[]; map[a.family_id].push(a); });
      setAllAssignments(map);
    }
    setLoading(false);
  };

  const createFamily = async () => {
    if (!newFamilyName.trim()) return;
    setCreating(true);
    await supabase.from("families").insert({ name: newFamilyName.trim() });
    setNewFamilyName(""); setShowCreate(false); setCreating(false);
    load();
  };

  const deleteFamily = async (id) => {
    if (!confirm("Delete this family and all their assignments?")) return;
    await supabase.from("families").delete().eq("id", id);
    load();
  };

  const openAssign = async (family) => {
    setShowAssign(family);
    const { data: existing } = await supabase.from("assignments").select("*").eq("family_id", family.id);
    setMembers(existing && existing.length > 0
      ? existing.map(a => ({ id:a.id, name:a.member_name, templateId:a.template_id, status:a.status }))
      : [{ name:"", templateId:"" }]);
  };

  const saveAssignments = async () => {
    if (!showAssign) return;
    setSaving(true);
    // Only delete pending ones (don't touch completed/signed)
    await supabase.from("assignments").delete().eq("family_id", showAssign.id).eq("status", "pending");
    const toInsert = members.filter(m => m.name.trim() && m.templateId && m.status !== "completed").map(m => ({
      family_id: showAssign.id, member_name: m.name.trim(), template_id: m.templateId,
    }));
    if (toInsert.length > 0) await supabase.from("assignments").insert(toInsert);
    setSaving(false); setShowAssign(null); load();
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}${window.location.pathname}?family=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token); setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Loading families...</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 className="page-title">Families</h1>
          <p className="page-subtitle">Manage family groups and their document assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Family</button>
      </div>

      {families.length === 0 ? (
        <div className="empty-state"><div className="icon">👨‍👩‍👧‍👦</div><p>No families yet. Create your first one!</p></div>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Family</th><th>Assignments</th><th>Progress</th><th>Portal Link</th><th>Actions</th></tr></thead>
            <tbody>
              {families.map(f => {
                const assigns = allAssignments[f.id] || [];
                const done = assigns.filter(a=>a.status==="completed").length;
                const total = assigns.length;
                return (
                  <tr key={f.id}>
                    <td><strong>{f.name}</strong></td>
                    <td>{total > 0 ? `${total} form${total!==1?"s":""}` : <span className="text-muted">None</span>}</td>
                    <td>{total > 0 ? (
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div className="progress-bar-wrap" style={{margin:0,width:80}}><div className="progress-bar" style={{width:`${(done/total)*100}%`}} /></div>
                        <span style={{fontSize:12}}>{done}/{total}</span>
                      </div>
                    ) : <span className="text-muted">—</span>}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => copyLink(f.link_token)}>
                        {copied===f.link_token ? "✅ Copied!" : "📋 Copy Link"}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-gold btn-sm" onClick={() => openAssign(f)}>Manage Docs</button>
                        <button className="btn btn-outline btn-sm" onClick={() => window.open(`${window.location.origin}${window.location.pathname}?family=${f.link_token}`, "_blank")}>Preview</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteFamily(f.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">New Family</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Family Name</label>
                <input className="form-input" placeholder="e.g. Smith Family" value={newFamilyName}
                  onChange={e => setNewFamilyName(e.target.value)} onKeyDown={e => e.key==="Enter" && createFamily()} autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createFamily} disabled={creating||!newFamilyName.trim()}>{creating?"Creating...":"Create Family"}</button>
            </div>
          </div>
        </div>
      )}

      {showAssign && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">Assign Documents — {showAssign.name}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAssign(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">Add family members and assign a form to each. Signed documents cannot be changed.</div>
              <div className="field-list">
                {members.map((m, i) => (
                  <div key={i} className="member-row">
                    <input className="member-name-input" placeholder="Member name (e.g. Charlie)"
                      value={m.name} disabled={m.status==="completed"}
                      onChange={e => setMembers(p => p.map((x,j) => j===i ? {...x,name:e.target.value} : x))} />
                    <select className="form-select" style={{flex:1}} value={m.templateId} disabled={m.status==="completed"}
                      onChange={e => setMembers(p => p.map((x,j) => j===i ? {...x,templateId:e.target.value} : x))}>
                      <option value="">— Select Form —</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {m.status === "completed"
                      ? <span className="badge badge-completed">✓ Signed</span>
                      : <button className="btn btn-danger btn-sm" onClick={() => setMembers(p => p.filter((_,j) => j!==i))}>✕</button>}
                  </div>
                ))}
              </div>
              <button className="btn btn-outline mt-4" onClick={() => setMembers(p => [...p,{name:"",templateId:""}])}>+ Add Person</button>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAssign(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAssignments} disabled={saving}>{saving?"Saving...":"Save Assignments"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADMIN: TEMPLATES TAB
// ============================================================
function TemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(null);
  const [previewTpl, setPreviewTpl] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("contract_templates").select("*").order("created_at", { ascending:false });
    setTemplates(data||[]); setLoading(false);
  };

  const save = async () => {
    if (!showEditor.name.trim()) { alert("Please provide a template name"); return; }
    setSaving(true);
    if (showEditor.id) {
      await supabase.from("contract_templates").update({ name:showEditor.name, description:showEditor.description, fields:showEditor.fields }).eq("id", showEditor.id);
    } else {
      await supabase.from("contract_templates").insert({ name:showEditor.name, description:showEditor.description, fields:showEditor.fields });
    }
    setSaving(false); setShowEditor(null); load();
  };

  const deleteTemplate = async (id) => {
    if (!confirm("Delete this template?")) return;
    await supabase.from("contract_templates").delete().eq("id", id); load();
  };

  const addField = (type) => {
    const id = `field_${Date.now()}`;
    const def = { id, type, label: FIELD_TYPES.find(f=>f.type===type)?.label||type, required: type!=="heading", placeholder:"" };
    if (type === "checkbox") def.checkboxLabel = "I agree to the terms above";
    setShowEditor(p => ({ ...p, fields: [...p.fields, def] }));
  };

  const updateField = (idx, updates) => setShowEditor(p => ({ ...p, fields: p.fields.map((f,i) => i===idx ? {...f,...updates} : f) }));
  const removeField = (idx) => setShowEditor(p => ({ ...p, fields: p.fields.filter((_,i) => i!==idx) }));
  const moveField = (idx, dir) => {
    setShowEditor(p => {
      const fields = [...p.fields]; const to = idx+dir;
      if (to < 0 || to >= fields.length) return p;
      [fields[idx], fields[to]] = [fields[to], fields[idx]];
      return { ...p, fields };
    });
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Loading templates...</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 className="page-title">Contract Templates</h1>
          <p className="page-subtitle">Build reusable form templates for your production</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowEditor({name:"",description:"",fields:[]})}>+ New Template</button>
      </div>

      {templates.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><p>No templates yet. Create your first contract!</p></div>
      ) : (
        <div className="grid-2">
          {templates.map(t => (
            <div key={t.id} className="card">
              <div className="card-body">
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:6}}>{t.name}</h3>
                {t.description && <p className="text-muted" style={{marginBottom:12}}>{t.description}</p>}
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                  {(t.fields||[]).map(f => <span key={f.id} className="tag">{FIELD_TYPES.find(ft=>ft.type===f.type)?.icon} {f.label}</span>)}
                  {(t.fields||[]).length === 0 && <span className="text-muted" style={{fontSize:13}}>No fields yet</span>}
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-gold btn-sm" onClick={() => setShowEditor({...t, fields:[...(t.fields||[])]})}>✏️ Edit</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setPreviewTpl(t)}>👁 Preview</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteTemplate(t.id)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <div className="modal-overlay">
          <div className="modal modal-xl">
            <div className="modal-header">
              <h2 className="modal-title">{showEditor.id ? "Edit Template" : "New Template"}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowEditor(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row" style={{marginBottom:24}}>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Template Name *</label>
                  <input className="form-input" placeholder="e.g. Minor Consent Form" value={showEditor.name}
                    onChange={e => setShowEditor(p => ({...p, name:e.target.value}))} />
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Description</label>
                  <input className="form-input" placeholder="Optional" value={showEditor.description}
                    onChange={e => setShowEditor(p => ({...p, description:e.target.value}))} />
                </div>
              </div>
              <hr className="divider" />
              <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Add Fields</h3>
              <div className="field-type-grid">
                {FIELD_TYPES.map(ft => (
                  <button key={ft.type} className="field-type-btn" onClick={() => addField(ft.type)}>
                    <span style={{fontSize:20,display:"block",marginBottom:6}}>{ft.icon}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{ft.label}</span>
                  </button>
                ))}
              </div>
              {showEditor.fields.length > 0 && (
                <>
                  <hr className="divider" />
                  <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Fields ({showEditor.fields.length})</h3>
                  <div className="field-list">
                    {showEditor.fields.map((field,i) => (
                      <div key={field.id} className="field-item" style={{flexDirection:"column",alignItems:"stretch",gap:12}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <span style={{fontSize:20}}>{FIELD_TYPES.find(f=>f.type===field.type)?.icon}</span>
                            <div><div style={{fontWeight:600,fontSize:14}}>{field.label}</div><div style={{fontSize:12,color:"var(--ink-light)"}}>{field.type}</div></div>
                          </div>
                          <div className="flex gap-2">
                            <button className="btn btn-outline btn-sm" onClick={() => moveField(i,-1)} disabled={i===0}>↑</button>
                            <button className="btn btn-outline btn-sm" onClick={() => moveField(i,1)} disabled={i===showEditor.fields.length-1}>↓</button>
                            <button className="btn btn-danger btn-sm" onClick={() => removeField(i)}>✕</button>
                          </div>
                        </div>
                        <div className="form-row" style={{marginTop:4}}>
                          <div>
                            <label className="form-label">Label</label>
                            <input className="form-input" value={field.label} onChange={e => updateField(i,{label:e.target.value})} />
                          </div>
                          {field.type !== "heading" && field.type !== "signature" && field.type !== "checkbox" && (
                            <div>
                              <label className="form-label">Placeholder</label>
                              <input className="form-input" value={field.placeholder||""} onChange={e => updateField(i,{placeholder:e.target.value})} />
                            </div>
                          )}
                          {field.type === "checkbox" && (
                            <div>
                              <label className="form-label">Checkbox Label</label>
                              <input className="form-input" value={field.checkboxLabel||""} onChange={e => updateField(i,{checkboxLabel:e.target.value})} />
                            </div>
                          )}
                        </div>
                        {field.type !== "heading" && (
                          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"}}>
                            <input type="checkbox" checked={!!field.required} onChange={e => updateField(i,{required:e.target.checked})} />
                            Required field
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowEditor(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?"Saving...":"Save Template"}</button>
            </div>
          </div>
        </div>
      )}

      {previewTpl && (
        <div className="modal-overlay">
          <div className="modal modal-xl">
            <div className="modal-header">
              <div>
                <div className="modal-title">Preview: {previewTpl.name}</div>
                <p style={{fontSize:13,color:"var(--ink-light)",marginTop:4}}>Preview only — submission won't be saved</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setPreviewTpl(null)}>✕ Close</button>
            </div>
            <div className="modal-body">
              <DocumentForm template={previewTpl} onSubmit={() => { alert("Preview mode — not saved"); setPreviewTpl(null); }} onCancel={() => setPreviewTpl(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADMIN: SIGNED DOCUMENTS TAB
// ============================================================
function SignedDocViewer({ assignmentId }) {
  const [doc, setDoc] = useState(null);
  const [template, setTemplate] = useState(null);
  useEffect(() => {
    supabase.from("assignments").select("*, contract_templates(*)").eq("id", assignmentId).single().then(({ data }) => {
      if (data) { setDoc(data); setTemplate(data.contract_templates); }
    });
  }, [assignmentId]);
  if (!doc || !template) return <p>Loading...</p>;
  const d = doc.signed_data || {};
  return (
    <div>
      {template.fields.map(field => (
        <div key={field.id} className="doc-field-group">
          {field.type === "heading" ? (
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:8,marginTop:16,borderTop:"1px solid var(--border)",paddingTop:16}}>{field.label}</h3>
          ) : (
            <>
              <label className="doc-field-label">{field.label}</label>
              {field.type === "signature"
                ? d[field.id] ? <img src={d[field.id]} alt="Signature" style={{border:"1px solid var(--border)",borderRadius:8,maxHeight:100,background:"white",padding:8}} /> : <p className="text-muted">Not signed</p>
                : field.type === "checkbox"
                ? <p>{d[field.id] ? "✅ Agreed" : "❌ Not agreed"}</p>
                : <p style={{padding:"10px 0",borderBottom:"1.5px solid var(--border)",fontSize:15}}>{d[field.id] || <span className="text-muted">—</span>}</p>}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function DocumentsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [viewDoc, setViewDoc] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: assigns } = await supabase.from("assignments").select("*, families(name), contract_templates(name)").order("created_at", { ascending:false });
    setData(assigns||[]); setLoading(false);
  };

  const filtered = filter === "all" ? data : data.filter(d => d.status === filter);
  const signedCount = data.filter(d => d.status === "completed").length;

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Loading documents...</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">{signedCount} signed document{signedCount!==1?"s":""} across all families</p>
        </div>
        <div className="flex gap-2">
          {["all","completed","pending"].map(f => (
            <button key={f} className={`btn btn-sm ${filter===f?"btn-primary":"btn-outline"}`} onClick={() => setFilter(f)}>
              {f==="all"?"All":f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">📄</div><p>No documents found.</p></div>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Family</th><th>Member</th><th>Document</th><th>Status</th><th>Signed</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.families?.name}</strong></td>
                  <td>{d.member_name}</td>
                  <td>{d.contract_templates?.name}</td>
                  <td><span className={`badge ${d.status==="completed"?"badge-completed":"badge-pending"}`}>{d.status==="completed"?"✓ Signed":"⏳ Pending"}</span></td>
                  <td>{d.signed_at ? new Date(d.signed_at).toLocaleDateString() : "—"}</td>
                  <td>{d.status === "completed" && (
                    <div className="flex gap-2">
                      <button className="btn btn-gold btn-sm" onClick={() => setViewDoc(d)}>👁 View</button>
                      {d.pdf_url && <a href={d.pdf_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">⬇ Download</a>}
                    </div>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewDoc && (
        <div className="modal-overlay">
          <div className="modal modal-xl">
            <div className="modal-header">
              <div>
                <div className="modal-title">{viewDoc.contract_templates?.name}</div>
                <p style={{fontSize:13,color:"var(--ink-light)",marginTop:4}}>
                  {viewDoc.families?.name} — {viewDoc.member_name} | Signed {new Date(viewDoc.signed_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                {viewDoc.pdf_url && <a href={viewDoc.pdf_url} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm">⬇ Download</a>}
                <button className="btn btn-outline btn-sm" onClick={() => setViewDoc(null)}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              <SignedDocViewer assignmentId={viewDoc.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SETUP CHECK (shows instructions if not configured)
// ============================================================
function SetupCheck({ children }) {
  if (SUPABASE_URL === "https://YOUR_PROJECT.supabase.co") {
    return (
      <div className="page" style={{maxWidth:680, marginTop:60}}>
        <div className="card">
          <div className="card-body">
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,marginBottom:16}}>⚙️ Setup Required</h2>
            <div className="alert alert-warn">Configure your Supabase credentials to get started.</div>
            <p style={{marginBottom:16,lineHeight:1.7}}>Open the source file and update these two constants near the top:</p>
            <div style={{background:"#1a1a2e",color:"#c9a84c",padding:"16px",borderRadius:10,fontFamily:"monospace",fontSize:13,marginBottom:24}}>
              <div>const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";</div>
              <div>const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";</div>
            </div>
            <p style={{fontWeight:600,marginBottom:12}}>Run this SQL in your Supabase SQL Editor:</p>
            <pre style={{background:"#1a1a2e",color:"#6ee7b7",padding:"16px",borderRadius:10,fontFamily:"monospace",fontSize:12,overflowX:"auto",whiteSpace:"pre-wrap"}}>{`create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  link_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz default now()
);

create table contract_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
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
            <p style={{marginTop:16,fontSize:13,color:"var(--ink-light)"}}>Also create a Storage bucket called <strong>signed-pdfs</strong> (set to public) in your Supabase project.</p>
          </div>
        </div>
      </div>
    );
  }
  return children;
}

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [tab, setTab] = useState("families");
  const params = new URLSearchParams(window.location.search);
  const familyToken = params.get("family");

  if (familyToken) {
    return <div className="app"><style>{styles}</style><FamilyPortal token={familyToken} /></div>;
  }

  return (
    <div className="app">
      <style>{styles}</style>
      <nav className="nav">
        <div className="nav-logo">Casting<span>Docs</span></div>
        <div className="nav-tabs">
          {[
            { id:"families", label:"👨‍👩‍👧‍👦 Families" },
            { id:"templates", label:"📋 Templates" },
            { id:"documents", label:"📄 Signed Docs" },
          ].map(t => (
            <button key={t.id} className={`nav-tab ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </nav>
      <SetupCheck>
        <div className="page">
          {tab === "families" && <FamiliesTab />}
          {tab === "templates" && <TemplatesTab />}
          {tab === "documents" && <DocumentsTab />}
        </div>
      </SetupCheck>
    </div>
  );
}
