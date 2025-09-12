import { describe, it, expect } from 'vitest'
import { signInAs } from './helpers/supabaseTestClients'

const TEACHER_EMAIL = process.env.TEST_TEACHER_EMAIL
const TEACHER_PASSWORD = process.env.TEST_TEACHER_PASSWORD

describe('RLS: teacher access', () => {
  it.skipIf(!TEACHER_EMAIL || !TEACHER_PASSWORD)('can read all progress', async () => {
    const { client } = await signInAs(TEACHER_EMAIL, TEACHER_PASSWORD)
    const { data, error } = await client.from('progress').select('id,user_id')
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  it.skipIf(!TEACHER_EMAIL || !TEACHER_PASSWORD)('can create and delete progress', async () => {
    const { client } = await signInAs(TEACHER_EMAIL, TEACHER_PASSWORD)
    const { data: users } = await client.from('users').select('id').eq('role', 'student').limit(1)
    const { data: classes } = await client.from('classroom').select('id').limit(1)
    const userId = users?.[0]?.id
    const classroomId = classes?.[0]?.id
    expect(userId && classroomId).toBeTruthy()

    const { data: inserted, error: insertErr } = await client
      .from('progress')
      .insert({ user_id: userId, classroom_id: classroomId, subject: 'Test-Subject', score: 77, status: 'in-progress' })
      .select('id')
      .single()

    expect(insertErr).toBeNull()
    const id = inserted?.id
    expect(id).toBeTruthy()

    const { error: delErr } = await client.from('progress').delete().eq('id', id!)
    expect(delErr).toBeNull()
  })
})


