import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import { Link, useParams } from "react-router-dom"
import api from "../api/api"
import FormTabs from "../components/FormTabs"
import SummaryCharts from "../components/SummaryCharts"

export default function FormResponses() {
    const params = useParams()
    const [result, setResult] = useState({})
    const [isDelete, setIsDelete] = useState(false)
    const [resId, setResId] = useState("")

    async function fetchResult() {
        api.get(`/forms/${params.slug}/summary`).then(res => {
            setResult(res.data)
        })
    }

    async function handleDelete() {
        api.delete(`/response/${resId}`).then(res => {
            setIsDelete(false)
            fetchResult()
        }).catch(error => alert(error.response.data.message))
    }

    useEffect(() => {
        document.title = "FormResponses | FormKraft"
        fetchResult()
    }, [])
    return (
        <>
            <Navbar></Navbar>
            <main class="page-wrapper container container--wide">
                <div class="page-content">

                    <div class="flex items-center justify-between mb-6 animate-slide-in">
                        <Link to={'/dashboard'} class="btn btn-secondary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ "margin-right": "8px" }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            Back
                        </Link>
                        <FormTabs slug={params.slug} activeTab="responses" />
                    </div>

                    <div class="responses-header animate-slide-in">
                        <div class="responses-header-info">
                            <h2>{result.form?.title}</h2>
                            <p>Responses Summary & Statistics</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <button class="btn btn-secondary btn-icon" title="Export to CSV">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            </button>
                        </div>
                    </div>

                    <div class={`stats-grid mb-8 stagger-children ${result.form?.type === 'survey' ? 'grid-cols-1' : ''}`}>
                        <div class="stat-card" style={result.form?.type === 'survey' ? { gridColumn: '1 / -1' } : {}}>
                            <div class="stat-icon stat-icon--primary">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <div class="stat-value">{result.summary?.total_respondents}</div>
                            <div class="stat-label">Total Respondents</div>
                        </div>
                        {
                            result.form?.type == "quiz" && (
                                <>
                                    <div class="stat-card">
                                        <div class="stat-icon stat-icon--info">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                        </div>
                                        <div class="stat-value">{result.summary?.average_scores}</div>
                                        <div class="stat-label">Average Score</div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon stat-icon--success">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                        <div class="stat-value text-success">{result.summary?.highest_score}</div>
                                        <div class="stat-label">Highest Score</div>
                                    </div>

                                    <div class="stat-card">
                                        <div class="stat-icon stat-icon--error">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </div>
                                        <div class="stat-value text-error">{result?.summary?.lowest_score}</div>
                                        <div class="stat-label">Lowest Score</div>
                                    </div>
                                </>
                            )
                        }
                    </div>

                    <SummaryCharts charts={result.charts} />

                    {result.responses?.length > 0 ? (
                        <>
                            <h3 class="mb-4 text-lg font-bold">Individual Responses</h3>

                            <div class="table-wrapper animate-fade-in-up" style={{ "animation-delay": "0.4s" }}>
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Respondent</th>
                                            <th>Submitted At</th>
                                            <th>Status</th>
                                            <th>Score</th>
                                            <th style={{ "width": "80px" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            result.responses?.map((res, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <div class="table-user">
                                                            <div class="table-user-avatar">{res.user?.name.charAt(0).toUpperCase()}</div>
                                                            <div class="table-user-info">
                                                                <span class="table-user-name">{res.user?.name}</span>
                                                                <span class="table-user-email">{res.user?.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="text-muted">{res.completed_at}</td>
                                                    <td><span class="badge badge-success">Completed</span></td>
                                                    <td class="font-bold text-success">{res.total_score}</td>
                                                    <td className="flex" colSpan={2}>
                                                        <Link to={`/${params.slug}/result/${res.id}`} class="btn btn-ghost btn-sm">View</Link>
                                                        <button onClick={() => { setIsDelete(true); setResId(res.id) }} className="btn btn-danger btn-sm">Delete</button>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="card empty-state animate-fade-in-up">
                            <div className="empty-state-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14.5 2 14.5 7.5 20 7.5"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><line x1="8" y1="9" x2="10" y2="9"></line></svg>
                            </div>
                            <h3>No responses yet</h3>
                            <p>Share your form link to start collecting responses.</p>
                        </div>
                    )}


                </div>
            </main>

            <div class={`modal-overlay ${isDelete ? "" : "hide"}`} id="deleteFormModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Delete Form?</h3>
                        <button onClick={() => { setIsDelete(false); setSlug("") }} class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this response? This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer">
                        <button onClick={() => { setIsDelete(false); setSlug("") }} class="btn btn-secondary">Cancel</button>
                        <button onClick={() => handleDelete()} class="btn btn-danger">Delete Form</button>
                    </div>
                </div>
            </div>
        </>
    )
}