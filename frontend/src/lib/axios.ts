import axios from 'axios'
import { store, type RootState } from '../app/store'
import { setCredentials, clearCredentials, getTokenCookie } from '../features/auth/slices/authSlice'
import { refreshToken } from '../features/auth/services/authService'

const api = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})

// ── Request interceptor: attach Bearer token ───────────────────────────────────
api.interceptors.request.use((config) => {
    const state = store.getState() as RootState

    // Prefer Redux store token; fall back to cookie (covers first request after reload)
    const token = state.auth.token ?? getTokenCookie()

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
})

// ── Response interceptor: auto-refresh on 401 ─────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const request = error.config

        if (error.response?.status === 401 && !request._retry) {
            request._retry = true

            try {
                const data = await refreshToken()
                store.dispatch(setCredentials(data.access_token))
                request.headers['Authorization'] = `Bearer ${data.access_token}`
                return api(request)
            } catch (refreshError) {
                // Refresh failed — clear session and redirect to login
                store.dispatch(clearCredentials())
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api
