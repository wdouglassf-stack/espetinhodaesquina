'use server'

import { supabase } from '@/lib/supabase'

export async function toggleMesaStatus(
  id: number,
  statusAtual: string
) {
  const novoStatus = statusAtual === 'LIVRE' ? 'OCUPADA' : 'LIVRE'

  const { error } = await supabase
    .from('mesas')
    .update({ status: novoStatus })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}
