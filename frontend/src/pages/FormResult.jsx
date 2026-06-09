import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import api from "../api/api"

export default function FormResult() {
    const params = useParams()
    const [result, setResult] = useState({})
    const scoreLevel = useRef("score-low")
    const score = useRef(0)

    async function fetchResult() {
        api.get(`/forms/${params.slug}/result/${params.id}`).then(res => {
            setResult(res.data)
        })
    }

    useEffect(() => {
        if (result.form_type == "quiz") {
            if (result?.total_score >= 70) {
                scoreLevel.current = "score-high"
            } else if (result?.total_score >= 50) {
                scoreLevel.current = "score-mid"
            } else {
                scoreLevel.current = "score-low"
            }

            score.current = Math.round((result.total_score / 100) - 1)
            console.log(scoreLevel.current)
        }
    }, [result])

    useEffect(() => {
        document.title = "FormResult | FormKraft"

        fetchResult()
    }, [])
    return (
        <>
            <main class="page-wrapper container container--narrow result-page">
                <div class="result-hero animate-slide-in">
                    <div class="result-hero-top">
                        <h2>{result.form?.title}</h2>
                        <p>Submitted on {result.completed_at}</p>
                    </div>

                    {
                        result.form_type == "quiz" ? (
                            <div class="result-score-section">
                                <div class="score-display">
                                    <div class="score-circle">
                                        <svg>
                                            <circle class="score-circle-bg" cx="80" cy="80" r="70"></circle>
                                            <circle class={`score-circle-fill ${scoreLevel.current}`} cx="80" cy="80" r="70" style={{ "stroke-dashoffset": `${score.current}` }}></circle>
                                        </svg>
                                        <div class="score-value">
                                            <span class="score-number">{result.total_score}</span>
                                            <span class="score-label">out of 100</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="result-score-section">
                                <p>Thankyou for contributing to {result.form?.title} form!</p>
                            </div>
                        )
                    }

                </div>
                <div>
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-lg font-bold">Answer Review</h3>
                        {
                            result.form_type == "quiz" && (
                                <div class="flex gap-2 text-xs font-medium">
                                    <span class="text-success">{result.total_correct} Correct</span>
                                    <span class="text-muted">•</span>
                                    <span class="text-error">{result.total_incorrect} Incorrect</span>
                                </div>
                            )
                        }
                    </div>

                    <div class="answer-list stagger-children">
                        {
                            result.answers?.map((answ, i) => {
                                return answ.type == "essay" ? (
                                    <div class={`answer-card ${answ.section?.is_quiz ? (answ.is_correct ? "answer-card--correct" : "answer-card--incorrect") : "answer-card--neutral"}`}>
                                        <div class="answer-card-header">
                                            <div class="answer-card-question">
                                                <span class="answer-card-number">{answ.section?.order}</span>
                                                {answ.section?.title}
                                            </div>
                                            <div class={`badge ${answ.section?.is_quiz ? (answ.is_correct ? "badge-success" : "badge-error") : "badge-neutral"}`}>{answ.section?.is_quiz ? (answ.is_correct ? "Correct" : "Incorrect") : "Survey"}</div>
                                        </div>
                                        <div class="answer-card-body">
                                            <div class="answer-user-text mb-3">
                                                {answ.answer_text}
                                            </div>
                                            {
                                                answ.section?.is_quiz ? (
                                                    <div class="answer-key-field">
                                                        {
                                                            answ.section.answer_key != null && (
                                                                <span class="answer-key-label">
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                                                                    Accepted Keywords:
                                                                </span>
                                                            )
                                                        }
                                                        <span class="answer-key-value">{answ.section.answer_key ?? "Manual Correct"}</span>
                                                    </div>
                                                ) : ""
                                            }
                                        </div>
                                    </div>
                                ) : (
                                    <div class={`answer-card ${answ.section?.is_quiz ? (answ.is_correct ? "answer-card--correct" : "answer-card--incorrect") : "answer-card--neutral"}`}>
                                        <div class="answer-card-header">
                                            <div class="answer-card-question">
                                                <span class="answer-card-number">{answ.section?.order}</span>
                                                {answ.section?.title}
                                            </div>
                                            <div class={`badge ${answ.section?.is_quiz ? (answ.is_correct ? "badge-success" : "badge-error") : "badge-neutral"}`}>{answ.section?.is_quiz ? (answ.is_correct ? "Correct" : "Incorrect") : "Survey"}</div>
                                        </div>
                                        <div class="answer-card-body">
                                            {
                                                answ?.section?.options?.map((opt, i) => {
                                                    const isSelected = answ.option?.id == opt.id
                                                    const isCorrect = opt.is_correct == true
                                                    const isWrong = isSelected && !isCorrect
                                                    return (
                                                        <div class={`result-option 
                                                        ${isSelected ? "result-option--selected" : ""} 
                                                        ${isCorrect ? "result-option--correct" : ""} 
                                                        ${isWrong ? "result-option--wrong" : ""}
                                                        `}>
                                                            <div class="result-option-marker">
                                                                {isSelected && isCorrect ? "✓" : ""}
                                                                {isSelected && !isCorrect ? "✕" : ""}
                                                                {!isSelected && isCorrect ? "✓" : ""}
                                                            </div>
                                                            {opt.option_text}
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>

                </div>


            </main>
        </>
    )
}