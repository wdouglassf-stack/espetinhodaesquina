'use client'

import { useEffect, useState } from 'react'
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

export default function PedidoFormNovo({ mesaId, onPedidoCriado }: PedidoFormProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtoId, setProdutoId] = useState<number | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [valorUnit, setValorUnit] = useState(0)

  const valorTotal = quantidade * valorUnit

  // Carrega produtos
  async function carregarProdutos() {
    const { data } = await supabase
      .from('produtos')
      .select('id, nome, preco')
      .eq('ativo', true)
      .order('nome')

    if (data) setProdutos(data as Produto[])
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  // Quando muda o produto
  function selecionarProduto(id: number) {
    const produto = produtos.find((p) => p.id === id)
    if (!produto) return

    setProdutoId(id)
    setValorUnit(produto.preco)
    setQuantidade(1)
  }

  async function salvarPedido() {
    if (!produtoId || quantidade <= 0) return

    await supabase.from('pedidos').insert({
      mesa_id: mesaId,
      produto_id: produtoId,
      quantidade,
      valor_unit: valorUnit,
      valor_total: valorTotal,
      status: 'PENDENTE',
    })

    // Reset
    setProdutoId(null)
    setQuantidade(1)
    setValorUnit(0)

    onPedidoCriado?.()
  }

  return (
    <div style={{ marginTop: 12, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
      <h3>➕ Novo Pedido</h3>

      <div style={{ marginBottom: 8 }}>
        <select
          value={produtoId ?? ''}
          onChange={(e) => selecionarProduto(Number(e.target.value))}
        >
          <option value="">Selecione o produto</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <input
          type="number"
          min={1}
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
          placeholder="Quantidade"
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Valor unitário:</strong> R$ {valorUnit.toFixed(2)}
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Total:</strong> R$ {valorTotal.toFixed(2)}
      </div>

      <button onClick={salvarPedido}>Adicionar Pedido</button>
    </div>
  )
}
