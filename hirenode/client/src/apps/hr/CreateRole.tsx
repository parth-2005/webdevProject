import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { UploadCloud, FileText } from 'lucide-react'

export default function CreateRole() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const createRoleMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/jobs/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data.job
    },
    onSuccess: (newJob) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      navigate(`/hr/roles/${newJob._id}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return

    const formData = new FormData()
    formData.append('title', title)
    
    if (file) {
      formData.append('jdFile', file)
    } else {
      formData.append('description', description)
    }

    createRoleMutation.mutate(formData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New Role</h2>
        <p className="text-slate-400">Upload a Job Description and let our AI build the interview rubric.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
            <CardDescription>Basic information about the position.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">Job Title</label>
              <Input
                id="title"
                placeholder="e.g. Senior Frontend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">Job Description</label>
              
              <div className="grid grid-cols-2 gap-4">
                {/* File Upload Option */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    file ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                  }`}
                  onClick={() => document.getElementById('jd-upload')?.click()}
                >
                  <input 
                    type="file" 
                    id="jd-upload" 
                    className="hidden" 
                    accept=".pdf,.txt,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0])
                        setDescription('')
                      }
                    }}
                  />
                  {file ? (
                    <>
                      <FileText className="h-8 w-8 text-brand-primary mb-2" />
                      <span className="text-sm font-medium text-brand-primary">{file.name}</span>
                      <span className="text-xs text-slate-400 mt-1">Click to change</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                      <span className="text-sm font-medium text-slate-300">Upload JD</span>
                      <span className="text-xs text-slate-500 mt-1">PDF, TXT, DOCX</span>
                    </>
                  )}
                </div>

                {/* Text Input Option */}
                <div className="flex flex-col">
                  <textarea
                    placeholder="Or paste the job description here..."
                    className="flex-1 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      setFile(null)
                    }}
                    disabled={!!file}
                  />
                </div>
              </div>
            </div>
            
            {createRoleMutation.isError && (
              <div className="rounded-md bg-brand-danger/20 p-3 text-sm text-brand-danger">
                Failed to create role. Please try again.
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-slate-900/50 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">AI will automatically generate the rubric.</span>
            <Button type="submit" isLoading={createRoleMutation.isPending}>
              Create & Generate Rubric
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
