'use client'

import { useState } from 'react'

type Pedido = {
  id: number
  item: string
}

export default function PedidosPage() {
  const [item, setItem] = useState('')
  const [pedidos, setPedidos] = useState<Pedido[]>([])

  function adicionarItem() {
    if (!item) return
    setPedidos([...pedidos, { id: Date.now(), item }])
    setItem('')
  }

  function enviarPedido() {
    if (pedidos.length === 0) return
    alert(`Pedido enviado: ${pedidos.map(p => p.item).join(', ')}`)
    setPedidos([])
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>📋 Pedidos</h1>

      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="Digite o item"
          style={{ padding: 8, marginRight: 8 }}
        />
        <button onClick={adicionarItem}>Adicionar</button>
      </div>

      <ul>
        {pedidos.length === 0 && <li>Nenhum pedido no momento.</li>}
        {pedidos.map(p => (
          <li key={p.id}>{p.item}</li>
        ))}
      </ul>

      {pedidos.length > 0 && (
        <button onClick={enviarPedido} style={{ marginTop: 12 }}>
          Enviar Pedido
        </button>
      )}
    </main>
  )
}
