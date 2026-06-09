import { useEffect, useRef, useState } from "react"
import Navbar from "../components/Navbar"
import { Link, useNavigate, useParams } from "react-router-dom"
import api from "../api/api"

export default function FormBuilder() {
    const params = useParams()
    const navigate = useNavigate()
    const [form, setForm] = useState({})

    //form detail
    const [title, setTitle] = useState("")
    const [description, setDesc] = useState("")
    const [isDelete, setIsDelete] = useState(false)

    //section
    const [isCreate, setIsCreate] = useState(false)
    const [sectTitle, setSectTitle] = useState("")
    const [type, setType] = useState("")
    const [is_quiz, setIsQuiz] = useState(false)
    const [answer_key, setAnswer_key] = useState("")
    const [sectId, setSectId] = useState("")
    const [isDeleteSect, setDeleteSect] = useState(false)

    //options
    const [options, setOptions] = useState([])

    const dragIndex = useRef(0)
    const [sections, setSections] = useState([])

    async function handleDuplicate(sectId) {
        api.post(`/sections/${sectId}/duplicate`).then(res=>{
            fetchForm()
        }).catch(error=>alert(error.response.data.message))
    }

    async function handleAddOption(sectId) {
        api.post(`/sections/${sectId}/options`).then(res => {
            fetchForm()
            setSectId("")
        }).catch(error => alert(error.response.data.message))
    }

    async function handleDrop(dropIndex) {
        let newSections = [...sections]
        let [moved] = newSections.splice(dragIndex.current, 1)
        newSections.splice(dropIndex, 0, moved)

        setForm({ ...form, section: newSections })

        api.put(`/forms/${params.slug}/reorder`, {
            sections: newSections
        }).then(res => {
            fetchForm()
        }).catch(error => alert(error.response.data.message)).finally(() => {
            dragIndex.current = 0
        })
    }

    async function handleEditSect(e, isUpdateOpt = false) {
        e.preventDefault()

        if (!isUpdateOpt) {
            await api.put(`/forms/${params.slug}/sections/${sectId}`, {
                title: sectTitle,
                type: type,
                is_quiz: is_quiz,
                answer_key: answer_key
            }).then(res => {
                fetchForm()
                setSectId("")
            }).catch(error => alert(error.response.data.message))
        } else if (isUpdateOpt) {
            try {

                await api.put(`/sections/${sectId}/options`, {
                    options: options.filter((opt) => opt.option_text != "")
                })

                await api.put(`/forms/${params.slug}/sections/${sectId}`, {
                    title: sectTitle,
                    type: type,
                    is_quiz: is_quiz,
                    answer_key: answer_key
                })

            } catch (error) {
                alert(error.response.data.message)
            } finally {
                fetchForm()
                setSectId("")
            }
        }

    }

    async function handleDeleteSect() {
        api.delete(`/forms/${params.slug}/sections/${sectId}`).then(res => {
            fetchForm()
            setDeleteSect(false)
        }).catch(error => alert(error.response.data.message))
    }

    async function handleAddSect(e) {
        e.preventDefault()
        api.post(`/forms/${params.slug}/sections`, {
            title: sectTitle,
            type,
            is_quiz,
            answer_key
        }).then(res => {
            fetchForm()
            setIsCreate(false)
            setAnswer_key("")
        }).catch(error => alert(error.response.data.message))
    }

    async function handleUpdateForm(e) {
        e.preventDefault()
        api.put(`/forms/${params.slug}`, {
            title,
            description
        }).then(res => {
            fetchForm()
        }).catch(error => alert(error.response.data.message))
    }

    async function handleDelete() {
        api.delete(`/forms/${params.slug}`).then(res => {
            navigate('/dashboard')
        }).catch(error => alert(error.response.data.message))
    }

    async function fetchForm() {
        api.get(`/forms/${params.slug}`).then(res => {
            setForm(res.data)
            setTitle(res.data.title)
            setDesc(res.data.description)
            setSections(res.data.sections.map((sect) => sect.id))
        })
    }

    function setSectionProps(sect, isUpdateOpt = false) {
        setSectTitle(sect.title ?? "")
        setType(sect.type ?? "")
        setIsQuiz(sect.is_quiz ?? "")
        setAnswer_key(sect.answer_key ?? "")

        if (isUpdateOpt) {
            setOptions(sect.options.map((opt) => (
                {
                    id: opt.id,
                    option_text: opt.option_text,
                    is_correct: opt.is_correct,
                }
            )))
        }
    }

    async function handleRemoveOption(sectId, optId) {
        api.delete(`/sections/${sectId}/options/${optId}`).then(res => {
            fetchForm()
        }).catch(error => alert(error.response.data.message))
    }

    useEffect(() => {
        console.log(options)
    }, [options])

    useEffect(() => {
        document.title = "FormBuilder | FormKraft"
        fetchForm()
    }, [])
    return (
        <>
            <Navbar></Navbar>
            <main class="page-wrapper container container--narrow">
                <div class="page-content">

                    <div class="flex items-center justify-between mb-6 animate-slide-in">
                        <Link to={'/dashboard'} class="btn btn-secondary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ "margin-right": "8px" }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            Back to Dashboard
                        </Link>
                        <div class="flex gap-2">
                            <Link to={`/${params.slug}/fill`} class="btn btn-ghost" target="_blank">Preview</Link>
                        </div>
                    </div>

                    <form onSubmit={e => handleUpdateForm(e)} class="card mb-6 animate-slide-in">
                        <div class="card-header">
                            <h3 class="text-lg">Form Settings</h3>
                            <button type="button" onClick={e => setIsDelete(true)} class="btn btn-danger btn-sm">Delete Form</button>
                        </div>
                        <div class="card-body">
                            <div class="form-group mb-4">
                                <label class="form-label">Form Title</label>
                                <input onChange={e => setTitle(e.target.value)} type="text" class="form-input text-lg font-bold" value={title} />
                            </div>
                            <div class="form-group mb-4">
                                <label class="form-label">Description</label>
                                <textarea onChange={e => setDesc(e.target.value)} class="form-textarea" style={{ "min-height": "80px;" }} value={description}></textarea>
                            </div>
                            <div class="form-group mb-4">
                                <label class="form-label">Share Link</label>
                                <div class="flex gap-2">
                                    <div class="share-link">http://localhost:5173/{params.slug}/fill</div>
                                    <button type="button" class="btn btn-secondary btn-sm" onClick={() => navigator.clipboard.writeText(`http://localhost:5173/${params.slug}/fill`)}>Copy</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <button type="submit" class="btn btn-primary">Save Changes</button>
                            </div>
                        </div>
                    </form>

                    <div class="section-list stagger-children">

                        {
                            form.sections?.map((sect, i) => {
                                return sect.type == "essay" ? (
                                    <form onSubmit={e => handleEditSect(e)} onClick={() => {
                                        if (sectId != sect.id) {
                                            setSectId(sect.id);
                                            setSectionProps(sect);
                                        }
                                    }}
                                        key={i} class="section-card section-card--essay">
                                        <div class="section-card-header">
                                            <div class="section-card-left" style={{ "width": "100%", flexWrap: "nowrap" }}>
                                                <div draggable
                                                    onDrag={() => dragIndex.current = i}
                                                    onDragOver={e => e.preventDefault()}
                                                    onDrop={() => handleDrop(i)}
                                                    class="section-drag">⋮⋮</div>
                                                <div class="section-order">{sect.order}</div>
                                                <input onChange={e => setSectTitle(e.target.value)} type="text" class="form-input flex-1" style={{ "border": "none", "padding": "4px", "font-weight": "600" }} value={sectId == sect.id ? sectTitle : sect.title} />
                                                <select onChange={e => setType(e.target.value)} class="form-select" style={{ "width": "180px", "margin-left": "16px" }}>
                                                    <option selected={sect.type == "option"} value="option" selected>Multiple Choice</option>
                                                    <option selected={sect.type == "essay"} value="essay">Essay / Text</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div class="section-card-body">
                                            <textarea disabled class="form-textarea mb-4" placeholder="User answer will go here..." style={{ "background-color": "var(--background-alt)", "resize": "none", "min-height": "80px" }}></textarea>

                                            {
                                                sect.is_quiz ? (
                                                    <div class="form-group mb-4">
                                                        <label class="form-label text-xs flex items-center gap-2">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                                                            Answer Key (Keywords)
                                                        </label>
                                                        <input onChange={e => sectId == sect.id ? setAnswer_key(e.target.value) : ""} type="text" class="form-input" value={sectId == sect.id ? answer_key : sect.answer_key} placeholder="Comma separated keywords for auto-grading" />
                                                        <span class="form-hint">If left blank, this essay will require manual grading.</span>
                                                    </div>
                                                ) : ""
                                            }

                                        </div>
                                        <div class="section-card-footer">
                                            <div class="flex items-center gap-4">
                                                <label onClick={(e) => { e.stopPropagation(); sectId == sect.id ? setIsQuiz(!is_quiz) : "" }} class="form-toggle">

                                                    <div class={`toggle-track ${sectId == sect.id ? (is_quiz ? "is-active" : "") : (sect.is_quiz ? "is-active" : "")}`}><div class="toggle-knob"></div></div>
                                                    <span class="toggle-label">Include in Quiz Scoring</span>
                                                </label>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDuplicate(sect.id) }} class="btn-icon btn-ghost" title="Duplicate"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setSectId(sect.id); setDeleteSect(true) }} class="btn-icon btn-ghost text-error" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                {sectId == sect.id ? (
                                                    <div className="form-group">
                                                        <button type="submit" class="btn btn-primary">Save Changes</button>
                                                    </div>
                                                ) : ""}
                                            </div>
                                        </div>
                                    </form>

                                ) : (
                                    <form onSubmit={e => handleEditSect(e, true)} onClick={() => {
                                        if (sectId != sect.id) {
                                            setSectId(sect.id);
                                            setSectionProps(sect, true);
                                        }
                                    }}
                                        key={i} class="section-card section-card--option">
                                        <div class="section-card-header">
                                            <div class="section-card-left" style={{ "width": "100%", flexWrap: "nowrap" }}>
                                                <div draggable
                                                    onDrag={() => dragIndex.current = i}
                                                    onDragOver={e => e.preventDefault()}
                                                    onDrop={() => handleDrop(i)}
                                                    class="section-drag">⋮⋮</div>
                                                <div class="section-order">{sect.order}</div>
                                                <input onChange={e => sectId == sect.id ? setSectTitle(e.target.value) : ""} type="text" class="form-input flex-1" style={{ "border": "none", "padding": "4px", "font-weight": "600" }} value={sectId == sect.id ? sectTitle : sect.title} />
                                                <select onChange={e => setType(e.target.value)} class="form-select" style={{ "width": "180px", "margin-left": "16px" }}>
                                                    <option selected={sect.type == "option"} value="option" selected>Multiple Choice</option>
                                                    <option selected={sect.type == "essay"} value="essay">Essay / Text</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div class="section-card-body">
                                            <div class="option-list">

                                                {
                                                    sectId != sect.id ? (
                                                        sect.options?.map((opt, i) => (
                                                            <div key={i} class="option-item">
                                                                <div class={`option-marker ${opt.is_correct ? "is-correct" : ""}`}></div>
                                                                <input type="text" class="option-text" value={opt.option_text} />
                                                                <div class="option-actions">
                                                                    <button onClick={() => handleRemoveOption(sect.id, opt.id)} class="btn-icon btn-sm btn-ghost text-error" title="Remove"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        options.map((opt, i) => (
                                                            <div key={i} class="option-item">
                                                                <div onClick={() => {
                                                                    let updated = [...options]
                                                                    let toggle = opt.is_correct ? false : true
                                                                    updated[i].is_correct = toggle
                                                                    setOptions(updated)
                                                                }} class={`option-marker ${opt.is_correct ? "is-correct" : ""}`}></div>
                                                                <input onChange={e => {
                                                                    let updated = [...options]
                                                                    updated[i].option_text = e.target.value
                                                                    setOptions(updated)
                                                                }} type="text" class="option-text" value={opt.option_text} />
                                                                <div class="option-actions">
                                                                    <button onClick={() => handleRemoveOption(sect.id, opt.id)} class="btn-icon btn-sm btn-ghost text-error" title="Remove"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )

                                                }


                                                <button onClick={() => handleAddOption(sect.id)} class="btn btn-ghost btn-sm mt-2" style={{ alignSelf: "flex-start" }}>+ Add Option</button>
                                            </div>
                                        </div>
                                        <div class="section-card-footer">
                                            <div class="flex items-center gap-4">
                                                <label onClick={(e) => { e.stopPropagation(); sectId == sect.id ? setIsQuiz(!is_quiz) : "" }} class="form-toggle">

                                                    <div class={`toggle-track ${sectId == sect.id ? (is_quiz ? "is-active" : "") : (sect.is_quiz ? "is-active" : "")}`}><div class="toggle-knob"></div></div>
                                                    <span class="toggle-label">Include in Quiz Scoring</span>
                                                </label>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDuplicate(sect.id) }} class="btn-icon btn-ghost" title="Duplicate"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setSectId(sect.id); setDeleteSect(true) }} class="btn-icon btn-ghost text-error" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                {sectId == sect.id ? (
                                                    <div className="form-group">
                                                        <button type="submit" class="btn btn-primary">Save Changes</button>
                                                    </div>
                                                ) : ""}
                                            </div>
                                        </div>
                                    </form>
                                )
                            })
                        }

                    </div>

                    <button onClick={() => setIsCreate(true)} class="add-section-btn mt-6">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add New Question
                    </button>

                </div>
            </main >

            <div class={`modal-overlay ${isDelete ? "" : "hide"}`} id="deleteSectionModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Delete Question?</h3>
                        <button type="button" onClick={() => setIsDelete(false)} class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this question? This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer">
                        <button onClick={() => setIsDelete(false)} class="btn btn-secondary">Cancel</button>
                        <button onClick={() => handleDelete()} class="btn btn-danger">Delete</button>
                    </div>
                </div>
            </div>

            <div class={`modal-overlay ${isCreate ? "" : "hide"}`} id="addQuestionModal">
                <form onSubmit={e => handleAddSect(e)} class="modal">
                    <div class="modal-header">
                        <h3>Add New Question</h3>
                        <button type="button" onClick={() => setIsCreate(false)} class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div>
                            <div class="form-group">
                                <label class="form-label" for="newQuestionTitle">Question Title</label>
                                <input onChange={e => setSectTitle(e.target.value)} type="text" id="newQuestionTitle" class="form-input" placeholder="e.g. What is your role?" />
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="newQuestionType">Question Type</label>
                                <select onChange={e => setType(e.target.value)} id="newQuestionType" class="form-select">
                                    <option value="option">Multiple Choice</option>
                                    <option value="essay">Essay / Text</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label class="form-label" for="newQuestionIsQuiz">Quiz</label>
                                <label onClick={() => setIsQuiz(!is_quiz)} class="form-toggle" id="newQuestionIsQuiz">
                                    <div class={`toggle-track ${is_quiz ? "is-active" : ""}`}><div class="toggle-knob"></div></div>
                                    <span class="toggle-label">Include in Quiz Scoring</span>
                                </label>
                            </div>
                            {
                                is_quiz && type == "essay" && (
                                    <div className="form-group">
                                        <label class="form-label" for="newQuestionIsAnswerKey">Answer Key</label>
                                        <input onChange={e => setAnswer_key(e.target.value)} type="text" id="newQuestionIsAnswerKey" class="form-input" placeholder="answer key to essay question" />
                                    </div>
                                )
                            }
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" onClick={() => setIsCreate(false)} class="btn btn-secondary">Cancel</button>
                        <button onClick={() => handleAddSect()} class="btn btn-primary">Add Question</button>
                    </div>
                </form>
            </div>

            <div class={`modal-overlay ${isDeleteSect ? "" : "hide"}`} id="deleteSectionModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Delete Question?</h3>
                        <button class="modal-close" onClick={() => { setSectId(""); setDeleteSect(false) }}>&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this question? This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer">
                        <button onClick={() => { setSectId(""); setDeleteSect(false) }} class="btn btn-secondary" onclick="document.getElementById('deleteSectionModal').classList.add('hide')">Cancel</button>
                        <button class="btn btn-danger" onClick={() => handleDeleteSect()}>Delete</button>
                    </div>
                </div>
            </div>
        </>
    )
}