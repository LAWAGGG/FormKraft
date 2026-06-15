import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../api/api"

export default function FormFill() {
    const params = useParams()
    const [form, setForm] = useState({})
    const totalQuestion = useRef(0)
    const [totalAnswered, setTotalAnswered] = useState(0)
    const [answers, setAnswers] = useState([])
    const [sections, setSections] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()

    async function fetchForm() {
        api.get(`/forms/${params.slug}`).then(res => {
            setForm(res.data)
            totalQuestion.current = res.data.sections?.length
            setAnswers(res.data.sections?.map((sect) => {
                const base = { section_id: sect.id, type: sect.type }
                if (sect.type === "checkbox") return { ...base, section_option_ids: [] }
                if (sect.type === "file") return { ...base, answer_file: null }
                return { ...base, answer_text: "", section_option_id: null }
            }))
            setSections(res.data.sections)
        })
    }

    async function handleSubmit(e) {
        e.preventDefault()
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
        })
    }

    const updateAnswer = (index, data) => {
        const newAnswers = [...answers]
        newAnswers[index] = { ...newAnswers[index], ...data }
        setAnswers(newAnswers)
    }

    const toggleCheckbox = (index, optionId) => {
        const currentIds = answers[index].section_option_ids || []
        const newIds = currentIds.includes(optionId)
            ? currentIds.filter(id => id !== optionId)
            : [...currentIds, optionId]
        updateAnswer(index, { section_option_ids: newIds })
    }

    useEffect(() => {
        const answered = answers.filter(a => {
            if (a.type === "checkbox") return a.section_option_ids?.length > 0
            if (a.type === "file") return a.answer_file !== null
            return a.answer_text !== "" || a.section_option_id !== null
        }).length
        setTotalAnswered(answered)
    }, [answers])

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

                        <div className="fill-progress">
                            <div className="fill-progress-bar">
                                <div className="fill-progress-fill" style={{ "width": `${(totalAnswered / (totalQuestion.current || 1)) * 100}%` }}></div>
                            </div>
                            <span className="fill-progress-text">{totalAnswered} of {totalQuestion.current} answered</span>
                        </div>
                    </div>

                    <form onSubmit={e => handleSubmit(e)} className="stagger-children">
                        {
                            answers.map((answ, i) => {
                                const sect = sections.find(s => s.id === answ.section_id)
                                if (!sect) return null

                                return (
                                    <div key={sect.id} className="fill-section" id={`section-${sect.order}`}>
                                        <div className="fill-section-number">{sect.order}</div>
                                        <div className="fill-section-title">
                                            {sect.title} <span className="fill-section-required">*</span>
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
                                                onChange={e => updateAnswer(i, { answer_text: e.target.value })}
                                                className="form-textarea"
                                                placeholder="Type your answer here..."
                                                required
                                                value={answ.answer_text}
                                            ></textarea>
                                        )}

                                        {(sect.type === "option" || sect.type === "dropdown") && (
                                            sect.type === "dropdown" ? (
                                                <select
                                                    className="form-select"
                                                    onChange={e => updateAnswer(i, { section_option_id: parseInt(e.target.value) })}
                                                    required
                                                    value={answ.section_option_id || ""}
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
                                                                onChange={() => updateAnswer(i, { section_option_id: opt.id })}
                                                                required
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
                                                            onChange={() => toggleCheckbox(i, opt.id)}
                                                        />
                                                        <label htmlFor={`opt-${opt.id}`} className="checkbox-item flex-col items-start gap-2">
                                                            <div className="flex items-center gap-3 w-full">
                                                                <div className="checkbox-box"></div>
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
                                                        onClick={() => updateAnswer(i, { answer_text: star.toString() })}
                                                    >
                                                        <svg className="rating-star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                                        <span className="rating-label">{star}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {sect.type === "date" && (
                                            <input
                                                type="date"
                                                className="form-input"
                                                onChange={e => updateAnswer(i, { answer_text: e.target.value })}
                                                required
                                                value={answ.answer_text}
                                            />
                                        )}

                                        {sect.type === "file" && (
                                            <div className="file-upload-wrapper">
                                                <input
                                                    type="file"
                                                    id={`file-${sect.id}`}
                                                    className="hide"
                                                    onChange={e => updateAnswer(i, { answer_file: e.target.files[0] })}
                                                    required={!answ.answer_file}
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

                        <div className="fill-submit">
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg px-8 shadow-md"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Form"}
                            </button>
                        </div>

                    </form>

                    <div className="text-center mt-8 text-xs text-muted">
                        Powered by <strong>FormKraft</strong>
                    </div>

                </div >
            </div >
        </>
    )
}