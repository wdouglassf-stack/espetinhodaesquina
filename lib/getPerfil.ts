import { supabase } from './supabase'

export async function getPerfilUsuario() {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data } = await supabase
    .from('perfis')
    .select('role, nome')
    .eq('id', auth.user.id)
    .single()

  return data
}
