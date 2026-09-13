import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Verify2FA from './pages/Verify2FA'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Devices from './pages/Devices'
import Ads from './pages/Ads'
import Settings from './pages/Settings'
import Layout from './components/Layout'

function AppRoutes() {
  const { isAuthenticated, needs2FA } = useAuth()

  if (!isAuthenticated && !needs2FA) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (needs2FA) {
    return (
      <Routes>
        <Route path="/login/2fa" element={<Verify2FA />} />
        <Route path="*" element={<Navigate to="/login/2fa" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/ads" element={<Ads />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0d0f12] text-white">
        <AppRoutes />
      </div>
    </AuthProvider>
  )
}
