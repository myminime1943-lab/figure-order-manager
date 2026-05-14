import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import { supabase } from "./supabase";

const STATUS = {
  접수: { label: "접수", color: "#4B7BEC", bg: "#EBF0FD" },
  제작중: { label: "제작중", color: "#F7B731", bg: "#FEF8EA" },
  완성: { label: "완성", color: "#20bf6b", bg: "#E8FDF2" },
  배송완료: { label: "배송완료", color: "#A0ADB4", bg: "#F2F4F5" },
};

const PLATFORMS = ["스마트스토어", "위벨롭먼트", "가맹점", "쿠팡", "카카오 비즈니스센터", "직접방문", "기타"];

const PLATFORM_COLORS = {
  "스마트스토어": "#eafaf1",
  "위벨롭먼트": "#f0f0f0",
  "가맹점": "#e6f4fa",
  "쿠팡": "#fceaea",
  "카카오 비즈니스센터": "#fdf8e4",
  "직접방문": "#f8f3eb",
  "기타": "#fff"
};

function generateId() {
  return "ord_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS["접수"];
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: "3px 10px",
      borderRadius: 20, color: s.color, background: s.bg,
      border: `1px solid ${s.color}33`
    }}>{s.label}</span>
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
      {/* 텍스트 입력칸 스타일의 붙여넣기 존 */}
      <div 
        onClick={() => ref.current.click()}
        style={{
          ...inputStyle,
          background: dragOver ? "#F0F5FF" : "#F8F9FB",
          border: `1px ${dragOver ? "solid" : "dashed"} ${dragOver ? "#4B7BEC" : "#DDE1E7"}`,
          height: 42,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
          marginBottom: 12,
          color: dragOver ? "#4B7BEC" : "#8A93A0",
          transition: "all 0.2s"
        }}
      >
        <span style={{ fontSize: 16 }}>{dragOver ? "📥" : "📸"}</span>
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {uploading ? "이미지 업로드 중..." : dragOver ? "여기에 놓으세요" : "클릭하여 선택하거나 이미지를 붙여넣으세요 (Ctrl+V)"}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {images.map((img) => (
          <div key={img.id} style={{ position: "relative" }}>
            <img src={img.src} alt={img.name} style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 12, border: "1px solid #E0E4EA" }} />
            <button
              type="button"
              onClick={() => onChange(images.filter(i => i.id !== img.id))}
              style={{ position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: "50%", background: "#E24B4A", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>×</button>
          </div>
        ))}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={e => handleFiles(e.target.files)} />
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #DDE1E7",
  fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  background: "#fff"
};
const btnPrimary = {
  padding: "9px 20px", borderRadius: 8, border: "none", background: "#4B7BEC",
  color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer"
};
const btnSecondary = {
  padding: "9px 16px", borderRadius: 8, border: "1px solid #DDE1E7", background: "#fff",
  color: "#4A5568", fontSize: 14, cursor: "pointer"
};

