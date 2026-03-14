import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, Send, FileText, Trash2 } from "lucide-react"
import Sidebar from "../components/Sidebar"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://web-production-4afc.up.railway.app'

export default function ChatPDF() {
    const navigate = useNavigate()
    const [pdfFile, setPdfFile] = useState(null)
    const [pdfText, setPdfText] = useState("")
    const [extracting, setExtracting] = useState(false)
    const [messages, setMessages] = useState([])
    const [question, setQuestion] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    async function handleUpload(file) {
        if (!file || !file.name.endsWith('.pdf')) {
            setError("Please upload a PDF file")
            return
        }
        setPdfFile(file)
        setExtracting(true)
        setError("")
        setMessages([])

        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch(`${BACKEND_URL}/extract-pdf-full`, {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || "Extraction failed")
            setPdfText(data.text)
            setMessages([{
                role: "assistant",
                text: `✅ I've read **${file.name}** (${data.pages} pages). Ask me anything about it!`
            }])
        } catch (err) {
            setError(err.message)
            setPdfFile(null)
        }
        setExtracting(false)
    }

    async function handleSend() {
        if (!question.trim() || !pdfText || loading) return
        const userMsg = question.trim()
        setQuestion("")
        setMessages(prev => [...prev, { role: "user", text: userMsg }])
        setLoading(true)

        try {
            const formData = new FormData()
            formData.append('question', userMsg)
            formData.append('pdf_text', pdfText)
            const res = await fetch(`${BACKEND_URL}/chat-pdf`, {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to get answer")
            setMessages(prev => [...prev, { role: "assistant", text: data.answer }])
        } catch (err) {
            setMessages(prev => [...prev, { role: "assistant", text: `⚠️ ${err.message}` }])
        }
        setLoading(false)
    }

    function handleReset() {
        setPdfFile(null)
        setPdfText("")
        setMessages([])
        setError("")
        setQuestion("")
    }

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0a0a0f" }}>
            <Sidebar onNewSearch={(q) => { if (q) navigate(`/?q=${q}`) }} />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

                {/* Background grid */}
                <div style={{
                    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
                    backgroundImage: `linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }} />

                {/* Header */}
                <div style={{
                    padding: "20px 32px 16px",
                    borderBottom: "1px solid #1a1a2a",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative", zIndex: 1,
                    background: "rgba(10,10,15,0.8)",
                    backdropFilter: "blur(10px)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: "36px", height: "36px", borderRadius: "10px",
                            background: "rgba(0,229,255,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <FileText size={18} color="#0ef" />
                        </div>
                        <div>
                            <h2 style={{ color: "#fff", fontSize: "16px", fontWeight: "700", margin: 0 }}>
                                Chat with PDF
                            </h2>
                            <p style={{ color: "#555", fontSize: "12px", margin: 0, fontFamily: "JetBrains Mono, monospace" }}>
                                {pdfFile ? pdfFile.name : "Upload a PDF to start chatting"}
                            </p>
                        </div>
                    </div>
                    {pdfFile && (
                        <button onClick={handleReset} style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)",
                            borderRadius: "8px", padding: "7px 14px",
                            color: "#ff6b6b", fontSize: "13px", cursor: "pointer",
                        }}>
                            <Trash2 size={13} /> Clear
                        </button>
                    )}
                </div>

                {/* Main area */}
                {!pdfFile ? (
                    /* Upload zone */
                    <div style={{
                        flex: 1, display: "flex", alignItems: "center",
                        justifyContent: "center", position: "relative", zIndex: 1,
                    }}>
                        <div
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files[0]) }}
                            style={{
                                border: "2px dashed #2a2a3a", borderRadius: "20px",
                                padding: "60px 80px", textAlign: "center",
                                transition: "all 0.2s", cursor: "pointer",
                                maxWidth: "480px", width: "100%",
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,229,255,0.4)"}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a3a"}
                        >
                            <input
                                type="file" accept=".pdf" id="pdf-upload"
                                style={{ display: "none" }}
                                onChange={e => handleUpload(e.target.files[0])}
                            />
                            <label htmlFor="pdf-upload" style={{ cursor: "pointer" }}>
                                <div style={{
                                    width: "64px", height: "64px", borderRadius: "16px",
                                    background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.15)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 20px",
                                }}>
                                    <Upload size={28} color="#0ef" />
                                </div>
                                <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>
                                    Upload your PDF
                                </h3>
                                <p style={{ color: "#888", fontSize: "14px", marginBottom: "20px", lineHeight: "1.6" }}>
                                    Drag & drop or click to upload.<br />
                                    Then ask any question about it.
                                </p>
                                <div style={{
                                    display: "inline-block",
                                    background: "linear-gradient(135deg, #0ef2, #7c3aed22)",
                                    border: "1px solid rgba(0,229,255,0.3)",
                                    borderRadius: "8px", padding: "10px 24px",
                                    color: "#0ef", fontSize: "14px", fontWeight: "600",
                                }}>
                                    Choose PDF
                                </div>
                            </label>

                            {error && (
                                <p style={{ color: "#ff6b6b", fontSize: "13px", marginTop: "16px" }}>⚠️ {error}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Chat area */
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>

                        {/* Messages */}
                        <div style={{
                            flex: 1, overflowY: "auto", padding: "24px 32px",
                            display: "flex", flexDirection: "column", gap: "16px",
                        }}>
                            {extracting ? (
                                <div style={{ textAlign: "center", padding: "40px" }}>
                                    <div style={{
                                        width: "32px", height: "32px", margin: "0 auto 12px",
                                        border: "3px solid #2a2a3a", borderTopColor: "#0ef",
                                        borderRadius: "50%", animation: "spin 0.8s linear infinite",
                                    }} />
                                    <p style={{ color: "#888", fontSize: "14px" }}>Reading your PDF...</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div key={i} style={{
                                        display: "flex",
                                        justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                                    }}>
                                        <div style={{
                                            maxWidth: "75%",
                                            background: msg.role === "user"
                                                ? "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,58,237,0.15))"
                                                : "#111118",
                                            border: msg.role === "user"
                                                ? "1px solid rgba(0,229,255,0.2)"
                                                : "1px solid #2a2a3a",
                                            borderRadius: msg.role === "user"
                                                ? "18px 18px 4px 18px"
                                                : "18px 18px 18px 4px",
                                            padding: "14px 18px",
                                            color: "#ddd",
                                            fontSize: "14px",
                                            lineHeight: "1.7",
                                            whiteSpace: "pre-wrap",
                                        }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))
                            )}

                            {loading && (
                                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                    <div style={{
                                        background: "#111118", border: "1px solid #2a2a3a",
                                        borderRadius: "18px 18px 18px 4px",
                                        padding: "14px 18px", display: "flex", gap: "6px", alignItems: "center",
                                    }}>
                                        {[0, 1, 2].map(i => (
                                            <div key={i} style={{
                                                width: "7px", height: "7px", borderRadius: "50%",
                                                background: "#0ef", opacity: 0.6,
                                                animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input bar */}
                        <div style={{
                            padding: "16px 32px 24px",
                            borderTop: "1px solid #1a1a2a",
                            background: "rgba(10,10,15,0.9)",
                            backdropFilter: "blur(10px)",
                        }}>
                            <div style={{
                                display: "flex", gap: "12px", alignItems: "flex-end",
                                background: "#111118", border: "1px solid #2a2a3a",
                                borderRadius: "14px", padding: "12px 16px",
                            }}>
                                <textarea
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSend()
                                        }
                                    }}
                                    placeholder="Ask anything about the PDF... (Enter to send)"
                                    rows={1}
                                    style={{
                                        flex: 1, background: "none", border: "none",
                                        color: "#fff", fontSize: "14px", resize: "none",
                                        outline: "none", lineHeight: "1.6",
                                        fontFamily: "inherit", maxHeight: "120px",
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!question.trim() || loading}
                                    style={{
                                        width: "36px", height: "36px", borderRadius: "10px",
                                        background: question.trim() && !loading
                                            ? "linear-gradient(135deg, #0ef, #7c3aed)"
                                            : "#2a2a3a",
                                        border: "none", cursor: question.trim() && !loading ? "pointer" : "not-allowed",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, transition: "all 0.2s",
                                    }}
                                >
                                    <Send size={15} color={question.trim() && !loading ? "#000" : "#555"} />
                                </button>
                            </div>
                            <p style={{ color: "#444", fontSize: "11px", marginTop: "8px", textAlign: "center", fontFamily: "JetBrains Mono, monospace" }}>
                                Answers are based only on the uploaded PDF content
                            </p>
                        </div>
                    </div>
                )}

                <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
        `}</style>
            </div>
        </div>
    )
}