import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Download, AlertTriangle, UserCheck, UserX, Clock } from 'lucide-react'
import { Input } from '@/components/ui/Input'

export default function CandidateReport() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [overrideDecision, setOverrideDecision] = useState<'shortlist' | 'reject' | null>(null)
  const [overrideFeedback, setOverrideFeedback] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: async () => {
      const res = await api.get(`/candidates/${candidateId}`)
      return res.data.candidate
    }
  })

  const overrideMutation = useMutation({
    mutationFn: async () => {
      await api.post('/rlhf/override', {
        candidateId,
        newDecision: overrideDecision,
        feedback: overrideFeedback
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] })
      setOverrideDecision(null)
      setOverrideFeedback('')
    }
  })

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-slate-400 animate-pulse">Loading Report...</div>
  }

  const candidate = data
  if (!candidate) return <div>Candidate not found</div>

  const scores = candidate.scores || {}
  const overrides = candidate.hrOverride
  const statusBadge = candidate.pipelineStage

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-brand-success'
    if (score >= 60) return 'text-brand-warning'
    return 'text-brand-danger'
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-400 pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pipeline
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export Report API
        </Button>
      </div>

      {/* Header Profile */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-100">{candidate.personal.name}</h1>
          <div className="flex items-center space-x-4 mt-2 text-slate-400">
            <span>{candidate.personal.email}</span>
            {candidate.personal.phone && <span>• {candidate.personal.phone}</span>}
            <Badge variant="secondary" className="ml-2 uppercase">{statusBadge}</Badge>
          </div>
        </div>
        
        {scores.aiVerdict && (
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">AI Verdict</div>
            <div className="flex items-center space-x-2">
              {scores.aiVerdict === 'shortlist' && <UserCheck className="h-6 w-6 text-brand-success" />}
              {scores.aiVerdict === 'reject' && <UserX className="h-6 w-6 text-brand-danger" />}
              {scores.aiVerdict === 'hold' && <Clock className="h-6 w-6 text-brand-warning" />}
              <span className={`text-2xl font-bold uppercase ${
                scores.aiVerdict === 'shortlist' ? 'text-brand-success' :
                scores.aiVerdict === 'reject' ? 'text-brand-danger' : 'text-brand-warning'
              }`}>
                {scores.aiVerdict}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Overall Score Card */}
        <Card className="glass-panel text-center md:col-span-1 border-brand-primary/20">
          <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center h-full">
            <h3 className="text-lg font-medium text-slate-300 mb-4">Overall Match</h3>
            <div className={`text-6xl font-black ${getScoreColor(scores.overall || 0)}`}>
              {scores.overall ? Math.round(scores.overall) : 'N/A'}
            </div>
            <p className="mt-4 text-sm text-slate-400 max-w-[200px] leading-relaxed">
              {scores.aiSummary || "No summary provided by AI."}
            </p>
          </CardContent>
        </Card>

        {/* Competency Breakdown */}
        <Card className="glass-panel md:col-span-2">
          <CardHeader>
            <CardTitle>Competency Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scores.breakdown?.map((b: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-200">{b.competency}</span>
                  <span className={`font-bold ${getScoreColor(b.score)}`}>{b.score}/100</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${b.score >= 80 ? 'bg-brand-success' : b.score >= 60 ? 'bg-brand-warning' : 'bg-brand-danger'}`}
                    style={{ width: `${b.score}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">{b.reasoning}</p>
              </div>
            ))}
            {(!scores.breakdown || scores.breakdown.length === 0) && (
              <div className="text-slate-500 text-sm">No evaluation data available.</div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Integrity Flags */}
      {candidate.flags?.length > 0 && (
        <Card className="border-brand-danger/30 bg-brand-danger/5">
          <CardHeader>
            <div className="flex items-center text-brand-danger space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-brand-danger">Integrity Flags</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-brand-danger mb-4">Integrity Score: {scores.integrityScore || 100}/100</p>
            <ul className="space-y-2">
              {candidate.flags.map((flag: any, i: number) => (
                <li key={i} className="text-sm text-slate-300 flex justify-between bg-slate-900/50 p-2 rounded">
                  <span className="capitalize">{flag.type.replace('_', ' ')}</span>
                  <span className="text-slate-500">{new Date(flag.timestamp).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* RLHF Override */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>HR Override (RLHF)</CardTitle>
          <CardDescription>Disagree with the AI? Override the decision to train the model for future interviews.</CardDescription>
        </CardHeader>
        <CardContent>
          {overrides?.overridden ? (
            <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-md">
              <h4 className="text-sm font-bold text-brand-primary mb-1">Decision Overridden</h4>
              <p className="text-sm text-slate-200">New Decision: <strong className="uppercase">{overrides.newDecision}</strong></p>
              <p className="text-sm text-slate-400 mt-1">Reason: {overrides.reason}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button 
                  variant={overrideDecision === 'shortlist' ? 'default' : 'outline'} 
                  onClick={() => setOverrideDecision('shortlist')}
                  className={overrideDecision === 'shortlist' ? 'bg-brand-success hover:bg-brand-success/90' : ''}
                >
                  Override to Shortlist
                </Button>
                <Button 
                  variant={overrideDecision === 'reject' ? 'default' : 'outline'} 
                  onClick={() => setOverrideDecision('reject')}
                  className={overrideDecision === 'reject' ? 'bg-brand-danger hover:bg-brand-danger/90' : ''}
                >
                  Override to Reject
                </Button>
              </div>
              
              {overrideDecision && (
                <div className="space-y-3">
                  <Input 
                    placeholder="Briefly explain why this override was necessary (helps train the AI)..."
                    value={overrideFeedback}
                    onChange={(e) => setOverrideFeedback(e.target.value)}
                  />
                  <Button 
                    onClick={() => overrideMutation.mutate()} 
                    isLoading={overrideMutation.isPending}
                    disabled={!overrideFeedback}
                  >
                    Submit Calibration Data
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Transcript */}
      <h3 className="text-2xl font-bold tracking-tight mt-8 mb-4">Interview Transcript</h3>
      <div className="space-y-4">
        {candidate.interview?.conversationHistory?.map((msg: any, idx: number) => (
          <Card key={idx} className={`border-none ${msg.role === 'ai' ? 'bg-slate-800/40 ml-12' : 'glass-panel bg-slate-900 mr-12 border border-slate-800'}`}>
            <CardContent className="p-4 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-bold uppercase ${msg.role === 'ai' ? 'text-brand-primary' : 'text-brand-success'}`}>
                  {msg.role === 'ai' ? 'HireNode AI' : candidate.personal.name}
                </span>
                <span className="text-xs text-slate-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{msg.content}</p>
              {msg.competencyAssessed && (
                <div className="mt-3">
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{msg.competencyAssessed}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  )
}
