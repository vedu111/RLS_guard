import React, { useEffect, useState } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// NEW
import { useAuth } from '../hooks/useAuth'

import { supabase } from '../lib/supabaseClient'

interface Student {
  id: string
  name: string
  email: string
}

interface Classroom {
  id: string
  name: string
  room_number: string
}

interface ProgressRecord {
  id: string
  subject: string
  score: number
  status: string
  updated_at: string
  user_id: string
  classroom_id: string
}

export const ManageProgress: React.FC = () => {
  const { userProfile } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    classroom_id: '',
    subject: '',
    score: '',
    status: 'in-progress'
  })

  useEffect(() => {
    fetchData()

    // Realtime: refresh when progress changes
    const channel = supabase
      .channel('manage-progress-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'progress' },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userProfile])

  // Debug: Log state changes
  useEffect(() => {
    console.log('📊 Current state:', {
      studentsCount: students.length,
      classroomsCount: classrooms.length,
      progressCount: progressRecords.length,
      userRole: userProfile?.role,
      loading
    });
  }, [students, classrooms, progressRecords, userProfile, loading]);

  const fetchData = async () => {
    if (!userProfile) {
      console.log('⚠️ No userProfile, skipping fetch');
      return;
    }

    try {
      setLoading(true)
      console.log('🔍 Starting data fetch...', { userProfile: userProfile.role });
      
      // Fetch students (all users with student role)
      console.log('👥 Fetching students...');
      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'student')
        .order('name')

      console.log('📊 Students fetch result:', { 
        data: studentsData, 
        error: studentsError,
        count: studentsData?.length || 0 
      });

      if (studentsError) {
        console.error('❌ Students fetch error:', studentsError);
        throw studentsError;
      }

      // Fetch classrooms for this teacher
      console.log('🏫 Fetching classrooms...');
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classroom')
        .select('id, name, room_number')
        .eq('teacher_id', userProfile.id)
        .order('name')

      console.log('📊 Classrooms fetch result:', { 
        data: classroomsData, 
        error: classroomsError,
        count: classroomsData?.length || 0 
      });

      if (classroomsError) {
        console.error('❌ Classrooms fetch error:', classroomsError);
        throw classroomsError;
      }

      // Fetch progress records
      console.log('📈 Fetching progress records...');
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select(`
          id,
          subject,
          score,
          status,
          updated_at,
          user_id,
          classroom_id
        `)
        .order('updated_at', { ascending: false })

      console.log('📊 Progress fetch result:', { 
        data: progressData, 
        error: progressError,
        count: progressData?.length || 0 
      });

      if (progressError) {
        console.error('❌ Progress fetch error:', progressError);
        throw progressError;
      }

      console.log('✅ All data fetched successfully');
      setStudents(studentsData || [])
      setClassrooms(classroomsData || [])
      setProgressRecords(progressData || [])
      setError(null) // Clear any previous errors
    } catch (err: any) {
      console.error('❌ Fetch data error:', err);
      setError(err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
      console.log('🏁 Fetch completed');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    try {
      const progressData = {
        user_id: formData.user_id,
        classroom_id: formData.classroom_id,
        subject: formData.subject,
        score: parseInt(formData.score),
        status: formData.status
      }

      console.log('💾 Saving progress:', progressData);

      if (editingId) {
        // Update existing progress record
        const { error } = await supabase
          .from('progress')
          .update(progressData)
          .eq('id', editingId)

        if (error) throw error
        console.log('✅ Progress updated successfully');
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('progress')
          .insert(progressData)

        if (error) throw error
        console.log('✅ Progress created successfully');
      }

      // Reset form and refresh data
      setFormData({ user_id: '', classroom_id: '', subject: '', score: '', status: 'in-progress' })
      setEditingId(null)
      setIsCreating(false)
      await fetchData()
    } catch (err: any) {
      console.error('❌ Save progress error:', err);
      setError(err.message || 'Failed to save progress record')
    }
  }

  const handleEdit = (record: ProgressRecord) => {
    console.log('✏️ Editing record:', record);
    setFormData({
      user_id: record.user_id,
      classroom_id: record.classroom_id,
      subject: record.subject,
      score: record.score.toString(),
      status: record.status
    })
    setEditingId(record.id)
    setIsCreating(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this progress record? This action cannot be undone.')) {
      return
    }

    try {
      console.log('🗑️ Deleting progress record:', id);
      const { error } = await supabase
        .from('progress')
        .delete()
        .eq('id', id)

      if (error) throw error

      console.log('✅ Progress deleted successfully');
      await fetchData()
    } catch (err: any) {
      console.error('❌ Delete progress error:', err);
      setError(err.message || 'Failed to delete progress record')
    }
  }

  const handleCancel = () => {
    console.log('❌ Form cancelled');
    setFormData({ user_id: '', classroom_id: '', subject: '', score: '', status: 'in-progress' })
    setEditingId(null)
    setIsCreating(false)
    setError(null)
  }

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
              <h2 className="text-3xl font-bold text-white">Manage Student Progress</h2>
              <p className="text-blue-200">
                Add and edit student progress records
              </p>
            </div>
          </div>
        </div>


        {error && (
          <div className="mb-6 bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-2xl p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-200">Error</h3>
                <div className="mt-2 text-sm text-red-100">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {isCreating && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 mb-8">
            <h3 className="text-xl font-semibold text-white mb-6">
              {editingId ? 'Edit Progress Record' : 'Add New Progress Record'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="student" className="block text-sm font-medium text-blue-200">
                    Student ({students.length} available)
                  </label>
                  <select
                    id="student"
                    required
                    value={formData.user_id || ''}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="mt-2 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg shadow-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  >
                    <option value="" className="text-gray-900">Select a student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id} className="text-gray-900">
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                  {students.length === 0 && (
                    <p className="mt-2 text-sm text-red-300">
                      No students found. Check console for debug info.
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="classroom" className="block text-sm font-medium text-blue-200">
                    Classroom ({classrooms.length} available)
                  </label>
                  <select
                    id="classroom"
                    required
                    value={formData.classroom_id || ''}
                    onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value })}
                    className="mt-2 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg shadow-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  >
                    <option value="" className="text-gray-900">Select a classroom</option>
                    {classrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id} className="text-gray-900">
                        {classroom.name} (Room {classroom.room_number})
                      </option>
                    ))}
                  </select>
                  {classrooms.length === 0 && (
                    <p className="mt-2 text-sm text-red-300">
                      No classrooms found. Create classrooms first.
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-blue-200">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-2 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg shadow-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <label htmlFor="score" className="block text-sm font-medium text-blue-200">
                    Score (%)
                  </label>
                  <input
                    type="number"
                    id="score"
                    required
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    className="mt-2 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg shadow-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    placeholder="85"
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-blue-200">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status || ''}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-2 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg shadow-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  >
                    <option value="not-started" className="text-gray-900">Not Started</option>
                    <option value="in-progress" className="text-gray-900">In Progress</option>
                    <option value="completed" className="text-gray-900">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-white/30 rounded-lg shadow-sm text-sm font-medium text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {editingId ? 'Update Progress' : 'Add Progress'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Progress Button */}
        {!isCreating && (
          <div className="mb-8">
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors group"
            >
              <svg className="-ml-1 mr-3 h-5 w-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Progress Record
            </button>
          </div>
        )}

        {/* Progress Records List */}
        {progressRecords.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-white">No progress records</h3>
            <p className="mt-2 text-blue-200">
              Get started by adding your first progress record.
            </p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-xl font-semibold text-white">
                Progress Records ({progressRecords.length} total)
              </h3>
            </div>
            <ul className="divide-y divide-white/10">
              {progressRecords.map((record) => {
                const student = students.find(s => s.id === record.user_id)
                const classroom = classrooms.find(c => c.id === record.classroom_id)
                
                return (
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
                                {student?.name || `Student ID: ${record.user_id}`} ({student?.email || 'Email not found'})
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
                              {classroom?.name || `Classroom ID: ${record.classroom_id}`} • Room {classroom?.room_number || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="ml-6 flex-shrink-0 flex items-center space-x-6">
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${getScoreColor(record.score)}`}>
                              {record.score}%
                            </p>
                            <p className="text-sm text-blue-300">
                              Updated {new Date(record.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-300 hover:text-blue-100 text-sm font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="text-red-300 hover:text-red-100 text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
    </div>
  )
}
