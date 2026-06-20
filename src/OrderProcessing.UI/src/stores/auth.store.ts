import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/api/auth.api'

export type AuthUser = {
  username: string
  role: string
  displayName: string
  email: string
  customerId: string
}

type AuthState = {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (displayName: string, username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      login: async (username, password) => {
        try {
          const dto = await authApi.login({ username, password })
          set({ user: dto })
          return { success: true }
        } catch (err: unknown) {
          const message = extractError(err) ?? 'Invalid username or password'
          return { success: false, error: message }
        }
      },

      register: async (displayName, username, email, password) => {
        try {
          const dto = await authApi.register({ displayName, username, email, password })
          set({ user: dto })
          return { success: true }
        } catch (err: unknown) {
          const message = extractError(err) ?? 'Registration failed'
          return { success: false, error: message }
        }
      },

      logout: () => set({ user: null }),
    }),
    {
      name: 'shopnow-auth',
      // Only persist the current session user — credentials live in the DB
      partialize: (state) => ({ user: state.user }),
    }
  )
)

function extractError(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined
  // ApiError shape produced by the Axios response interceptor in client.ts
  if ('detail' in err) return (err as { detail?: string }).detail
  // Raw Axios error fallback (e.g. network timeout before interceptor fires)
  if ('response' in err) {
    const res = (err as { response?: { data?: { detail?: string; title?: string } } }).response
    return res?.data?.detail ?? res?.data?.title
  }
  return undefined
}
