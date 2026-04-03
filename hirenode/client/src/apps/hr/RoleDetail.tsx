import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Settings, Copy, Share } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function RoleDetail() {
  const { jobId } = useParams()
  const { tenant } = useAuthStore()

  const { data: jobData, isLoading: isLoadingJob } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await api.get(`/jobs/${jobId}`)
      return res.data
    }
  })

  const { data: pipelineData, isLoading: isLoadingPipeline } = useQuery({
    queryKey: ['pipeline', jobId],
    queryFn: async () => {
      const res = await api.get(`/hr/pipeline/${jobId}`)
      return res.data.pipeline
    }
  })

  if (isLoadingJob || isLoadingPipeline) {
    return <div className="flex h-full items-center justify-center text-slate-400 animate-pulse">Loading Pipeline...</div>
  }

  const job = jobData?.job
  const pipeline = pipelineData || {}

  const stages = [
    { id: 'applied', label: 'Applied', color: 'bg-slate-700' },
    { id: 'shortlisted', label: 'Shortlisted', color: 'bg-brand-primary' },
    { id: 'interview_scheduled', label: 'In Progress', color: 'bg-brand-warning' },
    { id: 'completed', label: 'Completed', color: 'bg-slate-500' },
    { id: 'reviewed', label: 'Reviewed', color: 'bg-brand-success' },
  ]

  const applyLink = `${window.location.origin}/${tenant?.subdomain || 'tenant'}/apply/${job?._id}`

  const handleExport = async () => {
    try {
      const response = await api.get(`/hr/export-report/${jobId}`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report-${jobId}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
    } catch (err) {
      console.error('Export failed', err)
    }
  }

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-3xl font-bold tracking-tight">{job?.title}</h2>
            <Badge variant={job?.status === 'active' ? 'success' : 'secondary'}>{job?.status}</Badge>
          </div>
          <p className="text-slate-400 max-w-3xl line-clamp-2">{job?.description}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(applyLink)}>
            <Copy className="mr-2 h-4 w-4" /> Copy Apply Link
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Share className="mr-2 h-4 w-4" /> Export Report
          </Button>
          <Button variant="secondary">
            <Settings className="mr-2 h-4 w-4" /> Edit Rubric
          </Button>
        </div>
      </div>

      {/* Kanban Pipeline */}
      <div className="flex-1 flex overflow-x-auto space-x-4 pb-4">
        {stages.map(stage => {
          const candidatesInStage = pipeline[stage.id] || []
          
          return (
            <div key={stage.id} className="w-80 flex-shrink-0 flex flex-col bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                  <h3 className="font-medium text-sm text-slate-200">{stage.label}</h3>
                </div>
                <Badge variant="secondary" className="px-1.5 py-0 min-w-0 text-xs">{candidatesInStage.length}</Badge>
              </div>
              
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {candidatesInStage.map((candidate: any) => (
                  <Card key={candidate._id} className="cursor-pointer hover:border-brand-primary transition-colors bg-slate-800/80" onClick={() => window.location.href = `/hr/candidates/${candidate._id}`}>
                    <CardContent className="p-4 flex flex-col space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm truncate pr-2">{candidate.personal.name}</div>
                        {candidate.scores?.overall && (
                          <Badge variant="default" className="text-xs bg-brand-primary/20 text-brand-primary border-brand-primary/30">
                            {Math.round(candidate.scores.overall)}
                          </Badge>
                        )}
                      </div>
                      
                      {candidate.scores?.aiVerdict && (
                        <div className="flex items-center text-xs">
                          <span className={`px-2 py-0.5 rounded-full ${
                            candidate.scores.aiVerdict === 'shortlist' ? 'bg-brand-success/20 text-brand-success' :
                            candidate.scores.aiVerdict === 'reject' ? 'bg-brand-danger/20 text-brand-danger' :
                            'bg-brand-warning/20 text-brand-warning'
                          }`}>
                            {candidate.scores.aiVerdict.toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      <div className="text-xs text-slate-500 mt-2">
                        Applied {new Date(candidate.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {candidatesInStage.length === 0 && (
                  <div className="p-4 text-center text-sm text-slate-500 border border-dashed border-slate-700/50 rounded-lg">
                    No candidates
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
