import React, { useEffect, useState } from 'react'
// import { useAuth } from '../contexts/AuthContext' 
// NEW
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

interface ProgressRecord {
  id: string
  subject: string
  score: number
  status: string
  updated_at: string
  classroom?: {
    name: string
    room_number: string
  } | null
}

export const StudentDashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const [progress, setProgress] = useState<ProgressRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProgress = async () => {
      if (!userProfile) return

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('progress')
          .select(`
            id,
            subject,
            score,
            status,
            updated_at,
            classroom:classroom_id (
              name,
              room_number
            )
          `)
          .eq('user_id', userProfile.id)
          .order('updated_at', { ascending: false })

        if (error) {
          setError(error.message)
        } else {
          const normalized = (data || []).map((r: any) => ({
            ...r,
            classroom: Array.isArray(r.classroom) ? (r.classroom[0] ?? null) : (r.classroom ?? null),
          }))
          setProgress(normalized)
        }
      } catch (err) {
        setError('Failed to fetch progress data')
        console.error('Error fetching progress:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()

    // Realtime subscription for student's own progress
    const channel = supabase
      .channel('student-progress-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'progress', filter: userProfile ? `user_id=eq.${userProfile.id}` : undefined },
        () => {
          fetchProgress()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userProfile])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'not-started':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
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

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Progress</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading progress</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">My Progress</h2>
              <p className="text-blue-200">
                Track your academic progress across all subjects
              </p>
            </div>
          </div>
        </div>

        {progress.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-white">No progress records</h3>
            <p className="mt-2 text-blue-200">
              Your progress will appear here once your teacher adds records.
            </p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <ul className="divide-y divide-white/10">
              {progress.map((record) => (
                <li key={record.id} className="hover:bg-white/5 transition-colors">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold text-white truncate">
                            {record.subject}
                          </p>
                          <div className="ml-4 flex-shrink-0 flex">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-blue-200">
                          <p className="truncate">
                            {record.classroom ? `${record.classroom.name} • Room ${record.classroom.room_number}` : 'Unknown classroom'}
                          </p>
                        </div>
                      </div>
                      <div className="ml-6 flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(record.score)}`}>
                            {record.score}%
                          </p>
                          <p className="text-sm text-blue-300">
                            Updated {new Date(record.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress Summary */}
        {progress.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <svg className="h-6 w-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-green-200 truncate">Completed</dt>
                      <dd className="text-2xl font-bold text-white">
                        {progress.filter(p => p.status.toLowerCase() === 'completed').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                      <svg className="h-6 w-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-yellow-200 truncate">In Progress</dt>
                      <dd className="text-2xl font-bold text-white">
                        {progress.filter(p => p.status.toLowerCase() === 'in-progress').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-blue-200 truncate">Average Score</dt>
                      <dd className="text-2xl font-bold text-white">
                        {progress.length > 0 
                          ? Math.round(progress.reduce((sum, p) => sum + p.score, 0) / progress.length)
                          : 0}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