function OrderForm({ onSave, onCancel, initialData = null, initialImages = [] }) {
  const [form, setForm] = useState(initialData || {
    customerName: "", platform: "스마트스토어", contact: "", address: "", additionalItems: "",
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
        <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>주문 내용 *</label>
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
          if (!form.customerName.trim() || !form.description.trim()) {
            alert("고객명과 주문 내용은 필수입니다.");
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

function OrderCard({ order, onClick }) {
  const thumb = order.images?.[0];
  const bg = PLATFORM_COLORS[order.platform] || "#fff";
  const isCompleted = order.status === "배송완료";
  return (
    <div onClick={onClick} className="order-card" style={{ 
      background: bg,
      opacity: isCompleted ? 0.5 : 1,
      filter: isCompleted ? "grayscale(30%)" : "none"
    }}>
      {thumb ? (
        <img src={thumb.src} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 80, height: 80, borderRadius: 10, background: "#F2F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎨</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{order.customerName}</span>
          <StatusBadge status={order.status} />
        </div>
        <p style={{ fontSize: 13, color: "#6B7684", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.description}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <span style={{ fontSize: 12, color: "#A0ADB4" }}>{order.platform}</span>
          {order.orderDate && <span style={{ fontSize: 11, color: "#A0ADB4" }}>{order.orderDate}</span>}
        </div>
      </div>
      {order.images?.length > 1 && (
        <span style={{ fontSize: 11, color: "#A0ADB4", flexShrink: 0 }}>+{order.images.length - 1}</span>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
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
  return (
    <Modal title="주문 상세" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{order.customerName}</span>
          <StatusBadge status={order.status} />
        </div>
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
        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <button type="button" onClick={onEdit} style={btnSecondary}>✏️ 수정</button>
          <button type="button" onClick={() => { if (window.confirm("삭제하시겠습니까?")) onDelete(); }}
            style={{ ...btnSecondary, color: "#E24B4A", borderColor: "#E24B4A33" }}>🗑 삭제</button>
        </div>
      </div>
    </Modal>
  );
}

export default function App() {
  const [orders, setOrders] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("전체");
  const [search, setSearch] = useState("");
  const [initialImages, setInitialImages] = useState([]);
  const [hideCompleted, setHideCompleted] = useState(false);

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (modal) return; // 모달이 이미 열려있으면 ImageUploader가 처리함
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
    // 로컬 데이터 자동 마이그레이션
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
    const { data, error } = await supabase.from('orders').select('*');
    if (data) setOrders(data);
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
    const matchHide = !hideCompleted || o.status !== "배송완료";
    const q = search.toLowerCase();
    const matchSearch = !q || o.customerName.toLowerCase().includes(q) ||
      o.description.toLowerCase().includes(q) || (o.contact || "").toLowerCase().includes(q);
    return matchStatus && matchSearch && matchHide;
  }).sort((a, b) => {
    // 배송완료 상태를 가장 뒤로 보냄
    const statusPriority = (s) => s === "배송완료" ? 1 : 0;
    const priorityA = statusPriority(a.status);
    const priorityB = statusPriority(b.status);
    if (priorityA !== priorityB) return priorityA - priorityB;

    // 같은 그룹 내에서는 주문일 순으로 정렬
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1A202C" }}>🎨 주문 관리</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#A0ADB4" }}>피규어 제작 주문 현황</p>
        </div>
        <button type="button" onClick={() => setModal("add")} style={btnPrimary}>+ 새 주문</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        {Object.entries(counts).map(([s, c]) => (
          <div key={s} style={{ background: STATUS[s].bg, borderRadius: 10, padding: "10px 12px", textAlign: "center", border: `1px solid ${STATUS[s].color}22` }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: STATUS[s].color }}>{c}</div>
            <div style={{ fontSize: 11, color: STATUS[s].color, fontWeight: 500 }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["전체", ...Object.keys(STATUS)].map(s => (
            <button type="button" key={s} onClick={() => setFilterStatus(s)} style={{
              padding: "6px 14px", borderRadius: 20, border: "1px solid",
              borderColor: filterStatus === s ? "#4B7BEC" : "#E0E4EA",
              background: filterStatus === s ? "#EBF0FD" : "#fff",
              color: filterStatus === s ? "#4B7BEC" : "#6B7684",
              fontWeight: filterStatus === s ? 600 : 400, cursor: "pointer", fontSize: 13
            }}>{s} ({s === "전체" ? orders.length : counts[s]})</button>
          ))}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#6B7684", padding: "4px 8px", background: "#f1f3f5", borderRadius: 8 }}>
          <input type="checkbox" checked={hideCompleted} onChange={e => setHideCompleted(e.target.checked)} />
          완료 숨기기
        </label>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍  이름, 내용, 연락처 검색..."
        style={{ ...inputStyle, marginBottom: 12, background: "#F8F9FB" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#C5CBD5" }}>
            <div style={{ fontSize: 40 }}>📭</div>
            <p style={{ marginTop: 8 }}>
              {search || filterStatus !== "전체" ? "검색 결과가 없습니다" : "아직 주문이 없습니다. + 새 주문을 눌러보세요!"}
            </p>
          </div>
        ) : filtered.map(order => (
          <OrderCard key={order.id} order={order} onClick={() => { setSelected(order); setModal("detail"); }} />
        ))}
      </div>

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
    </div>
  );
}
