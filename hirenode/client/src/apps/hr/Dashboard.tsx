import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { Briefcase, Users, CheckCircle, Clock } from 'lucide-react'

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['hr-dashboard'],
    queryFn: async () => {
      const res = await api.get('/hr/dashboard')
      return res.data
    }
  })

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-slate-400 animate-pulse">Loading dashboard...</div>
  }

  const stats = data?.metrics || { totalRoles: 0, totalCandidates: 0, interviewsCompleted: 0, pendingReview: 0 }
  const recentJobs = data?.recentJobs || []

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-slate-400">Overview of your recruitment pipeline.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <Briefcase className="h-4 w-4 text-brand-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoles}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-brand-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCandidates}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Done</CardTitle>
            <CheckCircle className="h-4 w-4 text-brand-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviewsCompleted}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel ring-1 ring-brand-warning/50 bg-brand-warning/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-warning">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-brand-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-warning">{stats.pendingReview}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Recent Roles</h3>
          <Button asChild variant="outline" size="sm">
            <Link to="/hr/roles">View All</Link>
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentJobs.length === 0 ? (
            <div className="col-span-full border border-dashed border-slate-700 rounded-lg p-8 text-center text-slate-400">
              No roles created yet. <Link to="/hr/roles/new" className="text-brand-primary hover:underline">Create one now.</Link>
            </div>
          ) : (
            recentJobs.map((job: any) => (
              <Card key={job._id} className="glass-panel hover:border-slate-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <Badge variant={job.status === 'active' ? 'success' : 'secondary'}>{job.status}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2">{job.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>{job.stats?.applied || 0} Applied</span>
                    <span>{job.stats?.interviewed || 0} Interviewed</span>
                  </div>
                </CardContent>
                <div className="px-6 pb-6 mt-auto">
                  <Button asChild className="w-full" variant="secondary">
                    <Link to={`/hr/roles/${job._id}`}>View Pipeline</Link>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
