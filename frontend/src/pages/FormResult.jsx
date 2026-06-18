import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import api from "../api/api"

export default function FormResult() {
    const params = useParams()
    const [result, setResult] = useState({})
    const [scoreOffset, setScoreOffset] = useState(440)
    const [scoreLevel, setScoreLevel] = useState("score-low")

    async function fetchResult() {
        api.get(`/forms/${params.slug}/result/${params.id}`).then(res => {
            setResult(res.data)
            
            // Calculate score visualization
            const s = res.data.total_score || 0
            const offset = 440 - (440 * s) / 100
            setScoreOffset(offset)

            if (s >= 70) setScoreLevel("score-high")
            else if (s >= 50) setScoreLevel("score-mid")
            else setScoreLevel("score-low")
        })
    }

    useEffect(() => {
        document.title = "Form Result | FormKraft"
        fetchResult()
    }, [])

    return (
        <>
            <main className="page-wrapper container container--narrow result-page animate-fade-in pb-20">
                <div className="result-thank-you animate-slide-in mb-10 text-center">
                    <div className="thank-you-badge mx-auto mb-4">✓</div>
                    <h1 className="thank-you-title text-3xl mb-2">{result.form?.thank_you_title || "Submission Received!"}</h1>
                    <p className="thank-you-message text-muted max-w-md mx-auto">{result.form?.thank_you_message || "Thank you for taking the time to complete this form. Your response has been recorded safely."}</p>
                </div>

                <div className="result-hero mb-10 overflow-hidden shadow-lg border border-border rounded-2xl">
                    <div className="result-hero-top bg-gradient-to-br from-primary to-accent p-8 text-white">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-black">{result.form?.title}</h2>
                                <div className="flex items-center gap-2 text-white/80 text-sm mt-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                    Submitted on {result.completed_at ? new Date(result.completed_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : '...'}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full border border-white/20">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Respondent:</span>
                                 <span className="text-sm font-bold">{result.user?.name || "Anonymous"}</span>
                            </div>
                        </div>
                    </div>

                    {result.form?.sections?.some(s => s.is_quiz) && (
                        <div className="result-score-section py-10 bg-surface border-t border-border/50">
                            <div className="score-display">
                                <div className="score-circle">
                                    <svg viewBox="0 0 160 160">
                                        <circle className="score-circle-bg" cx="80" cy="80" r="70"></circle>
                                        <circle 
                                            className={`score-circle-fill ${scoreLevel}`} 
                                            cx="80" cy="80" r="70" 
                                            style={{ strokeDashoffset: scoreOffset }}
                                        ></circle>
                                    </svg>
                                    <div className="score-value">
                                        <span className="score-number">{result.total_score}</span>
                                        <span className="score-label">Points Earned</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px flex-1 bg-border/60"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted">Response Summary</h3>
                        <div className="h-px flex-1 bg-border/60"></div>
                    </div>
                    
                    <div className="answer-list space-y-8 stagger-children mb-4">
                        {result.answers?.map((answ, i) => {
                            const isQuiz = answ.section?.is_quiz;
                            const isCorrect = answ.is_correct;
                            
                            return (
                                <div key={i} className={`answer-card p-1 rounded-2xl border ${isQuiz ? (isCorrect ? "border-success/30 bg-success/5" : "border-error/30 bg-error/5") : "border-border/60 bg-white shadow-sm"}`}>
                                    <div className="bg-white rounded-[calc(var(--radius-2xl)-4px)] overflow-hidden">
                                        <div className="answer-card-header p-6 border-b border-border/40">
                                            <div className="answer-card-question">
                                                <span className="answer-card-number w-8 h-8 flex items-center justify-center rounded-lg bg-background-alt text-sm font-black text-primary">{i + 1}</span>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-lg font-bold text-text leading-tight">{answ.section?.title}</span>
                                                    {answ.section?.description && (
                                                        <span className="text-sm text-text-secondary font-medium">{answ.section.description}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`badge px-3 py-1 text-[10px] font-black uppercase tracking-wider ${isQuiz ? (isCorrect ? "badge-success" : "badge-error") : "badge-neutral"}`}>
                                                {isQuiz ? (isCorrect ? "Correct" : "Incorrect") : "Survey Input"}
                                            </div>
                                        </div>
                                        
                                        <div className="answer-card-body p-6">
                                            {answ.section?.image_url && (
                                                <div className="question-image-container mb-6 rounded-xl overflow-hidden border border-border/50">
                                                    <img src={answ.section.image_url} alt="Question" className="question-image" />
                                                </div>
                                            )}

                                            {/* Display answer based on type */}
                                            {["essay", "date", "rating"].includes(answ.section?.type) && (
                                                <div className="answer-user-text bg-background-alt/30 p-5 rounded-xl border border-border/40">
                                                    {answ.section?.type === "rating" ? (
                                                        <div className="flex gap-2 text-warning">
                                                            {[...Array(5)].map((_, idx) => (
                                                                <svg key={idx} width="28" height="28" fill={idx < parseInt(answ.answer_text) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-lg leading-relaxed font-medium text-text-secondary italic">
                                                            "{answ.answer_text || "No answer provided"}"
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {answ.section?.type === "file" && (
                                                <div className="answer-user-text">
                                                    {answ.file_url ? (
                                                        <a href={answ.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 bg-primary/5 text-primary font-bold rounded-xl border border-primary/20 hover:bg-primary/10 transition-all hover:scale-[1.01]">
                                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                                            </div>
                                                            <div>
                                                                <span className="block text-sm text-primary/70 font-black uppercase tracking-wider">Attachment</span>
                                                                <span className="text-lg">View Uploaded Document</span>
                                                            </div>
                                                        </a>
                                                    ) : <span className="text-muted italic">No file uploaded</span>}
                                                </div>
                                            )}

                                            {["option", "checkbox", "dropdown"].includes(answ.section?.type) && (
                                                <div className="space-y-3">
                                                    {answ.section?.options?.map((opt) => {
                                                        const isSelected = answ.options_selected?.some(o => o.id === opt.id);
                                                        const isCorrectOpt = opt.is_correct;
                                                        
                                                        let statusClass = "border-border bg-white";
                                                        if (isSelected && isCorrectOpt) statusClass = "border-success bg-success/5 ring-1 ring-success/20";
                                                        else if (isSelected && !isCorrectOpt) statusClass = "border-error bg-error/5 ring-1 ring-error/20";
                                                        else if (!isSelected && isCorrectOpt && isQuiz) statusClass = "border-success/30 bg-success/5 opacity-60";

                                                        return (
                                                            <div key={opt.id} className={`result-option ${statusClass} p-5 rounded-xl border transition-all`}>
                                                                <div className="flex items-center gap-4 w-full">
                                                                    <div className={`result-option-marker w-7 h-7 flex items-center justify-center rounded-full text-xs font-black ${isCorrectOpt ? "bg-success text-white" : (isSelected ? "bg-error text-white" : "bg-background-alt text-text-muted")}`}>
                                                                        {isCorrectOpt ? "✓" : (isSelected ? "✕" : "")}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <span className={`font-bold block ${isSelected ? "text-text" : "text-text-secondary"}`}>{opt.option_text}</span>
                                                                        {opt.image_url && (
                                                                            <div className="option-image-container mt-4 max-w-[240px] rounded-lg overflow-hidden border border-border/40">
                                                                                <img src={opt.image_url} alt="Option" className="option-image" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {isSelected && (
                                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isCorrectOpt ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                                                                            {isCorrectOpt ? "Correct Choice" : "Your Answer"}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                            
                                            {isQuiz && !isCorrect && answ.section?.type === "essay" && answ.section?.answer_key && (
                                                <div className="answer-key-field mt-8 p-5 bg-success/5 border border-success/20 rounded-xl flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-success/70 block mb-1">Teacher's Answer Key</span>
                                                        <span className="font-bold text-success text-lg">{answ.section.answer_key}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="text-center mt-8 mb-8 border-t border-border/60">
                    <p className="text-text-muted text-sm font-medium">Powered by <strong className="text-primary font-black">FormKraft</strong> Professional</p>
                </div>
            </main>
        </>
    )
}