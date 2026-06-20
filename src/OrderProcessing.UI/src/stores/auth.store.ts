import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Role = 'admin' | 'customer'

export type AuthUser = {
  username: string
  role: Role
  displayName: string
  email: string
  customerId: string
}

type StoredUser = AuthUser & { password: string }

type AuthState = {
  user: AuthUser | null
  registeredUsers: StoredUser[]
  login: (username: string, password: string) => { success: boolean; error?: string }
  register: (displayName: string, username: string, email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
}

const DEFAULT_USERS: StoredUser[] = [
  {
    username: 'admin',
    password: 'admin',
    role: 'admin',
    displayName: 'Administrator',
    email: 'admin@shopnow.com',
    customerId: 'cust-admin-0001',
  },
  {
    username: 'Harsh',
    password: 'Harsh',
    role: 'customer',
    displayName: 'Harsh Kumar',
    email: 'harsh.nitmas@gmail.com',
    customerId: 'cust-550e8400-e29b-41d4-a716-446655440000',
  },
]

function toAuthUser(stored: StoredUser): AuthUser {
  return {
    username: stored.username,
    role: stored.role,
    displayName: stored.displayName,
    email: stored.email,
    customerId: stored.customerId,
  }
}

function generateCustomerId(): string {
  return 'cust-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      registeredUsers: [],

      login: (username, password) => {
        const all: StoredUser[] = [...DEFAULT_USERS, ...get().registeredUsers]
        const found = all.find(
          (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
        )
        if (!found) return { success: false, error: 'Invalid username or password' }
        set({ user: toAuthUser(found) })
        return { success: true }
      },

      register: (displayName, username, email, password) => {
        const all: StoredUser[] = [...DEFAULT_USERS, ...get().registeredUsers]
        if (all.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
          return { success: false, error: 'Username already taken' }
        }
        const newUser: StoredUser = {
          username,
          password,
          role: 'customer',
          displayName,
          email,
          customerId: generateCustomerId(),
        }
        set((state) => ({
          registeredUsers: [...state.registeredUsers, newUser],
          user: toAuthUser(newUser),
        }))
        return { success: true }
      },

      logout: () => set({ user: null }),
    }),
    { name: 'shopnow-auth' }
  )
)
