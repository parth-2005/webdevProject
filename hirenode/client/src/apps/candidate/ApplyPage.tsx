import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { UploadCloud, FileText } from 'lucide-react'

export default function ApplyPage() {
  const { jobId } = useParams()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [file, setFile] = useState<File | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !file) return
    
    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('jobId', jobId as string)
    formData.append('name', name)
    formData.append('email', email)
    formData.append('phone', phone)
    formData.append('cv', file)
    
    try {
      await api.post('/candidates/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-bg p-4 text-center">
        <Card className="max-w-md w-full glass-panel">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="h-16 w-16 bg-brand-success/20 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-brand-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Application Received!</h2>
            <p className="text-slate-400 mb-6">
              Our AI is reviewing your profile right now. If shortlisted, you will receive an interview link via email shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4 py-12">
      <div className="mb-8 text-center max-w-xl">
        <h1 className="text-3xl font-bold text-slate-100">Apply for Role</h1>
        <p className="text-slate-400 mt-2">Submit your CV and details below to begin the autonomous application process.</p>
      </div>
      
      <Card className="w-full max-w-lg glass-panel">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            {error && (
              <div className="rounded-md bg-brand-danger/20 p-3 text-sm text-brand-danger">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Name</label>
              <Input required placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input required type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number (Optional)</label>
              <Input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Resume / CV</label>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  file ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                }`}
                onClick={() => document.getElementById('cv-upload')?.click()}
              >
                <input 
                  type="file" 
                  id="cv-upload" 
                  className="hidden" 
                  accept=".pdf"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0])
                    }
                  }}
                />
                {file ? (
                  <>
                    <FileText className="h-10 w-10 text-brand-primary mb-3" />
                    <span className="text-sm font-medium text-brand-primary">{file.name}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
                    <span className="text-sm font-medium text-slate-300">Upload your PDF resume</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-900 border-t border-slate-800 p-6 rounded-b-lg">
            <Button type="submit" className="w-full" isLoading={loading}>
              Submit Application
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
