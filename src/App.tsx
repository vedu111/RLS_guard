import React from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'            
import { AuthPage } from './components/AuthPage'
import { LoadingSpinner } from './components/ProtectedRoute'
import { AppRouter } from './components/AppRouter'

const AppContent: React.FC = () => {
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <AuthPage />
  }

  return <AppRouter />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
