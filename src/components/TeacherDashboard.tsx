import React, { useEffect, useState } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// NEW
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

interface StudentProgress {
  id: string
  subject: string
  score: number
  status: string
  updated_at: string
  user?: {
    id: string
    name: string
    email: string
  } | null
  classroom?: {
    id: string
    name: string
    room_number: string
  } | null
}

export const TeacherDashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const [progress, setProgress] = useState<StudentProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterClassroom, setFilterClassroom] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    const fetchAllProgress = async () => {
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
            user:user_id (
              id,
              name,
              email
            ),
            classroom:classroom_id (
              id,
              name,
              room_number
            )
          `)
          .order('updated_at', { ascending: false })

        if (error) {
          setError(error.message)
        } else {
          const normalized = (data || []).map((r: any) => ({
            ...r,
            user: Array.isArray(r.user) ? (r.user[0] ?? null) : (r.user ?? null),
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

    fetchAllProgress()

    // Realtime for teacher: listen to any progress changes
    const channel = supabase
      .channel('teacher-progress-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'progress' },
        () => {
          fetchAllProgress()
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

  // Get unique classrooms for filter (guard against null relations due to RLS)
  const classrooms = Array.from(
    new Set(
      progress
        .map(p => p.classroom?.id)
        .filter((id): id is string => Boolean(id))
    )
  )
    .map(id => progress.find(p => p.classroom?.id === id)?.classroom)
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  // Filter progress based on selected filters
  const filteredProgress = progress.filter(record => {
    const classroomId = record.classroom?.id
    const classroomMatch = filterClassroom === 'all' || classroomId === filterClassroom
    const statusMatch = filterStatus === 'all' || record.status.toLowerCase() === filterStatus.toLowerCase()
    return classroomMatch && statusMatch
  })

  // Calculate statistics
  const totalStudents = new Set(
    progress
      .map(p => p.user?.id)
      .filter((id): id is string => Boolean(id))
  ).size
  const completedCount = progress.filter(p => p.status.toLowerCase() === 'completed').length
  const inProgressCount = progress.filter(p => p.status.toLowerCase() === 'in-progress').length
  const averageScore = progress.length > 0 
    ? Math.round(progress.reduce((sum, p) => sum + p.score, 0) / progress.length)
    : 0

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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Teacher Dashboard</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
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
              <h2 className="text-3xl font-bold text-white">Teacher Dashboard</h2>
              <p className="text-blue-200">
                Monitor all students' progress across your classrooms
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-blue-200 truncate">Total Students</dt>
                    <dd className="text-2xl font-bold text-white">{totalStudents}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

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
                    <dd className="text-2xl font-bold text-white">{completedCount}</dd>
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
                    <dd className="text-2xl font-bold text-white">{inProgressCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <svg className="h-6 w-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-purple-200 truncate">Average Score</dt>
                    <dd className="text-2xl font-bold text-white">{averageScore}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="classroom-filter" className="block text-sm font-medium text-blue-200">
                Filter by Classroom
              </label>
              <select
                id="classroom-filter"
                value={filterClassroom}
                onChange={(e) => setFilterClassroom(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg shadow-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
              >
                <option value="all" className="text-gray-900">All Classrooms</option>
                {classrooms.map((classroom) => (
                  <option key={classroom!.id} value={classroom!.id} className="text-gray-900">
                    {classroom!.name} (Room {classroom!.room_number})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-blue-200">
                Filter by Status
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg shadow-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
              >
                <option value="all" className="text-gray-900">All Statuses</option>
                <option value="completed" className="text-gray-900">Completed</option>
                <option value="in-progress" className="text-gray-900">In Progress</option>
                <option value="not-started" className="text-gray-900">Not Started</option>
              </select>
            </div>
          </div>
        </div>

        {/* Progress Table */}
        {filteredProgress.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-white">No progress records</h3>
            <p className="mt-2 text-blue-200">
              {progress.length === 0 
                ? "No progress records found. Add some progress records to see them here."
                : "No records match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-xl font-semibold text-white">
                Student Progress ({filteredProgress.length} records)
              </h3>
            </div>
            <ul className="divide-y divide-white/10">
              {filteredProgress.map((record) => (
                <li key={record.id} className="hover:bg-white/5 transition-colors">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold text-white truncate">
                              {record.subject}
                            </p>
                            <p className="text-blue-200">
                              {record.user ? `${record.user.name} (${record.user.email})` : 'Unknown student'}
                            </p>
                          </div>
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
    </div>
  )
}
