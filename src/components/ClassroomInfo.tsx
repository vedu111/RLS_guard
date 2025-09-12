import React, { useEffect, useState } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// NEW
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

interface ClassroomInfo {
  id: string
  name: string
  schedule: string
  room_number: string
  teacher: {
    name: string
    email: string
  }
}

export const ClassroomInfo: React.FC = () => {
  const { userProfile } = useAuth()
  const [classrooms, setClassrooms] = useState<ClassroomInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!userProfile) return

      try {
        setLoading(true)
        // Get classrooms where the student has progress records
        const { data, error } = await supabase
          .from('progress')
          .select(`
            classroom:classroom_id (
              id,
              name,
              schedule,
              room_number,
              teacher:teacher_id (
                name,
                email
              )
            )
          `)
          .eq('user_id', userProfile.id)

        if (error) {
          setError(error.message)
        } else {
          // Extract unique classrooms from progress records
          const uniqueClassrooms = data?.reduce((acc: ClassroomInfo[], record: any) => {
            const classroom = record.classroom
            if (classroom && !acc.find(c => c.id === classroom.id)) {
              acc.push({
                id: classroom.id,
                name: classroom.name,
                schedule: classroom.schedule,
                room_number: classroom.room_number,
                teacher: classroom.teacher
              })
            }
            return acc
          }, []) || []
          
          setClassrooms(uniqueClassrooms)
        }
      } catch (err) {
        setError('Failed to fetch classroom information')
        console.error('Error fetching classrooms:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClassrooms()

    // Realtime subscription: refresh when student's progress changes (classroom linkage may change)
    const channel = supabase
      .channel('student-classroom-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'progress', filter: userProfile ? `user_id=eq.${userProfile.id}` : undefined },
        () => {
          fetchClassrooms()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userProfile])

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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Classroom Information</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading classrooms</h3>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Classroom Information</h2>
              <p className="text-blue-200">
                View details about your classrooms and teachers
              </p>
            </div>
          </div>
        </div>

        {classrooms.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-white">No classrooms found</h3>
            <p className="mt-2 text-blue-200">
              You'll see your classroom information here once you're enrolled in classes.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {classrooms.map((classroom) => (
              <div key={classroom.id} className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-colors">
                <div className="px-6 py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <svg className="h-8 w-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-xl font-semibold text-white">{classroom.name}</h3>
                      <p className="text-blue-200">Room {classroom.room_number}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-blue-200">Schedule</dt>
                        <dd className="mt-1 text-sm text-white">{classroom.schedule}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-blue-200">Room Number</dt>
                        <dd className="mt-1 text-sm text-white">{classroom.room_number}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-6 border-t border-white/20 pt-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <svg className="h-5 w-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <dt className="text-sm font-medium text-blue-200">Teacher</dt>
                        <dd className="mt-1 text-sm text-white font-medium">{classroom.teacher.name}</dd>
                        <dd className="text-xs text-blue-300">{classroom.teacher.email}</dd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
