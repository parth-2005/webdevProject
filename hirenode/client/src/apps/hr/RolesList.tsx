import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

export default function RolesList() {
  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/jobs')
      return res.data.jobs
    }
  })

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-slate-400 animate-pulse">Loading roles...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Roles</h2>
          <p className="text-slate-400">Manage your active and past hiring drives.</p>
        </div>
        <Button asChild>
          <Link to="/hr/roles/new">
            <Plus className="mr-2 h-4 w-4" /> New Role
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.length === 0 ? (
          <div className="col-span-full border border-dashed border-slate-700 rounded-lg p-12 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-slate-200">No Roles Created</h3>
            <p className="text-slate-400 mt-2 max-w-sm">You haven't created any hiring roles yet. Upload a Job Description to get started.</p>
            <Button asChild className="mt-6">
              <Link to="/hr/roles/new">Create Role</Link>
            </Button>
          </div>
        ) : (
          data?.map((job: any) => (
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
                  <Link to={`/hr/roles/${job._id}`}>Manage Pipeline</Link>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
