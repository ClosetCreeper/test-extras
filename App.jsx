// EXTRAS CASTING MANAGEMENT SYSTEM
//
// Dependencies needed (add to package.json):
//   "pdfjs-dist": "^3.11.174",
//   "pdf-lib": "^1.17.1",
//
// SUPABASE SQL SCHEMA:
// -----------------------------------------------------------
// create table families (
//   id uuid primary key default gen_random_uuid(),
//   name text not null,
//   link_token text unique not null default encode(gen_random_bytes(16),'hex'),
//   created_at timestamptz default now()
// );
// create table contract_templates (
//   id uuid primary key default gen_random_uuid(),
//   name text not null,
//   description text,
//   pdf_url text,
//   pdf_width float, pdf_height float,
//   fields jsonb not null default '[]',
//   created_at timestamptz default now()
// );
// create table assignments (
//   id uuid primary key default gen_random_uuid(),
//   family_id uuid references families(id) on delete cascade,
//   member_name text not null,
//   template_id uuid references contract_templates(id) on delete cascade,
//   status text default 'pending',
//   signed_data jsonb,
//   signed_at timestamptz,
//   pdf_url text,
//   created_at timestamptz default now()
// );
// -----------------------------------------------------------
// Supabase Storage buckets needed (both public):
//   "template-pdfs"   — for uploaded blank PDFs
//   "signed-pdfs"     — for completed signed PDFs

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Point pdfjs worker at CDN
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ── CONFIG ──────────────────────────────────────────────────
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── FIELD TYPE DEFINITIONS ──────────────────────────────────
const FIELD_TYPES = [
  { type: "text",      label: "Text",       icon: "📝", w: 200, h: 32 },
  { type: "full_name", label: "Full Name",  icon: "👤", w: 220, h: 32 },
  { type: "date",      label: "Date",       icon: "📅", w: 140, h: 32 },
  { type: "email",     label: "Email",      icon: "✉️",  w: 200, h: 32 },
  { type: "phone",     label: "Phone",      icon: "📞", w: 160, h: 32 },
  { type: "signature", label: "Signature",  icon: "✍️",  w: 260, h: 80 },
  { type: "initials",  label: "Initials",   icon: "🖊️", w: 100, h: 60 },
  { type: "checkbox",  label: "Checkbox",   icon: "☑️",  w: 24,  h: 24 },
];

// ── STYLES ───────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ink:#1a1a2e;--ink2:#4a4a6a;--cream:#faf8f4;--gold:#c9a84c;
  --gold-l:#f0e6c8;--gold-d:#9e7e30;--sage:#6b8f71;--rose:#c97070;
  --white:#fff;--border:#e8e0d0;
  --sh:0 4px 24px rgba(26,26,46,.08);--sh2:0 12px 48px rgba(26,26,46,.15);
  --r:12px;--rl:20px;
}
body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--ink);min-height:100vh}

