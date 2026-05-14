import { useState, useEffect, useRef } from "react";
import "./App.css";

const STATUS = {
  접수: { label: "접수", color: "#4B7BEC", bg: "#EBF0FD" },
  제작중: { label: "제작중", color: "#F7B731", bg: "#FEF8EA" },
  완성: { label: "완성", color: "#20bf6b", bg: "#E8FDF2" },
  배송완료: { label: "배송완료", color: "#A0ADB4", bg: "#F2F4F5" },
};

const PLATFORMS = ["카카오 비즈니스센터", "스마트스토어", "위벨롭먼트", "가맹점", "쿠팡", "직접방문", "기타"];

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

function ImageUploader({ images, onChange }) {
  const ref = useRef();
  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => onChange(prev => [...prev, { id: generateId(), src: e.target.result, name: file.name }]);
      reader.readAsDataURL(file);
    });
  };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {images.map((img) => (
          <div key={img.id} style={{ position: "relative" }}>
            <img src={img.src} alt={img.name} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #E0E4EA" }} />
            <button
              type="button"
              onClick={() => onChange(images.filter(i => i.id !== img.id))}
              style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#E24B4A", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => ref.current.click()} style={{
          width: 72, height: 72, borderRadius: 8, border: "2px dashed #C5CBD5",
          background: "#F8F9FB", cursor: "pointer", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 2, color: "#8A93A0", fontSize: 11
        }}>
          <span style={{ fontSize: 22 }}>+</span>
          <span>이미지</span>
        </button>
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

function OrderForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    customerName: "", platform: "카카오톡", contact: "",
    description: "", price: "", deadline: "",
    status: "접수", notes: "", images: [], createdAt: new Date().toISOString()
  });
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
          <input value={form.contact} onChange={e => set("contact", e.target.value)}
            placeholder="@username 또는 010-xxxx-xxxx" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>금액 (원)</label>
          <input value={form.price} onChange={e => set("price", e.target.value)}
            placeholder="150000" type="number" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>납기일</label>
          <input value={form.deadline} onChange={e => set("deadline", e.target.value)}
            type="date" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>상태</label>
          <select value={form.status} onChange={e => set("status", e.target.value)} style={inputStyle}>
            {Object.keys(STATUS).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>주문 내용 *</label>
        <textarea value={form.description} onChange={e => set("description", e.target.value)}
          placeholder="피규어 내용, 크기, 소재 등 상세 내용..." rows={3}
          style={{ ...inputStyle, resize: "vertical" }} />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>참고 이미지</label>
        <ImageUploader images={form.images || []} onChange={imgs => set("images", typeof imgs === "function" ? imgs(form.images) : imgs)} />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "#6B7684", display: "block", marginBottom: 4 }}>메모</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="특이사항, 요청사항 등..." rows={2}
          style={{ ...inputStyle, resize: "vertical" }} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={btnSecondary}>취소</button>
        <button type="button" onClick={() => {
          if (!form.customerName.trim() || !form.description.trim()) {
            alert("고객명과 주문 내용은 필수입니다.");
            return;
          }
          onSave(form);
        }} style={btnPrimary}>저장</button>
      </div>
    </div>
  );
}

function OrderCard({ order, onClick }) {
  const thumb = order.images?.[0];
  const overdue = order.deadline && new Date(order.deadline) < new Date() && order.status !== "배송완료";
  return (
    <div onClick={onClick} className="order-card">
      {thumb ? (
        <img src={thumb.src} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 56, height: 56, borderRadius: 8, background: "#F2F4F6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎨</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{order.customerName}</span>
          <StatusBadge status={order.status} />
          {overdue && <span style={{ fontSize: 11, color: "#E24B4A", fontWeight: 600 }}>⚠ 기한초과</span>}
        </div>
        <p style={{ fontSize: 13, color: "#6B7684", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.description}</p>
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <span style={{ fontSize: 12, color: "#A0ADB4" }}>{order.platform}</span>
          {order.deadline && <span style={{ fontSize: 12, color: overdue ? "#E24B4A" : "#A0ADB4" }}>납기 {formatDate(order.deadline)}</span>}
          {order.price && <span style={{ fontSize: 12, color: "#4B7BEC", fontWeight: 500 }}>{Number(order.price).toLocaleString()}원</span>}
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {order.images.map(img => (
              <img key={img.id} src={img.src} alt="" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, border: "1px solid #E0E4EA" }} />
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
            ["금액", order.price ? `${Number(order.price).toLocaleString()}원` : "—"],
            ["납기일", formatDate(order.deadline) || "—"],
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
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem("figure_orders");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("전체");
  const [search, setSearch] = useState("");

  useEffect(() => {
    try { localStorage.setItem("figure_orders", JSON.stringify(orders)); } catch {}
  }, [orders]);

  const addOrder = (form) => {
    const newOrder = { ...form, id: generateId(), createdAt: new Date().toISOString() };
    setOrders(prev => [newOrder, ...prev]);
    setModal(null);
  };

  const updateOrder = (form) => {
    const updated = { ...form, id: selected.id, createdAt: selected.createdAt };
    setOrders(prev => prev.map(o => o.id === selected.id ? updated : o));
    setSelected(updated);
    setModal("detail");
  };

  const deleteOrder = () => {
    setOrders(prev => prev.filter(o => o.id !== selected.id));
    setModal(null);
    setSelected(null);
  };

  const changeStatus = (status) => {
    setOrders(prev => prev.map(o => o.id === selected.id ? { ...o, status } : o));
    setSelected(s => ({ ...s, status }));
  };

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === "전체" || o.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || o.customerName.toLowerCase().includes(q) ||
      o.description.toLowerCase().includes(q) || (o.contact || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = Object.keys(STATUS).reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  const totalRevenue = orders
    .filter(o => o.status !== "배송완료")
    .reduce((s, o) => s + (Number(o.price) || 0), 0);

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

      {totalRevenue > 0 && (
        <div style={{ background: "#EBF0FD", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#4B7BEC" }}>💰 진행 중 예상 매출</span>
          <span style={{ fontWeight: 700, color: "#4B7BEC", fontSize: 15 }}>{totalRevenue.toLocaleString()}원</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
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
        <Modal title="새 주문 추가" onClose={() => setModal(null)}>
          <OrderForm onSave={addOrder} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal === "edit" && selected && (
        <Modal title="주문 수정" onClose={() => setModal("detail")}>
          <OrderForm initial={selected} onSave={updateOrder} onCancel={() => setModal("detail")} />
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
