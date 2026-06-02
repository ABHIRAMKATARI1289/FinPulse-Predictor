import { useState, useEffect, useRef, useReducer } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ─── Google Fonts ───────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@300;400;500&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// ─── Global Styles ──────────────────────────────────────────────────────────
const globalStyle = document.createElement("style");
globalStyle.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Space Grotesk', sans-serif; background: #0A0E1A; color: #E5E7EB; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0A0E1A; }
  ::-webkit-scrollbar-thumb { background: #F59E0B44; border-radius: 3px; }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeLeft { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes fadeRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
  @keyframes countUp { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse { 0%,100% { opacity:1; transform:translateY(0); } 50% { opacity:0.5; transform:translateY(6px); } }
  @keyframes orbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes dotFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px #F59E0B33} 50%{box-shadow:0 0 40px #F59E0B88} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  .anim-fadeUp { animation: fadeUp 0.8s ease forwards; }
  .anim-fadeLeft { animation: fadeLeft 0.8s ease forwards; }
  .anim-fadeRight { animation: fadeRight 0.8s ease forwards; }
  .anim-scaleIn { animation: scaleIn 0.8s ease forwards; }
  .hidden-anim { opacity: 0; }
  .section-snap { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
  input, select, textarea {
    background: #0D1321; border: 1px solid #1E2A3A; color: #E5E7EB;
    border-radius: 6px; padding: 10px 14px; width: 100%; outline: none;
    font-family: 'IBM Plex Mono', monospace; font-size: 13px;
    transition: border-color 0.2s;
  }
  input:focus, select:focus { border-color: #F59E0B; }
  input[readonly] { color: #6B7280; cursor: not-allowed; }
  .btn-primary {
    background: #F59E0B; color: #0A0E1A; border: none; padding: 10px 24px;
    border-radius: 6px; font-family: 'Space Grotesk', sans-serif; font-weight: 600;
    font-size: 14px; cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px;
  }
  .btn-primary:hover { background: #FBBF24; transform: translateY(-1px); }
  .btn-primary:active { transform: scale(0.97); }
  .btn-ghost {
    background: transparent; color: #9CA3AF; border: 1px solid #1E2A3A;
    padding: 10px 24px; border-radius: 6px; font-family: 'Space Grotesk', sans-serif;
    font-size: 14px; cursor: pointer; transition: all 0.2s;
  }
  .btn-ghost:hover { border-color: #F59E0B44; color: #E5E7EB; }
  .card {
    background: #111827; border: 1px solid #1E2A3A; border-radius: 10px; padding: 20px;
  }
  .toast {
    position: fixed; bottom: 32px; right: 32px; background: #10B981;
    color: #fff; padding: 14px 24px; border-radius: 8px; font-weight: 500;
    z-index: 9999; animation: fadeUp 0.3s ease;
  }
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px); z-index: 1000; display: flex;
    align-items: center; justify-content: center;
  }
  .modal-box {
    background: #111827; border: 1px solid #1E2A3A; border-radius: 14px;
    padding: 32px; min-width: 340px; max-width: 520px; width: 90%;
    animation: scaleIn 0.25s ease;
  }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 12px; color: #6B7280; font-weight: 500;
    border-bottom: 1px solid #1E2A3A; font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    text-transform: uppercase; letter-spacing: 1px; }
  td { padding: 10px 12px; border-bottom: 1px solid #0D1321; }
  tr:hover td { background: #0D132144; }
  .pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 16px; border-radius: 999px; cursor: pointer;
    border: 1px solid #1E2A3A; font-size: 13px; transition: all 0.2s;
    white-space: nowrap; background: #111827;
  }
  .pill:hover { border-color: #F59E0B88; color: #F59E0B; }
  .pill.active { background: #F59E0B22; border-color: #F59E0B; color: #F59E0B; }
  .nav-link {
    color: #9CA3AF; text-decoration: none; font-size: 14px; font-weight: 500;
    padding: 6px 4px; transition: color 0.2s; cursor: pointer; letter-spacing: 0.3px;
  }
  .nav-link:hover, .nav-link.active { color: #F59E0B; }
  label { display: block; font-size: 11px; color: #6B7280; margin-bottom: 6px;
    font-family: 'IBM Plex Mono', monospace; letter-spacing: 1px; text-transform: uppercase; }
  .field-group { display: flex; flex-direction: column; gap: 4px; }
`;
document.head.appendChild(globalStyle);

// ─── Seed Data ──────────────────────────────────────────────────────────────
const SEED_CATEGORIES = [
  { id: "c1", name: "Electronics" },
  { id: "c2", name: "Mechanical" },
  { id: "c3", name: "Consumables" },
  { id: "c4", name: "Tools" },
  { id: "c5", name: "IT Equipment" },
  { id: "c6", name: "Chemicals" },
];

const SEED_ITEMS = [
  { id: "i1", categoryId: "c1", name: "Oscilloscope Probes", currentStock: 18, lastEntryDate: "2026-05-10" },
  { id: "i2", categoryId: "c1", name: "Soldering Iron 60W", currentStock: 5, lastEntryDate: "2026-05-08" },
  { id: "i3", categoryId: "c1", name: "Raspberry Pi 4 Module B", currentStock: 2, lastEntryDate: "2026-04-22" },
  { id: "i4", categoryId: "c2", name: "M3 Hex Bolts (100pcs)", currentStock: 220, lastEntryDate: "2026-05-01" },
  { id: "i5", categoryId: "c2", name: "Torque Wrench Set", currentStock: 7, lastEntryDate: "2026-04-18" },
  { id: "i6", categoryId: "c2", name: "Stainless Steel Washers", currentStock: 400, lastEntryDate: "2026-03-30" },
  { id: "i7", categoryId: "c3", name: "Kapton Tape (25mm)", currentStock: 14, lastEntryDate: "2026-05-15" },
  { id: "i8", categoryId: "c3", name: "Thermal Paste 50g", currentStock: 3, lastEntryDate: "2026-05-12" },
  { id: "i9", categoryId: "c3", name: "Isopropyl Alcohol 99%", currentStock: 8, lastEntryDate: "2026-05-14" },
  { id: "i10", categoryId: "c4", name: "Digital Multimeter", currentStock: 6, lastEntryDate: "2026-04-05" },
  { id: "i11", categoryId: "c5", name: "Cat6 Ethernet Cable 5m", currentStock: 30, lastEntryDate: "2026-04-28" },
  { id: "i12", categoryId: "c6", name: "Acetone 1L", currentStock: 1, lastEntryDate: "2026-05-07" },
];

const SEED_ENTRIES = [
  { id: "e1", itemId: "i1", categoryId: "c1", indentingOfficer: "Dr. R. Sharma", date: "2026-05-10", qtyReceived: 10, openingQty: 8, closingQty: 18 },
  { id: "e2", itemId: "i2", categoryId: "c1", indentingOfficer: "K. Venkatesh", date: "2026-05-08", qtyReceived: 3, openingQty: 2, closingQty: 5 },
  { id: "e3", itemId: "i4", categoryId: "c2", indentingOfficer: "Dr. R. Sharma", date: "2026-05-01", qtyReceived: 100, openingQty: 120, closingQty: 220 },
  { id: "e4", itemId: "i7", categoryId: "c3", indentingOfficer: "M. Krishnan", date: "2026-05-15", qtyReceived: 6, openingQty: 8, closingQty: 14 },
  { id: "e5", itemId: "i8", categoryId: "c3", indentingOfficer: "K. Venkatesh", date: "2026-05-12", qtyReceived: 2, openingQty: 1, closingQty: 3 },
  { id: "e6", itemId: "i9", categoryId: "c3", indentingOfficer: "Dr. R. Sharma", date: "2026-05-14", qtyReceived: 5, openingQty: 3, closingQty: 8 },
  { id: "e7", itemId: "i11", categoryId: "c5", indentingOfficer: "A. Pillai", date: "2026-04-28", qtyReceived: 20, openingQty: 10, closingQty: 30 },
  { id: "e8", itemId: "i3", categoryId: "c1", indentingOfficer: "M. Krishnan", date: "2026-04-22", qtyReceived: 2, openingQty: 0, closingQty: 2 },
];

const SEED_ISSUES = [
  { id: "iss1", itemId: "i1", categoryId: "c1", requestedBy: "S. Nair", approvedBy: "Dr. R. Sharma", date: "2026-05-20", qtyIssued: 2, openingQty: 20, closingQty: 18 },
  { id: "iss2", itemId: "i9", categoryId: "c3", requestedBy: "K. Venkatesh", approvedBy: "M. Krishnan", date: "2026-05-18", qtyIssued: 3, openingQty: 11, closingQty: 8 },
  { id: "iss3", itemId: "i4", categoryId: "c2", requestedBy: "A. Pillai", approvedBy: "Dr. R. Sharma", date: "2026-05-17", qtyIssued: 20, openingQty: 240, closingQty: 220 },
  { id: "iss4", itemId: "i10", categoryId: "c4", requestedBy: "T. Reddy", approvedBy: "K. Venkatesh", date: "2026-05-16", qtyIssued: 1, openingQty: 7, closingQty: 6 },
  { id: "iss5", itemId: "i7", categoryId: "c3", requestedBy: "S. Nair", approvedBy: "M. Krishnan", date: "2026-05-19", qtyIssued: 2, openingQty: 16, closingQty: 14 },
];

// ─── State Reducer ───────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.payload] };
    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.payload] };
    case "ADD_ENTRY": {
      const updatedItems = state.items.map(it =>
        it.id === action.payload.itemId
          ? { ...it, currentStock: action.payload.closingQty, lastEntryDate: action.payload.date }
          : it
      );
      return { ...state, entries: [...state.entries, action.payload], items: updatedItems };
    }
    case "ADD_ISSUE": {
      const updatedItems = state.items.map(it =>
        it.id === action.payload.itemId
          ? { ...it, currentStock: action.payload.closingQty }
          : it
      );
      return { ...state, issues: [...state.issues, action.payload], items: updatedItems };
    }
    default: return state;
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2, 9); }
function today() { return new Date().toISOString().slice(0, 10); }

function useScrollReveal(ref, animClass) {
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        ref.current.classList.remove("hidden-anim");
        ref.current.classList.add(animClass);
        obs.disconnect();
      }
    }, { threshold: 0.15 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  return <div className="toast">✓ {msg}</div>;
}

// ─── Dot Grid Background ─────────────────────────────────────────────────────
function DotGrid() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ opacity: 0.15 }}>
        <defs>
          <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#F59E0B" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>
  );
}

// ─── Orbit Ring ──────────────────────────────────────────────────────────────
function OrbitRing({ size = 400, style = {} }) {
  return (
    <div style={{ position: "absolute", pointerEvents: "none", ...style }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={size/2 - 20} fill="none" stroke="#F59E0B" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.25"
          style={{ transformOrigin: "center", animation: "orbitSpin 30s linear infinite" }} />
        <circle cx={size/2} cy={size/2} r={size/2 - 60} fill="none" stroke="#F59E0B" strokeWidth="0.3" opacity="0.15"
          style={{ transformOrigin: "center", animation: "orbitSpin 50s linear infinite reverse" }} />
      </svg>
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar({ page, setPage }) {
  const [showProfile, setShowProfile] = useState(false);
  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 60,
        background: "rgba(10,14,26,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1E2A3A", display: "flex", alignItems: "center",
        padding: "0 32px", zIndex: 500, gap: 32
      }}>
        {/* Logo */}
        <div onClick={() => setPage("home")} style={{
          cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flexShrink: 0
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", border: "2px solid #F59E0B",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#F59E0B", letterSpacing: 0.5, fontFamily: "'IBM Plex Mono'"
          }}>ISRO</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB", letterSpacing: 0.5 }}>URSC Store</span>
        </div>

        {/* Left nav links */}
        <div style={{ display: "flex", gap: 28, flex: 1 }}>
          {["entry", "issue", "reports"].map(p => (
            <span key={p} className={`nav-link ${page === p ? "active" : ""}`}
              onClick={() => setPage(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </span>
          ))}
        </div>

        {/* Right: profile */}
        <button onClick={() => setShowProfile(true)} style={{
          background: "#1E2A3A", border: "1px solid #2D3B4E", borderRadius: 8,
          color: "#E5E7EB", padding: "6px 16px", cursor: "pointer", fontSize: 13,
          display: "flex", alignItems: "center", gap: 8, fontFamily: "'Space Grotesk'"
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%", background: "#F59E0B22",
            border: "1px solid #F59E0B88", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 11, color: "#F59E0B", fontWeight: 700
          }}>RS</div>
          My Profile
        </button>
      </nav>

      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: "#F59E0B22",
                border: "2px solid #F59E0B", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 18, color: "#F59E0B", fontWeight: 700
              }}>RS</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Dr. R. Sharma</div>
                <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "'IBM Plex Mono'" }}>URSC001</div>
              </div>
            </div>
            {[["Department", "Propulsion & Control Systems"], ["Designation", "Senior Engineer – Store"], ["Location", "URSC, Bengaluru – 560 037"], ["Access Level", "Store Officer (Full Access)"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1E2A3A" }}>
                <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "'IBM Plex Mono'" }}>{k}</span>
                <span style={{ fontSize: 13, color: "#E5E7EB" }}>{v}</span>
              </div>
            ))}
            <button className="btn-ghost" style={{ marginTop: 20, width: "100%" }} onClick={() => setShowProfile(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── HOME PAGE ───────────────────────────────────────────────────────────────
function CountUp({ target, duration = 1800 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(prog * target));
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{val}</>;
}

function HomePage({ state, setPage }) {
  const heroRef = useRef(); const s2ref = useRef(); const s3ref = useRef(); const s4ref = useRef();
  useScrollReveal(s2ref, "anim-fadeLeft");
  useScrollReveal(s3ref, "anim-fadeRight");
  useScrollReveal(s4ref, "anim-scaleIn");

  const totalItems = state.items.reduce((s, i) => s + i.currentStock, 0);
  const todayStr = today();
  const entriesToday = state.entries.filter(e => e.date === todayStr).length;
  const issuesToday = state.issues.filter(i => i.date === todayStr).length;

  const sections = [
    {
      ref: s2ref, from: "left", page: "entry", label: "Material Entry",
      desc: "Log incoming materials with precision. Track every item from receipt to shelf — with automatic stock computation and audit-ready records.",
      bullets: ["Category Management", "Auto Stock Calculation", "Full Entry Logs"],
      color: "#F59E0B"
    },
    {
      ref: s3ref, from: "right", page: "issue", label: "Material Issue",
      desc: "Issue materials to personnel with full approval chain. System-computed closing quantities ensure zero manual errors.",
      bullets: ["Officer Approval Tracking", "Real-time Stock Deduction", "Issuance History"],
      color: "#10B981"
    },
    {
      ref: s4ref, from: "center", page: "reports", label: "Reports & Intelligence",
      desc: "Live dashboards, stock health indicators, and AI-generated executive insights — all in one place.",
      bullets: ["Visual Stock Charts", "AI Insight Reports", "CSV Export"],
      color: "#818CF8"
    }
  ];

  return (
    <div style={{ paddingTop: 60 }}>
      {/* Hero */}
      <div ref={heroRef} style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", position: "relative",
        overflow: "hidden", textAlign: "center", padding: "0 24px"
      }}>
        <DotGrid />
        <OrbitRing size={700} style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 720 }}>
          <div style={{
            display: "inline-block", padding: "4px 14px", borderRadius: 999,
            border: "1px solid #F59E0B44", color: "#F59E0B", fontSize: 11,
            fontFamily: "'IBM Plex Mono'", letterSpacing: 2, marginBottom: 28,
            background: "#F59E0B0A"
          }}>ISRO · URSC · BENGALURU</div>

          <h1 style={{
            fontSize: "clamp(36px, 5vw, 68px)", fontWeight: 700, lineHeight: 1.1,
            marginBottom: 20, letterSpacing: "-1px"
          }}>
            Precision Inventory.<br />
            <span style={{ color: "#F59E0B" }}>Mission Ready.</span>
          </h1>
          <p style={{ fontSize: 16, color: "#9CA3AF", lineHeight: 1.7, marginBottom: 52, maxWidth: 500, margin: "0 auto 52px" }}>
            URSC Bangalore — Store Management System.<br />
            Engineered for exactness. Built for space.
          </p>

          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
            {[
              { label: "Items in Store", value: totalItems },
              { label: "Entries Today", value: entriesToday },
              { label: "Issues Today", value: issuesToday }
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "#111827", border: "1px solid #1E2A3A", borderRadius: 12,
                padding: "20px 32px", minWidth: 140
              }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: "#F59E0B", fontFamily: "'IBM Plex Mono'" }}>
                  <CountUp target={value} />
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4, letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ color: "#F59E0B", fontSize: 12, letterSpacing: 2, fontFamily: "'IBM Plex Mono'",
            animation: "pulse 2s ease-in-out infinite" }}>
            ↓ SCROLL TO EXPLORE
          </div>
        </div>
      </div>

      {/* Module Sections */}
      {sections.map((sec, i) => (
        <div key={sec.page} style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "80px 40px", position: "relative", overflow: "hidden",
          background: i % 2 === 0 ? "#0D1321" : "#0A0E1A"
        }}>
          <DotGrid />
          <div ref={sec.ref} className="hidden-anim" style={{
            maxWidth: 680, position: "relative", zIndex: 1,
            textAlign: sec.from === "center" ? "center" : sec.from === "left" ? "left" : "right"
          }}>
            <div style={{
              display: "inline-block", width: 48, height: 3, background: sec.color,
              marginBottom: 24, borderRadius: 2
            }} />
            <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 700, marginBottom: 20, lineHeight: 1.15 }}>
              {sec.label}
            </h2>
            <p style={{ fontSize: 16, color: "#9CA3AF", lineHeight: 1.8, marginBottom: 36 }}>
              {sec.desc}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40,
              justifyContent: sec.from === "center" ? "center" : sec.from === "right" ? "flex-end" : "flex-start" }}>
              {sec.bullets.map(b => (
                <span key={b} style={{
                  padding: "6px 14px", borderRadius: 999, border: `1px solid ${sec.color}44`,
                  color: sec.color, fontSize: 12, fontFamily: "'IBM Plex Mono'", letterSpacing: 0.5
                }}>✦ {b}</span>
              ))}
            </div>
            <button className="btn-primary" style={{ background: sec.color, animation: "glowPulse 3s ease infinite" }}
              onClick={() => setPage(sec.page)}>
              Go to {sec.label} →
            </button>
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={{
        padding: "32px 40px", borderTop: "1px solid #1E2A3A", textAlign: "center",
        color: "#374151", fontSize: 12, fontFamily: "'IBM Plex Mono'", letterSpacing: 1
      }}>
        URSC BANGALORE · DEPARTMENT OF SPACE · GOVERNMENT OF INDIA<br />
        <span style={{ color: "#1E2A3A", fontSize: 11, marginTop: 6, display: "block" }}>
          Store DBMS v1.0 — Internal Use Only
        </span>
      </div>
    </div>
  );
}

// ─── ENTRY PAGE ──────────────────────────────────────────────────────────────
function EntryPage({ state, dispatch }) {
  const [catSearch, setCatSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState(null);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ indentingOfficer: "", date: today(), qtyReceived: "" });
  const [toast, setToast] = useState(null);
  const [newCatModal, setNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newItemModal, setNewItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  const cats = state.categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));
  const items = selectedCat ? state.items.filter(it =>
    it.categoryId === selectedCat.id && it.name.toLowerCase().includes(itemSearch.toLowerCase())
  ) : [];

  const openQty = selectedItem?.currentStock ?? 0;
  const closingQty = openQty + (parseInt(form.qtyReceived) || 0);

  const handleSave = async () => {
    if (!selectedItem || !form.qtyReceived || !form.indentingOfficer) return;
    const entry = {
      id: genId(), itemId: selectedItem.id, categoryId: selectedCat.id,
      indentingOfficer: form.indentingOfficer, date: form.date,
      qtyReceived: parseInt(form.qtyReceived), openingQty: openQty, closingQty
    };
    dispatch({ type: "ADD_ENTRY", payload: entry });
    // Sync to backend
    try { await fetch("http://localhost:4000/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) }); } catch {}
    setToast("Entry saved successfully");
    setSelectedItem(null); setForm({ indentingOfficer: "", date: today(), qtyReceived: "" });
  };

  const stockColor = (s) => s > 10 ? "#10B981" : s > 3 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", padding: "80px 32px 40px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "#F59E0B", fontFamily: "'IBM Plex Mono'", letterSpacing: 2, marginBottom: 8 }}>STORE MANAGEMENT</div>
          <h1 style={{ fontSize: 32, fontWeight: 700 }}>Material Entry</h1>
        </div>

        {/* Category Row */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "'IBM Plex Mono'", letterSpacing: 1 }}>SELECT CATEGORY</span>
            <div style={{ display: "flex", gap: 10 }}>
              <input placeholder="Search categories…" value={catSearch} onChange={e => setCatSearch(e.target.value)} style={{ width: 200 }} />
              <button className="btn-primary" style={{ whiteSpace: "nowrap", padding: "8px 16px", fontSize: 12 }} onClick={() => setNewCatModal(true)}>+ New Category</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
            {cats.map(c => (
              <div key={c.id} className={`pill ${selectedCat?.id === c.id ? "active" : ""}`}
                onClick={() => { setSelectedCat(c); setSelectedItem(null); setItemSearch(""); }}>
                {c.name}
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        {selectedCat && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "'IBM Plex Mono'", letterSpacing: 1 }}>
                ITEMS IN {selectedCat.name.toUpperCase()}
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <input placeholder="Search items…" value={itemSearch} onChange={e => setItemSearch(e.target.value)} style={{ width: 200 }} />
                <button className="btn-primary" style={{ whiteSpace: "nowrap", padding: "8px 16px", fontSize: 12 }} onClick={() => setNewItemModal(true)}>+ New Item</button>
              </div>
            </div>
            <table>
              <thead><tr><th>Item Name</th><th>Current Stock</th><th>Last Entry</th><th></th></tr></thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} style={{ cursor: "pointer" }} onClick={() => setSelectedItem(it)}>
                    <td>{it.name}</td>
                    <td><span style={{ color: stockColor(it.currentStock), fontFamily: "'IBM Plex Mono'", fontWeight: 600 }}>{it.currentStock}</span></td>
                    <td style={{ color: "#6B7280", fontFamily: "'IBM Plex Mono'", fontSize: 12 }}>{it.lastEntryDate}</td>
                    <td><span style={{ color: "#F59E0B", fontSize: 12, cursor: "pointer" }}>Add Entry →</span></td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "#4B5563", padding: 32 }}>No items found in this category.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Entry Form */}
        {selectedItem && (
          <div className="card" style={{ borderColor: "#F59E0B44", animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "#F59E0B", fontFamily: "'IBM Plex Mono'", letterSpacing: 2 }}>ENTRY FORM</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{selectedItem.name}</div>
              </div>
              <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 999, border: "1px solid #1E2A3A", color: "#9CA3AF", fontFamily: "'IBM Plex Mono'" }}>{selectedCat?.name}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field-group"><label>Date of Entry</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div className="field-group"><label>Indenting Officer</label><input placeholder="e.g. Dr. R. Sharma" value={form.indentingOfficer} onChange={e => setForm({ ...form, indentingOfficer: e.target.value })} /></div>
              <div className="field-group"><label>Quantity Received</label><input type="number" min={1} placeholder="Enter quantity" value={form.qtyReceived} onChange={e => setForm({ ...form, qtyReceived: e.target.value })} /></div>
              <div className="field-group"><label>Opening Quantity (System)</label><input readOnly value={openQty} /></div>
              <div className="field-group" style={{ gridColumn: "span 2" }}>
                <label>Closing Quantity (Auto-Computed)</label>
                <input readOnly value={closingQty} style={{ color: "#10B981", fontSize: 16, fontWeight: 600 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button className="btn-primary" onClick={handleSave}>Save Entry</button>
              <button className="btn-ghost" onClick={() => setSelectedItem(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* New Category Modal */}
      {newCatModal && (
        <div className="modal-overlay" onClick={() => setNewCatModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Add New Category</div>
            <div className="field-group" style={{ marginBottom: 20 }}>
              <label>Category Name</label>
              <input placeholder="e.g. Optical Components" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" onClick={() => {
                if (newCatName.trim()) {
                  dispatch({ type: "ADD_CATEGORY", payload: { id: genId(), name: newCatName.trim() } });
                  setNewCatName(""); setNewCatModal(false);
                }
              }}>Add Category</button>
              <button className="btn-ghost" onClick={() => setNewCatModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* New Item Modal */}
      {newItemModal && (
        <div className="modal-overlay" onClick={() => setNewItemModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Add New Item to {selectedCat?.name}</div>
            <div className="field-group" style={{ marginBottom: 20 }}>
              <label>Item Name</label>
              <input placeholder="e.g. Kapton Tape 50mm" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" onClick={() => {
                if (newItemName.trim() && selectedCat) {
                  dispatch({ type: "ADD_ITEM", payload: { id: genId(), categoryId: selectedCat.id, name: newItemName.trim(), currentStock: 0, lastEntryDate: today() } });
                  setNewItemName(""); setNewItemModal(false);
                }
              }}>Add Item</button>
              <button className="btn-ghost" onClick={() => setNewItemModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─── ISSUE PAGE ──────────────────────────────────────────────────────────────
function IssuePage({ state, dispatch }) {
  const [catSearch, setCatSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState(null);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ requestedBy: "", approvedBy: "", date: today(), qtyIssued: "" });
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  const cats = state.categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));
  const items = selectedCat ? state.items.filter(it =>
    it.categoryId === selectedCat.id && it.name.toLowerCase().includes(itemSearch.toLowerCase())
  ) : [];

  const openQty = selectedItem?.currentStock ?? 0;
  const qtyIssued = parseInt(form.qtyIssued) || 0;
  const closingQty = openQty - qtyIssued;
  const stockColor = (s) => s > 10 ? "#10B981" : s > 3 ? "#F59E0B" : "#EF4444";

  const handleSave = async () => {
    if (!selectedItem || !form.qtyIssued || !form.requestedBy || !form.approvedBy) return;
    if (qtyIssued > openQty) { setError("Quantity issued cannot exceed opening stock."); return; }
    const issue = {
      id: genId(), itemId: selectedItem.id, categoryId: selectedCat.id,
      requestedBy: form.requestedBy, approvedBy: form.approvedBy, date: form.date,
      qtyIssued, openingQty: openQty, closingQty
    };
    dispatch({ type: "ADD_ISSUE", payload: issue });
    try { await fetch("http://localhost:4000/api/issues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(issue) }); } catch {}
    setToast("Issue recorded successfully");
    setSelectedItem(null); setForm({ requestedBy: "", approvedBy: "", date: today(), qtyIssued: "" }); setError("");
  };

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", padding: "80px 32px 40px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "#10B981", fontFamily: "'IBM Plex Mono'", letterSpacing: 2, marginBottom: 8 }}>STORE MANAGEMENT</div>
          <h1 style={{ fontSize: 32, fontWeight: 700 }}>Material Issue</h1>
        </div>

        {/* Category Row */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "'IBM Plex Mono'", letterSpacing: 1 }}>SELECT CATEGORY</span>
            <input placeholder="Search categories…" value={catSearch} onChange={e => setCatSearch(e.target.value)} style={{ width: 220 }} />
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
            {cats.map(c => (
              <div key={c.id} className={`pill ${selectedCat?.id === c.id ? "active" : ""}`}
                onClick={() => { setSelectedCat(c); setSelectedItem(null); setItemSearch(""); }}>
                {c.name}
              </div>
            ))}
          </div>
        </div>

        {selectedCat && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "'IBM Plex Mono'", letterSpacing: 1 }}>
                ITEMS IN {selectedCat.name.toUpperCase()}
              </span>
              <input placeholder="Search items…" value={itemSearch} onChange={e => setItemSearch(e.target.value)} style={{ width: 220 }} />
            </div>
            <table>
              <thead><tr><th>Item Name</th><th>Current Stock</th><th>Last Entry</th><th></th></tr></thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedItem(it); setError(""); }}>
                    <td>{it.name}</td>
                    <td><span style={{ color: stockColor(it.currentStock), fontFamily: "'IBM Plex Mono'", fontWeight: 600 }}>{it.currentStock}</span></td>
                    <td style={{ color: "#6B7280", fontFamily: "'IBM Plex Mono'", fontSize: 12 }}>{it.lastEntryDate}</td>
                    <td><span style={{ color: "#10B981", fontSize: 12 }}>Issue →</span></td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "#4B5563", padding: 32 }}>No items in this category.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {selectedItem && (
          <div className="card" style={{ borderColor: "#10B98144", animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "#10B981", fontFamily: "'IBM Plex Mono'", letterSpacing: 2 }}>ISSUE FORM</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{selectedItem.name}</div>
              </div>
              <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 999, border: "1px solid #1E2A3A", color: "#9CA3AF", fontFamily: "'IBM Plex Mono'" }}>{selectedCat?.name}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field-group"><label>Date of Issue</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div className="field-group"><label>Requested By</label><input placeholder="e.g. S. Nair" value={form.requestedBy} onChange={e => setForm({ ...form, requestedBy: e.target.value })} /></div>
              <div className="field-group"><label>Approved By</label><input placeholder="e.g. Dr. R. Sharma" value={form.approvedBy} onChange={e => setForm({ ...form, approvedBy: e.target.value })} /></div>
              <div className="field-group">
                <label>Quantity Issued</label>
                <input type="number" min={1} placeholder="Enter quantity" value={form.qtyIssued}
                  onChange={e => { setForm({ ...form, qtyIssued: e.target.value }); setError(""); }}
                  style={{ borderColor: error ? "#EF4444" : undefined }} />
                {error && <span style={{ color: "#EF4444", fontSize: 11, fontFamily: "'IBM Plex Mono'", marginTop: 4 }}>⚠ {error}</span>}
              </div>
              <div className="field-group"><label>Opening Quantity (System)</label><input readOnly value={openQty} /></div>
              <div className="field-group">
                <label>Closing Quantity (Auto-Computed)</label>
                <input readOnly value={closingQty < 0 ? "—" : closingQty}
                  style={{ color: closingQty <= 3 ? "#EF4444" : "#10B981", fontWeight: 600, fontSize: 16 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button className="btn-primary" style={{ background: "#10B981" }} onClick={handleSave}>Save Issue</button>
              <button className="btn-ghost" onClick={() => { setSelectedItem(null); setError(""); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─── REPORTS PAGE ────────────────────────────────────────────────────────────
function ReportsPage({ state }) {
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [sortCol, setSortCol] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [search, setSearch] = useState("");

  const totalQty = state.items.reduce((s, i) => s + i.currentStock, 0);
  const kpis = [
    { label: "Total Items Tracked", val: state.items.length, color: "#F59E0B" },
    { label: "Total Qty in Store", val: totalQty, color: "#818CF8" },
    { label: "Total Entries", val: state.entries.length, color: "#10B981" },
    { label: "Total Issues", val: state.issues.length, color: "#EF4444" },
  ];

  const stockColor = (s) => s > 10 ? "#10B981" : s > 3 ? "#F59E0B" : "#EF4444";

  // Stock table data
  const stockData = state.items
    .filter(it => (filterCat === "all" || it.categoryId === filterCat) && it.name.toLowerCase().includes(search.toLowerCase()))
    .map(it => {
      const cat = state.categories.find(c => c.id === it.categoryId);
      const totalReceived = state.entries.filter(e => e.itemId === it.id).reduce((s, e) => s + e.qtyReceived, 0);
      const totalIssued = state.issues.filter(i => i.itemId === it.id).reduce((s, i) => s + i.qtyIssued, 0);
      const openingStock = it.currentStock - totalReceived + totalIssued;
      return { ...it, catName: cat?.name ?? "—", totalReceived, totalIssued, openingStock };
    })
    .sort((a, b) => {
      const aVal = a[sortCol] ?? ""; const bVal = b[sortCol] ?? "";
      return sortAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  // Chart data
  const barData = state.categories.map(c => ({
    name: c.name.slice(0, 8),
    Stock: state.items.filter(i => i.categoryId === c.id).reduce((s, i) => s + i.currentStock, 0)
  }));

  const dateMap = {};
  [...state.entries, ...state.issues].forEach(r => {
    if (!dateMap[r.date]) dateMap[r.date] = { date: r.date, Entries: 0, Issues: 0 };
    if (r.qtyReceived !== undefined) dateMap[r.date].Entries++;
    else dateMap[r.date].Issues++;
  });
  const lineData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-12);

  const handleAiInsight = async () => {
    setAiLoading(true); setAiInsight("");
    const payload = {
      items: state.items, entries: state.entries, issues: state.issues,
      categories: state.categories
    };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are the intelligence system for ISRO URSC's internal store. Analyze this inventory data and generate a concise executive report. Identify: critically low items (stock < 3), high movement categories, procurement recommendations, and any anomalies. Keep it precise, professional, and under 300 words. Use the format: [STATUS], [LOW STOCK ALERTS], [CATEGORY INSIGHTS], [RECOMMENDATIONS].
            
Data: ${JSON.stringify(payload)}`
          }]
        })
      });
      const data = await res.json();
      setAiInsight(data.content?.[0]?.text || "Unable to generate report.");
    } catch { setAiInsight("Could not connect to AI service. Please ensure the API key is configured."); }
    setAiLoading(false);
  };

  const exportCSV = () => {
    const header = "Category,Item,Opening Stock,Total Received,Total Issued,Current Stock\n";
    const rows = stockData.map(r => `${r.catName},${r.name},${r.openingStock},${r.totalReceived},${r.totalIssued},${r.currentStock}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ursc_stock_${today()}.csv`; a.click();
  };

  const SortTh = ({ col, label }) => (
    <th onClick={() => { if (sortCol === col) setSortAsc(!sortAsc); else { setSortCol(col); setSortAsc(true); } }}
      style={{ cursor: "pointer", userSelect: "none" }}>
      {label} {sortCol === col ? (sortAsc ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", padding: "80px 32px 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "#818CF8", fontFamily: "'IBM Plex Mono'", letterSpacing: 2, marginBottom: 8 }}>INTELLIGENCE DASHBOARD</div>
          <h1 style={{ fontSize: 32, fontWeight: 700 }}>Reports</h1>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {kpis.map(({ label, val, color }) => (
            <div key={label} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 700, color, fontFamily: "'IBM Plex Mono'" }}>{val}</div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 6, letterSpacing: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          <div className="card">
            <div style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'IBM Plex Mono'", marginBottom: 16, letterSpacing: 1 }}>STOCK BY CATEGORY</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E2A3A", borderRadius: 8 }} />
                <Bar dataKey="Stock" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'IBM Plex Mono'", marginBottom: 16, letterSpacing: 1 }}>ENTRIES VS ISSUES OVER TIME</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 10 }} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E2A3A", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="Entries" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B", r: 4 }} />
                <Line type="monotone" dataKey="Issues" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Table */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'IBM Plex Mono'", letterSpacing: 1 }}>STOCK LEVELS</span>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180 }} />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 160 }}>
                <option value="all">All Categories</option>
                {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="btn-ghost" style={{ padding: "8px 16px", fontSize: 12 }} onClick={exportCSV}>↓ Export CSV</button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr>
                <SortTh col="catName" label="Category" />
                <SortTh col="name" label="Item" />
                <SortTh col="openingStock" label="Opening Stock" />
                <SortTh col="totalReceived" label="Total Received" />
                <SortTh col="totalIssued" label="Total Issued" />
                <SortTh col="currentStock" label="Current Stock" />
              </tr></thead>
              <tbody>
                {stockData.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: "#9CA3AF" }}>{r.catName}</td>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td style={{ fontFamily: "'IBM Plex Mono'" }}>{r.openingStock}</td>
                    <td style={{ fontFamily: "'IBM Plex Mono'", color: "#F59E0B" }}>+{r.totalReceived}</td>
                    <td style={{ fontFamily: "'IBM Plex Mono'", color: "#EF4444" }}>-{r.totalIssued}</td>
                    <td>
                      <span style={{
                        color: stockColor(r.currentStock), fontFamily: "'IBM Plex Mono'", fontWeight: 700,
                        padding: "3px 10px", background: stockColor(r.currentStock) + "18", borderRadius: 999
                      }}>{r.currentStock}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Entry History */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'IBM Plex Mono'", marginBottom: 16, letterSpacing: 1 }}>ENTRY HISTORY LOG</div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Date</th><th>Category</th><th>Item</th><th>Qty Received</th><th>Indenting Officer</th><th>Opening</th><th>Closing</th></tr></thead>
              <tbody>
                {[...state.entries].reverse().map(e => {
                  const it = state.items.find(i => i.id === e.itemId);
                  const cat = state.categories.find(c => c.id === e.categoryId);
                  return (
                    <tr key={e.id}>
                      <td style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: "#6B7280" }}>{e.date}</td>
                      <td style={{ color: "#9CA3AF" }}>{cat?.name}</td>
                      <td>{it?.name}</td>
                      <td style={{ color: "#F59E0B", fontFamily: "'IBM Plex Mono'", fontWeight: 600 }}>+{e.qtyReceived}</td>
                      <td style={{ color: "#9CA3AF" }}>{e.indentingOfficer}</td>
                      <td style={{ fontFamily: "'IBM Plex Mono'" }}>{e.openingQty}</td>
                      <td style={{ fontFamily: "'IBM Plex Mono'", color: "#10B981" }}>{e.closingQty}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Issue History */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'IBM Plex Mono'", marginBottom: 16, letterSpacing: 1 }}>ISSUE HISTORY LOG</div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Date</th><th>Category</th><th>Item</th><th>Qty Issued</th><th>Requested By</th><th>Approved By</th><th>Opening</th><th>Closing</th></tr></thead>
              <tbody>
                {[...state.issues].reverse().map(iss => {
                  const it = state.items.find(i => i.id === iss.itemId);
                  const cat = state.categories.find(c => c.id === iss.categoryId);
                  return (
                    <tr key={iss.id}>
                      <td style={{ fontFamily: "'IBM Plex Mono'", fontSize: 12, color: "#6B7280" }}>{iss.date}</td>
                      <td style={{ color: "#9CA3AF" }}>{cat?.name}</td>
                      <td>{it?.name}</td>
                      <td style={{ color: "#EF4444", fontFamily: "'IBM Plex Mono'", fontWeight: 600 }}>-{iss.qtyIssued}</td>
                      <td style={{ color: "#9CA3AF" }}>{iss.requestedBy}</td>
                      <td style={{ color: "#9CA3AF" }}>{iss.approvedBy}</td>
                      <td style={{ fontFamily: "'IBM Plex Mono'" }}>{iss.openingQty}</td>
                      <td style={{ fontFamily: "'IBM Plex Mono'", color: "#EF4444" }}>{iss.closingQty}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insight */}
        <div className="card" style={{ border: "1px solid #818CF844", animation: "glowPulse 4s ease infinite" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "#818CF8", fontFamily: "'IBM Plex Mono'", letterSpacing: 2 }}>INTELLIGENCE BRIEF</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>AI-Powered Inventory Analysis</div>
            </div>
            <button className="btn-primary" style={{ background: "#818CF8", fontSize: 12 }}
              onClick={handleAiInsight} disabled={aiLoading}>
              {aiLoading ? "Analysing…" : "Generate Insight Report ✦"}
            </button>
          </div>
          {aiLoading && (
            <div style={{ padding: "32px 0", textAlign: "center", color: "#818CF8", fontFamily: "'IBM Plex Mono'", fontSize: 13 }}>
              <div style={{ animation: "pulse 1.5s ease infinite" }}>◈ Processing inventory data…</div>
            </div>
          )}
          {aiInsight && !aiLoading && (
            <div style={{
              background: "#0A0E1A", border: "1px solid #1E2A3A", borderRadius: 8,
              padding: 20, fontFamily: "'IBM Plex Mono'", fontSize: 13, lineHeight: 1.8,
              color: "#C9D1D9", whiteSpace: "pre-wrap"
            }}>
              <div style={{ color: "#818CF8", fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>
                URSC BANGALORE · AI STORE INTELLIGENCE · {today()}
              </div>
              {aiInsight}
            </div>
          )}
          {!aiInsight && !aiLoading && (
            <div style={{ padding: "20px 0", color: "#374151", fontFamily: "'IBM Plex Mono'", fontSize: 13, textAlign: "center" }}>
              Click "Generate Insight Report" to run AI analysis on current inventory.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [id, setId] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState("");
  const handleLogin = () => {
    if (id === "URSC001" && pw === "isro@123") onLogin();
    else setErr("Invalid Employee ID or Password.");
  };
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <video autoPlay loop muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}>
        <source src="https://res.cloudinary.com/dfonotyfb/video/upload/v1775585556/dds3_1_rqhg7x.mp4" type="video/mp4" />
      </video>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1 }} />
      <div style={{
        position: "relative", zIndex: 2, background: "rgba(17,24,39,0.75)",
        backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: "48px 40px", minWidth: 360, maxWidth: 420, width: "90%",
        animation: "scaleIn 0.5s ease"
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", border: "2px solid #F59E0B",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#F59E0B", margin: "0 auto 16px",
            fontFamily: "'IBM Plex Mono'"
          }}>ISRO</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>URSC Store Management</h1>
          <p style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'IBM Plex Mono'", letterSpacing: 1 }}>DEPARTMENT OF SPACE · GOVERNMENT OF INDIA</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field-group">
            <label>Employee ID</label>
            <input placeholder="e.g. URSC001" value={id} onChange={e => setId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          <div className="field-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          {err && <div style={{ color: "#EF4444", fontSize: 12, fontFamily: "'IBM Plex Mono'" }}>⚠ {err}</div>}
          <button className="btn-primary" style={{ marginTop: 8, padding: "14px", fontSize: 15, letterSpacing: 1, animation: "glowPulse 3s ease infinite" }}
            onClick={handleLogin}>AUTHENTICATE →</button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#374151", marginTop: 24, fontFamily: "'IBM Plex Mono'" }}>
          INTERNAL USE ONLY · URSC BANGALORE
        </p>
      </div>
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("home");
  const [state, dispatch] = useReducer(reducer, {
    categories: SEED_CATEGORIES,
    items: SEED_ITEMS,
    entries: SEED_ENTRIES,
    issues: SEED_ISSUES,
  });

  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;

  return (
    <div>
      <Navbar page={page} setPage={setPage} />
      {page === "home" && <HomePage state={state} setPage={setPage} />}
      {page === "entry" && <EntryPage state={state} dispatch={dispatch} />}
      {page === "issue" && <IssuePage state={state} dispatch={dispatch} />}
      {page === "reports" && <ReportsPage state={state} />}
    </div>
  );
}