/* NAV */
.nav{background:var(--ink);padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:60px;position:sticky;top:0;z-index:200;box-shadow:0 2px 20px rgba(0,0,0,.3)}
.nav-logo{font-family:'Playfair Display',serif;font-size:21px;color:var(--gold)}
.nav-logo span{color:#fff}
.nav-tabs{display:flex;gap:4px}
.nav-tab{padding:7px 16px;border-radius:8px;background:transparent;border:none;color:rgba(255,255,255,.6);font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s}
.nav-tab:hover{background:rgba(255,255,255,.08);color:#fff}
.nav-tab.active{background:var(--gold);color:var(--ink);font-weight:600}

/* PAGE */
.page{max-width:1100px;margin:0 auto;padding:36px 24px}
.page-title{font-family:'Playfair Display',serif;font-size:30px;margin-bottom:6px}
.page-sub{color:var(--ink2);font-size:15px;margin-bottom:28px}

/* CARD */
.card{background:var(--white);border-radius:var(--rl);border:1px solid var(--border);box-shadow:var(--sh);overflow:hidden}
.card-body{padding:24px}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;text-decoration:none;white-space:nowrap}
.btn-primary{background:var(--ink);color:#fff}
.btn-primary:hover{background:#2d2d5e;transform:translateY(-1px);box-shadow:0 4px 12px rgba(26,26,46,.3)}
.btn-gold{background:var(--gold);color:var(--ink)}
.btn-gold:hover{background:var(--gold-d);transform:translateY(-1px)}
.btn-outline{background:transparent;border:1.5px solid var(--border);color:var(--ink)}
.btn-outline:hover{border-color:var(--gold);color:var(--gold-d)}
.btn-danger{background:var(--rose);color:#fff}
.btn-danger:hover{background:#b05555}
.btn-sm{padding:5px 13px;font-size:13px}
.btn-lg{padding:13px 26px;font-size:15px}
.btn:disabled{opacity:.45;cursor:not-allowed;transform:none!important}

/* FORM */
.form-group{margin-bottom:18px}
.form-label{display:block;font-size:12px;font-weight:600;color:var(--ink2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px}
.form-input,.form-select,.form-textarea{width:100%;padding:9px 13px;border:1.5px solid var(--border);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--ink);background:var(--cream);transition:border-color .2s;outline:none}
.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--gold);background:#fff}
.form-textarea{resize:vertical;min-height:72px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}

/* TABLE */
.table{width:100%;border-collapse:collapse}
.table th{padding:11px 15px;text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--ink2);border-bottom:2px solid var(--border)}
.table td{padding:13px 15px;border-bottom:1px solid var(--border);font-size:14px}
.table tr:last-child td{border-bottom:none}
.table tr:hover td{background:var(--cream)}

/* BADGE */
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 11px;border-radius:20px;font-size:12px;font-weight:600}
.badge-pending{background:#fff3cd;color:#856404}
.badge-completed{background:#d1fae5;color:#065f46}
.badge-gold{background:var(--gold-l);color:var(--gold-d)}

/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(26,26,46,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
.modal{background:#fff;border-radius:var(--rl);width:100%;max-width:700px;max-height:92vh;overflow-y:auto;box-shadow:var(--sh2);animation:slideUp .25s ease}
.modal-lg{max-width:900px}
.modal-xl{max-width:1100px}
.modal-hd{padding:22px 26px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#fff;z-index:2}
.modal-title{font-family:'Playfair Display',serif;font-size:21px}
.modal-body{padding:26px}
.modal-ft{padding:18px 26px;border-top:1px solid var(--border);display:flex;gap:10px;justify-content:flex-end}
@keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}

/* ALERTS */
.alert{padding:13px 17px;border-radius:var(--r);font-size:14px;margin-bottom:16px}
.alert-info{background:#dbeafe;color:#1e40af;border:1px solid #93c5fd}
.alert-warn{background:#fef3c7;color:#92400e;border:1px solid #fcd34d}
.alert-success{background:#d1fae5;color:#065f46;border:1px solid #6ee7b7}

/* UTIL */
.divider{border:none;border-top:1px solid var(--border);margin:20px 0}
.text-muted{color:var(--ink2);font-size:14px}
.empty-state{text-align:center;padding:48px;color:var(--ink2)}
.empty-state .icon{font-size:46px;margin-bottom:12px}
.flex{display:flex}
.flex-between{display:flex;align-items:center;justify-content:space-between}
.flex-center{display:flex;align-items:center;justify-content:center}
.gap-2{gap:8px} .gap-3{gap:12px}
.mb-4{margin-bottom:16px} .mb-6{margin-bottom:24px}
.mt-4{margin-top:16px}
.tag{display:inline-block;padding:3px 10px;background:var(--gold-l);color:var(--gold-d);border-radius:20px;font-size:12px;font-weight:600}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.spin{display:inline-block;width:18px;height:18px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spinA .7s linear infinite}
@keyframes spinA{to{transform:rotate(360deg)}}

/* PROGRESS */
.prog-wrap{background:var(--border);border-radius:100px;height:7px;overflow:hidden;margin:14px 0}
.prog-bar{height:100%;background:linear-gradient(90deg,var(--gold),var(--sage));border-radius:100px;transition:width .5s ease}

/* PORTAL */
.portal-hero{background:var(--ink);padding:44px 24px;text-align:center;color:#fff}
.portal-title{font-family:'Playfair Display',serif;font-size:34px;color:var(--gold);margin-bottom:6px}
.portal-sub{color:rgba(255,255,255,.65);font-size:15px}
.task-card{background:#fff;border:1.5px solid var(--border);border-radius:var(--r);padding:18px;display:flex;align-items:center;justify-content:space-between;transition:all .2s}
.task-card:hover{border-color:var(--gold);box-shadow:var(--sh)}
.task-card.done{border-color:#6ee7b7;background:#f0fdf4}
.success-screen{text-align:center;padding:56px 24px}
.success-icon{width:76px;height:76px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:34px}

/* PDF BUILDER */
.builder-layout{display:grid;grid-template-columns:220px 1fr;gap:0;height:calc(100vh - 60px);overflow:hidden}
.builder-sidebar{background:var(--ink);padding:20px 16px;overflow-y:auto;display:flex;flex-direction:column;gap:6px}
.builder-sidebar-title{color:rgba(255,255,255,.45);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;margin-top:8px}
.field-chip{background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;color:#fff;font-size:13px;font-weight:500;cursor:grab;display:flex;align-items:center;gap:8px;transition:all .2s;user-select:none}
.field-chip:hover{background:rgba(201,168,76,.2);border-color:var(--gold)}
.field-chip:active{cursor:grabbing}
.builder-main{overflow:auto;background:#e5e7eb;display:flex;justify-content:center;padding:28px}
.pdf-canvas-wrap{position:relative;display:inline-block;box-shadow:0 8px 40px rgba(0,0,0,.25)}
.pdf-canvas{display:block}
.field-overlay{position:absolute;cursor:move;user-select:none}
.field-overlay.selected .field-inner{outline:2.5px solid var(--gold)!important;outline-offset:1px}
.field-inner{width:100%;height:100%;display:flex;align-items:center;background:rgba(201,168,76,.18);border:1.5px solid rgba(201,168,76,.6);border-radius:4px;font-size:12px;color:var(--gold-d);font-weight:600;padding:0 6px;pointer-events:none;white-space:nowrap;overflow:hidden}
.sig-field-inner{background:rgba(201,168,76,.1);border:2px dashed rgba(201,168,76,.7);justify-content:center}
.check-field-inner{border-radius:3px;justify-content:center;font-size:14px}
.resize-handle{position:absolute;bottom:-4px;right:-4px;width:12px;height:12px;background:var(--gold);border-radius:2px;cursor:se-resize}

/* SIGNATURE PAD */
.sig-wrap{border:2px dashed var(--border);border-radius:var(--r);background:var(--cream);position:relative;overflow:hidden}
.sig-wrap:hover{border-color:var(--gold)}
.sig-canvas{display:block;width:100%;cursor:crosshair;touch-action:none}
.sig-label{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);font-size:11px;color:var(--ink2);pointer-events:none;white-space:nowrap}
.sig-clear{position:absolute;top:7px;right:7px;background:#fff;border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif}
.sig-clear:hover{border-color:var(--rose);color:var(--rose)}

/* PDF VIEWER (family portal signing) */
.pdf-viewer-wrap{position:relative;display:inline-block}
.pdf-viewer-canvas{display:block}
.sign-field-overlay{position:absolute;cursor:pointer}
.sign-field-box{width:100%;height:100%;border:2px dashed rgba(201,168,76,.8);border-radius:4px;background:rgba(201,168,76,.12);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--gold-d);font-weight:600;transition:all .2s}
.sign-field-box.filled{border-color:#6ee7b7;background:rgba(110,231,183,.15);color:#065f46}
.sign-field-box:hover{background:rgba(201,168,76,.2)}
.sign-field-sig{width:100%;height:100%;object-fit:contain;padding:2px}

/* MEMBER ROW */
.member-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}
.member-row:last-child{border-bottom:none}
.member-input{flex:1;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;background:var(--cream);outline:none}
.member-input:focus{border-color:var(--gold)}

@media(max-width:768px){
  .grid-2{grid-template-columns:1fr}
  .form-row{grid-template-columns:1fr}
  .nav-tabs{display:none}
  .page{padding:20px 14px}
  .builder-layout{grid-template-columns:1fr;height:auto}
}
`;

// ════════════════════════════════════════════════════════════
// SIGNATURE PAD
// ════════════════════════════════════════════════════════════
function SigPad({ width = "100%", height = 130, onChange, value }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = c.offsetWidth;
    c.height = height;
    const ctx = c.getContext("2d");
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
  }, [height]);

  const pos = (e, c) => {
    const r = c.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const start = (e) => {
    drawing.current = true;
    const p = pos(e, ref.current);
    last.current = p;
    const ctx = ref.current.getContext("2d");
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const c = ref.current;
    const ctx = c.getContext("2d");
    const p = pos(e, c);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const stop = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange && onChange(ref.current.toDataURL());
  };
  const clear = () => {
    const c = ref.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    onChange && onChange(null);
  };

  return (
    <div className="sig-wrap" style={{ width }}>
      <canvas
        ref={ref}
        className="sig-canvas"
        style={{ height }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={stop}
      />
      <span className="sig-label">Sign here</span>
      <button className="sig-clear" type="button" onClick={clear}>Clear</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// RENDER PDF PAGE → CANVAS
// ════════════════════════════════════════════════════════════
async function renderPage(url, pageNum, scale = 1.5) {
  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNum);
  const vp = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = vp.width;
  canvas.height = vp.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
  return { canvas, width: vp.width, height: vp.height };
}

// ════════════════════════════════════════════════════════════
// PDF TEMPLATE BUILDER
// ════════════════════════════════════════════════════════════
function TemplateBuilder({ template, onSave, onCancel }) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [pdfUrl, setPdfUrl] = useState(template?.pdf_url || null);
  const [pdfDims, setPdfDims] = useState({ w: template?.pdf_width || 0, h: template?.pdf_height || 0 });
  const [fields, setFields] = useState(template?.fields || []);
  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging] = useState(null); // { type:'new'|'move', fieldType?, id?, offX, offY }
  const [resizing, setResizing] = useState(null);
  const [scale] = useState(1.5);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  // Render PDF when URL changes
  useEffect(() => {
    if (!pdfUrl) return;
    renderPage(pdfUrl, 1, scale).then(({ canvas, width, height }) => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = width;
      c.height = height;
      c.getContext("2d").drawImage(canvas, 0, 0);
      setPdfDims({ w: width, h: height });
    });
  }, [pdfUrl, scale]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fname = `template_${Date.now()}.pdf`;
    const { error } = await supabase.storage.from("template-pdfs").upload(fname, file, { contentType: "application/pdf", upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("template-pdfs").getPublicUrl(fname);
      setPdfUrl(publicUrl);
    }
    setUploading(false);
  };

  // ── Drag new field from sidebar ──
  const onSidebarDragStart = (e, fieldType) => {
    e.dataTransfer.setData("fieldType", fieldType);
  };

  const onCanvasDrop = (e) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData("fieldType");
    if (!fieldType) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const def = FIELD_TYPES.find(f => f.type === fieldType);
    const x = e.clientX - rect.left - def.w / 2;
    const y = e.clientY - rect.top - def.h / 2;
    const id = `f_${Date.now()}`;
    setFields(prev => [...prev, {
      id, type: fieldType, label: def.label,
      x: Math.max(0, x), y: Math.max(0, y),
      w: def.w, h: def.h, required: true,
    }]);
    setSelectedId(id);
  };

  // ── Move existing field ──
  const onFieldMouseDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(id);
    const f = fields.find(f => f.id === id);
    const rect = wrapRef.current.getBoundingClientRect();
    setDragging({ type: "move", id, offX: e.clientX - rect.left - f.x, offY: e.clientY - rect.top - f.y });
  };

  const onResizeMouseDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const f = fields.find(f => f.id === id);
    setResizing({ id, startX: e.clientX, startY: e.clientY, startW: f.w, startH: f.h });
  };

  const onMouseMove = useCallback((e) => {
    if (dragging?.type === "move") {
      const rect = wrapRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left - dragging.offX, pdfDims.w - 20));
      const y = Math.max(0, Math.min(e.clientY - rect.top - dragging.offY, pdfDims.h - 20));
      setFields(prev => prev.map(f => f.id === dragging.id ? { ...f, x, y } : f));
    }
    if (resizing) {
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;
      setFields(prev => prev.map(f => f.id === resizing.id
        ? { ...f, w: Math.max(40, resizing.startW + dx), h: Math.max(20, resizing.startH + dy) } : f));
    }
  }, [dragging, resizing, pdfDims]);

  const onMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
  }, []);

  const deleteField = (id) => {
    setFields(prev => prev.filter(f => f.id !== id));
    setSelectedId(null);
  };

  const saveTemplate = async () => {
    if (!name.trim()) { alert("Please enter a template name"); return; }
    setSaving(true);
    const payload = {
      name: name.trim(), description,
      pdf_url: pdfUrl, pdf_width: pdfDims.w, pdf_height: pdfDims.h,
      fields,
    };
    if (template?.id) {
      await supabase.from("contract_templates").update(payload).eq("id", template.id);
    } else {
      await supabase.from("contract_templates").insert(payload);
    }
    setSaving(false);
    onSave();
  };

  const selected = fields.find(f => f.id === selectedId);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
      {/* Top toolbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <button className="btn btn-outline btn-sm" onClick={onCancel}>← Back</button>
        <input
          className="form-input"
          style={{ width: 240 }}
          placeholder="Template name…"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="form-input"
          style={{ width: 280 }}
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
          {uploading ? "Uploading…" : "📎 Upload PDF"}
          <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleUpload} />
        </label>
        <div style={{ flex: 1 }} />
        {selected && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink2)" }}>
            <span>Selected: <strong>{selected.label}</strong></span>
            <input
              className="form-input"
              style={{ width: 160 }}
              placeholder="Custom label"
              value={selected.label}
              onChange={e => setFields(prev => prev.map(f => f.id === selected.id ? { ...f, label: e.target.value } : f))}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
              <input type="checkbox" checked={!!selected.required}
                onChange={e => setFields(prev => prev.map(f => f.id === selected.id ? { ...f, required: e.target.checked } : f))} />
              Required
            </label>
            <button className="btn btn-danger btn-sm" onClick={() => deleteField(selected.id)}>🗑 Delete</button>
          </div>
        )}
        <button className="btn btn-primary" onClick={saveTemplate} disabled={saving}>
          {saving ? <><span className="spin" /> Saving…</> : "💾 Save Template"}
        </button>
      </div>

      {/* Builder body */}
      <div className="builder-layout" style={{ flex: 1 }}>
        {/* Sidebar */}
        <div className="builder-sidebar">
          <div className="builder-sidebar-title">Fields</div>
          <p style={{ color: "rgba(255,255,255,.4)", fontSize: 12, marginBottom: 12 }}>Drag onto the document</p>
          {FIELD_TYPES.map(ft => (
            <div
              key={ft.type}
              className="field-chip"
              draggable
              onDragStart={e => onSidebarDragStart(e, ft.type)}
            >
              <span>{ft.icon}</span>
              <span>{ft.label}</span>
            </div>
          ))}
          <div className="builder-sidebar-title" style={{ marginTop: 20 }}>Placed Fields</div>
          {fields.length === 0
            ? <p style={{ color: "rgba(255,255,255,.3)", fontSize: 12 }}>None yet</p>
            : fields.map(f => (
              <div key={f.id}
                className="field-chip"
                style={{ cursor: "pointer", ...(selectedId === f.id ? { borderColor: "var(--gold)", background: "rgba(201,168,76,.2)" } : {}) }}
                onClick={() => setSelectedId(f.id)}
              >
                <span>{FIELD_TYPES.find(t => t.type === f.type)?.icon}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{f.label}</span>
                <button
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 13, padding: "0 2px" }}
                  onClick={e => { e.stopPropagation(); deleteField(f.id); }}
                >✕</button>
              </div>
            ))
          }
        </div>

        {/* PDF Canvas area */}
        <div
          className="builder-main"
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onClick={() => setSelectedId(null)}
        >
          {!pdfUrl ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, color: "#9ca3af", minWidth: 400 }}>
              <span style={{ fontSize: 56 }}>📄</span>
              <p style={{ fontSize: 16 }}>Upload a PDF to get started</p>
              <label className="btn btn-primary" style={{ cursor: "pointer" }}>
                📎 Upload PDF
                <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleUpload} />
              </label>
            </div>
          ) : (
            <div
              ref={wrapRef}
              className="pdf-canvas-wrap"
              style={{ width: pdfDims.w, height: pdfDims.h, minWidth: pdfDims.w }}
              onDragOver={e => e.preventDefault()}
              onDrop={onCanvasDrop}
            >
              <canvas ref={canvasRef} className="pdf-canvas" />
              {fields.map(f => (
                <div
                  key={f.id}
                  className={`field-overlay ${selectedId === f.id ? "selected" : ""}`}
                  style={{ left: f.x, top: f.y, width: f.w, height: f.h }}
                  onMouseDown={e => onFieldMouseDown(e, f.id)}
                >
                  <div className={`field-inner ${f.type === "signature" || f.type === "initials" ? "sig-field-inner" : ""} ${f.type === "checkbox" ? "check-field-inner" : ""}`}>
                    {f.type === "signature" ? `✍️ ${f.label}` : f.type === "initials" ? "🖊️" : f.type === "checkbox" ? "☑" : f.label}
                  </div>
                  {selectedId === f.id && (
                    <div className="resize-handle" onMouseDown={e => onResizeMouseDown(e, f.id)} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// GENERATE FINAL SIGNED PDF using pdf-lib
// ════════════════════════════════════════════════════════════
async function generateSignedPdf(templatePdfUrl, fields, formData, pdfDims, scale) {
  // Fetch original PDF bytes
  const existingPdfBytes = await fetch(templatePdfUrl).then(r => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { width: pWidth, height: pHeight } = page.getSize();

  // Scale factor: the canvas was rendered at `scale`, PDF coords are in points
  // canvas px → PDF points
  const sx = pWidth / (pdfDims.w / scale);
  const sy = pHeight / (pdfDims.h / scale);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const field of fields) {
    const val = formData[field.id];
    if (!val) continue;

    // Convert canvas coords to PDF coords
    // PDF y is from bottom; canvas y is from top
    const pdfX = (field.x / scale) * sx;
    const pdfY = pHeight - ((field.y / scale) * sy) - (field.h / scale) * sy;
    const fW = (field.w / scale) * sx;
    const fH = (field.h / scale) * sy;

    if (field.type === "signature" || field.type === "initials") {
      if (typeof val === "string" && val.startsWith("data:image")) {
        const imgBytes = await fetch(val).then(r => r.arrayBuffer());
        const img = await pdfDoc.embedPng(imgBytes);
        page.drawImage(img, { x: pdfX, y: pdfY, width: fW, height: fH });
      }
    } else if (field.type === "checkbox") {
      if (val) {
        page.drawText("✓", { x: pdfX + 2, y: pdfY + 4, size: Math.min(fH - 4, 14), font, color: rgb(0.1, 0.1, 0.1) });
      }
    } else {
      const textVal = typeof val === "string" ? val : String(val);
      const fontSize = Math.min(12, fH * 0.6);
      // Draw a light underline
      page.drawLine({
        start: { x: pdfX, y: pdfY },
        end: { x: pdfX + fW, y: pdfY },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      page.drawText(textVal, {
        x: pdfX + 2,
        y: pdfY + 4,
        size: fontSize,
        font,
        color: rgb(0.05, 0.05, 0.05),
        maxWidth: fW - 4,
      });
    }
  }

  return await pdfDoc.save();
}

// ════════════════════════════════════════════════════════════
// FAMILY PORTAL — PDF VIEWER + IN-PLACE SIGNING
// ════════════════════════════════════════════════════════════
function PdfSigningView({ template, onSubmit, onCancel }) {
  const SCALE = 1.5;
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [activeField, setActiveField] = useState(null); // field being signed/filled
  const [canvasDims, setCanvasDims] = useState({ w: 0, h: 0 });
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!template?.pdf_url) return;
    renderPage(template.pdf_url, 1, SCALE).then(({ canvas, width, height }) => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = width;
      c.height = height;
      c.getContext("2d").drawImage(canvas, 0, 0);
      setCanvasDims({ w: width, h: height });
    });
  }, [template]);

  const set = (id, val) => {
    setFormData(p => ({ ...p, [id]: val }));
    setActiveField(null);
    setErrors(p => ({ ...p, [id]: null }));
  };

  const validate = () => {
    const errs = {};
    for (const f of template.fields) {
      if (f.required && !formData[f.id]) errs[f.id] = true;
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      alert("Please fill in all required fields (highlighted in red).");
      return;
    }
    setSubmitting(true);
    const pdfBytes = await generateSignedPdf(template.pdf_url, template.fields, formData, { w: canvasDims.w, h: canvasDims.h }, SCALE);
    await onSubmit(formData, pdfBytes);
    setSubmitting(false);
  };

  const isFilled = (f) => !!formData[f.id];

  return (
    <div>
      <div className="alert alert-info">
        Click on each highlighted field on the document to fill it in. Required fields are marked.
      </div>
      <div style={{ overflow: "auto", background: "#e5e7eb", padding: 20, borderRadius: 12, marginBottom: 20 }}>
        <div className="pdf-viewer-wrap" style={{ width: canvasDims.w, margin: "0 auto", position: "relative" }}>
          <canvas ref={canvasRef} className="pdf-viewer-canvas" />
          {template.fields.map(f => (
            <div
              key={f.id}
              className="sign-field-overlay"
              style={{ left: f.x, top: f.y, width: f.w, height: f.h }}
              onClick={() => setActiveField(f)}
            >
              {(f.type === "signature" || f.type === "initials") && isFilled(f) ? (
                <img src={formData[f.id]} className="sign-field-sig" alt="signature" />
              ) : (
                <div
                  className={`sign-field-box ${isFilled(f) ? "filled" : ""}`}
                  style={errors[f.id] ? { borderColor: "#c97070", background: "rgba(201,112,112,.15)" } : {}}
                >
                  {isFilled(f)
                    ? (f.type === "checkbox" ? "✓" : formData[f.id])
                    : `${FIELD_TYPES.find(t => t.type === f.type)?.icon} ${f.label}${f.required ? " *" : ""}`
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <><span className="spin" /> Generating PDF…</> : "✍️ Sign & Submit"}
        </button>
      </div>

      {/* Field input modal */}
      {activeField && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-hd">
              <h2 className="modal-title">
                {FIELD_TYPES.find(t => t.type === activeField.type)?.icon} {activeField.label}
              </h2>
              <button className="btn btn-outline btn-sm" onClick={() => setActiveField(null)}>✕</button>
            </div>
            <div className="modal-body">
              <FieldInput field={activeField} current={formData[activeField.id]} onDone={val => set(activeField.id, val)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// FIELD INPUT (used inside the signing modal)
// ════════════════════════════════════════════════════════════
function FieldInput({ field, current, onDone }) {
  const [val, setVal] = useState(current || (field.type === "checkbox" ? false : ""));

  const submit = () => {
    if (field.required && !val && val !== true) {
      alert("This field is required.");
      return;
    }
    onDone(val || null);
  };

  return (
    <div>
      {field.type === "signature" || field.type === "initials" ? (
        <>
          <p className="text-muted" style={{ marginBottom: 12 }}>Draw your {field.type === "initials" ? "initials" : "signature"} below:</p>
          <SigPad
            height={field.type === "initials" ? 90 : 140}
            value={val}
            onChange={setVal}
          />
        </>
      ) : field.type === "checkbox" ? (
        <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontSize: 15 }}>
          <input type="checkbox" checked={!!val} onChange={e => setVal(e.target.checked)} style={{ width: 20, height: 20 }} />
          <span>Check to confirm</span>
        </label>
      ) : (
        <>
          <label className="form-label">{field.label}{field.required && " *"}</label>
          <input
            autoFocus
            className="form-input"
            type={field.type === "date" ? "date" : field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
        </>
      )}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button className="btn btn-outline" onClick={() => onDone(null)}>Skip</button>
        <button className="btn btn-primary" onClick={submit}>Done ✓</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// FAMILY PORTAL
// ════════════════════════════════════════════════════════════
function FamilyPortal({ token }) {
  const [family, setFamily] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDoc, setActiveDoc] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: fam, error: fe } = await supabase.from("families").select("*").eq("link_token", token).single();
    if (fe || !fam) { setError("Family not found. Please check your link."); setLoading(false); return; }
    setFamily(fam);
    const { data: assigns } = await supabase.from("assignments").select("*").eq("family_id", fam.id).order("created_at");
    setAssignments(assigns || []);
    const ids = [...new Set((assigns || []).map(a => a.template_id))];
    const { data: tpls } = await supabase.from("contract_templates").select("*").in("id", ids.length ? ids : ["none"]);
    const map = {}; (tpls || []).forEach(t => map[t.id] = t);
    setTemplates(map);
    setLoading(false);
  };

  const handleSign = async (assignment, formData, pdfBytes) => {
    const now = new Date().toISOString();
    const filename = `signed_${assignment.id}_${Date.now()}.pdf`;
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    await supabase.storage.from("signed-pdfs").upload(filename, blob, { contentType: "application/pdf", upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("signed-pdfs").getPublicUrl(filename);
    await supabase.from("assignments").update({
      status: "completed", signed_data: formData, signed_at: now, pdf_url: publicUrl,
    }).eq("id", assignment.id);
    setActiveDoc(null);
    load();
  };

  if (loading) return (
    <div className="flex-center" style={{ height: "100vh", flexDirection: "column", gap: 14 }}>
      <div style={{ width: 38, height: 38, border: "3px solid var(--gold)", borderTopColor: "transparent", borderRadius: "50%", animation: "spinA .8s linear infinite" }} />
      <p style={{ color: "var(--ink2)" }}>Loading your documents…</p>
    </div>
  );
  if (error) return (
    <div className="flex-center" style={{ height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 46, marginBottom: 14 }}>❌</div>
        <p style={{ color: "var(--rose)", fontSize: 17 }}>{error}</p>
      </div>
    </div>
  );

  const completed = assignments.filter(a => a.status === "completed").length;
  const total = assignments.length;
  const allDone = total > 0 && completed === total;

  return (
    <div>
      <div className="portal-hero">
        <div className="portal-title">Welcome, {family.name} Family</div>
        <div className="portal-sub">Please complete all required documents below</div>
      </div>
      <div className="page" style={{ maxWidth: 720 }}>
        {allDone ? (
          <div className="success-screen">
            <div className="success-icon">✅</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, marginBottom: 10 }}>All Done!</h2>
            <p style={{ color: "var(--ink2)", fontSize: 15 }}>All documents have been signed and submitted. Thank you!</p>
          </div>
        ) : (
          <>
            <div className="card mb-6">
              <div className="card-body">
                <div className="flex-between mb-4">
                  <span style={{ fontWeight: 600 }}>Progress</span>
                  <span className="badge badge-gold">{completed}/{total} complete</span>
                </div>
                <div className="prog-wrap"><div className="prog-bar" style={{ width: `${total ? (completed / total) * 100 : 0}%` }} /></div>
                <p className="text-muted" style={{ fontSize: 13 }}>{total - completed} document{total - completed !== 1 ? "s" : ""} remaining</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {assignments.map(a => {
                const tpl = templates[a.template_id];
                const done = a.status === "completed";
                return (
                  <div key={a.id} className={`task-card ${done ? "done" : ""}`}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{tpl?.name || "…"}</h3>
                      <p style={{ fontSize: 13, color: "var(--ink2)" }}>For: <strong>{a.member_name}</strong></p>
                      {done && <p style={{ color: "var(--sage)", fontSize: 12, marginTop: 4 }}>✓ Signed {a.signed_at ? new Date(a.signed_at).toLocaleDateString() : ""}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {done ? (
                        <>
                          <span style={{ fontSize: 26 }}>✅</span>
                          {a.pdf_url && (
                            <a href={a.pdf_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">⬇ Download</a>
                          )}
                        </>
                      ) : (
                        <button className="btn btn-primary" onClick={() => setActiveDoc(a)}>✍️ Sign Now</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {activeDoc && templates[activeDoc.template_id] && (
        <div className="overlay">
          <div className="modal modal-xl">
            <div className="modal-hd">
              <div>
                <div className="modal-title">{templates[activeDoc.template_id].name}</div>
                <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 4 }}>For: {activeDoc.member_name}</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setActiveDoc(null)}>✕ Close</button>
            </div>
            <div className="modal-body">
              <PdfSigningView
                template={templates[activeDoc.template_id]}
                onSubmit={(data, pdfBytes) => handleSign(activeDoc, data, pdfBytes)}
                onCancel={() => setActiveDoc(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ADMIN: TEMPLATES TAB
// ════════════════════════════════════════════════════════════
function TemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | template object

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("contract_templates").select("*").order("created_at", { ascending: false });
    setTemplates(data || []);
    setLoading(false);
  };

  const del = async (id) => {
    if (!confirm("Delete this template?")) return;
    await supabase.from("contract_templates").delete().eq("id", id);
    load();
  };

  if (editing !== null) {
    return (
      <TemplateBuilder
        template={editing === "new" ? null : editing}
        onSave={() => { setEditing(null); load(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Loading…</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 className="page-title">Contract Templates</h1>
          <p className="page-sub">Upload PDFs and place fields for families to sign</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>+ New Template</button>
      </div>

      {templates.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><p>No templates yet.</p></div>
      ) : (
        <div className="grid-2">
          {templates.map(t => (
            <div key={t.id} className="card">
              <div className="card-body">
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, marginBottom: 6 }}>{t.name}</h3>
                {t.description && <p className="text-muted" style={{ marginBottom: 10 }}>{t.description}</p>}
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
                  {(t.fields || []).map(f => (
                    <span key={f.id} className="tag">{FIELD_TYPES.find(ft => ft.type === f.type)?.icon} {f.label}</span>
                  ))}
                  {!t.pdf_url && <span style={{ color: "var(--rose)", fontSize: 13 }}>⚠️ No PDF uploaded</span>}
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-gold btn-sm" onClick={() => setEditing(t)}>✏️ Edit</button>
                  {t.pdf_url && <a href={t.pdf_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">👁 View PDF</a>}
                  <button className="btn btn-danger btn-sm" onClick={() => del(t.id)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ADMIN: FAMILIES TAB
// ════════════════════════════════════════════════════════════
function FamiliesTab() {
  const [families, setFamilies] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [allAssigns, setAllAssigns] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [members, setMembers] = useState([{ name: "", templateId: "" }]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: fams }, { data: tpls }] = await Promise.all([
      supabase.from("families").select("*").order("created_at", { ascending: false }),
      supabase.from("contract_templates").select("id,name").order("name"),
    ]);
    setFamilies(fams || []);
    setTemplates(tpls || []);
    if (fams?.length) {
      const { data: a } = await supabase.from("assignments").select("*").in("family_id", fams.map(f => f.id));
      const m = {};
      (a || []).forEach(x => { if (!m[x.family_id]) m[x.family_id] = []; m[x.family_id].push(x); });
      setAllAssigns(m);
    }
    setLoading(false);
  };

  const createFamily = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await supabase.from("families").insert({ name: newName.trim() });
    setNewName(""); setShowCreate(false); setCreating(false);
    load();
  };

  const deleteFamily = async (id) => {
    if (!confirm("Delete this family and all their assignments?")) return;
    await supabase.from("families").delete().eq("id", id);
    load();
  };

  const openAssign = async (fam) => {
    const { data: ex } = await supabase.from("assignments").select("*").eq("family_id", fam.id);
    setMembers(ex?.length ? ex.map(a => ({ id: a.id, name: a.member_name, templateId: a.template_id, status: a.status })) : [{ name: "", templateId: "" }]);
    setShowAssign(fam);
  };

  const saveAssignments = async () => {
    setSaving(true);
    await supabase.from("assignments").delete().eq("family_id", showAssign.id).eq("status", "pending");
    const rows = members.filter(m => m.name.trim() && m.templateId && m.status !== "completed").map(m => ({
      family_id: showAssign.id, member_name: m.name.trim(), template_id: m.templateId,
    }));
    if (rows.length) await supabase.from("assignments").insert(rows);
    setSaving(false); setShowAssign(null); load();
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}${window.location.pathname}?family=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token); setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Loading…</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 className="page-title">Families</h1>
          <p className="page-sub">Manage groups and assign documents to members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Family</button>
      </div>

      {families.length === 0 ? (
        <div className="empty-state"><div className="icon">👨‍👩‍👧‍👦</div><p>No families yet.</p></div>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Family</th><th>Forms</th><th>Progress</th><th>Portal Link</th><th>Actions</th></tr></thead>
            <tbody>
              {families.map(f => {
                const a = allAssigns[f.id] || [];
                const done = a.filter(x => x.status === "completed").length;
                return (
                  <tr key={f.id}>
                    <td><strong>{f.name}</strong></td>
                    <td>{a.length || <span className="text-muted">—</span>}</td>
                    <td>{a.length > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="prog-wrap" style={{ margin: 0, width: 70 }}><div className="prog-bar" style={{ width: `${(done / a.length) * 100}%` }} /></div>
                        <span style={{ fontSize: 12 }}>{done}/{a.length}</span>
                      </div>
                    ) : <span className="text-muted">—</span>}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => copyLink(f.link_token)}>
                        {copied === f.link_token ? "✅ Copied!" : "📋 Copy Link"}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-gold btn-sm" onClick={() => openAssign(f)}>Manage</button>
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
        <div className="overlay">
          <div className="modal">
            <div className="modal-hd"><h2 className="modal-title">New Family</h2><button className="btn btn-outline btn-sm" onClick={() => setShowCreate(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Family Name</label>
                <input className="form-input" placeholder="e.g. Smith Family" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createFamily()} autoFocus />
              </div>
            </div>
            <div className="modal-ft">
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createFamily} disabled={creating || !newName.trim()}>{creating ? "Creating…" : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      {showAssign && (
        <div className="overlay">
          <div className="modal modal-lg">
            <div className="modal-hd"><h2 className="modal-title">Assign Docs — {showAssign.name}</h2><button className="btn btn-outline btn-sm" onClick={() => setShowAssign(null)}>✕</button></div>
            <div className="modal-body">
              <div className="alert alert-info">Add members and assign a form to each. Signed docs are locked.</div>
              {members.map((m, i) => (
                <div key={i} className="member-row">
                  <input className="member-input" placeholder="Name (e.g. Charlie)" value={m.name} disabled={m.status === "completed"}
                    onChange={e => setMembers(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <select className="form-select" style={{ flex: 1 }} value={m.templateId} disabled={m.status === "completed"}
                    onChange={e => setMembers(p => p.map((x, j) => j === i ? { ...x, templateId: e.target.value } : x))}>
                    <option value="">— Select Form —</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {m.status === "completed"
                    ? <span className="badge badge-completed">✓ Signed</span>
                    : <button className="btn btn-danger btn-sm" onClick={() => setMembers(p => p.filter((_, j) => j !== i))}>✕</button>}
                </div>
              ))}
              <button className="btn btn-outline mt-4" onClick={() => setMembers(p => [...p, { name: "", templateId: "" }])}>+ Add Person</button>
            </div>
            <div className="modal-ft">
              <button className="btn btn-outline" onClick={() => setShowAssign(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAssignments} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ADMIN: DOCUMENTS TAB
// ════════════════════════════════════════════════════════════
function DocumentsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: d } = await supabase
      .from("assignments")
      .select("*, families(name), contract_templates(name)")
      .order("created_at", { ascending: false });
    setData(d || []);
    setLoading(false);
  };

  const filtered = filter === "all" ? data : data.filter(d => d.status === filter);
  const signedCount = data.filter(d => d.status === "completed").length;

  if (loading) return <div className="empty-state"><div className="icon">⏳</div><p>Loading…</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 className="page-title">Signed Documents</h1>
          <p className="page-sub">{signedCount} signed PDF{signedCount !== 1 ? "s" : ""} ready to download</p>
        </div>
        <div className="flex gap-2">
          {["all", "completed", "pending"].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">📄</div><p>No documents found.</p></div>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Family</th><th>Member</th><th>Document</th><th>Status</th><th>Signed</th><th>PDF</th></tr></thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.families?.name}</strong></td>
                  <td>{d.member_name}</td>
                  <td>{d.contract_templates?.name}</td>
                  <td><span className={`badge ${d.status === "completed" ? "badge-completed" : "badge-pending"}`}>{d.status === "completed" ? "✓ Signed" : "⏳ Pending"}</span></td>
                  <td>{d.signed_at ? new Date(d.signed_at).toLocaleDateString() : "—"}</td>
                  <td>
                    {d.pdf_url ? (
                      <a href={d.pdf_url} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm">⬇ Download PDF</a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SETUP CHECK
// ════════════════════════════════════════════════════════════
function SetupCheck({ children }) {
  if (SUPABASE_URL === "https://YOUR_PROJECT.supabase.co") {
    return (
      <div className="page" style={{ maxWidth: 700, marginTop: 50 }}>
        <div className="card">
          <div className="card-body">
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, marginBottom: 14 }}>⚙️ Setup Required</h2>
            <div className="alert alert-warn">Configure your Supabase credentials before using this app.</div>
            <p style={{ marginBottom: 14, lineHeight: 1.7 }}>Open <code>src/App.jsx</code> and replace these at the top:</p>
            <div style={{ background: "#1a1a2e", color: "#c9a84c", padding: 16, borderRadius: 10, fontFamily: "monospace", fontSize: 13, marginBottom: 20 }}>
              <div>const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";</div>
              <div>const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";</div>
            </div>
            <p style={{ fontWeight: 600, marginBottom: 10 }}>SQL to run in Supabase SQL Editor:</p>
            <pre style={{ background: "#1a1a2e", color: "#6ee7b7", padding: 16, borderRadius: 10, fontFamily: "monospace", fontSize: 12, overflowX: "auto", whiteSpace: "pre-wrap" }}>{`create table families (
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
            <p style={{ marginTop: 14, fontSize: 13, color: "var(--ink2)" }}>
              Also create <strong>two public storage buckets</strong> in Supabase: <code>template-pdfs</code> and <code>signed-pdfs</code>.
            </p>
            <p style={{ marginTop: 10, fontSize: 13, color: "var(--ink2)" }}>
              And add these to <code>package.json</code> dependencies:
              <code style={{ display: "block", background: "#f5f5f5", padding: "8px 12px", borderRadius: 6, marginTop: 6 }}>
                "pdfjs-dist": "^3.11.174",<br />
                "pdf-lib": "^1.17.1"
              </code>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return children;
}

// ════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("families");
  const params = new URLSearchParams(window.location.search);
  const familyToken = params.get("family");

  if (familyToken) {
    return <div><style>{CSS}</style><FamilyPortal token={familyToken} /></div>;
  }

  return (
    <div>
      <style>{CSS}</style>
      <nav className="nav">
        <div className="nav-logo">Casting<span>Docs</span></div>
        <div className="nav-tabs">
          {[
            { id: "families", label: "👨‍👩‍👧‍👦 Families" },
            { id: "templates", label: "📋 Templates" },
            { id: "documents", label: "📄 Signed Docs" },
          ].map(t => (
            <button key={t.id} className={`nav-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </nav>
      <SetupCheck>
        {tab === "templates" ? (
          <TemplatesTab />
        ) : (
          <div className="page">
            {tab === "families" && <FamiliesTab />}
            {tab === "documents" && <DocumentsTab />}
          </div>
        )}
      </SetupCheck>
    </div>
  );
}
