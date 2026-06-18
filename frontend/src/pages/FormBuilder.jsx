import { useEffect, useRef, useState, useCallback } from "react"
import Navbar from "../components/Navbar"
import { Link, useNavigate, useParams } from "react-router-dom"
import api from "../api/api"
import FormTabs from "../components/FormTabs"

export default function FormBuilder() {
    const params = useParams()
    const navigate = useNavigate()
    
    // Core states
    const [form, setForm] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [errors, setErrors] = useState({})
    const [toasts, setToasts] = useState([])

    // Form detail states
    const [title, setTitle] = useState("")
    const [description, setDesc] = useState("")
    const [thank_you_title, setThankYouTitle] = useState("")
    const [thank_you_message, setThankYouMessage] = useState("")
    const [isDelete, setIsDelete] = useState(false)

    // Section editing states
    const [sectId, setSectId] = useState("")
    const [sectTitle, setSectTitle] = useState("")
    const [sectDesc, setSectDesc] = useState("")
    const [type, setType] = useState("essay")
    const [is_quiz, setIsQuiz] = useState(false)
    const [is_page_break, setIsPageBreak] = useState(false)
    const [answer_key, setAnswer_key] = useState("")
    const [options, setOptions] = useState([])
    
    // UI states
    const [isCreate, setIsCreate] = useState(false)
    const [isDeleteSect, setDeleteSect] = useState(false)
    const [confirmSwitch, setConfirmSwitch] = useState(null)
    const [dragIndexState, setDragIndexState] = useState(null)
    const [dropTargetIndex, setDropTargetIndex] = useState(null)

    // Dirty checking refs
    const initialSectionData = useRef(null)
    const dragIndex = useRef(0)

    // Toast helper
    const addToast = useCallback((message, status = 'success') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, status }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3000)
    }, [])

    const fetchForm = useCallback(async (showSkeleton = false) => {
        if (showSkeleton) setIsLoading(true)
        try {
            const res = await api.get(`/forms/${params.slug}`)
            setForm(res.data)
            setTitle(res.data.title || "")
            setDesc(res.data.description || "")
            setThankYouTitle(res.data.thank_you_title ?? "")
            setThankYouMessage(res.data.thank_you_message ?? "")
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to fetch form data", "error")
        } finally {
            setIsLoading(false)
        }
    }, [params.slug, addToast])

    const isSectionDirty = useCallback(() => {
        if (!sectId || !initialSectionData.current) return false
        
        const currentData = {
            title: sectTitle,
            description: sectDesc,
            type,
            is_quiz,
            is_page_break,
            answer_key,
            options: options.map(o => ({ id: o.id, option_text: o.option_text, is_correct: o.is_correct }))
        }

        return JSON.stringify(currentData) !== JSON.stringify(initialSectionData.current)
    }, [sectId, sectTitle, sectDesc, type, is_quiz, is_page_break, answer_key, options])

    const setSectionProps = (sect) => {
        const data = {
            title: sect.title ?? "",
            description: sect.description ?? "",
            type: sect.type ?? "essay",
            is_quiz: sect.is_quiz ?? false,
            is_page_break: sect.is_page_break ?? false,
            answer_key: sect.answer_key ?? "",
            options: (sect.options || []).map(opt => ({
                id: opt.id,
                option_text: opt.option_text ?? "",
                is_correct: opt.is_correct ?? false,
                image_url: opt.image_url,
                logic_target_section_id: opt.logic_target_section_id
            }))
        }
        
        setSectTitle(data.title)
        setSectDesc(data.description)
        setType(data.type)
        setIsQuiz(data.is_quiz)
        setIsPageBreak(data.is_page_break)
        setAnswer_key(data.answer_key)
        setOptions(data.options)
        setErrors({})
        
        // Save for dirty checking
        initialSectionData.current = {
            ...data,
            options: data.options.map(o => ({ id: o.id, option_text: o.option_text, is_correct: o.is_correct }))
        }
    }

    const autoExpand = (e) => {
        e.target.style.height = 'inherit'
        e.target.style.height = `${e.target.scrollHeight}px`
    }

    const handleSelectSection = (sect) => {
        if (sectId === sect.id) return
        if (isSectionDirty()) {
            setConfirmSwitch(() => () => {
                setSectId(sect.id)
                setSectionProps(sect)
                setConfirmSwitch(null)
            })
        } else {
            setSectId(sect.id)
            setSectionProps(sect)
        }
    }

    const handleCancelEdit = () => {
        if (isSectionDirty()) {
            setConfirmSwitch(() => () => {
                setSectId("")
                setConfirmSwitch(null)
            })
        } else {
            setSectId("")
        }
    }

    const handleDuplicate = async (id) => {
        setIsSaving(true)
        try {
            await api.post(`/sections/${id}/duplicate`)
            addToast("Section duplicated successfully")
            await fetchForm()
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to duplicate section", "error")
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddOption = async (id) => {
        setIsSaving(true)
        try {
            const res = await api.post(`/sections/${id}/options`)
            await fetchForm()
            if (res.data.data) {
                setOptions(prev => [...prev, {
                    id: res.data.data.id,
                    option_text: res.data.data.option_text ?? "",
                    is_correct: res.data.data.is_correct,
                    image_url: res.data.data.image_url,
                    logic_target_section_id: res.data.data.logic_target_section_id
                }])
            }
            addToast("Option added")
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to add option", "error")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDrop = async (dropTargetIdx) => {
        setDragIndexState(null)
        setDropTargetIndex(null)
        if (dragIndex.current === dropTargetIdx) return

        setIsSaving(true)
        let newSections = form.sections.map(s => s.id)
        let [moved] = newSections.splice(dragIndex.current, 1)
        newSections.splice(dropTargetIdx, 0, moved)

        try {
            await api.put(`/forms/${params.slug}/reorder`, { sections: newSections })
            addToast("Order updated")
            await fetchForm()
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to reorder sections", "error")
        } finally {
            setIsSaving(false)
            dragIndex.current = 0
        }
    }


    const handleEditSect = async (e, hasOptions = false) => {
        if (e) e.preventDefault()
        
        if (hasOptions && options.length < 2) {
            addToast("Please provide at least 2 options", "error")
            return
        }

        setErrors({})
        setIsSaving(true)

        const payload = {
            title: sectTitle,
            description: sectDesc,
            type,
            is_quiz,
            is_page_break,
            answer_key
        }

        try {
            const optionsToUpdate = options.filter(o => o.id)
            if (hasOptions && optionsToUpdate.length > 0) {
                await api.put(`/sections/${sectId}/options`, { options: optionsToUpdate })
            }

            await api.put(`/forms/${params.slug}/sections/${sectId}`, payload)
            addToast("Section updated successfully")
            await fetchForm()
            setSectId("")
            initialSectionData.current = null
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors)
                addToast("Validation error. Please check your inputs.", "error")
            } else {
                addToast(error.response?.data?.message || "Error updating section", "error")
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteSect = async () => {
        setIsSaving(true)
        try {
            await api.delete(`/forms/${params.slug}/sections/${sectId}`)
            addToast("Section deleted")
            await fetchForm()
            setDeleteSect(false)
            setSectId("")
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to delete section", "error")
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddSect = async (e) => {
        if (e) e.preventDefault()
        setErrors({})
        setIsSaving(true)
        try {
            await api.post(`/forms/${params.slug}/sections`, {
                title: sectTitle,
                description: sectDesc,
                type,
                is_quiz,
                is_page_break,
                answer_key
            })
            addToast("New question added")
            await fetchForm()
            setIsCreate(false)
            setSectTitle("")
            setSectDesc("")
            setAnswer_key("")
            setIsPageBreak(false)
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors)
            } else {
                addToast(error.response?.data?.message || "Failed to create section", "error")
            }
        } finally {
            setIsSaving(false)
        }
    }

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const handleUpdateForm = async (e) => {
        e.preventDefault()
        setErrors({})
        setIsSaving(true)
        try {
            await api.put(`/forms/${params.slug}`, {
                title,
                description,
                thank_you_title,
                thank_you_message
            })
            addToast("Form settings saved")
            await fetchForm()
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors)
            } else {
                addToast(error.response?.data?.message || "Failed to update form", "error")
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteForm = async () => {
        setIsSaving(true)
        try {
            await api.delete(`/forms/${params.slug}`)
            navigate('/dashboard')
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to delete form", "error")
        } finally {
            setIsSaving(false)
        }
    }

    const handleRemoveOption = async (sId, oId) => {
        setIsSaving(true)
        try {
            await api.delete(`/sections/${sId}/options/${oId}`)
            setOptions(prev => prev.filter(o => o.id !== oId))
            await fetchForm()
            addToast("Option removed")
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to remove option", "error")
        } finally {
            setIsSaving(false)
        }
    }

    const handleUploadImage = async (e, id, target = 'section') => {
        const file = e.target.files[0]
        if (!file) return

        setIsSaving(true)
        const formData = new FormData()
        formData.append('image', file)

        const url = target === 'section' ? `/sections/${id}/image` : `/options/${id}/image`
        
        try {
            const res = await api.post(url, formData)
            await fetchForm()
            if (target === 'option') {
                setOptions(prev => prev.map(o => o.id === id ? { ...o, image_url: res.data.image_url } : o))
            }
            addToast("Image uploaded")
        } catch (error) {
            addToast(error.response?.data?.message || "Upload failed", "error")
        } finally {
            setIsSaving(false)
        }
    }

    const handleRemoveImage = async (id, target = 'section') => {
        setIsSaving(true)
        const url = target === 'section' ? `/sections/${id}/image` : `/options/${id}/image`
        try {
            await api.delete(url)
            await fetchForm()
            if (target === 'option') {
                setOptions(prev => prev.map(o => o.id === id ? { ...o, image_url: null } : o))
            }
            addToast("Image removed")
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to remove image", "error")
        } finally {
            setIsSaving(false)
        }
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
        fetchForm(true)
    }, [fetchForm])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsDelete(false)
                setIsCreate(false)
                setDeleteSect(false)
                setConfirmSwitch(null)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleOverlayClick = (e, setter) => {
        if (e.target === e.currentTarget) setter(false)
    }

    const handleTypeChangeWithWarning = (newType) => {
        const isOptionBased = (t) => ["option", "checkbox", "dropdown"].includes(t)
        if (isOptionBased(type) && !isOptionBased(newType) && options.length > 0) {
            if (window.confirm("Changing to this type will remove your existing options. Continue?")) {
                setType(newType)
            }
        } else {
            setType(newType)
        }
    }

    if (isLoading) {
        return (
            <>
                <Navbar />
                <main className="page-wrapper container container--narrow">
                    <div className="page-content stagger-children">
                        <div className="skeleton mb-6" style={{ height: "40px", width: "120px" }}></div>
                        <div className="card mb-6">
                            <div className="card-body">
                                <div className="skeleton mb-4" style={{ height: "30px", width: "40%" }}></div>
                                <div className="skeleton mb-4" style={{ height: "50px" }}></div>
                                <div className="skeleton" style={{ height: "100px" }}></div>
                            </div>
                        </div>
                        {[1, 2].map(i => (
                            <div key={i} className="card mb-4" style={{ height: "150px" }}>
                                <div className="card-body flex gap-4">
                                    <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "50%" }}></div>
                                    <div className="flex-1">
                                        <div className="skeleton mb-3" style={{ height: "20px", width: "60%" }}></div>
                                        <div className="skeleton" style={{ height: "15px", width: "90%" }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </>
        )
    }

    return (
        <>
            <Navbar />
            
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.status}`}>
                        <div className="toast-icon">
                            {t.status === 'success' ? '✓' : '⚠'}
                        </div>
                        <div className="toast-content">{t.message}</div>
                    </div>
                ))}
            </div>

            <main className="page-wrapper container container--narrow">
                <div className="page-content">

                    <div className="flex items-center justify-between mb-6 animate-slide-in">
                        <div className="flex gap-2">
                            <Link to={'/dashboard'} className="btn btn-secondary focus-ring" aria-label="Go back to dashboard">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ "marginRight": "8px" }} aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                                Back
                            </Link>
                        </div>
                        <FormTabs slug={params.slug} activeTab="questions" />
                    </div>

                    <div className="card mb-6 animate-slide-in">
                        <div 
                            className="card-header cursor-pointer select-none" 
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            role="button"
                            aria-expanded={isSettingsOpen}
                        >
                            <div className="flex items-center gap-2">
                                <svg 
                                    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    style={{ transform: isSettingsOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                                    aria-hidden="true"
                                >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                                <h3 className="text-lg">Form Settings</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); setIsDelete(true) }} 
                                    className="btn btn-danger btn-sm focus-ring"
                                    disabled={isSaving}
                                    aria-label="Delete this form"
                                >
                                    Delete Form
                                </button>
                            </div>
                        </div>
                        {isSettingsOpen && (
                            <form onSubmit={handleUpdateForm} className="card-body animate-fade-in">
                                <div className="form-group mb-4">
                                    <label className="form-label" htmlFor="form-title">Form Title</label>
                                    <input 
                                        id="form-title"
                                        onChange={e => setTitle(e.target.value)} 
                                        type="text" 
                                        className={`form-input focus-ring text-lg font-bold ${errors.title ? "is-error" : ""}`} 
                                        value={title} 
                                        disabled={isSaving}
                                        placeholder="Enter form title..."
                                    />
                                    {errors.title && <p className="form-error" role="alert">{errors.title}</p>}
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label" htmlFor="form-desc">Description</label>
                                    <textarea 
                                        id="form-desc"
                                        onChange={e => setDesc(e.target.value)} 
                                        className={`form-textarea focus-ring ${errors.description ? "is-error" : ""}`} 
                                        style={{ "minHeight": "80px" }} 
                                        value={description}
                                        disabled={isSaving}
                                        placeholder="Briefly describe the purpose of this form..."
                                    ></textarea>
                                    {errors.description && <p className="form-error" role="alert">{errors.description}</p>}
                                </div>
                                
                                <div className="divider"></div>
                                
                                <div className="form-group mb-4">
                                    <label className="form-label" htmlFor="thank-title">Thank You Title</label>
                                    <input 
                                        id="thank-title"
                                        onChange={e => setThankYouTitle(e.target.value)} 
                                        type="text" 
                                        className="form-input focus-ring" 
                                        value={thank_you_title} 
                                        placeholder="e.g. Success!" 
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="form-label" htmlFor="thank-msg">Thank You Message</label>
                                    <textarea 
                                        id="thank-msg"
                                        onChange={e => setThankYouMessage(e.target.value)} 
                                        className="form-textarea focus-ring" 
                                        style={{ "minHeight": "80px" }} 
                                        value={thank_you_message} 
                                        placeholder="e.g. Your response has been recorded."
                                        disabled={isSaving}
                                    ></textarea>
                                </div>

                                <div className="form-group mb-4">
                                    <label className="form-label">Share Link</label>
                                    <div className="flex gap-2">
                                        <div className="share-link" aria-readonly="true">{window.location.origin}/{params.slug}/fill</div>
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary btn-sm focus-ring" 
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/${params.slug}/fill`)
                                                addToast("Link copied to clipboard!")
                                            }}
                                            aria-label="Copy share link to clipboard"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <button type="submit" className="btn btn-primary focus-ring" disabled={isSaving}>
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {(!form.sections || form.sections.length === 0) ? (
                        <div className="empty-state animate-fade-in">
                            <div className="empty-state-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            </div>
                            <h3>No Questions Yet</h3>
                            <p>Get started by adding your first question to this form.</p>
                            <button 
                                onClick={() => { 
                                    setIsCreate(true)
                                    setSectTitle("")
                                    setSectDesc("")
                                    setType("essay")
                                }} 
                                className="btn btn-primary"
                            >
                                Add First Question
                            </button>
                        </div>
                    ) : (
                        <div className="section-list">
                            {form.sections.map((sect, i) => {
                                const isEditing = sectId === sect.id
                                const hasOptions = ["option", "checkbox", "dropdown"].includes(isEditing ? type : sect.type)

                                return (
                                    <div 
                                        key={sect.id} 
                                        className={`flex flex-col gap-4 ${dragIndexState === i ? 'is-dragging' : ''} ${dropTargetIndex === i ? 'drop-target' : ''}`}
                                        onDragOver={(e) => {
                                            e.preventDefault()
                                            setDropTargetIndex(i)
                                        }}
                                        onDragLeave={() => setDropTargetIndex(null)}
                                        onDrop={() => handleDrop(i)}
                                    >
                                        {(isEditing ? is_page_break : sect.is_page_break) && (
                                            <div className="page-break-divider">
                                                <span>PAGE BREAK</span>
                                            </div>
                                        )}
                                        <div 
                                            onClick={() => handleSelectSection(sect)}
                                            className={`section-card section-card--${sect.type} ${isEditing ? 'card--active' : ''}`}
                                            style={isEditing ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 3px var(--primary-glow)' } : {}}
                                        >
                                            <div className="section-card-header">
                                                <div className="section-card-left" style={{ "width": "100%", flexWrap: "nowrap" }}>
                                                    <div 
                                                        draggable
                                                        onDragStart={() => {
                                                            dragIndex.current = i
                                                            setDragIndexState(i)
                                                        }}
                                                        onDragEnd={() => setDragIndexState(null)}
                                                        className="section-drag"
                                                        aria-label="Drag to reorder"
                                                        title="Drag to reorder"
                                                    >
                                                        ⋮⋮
                                                    </div>
                                                    <div className="section-order">{sect.order}</div>
                                                    <div className="flex-1 flex flex-col gap-1">
                                                        <div className="form-group">
                                                            <label className="sr-only" htmlFor={`title-${sect.id}`}>Question Title</label>
                                                            {isEditing ? (
                                                                <textarea
                                                                    id={`title-${sect.id}`}
                                                                    onChange={e => {
                                                                        setSectTitle(e.target.value)
                                                                        autoExpand(e)
                                                                    }}
                                                                    onInput={autoExpand}
                                                                    className={`form-textarea focus-ring ${errors.title ? "is-error" : ""}`}
                                                                    style={{ 
                                                                        padding: "10px 14px", 
                                                                        fontWeight: "600", 
                                                                        fontSize: "var(--font-md)",
                                                                        background: "var(--surface)",
                                                                        width: "100%",
                                                                        minHeight: "44px",
                                                                        resize: "none",
                                                                        overflow: "hidden"
                                                                    }}
                                                                    value={sectTitle}
                                                                    placeholder="Question Title"
                                                                    rows="1"
                                                                ></textarea>
                                                            ) : (
                                                                <div 
                                                                    className="font-bold text-md px-1 py-1"
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    {sect.title}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isEditing && errors.title && <p className="form-error ml-1 mb-2">{errors.title}</p>}
                                                        {isEditing ? (
                                                            <div className="form-group">
                                                                <label className="sr-only" htmlFor={`desc-${sect.id}`}>Description</label>
                                                                <textarea
                                                                    id={`desc-${sect.id}`}
                                                                    onChange={e => {
                                                                        setSectDesc(e.target.value)
                                                                        autoExpand(e)
                                                                    }}
                                                                    onInput={autoExpand}
                                                                    className="form-textarea focus-ring text-sm"
                                                                    style={{ 
                                                                        border: "1.5px solid var(--border)", 
                                                                        padding: "8px 14px",
                                                                        width: "100%",
                                                                        background: "var(--surface)",
                                                                        minHeight: "36px",
                                                                        resize: "none",
                                                                        overflow: "hidden"
                                                                    }}
                                                                    value={sectDesc}
                                                                    placeholder="Add a description (optional)"
                                                                    rows="1"
                                                                ></textarea>
                                                            </div>
                                                        ) : sect.description && (
                                                            <div className="text-xs text-muted px-1">{sect.description}</div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 ml-4">                                                        
                                                        {isEditing ? (
                                                            <div className="form-group">
                                                                <label className="sr-only" htmlFor={`type-${sect.id}`}>Question Type</label>
                                                                <select
                                                                    id={`type-${sect.id}`}
                                                                    onChange={e => handleTypeChangeWithWarning(e.target.value)}
                                                                    className="form-select focus-ring"
                                                                    style={{ "width": "160px" }}
                                                                    value={type}
                                                                    disabled={isSaving}
                                                                >
                                                                    {questionTypes.map(t => (
                                                                        <option key={t.id} value={t.id}>{t.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ) : (
                                                            <span className="badge badge-neutral text-xs">{questionTypes.find(t => t.id === sect.type)?.label}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="section-card-body">
                                                {isEditing && (
                                                    <div className="flex items-center gap-4 mb-4 pb-4 border-bottom">
                                                        {type !== "dropdown" && (
                                                            <label onClick={(e) => { e.stopPropagation(); setIsQuiz(!is_quiz) }} className="form-toggle">
                                                                <div className={`toggle-track ${is_quiz ? "is-active" : ""}`}><div className="toggle-knob"></div></div>
                                                                <span className="toggle-label">Quiz Scoring</span>
                                                            </label>
                                                        )}
                                                        <label onClick={(e) => { e.stopPropagation(); setIsPageBreak(!is_page_break) }} className="form-toggle">
                                                            <div className={`toggle-track ${is_page_break ? "is-active" : ""}`}><div className="toggle-knob"></div></div>
                                                            <span className="toggle-label">New Page</span>
                                                        </label>
                                                    </div>
                                                )}

                                                {/* Question Image */}
                                                {(isEditing || sect.image_url) && (
                                                    <div className="mb-4">
                                                        {sect.image_url ? (
                                                            <div className="question-image-container relative group">
                                                                <img src={sect.image_url} alt="Question" className="question-image" />
                                                                {isEditing && (
                                                                    <div className="absolute top-2 right-2 flex justify-center p-5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                                        <label className="btn btn-secondary btn-sm cursor-pointer">
                                                                            Change
                                                                            <input type="file" className="sr-only" onChange={(e) => handleUploadImage(e, sect.id, 'section')} />
                                                                        </label>
                                                                        <button type="button" onClick={() => handleRemoveImage(sect.id, 'section')} className="btn btn-danger btn-sm">Remove</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : isEditing && (
                                                            <label className="image-upload-btn">
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                                Add Image to Question
                                                                <input type="file" className="sr-only" onChange={(e) => handleUploadImage(e, sect.id, 'section')} />
                                                            </label>
                                                        )}
                                                    </div>
                                                )}

                                                {sect.type === "essay" && (
                                                    <textarea disabled className="form-textarea focus-ring mb-4" placeholder="User answer will go here..." style={{ "backgroundColor": "var(--background-alt)", "resize": "none", "minHeight": "80px" }}></textarea>
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
                                                    <input type="date" disabled className="form-input focus-ring mb-4" style={{ "backgroundColor": "var(--background-alt)" }} />
                                                )}

                                                {sect.type === "file" && (
                                                    <div className="file-upload-container mb-4">
                                                        <svg className="file-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                        <span className="file-upload-text">File upload field</span>
                                                    </div>
                                                )}

                                                {hasOptions && (
                                                    <div className="option-list mb-4">
                                                        {(isEditing ? options : sect.options || []).map((opt, idx) => (
                                                            <div key={idx} className="flex flex-col gap-2 p-3 bg-background-alt border border-border rounded-md">
                                                                <div className="flex items-center gap-3">
                                                                    {sect.type !== "dropdown" && (
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
                                                                            className={`${sect.type === "checkbox" ? "checkbox-box" : "option-marker"} ${opt.is_correct ? "is-correct" : ""} ${isEditing ? 'cursor-pointer' : ''}`}
                                                                        ></div>
                                                                    )}
                                                                    <div className="form-group flex-1">
                                                                        <label className="sr-only" htmlFor={`opt-${opt.id}`}>Option Text</label>
                                                                        <input
                                                                            id={`opt-${opt.id}`}
                                                                             style={{
                                                                                width:"100%"
                                                                            }}
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
                                                                    </div>
                                                                    {isEditing && (
                                                                        <div className="option-actions">
                                                                            {(type === "option" || type === "dropdown") && (
                                                                                <select 
                                                                                    className="form-select focus-ring text-xs" 
                                                                                    style={{width: "140px"}}
                                                                                    value={opt.logic_target_section_id || ""}
                                                                                    onChange={e => {
                                                                                        let updated = [...options]
                                                                                        updated[idx].logic_target_section_id = e.target.value || null
                                                                                        setOptions(updated)
                                                                                    }}
                                                                                >
                                                                                    <option value="">Next Question</option>
                                                                                    {form.sections?.filter(s => s.id !== sect.id).map(s => (
                                                                                        <option key={s.id} value={s.id}>Go to: {s.title.substring(0, 20)}...</option>
                                                                                    ))}
                                                                                </select>
                                                                            )}
                                                                            <label className="btn-icon btn-sm flex justify-center items-center btn-ghost cursor-pointer" title="Add Image">
                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                                                <input type="file" className="sr-only" onChange={(e) => handleUploadImage(e, opt.id, 'option')} />
                                                                            </label>
                                                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveOption(sect.id, opt.id) }} className="btn-icon btn-sm btn-ghost text-error" title="Remove"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {opt.image_url && (
                                                                    <div className="option-image-container relative group ml-8">
                                                                        <img src={opt.image_url} alt="Option" className="option-image" />
                                                                        {isEditing && (
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md gap-2">
                                                                                <label className="btn btn-secondary btn-sm cursor-pointer">
                                                                                    Change
                                                                                    <input type="file" className="sr-only" onChange={(e) => handleUploadImage(e, opt.id, 'option')} />
                                                                                </label>
                                                                                <button type="button" onClick={() => handleRemoveImage(opt.id, 'option')} className="btn btn-danger btn-sm">Remove</button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {isEditing && (
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleAddOption(sect.id)} 
                                                                className="btn btn-ghost btn-sm mt-2" 
                                                                style={{ alignSelf: "flex-start" }}
                                                                disabled={isSaving}
                                                            >
                                                                + Add Option
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {(isEditing ? is_quiz : sect.is_quiz) && (isEditing ? type : sect.type) === "essay" && (
                                                    <div className="form-group mb-4">
                                                        <label className="form-label text-xs flex items-center gap-2" htmlFor={`key-${sect.id}`}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                                                            Answer Key (Keywords)
                                                        </label>
                                                        <input
                                                            id={`key-${sect.id}`}
                                                            onChange={e => isEditing ? setAnswer_key(e.target.value) : ""}
                                                            type="text"
                                                            className="form-input focus-ring"
                                                            value={isEditing ? answer_key : sect.answer_key}
                                                            placeholder="Comma separated keywords"
                                                            readOnly={!isEditing}
                                                        />
                                                        {isEditing && <span className="form-hint">Manual grading if blank.</span>}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="section-card-footer">
                                                <div className="flex items-center gap-2">
                                                    {!isEditing && (
                                                        <div className="flex gap-2">
                                                            {sect.is_quiz && <span className="badge badge-quiz">Quiz</span>}
                                                            {sect.is_page_break && <span className="badge badge-primary">Page Break</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDuplicate(sect.id) }} className="btn-icon btn-ghost" title="Duplicate" disabled={isSaving}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                    </button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setSectId(sect.id); setDeleteSect(true) }} className="btn-icon btn-ghost text-error" title="Delete" disabled={isSaving}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                    {isEditing ? (
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleCancelEdit() }} className="btn btn-secondary btn-sm" disabled={isSaving}>
                                                                Cancel
                                                            </button>
                                                            <button type="button" onClick={(e) => handleEditSect(e, hasOptions)} className="btn btn-primary btn-sm" disabled={isSaving}>
                                                                {isSaving ? "Saving..." : "Save Changes"}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button type="button" className="btn btn-ghost btn-sm">Edit</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <button 
                        onClick={() => { 
                            setIsCreate(true)
                            setSectId("")
                            setType("essay")
                            setSectTitle("")
                            setSectDesc("")
                            setIsQuiz(false)
                            setIsPageBreak(false)
                        }} 
                        className="add-section-btn mt-6"
                        disabled={isSaving}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add New Question
                    </button>

                </div>
            </main>

            {/* Modals */}
            
            {/* Delete Form Modal */}
            <div 
                className={`modal-overlay ${isDelete ? "" : "hide"}`} 
                onClick={(e) => handleOverlayClick(e, setIsDelete)}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal">
                    <div className="modal-header">
                        <h3>Delete Form?</h3>
                        <button type="button" onClick={() => setIsDelete(false)} className="modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div className="modal-body">
                        <p>Are you sure you want to delete this entire form? All responses will be permanently lost.</p>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => setIsDelete(false)} className="btn btn-secondary" disabled={isSaving}>Cancel</button>
                        <button onClick={handleDeleteForm} className="btn btn-danger" disabled={isSaving}>
                            {isSaving ? "Deleting..." : "Delete Form"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Question Modal */}
            <div 
                className={`modal-overlay ${isCreate ? "" : "hide"}`}
                onClick={(e) => handleOverlayClick(e, setIsCreate)}
                role="dialog"
                aria-modal="true"
            >
                <form onSubmit={handleAddSect} className="modal">
                    <div className="modal-header">
                        <h3>Add New Question</h3>
                        <button type="button" onClick={() => setIsCreate(false)} className="modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div className="modal-body">
                        <div className="form-group mb-4">
                            <label className="form-label" htmlFor="new-q-title">Question Title</label>
                            <input 
                                id="new-q-title"
                                onChange={e => setSectTitle(e.target.value)} 
                                type="text" 
                                className={`form-input focus-ring ${errors.title ? "is-error" : ""}`} 
                                placeholder="e.g. What is your role?" 
                                required 
                                autoFocus
                            />
                            {errors.title && <p className="form-error">{errors.title}</p>}
                        </div>
                        <div className="form-group mb-4">
                            <label className="form-label" htmlFor="new-q-desc">Description (Optional)</label>
                            <input id="new-q-desc" onChange={e => setSectDesc(e.target.value)} type="text" className="form-input focus-ring" placeholder="Additional explanation..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="form-group">
                                <label className="form-label" htmlFor="new-q-type">Question Type</label>
                                <select 
                                    id="new-q-type"
                                    onChange={e => setType(e.target.value)} 
                                    className="form-select focus-ring" 
                                    value={type}
                                >
                                    {questionTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2 pt-6">
                                {type !== "dropdown" && (
                                    <label onClick={() => setIsQuiz(!is_quiz)} className="form-toggle">
                                        <div className={`toggle-track ${is_quiz ? "is-active" : ""}`}><div className="toggle-knob"></div></div>
                                        <span className="toggle-label">Quiz Scoring</span>
                                    </label>
                                )}
                                <label onClick={() => setIsPageBreak(!is_page_break)} className="form-toggle">
                                    <div className={`toggle-track ${is_page_break ? "is-active" : ""}`}><div className="toggle-knob"></div></div>
                                    <span className="toggle-label">Start New Page</span>
                                </label>
                            </div>
                        </div>
                        {is_quiz && type === "essay" && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="new-q-key">Answer Key</label>
                                <input id="new-q-key" onChange={e => setAnswer_key(e.target.value)} type="text" className="form-input focus-ring" placeholder="Keywords for auto-grading" />
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={() => setIsCreate(false)} className="btn btn-secondary" disabled={isSaving}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? "Creating..." : "Add Question"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Delete Section Modal */}
            <div 
                className={`modal-overlay ${isDeleteSect ? "" : "hide"}`}
                onClick={(e) => handleOverlayClick(e, setDeleteSect)}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal">
                    <div className="modal-header">
                        <h3>Delete Question?</h3>
                        <button className="modal-close" onClick={() => { setSectId(""); setDeleteSect(false) }} aria-label="Close">&times;</button>
                    </div>
                    <div className="modal-body">
                        <p>Are you sure you want to delete this question? This action cannot be undone.</p>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => { setSectId(""); setDeleteSect(false) }} className="btn btn-secondary" disabled={isSaving}>Cancel</button>
                        <button className="btn btn-danger" onClick={handleDeleteSect} disabled={isSaving}>
                            {isSaving ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Unsaved Changes Confirmation Modal */}
            <div 
                className={`modal-overlay ${confirmSwitch ? "" : "hide"}`}
                onClick={() => setConfirmSwitch(null)}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal">
                    <div className="modal-header">
                        <h3>Unsaved Changes</h3>
                        <button className="modal-close" onClick={() => setConfirmSwitch(null)} aria-label="Close">&times;</button>
                    </div>
                    <div className="modal-body">
                        <p>You have unsaved changes in this section. Do you want to discard them and continue?</p>
                    </div>
                    <div className="modal-footer">
                        <button onClick={() => setConfirmSwitch(null)} className="btn btn-secondary">Keep Editing</button>
                        <button onClick={() => confirmSwitch()} className="btn btn-danger">Discard & Continue</button>
                    </div>
                </div>
            </div>
        </>
    )
}
