import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Cell, PieChart, Pie, Legend,
} from "recharts";

// ─── Config ──────────────────────────────────────────────────────────────────
// Change this to your deployed backend URL
const API_BASE = "https://churnsight-backend.onrender.com";

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      "#0D1117",
  surface: "#161B22",
  border:  "#21262D",
  accent:  "#58A6FF",
  danger:  "#F85149",
  warn:    "#D29922",
  success: "#3FB950",
  muted:   "#8B949E",
  text:    "#E6EDF3",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const riskColor = (r) =>
  r === "High" ? C.danger : r === "Medium" ? C.warn : C.success;

const gauge = (prob) => {
  const pct = Math.round(prob * 100);
  const col = prob >= 0.7 ? C.danger : prob >= 0.4 ? C.warn : C.success;
  const circ = 2 * Math.PI * 45;
  const dash = circ * prob;
  return { pct, col, circ, dash };
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: 24, ...style,
  }}>{children}</div>
);

const Badge = ({ text, color }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}55`,
    borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700,
  }}>{text}</span>
);

const Input = ({ label, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {label}
    </label>
    <input {...props} style={{
      background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: "8px 12px", color: C.text, fontSize: 14, outline: "none",
      ...props.style,
    }} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {label}
    </label>
    <select {...props} style={{
      background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: "8px 12px", color: C.text, fontSize: 14, outline: "none",
    }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  </div>
);

const Btn = ({ children, onClick, variant = "primary", disabled, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: variant === "primary" ? C.accent : "transparent",
      color:      variant === "primary" ? C.bg      : C.accent,
      border:     `1px solid ${C.accent}`,
      borderRadius: 8, padding: "10px 20px", fontSize: 14,
      fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, ...style,
    }}
  >{children}</button>
);

// ─── Nav ──────────────────────────────────────────────────────────────────────
const TABS = ["Predict", "Bulk Upload", "Analytics", "AI Chat"];

function Nav({ tab, setTab }) {
  return (
    <nav style={{
      background: C.surface, borderBottom: `1px solid ${C.border}`,
      padding: "0 32px", display: "flex", alignItems: "center", gap: 32,
      height: 56, position: "sticky", top: 0, zIndex: 100,
    }}>
      <span style={{ color: C.accent, fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>
        ChurnSight<span style={{ color: C.muted }}>AI</span>
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background:  "transparent",
            color:       tab === t ? C.accent : C.muted,
            border:      "none",
            borderBottom: tab === t ? `2px solid ${C.accent}` : "2px solid transparent",
            padding:     "16px 16px 14px",
            fontSize:    14, fontWeight: 600, cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>
    </nav>
  );
}

// ─── Predict Tab ──────────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  gender: "Male", SeniorCitizen: 0, Partner: "No", Dependents: "No",
  tenure: 12, PhoneService: "Yes", InternetService: "DSL",
  OnlineSecurity: "No", TechSupport: "No", StreamingTV: "No",
  Contract: "Month-to-month", PaymentMethod: "Electronic check",
  MonthlyCharges: 65, TotalCharges: 780,
};

function PredictTab() {
  const [form, setForm]     = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const predict = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          SeniorCitizen:  Number(form.SeniorCitizen),
          tenure:         Number(form.tenure),
          MonthlyCharges: Number(form.MonthlyCharges),
          TotalCharges:   Number(form.TotalCharges),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e) {
      setError(e.message || "API error. Is the backend running?");
    }
    setLoading(false);
  };

  const g = result ? gauge(result.churn_probability) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: 32 }}>
      {/* Form */}
      <Card>
        <h2 style={{ color: C.text, marginBottom: 20, fontSize: 18, fontWeight: 700 }}>
          Customer Profile
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Select label="Gender" value={form.gender} onChange={e => set("gender", e.target.value)}
            options={["Male", "Female"]} />
          <Select label="Senior Citizen" value={form.SeniorCitizen}
            onChange={e => set("SeniorCitizen", Number(e.target.value))}
            options={[0, 1]} />
          <Select label="Partner" value={form.Partner} onChange={e => set("Partner", e.target.value)}
            options={["Yes", "No"]} />
          <Select label="Dependents" value={form.Dependents} onChange={e => set("Dependents", e.target.value)}
            options={["Yes", "No"]} />
          <Input label="Tenure (months)" type="number" value={form.tenure}
            onChange={e => set("tenure", e.target.value)} />
          <Select label="Phone Service" value={form.PhoneService}
            onChange={e => set("PhoneService", e.target.value)} options={["Yes", "No"]} />
          <Select label="Internet Service" value={form.InternetService}
            onChange={e => set("InternetService", e.target.value)}
            options={["DSL", "Fiber optic", "No"]} />
          <Select label="Online Security" value={form.OnlineSecurity}
            onChange={e => set("OnlineSecurity", e.target.value)}
            options={["Yes", "No", "No internet"]} />
          <Select label="Tech Support" value={form.TechSupport}
            onChange={e => set("TechSupport", e.target.value)}
            options={["Yes", "No", "No internet"]} />
          <Select label="Contract" value={form.Contract}
            onChange={e => set("Contract", e.target.value)}
            options={["Month-to-month", "One year", "Two year"]} />
          <Select label="Payment Method" value={form.PaymentMethod}
            onChange={e => set("PaymentMethod", e.target.value)}
            options={["Electronic check", "Mailed check", "Bank transfer", "Credit card"]} />
          <Input label="Monthly Charges ($)" type="number" value={form.MonthlyCharges}
            onChange={e => set("MonthlyCharges", e.target.value)} />
        </div>
        <Btn onClick={predict} disabled={loading} style={{ marginTop: 20, width: "100%" }}>
          {loading ? "Predicting…" : "Predict Churn"}
        </Btn>
        {error && <p style={{ color: C.danger, marginTop: 12, fontSize: 13 }}>⚠ {error}</p>}
      </Card>

      {/* Result */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {result ? (
          <>
            <Card style={{ textAlign: "center" }}>
              <svg width="140" height="140" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke={C.border} strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none"
                  stroke={g.col} strokeWidth="8"
                  strokeDasharray={`${g.dash} ${g.circ}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)" />
                <text x="50" y="46" textAnchor="middle" fill={g.col} fontSize="20" fontWeight="bold">
                  {g.pct}%
                </text>
                <text x="50" y="62" textAnchor="middle" fill={C.muted} fontSize="9">
                  CHURN PROBABILITY
                </text>
              </svg>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 12 }}>
                <Badge text={result.prediction} color={result.prediction === "Churn" ? C.danger : C.success} />
                <Badge text={`${result.risk_level} Risk`} color={riskColor(result.risk_level)} />
              </div>
            </Card>

            <Card>
              <h3 style={{ color: C.text, fontSize: 15, marginBottom: 12, fontWeight: 700 }}>
                💡 Recommendations
              </h3>
              {result.recommendations.map((r, i) => (
                <div key={i} style={{
                  padding: "8px 12px", borderRadius: 8, marginBottom: 8,
                  background: C.accent + "11", border: `1px solid ${C.accent}33`,
                  color: C.text, fontSize: 13,
                }}>→ {r}</div>
              ))}
            </Card>

            <Card>
              <h3 style={{ color: C.text, fontSize: 15, marginBottom: 12, fontWeight: 700 }}>
                🔍 Key Factors
              </h3>
              {result.top_factors.map((f, i) => (
                <div key={f} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "6px 0", borderBottom: `1px solid ${C.border}`,
                  color: C.muted, fontSize: 13,
                }}>
                  <span style={{ color: C.text }}>{f}</span>
                  <span style={{ color: C.accent }}>#{i + 1}</span>
                </div>
              ))}
            </Card>
          </>
        ) : (
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "center",
            height: "100%", minHeight: 300 }}>
            <div style={{ textAlign: "center", color: C.muted }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <p>Fill in the customer profile and click Predict</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Bulk Upload Tab ──────────────────────────────────────────────────────────
function BulkTab() {
  const [file, setFile]       = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const inputRef              = useRef();

  const upload = async () => {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/predict-bulk`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const pieData = result
    ? Object.entries(result.risk_summary).map(([k, v]) => ({
        name: k, value: v,
        fill: k === "High" ? C.danger : k === "Medium" ? C.warn : C.success,
      }))
    : [];

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ color: C.text, marginBottom: 16, fontSize: 18, fontWeight: 700 }}>
          Bulk Churn Prediction
        </h2>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
          Upload a CSV with columns: gender, SeniorCitizen, Partner, Dependents, tenure,
          PhoneService, InternetService, OnlineSecurity, TechSupport, StreamingTV,
          Contract, PaymentMethod, MonthlyCharges, TotalCharges
        </p>
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${C.accent}55`, borderRadius: 12, padding: "40px 24px",
            textAlign: "center", cursor: "pointer", marginBottom: 16,
            background: file ? C.accent + "0A" : "transparent",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <p style={{ color: file ? C.accent : C.muted, fontSize: 14 }}>
            {file ? file.name : "Click to select CSV file"}
          </p>
          <input ref={inputRef} type="file" accept=".csv"
            onChange={e => setFile(e.target.files[0])} style={{ display: "none" }} />
        </div>
        <Btn onClick={upload} disabled={!file || loading}>
          {loading ? "Processing…" : "Run Bulk Prediction"}
        </Btn>
        {error && <p style={{ color: C.danger, marginTop: 12, fontSize: 13 }}>⚠ {error}</p>}
      </Card>

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <Card>
            <h3 style={{ color: C.text, fontSize: 16, marginBottom: 16, fontWeight: 700 }}>
              Summary
            </h3>
            <div style={{ fontSize: 36, fontWeight: 800, color: C.accent, marginBottom: 4 }}>
              {result.total_customers}
            </div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Total Customers</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.warn }}>
              {Math.round(result.average_churn_probability * 100)}%
            </div>
            <div style={{ color: C.muted, fontSize: 13 }}>Avg Churn Probability</div>
          </Card>
          <Card>
            <h3 style={{ color: C.text, fontSize: 16, marginBottom: 8, fontWeight: 700 }}>
              Risk Distribution
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={60}
                  dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: C.muted }}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ color: C.text, fontSize: 16, marginBottom: 12, fontWeight: 700 }}>
              High Risk Customers
            </h3>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Customer ID", "Churn Probability", "Risk Level"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left",
                        color: C.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.predictions
                    .filter(p => p.risk_level === "High")
                    .slice(0, 30)
                    .map((p, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}22` }}>
                        <td style={{ padding: "8px 12px", color: C.text }}>{p.customerID}</td>
                        <td style={{ padding: "8px 12px", color: C.danger, fontWeight: 700 }}>
                          {Math.round(p.churn_probability * 100)}%
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <Badge text={p.risk_level} color={riskColor(p.risk_level)} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/analytics`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 32, color: C.muted, textAlign: "center" }}>Loading analytics…</div>
  );
  if (!data) return (
    <div style={{ padding: 32, color: C.danger, textAlign: "center" }}>
      Could not load analytics. Is the backend running?
    </div>
  );

  const fiData = Object.entries(data.feature_importance)
    .slice(0, 8)
    .map(([k, v]) => ({ name: k, importance: +(v * 100).toFixed(1) }));

  const perfData = [
    { name: "Accuracy",    value: +(data.model_performance.accuracy  * 100).toFixed(1) },
    { name: "ROC-AUC",     value: +(data.model_performance.roc_auc   * 100).toFixed(1) },
    { name: "Churn Rate",  value: +(data.model_performance.dataset_churn_rate * 100).toFixed(1) },
  ];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {perfData.map(m => (
          <Card key={m.name} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: C.accent }}>{m.value}%</div>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{m.name}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card>
          <h3 style={{ color: C.text, fontSize: 16, marginBottom: 16, fontWeight: 700 }}>
            Feature Importance (SHAP)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={fiData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: C.text, fontSize: 12 }} width={110} />
              <Tooltip
                contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }}
                labelStyle={{ color: C.text }} itemStyle={{ color: C.accent }}
              />
              <Bar dataKey="importance" fill={C.accent} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ color: C.text, fontSize: 16, marginBottom: 16, fontWeight: 700 }}>
            Model Info
          </h3>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.9 }}>
            {[
              ["Algorithm",    "XGBoost Classifier"],
              ["Explainability","SHAP (TreeExplainer)"],
              ["Context Window","RAG via FAISS + Embeddings"],
              ["LLM",          "Claude Sonnet 4.6"],
              ["Dataset",      "5,000 synthetic Telco records"],
              ["Features",     "14 customer attributes"],
              ["Threshold",    "0.50 (probability)"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between",
                borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 6 }}>
                <span>{k}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 16, padding: "12px 16px", borderRadius: 8,
            background: C.accent + "11", border: `1px solid ${C.accent}33`,
            color: C.text, fontSize: 13,
          }}>
            💡 {data.retention_insight}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────
