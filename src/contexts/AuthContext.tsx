import React, { createContext, useEffect, useState } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: 'student' | 'teacher'
  created_at: string
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, name: string, role: 'student' | 'teacher') => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    console.log('🔍 Starting fetchUserProfile for:', userId);
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('fetchUserProfile timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log('📊 fetchUserProfile result:', { data, error, userId });

      if (error) {
        console.error('❌ Error fetching user profile:', error)
        
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116' || (error as any).status === 406) {
          console.log('Profile not found, will create minimal profile')
          return null
        }
        
        return null
      }

      return data
    } catch (error) {
      console.error('💥 fetchUserProfile failed:', error)
      return null // Return null instead of throwing
    }
  }

  const createProfileFromAuth = async (authUser: User): Promise<UserProfile | null> => {
    console.log('🆕 Creating profile from auth user:', authUser.id);
    
    try {
      const role = authUser.user_metadata?.role || 'student'
      const name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User'

      console.log('Creating profile with:', { name, role, email: authUser.email })

      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email!,
          name,
          role,
        }, {
          onConflict: 'id'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating user profile:', error)
        
        // Create minimal profile if database insert fails
        console.log('🔄 Using fallback profile data')
        return {
          id: authUser.id,
          email: authUser.email!,
          name,
          role,
          created_at: new Date().toISOString()
        }
      }

      console.log('✅ Profile created successfully:', data)
      return data
    } catch (error) {
      console.error('💥 Error creating profile:', error)
      
      // Always return a fallback profile to prevent loading issues
      return {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        role: authUser.user_metadata?.role || 'student',
        created_at: new Date().toISOString()
      }
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id)
      setUserProfile(profile)
    }
  }

  useEffect(() => {
    let isMounted = true
    console.log('🚀 AuthContext: Starting auth initialization...')

    // Emergency timeout - force loading to false after 8 seconds
    const emergencyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('⚠️ Emergency timeout: forcing loading to false')
        setLoading(false)
      }
    }, 8000)

    const init = async () => {
      try {
        // Handle email confirmation links
        if (typeof window !== 'undefined' && window.location.hash.includes('type=signup')) {
          console.log('🔗 Handling email confirmation link')
          try {
            await supabase.auth.signOut()
          } catch {}
          setUser(null)
          setSession(null)
          setUserProfile(null)
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/?confirmed=1')
          }
          setLoading(false)
          return
        }

        console.log('📡 Getting session...')
        const { data, error } = await supabase.auth.getSession()
        const session = data?.session ?? null
        
        console.log('📊 Session check result:', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          error 
        })
        
        if (!isMounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('👤 User found, fetching profile...')
          
          let profile = await fetchUserProfile(session.user.id)
          
          if (!isMounted) return
          
          if (!profile) {
            console.log('👤 No profile found, creating one...')
            profile = await createProfileFromAuth(session.user)
          }
          
          if (!isMounted) return
          
          console.log('✅ Final profile:', profile)
          setUserProfile(profile)
        } else {
          console.log('🚫 No user session found')
          setUserProfile(null)
        }
      } catch (e) {
        console.error('💥 AuthContext: init error', e)
        // Don't let errors prevent the app from loading
        setUser(null)
        setSession(null)
        setUserProfile(null)
      } finally {
        if (isMounted) {
          console.log('🏁 AuthContext: Setting loading to false')
          setLoading(false)
          clearTimeout(emergencyTimeout)
        }
      }
    }

    init()

    // Set up auth state change listener
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, { hasSession: !!session })
      
      if (!isMounted) return

      // Handle auth state changes synchronously first
      setSession(session)
      setUser(session?.user ?? null)

      // Handle profile loading asynchronously with setTimeout to avoid deadlocks
      setTimeout(async () => {
        if (!isMounted) return

        if (session?.user) {
          console.log('👤 Loading profile for auth state change...')
          
          let profile = await fetchUserProfile(session.user.id)
          
          if (!isMounted) return
          
          if (!profile) {
            console.log('👤 Creating profile for new user...')
            profile = await createProfileFromAuth(session.user)
          }
          
          if (!isMounted) return
          
          setUserProfile(profile)
        } else {
          setUserProfile(null)
        }

        if (isMounted) {
          setLoading(false)
        }
      }, 0)

      // Handle email confirmation redirect
      if (event === 'SIGNED_IN' && typeof window !== 'undefined' && window.location.hash.includes('type=signup')) {
        setTimeout(async () => {
          await supabase.auth.signOut().catch(() => {})
          setUser(null)
          setSession(null)
          setUserProfile(null)
          window.history.replaceState(null, '', '/?confirmed=1')
        }, 100)
      }
    })

    return () => {
      isMounted = false
      clearTimeout(emergencyTimeout)
      listener.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, name: string, role: 'student' | 'teacher') => {
    console.log('📝 Signing up user:', { email, name, role })
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      })

      if (error) {
        console.error('❌ Signup error:', error)
        return { error }
      }

      if (data.user) {
        console.log('✅ User created successfully')
      }

      return { error: null }
    } catch (err) {
      console.error('💥 Unexpected signup error:', err)
      return { error: err as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Signing in user:', email)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('❌ Sign in error:', error)
      } else {
        console.log('✅ Sign in successful')
      }
      
      return { error }
    } catch (err) {
      console.error('💥 Unexpected sign in error:', err)
      return { error: err as AuthError }
    }
  }

  const signOut = async () => {
    console.log('🚪 Signing out user')
    
    try {
      // Clear realtime subscriptions
      try {
        for (const ch of supabase.getChannels()) {
          supabase.removeChannel(ch)
        }
      } catch {}

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Sign out error:', error)
      }

      // Clear local storage
      try {
        const keysToClear: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('rls_guard_dog'))) {
            keysToClear.push(key)
          }
        }
        keysToClear.forEach(key => localStorage.removeItem(key))
      } catch {}

      // Clear state and redirect
      setUser(null)
      setSession(null)
      setUserProfile(null)
      
      if (typeof window !== 'undefined') {
        window.location.replace('/')
      }
    } catch (e) {
      console.error('💥 Unexpected sign out error:', e)
      // Force redirect even if sign out fails
      if (typeof window !== 'undefined') {
        window.location.replace('/')
      }
    }
  }

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
