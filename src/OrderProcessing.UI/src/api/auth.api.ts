import apiClient from './client'
import type { UserDto } from './types'

export const authApi = {
  register: async (payload: {
    displayName: string
    username: string
    email: string
    password: string
  }): Promise<UserDto> => {
    const res = await apiClient.post<UserDto>('/api/v1/auth/register', payload)
    return res.data
  },

  login: async (payload: { username: string; password: string }): Promise<UserDto> => {
    const res = await apiClient.post<UserDto>('/api/v1/auth/login', payload)
    return res.data
  },
}
