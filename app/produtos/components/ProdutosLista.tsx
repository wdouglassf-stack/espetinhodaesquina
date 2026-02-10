'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Produto = {
  id: number
  nome: string
  preco: number
}

export default function ProdutosLista() {
  const [produtos, setProdutos] = useState<Produto[]>([])

  async function carregar() {
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (data) setProdutos(data as Produto[])
  }

  useEffect(() => {
    carregar()
  }, [])

  return (
    <div>
      <h3>📦 Produtos cadastrados</h3>

      <ul>
        {produtos.map((p) => (
          <li key={p.id}>
            {p.nome} — R$ {p.preco.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  )
}
