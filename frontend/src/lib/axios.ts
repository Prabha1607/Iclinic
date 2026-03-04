import axios from 'axios'
import { store, type RootState } from '../app/store'
import { setCredentials } from '../features/auth/slices/authSlice'
import { refreshToken } from '../features/auth/services/authService'

const api = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})

api.interceptors.request.use((config) => {
    const state = store.getState() as RootState

    if (state.auth.token) {
        config.headers['Authorization'] = `Bearer ${state.auth.token}`
    }

    return config
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const request = error.config

        if (error.response?.status === 401 && !request._retry) {
            request._retry = true

            try {
                const data = await refreshToken()
                store.dispatch(setCredentials(data.access_token))

                request.headers['Authorization'] =
                    `Bearer ${data.access_token}`

                return api(request)

            } catch (refreshError) {
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api