function ChatTab() {
  const [msgs, setMsgs]   = useState([
    { role: "ai", text: "Hi! I'm ChurnSight AI. Ask me about churn prevention, retention strategies, or what drives customer churn in your data." },
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMsgs(m => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      setMsgs(m => [...m, {
        role: "ai", text: data.answer,
        sources: data.retrieved_context,
      }]);
    } catch(e) {
      setMsgs(m => [...m, { role: "ai", text: "Error: " + e.message }]);
    }
    setLoading(false);
  };

  const SUGGESTIONS = [
    "Why do month-to-month customers churn more?",
    "What's the best retention strategy for high-risk customers?",
    "How does payment method affect churn?",
    "What should I do for customers with tenure < 6 months?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 16,
          }}>
            <div style={{
              maxWidth: "72%",
              background: m.role === "user" ? C.accent : C.surface,
              color:      m.role === "user" ? C.bg    : C.text,
              border:     m.role === "ai" ? `1px solid ${C.border}` : "none",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "12px 16px", fontSize: 14, lineHeight: 1.6,
            }}>
              {m.text}
              {m.sources && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.muted }}>
                  📚 {m.sources.length} knowledge chunks retrieved via RAG
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 4, padding: "8px 0" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: C.accent, opacity: 0.6,
                animation: `bounce 1s ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {msgs.length === 1 && (
        <div style={{ padding: "0 32px 12px", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => { setInput(s); }}
              style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 20, padding: "6px 14px", fontSize: 12,
                color: C.muted, cursor: "pointer",
              }}>{s}</button>
          ))}
        </div>
      )}

      <div style={{
        padding: "16px 32px", borderTop: `1px solid ${C.border}`,
        display: "flex", gap: 12, background: C.surface,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about churn, retention strategies, customer segments…"
          style={{
            flex: 1, background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "10px 16px", color: C.text,
            fontSize: 14, outline: "none",
          }}
        />
        <Btn onClick={send} disabled={loading || !input.trim()}>Send</Btn>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }`}</style>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("Predict");
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>
      <Nav tab={tab} setTab={setTab} />
      {tab === "Predict"     && <PredictTab />}
      {tab === "Bulk Upload" && <BulkTab />}
      {tab === "Analytics"   && <AnalyticsTab />}
      {tab === "AI Chat"     && <ChatTab />}
    </div>
  );
}
