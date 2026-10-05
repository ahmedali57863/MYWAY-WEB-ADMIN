'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'

export async function deleteCollectionRecord(table: string, id: string) {
  if (!table || !/^[a-zA-Z0-9_]+$/.test(table)) {
    throw new Error('Invalid table identifier')
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/collections/${table}`)
  return { success: true }
}
