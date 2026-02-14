'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PedidoDB {
  id: number
  produto_id: number
  quantidade: number
  valor_unit: number
  valor_total: number
  status: 'PENDENTE' | 'CONCLUÍDO'
}

interface Pedido {
  ids: number[]
  produto_nome: string
  quantidade: number
  valor_unit: number
  valor_total: number
  status: 'PENDENTE' | 'CONCLUÍDO'
}

interface Produto {
  id: number
  nome: string
}

interface Props {
  mesaId: number
  onPedidoConcluido: () => void
}

export default function PedidosLista({ mesaId, onPedidoConcluido }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  async function carregarPedidos() {
    setLoading(true)

    const { data: pedidosData } = await supabase
      .from('pedidos')
      .select('id, produto_id, quantidade, valor_unit, valor_total, status')
      .eq('mesa_id', mesaId)
      .order('id')

    if (!pedidosData || pedidosData.length === 0) {
      setPedidos([])
      setLoading(false)
      return
    }

    const { data: produtosData } = await supabase
      .from('produtos')
      .select('id, nome')

    const mapaProdutos = new Map<number, string>()
    produtosData?.forEach((p: Produto) => {
      mapaProdutos.set(p.id, p.nome)
    })

    const mapa = new Map<number, Pedido>()

    pedidosData.forEach((p: PedidoDB) => {
      if (!mapa.has(p.produto_id)) {
        mapa.set(p.produto_id, {
          ids: [],
          produto_nome: mapaProdutos.get(p.produto_id) || 'Produto',
          quantidade: 0,
          valor_unit: p.valor_unit,
          valor_total: 0,
          status: 'PENDENTE'
        })
      }

      const item = mapa.get(p.produto_id)!
      item.ids.push(p.id)
      item.quantidade += p.quantidade
      item.valor_total += p.valor_total
    })

    setPedidos(Array.from(mapa.values()))
    setLoading(false)
  }

  async function concluirPedido(ids: number[]) {
    await supabase.from('pedidos').update({ status: 'CONCLUÍDO' }).in('id', ids)
    onPedidoConcluido()
  }

  async function concluirTodos() {
    const ok = confirm('Concluir todos os pedidos da mesa?')
    if (!ok) return

    await supabase
      .from('pedidos')
      .update({ status: 'CONCLUÍDO' })
      .eq('mesa_id', mesaId)
      .eq('status', 'PENDENTE')

    onPedidoConcluido()
  }

  async function removerUmaUnidade(id: number) {
    const ok = confirm('Remover uma unidade deste produto?')
    if (!ok) return

    await supabase.from('pedidos').delete().eq('id', id)
    carregarPedidos()
  }

  async function removerTodos(ids: number[]) {
    const ok = confirm('Remover todas as unidades deste produto?')
    if (!ok) return

    await supabase.from('pedidos').delete().in('id', ids)
    carregarPedidos()
  }

  useEffect(() => {
    carregarPedidos()
  }, [mesaId])

  if (loading) return <p>Carregando pedidos...</p>

  const total = pedidos.reduce((acc, p) => acc + p.valor_total, 0)

  return (
    <div style={{ marginTop: 20, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
      <h3 style={{ textAlign: 'center' }}>🧾 Pedidos da Mesa</h3>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <button
          onClick={concluirTodos}
          style={{
            padding: '8px 16px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          ✔ Concluir todos
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Qtd</th>
            <th>Unit</th>
            <th>Subtotal</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p, i) => (
            <tr key={i}>
              <td>{p.produto_nome}</td>
              <td style={{ textAlign: 'center' }}>{p.quantidade}</td>
              <td>R$ {p.valor_unit.toFixed(2)}</td>
              <td>R$ {p.valor_total.toFixed(2)}</td>
              <td style={{ textAlign: 'center' }}>
                <button
                  onClick={() => concluirPedido(p.ids)}
                  style={{ marginRight: 6 }}
                >
                  ✔
                </button>
                <button
                  onClick={() => removerUmaUnidade(p.ids[0])}
                  style={{ marginRight: 6 }}
                >
                  ➖ 1
                </button>
                <button
                  onClick={() => removerTodos(p.ids)}
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ textAlign: 'right', marginTop: 12 }}>
        <strong>Total:</strong> R$ {total.toFixed(2)}
      </p>
    </div>
  )
}
