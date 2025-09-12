import React, { useState } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// NEW
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

export const StudentProfile: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(userProfile?.name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    if (!userProfile || !name.trim()) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const { error } = await supabase
        .from('users')
        .update({ name: name.trim() })
        .eq('id', userProfile.id)

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setIsEditing(false)
        await refreshProfile()
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError('Failed to update profile')
      console.error('Error updating profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setName(userProfile?.name || '')
    setIsEditing(false)
    setError(null)
  }

  if (!userProfile) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

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

        {success && (
          <div className="mb-6 bg-green-500/20 backdrop-blur-xl border border-green-400/30 rounded-2xl p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-200">Profile updated successfully!</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-2xl p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-200">Error updating profile</h3>
                <div className="mt-2 text-sm text-red-100">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                  {isEditing ? (
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 min-w-0 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg shadow-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                        placeholder="Enter your full name"
                      />
                      <button
                        onClick={handleSave}
                        disabled={loading || !name.trim()}
                        className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-3 border border-white/30 text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{userProfile.name}</span>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-300 hover:text-blue-100 text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </dd>
              </div>
              <div className="bg-white/10 px-6 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-blue-200">Email address</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                  {userProfile.email}
                  <span className="ml-2 text-xs text-blue-300">(Cannot be changed)</span>
                </dd>
              </div>
              <div className="bg-white/5 px-6 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-blue-200">Role</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-200 capitalize">
                    {userProfile.role}
                  </span>
                </dd>
              </div>
              <div className="bg-white/10 px-6 py-6 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-blue-200">Account created</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                  {new Date(userProfile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
    </div>
  )
}
