import { useEffect, useRef, useState } from "react"
import Navbar from "../components/Navbar"
import { Link, useNavigate, useParams } from "react-router-dom"
import api from "../api/api"
import FormTabs from "../components/FormTabs"

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
    const [sectDesc, setSectDesc] = useState("")
    const [type, setType] = useState("essay")
    const [is_quiz, setIsQuiz] = useState(false)
    const [answer_key, setAnswer_key] = useState("")
    const [sectId, setSectId] = useState("")
    const [isDeleteSect, setDeleteSect] = useState(false)

    //options
    const [options, setOptions] = useState([])

    const dragIndex = useRef(0)
    const [sections, setSections] = useState([])

    async function handleDuplicate(sectId) {
        api.post(`/sections/${sectId}/duplicate`).then(res => {
            fetchForm()
        }).catch(error => alert(error.response.data.message))
    }

    async function handleAddOption(sectId) {
        api.post(`/sections/${sectId}/options`).then(res => {
            fetchForm()
            // Update local options state to show the new option immediately
            if (res.data.data) {
                setOptions(prev => [...prev, {
                    id: res.data.data.id,
                    option_text: res.data.data.option_text ?? "",
                    is_correct: res.data.data.is_correct,
                    image_url: res.data.data.image_url
                }])
            }
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

    async function handleEditSect(e, hasOptions = false) {
        if (e) e.preventDefault()

        const payload = {
            title: sectTitle,
            description: sectDesc,
            type: type,
            is_quiz: is_quiz,
            answer_key: answer_key
        }

        try {
            if (hasOptions) {
                await api.put(`/sections/${sectId}/options`, {
                    options: options.filter((opt) => opt.option_text != "" || opt.image_url != null)
                })
            }

            await api.put(`/forms/${params.slug}/sections/${sectId}`, payload)
            fetchForm()
            setSectId("")
        } catch (error) {
            alert(error.response?.data?.message || "Error updating section")
        }
    }

    async function handleDeleteSect() {
        api.delete(`/forms/${params.slug}/sections/${sectId}`).then(res => {
            fetchForm()
            setDeleteSect(false)
        }).catch(error => alert(error.response.data.message))
    }

    async function handleAddSect(e) {
        if (e) e.preventDefault()
        api.post(`/forms/${params.slug}/sections`, {
            title: sectTitle,
            description: sectDesc,
            type,
            is_quiz,
            answer_key
        }).then(res => {
            fetchForm()
            setIsCreate(false)
            setAnswer_key("")
            setSectDesc("")
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

    function setSectionProps(sect) {
        setSectTitle(sect.title ?? "")
        setSectDesc(sect.description ?? "")
        setType(sect.type ?? "")
        setIsQuiz(sect.is_quiz ?? false)
        setAnswer_key(sect.answer_key ?? "")

        if (sect.options) {
            setOptions(sect.options.map((opt) => (
                {
                    id: opt.id,
                    option_text: opt.option_text ?? "",
                    is_correct: opt.is_correct ?? false,
                    image_url: opt.image_url
                }
            )))
        } else {
            setOptions([])
        }
    }

    async function handleRemoveOption(sectId, optId) {
        api.delete(`/sections/${sectId}/options/${optId}`).then(res => {
            fetchForm()
        }).catch(error => alert(error.response.data.message))
    }

    async function handleUploadSectionImage(e, id) {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('image', file)

        api.post(`/sections/${id}/image`, formData).then(res => {
            fetchForm()
        }).catch(error => alert(error.response.data.message))
    }

    async function handleUploadOptionImage(e, optId) {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('image', file)

        api.post(`/options/${optId}/image`, formData).then(res => {
            fetchForm()
            // We need to update the options state too to show the preview
            setOptions(prev => prev.map(o => o.id === optId ? { ...o, image_url: res.data.image_url } : o))
        }).catch(error => alert(error.response.data.message))
    }

    const questionTypes = [
        { id: "essay", label: "Essay / Text", icon: "T" },
        { id: "option", label: "Multiple Choice (Radio)", icon: "●" },
        { id: "checkbox", label: "Checkboxes (Multi)", icon: "■" },
        { id: "dropdown", label: "Dropdown", icon: "▾" },
        { id: "rating", label: "Rating (Stars)", icon: "★" },
        { id: "date", label: "Date Picker", icon: "📅" },
        { id: "file", label: "File Upload", icon: "📁" },
    ]

    useEffect(() => {
        document.title = "FormBuilder | FormKraft"
        fetchForm()
    }, [])

    return (
        <>
            <Navbar></Navbar>
            <main className="page-wrapper container container--narrow">
                <div className="page-content">

                    <div className="flex items-center justify-between mb-6 animate-slide-in">
                        <Link to={'/dashboard'} className="btn btn-secondary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ "marginRight": "8px" }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            Back
                        </Link>
                        <FormTabs slug={params.slug} activeTab="questions" />
                    </div>

                    <form onSubmit={e => handleUpdateForm(e)} className="card mb-6 animate-slide-in">
                        <div className="card-header">
                            <h3 className="text-lg">Form Settings</h3>
                            <button type="button" onClick={e => setIsDelete(true)} className="btn btn-danger btn-sm">Delete Form</button>
                        </div>
                        <div className="card-body">
                            <div className="form-group mb-4">
                                <label className="form-label">Form Title</label>
                                <input onChange={e => setTitle(e.target.value)} type="text" className="form-input text-lg font-bold" value={title} />
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label">Description</label>
                                <textarea onChange={e => setDesc(e.target.value)} className="form-textarea" style={{ "minHeight": "80px" }} value={description}></textarea>
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label">Share Link</label>
                                <div className="flex gap-2">
                                    <div className="share-link">http://localhost:5173/{params.slug}/fill</div>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigator.clipboard.writeText(`http://localhost:5173/${params.slug}/fill`)}>Copy</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </div>
                    </form>

                    <div className="section-list stagger-children">

                        {
                            form.sections?.map((sect, i) => {
                                const isEditing = sectId === sect.id;
                                const hasOptions = ["option", "checkbox", "dropdown"].includes(isEditing ? type : sect.type);

                                return (
                                    <form onSubmit={e => handleEditSect(e, hasOptions)}
                                        onClick={() => {
                                            if (sectId !== sect.id) {
                                                setSectId(sect.id);
                                                setSectionProps(sect);
                                            }
                                        }}
                                        key={i} className={`section-card section-card--${sect.type}`}>
                                        <div className="section-card-header">
                                            <div className="section-card-left" style={{ "width": "100%", flexWrap: "nowrap" }}>
                                                <div draggable
                                                    onDragStart={() => dragIndex.current = i}
                                                    onDragOver={e => e.preventDefault()}
                                                    onDrop={() => handleDrop(i)}
                                                    className="section-drag">⋮⋮</div>
                                                <div className="section-order">{sect.order}</div>
                                                <div className="flex-1 flex flex-col gap-1">
                                                    <input
                                                        onChange={e => isEditing ? setSectTitle(e.target.value) : ""}
                                                        type="text"
                                                        className="form-input"
                                                        style={{ "border": "none", "padding": "4px", "fontWeight": "600", "fontSize": "var(--font-base)" }}
                                                        value={isEditing ? sectTitle : sect.title}
                                                        placeholder="Question Title"
                                                    />
                                                    {isEditing ? (
                                                        <input
                                                            onChange={e => setSectDesc(e.target.value)}
                                                            type="text"
                                                            className="form-input text-xs"
                                                            style={{ "border": "none", "padding": "4px", "color": "var(--text-muted)" }}
                                                            value={sectDesc}
                                                            placeholder="Add a description or explanation (optional)"
                                                        />
                                                    ) : sect.description && (
                                                        <div className="text-xs text-muted px-1">{sect.description}</div>
                                                    )}
                                                </div>
                                                <select
                                                    onChange={e => isEditing ? setType(e.target.value) : ""}
                                                    className="form-select"
                                                    style={{ "width": "160px", "marginLeft": "16px" }}
                                                    value={isEditing ? type : sect.type}
                                                >
                                                    {questionTypes.map(t => (
                                                        <option key={t.id} value={t.id}>{t.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="section-card-body">
                                            {/* Question Image */}
                                            {(isEditing || sect.image_url) && (
                                                <div className="mb-4">
                                                    {sect.image_url ? (
                                                        <div className="question-image-container relative group">
                                                            <img src={sect.image_url} alt="Question" className="question-image" />
                                                            {isEditing && (
                                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <label className="btn btn-secondary btn-sm cursor-pointer">
                                                                        Change Image
                                                                        <input type="file" className="hide" onChange={(e) => handleUploadSectionImage(e, sect.id)} />
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : isEditing && (
                                                        <label className="image-upload-btn">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                            Add Image to Question
                                                            <input type="file" className="hide" onChange={(e) => handleUploadSectionImage(e, sect.id)} />
                                                        </label>
                                                    )}
                                                </div>
                                            )}

                                            {/* Preview based on type */}
                                            {sect.type === "essay" && (
                                                <textarea disabled className="form-textarea mb-4" placeholder="User answer will go here..." style={{ "backgroundColor": "var(--background-alt)", "resize": "none", "minHeight": "80px" }}></textarea>
                                            )}

                                            {sect.type === "rating" && (
                                                <div className="rating-group mb-4">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <div key={star} className="rating-item">
                                                            <svg className="rating-star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {sect.type === "date" && (
                                                <input type="date" disabled className="form-input mb-4" style={{ "backgroundColor": "var(--background-alt)" }} />
                                            )}

                                            {sect.type === "file" && (
                                                <div className="file-upload-container mb-4">
                                                    <svg className="file-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                    <span className="file-upload-text">Click or drag file to upload</span>
                                                </div>
                                            )}

                                            {hasOptions && (
                                                <div className="option-list mb-4">
                                                    {(isEditing ? options : sect.options || []).map((opt, idx) => (
                                                        <div key={idx} className="flex flex-col gap-2 p-3 bg-background-alt border border-border rounded-md">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    onClick={() => {
                                                                        if (!isEditing) return;
                                                                        let updated = [...options]
                                                                        if (type === "checkbox") {
                                                                            updated[idx].is_correct = !opt.is_correct
                                                                        } else {
                                                                            updated = updated.map((o, i) => ({ ...o, is_correct: i === idx }))
                                                                        }
                                                                        setOptions(updated)
                                                                    }}
                                                                    className={`${sect.type === "checkbox" ? "checkbox-box" : "option-marker"} ${opt.is_correct ? "is-correct" : ""}`}
                                                                ></div>
                                                                <input
                                                                    onChange={e => {
                                                                        if (!isEditing) return;
                                                                        let updated = [...options]
                                                                        updated[idx].option_text = e.target.value
                                                                        setOptions(updated)
                                                                    }}
                                                                    type="text"
                                                                    className="option-text"
                                                                    value={opt.option_text}
                                                                    placeholder={`Option ${idx + 1}`}
                                                                    readOnly={!isEditing}
                                                                />
                                                                {isEditing && (
                                                                    <div className="option-actions">
                                                                        <label className="btn-icon btn-sm btn-ghost cursor-pointer" title="Add Image">
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                                            <input type="file" className="hide" onChange={(e) => handleUploadOptionImage(e, opt.id)} />
                                                                        </label>
                                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveOption(sect.id, opt.id) }} className="btn-icon btn-sm btn-ghost text-error" title="Remove"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {opt.image_url && (
                                                                <div className="option-image-container relative group ml-8">
                                                                    <img src={opt.image_url} alt="Option" className="option-image" />
                                                                    {isEditing && (
                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                                                                            <label className="btn btn-secondary btn-sm cursor-pointer">
                                                                                Change
                                                                                <input type="file" className="hide" onChange={(e) => handleUploadOptionImage(e, opt.id)} />
                                                                            </label>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {isEditing && (
                                                        <button type="button" onClick={() => handleAddOption(sect.id)} className="btn btn-ghost btn-sm mt-2" style={{ alignSelf: "flex-start" }}>+ Add Option</button>
                                                    )}
                                                </div>
                                            )}

                                            {
                                                (isEditing ? is_quiz : sect.is_quiz) && sect.type === "essay" ? (
                                                    <div className="form-group mb-4">
                                                        <label className="form-label text-xs flex items-center gap-2">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                                                            Answer Key (Keywords)
                                                        </label>
                                                        <input
                                                            onChange={e => isEditing ? setAnswer_key(e.target.value) : ""}
                                                            type="text"
                                                            className="form-input"
                                                            value={isEditing ? answer_key : sect.answer_key}
                                                            placeholder="Comma separated keywords for auto-grading"
                                                        />
                                                        <span className="form-hint">If left blank, this essay will require manual grading.</span>
                                                    </div>
                                                ) : ""
                                            }

                                        </div>
                                        <div className="section-card-footer">
                                            <div className="flex items-center gap-4">
                                                <label onClick={(e) => { e.stopPropagation(); if (isEditing) setIsQuiz(!is_quiz) }} className="form-toggle">
                                                    <div className={`toggle-track ${isEditing ? (is_quiz ? "is-active" : "") : (sect.is_quiz ? "is-active" : "")}`}><div className="toggle-knob"></div></div>
                                                    <span className="toggle-label">Include in Quiz Scoring</span>
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDuplicate(sect.id) }} className="btn-icon btn-ghost" title="Duplicate"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setSectId(sect.id); setDeleteSect(true) }} className="btn-icon btn-ghost text-error" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                                {isEditing ? (
                                                    <button type="submit" className="btn btn-primary">Save Changes</button>
                                                ) : ""}
                                            </div>
                                        </div>
                                    </form>
                                )
                            })
                        }
                    </div>

                    <button onClick={() => { setIsCreate(true); setSectId(""); setType("essay"); setSectTitle(""); setSectDesc(""); setIsQuiz(false) }} className="add-section-btn mt-6">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add New Question
                    </button>

                </div>
            </main >

            <div className={`modal-overlay ${isDelete ? "" : "hide"}`} id="deleteFormModal">
                <div className="modal">
                    <div className="modal-header">
                        <h3>Delete Form?</h3>
                        <button type="button" onClick={() => setIsDelete(false)} className="modal-close">&times;</button>
                    </div>
                    <div className="modal-body">
                        <p>Are you sure you want to delete this entire form? All responses will be permanently lost.</p>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => setIsDelete(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={() => handleDelete()} className="btn btn-danger">Delete Form</button>
                    </div>
                </div>
            </div>

            <div className={`modal-overlay ${isCreate ? "" : "hide"}`} id="addQuestionModal">
                <form onSubmit={e => handleAddSect(e)} className="modal">
                    <div className="modal-header">
                        <h3>Add New Question</h3>
                        <button type="button" onClick={() => setIsCreate(false)} className="modal-close">&times;</button>
                    </div>
                    <div className="modal-body">
                        <div>
                            <div className="form-group mb-4">
                                <label className="form-label" htmlFor="newQuestionTitle">Question Title</label>
                                <input onChange={e => setSectTitle(e.target.value)} type="text" id="newQuestionTitle" className="form-input" placeholder="e.g. What is your role?" required />
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label" htmlFor="newQuestionDesc">Description (Optional)</label>
                                <input onChange={e => setSectDesc(e.target.value)} type="text" id="newQuestionDesc" className="form-input" placeholder="Additional explanation..." />
                            </div>
                            <div className="form-group mb-4">
                                <label className="form-label" htmlFor="newQuestionType">Question Type</label>
                                <select onChange={e => setType(e.target.value)} id="newQuestionType" className="form-select" value={type}>
                                    {questionTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quiz Settings</label>
                                <label onClick={() => setIsQuiz(!is_quiz)} className="form-toggle">
                                    <div className={`toggle-track ${is_quiz ? "is-active" : ""}`}><div className="toggle-knob"></div></div>
                                    <span className="toggle-label">Include in Quiz Scoring</span>
                                </label>
                            </div>
                            {
                                is_quiz && type === "essay" && (
                                    <div className="form-group mt-4">
                                        <label className="form-label" htmlFor="newQuestionAnswerKey">Answer Key</label>
                                        <input onChange={e => setAnswer_key(e.target.value)} type="text" id="newQuestionAnswerKey" className="form-input" placeholder="Keywords for auto-grading" />
                                    </div>
                                )
                            }
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={() => setIsCreate(false)} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary">Add Question</button>
                    </div>
                </form>
            </div>

            <div className={`modal-overlay ${isDeleteSect ? "" : "hide"}`} id="deleteSectionModal">
                <div className="modal">
                    <div className="modal-header">
                        <h3>Delete Question?</h3>
                        <button className="modal-close" onClick={() => { setSectId(""); setDeleteSect(false) }}>&times;</button>
                    </div>
                    <div className="modal-body">
                        <p>Are you sure you want to delete this question? This action cannot be undone.</p>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => { setSectId(""); setDeleteSect(false) }} className="btn btn-secondary">Cancel</button>
                        <button className="btn btn-danger" onClick={() => handleDeleteSect()}>Delete</button>
                    </div>
                </div>
            </div>
        </>
    )
}