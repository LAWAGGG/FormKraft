import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../api/api"

export default function FormFill() {
    const params = useParams()
    const [form, setForm] = useState({})
    const totalQuestion = useRef(0)
    const totalAnswered = useRef(0)
    const [answers, setAnswers] = useState([])
    const [sections, setSections] = useState([])
    const navigate = useNavigate()

    async function fetchForm() {
        api.get(`/forms/${params.slug}`).then(res => {
            setForm(res.data)
            totalQuestion.current = res.data.sections?.length
            setAnswers(res.data.sections?.map((sect) => (
                {
                    section_id: sect.id,
                    answer_text: "",
                    section_option_id: null,
                }
            )))
            setSections(res.data.sections)
        })
    }

    async function handleSubmit(e) {
        e.preventDefault()

        const cleanedAnswer = answers.map((answ, i) => {
            let sect = sections.find(s => s.id == answ.section_id)

            if (sect.type == "essay") {
                return {
                    section_id: sect.id,
                    answer_text: answ.answer_text
                }
            } else {
                return {
                    section_id: sect.id,
                    section_option_id: answ.section_option_id
                }
            }
        })

        console.log({cleanedAnswer})

        api.post(`/forms/${params.slug}/submit`, {
            answers:cleanedAnswer
        }).then(res => {
            navigate(`/${params.slug}/result/${res.data.data.id}`)
            console.log(res.data)
        }).catch(error => alert(error.response.data.message))
    }

    useEffect(() => {
        totalAnswered.current = answers.filter(a => a.answer_text != "" || a.section_option_id != null).length
        console.log(totalAnswered)
        console.log(answers)
    }, [answers])

    useEffect(() => {
        document.title = "FormFill | FormKraft"
        fetchForm()
    }, [])
    return (
        <>
            <div class="fill-page">
                <div class="container container--narrow">

                    <div class="fill-header animate-slide-in">
                        <h1>{form.title}</h1>
                        <p>{form.description}</p>

                        <div class="fill-progress">
                            <div class="fill-progress-bar">
                                <div class="fill-progress-fill" style={{ "width": `${(totalAnswered.current / totalQuestion.current) * 100}%` }}></div>
                            </div>
                            <span class="fill-progress-text">{totalAnswered.current} of {totalQuestion.current} answered</span>
                        </div>
                    </div>

                    <form onSubmit={e => handleSubmit(e)} class="stagger-children">
                        {
                            answers.map((answ, i) => {
                                let sect = sections.find(s => s.id == answ.section_id)
                                return sect.type == "essay" ? (
                                    <div class="fill-section" id="section-2" >
                                        <div class="fill-section-number">{sect.order}</div>
                                        <div class="fill-section-title">
                                            {sect.title} <span class="fill-section-required">*</span>
                                        </div>

                                        <textarea onChange={e => {
                                            let updated = [...answers]
                                            updated[i].answer_text = e.target.value
                                            setAnswers(updated)
                                        }} class="form-textarea" name="answer_2" placeholder="Type your answer here..." required></textarea>
                                    </div>
                                ) : (
                                    <div class="fill-section" id={`section-${sect.order}`}>
                                        <div class="fill-section-number">{sect.order}</div>
                                        <div class="fill-section-title">
                                            {sect.title} <span class="fill-section-required">*</span>
                                        </div>

                                        <div class="radio-group">
                                            {
                                                sect.options?.map((opt, idx) => (
                                                    <div key={opt.id} className="radio-wrapper">
                                                        <input
                                                            type="radio"
                                                            id={`opt-${opt.id}`}
                                                            name={`answer_${sect.id}`}
                                                            value={opt.id}
                                                            className="radio-hidden"
                                                            checked={answ.section_option_id === opt.id}
                                                            onClick={() => {
                                                                let updated = [...answers]
                                                                updated[i].section_option_id = opt.id
                                                                setAnswers(updated)
                                                            }}
                                                        />

                                                        <label htmlFor={`opt-${opt.id}`} className="radio-item">
                                                            <div className="radio-dot">
                                                                <div className="radio-dot-inner"></div>
                                                            </div>
                                                            <span className="radio-text">{opt.option_text}</span>
                                                        </label>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )
                            })
                        }

                        <div class="fill-submit">
                            <button type="submit" class="btn btn-primary btn-lg px-8 shadow-md">Submit Form</button>
                        </div>

                    </form>

                    <div class="text-center mt-8 text-xs text-muted">
                        Powered by <strong>FormKraft</strong>
                    </div>

                </div >
            </div >
        </>
    )
}