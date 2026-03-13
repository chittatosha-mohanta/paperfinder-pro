import { useState } from "react"

export default function PaperWizard() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    title: "", abstract: "", references: [],
    format: "IEEE", diagrams: [],
  })
  const [generating, setGenerating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState("")

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://web-production-4afc.up.railway.app'
  const steps = ["Title", "Abstract", "References", "Format", "Diagrams", "Generate"]

  async function handleGenerate() {
    setGenerating(true)
    setError("")
    try {
      const formData = new FormData()
      formData.append("title", data.title)
      formData.append("abstract", data.abstract)
      formData.append("format", data.format)
      data.references.forEach((file, i) => formData.append(`reference_${i}`, file))
      data.diagrams.forEach((file, i) => formData.append(`diagram_${i}`, file))

      const response = await fetch(`${BACKEND_URL}/generate-paper`, {
        method: "POST",
        body: formData,
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Generation failed")

      const bytes = atob(result.docx_base64)
      const byteArray = new Uint8Array(bytes.length)
      for (let i = 0; i < bytes.length; i++) byteArray[i] = bytes.charCodeAt(i)
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      })
      setDownloadUrl(URL.createObjectURL(blob))
      setFileName(result.filename)
    } catch (err) {
      setError(err.message)
    }
    setGenerating(false)
  }

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "40px" }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              height: "4px", borderRadius: "2px", marginBottom: "8px",
              background: i + 1 <= step ? "linear-gradient(90deg, #a78bfa, #0ef)" : "#2a2a3a",
              transition: "background 0.3s",
            }} />
            <span style={{
              fontSize: "11px",
              color: i + 1 === step ? "#a78bfa" : "#555",
              fontFamily: "JetBrains Mono, monospace",
            }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Step 1 — Title */}
      {step === 1 && (
        <StepCard title="What is your paper title?" step={1}>
          <input
            type="text"
            placeholder="e.g. Deep Learning for Medical Image Segmentation"
            value={data.title}
            onChange={e => setData({ ...data, title: e.target.value })}
            style={inputStyle}
          />
        </StepCard>
      )}

      {/* Step 2 — Abstract */}
      {step === 2 && (
        <StepCard title="Write your abstract" step={2}>
          <textarea
            placeholder="Describe your research, methodology, and key findings..."
            value={data.abstract}
            onChange={e => setData({ ...data, abstract: e.target.value })}
            rows={6}
            style={{ ...inputStyle, resize: "vertical", lineHeight: "1.7" }}
          />
        </StepCard>
      )}

      {/* Step 3 — References */}
      {step === 3 && (
        <StepCard title="Upload reference papers (max 5 PDFs)" step={3}>
          {data.references.length < 5 && (
            <div style={uploadZoneStyle}>
              <input
                type="file" accept=".pdf"
                onChange={e => {
                  const file = e.target.files[0]
                  if (!file) return
                  if (data.references.find(r => r.name === file.name)) return
                  setData({ ...data, references: [...data.references, file] })
                  e.target.value = ""
                }}
                style={{ display: "none" }} id="ref-upload"
              />
              <label htmlFor="ref-upload" style={{ cursor: "pointer" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>📎</div>
                <p style={{ color: "#aaa", fontSize: "14px", margin: 0 }}>
                  Click to add a reference PDF
                </p>
                <p style={{ color: "#555", fontSize: "12px", margin: "6px 0 0" }}>
                  {data.references.length}/5 added
                </p>
              </label>
            </div>
          )}
          {data.references.length > 0 && (
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {data.references.map((f, i) => (
                <div key={i} style={{
                  background: "#1a1a2a", borderRadius: "8px", padding: "12px 16px",
                  color: "#aaa", fontSize: "13px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#a78bfa", fontWeight: "700" }}>[{i + 1}]</span>
                    📄 {f.name}
                  </span>
                  <button onClick={() =>
                    setData({ ...data, references: data.references.filter((_, idx) => idx !== i) })
                  } style={{
                    background: "none", border: "none", color: "#ff6b6b",
                    cursor: "pointer", fontSize: "16px", padding: "0 4px",
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
          {data.references.length === 5 && (
            <p style={{ color: "#888", fontSize: "13px", marginTop: "12px", textAlign: "center" }}>
              Maximum 5 references reached
            </p>
          )}
        </StepCard>
      )}

      {/* Step 4 — Format */}
      {step === 4 && (
        <StepCard title="Choose your paper format" step={4}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {["IEEE", "APA", "MLA", "ACM", "Nature", "Springer"].map(fmt => (
              <button key={fmt} onClick={() => setData({ ...data, format: fmt })} style={{
                padding: "20px", borderRadius: "12px", cursor: "pointer",
                border: data.format === fmt ? "2px solid #a78bfa" : "1px solid #2a2a3a",
                background: data.format === fmt ? "rgba(124,58,237,0.15)" : "#111118",
                color: data.format === fmt ? "#a78bfa" : "#888",
                fontSize: "16px", fontWeight: "700",
                transition: "all 0.2s",
              }}>
                {fmt}
              </button>
            ))}
          </div>
        </StepCard>
      )}

      {/* Step 5 — Diagrams */}
      {step === 5 && (
        <StepCard title="Upload your diagrams (optional)" step={5}>
          {data.diagrams.length < 10 && (
            <div style={uploadZoneStyle}>
              <input
                type="file" accept="image/*"
                onChange={e => {
                  const file = e.target.files[0]
                  if (!file) return
                  if (data.diagrams.find(d => d.name === file.name)) return
                  setData({ ...data, diagrams: [...data.diagrams, file] })
                  e.target.value = ""
                }}
                style={{ display: "none" }} id="diagram-upload"
              />
              <label htmlFor="diagram-upload" style={{ cursor: "pointer" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>🖼️</div>
                <p style={{ color: "#aaa", fontSize: "14px", margin: 0 }}>
                  Click to add a diagram
                </p>
                <p style={{ color: "#555", fontSize: "12px", margin: "6px 0 0" }}>
                  Architecture, flowcharts, results — {data.diagrams.length} added
                </p>
              </label>
            </div>
          )}
          {data.diagrams.length > 0 && (
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {data.diagrams.map((f, i) => (
                <div key={i} style={{
                  background: "#1a1a2a", borderRadius: "8px", padding: "12px 16px",
                  color: "#aaa", fontSize: "13px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#0ef", fontWeight: "700" }}>Fig {i + 1}</span>
                    🖼 {f.name}
                  </span>
                  <button onClick={() =>
                    setData({ ...data, diagrams: data.diagrams.filter((_, idx) => idx !== i) })
                  } style={{
                    background: "none", border: "none", color: "#ff6b6b",
                    cursor: "pointer", fontSize: "16px", padding: "0 4px",
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </StepCard>
      )}

      {/* Step 6 — Generate */}
      {step === 6 && (
        <StepCard title="Ready to generate your paper!" step={6}>
          <div style={{
            background: "#111118", border: "1px solid #2a2a3a",
            borderRadius: "12px", padding: "24px",
          }}>
            {/* Summary */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>
                📌 Title: <span style={{ color: "#fff" }}>{data.title}</span>
              </p>
              <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>
                📝 Abstract: <span style={{ color: "#fff" }}>
                  {data.abstract ? data.abstract.slice(0, 80) + "..." : "Not provided"}
                </span>
              </p>
              <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>
                📄 Format: <span style={{ color: "#a78bfa" }}>{data.format}</span>
              </p>
              <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>
                📚 References: <span style={{ color: "#fff" }}>{data.references.length} file(s)</span>
              </p>
              <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>
                🖼 Diagrams: <span style={{ color: "#fff" }}>{data.diagrams.length} file(s)</span>
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.25)",
                borderRadius: "8px", padding: "12px 16px", marginBottom: "16px",
                color: "#ff6b6b", fontSize: "13px"
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* States */}
            {generating ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div style={{
                  width: "40px", height: "40px", margin: "0 auto 16px",
                  border: "3px solid #2a2a3a",
                  borderTopColor: "#a78bfa", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                <p style={{ color: "#a78bfa", fontSize: "14px", margin: "0 0 4px" }}>
                  ✨ AI is writing your paper...
                </p>
                <p style={{ color: "#555", fontSize: "12px", margin: 0 }}>
                  This takes 30–60 seconds
                </p>
              </div>
            ) : downloadUrl ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
                <p style={{ color: "#fff", fontSize: "16px", fontWeight: "700", marginBottom: "20px" }}>
                  Your paper is ready!
                </p>
                <a href={downloadUrl} download={fileName} style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  background: "linear-gradient(135deg, #a78bfa, #0ef)",
                  border: "none", borderRadius: "10px",
                  padding: "14px 32px", color: "#000",
                  fontSize: "15px", fontWeight: "700",
                  textDecoration: "none",
                }}>
                  ⬇️ Download .docx
                </a>
                <button onClick={() => {
                  setDownloadUrl(null)
                  setStep(1)
                  setData({ title: "", abstract: "", references: [], format: "IEEE", diagrams: [] })
                }} style={{
                  display: "block", margin: "16px auto 0",
                  background: "none", border: "none",
                  color: "#888", fontSize: "13px", cursor: "pointer",
                }}>
                  Write another paper →
                </button>
              </div>
            ) : (
              <button onClick={handleGenerate} style={{
                width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #a78bfa, #0ef)",
                border: "none", borderRadius: "10px",
                color: "#000", fontSize: "15px", fontWeight: "700",
                cursor: "pointer",
              }}>
                ✨ Generate Paper
              </button>
            )}
          </div>
        </StepCard>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          style={{
            padding: "10px 24px", borderRadius: "8px",
            background: "none", border: "1px solid #2a2a3a",
            color: step === 1 ? "#444" : "#888",
            cursor: step === 1 ? "not-allowed" : "pointer",
            fontSize: "14px",
          }}
        >← Back</button>

        {step < 6 && (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && !data.title.trim()}
            style={{
              padding: "10px 28px", borderRadius: "8px",
              background: "linear-gradient(135deg, #a78bfa, #0ef)",
              border: "none", color: "#000",
              fontSize: "14px", fontWeight: "700",
              cursor: "pointer",
              opacity: step === 1 && !data.title.trim() ? 0.5 : 1,
            }}
          >Next →</button>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function StepCard({ title, step, children }) {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <span style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: "11px",
          color: "#a78bfa", letterSpacing: "2px",
        }}>STEP {step} OF 6</span>
        <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: "700", margin: "8px 0 0" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: "100%", padding: "14px 16px",
  background: "#111118", border: "1px solid #2a2a3a",
  borderRadius: "10px", color: "#fff", fontSize: "15px",
  boxSizing: "border-box", outline: "none",
  fontFamily: "inherit",
}

const uploadZoneStyle = {
  border: "2px dashed #2a2a3a", borderRadius: "12px",
  padding: "40px", textAlign: "center",
  transition: "border-color 0.2s",
}