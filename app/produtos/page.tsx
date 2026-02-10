'use client'

import { useState } from 'react'
import ProdutoForm from './components/ProdutoForm'
import ProdutosLista from './components/ProdutosLista'

export default function ProdutosPage() {
  const [reload, setReload] = useState(false)

  return (
    <main style={{ padding: 20 }}>
      <h1>📦 Cadastro de Produtos</h1>

      <ProdutoForm onSalvo={() => setReload(!reload)} />
      <ProdutosLista key={String(reload)} />
    </main>
  )
}
