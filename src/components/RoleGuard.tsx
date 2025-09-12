import React from 'react'
// import { useAuth } from '../contexts/AuthContext'
// NEW
import { useAuth } from '../hooks/useAuth'

interface RoleGuardProps {
  allowedRoles: ('student' | 'teacher')[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  fallback = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    </div>
  )
}) => {
  const { userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export const StudentOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['student']}>{children}</RoleGuard>
)

export const TeacherOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['teacher']}>{children}</RoleGuard>
)
