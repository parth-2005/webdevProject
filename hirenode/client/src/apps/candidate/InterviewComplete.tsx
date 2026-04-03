import { Card, CardContent } from '@/components/ui/Card'
import { CheckCircle } from 'lucide-react'

export default function InterviewComplete() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full glass-panel border-brand-success/30">
        <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-brand-success/20 rounded-full flex items-center justify-center mb-2">
            <CheckCircle className="h-10 w-10 text-brand-success" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Interview Completed</h1>
            <p className="text-slate-400 text-lg">Thank you for your time.</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300 w-full text-left border border-slate-700/50">
            <p>Your responses have been successfully submitted for processing by our AI.</p>
            <p className="mt-2 text-slate-400">The recruitment team will review the evaluation and get back to you within 2 business days.</p>
          </div>
          
          <p className="text-xs text-slate-500 mt-4">You may safely close this window now.</p>
        </CardContent>
      </Card>
    </div>
  )
}
