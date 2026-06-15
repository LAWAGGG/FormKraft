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
            <main className="page-wrapper container container--narrow result-page">
                <div className="result-hero animate-slide-in">
                    <div className="result-hero-top">
                        <h2>{result.form?.title}</h2>
                        <p>Submitted on {result.completed_at ? new Date(result.completed_at).toLocaleString() : '...'}</p>
                    </div>

                    <div className="result-score-section">
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
                                    <span className="score-label">Total Score</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-bold mb-4">Your Answers</h3>
                    <div className="answer-list stagger-children">
                        {result.answers?.map((answ, i) => {
                            const isQuiz = answ.section?.is_quiz;
                            const isCorrect = answ.is_correct;
                            
                            return (
                                <div key={i} className={`answer-card ${isQuiz ? (isCorrect ? "answer-card--correct" : "answer-card--incorrect") : "answer-card--neutral"}`}>
                                    <div className="answer-card-header">
                                        <div className="answer-card-question">
                                            <span className="answer-card-number">{i + 1}</span>
                                            <div className="flex flex-col gap-1">
                                                <span>{answ.section?.title}</span>
                                                {answ.section?.description && (
                                                    <span className="text-xs text-muted font-normal">{answ.section.description}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`badge ${isQuiz ? (isCorrect ? "badge-success" : "badge-error") : "badge-neutral"}`}>
                                            {isQuiz ? (isCorrect ? "Correct" : "Incorrect") : "Survey"}
                                        </div>
                                    </div>
                                    
                                    <div className="answer-card-body">
                                        {answ.section?.image_url && (
                                            <div className="question-image-container mb-4">
                                                <img src={answ.section.image_url} alt="Question" className="question-image" />
                                            </div>
                                        )}

                                        {/* Display answer based on type */}
                                        {["essay", "date", "rating"].includes(answ.section?.type) && (
                                            <div className="answer-user-text">
                                                {answ.section?.type === "rating" ? (
                                                    <div className="flex gap-1 text-warning">
                                                        {[...Array(5)].map((_, idx) => (
                                                            <svg key={idx} width="20" height="20" fill={idx < parseInt(answ.answer_text) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    answ.answer_text || <span className="text-muted italic">No answer provided</span>
                                                )}
                                            </div>
                                        )}

                                        {answ.section?.type === "file" && (
                                            <div className="answer-user-text">
                                                {answ.file_url ? (
                                                    <a href={answ.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary font-semibold">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                                        View Uploaded File
                                                    </a>
                                                ) : <span className="text-muted italic">No file uploaded</span>}
                                            </div>
                                        )}

                                        {["option", "checkbox", "dropdown"].includes(answ.section?.type) && (
                                            <div className="option-list">
                                                {answ.section?.options?.map((opt) => {
                                                    const isSelected = answ.options_selected?.some(o => o.id === opt.id);
                                                    const isCorrectOpt = opt.is_correct;
                                                    
                                                    let statusClass = "";
                                                    if (isSelected && isCorrectOpt) statusClass = "result-option--correct";
                                                    else if (isSelected && !isCorrectOpt) statusClass = "result-option--selected result-option--wrong";
                                                    else if (!isSelected && isCorrectOpt && isQuiz) statusClass = "result-option--correct opacity-60";

                                                    return (
                                                        <div key={opt.id} className={`result-option ${statusClass} flex-col items-start gap-2`}>
                                                            <div className="flex items-center gap-3 w-full">
                                                                <div className="result-option-marker">
                                                                    {isCorrectOpt ? "✓" : (isSelected ? "✕" : "")}
                                                                </div>
                                                                <span className="radio-text">{opt.option_text}</span>
                                                                {isSelected && <span className="badge badge-primary btn-sm ml-auto">Your Choice</span>}
                                                            </div>
                                                            {opt.image_url && (
                                                                <div className="option-image-container ml-8">
                                                                    <img src={opt.image_url} alt="Option" className="option-image" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                        
                                        {isQuiz && !isCorrect && answ.section?.type === "essay" && answ.section?.answer_key && (
                                            <div className="answer-key-field mt-3">
                                                <span className="answer-key-label">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                                                    Correct Keywords:
                                                </span>
                                                <span className="answer-key-value">{answ.section.answer_key}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="text-center py-8">
                    <p className="text-muted text-sm">Thank you for participating!</p>
                </div>
            </main>
        </>
    )
}