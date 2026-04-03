import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'

export default function HRLayout() {
  return (
    <div className="flex h-screen w-full bg-brand-bg text-slate-100 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
