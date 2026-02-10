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
  id: number
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

    // 1️⃣ Busca pedidos
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, produto_id, quantidade, valor_unit, valor_total, status')
      .eq('mesa_id', mesaId)
      .order('id')

    if (pedidosError) {
      console.error('Erro ao carregar pedidos:', pedidosError)
      setLoading(false)
      return
    }

    if (!pedidosData || pedidosData.length === 0) {
      setPedidos([])
      setLoading(false)
      return
    }

    // 2️⃣ Busca produtos
    const { data: produtosData, error: produtosError } = await supabase
      .from('produtos')
      .select('id, nome')

    if (produtosError) {
      console.error('Erro ao carregar produtos:', produtosError)
      setLoading(false)
      return
    }

    // 3️⃣ Mapa id → nome
    const mapaProdutos = new Map<number, string>()
    produtosData?.forEach((p: Produto) => {
      mapaProdutos.set(p.id, p.nome)
    })

    // 4️⃣ Monta pedidos finais
    const pedidosFormatados: Pedido[] = pedidosData.map(
      (p: PedidoDB) => ({
        id: p.id,
        produto_nome: mapaProdutos.get(p.produto_id) || 'Produto',
        quantidade: p.quantidade,
        valor_unit: p.valor_unit,
        valor_total: p.valor_total,
        status: p.status
      })
    )

    setPedidos(pedidosFormatados)
    setLoading(false)
  }

  async function concluirPedido(pedidoId: number) {
    const { error } = await supabase
      .from('pedidos')
      .update({ status: 'CONCLUÍDO' })
      .eq('id', pedidoId)

    if (error) {
      console.error('Erro ao concluir pedido:', error)
      return
    }

    onPedidoConcluido()
  }

  async function excluirPedido(pedidoId: number) {
    const confirmacao = confirm('Excluir este pedido?')
    if (!confirmacao) return

    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', pedidoId)

    if (error) {
      console.error('Erro ao excluir pedido:', error)
      return
    }

    carregarPedidos()
  }

  useEffect(() => {
    carregarPedidos()
  }, [mesaId])

  if (loading) return <p>Carregando pedidos...</p>

  if (pedidos.length === 0) {
    return <p style={{ textAlign: 'center' }}>Nenhum pedido.</p>
  }

  const total = pedidos.reduce((acc, p) => acc + p.valor_total, 0)

  return (
    <div
      style={{
        marginTop: 20,
        padding: 16,
        border: '1px solid #ddd',
        borderRadius: 8
      }}
    >
      <h3 style={{ textAlign: 'center', marginBottom: 12 }}>
        🧾 Pedidos da Mesa
      </h3>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th>Produto</th>
            <th>Qtd</th>
            <th>Unit</th>
            <th>Subtotal</th>
            <th style={{ textAlign: 'center' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{p.produto_nome}</td>
              <td style={{ textAlign: 'center' }}>{p.quantidade}</td>
              <td>R$ {p.valor_unit.toFixed(2)}</td>
              <td>R$ {p.valor_total.toFixed(2)}</td>
              <td style={{ textAlign: 'center' }}>
                {p.status === 'PENDENTE' ? (
                  <>
                    <button
                      onClick={() => concluirPedido(p.id)}
                      style={{
                        padding: '4px 8px',
                        marginRight: 6,
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      ✔ Concluir
                    </button>

                    <button
                      onClick={() => excluirPedido(p.id)}
                      style={{
                        padding: '4px 8px',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      🗑
                    </button>
                  </>
                ) : (
                  <span style={{ color: '#16a34a' }}>✅</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 12, textAlign: 'right' }}>
        <strong>💰 Total da Mesa:</strong> R$ {total.toFixed(2)}
      </p>
    </div>
  )
}
