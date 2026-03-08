import axios from 'axios'
import { store, type RootState } from '../app/store'
import { setCredentials, clearCredentials, getTokenCookie } from '../features/auth/slices/authSlice'

const api = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
    const state = store.getState() as RootState
    const token = state.auth.token ?? getTokenCookie()
    if (token) config.headers['Authorization'] = `Bearer ${token}`
    return config
})

let refreshPromise: Promise<string> | null = null

async function doRefresh(): Promise<string> {
    if (refreshPromise) return refreshPromise
    refreshPromise = axios
        .post<{ access_token: string }>(
            'http://localhost:8000/api/v1/auth/refresh',
            null,
            { withCredentials: true }
        )
        .then((res) => {
            const newToken = res.data.access_token
            const s = store.getState() as RootState
            store.dispatch(setCredentials({
                token: newToken,
                user: { id: s.auth.userId ?? 0, email: '', name: '', role_id: s.auth.roleId ?? 0, phone_number: '' }
            }))
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
            return newToken
        })
        .finally(() => { refreshPromise = null })
    return refreshPromise
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/')
        if (error.response?.status !== 401 || originalRequest?._retry || isAuthEndpoint) {
            return Promise.reject(error)
        }
        originalRequest._retry = true
        try {
            const newToken = await doRefresh()
            originalRequest.headers = {
                ...originalRequest.headers,
                'Authorization': `Bearer ${newToken}`
            }
            return api(originalRequest)
        } catch (refreshError) {
            store.dispatch(clearCredentials())
            window.location.href = '/login'
            return Promise.reject(refreshError)
        }
    }
)

export default api
