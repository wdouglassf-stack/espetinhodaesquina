'use client'

import { useState } from 'react'
import MesasGrid from './components/MesasGrid'
import PedidoForm from './pedidos/components/PedidoForm'
import PedidosLista from './pedidos/components/PedidosLista'
import FecharMesa from './pedidos/components/FecharMesa'

export default function Home() {
  const [mesaSelecionada, setMesaSelecionada] = useState<number | null>(null)
  const [atualizarLista, setAtualizarLista] = useState(0)
  const [atualizarMesas, setAtualizarMesas] = useState(0)

  function handlePedidoCriado() {
    setAtualizarLista(prev => prev + 1)
  }

  function handleMesaFechada() {
    setAtualizarMesas(prev => prev + 1)
    setAtualizarLista(prev => prev + 1)
    setMesaSelecionada(null)
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>🍢 Espetinho da Esquina</h1>

      <MesasGrid
        key={atualizarMesas}
        onMesaSelecionada={setMesaSelecionada}
      />

      {mesaSelecionada && (
        <div style={{ marginTop: 20 }}>
          <h2>📋 Mesa {mesaSelecionada}</h2>

          <PedidoForm
            mesaId={mesaSelecionada}
            onPedidoCriado={handlePedidoCriado}
          />

          <PedidosLista
  key={`lista-${mesaSelecionada}-${atualizarLista}`}
  mesaId={mesaSelecionada}
  onPedidoConcluido={() => setAtualizarLista(prev => prev + 1)}
/>
          <FecharMesa
            key={`fechamento-${mesaSelecionada}-${atualizarLista}`}
            mesaId={mesaSelecionada}
            atualizar={atualizarLista}
            onFechada={handleMesaFechada}
          />
        </div>
      )}
    </main>
  )
}
