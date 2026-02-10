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
    const { data, error } = await supabase.from('produtos').select('*')
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
          created_at: agoraLocalISO() // ✅ ÚNICA ALTERAÇÃO REAL
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
    <div style={{ marginTop: 12 }}>
      <h3>📝 Novo Pedido</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <select
          value={produtoSelecionado}
          onChange={e => setProdutoSelecionado(Number(e.target.value))}
        >
          <option value="">Selecione o produto</option>
          {produtos.map(p => (
            <option key={p.id} value={p.id}>
              {p.nome} | R$ {p.preco.toFixed(2)}
            </option>
          ))}
        </select>

        <input
          type="number"
          min={1}
          value={quantidade}
          onChange={e => setQuantidade(Number(e.target.value))}
          style={{ width: 60 }}
        />

        <button onClick={adicionarPedido}>Adicionar</button>
      </div>
    </div>
  )
}
