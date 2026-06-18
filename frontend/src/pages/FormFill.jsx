import { useEffect, useRef, useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../api/api"

export default function FormFill() {
    const params = useParams()
    const [form, setForm] = useState({})
    const [answers, setAnswers] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [submitRes, setSubmitRes] = useState({})
    const navigate = useNavigate()

    // Pagination State
    const [currentPageIndex, setCurrentPageIndex] = useState(0)

    async function fetchForm() {
        api.get(`/forms/${params.slug}`).then(res => {
            setForm(res.data)
            setAnswers(res.data.sections?.map((sect) => {
                const base = { section_id: sect.id, type: sect.type }
                if (sect.type === "checkbox") return { ...base, section_option_ids: [] }
                if (sect.type === "file") return { ...base, answer_file: null }
                return { ...base, answer_text: "", section_option_id: null }
            }))
        })
    }

    // Split sections into pages
    const pages = useMemo(() => {
        if (!form.sections) return []
        const p = []
        let currentPage = []
        
        form.sections.forEach((sect, idx) => {
            if (sect.is_page_break && idx !== 0) {
                p.push(currentPage)
                currentPage = []
            }
            currentPage.push(sect)
        })
        if (currentPage.length > 0) p.push(currentPage)
        return p
    }, [form.sections])

    const currentPage = pages[currentPageIndex] || []
    const isFirstPage = currentPageIndex === 0
    const isLastPage = currentPageIndex === pages.length - 1

    function handleNext() {
        // Find logic in current page sections
        let targetSectionId = null
        
        currentPage.forEach(sect => {
            if (sect.type === "option" || sect.type === "dropdown") {
                const answ = answers.find(a => a.section_id === sect.id)
                if (answ && answ.section_option_id) {
                    const opt = sect.options.find(o => o.id === parseInt(answ.section_option_id))
                    if (opt && opt.logic_target_section_id) {
                        targetSectionId = opt.logic_target_section_id
                    }
                }
            }
        })

        if (targetSectionId) {
            const targetPageIndex = pages.findIndex(p => p.some(s => s.id === parseInt(targetSectionId)))
            if (targetPageIndex !== -1) {
                setCurrentPageIndex(targetPageIndex)
                window.scrollTo(0, 0)
                return
            }
        }

        setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1))
        window.scrollTo(0, 0)
    }

    function handleBack() {
        setCurrentPageIndex(prev => Math.max(0, prev - 1))
        window.scrollTo(0, 0)
    }

    async function handleSubmit(e) {
        if (e) e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData()

        answers.forEach((answ, i) => {
            formData.append(`answers[${i}][section_id]`, answ.section_id)
            
            if (answ.type === "checkbox") {
                formData.append(`answers[${i}][section_option_ids]`, JSON.stringify(answ.section_option_ids))
            } else if (answ.type === "file") {
                if (answ.answer_file) {
                    formData.append(`answers[${i}][answer_file]`, answ.answer_file)
                }
            } else if (answ.section_option_id) {
                formData.append(`answers[${i}][section_option_id]`, answ.section_option_id)
            } else {
                formData.append(`answers[${i}][answer_text]`, answ.answer_text || "")
            }
        })

        api.post(`/forms/${params.slug}/submit`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => {
            navigate(`/${params.slug}/result/${res.data.data.id}`)
        }).catch(error => {
            alert(error.response?.data?.message || "Error submitting form")
        }).finally(() => {
            setIsSubmitting(false)
            setShowConfirm(false)
        })
    }

    const updateAnswer = (sectId, data) => {
        setAnswers(prev => prev.map(a => a.section_id === sectId ? { ...a, ...data } : a))
    }

    const toggleCheckbox = (sectId, optionId) => {
        setAnswers(prev => prev.map(a => {
            if (a.section_id === sectId) {
                const currentIds = a.section_option_ids || []
                const newIds = currentIds.includes(optionId)
                    ? currentIds.filter(id => id !== optionId)
                    : [...currentIds, optionId]
                return { ...a, section_option_ids: newIds }
            }
            return a
        }))
    }

    useEffect(() => {
        document.title = "FormFill | FormKraft"
        fetchForm()
    }, [])

    return (
        <>
            <div className="fill-page">
                <div className="container container--narrow">

                    <div className="fill-header animate-slide-in">
                        <h1>{form.title}</h1>
                        <p>{form.description}</p>

                        {pages.length > 1 && (
                            <div className="fill-progress">
                                <div 
                                    className="fill-progress-bar" 
                                    role="progressbar" 
                                    aria-valuenow={((currentPageIndex + 1) / pages.length) * 100} 
                                    aria-valuemin="0" 
                                    aria-valuemax="100"
                                    aria-label={`Progress: Page ${currentPageIndex + 1} of ${pages.length}`}
                                >
                                    <div className="fill-progress-fill" style={{ width: `${((currentPageIndex + 1) / pages.length) * 100}%` }}></div>
                                </div>
                                <span className="fill-progress-text" aria-hidden="true">Page {currentPageIndex + 1} of {pages.length}</span>
                            </div>
                        )}
                    </div>

                    <form 
                        onSubmit={e => { e.preventDefault(); if (isLastPage) setShowConfirm(true); }} 
                        onKeyDown={e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }}
                        className="stagger-children"
                    >
                        {
                            currentPage.map((sect) => {
                                const answ = answers.find(a => a.section_id === sect.id)
                                if (!answ) return null

                                return (
                                    <div key={sect.id} className="fill-section" id={`section-${sect.order}`}>
                                        <div className="fill-section-number">{sect.order}</div>
                                        <div className="fill-section-title">
                                            {sect.title}
                                            {sect.is_required && <span className="fill-section-required" aria-hidden="true">*</span>}
                                            {sect.is_required && <span className="sr-only">(Required)</span>}
                                        </div>

                                        {sect.description && (
                                            <p className="section-description-text">{sect.description}</p>
                                        )}

                                        {sect.image_url && (
                                            <div className="question-image-container">
                                                <img src={sect.image_url} alt="Question" className="question-image" />
                                            </div>
                                        )}

                                        {/* Inputs based on type */}
                                        {sect.type === "essay" && (
                                            <textarea
                                                onChange={e => updateAnswer(sect.id, { answer_text: e.target.value })}
                                                className="form-textarea focus-ring"
                                                placeholder="Type your answer here..."
                                                value={answ.answer_text}
                                                aria-required={sect.is_required}
                                            ></textarea>
                                        )}

                                        {(sect.type === "option" || sect.type === "dropdown") && (
                                            sect.type === "dropdown" ? (
                                                <select
                                                    className="form-select focus-ring"
                                                    onChange={e => updateAnswer(sect.id, { section_option_id: parseInt(e.target.value) })}
                                                    value={answ.section_option_id || ""}
                                                    aria-required={sect.is_required}
                                                >
                                                    <option value="" disabled>Select an option</option>
                                                    {sect.options?.map(opt => (
                                                        <option key={opt.id} value={opt.id}>{opt.option_text}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="radio-group">
                                                    {sect.options?.map((opt) => (
                                                        <div key={opt.id} className="radio-wrapper">
                                                            <input
                                                                type="radio"
                                                                id={`opt-${opt.id}`}
                                                                name={`answer_${sect.id}`}
                                                                value={opt.id}
                                                                className="radio-hidden"
                                                                checked={answ.section_option_id === opt.id}
                                                                onChange={() => updateAnswer(sect.id, { section_option_id: opt.id })}
                                                            />
                                                            <label htmlFor={`opt-${opt.id}`} className="radio-item flex-col items-start gap-2">
                                                                <div className="flex items-center gap-3 w-full">
                                                                    <div className="radio-dot">
                                                                        <div className="radio-dot-inner"></div>
                                                                    </div>
                                                                    <span className="radio-text">{opt.option_text}</span>
                                                                </div>
                                                                {opt.image_url && (
                                                                    <div className="option-image-container ml-8">
                                                                        <img src={opt.image_url} alt="Option" className="option-image" />
                                                                    </div>
                                                                )}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        )}

                                        {sect.type === "checkbox" && (
                                            <div className="radio-group">
                                                {sect.options?.map((opt) => (
                                                    <div key={opt.id} className="checkbox-wrapper">
                                                        <input
                                                            type="checkbox"
                                                            id={`opt-${opt.id}`}
                                                            className="checkbox-hidden"
                                                            checked={answ.section_option_ids?.includes(opt.id)}
                                                            onChange={() => toggleCheckbox(sect.id, opt.id)}
                                                        />
                                                        <label htmlFor={`opt-${opt.id}`} className="checkbox-item flex-col items-start gap-2">
                                                            <div className="flex items-center gap-3 w-full">
                                                                <div className={`checkbox-box ${answ.section_option_ids?.includes(opt.id) ? "is-active" : ""}`}>
                                                                    {answ.section_option_ids?.includes(opt.id) && "✓"}
                                                                </div>
                                                                <span className="radio-text">{opt.option_text}</span>
                                                            </div>
                                                            {opt.image_url && (
                                                                <div className="option-image-container ml-8">
                                                                    <img src={opt.image_url} alt="Option" className="option-image" />
                                                                </div>
                                                            )}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {sect.type === "rating" && (
                                            <div className="rating-group">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <div
                                                        key={star}
                                                        className={`rating-item ${parseInt(answ.answer_text) >= star ? "is-active" : ""}`}
                                                        onClick={() => updateAnswer(sect.id, { answer_text: star.toString() })}
                                                    >
                                                        <svg className="rating-star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {sect.type === "date" && (
                                            <input
                                                type="date"
                                                className="form-input focus-ring"
                                                onChange={e => updateAnswer(sect.id, { answer_text: e.target.value })}
                                                value={answ.answer_text}
                                                aria-required={sect.is_required}
                                            />
                                        )}

                                        {sect.type === "file" && (
                                            <div className="file-upload-wrapper">
                                                <input
                                                    type="file"
                                                    id={`file-${sect.id}`}
                                                    className="hide"
                                                    onChange={e => updateAnswer(sect.id, { answer_file: e.target.files[0] })}
                                                />
                                                <label htmlFor={`file-${sect.id}`} className="file-upload-container">
                                                    <svg className="file-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                    <span className="file-upload-text">
                                                        {answ.answer_file ? "File selected" : "Click to upload file"}
                                                    </span>
                                                    {answ.answer_file && (
                                                        <span className="file-upload-name">{answ.answer_file.name}</span>
                                                    )}
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        }

                        <div className="fill-submit flex justify-between gap-4 mt-8">
                            {!isFirstPage && (
                                <button type="button" onClick={handleBack} className="btn btn-secondary btn-lg flex-1">Back</button>
                            )}
                            {!isLastPage ? (
                                <button type="button" onClick={handleNext} className="btn btn-primary btn-lg flex-1">Next</button>
                            ) : (
                                <button 
                                    type="submit" 
                                    className="btn btn-primary btn-lg flex-1"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit"}
                                </button>
                            )}
                        </div>

                    </form>

                    <div className="text-center mt-8 text-xs text-muted">
                        Powered by <strong>FormKraft</strong>
                    </div>

                </div >
            </div >

            <div className={`modal-overlay ${showConfirm ? "" : "hide"}`}>
                <div className="modal">
                    <div className="modal-header">
                        <h3>Submit Response?</h3>
                        <button type="button" onClick={() => setShowConfirm(false)} className="modal-close">&times;</button>
                    </div>
                    <div className="modal-body">
                        <p>Are you sure you want to submit your response? You won't be able to change it after this.</p>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => setShowConfirm(false)} className="btn btn-secondary" disabled={isSubmitting}>Cancel</button>
                        <button onClick={() => handleSubmit()} className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Yes, Submit"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
