import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import { supabase } from "./supabase";

const STATUS = {
  접수: { label: "접수", color: "#2563eb", bg: "#eff6ff" },
  제작중: { label: "제작중", color: "#d97706", bg: "#fffbeb" },
  완성: { label: "완성", color: "#059669", bg: "#ecfdf5" },
  배송완료: { label: "배송완료", color: "#64748b", bg: "#f1f5f9" },
};

const PLATFORMS = ["스마트스토어", "송도점", "경북상주점", "서초점", "쿠팡", "카카오 비즈니스센터", "직접방문", "기타"];

const FIGURE_TYPES = {
  실사:   { label: "실사",   weeks: 2, color: "#E55B2D", bg: "#FEF0EB" },
  캐릭터: { label: "캐릭터", weeks: 1, color: "#8B5CF6", bg: "#F3EFFE" },
};

const PLATFORM_COLORS = {
  "스마트스토어": "#eafaf1",
  "가맹점": "#e6f4fa",
  "송도점": "#e6f4fa",
  "경북상주점": "#e6f4fa",
  "서초점": "#e6f4fa",
  "쿠팡": "#fceaea",
  "카카오 비즈니스센터": "#fdf8e4",
  "직접방문": "#f8f3eb",
  "기타": "#ffffff"
};

const CHANNELS = ["전화", "게시판", "이메일", "방문"];
const PROBLEM_CATEGORIES = ["제품 결함", "서비스 지연", "직원 태도", "배송 문제", "기타"];
const RESOLUTION_ACTIONS = ["교환", "환불", "수리", "보상", "담당자 교육"];

function generateId() {
  return "ord_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

function generateComplaintId() {
  return "cmp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function calcProductionDeadline(createdAt, figureType) {
  if (!createdAt || !figureType || !FIGURE_TYPES[figureType]) return null;
  const d = new Date(createdAt);
  d.setDate(d.getDate() + FIGURE_TYPES[figureType].weeks * 7);
  return d;
}

function todayKorean() {
  const d = new Date();
  return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, "0")}월 ${String(d.getDate()).padStart(2, "0")}일`;
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS["접수"];
  return (
    <span className="status-badge" style={{ color: s.color, background: s.bg, borderColor: `${s.color}20` }}>
      {s.label}
    </span>
  );
}

function FigureTypeBadge({ type }) {
  if (!type || !FIGURE_TYPES[type]) return null;
  const t = FIGURE_TYPES[type];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      color: t.color, background: t.bg, border: `1px solid ${t.color}44` }}>
      {type === "실사" ? "📷" : "🎨"} {t.label}
    </span>
  );
}

function ImageUploader({ images, onChange, initialFiles = [], onUploading }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    if (onUploading) onUploading(true);
    const newImages = [];
    for (const file of Array.from(files)) {
      const fileExt = file.name?.split('.').pop() || 'png';
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${fileExt}`;
      const { error } = await supabase.storage.from('order-images').upload(fileName, file);
      if (!error) {
        const { data } = supabase.storage.from('order-images').getPublicUrl(fileName);
        newImages.push({ id: generateId(), src: data.publicUrl, name: file.name || fileName });
      } else {
        alert("이미지 업로드 실패: " + error.message);
      }
    }
    onChange(prev => [...prev, ...newImages]);
    setUploading(false);
    if (onUploading) onUploading(false);
  }, [onChange, onUploading]);

  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const ext = item.type.split('/')[1] || 'png';
          const namedFile = new File([file], `paste_${Date.now()}.${ext}`, { type: item.type });
          imageFiles.push(namedFile);
        }
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      await handleFiles(imageFiles);
    }
  }, [handleFiles]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      handleFiles(initialFiles);
    }
  }, [initialFiles, handleFiles]);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) await handleFiles(e.dataTransfer.files);
  };

  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <div
        onClick={() => ref.current.click()}
        style={{
          ...inputStyle,
          background: dragOver ? "#f0f7ff" : "#ffffff",
          border: `1px ${dragOver ? "solid" : "dashed"} ${dragOver ? "#2563eb" : "#e2e8f0"}`,
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          cursor: "pointer",
          marginBottom: 16,
          color: dragOver ? "#2563eb" : "#64748b",
          transition: "all 0.2s"
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <span style={{ fontSize: 14, fontWeight: 500 }}>
          {uploading ? "Uploading..." : dragOver ? "Drop to upload" : "Click to select or Paste image (Ctrl+V)"}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        {images.map((img) => (
          <div key={img.id} style={{ position: "relative" }}>
            <img src={img.src} alt={img.name} style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "var(--shadow-sm)" }} />
            <button
              type="button"
              onClick={() => onChange(images.filter(i => i.id !== img.id))}
              style={{ position: "absolute", top: -8, right: -8, width: 28, height: 28, borderRadius: 8, background: "#ef4444", color: "#fff", border: "2px solid #fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-md)" }}>×</button>
          </div>
        ))}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={e => handleFiles(e.target.files)} />
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
  fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  background: "#fff", color: "#0f172a"
};
const btnPrimary = {
  padding: "12px 24px", borderRadius: 8, border: "none", background: "#2563eb",
  color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
};
const btnSecondary = {
  padding: "12px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff",
  color: "#475569", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.2s"
};

