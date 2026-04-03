import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Plus, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { api } from '@/services/api'

export function Sidebar() {
  const location = useLocation()
  const { tenant, logout } = useAuthStore()

  const navItems = [
    { name: 'Dashboard', path: '/hr/dashboard', icon: LayoutDashboard },
    { name: 'Roles', path: '/hr/roles', icon: Briefcase },
    { name: 'New Role', path: '/hr/roles/new', icon: Plus },
    { name: 'Settings', path: '/hr/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {}
    logout()
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-8 px-4">
        <h1 className="text-2xl font-bold text-brand-primary">
          HireNode
        </h1>
        {tenant && <p className="text-sm text-slate-400">{tenant.companyName}</p>}
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto px-4">
        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-brand-danger hover:bg-brand-danger/10" onClick={handleLogout}>
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
