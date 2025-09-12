import React from 'react'
// import { useAuth } from '../contexts/AuthContext'
// NEW
import { useAuth } from '../hooks/useAuth'

interface NavigationProps {
  onNavigate: (path: string) => void
  currentPath: string
}

export const Navigation: React.FC<NavigationProps> = ({ onNavigate, currentPath }) => {
  const { userProfile, signOut } = useAuth()

  if (!userProfile) return null

  const isStudent = userProfile.role === 'student'
  const isTeacher = userProfile.role === 'teacher'

  const navItems = [
    ...(isStudent ? [
      { path: '/dashboard', label: 'My Progress', icon: '📊' },
      { path: '/classroom', label: 'Classroom Info', icon: '🏫' },
      { path: '/profile', label: 'Profile', icon: '👤' },
    ] : []),
    ...(isTeacher ? [
      { path: '/dashboard', label: 'Teacher Dashboard', icon: '📊' },
      { path: '/manage-classrooms', label: 'Manage Classrooms', icon: '🏫' },
      { path: '/manage-progress', label: 'Manage Progress', icon: '📝' },
      { path: '/profile', label: 'Profile', icon: '👤' },
    ] : []),
  ]

  return (
    <nav className="bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">RLS Guard Dog</h1>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPath === item.path
                      ? 'bg-blue-600/20 text-blue-200 border border-blue-400/30'
                      : 'text-white/80 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <span className="mr-2 text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <span className="text-sm text-blue-200 mr-4 hidden sm:inline">
                {userProfile.name} ({userProfile.role})
              </span>
              <button
                onClick={async () => { await signOut(); window.location.replace('/') }}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-red-100 px-4 py-2 rounded-lg text-sm font-medium border border-red-400/30 hover:border-red-400/50 transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
