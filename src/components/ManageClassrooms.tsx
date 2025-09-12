import React, { useEffect, useState } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// NEW
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

interface Classroom {
  id: string
  name: string
  schedule: string
  room_number: string
  created_at: string
  student_count: number
}

export const ManageClassrooms: React.FC = () => {
  const { userProfile } = useAuth()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    schedule: '',
    room_number: ''
  })

  useEffect(() => {
    fetchClassrooms()

    // Realtime: classroom changes
    const channel = supabase
      .channel('manage-classrooms-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classroom' },
        () => fetchClassrooms()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userProfile])

  const fetchClassrooms = async () => {
    if (!userProfile) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('classroom')
        .select(`
          id,
          name,
          schedule,
          room_number,
          created_at,
          progress:progress!classroom_id(count)
        `)
        .eq('teacher_id', userProfile.id)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        // Transform data to include student count
        const transformedData = data?.map(classroom => ({
          ...classroom,
          student_count: classroom.progress?.[0]?.count || 0
        })) || []
        
        setClassrooms(transformedData)
      }
    } catch (err) {
      setError('Failed to fetch classrooms')
      console.error('Error fetching classrooms:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    try {
      if (editingId) {
        // Update existing classroom
        const { error } = await supabase
          .from('classroom')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        // Create new classroom
        const { error } = await supabase
          .from('classroom')
          .insert({
            ...formData,
            teacher_id: userProfile.id
          })

        if (error) throw error
      }

      // Reset form and refresh data
      setFormData({ name: '', schedule: '', room_number: '' })
      setEditingId(null)
      setIsCreating(false)
      await fetchClassrooms()
    } catch (err: any) {
      setError(err.message || 'Failed to save classroom')
      console.error('Error saving classroom:', err)
    }
  }

  const handleEdit = (classroom: Classroom) => {
    setFormData({
      name: classroom.name,
      schedule: classroom.schedule,
      room_number: classroom.room_number
    })
    setEditingId(classroom.id)
    setIsCreating(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('classroom')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchClassrooms()
    } catch (err: any) {
      setError(err.message || 'Failed to delete classroom')
      console.error('Error deleting classroom:', err)
    }
  }

  const handleCancel = () => {
    setFormData({ name: '', schedule: '', room_number: '' })
    setEditingId(null)
    setIsCreating(false)
    setError(null)
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Manage Classrooms</h2>
              <p className="text-blue-200">
                Create and manage your classrooms
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
              {editingId ? 'Edit Classroom' : 'Create New Classroom'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-blue-200">
                    Classroom Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg shadow-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    placeholder="e.g., Math 101"
                  />
                </div>
                <div>
                  <label htmlFor="room_number" className="block text-sm font-medium text-blue-200">
                    Room Number
                  </label>
                  <input
                    type="text"
                    id="room_number"
                    required
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="mt-2 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg shadow-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    placeholder="e.g., Room 205"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="schedule" className="block text-sm font-medium text-blue-200">
                  Schedule
                </label>
                <input
                  type="text"
                  id="schedule"
                  required
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="mt-2 block w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg shadow-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  placeholder="e.g., Mon/Wed/Fri 9:00-10:00 AM"
                />
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
                  {editingId ? 'Update Classroom' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Classroom Button */}
        {!isCreating && (
          <div className="mb-8">
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors group"
            >
              <svg className="-ml-1 mr-3 h-5 w-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Classroom
            </button>
          </div>
        )}

        {/* Classrooms List */}
        {classrooms.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-white">No classrooms</h3>
            <p className="mt-2 text-blue-200">
              Get started by creating your first classroom.
            </p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <ul className="divide-y divide-white/10">
              {classrooms.map((classroom) => (
                <li key={classroom.id} className="hover:bg-white/5 transition-colors">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold text-white truncate">
                            {classroom.name}
                          </p>
                          <div className="ml-4 flex-shrink-0 flex">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-200">
                              {classroom.student_count} students
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-blue-200">
                          <p className="truncate">
                            {classroom.schedule} • Room {classroom.room_number}
                          </p>
                        </div>
                        <div className="mt-1 text-sm text-blue-300">
                          Created {new Date(classroom.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="ml-6 flex-shrink-0 flex space-x-3">
                        <button
                          onClick={() => handleEdit(classroom)}
                          className="text-blue-300 hover:text-blue-100 text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(classroom.id)}
                          className="text-red-300 hover:text-red-100 text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
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
