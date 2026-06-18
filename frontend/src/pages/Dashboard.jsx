import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import api from "../api/api"
import { Link } from "react-router-dom"

export default function Dashboard() {
    const [forms, setForms] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreate, setIsCreate] = useState(false)
    const [isDelete, setIsDelete] = useState(false)
    const [slug, setSlug] = useState("")

    //create
    const [title, setTitle] = useState("")
    const [description, setDesc] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    async function handleCreate(e) {
        e.preventDefault()
        setIsSaving(true)
        api.post('/forms', {
            title,
            description
        }).then(() => {
            fetchForms()
            setIsCreate(false)
            setTitle("")
            setDesc("")
        }).catch(error => alert(error.response.data.message))
        .finally(() => setIsSaving(false))
    }

    async function fetchForms() {
        setIsLoading(true)
        api.get('/forms').then(res => {
            setForms(res.data.forms)
        }).finally(() => setIsLoading(false))
    }

    async function handleDelete() {
        setIsSaving(true)
        api.delete(`/forms/${slug}`).then(() => {
            setIsDelete(false)
            setSlug("")
            fetchForms()
        }).catch(error => alert(error.response.data.message))
        .finally(() => setIsSaving(false))
    }

    useEffect(() => {
        document.title = "Dashboard | FormKraft"
        fetchForms()
    }, [])

    if (isLoading) {
        return (
            <>
                <Navbar></Navbar>
                <main class="page-wrapper container container--wide">
                    <div class="page-content">
                        <div class="page-header">
                            <div class="page-header-info">
                                <div class="skeleton" style={{ height: '32px', width: '200px', marginBottom: '8px' }}></div>
                                <div class="skeleton" style={{ height: '16px', width: '300px' }}></div>
                            </div>
                        </div>
                        <div class="forms-grid">
                            {[1, 2, 3].map(i => (
                                <div key={i} class="form-card" style={{ height: '200px' }}>
                                    <div class="form-card-body">
                                        <div class="skeleton mb-4" style={{ height: '24px', width: '70%' }}></div>
                                        <div class="skeleton mb-2" style={{ height: '14px', width: '100%' }}></div>
                                        <div class="skeleton mb-4" style={{ height: '14px', width: '100%' }}></div>
                                        <div class="skeleton" style={{ height: '14px', width: '40%' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </>
        )
    }

    return (
        <>
            <Navbar></Navbar>
            <main class="page-wrapper container container--wide">
                <div class="page-content">

                    <div class="page-header">
                        <div class="page-header-info">
                            <h1>My Forms</h1>
                            <p>Manage all your forms and quizzes in one place.</p>
                        </div>
                        <div class="btn-group">
                            <button onClick={() => setIsCreate(true)} class="btn btn-primary">Create Form</button>
                        </div>
                    </div>

                    {
                        forms.length == 0 ? (
                            <div class="empty-state animate-fade-in-up">
                                <div class="empty-state-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                </div>
                                <h3>No forms yet</h3>
                                <p>You haven't created any forms. Click the button below to start building your first form.</p>
                                <button class="btn btn-primary" onClick={()=>setIsCreate(true)}>Create New Form</button>
                            </div>
                        ) : (
                            <div class="forms-grid animate-fade-in-up">

                                {
                                    forms.map((form, i) => (
                                        <div key={i} class="form-card form-card--interactive">
                                            <div class="form-card-accent"></div>
                                            <div class="form-card-body">
                                                <h3 class="form-card-title">{form.title}</h3>
                                                <p class="form-card-description">{form.description}</p>
                                                <div class="form-card-meta">
                                                    <div class="form-card-meta-item">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                                        {form.total_questions} {form.total_questions === 1 ? 'Question' : 'Questions'}
                                                    </div>
                                                    <div class="form-card-meta-item">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                        {new Date(form.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-card-footer">
                                                <Link to={`/${form.slug}`} class="btn btn-primary btn-sm flex-1 focus-ring">Manage Form</Link>
                                                <button 
                                                    onClick={(e) => { e.preventDefault(); setIsDelete(true); setSlug(form.slug) }} 
                                                    className="btn btn-danger btn-sm focus-ring"
                                                    aria-label={`Delete form ${form.title}`}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        )
                    }

                </div>
            </main>

            <div class={`modal-overlay ${isCreate ? "" : "hide"}`} id="createFormModal" onClick={(e) => e.target === e.currentTarget && setIsCreate(false)}>
                <form onSubmit={e => handleCreate(e)} class="modal animate-modal-enter">
                    <div class="modal-header">
                        <h3>Create New Form</h3>
                        <button type="button" onClick={()=>setIsCreate(false)} class="modal-close" aria-label="Close modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="createForm">
                            <div class="form-group">
                                <label class="form-label" for="formTitle">Form Title</label>
                                <input 
                                    onChange={e => setTitle(e.target.value)} 
                                    type="text" 
                                    id="formTitle" 
                                    class="form-input focus-ring" 
                                    placeholder="e.g. Customer Feedback Survey" 
                                    required
                                    autoFocus
                                />
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="formDescription">Description</label>
                                <textarea 
                                    onChange={e => setDesc(e.target.value)} 
                                    id="formDescription" 
                                    class="form-textarea focus-ring" 
                                    placeholder="Briefly describe the purpose of this form..." 
                                    style={{ "min-height": "80px" }}
                                ></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" onClick={()=>setIsCreate(false)} class="btn btn-secondary">Cancel</button>
                        <button type="submit" class="btn btn-primary" disabled={isSaving}>
                            {isSaving ? "Creating..." : "Create Form"}
                        </button>
                    </div>
                </form>
            </div>

            <div class={`modal-overlay ${isDelete ? "" : "hide"}`} id="deleteFormModal" onClick={(e) => e.target === e.currentTarget && setIsDelete(false)}>
                <div class="modal animate-modal-enter">
                    <div class="modal-header">
                        <h3>Delete Form?</h3>
                        <button onClick={() => { setIsDelete(false); setSlug("") }} class="modal-close" aria-label="Close modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this form? All associated responses will also be deleted. This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer">
                        <button onClick={() => { setIsDelete(false); setSlug("") }} class="btn btn-secondary">Cancel</button>
                        <button onClick={() => handleDelete()} class="btn btn-danger" disabled={isSaving}>
                            {isSaving ? "Deleting..." : "Delete Form"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}