function CheckboxGroup({ label, options, selected, onChange }) {
  const toggle = (opt) => {
    const next = selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt];
    onChange(next);
  };
  return (
    <div>
      <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map(opt => {
          const checked = selected.includes(opt);
          return (
            <label key={opt} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 20,
              border: `1px solid ${checked ? "#2563eb" : "#e2e8f0"}`,
              background: checked ? "#eff6ff" : "#fff",
              color: checked ? "#2563eb" : "#64748b",
              cursor: "pointer", fontSize: 13, fontWeight: checked ? 600 : 400,
              transition: "all 0.15s", userSelect: "none"
            }}>
              <input type="checkbox" checked={checked} onChange={() => toggle(opt)} style={{ display: "none" }} />
              {checked && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
              {opt}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ComplaintForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    receivedDate: todayKorean(),
    channels: [],
    customerName: "",
    contact: "",
    purchaseDate: "",
    complaintContent: "",
    problemCategories: [],
    investigation: "",
    resolutionActions: [],
    resolutionDate: "",
    customerFeedback: "",
    preventionMeasure: "",
    createdAt: new Date().toISOString(),
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 1. 접수 정보 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #fee2e2", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          1. 접수 정보
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>접수 일시</label>
            <input value={form.receivedDate} onChange={e => set("receivedDate", e.target.value)} style={inputStyle} />
          </div>
          <CheckboxGroup label="접수 채널" options={CHANNELS} selected={form.channels} onChange={v => set("channels", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>고객 성명 *</label>
              <input value={form.customerName} onChange={e => set("customerName", e.target.value)} placeholder="홍길동" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>연락처</label>
              <input value={form.contact} onChange={e => set("contact", e.target.value)} placeholder="010-0000-0000" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>구매 일자</label>
              <input value={form.purchaseDate} onChange={e => set("purchaseDate", e.target.value)} placeholder="05/01" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>불만 내용</label>
            <textarea value={form.complaintContent} onChange={e => set("complaintContent", e.target.value)}
              placeholder="고객이 접수한 불만 내용을 상세하게 기록..." rows={3}
              style={{ ...inputStyle, resize: "vertical" }} />
          </div>
        </div>
      </div>

      {/* 2. 내부 처리 및 해결 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #fef3c7", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          2. 내부 처리 및 해결
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <CheckboxGroup label="문제 분류" options={PROBLEM_CATEGORIES} selected={form.problemCategories} onChange={v => set("problemCategories", v)} />
          <div>
            <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>사실 확인 (Investigation)</label>
            <textarea value={form.investigation} onChange={e => set("investigation", e.target.value)}
              placeholder="관련 부서 확인 결과 및 객관적 사실관계..." rows={3}
              style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <CheckboxGroup label="해결 조치 내역" options={RESOLUTION_ACTIONS} selected={form.resolutionActions} onChange={v => set("resolutionActions", v)} />
          <div>
            <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>처리 결과 전달 일시</label>
            <input value={form.resolutionDate} onChange={e => set("resolutionDate", e.target.value)} placeholder="2026년 05월 25일" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* 3. 사후 관리 및 예방 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #d1fae5", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          3. 사후 관리 및 예방
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>고객 피드백</label>
            <textarea value={form.customerFeedback} onChange={e => set("customerFeedback", e.target.value)}
              placeholder="처리된 서비스에 대한 고객 만족도 확인 내용..." rows={2}
              style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>재발 방지 대책</label>
            <textarea value={form.preventionMeasure} onChange={e => set("preventionMeasure", e.target.value)}
              placeholder="동일한 문제 발생을 막기 위한 프로세스 개선점..." rows={2}
              style={{ ...inputStyle, resize: "vertical" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={btnSecondary}>취소</button>
        <button type="button" onClick={() => {
          if (!form.customerName.trim()) { alert("고객 성명은 필수입니다."); return; }
          onSave(form);
        }} style={{ ...btnPrimary, background: "#ef4444" }}>
          불만 접수 저장
        </button>
      </div>
    </div>
  );
}

function ComplaintCard({ complaint, onDelete }) {
  const resolved = !!complaint.resolutionDate;
  return (
    <div style={{
      background: resolved ? "#f8fafc" : "#fff5f5",
      border: `1px solid ${resolved ? "#e2e8f0" : "#fecaca"}`,
      borderRadius: 10,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      opacity: resolved ? 0.75 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{complaint.customerName}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
            background: resolved ? "#d1fae5" : "#fee2e2",
            color: resolved ? "#059669" : "#ef4444",
          }}>
            {resolved ? "처리완료" : "처리중"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{complaint.receivedDate}</span>
          <button type="button" onClick={() => onDelete(complaint.id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: "4px", display: "flex", alignItems: "center" }}
            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={e => e.currentTarget.style.color = "#cbd5e1"}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {complaint.channels?.map(c => (
          <span key={c} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#eff6ff", color: "#2563eb", fontWeight: 600 }}>{c}</span>
        ))}
        {complaint.problemCategories?.map(p => (
          <span key={p} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#fef3c7", color: "#d97706", fontWeight: 600 }}>{p}</span>
        ))}
        {complaint.resolutionActions?.map(r => (
          <span key={r} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#d1fae5", color: "#059669", fontWeight: 600 }}>{r}</span>
        ))}
      </div>
      {complaint.complaintContent && (
        <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {complaint.complaintContent}
        </p>
      )}
    </div>
  );
}

function OrderForm({ onSave, onCancel, initialData = null, initialImages = [] }) {
  const [form, setForm] = useState(initialData || {
    customerName: "", platform: "스마트스토어", contact: "", address: "", additionalItems: "",
    figureType: "실사",
    description: "", orderDate: "",
    status: "접수", notes: "", images: [], createdAt: new Date().toISOString()
  });
  const [isUploading, setIsUploading] = useState(false);
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>고객명 *</label>
          <input value={form.customerName} onChange={e => set("customerName", e.target.value)}
            placeholder="홍길동" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>유입 경로</label>
          <select value={form.platform} onChange={e => set("platform", e.target.value)} style={inputStyle}>
            {PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>연락처 / 아이디</label>
          <input value={form.contact} onChange={e => {
            let val = e.target.value;
            if (/^[0-9-]*$/.test(val)) {
              const d = val.replace(/-/g, "");
              if (d.length <= 3) val = d;
              else if (d.length <= 7) val = `${d.slice(0, 3)}-${d.slice(3)}`;
              else val = `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
            }
            set("contact", val);
          }}
            placeholder="@username 또는 010-xxxx-xxxx" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>주문일</label>
          <input value={form.orderDate} onChange={e => {
            let val = e.target.value.replace(/[^0-9]/g, "");
            if (val.length > 2) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
            set("orderDate", val);
          }}
            placeholder="12/25" style={inputStyle} maxLength={5} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>피규어 유형</label>
          <select value={form.figureType || "실사"} onChange={e => set("figureType", e.target.value)}
            style={{ ...inputStyle, borderColor: FIGURE_TYPES[form.figureType]?.color + "66", color: FIGURE_TYPES[form.figureType]?.color, fontWeight: 600 }}>
            {Object.entries(FIGURE_TYPES).map(([k, v]) =>
              <option key={k} value={k}>{k === "실사" ? "📷" : "🎨"} {v.label} (제작 {v.weeks}주)</option>
            )}
          </select>
          {form.createdAt && form.figureType && (
            <div style={{ marginTop: 5, fontSize: 12, color: FIGURE_TYPES[form.figureType]?.color, fontWeight: 500 }}>
              제작 완성 예정: {formatDate(calcProductionDeadline(form.createdAt, form.figureType))}
            </div>
          )}
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>상태</label>
          <select value={form.status} onChange={e => set("status", e.target.value)} style={inputStyle}>
            {Object.keys(STATUS).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>배송지 주소</label>
        <input value={form.address} onChange={e => set("address", e.target.value)}
          placeholder="서울특별시 강남구 테헤란로..." style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>추가 상품</label>
        <input value={form.additionalItems} onChange={e => set("additionalItems", e.target.value)}
          placeholder="예: 아크릴 케이스, 명패, 추가 소품 등..." style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>주문 내용</label>
        <textarea value={form.description} onChange={e => set("description", e.target.value)}
          placeholder="피규어 내용, 크기, 소재 등 상세 내용..." rows={3}
          style={{ ...inputStyle, resize: "vertical" }} />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>참고 이미지</label>
        <ImageUploader
          images={form.images || []}
          onChange={imgs => set("images", typeof imgs === "function" ? imgs(form.images) : imgs)}
          initialFiles={initialImages}
          onUploading={setIsUploading}
        />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>메모</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="특이사항, 요청사항 등..." rows={2}
          style={{ ...inputStyle, resize: "vertical" }} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={btnSecondary}>취소</button>
        <button type="button" disabled={isUploading} onClick={() => {
          if (!form.customerName.trim()) {
            alert("고객명은 필수입니다.");
            return;
          }
          onSave(form);
        }} style={{ ...btnPrimary, opacity: isUploading ? 0.5 : 1, cursor: isUploading ? "not-allowed" : "pointer" }}>
          {isUploading ? "이미지 업로드 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

function OrderCard({ order, onClick, onQuickStatus, onQuickMemo }) {
  const thumb = order.images?.[0];
  const bg = PLATFORM_COLORS[order.platform] || "#fff";
  const isCompleted = order.status === "배송완료";
  return (
    <div onClick={onClick} className="order-card" style={{
      background: bg,
      opacity: isCompleted ? 0.6 : 1,
      filter: isCompleted ? "grayscale(40%)" : "none",
      position: "relative"
    }}>
      {thumb ? (
        <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
          <img src={thumb.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4, border: "1px solid rgba(0,0,0,0.05)" }} />
        </div>
      ) : (
        <div style={{ width: 100, height: 100, background: "#f1f5f9", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", flexShrink: 0 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{order.customerName}</h3>
          {order.figureType && <FigureTypeBadge type={order.figureType} />}
          <span style={{
            fontSize: 12,
            padding: "2px 10px",
            borderRadius: 6,
            background: "#ffffff",
            color: "#64748b",
            border: "1px solid #e2e8f0",
            fontWeight: 600,
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
          }}>{order.status}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 12,
            color: "#64748b",
            fontWeight: 600,
            background: "#ffffff",
            padding: "2px 10px",
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
          }}>
            {order.platform}
          </span>
          <span style={{ width: 1, height: 10, background: "#e2e8f0" }}></span>
          <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{order.orderDate}</span>
          {order.figureType && !isCompleted && calcProductionDeadline(order.createdAt, order.figureType) && (() => {
            const t = FIGURE_TYPES[order.figureType];
            return (
              <>
                <span style={{ width: 1, height: 10, background: "#e2e8f0" }}></span>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: t.color,
                  background: t.bg, padding: "3px 10px", borderRadius: 6,
                  border: `1.5px solid ${t.color}55`, letterSpacing: "-0.01em"
                }}>
                  제작완성 {formatDate(calcProductionDeadline(order.createdAt, order.figureType))}
                </span>
              </>
            );
          })()}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onQuickMemo(order);
        }}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "none",
          border: "none",
          padding: "8px",
          cursor: "pointer",
          color: "#cbd5e1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.2s",
          zIndex: 10
        }}
        onMouseEnter={e => e.currentTarget.style.color = "#2563eb"}
        onMouseLeave={e => e.currentTarget.style.color = "#cbd5e1"}
        title="메모 작성/수정"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </button>

      <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "row", alignItems: "flex-end", gap: 12, maxWidth: "70%" }}>
        {order.notes && (
          <div className="sticky-note" style={{ transform: "rotate(-1.5deg)" }}>
            {order.notes}
          </div>
        )}
        {order.status === "완성" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickStatus(order.id, "배송완료");
            }}
            style={{
              background: "#10b981",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            배송완료
          </button>
        )}
      </div>
      {order.images?.length > 1 && (
        <span style={{ position: "absolute", bottom: 12, left: 112, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>+{order.images.length - 1}</span>
      )}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={wide ? { maxWidth: 720 } : {}}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#8A93A0", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DetailModal({ order, onEdit, onDelete, onStatusChange, onClose }) {
  const prodDeadline = calcProductionDeadline(order.createdAt, order.figureType);
  const figType = order.figureType && FIGURE_TYPES[order.figureType];
  return (
    <Modal title="주문 상세" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{order.customerName}</span>
          {order.figureType && <FigureTypeBadge type={order.figureType} />}
          <StatusBadge status={order.status} />
        </div>
        {figType && prodDeadline && (
          <div style={{ background: figType.bg, borderRadius: 10, padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            border: `1px solid ${figType.color}33` }}>
            <div>
              <div style={{ fontSize: 12, color: figType.color, fontWeight: 600 }}>
                {order.figureType === "실사" ? "📷" : "🎨"} {figType.label} 피규어 · 제작 {figType.weeks}주
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: figType.color, marginTop: 2 }}>
                제작 완성 예정: {formatDate(prodDeadline)}
              </div>
            </div>
          </div>
        )}
        {order.images?.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {order.images.map(img => (
              <img key={img.id} src={img.src} alt="" style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 12, border: "1px solid #E0E4EA", cursor: "zoom-in" }}
                onClick={() => window.open(img.src, "_blank")} />
            ))}
          </div>
        )}
        <div style={{ background: "#F8F9FB", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{order.description}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["유입 경로", order.platform],
            ["연락처", order.contact || "—"],
            ["주소", order.address || "—"],
            ["추가 상품", order.additionalItems || "—"],
            ["주문일", order.orderDate || "—"],
            ["접수일", formatDate(order.createdAt)],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "#F8F9FB", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "#A0ADB4", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
        {order.notes && (
          <div>
            <div style={{ fontSize: 12, color: "#6B7684", marginBottom: 4 }}>메모</div>
            <p style={{ margin: 0, fontSize: 13, color: "#4A5568", whiteSpace: "pre-wrap" }}>{order.notes}</p>
          </div>
        )}
        <div>
          <div style={{ fontSize: 12, color: "#6B7684", marginBottom: 8 }}>상태 변경</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.keys(STATUS).map(s => (
              <button type="button" key={s} onClick={() => onStatusChange(s)} style={{
                padding: "6px 14px", borderRadius: 20, border: "1px solid",
                borderColor: s === order.status ? STATUS[s].color : "#E0E4EA",
                background: s === order.status ? STATUS[s].bg : "#fff",
                color: s === order.status ? STATUS[s].color : "#6B7684",
                fontWeight: s === order.status ? 600 : 400, cursor: "pointer", fontSize: 13
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, paddingTop: 12 }}>
          <button type="button" onClick={onEdit} style={{...btnSecondary, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button type="button" onClick={() => { if (window.confirm("Are you sure you want to delete this order?")) onDelete(); }}
            style={{ ...btnSecondary, flex: 1, color: "#ef4444", borderColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function App() {
  const [orders, setOrders] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [quickMemoOrder, setQuickMemoOrder] = useState(null);
  const [memoText, setMemoText] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [filterType, setFilterType] = useState("전체");
  const [search, setSearch] = useState("");
  const [initialImages, setInitialImages] = useState([]);
  const [hideCompleted, setHideCompleted] = useState(true);

  const [complaints, setComplaints] = useState([]);
  const [complaintModal, setComplaintModal] = useState(null);

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (modal) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        setInitialImages(files);
        setModal("add");
      }
    };
    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [modal]);

  useEffect(() => {
    fetchOrders();
    fetchComplaints();
    const autoMigrate = async () => {
      try {
        const saved = localStorage.getItem("figure_orders");
        if (saved) {
          const localOrders = JSON.parse(saved);
          if (localOrders.length > 0) {
            const { error } = await supabase.from('orders').insert(localOrders);
            if (!error) {
              console.log("로컬 데이터 마이그레이션 성공");
              localStorage.removeItem("figure_orders");
              fetchOrders();
            }
          } else {
            localStorage.removeItem("figure_orders");
          }
        }
      } catch (e) {
        console.error("마이그레이션 실패:", e);
      }
    };
    autoMigrate();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*');
    if (data) setOrders(data);
  };

  const fetchComplaints = async () => {
    const { data } = await supabase.from('complaints').select('*').order('createdAt', { ascending: false });
    if (data) setComplaints(data);
  };

  const addOrder = async (form) => {
    const newOrder = { ...form, id: generateId(), createdAt: new Date().toISOString() };
    const { error } = await supabase.from('orders').insert([newOrder]);
    if (!error) {
      setOrders(prev => [newOrder, ...prev]);
      setModal(null);
    } else {
      alert("주문 추가 실패: " + error.message);
    }
  };

  const addComplaint = async (form) => {
    const newComplaint = { ...form, id: generateComplaintId(), createdAt: new Date().toISOString() };
    const { error } = await supabase.from('complaints').insert([newComplaint]);
    if (!error) {
      setComplaints(prev => [newComplaint, ...prev]);
      setComplaintModal("list");
    } else {
      alert("불만 접수 저장 실패: " + error.message);
    }
  };

  const deleteComplaint = async (id) => {
    if (!window.confirm("이 불만 접수 내역을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('complaints').delete().eq('id', id);
    if (!error) {
      setComplaints(prev => prev.filter(c => c.id !== id));
    } else {
      alert("삭제 실패: " + error.message);
    }
  };

  const updateOrder = async (form) => {
    const updated = { ...form, id: selected.id, createdAt: selected.createdAt };
    const { error } = await supabase.from('orders').update(updated).eq('id', selected.id);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === selected.id ? updated : o));
      setSelected(updated);
      setModal("detail");
    } else {
      alert("주문 수정 실패: " + error.message);
    }
  };

  const deleteOrder = async () => {
    const { error } = await supabase.from('orders').delete().eq('id', selected.id);
    if (!error) {
      setOrders(prev => prev.filter(o => o.id !== selected.id));
      setModal(null);
      setSelected(null);
    } else {
      alert("주문 삭제 실패: " + error.message);
    }
  };

  const updateStatusQuickly = async (id, newStatus) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      fetchOrders();
    } catch (err) {
      alert("상태 변경에 실패했습니다.");
    }
  };

  const changeStatus = async (status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', selected.id);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, status } : o));
      setSelected(s => ({ ...s, status }));
    } else {
      alert("상태 변경 실패: " + error.message);
    }
  };

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === "전체" || o.status === filterStatus;
    const matchType = filterType === "전체" || (o.figureType || "실사") === filterType;
    const q = search.toLowerCase();
    const matchHide = !hideCompleted || o.status !== "배송완료" || !!q;
    const dateDigits = (o.orderDate || "").replace(/\//g, "");
    const matchSearch = !q || o.customerName.toLowerCase().includes(q) ||
      o.description.toLowerCase().includes(q) || (o.contact || "").toLowerCase().includes(q) ||
      dateDigits.includes(q.replace(/\//g, ""));
    return matchStatus && matchType && matchSearch && matchHide;
  }).sort((a, b) => {
    const statusPriority = (s) => s === "배송완료" ? 1 : 0;
    const priorityA = statusPriority(a.status);
    const priorityB = statusPriority(b.status);
    if (priorityA !== priorityB) return priorityA - priorityB;
    const dateA = a.orderDate || "99/99";
    const dateB = b.orderDate || "99/99";
    return dateA.localeCompare(dateB);
  });

  const counts = Object.keys(STATUS).reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  return (
    <div className="app-container">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>주문 관리 시스템</h1>
          <p style={{ margin: "2px 0 0", fontSize: 16, color: "#79BCFA", fontWeight: 700, letterSpacing: "-0.01em" }}>마이미니미 안산점</p>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => setComplaintModal("list")} style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid #fecaca",
              background: "#fff", color: "#ef4444", fontSize: 13, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              position: "relative"
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              고객 불만
              {complaints.length > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: -6,
                  background: "#ef4444", color: "#fff",
                  fontSize: 10, fontWeight: 800,
                  width: 18, height: 18, borderRadius: 9,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid #fff"
                }}>{complaints.length}</span>
              )}
            </button>
            <a href="/마이미니미_불만유형현황.xlsx" download style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
              background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              textDecoration: "none"
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              템플릿
            </a>
          </div>
          <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
          <button type="button" onClick={() => setModal("add")} style={{
            padding: "12px 24px", borderRadius: 8, border: "none",
            background: "#2563eb", color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            새 주문 추가
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {Object.entries(counts).map(([s, c]) => (
          <div key={s} style={{ background: STATUS[s].bg, borderRadius: 8, padding: "16px", textAlign: "center", border: `1px solid ${STATUS[s].color}15`, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: STATUS[s].color }}>{c}</div>
            <div style={{ fontSize: 12, color: STATUS[s].color, fontWeight: 600, marginTop: 2 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* 피규어 유형 필터 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {[["전체", null], ...Object.entries(FIGURE_TYPES)].map(([key, t]) => {
          const isActive = filterType === key;
          const color = t ? t.color : "#2563eb";
          const bg = t ? t.bg : "#eff6ff";
          const count = key === "전체" ? orders.length : orders.filter(o => (o.figureType || "실사") === key).length;
          return (
            <button type="button" key={key} onClick={() => setFilterType(key)} style={{
              padding: "8px 18px", borderRadius: 8, border: "1px solid",
              borderColor: isActive ? color : "#e2e8f0",
              background: isActive ? bg : "#fff",
              color: isActive ? color : "#64748b",
              fontWeight: isActive ? 700 : 500, cursor: "pointer", fontSize: 13, transition: "all 0.2s"
            }}>
              {key === "전체" ? "전체" : `${key === "실사" ? "📷" : "🎨"} ${key} (제작 ${t.weeks}주)`}
              <span style={{ opacity: 0.6, marginLeft: 6 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["전체", ...Object.keys(STATUS)].map(s => (
            <button type="button" key={s} onClick={() => setFilterStatus(s)} style={{
              padding: "8px 18px", borderRadius: 8, border: "1px solid",
              borderColor: filterStatus === s ? "#2563eb" : "#e2e8f0",
              background: filterStatus === s ? "#eff6ff" : "#fff",
              color: filterStatus === s ? "#2563eb" : "#64748b",
              fontWeight: filterStatus === s ? 600 : 500, cursor: "pointer", fontSize: 13, transition: "all 0.2s"
            }}>{s} <span style={{ opacity: 0.6, marginLeft: 4 }}>{s === "전체" ? orders.length : counts[s]}</span></button>
          ))}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#64748b", padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <input type="checkbox" checked={hideCompleted} onChange={e => setHideCompleted(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
          <span>완료된 주문 숨기기</span>
        </label>
      </div>

      <div style={{ position: "relative", marginBottom: 32 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="고객명, 내용, 연락처로 검색..."
          style={{ ...inputStyle, paddingLeft: 44, background: "#fff", boxShadow: "var(--shadow-sm)" }} />
        <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, opacity: 0.5 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>
              {search || filterStatus !== "전체" ? "검색 결과가 없습니다" : "등록된 주문이 없습니다"}
            </p>
          </div>
        ) : filtered.map(order => (
          <OrderCard key={order.id} order={order}
            onClick={() => { setSelected(order); setModal("detail"); }}
            onQuickStatus={updateStatusQuickly}
            onQuickMemo={async (ord) => {
              const newMemo = window.prompt("메모를 입력하세요:", ord.notes || "");
              if (newMemo !== null) {
                try {
                  const { error } = await supabase.from("orders").update({ notes: newMemo }).eq("id", ord.id);
                  if (error) throw error;
                  fetchOrders();
                } catch (err) {
                  alert("메모 저장 실패");
                }
              }
            }} />
        ))}
      </div>

      {quickMemoOrder && (
        <Modal title="퀵 메모 작성" onClose={() => setQuickMemoOrder(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <textarea
              autoFocus
              value={memoText}
              onChange={e => setMemoText(e.target.value)}
              placeholder="여기에 메모를 입력하세요..."
              rows={5}
              style={{ ...inputStyle, resize: "none", minHeight: 120 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setQuickMemoOrder(null)} style={btnSecondary}>취소</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === "add" && (
        <Modal title="새 주문 추가" onClose={() => { setModal(null); setInitialImages([]); }}>
          <OrderForm onSave={addOrder} onCancel={() => { setModal(null); setInitialImages([]); }} initialImages={initialImages} />
        </Modal>
      )}
      {modal === "edit" && selected && (
        <Modal title="주문 수정" onClose={() => setModal("detail")}>
          <OrderForm initialData={selected} onSave={updateOrder} onCancel={() => setModal("detail")} />
        </Modal>
      )}
      {modal === "detail" && selected && (
        <DetailModal
          order={selected}
          onEdit={() => setModal("edit")}
          onDelete={deleteOrder}
          onStatusChange={changeStatus}
          onClose={() => { setModal(null); setSelected(null); }}
        />
      )}

      {complaintModal === "list" && (
        <Modal title="고객 불만 접수 내역" onClose={() => setComplaintModal(null)} wide>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setComplaintModal("add")} style={{
                ...btnPrimary, background: "#ef4444",
                display: "flex", alignItems: "center", gap: 8, padding: "10px 20px"
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                새 불만 접수
              </button>
            </div>
            {complaints.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12, opacity: 0.4 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>접수된 불만 내역이 없습니다</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflowY: "auto" }}>
                {complaints.map(c => (
                  <ComplaintCard key={c.id} complaint={c} onDelete={deleteComplaint} />
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {complaintModal === "add" && (
        <Modal title="고객 불만 접수" onClose={() => setComplaintModal("list")} wide>
          <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
            <ComplaintForm
              onSave={addComplaint}
              onCancel={() => setComplaintModal("list")}
            />
          </div>
        </Modal>
      )}

      <button
        type="button"
        onClick={() => setModal("add")}
        title="새 주문 추가"
        style={{
          position: "fixed", bottom: 32, right: 32,
          width: 56, height: 56, borderRadius: "50%",
          background: "#2563eb", color: "#fff", border: "none",
          boxShadow: "0 4px 16px rgba(37,99,235,0.45)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 900, transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)"
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.55)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.45)";
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  );
}
