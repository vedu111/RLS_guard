import React, { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left side - Hero content */}
          <div className="text-white space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold">RLS Guard Dog</h1>
            </div>
            
            <div>
              <h2 className="text-5xl font-bold leading-tight mb-6">
                Digital platform for all student
                <span className="text-blue-400"> activity.</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Secure classroom progress tracking with Supabase Row-Level Security. 
                Networking with lecturer and also collegiate.
              </p>
            </div>

            <button className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors group">
              <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>Download App</span>
            </button>

            {/* Stats */}
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-2xl font-bold">4,9</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <span className="text-2xl font-bold">188</span>
              </div>
            </div>

            {/* Features list with enhanced styling */}
            <div className="space-y-4 mt-8">
              <div className="flex items-center space-x-3 group">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <span className="text-gray-300">Students see only their own progress</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <span className="text-gray-300">Teachers manage classrooms and progress</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <span className="text-gray-300">Real-time updates out of the box</span>
              </div>
            </div>

            {/* Mobile mockup decoration */}
            <div className="hidden lg:block absolute -right-20 top-1/4 opacity-30">
              <div className="w-48 h-80 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border border-gray-700 shadow-2xl transform rotate-12">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                    <div className="text-white text-xs">Dashboard</div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-700 rounded"></div>
                    <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                    <div className="text-blue-400 text-lg font-bold">85%</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="h-6 bg-blue-500 rounded"></div>
                    <div className="h-6 bg-purple-500 rounded"></div>
                    <div className="h-6 bg-green-500 rounded"></div>
                    <div className="h-6 bg-orange-500 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth form with glassmorphism */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-sm">
              {isLogin ? (
                <LoginForm onToggleMode={() => setIsLogin(false)} />
              ) : (
                <SignupForm onToggleMode={() => setIsLogin(true)} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
    </div>
  )
}