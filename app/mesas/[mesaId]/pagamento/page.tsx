'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Pedido {
  id: number
  quantidade: number
  valor_total: number
  status: string
}

export default function PagamentoMesa() {
  const { mesaId } = useParams()
  const router = useRouter()

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [totalConsumido, setTotalConsumido] = useState(0)
  const [totalPago, setTotalPago] = useState(0)
  const [valorPagamento, setValorPagamento] = useState('')
  const [forma, setForma] = useState('PIX')
  const [loading, setLoading] = useState(false)

  async function carregarDados() {
    const { data: pedidosMesa } = await supabase
      .from('pedidos')
      .select('id, quantidade, valor_total, status')
      .eq('mesa_id', mesaId)
      .eq('status', 'CONCLUIDO')

    const { data: pagamentos } = await supabase
      .from('pagamentos')
      .select('valor')
      .eq('mesa_id', mesaId)

    const totalPedidos =
      pedidosMesa?.reduce((acc, p) => acc + p.valor_total, 0) || 0

    const totalPg =
      pagamentos?.reduce((acc, p) => acc + p.valor, 0) || 0

    setPedidos(pedidosMesa || [])
    setTotalConsumido(totalPedidos)
    setTotalPago(totalPg)
  }

  async function registrarPagamento() {
    if (!valorPagamento) return

    setLoading(true)

    await supabase.from('pagamentos').insert({
      mesa_id: mesaId,
      valor: Number(valorPagamento),
      forma_pagamento: forma
    })

    setValorPagamento('')
    await carregarDados()
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const saldo = totalConsumido - totalPago

  return (
    <main style={{ padding: 24, maxWidth: 500 }}>
      <h1>💰 Pagamento da Mesa {mesaId}</h1>

      <p><strong>Total consumido:</strong> R$ {totalConsumido.toFixed(2)}</p>
      <p><strong>Total pago:</strong> R$ {totalPago.toFixed(2)}</p>
      <p><strong>Saldo:</strong> R$ {saldo.toFixed(2)}</p>

      <hr style={{ margin: '16px 0' }} />

      <input
        type="number"
        placeholder="Valor do pagamento"
        value={valorPagamento}
        onChange={e => setValorPagamento(e.target.value)}
        style={{ width: '100%', marginBottom: 8 }}
      />

      <select
        value={forma}
        onChange={e => setForma(e.target.value)}
        style={{ width: '100%', marginBottom: 8 }}
      >
        <option value="PIX">PIX</option>
        <option value="CARTAO">Cartão</option>
        <option value="DINHEIRO">Dinheiro</option>
      </select>

      <button
        onClick={registrarPagamento}
        disabled={loading}
        style={{ width: '100%' }}
      >
        Registrar pagamento
      </button>

      <hr style={{ margin: '16px 0' }} />

      <button
        onClick={() => router.back()}
        style={{ width: '100%' }}
      >
        Voltar
      </button>
    </main>
  )
}
