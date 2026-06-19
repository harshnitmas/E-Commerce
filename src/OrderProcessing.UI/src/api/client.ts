import axios from 'axios'
import type { ApiError, ApiResponse } from './types'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  config.headers['X-Correlation-Id'] = crypto.randomUUID()
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    const wrapped = response.data as ApiResponse<unknown>
    response.data = wrapped.data ?? response.data
    return response
  },
  (error) => {
    const apiError: ApiError = {
      title: 'Request failed',
      status: error.response?.status ?? 0,
      detail: error.response?.data?.detail ?? error.message,
      errors: error.response?.data?.errors ?? [],
      correlationId: error.response?.headers?.['x-correlation-id'],
    }
    return Promise.reject(apiError)
  }
)

export default apiClient
