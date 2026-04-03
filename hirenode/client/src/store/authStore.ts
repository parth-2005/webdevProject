import { create } from 'zustand'

interface User {
  _id: string
  name: string
  email: string
  role: string
}

interface Tenant {
  id: string
  companyName: string
  subdomain: string
  plan: any
}

interface AuthState {
  token: string | null
  user: User | null
  tenant: Tenant | null
  setAuth: (token: string, user: User, tenant: Tenant) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('accessToken') || null,
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null,
  tenant: localStorage.getItem('tenant') ? JSON.parse(localStorage.getItem('tenant') as string) : null,
  
  setAuth: (token, user, tenant) => {
    localStorage.setItem('accessToken', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('tenant', JSON.stringify(tenant))
    set({ token, user, tenant })
  },
  
  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('tenant')
    set({ token: null, user: null, tenant: null })
  }
}))
