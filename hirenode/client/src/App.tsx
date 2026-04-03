import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './apps/hr/Login'
import Register from './apps/hr/Register'
import HRLayout from './apps/hr/HRLayout'
import Dashboard from './apps/hr/Dashboard'
import RolesList from './apps/hr/RolesList'
import CreateRole from './apps/hr/CreateRole'
import RoleDetail from './apps/hr/RoleDetail'
import CandidateReport from './apps/hr/CandidateReport'

// Candidate routes
import ApplyPage from './apps/candidate/ApplyPage'
import PreFlight from './apps/candidate/PreFlight'
import InterviewRoom from './apps/candidate/InterviewRoom'
import InterviewComplete from './apps/candidate/InterviewComplete'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/auth/login" />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/hr/dashboard" />} />
        
        {/* Auth */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        
        {/* Candidate Public Portal */}
        <Route path="/:tenantSlug/apply/:jobId" element={<ApplyPage />} />
        <Route path="/:tenantSlug/preflight/:token" element={<PreFlight />} />
        <Route path="/:tenantSlug/interview/:token" element={<InterviewRoom />} />
        <Route path="/:tenantSlug/complete" element={<InterviewComplete />} />

        {/* Protected HR Routes */}
        <Route path="/hr" element={
          <PrivateRoute>
            <HRLayout />
          </PrivateRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="roles" element={<RolesList />} />
          <Route path="roles/new" element={<CreateRole />} />
          <Route path="roles/:jobId" element={<RoleDetail />} />
          <Route path="candidates/:candidateId" element={<CandidateReport />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/auth/login" />} />
      </Routes>
    </Router>
  )
}

export default App
