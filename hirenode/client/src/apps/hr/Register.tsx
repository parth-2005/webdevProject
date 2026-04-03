import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  
  const [formData, setFormData] = useState({
    companyName: '',
    subdomain: '',
    name: '',
    email: '',
    password: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/auth/register', formData)
      const { accessToken, refreshToken, user, tenant } = response.data
      
      localStorage.setItem('refreshToken', refreshToken)
      setAuth(accessToken, user, tenant)
      navigate('/hr/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-brand-bg p-4 overflow-y-auto">
      <Card className="w-full max-w-md glass-panel mt-12 mb-12">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-brand-primary">HireNode</CardTitle>
          <CardDescription>Create your tenant workspace</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-brand-danger/20 p-3 text-sm text-brand-danger">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="companyName">Company Name</label>
              <Input id="companyName" placeholder="Acme Corp" value={formData.companyName} onChange={handleChange} required />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="subdomain">Subdomain</label>
              <div className="flex bg-slate-800/50 rounded-md border border-slate-700 focus-within:ring-1 focus-within:ring-brand-primary focus-within:border-brand-primary">
                <input
                  id="subdomain"
                  type="text"
                  placeholder="acme"
                  value={formData.subdomain}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent p-2 outline-none text-sm text-slate-100 placeholder:text-slate-500 rounded-l-md"
                />
                <span className="inline-flex items-center px-3 text-sm text-slate-400 bg-slate-800/80 rounded-r-md border-l border-slate-700">
                  .hirenode.io
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">Your Name</label>
              <Input id="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Work Email</label>
              <Input id="email" type="email" placeholder="john@acme.com" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <Input id="password" type="password" value={formData.password} onChange={handleChange} minLength={6} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" isLoading={loading}>
              Create Workspace
            </Button>
            <div className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-brand-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
