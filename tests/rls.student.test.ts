import { describe, it, expect, beforeAll } from 'vitest'
import { createAnonClient, signInAs } from './helpers/supabaseTestClients'

const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL
const STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD

describe('RLS: student access', () => {
  it.skipIf(!STUDENT_EMAIL || !STUDENT_PASSWORD)('can only read own progress', async () => {
    const { client } = await signInAs(STUDENT_EMAIL, STUDENT_PASSWORD)

    const { data, error } = await client
      .from('progress')
      .select('id,user_id')

    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)

    // All rows returned must be owned by the current user
    const { data: user } = await client.auth.getUser()
    const uid = user?.user?.id
    expect(uid).toBeTruthy()
    for (const row of data || []) {
      expect(row.user_id).toBe(uid)
    }
  })

  it.skipIf(!STUDENT_EMAIL || !STUDENT_PASSWORD)('cannot insert progress', async () => {
    const { client } = await signInAs(STUDENT_EMAIL, STUDENT_PASSWORD)

    const { error } = await client
      .from('progress')
      .insert({ subject: 'Test', score: 10, status: 'in-progress' })

    expect(error).toBeTruthy()
  })
})


