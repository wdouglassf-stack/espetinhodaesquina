'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Produto = {
  id: number
  nome: string
  preco: number
}

type PedidoFormProps = {
  mesaId: number
  onPedidoCriado?: () => void
}

// ✅ FUNÇÃO NOVA (APENAS ISSO)
function agoraLocalISO() {
  const agora = new Date()
  const offsetMs = agora.getTimezoneOffset() * 60000
  return new Date(agora.getTime() - offsetMs).toISOString()
}

export default function PedidoForm({ mesaId, onPedidoCriado }: PedidoFormProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState<number | ''>('')
  const [quantidade, setQuantidade] = useState<number>(1)

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('nome', { ascending: true })

    if (!error && data) setProdutos(data)
  }

  async function adicionarPedido() {
    if (!produtoSelecionado || quantidade <= 0) return

    const produto = produtos.find(p => p.id === produtoSelecionado)
    if (!produto) return

    const valor_total = produto.preco * quantidade

    const { data, error } = await supabase
      .from('pedidos')
      .insert([
        {
          mesa_id: mesaId,
          produto_id: produto.id,
          quantidade,
          valor_unit: produto.preco,
          valor_total,
          status: 'PENDENTE',
          created_at: agoraLocalISO()
        }
      ])
      .select()

    if (!error && data) {
      setProdutoSelecionado('')
      setQuantidade(1)
      onPedidoCriado?.()
    } else {
      console.log('Erro ao adicionar pedido:', error)
    }
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  return (
    <div
      style={{
        marginTop: 12,
        padding: 16,
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        background: '#ffffff'
      }}
    >
      <h3 style={{ marginBottom: 12 }}>📝 Novo Pedido</h3>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* PRODUTO */}
        <select
          value={produtoSelecionado}
          onChange={e => setProdutoSelecionado(Number(e.target.value))}
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            color: '#0f172a',
            fontWeight: 500
          }}
        >
          <option value="" style={{ color: '#0f172a' }}>
            Selecione o produto
          </option>
          {produtos.map(p => (
            <option key={p.id} value={p.id} style={{ color: '#0f172a' }}>
              {p.nome} | R$ {p.preco.toFixed(2)}
            </option>
          ))}
        </select>

        {/* QUANTIDADE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            overflow: 'hidden'
          }}
        >
          <button
            onClick={() => setQuantidade(q => Math.max(1, q - 1))}
            style={{
              padding: '6px 10px',
              border: 'none',
              background: '#e5e7eb',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            −
          </button>

          <input
            type="number"
            min={1}
            value={quantidade}
            onChange={e => setQuantidade(Number(e.target.value))}
            style={{
              width: 50,
              textAlign: 'center',
              border: 'none',
              outline: 'none',
              fontWeight: 600
            }}
          />

          <button
            onClick={() => setQuantidade(q => q + 1)}
            style={{
              padding: '6px 10px',
              border: 'none',
              background: '#e5e7eb',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            +
          </button>
        </div>

        {/* BOTÃO ADICIONAR */}
        <button
          onClick={adicionarPedido}
          style={{
            padding: '10px 18px',
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 700,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
        >
          ➕ Adicionar
        </button>
      </div>
    </div>
  )
}
