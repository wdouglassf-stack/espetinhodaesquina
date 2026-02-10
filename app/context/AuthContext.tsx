'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Usuario = {
  id: string
  nome: string
  role: 'CAIXA' | 'GERENTE'
}

type AuthContextType = {
  usuario: Usuario | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  loading: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarUsuario() {
      const { data: sessionData } = await supabase.auth.getSession()

      const user = sessionData.session?.user
      if (!user) {
        setUsuario(null)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('perfis')
        .select('id, nome, role')
        .eq('id', user.id)
        .single()

      setUsuario(data || null)
      setLoading(false)
    }

    carregarUsuario()
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
