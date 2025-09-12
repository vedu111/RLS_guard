import React, { useState } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// NEW
import { useAuth } from '../hooks/useAuth'
import { Navigation } from './Navigation'
import { LoadingSpinner } from './ProtectedRoute'
import { StudentDashboard } from './StudentDashboard'
import { ClassroomInfo } from './ClassroomInfo'
import { StudentProfile } from './StudentProfile'
import { TeacherDashboard } from './TeacherDashboard'
import { ManageClassrooms } from './ManageClassrooms'
import { ManageProgress } from './ManageProgress'

// Simple profile component for teachers (reuse student profile logic)
const TeacherProfile: React.FC = () => {
  const { userProfile } = useAuth()
  
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Profile</h2>
            <p className="text-blue-200">
              Manage your personal information
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="px-6 py-6">
          <h3 className="text-xl font-semibold text-white">Personal Information</h3>
          <p className="mt-2 text-blue-200">
            Your account details and preferences
          </p>
        </div>
        <div className="border-t border-white/20">
          <dl>
            <div className="bg-white/5 px-6 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-blue-200">Full name</dt>
              <dd className="mt-1 text-lg text-white sm:mt-0 sm:col-span-2">
                {userProfile?.name}
              </dd>
            </div>
            <div className="bg-white/10 px-6 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-blue-200">Email address</dt>
              <dd className="mt-1 text-lg text-white sm:mt-0 sm:col-span-2">
                {userProfile?.email}
              </dd>
            </div>
            <div className="bg-white/5 px-6 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-blue-200">Role</dt>
              <dd className="mt-1 text-lg text-white sm:mt-0 sm:col-span-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-200 capitalize">
                  {userProfile?.role}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export const AppRouter: React.FC = () => {
  const { userProfile, loading } = useAuth()
  const [currentPath, setCurrentPath] = useState('/dashboard')

  if (loading) {
    return <LoadingSpinner />
  }

  if (!userProfile) {
    return null
  }

  const renderContent = () => {
    switch (currentPath) {
      case '/dashboard':
        return userProfile.role === 'student' ? <StudentDashboard /> : <TeacherDashboard />
      case '/classroom':
        return userProfile.role === 'student' ? <ClassroomInfo /> : <ManageClassrooms />
      case '/manage-classrooms':
        return <ManageClassrooms />
      case '/manage-progress':
        return <ManageProgress />
      case '/profile':
        return userProfile.role === 'student' ? <StudentProfile /> : <TeacherProfile />
      default:
        return userProfile.role === 'student' ? <StudentDashboard /> : <TeacherDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10">
        <Navigation onNavigate={(path) => {
          if (path === '/logout') {
            // Allow Nav to trigger sign-out explicitly if needed
            return
          }
          setCurrentPath(path)
        }} currentPath={currentPath} />
        <main className="min-h-screen">
          {renderContent()}
        </main>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
    </div>
  )
}
