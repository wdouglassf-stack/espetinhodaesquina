'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Produto {
  id: number
  nome: string
  preco: number
  ativo: boolean
}

export default function ProdutoForm({ onSalvo }: { onSalvo: () => void }) {
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)

  // ⭐ CONTROLE DE EDIÇÃO
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editPreco, setEditPreco] = useState('')

  async function carregarProdutos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao carregar produtos:', error)
      setProdutos([])
    } else {
      setProdutos(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  async function salvarProduto() {
    if (!nome || !preco) return

    const { error } = await supabase.from('produtos').insert({
      nome,
      preco: Number(preco),
      ativo: true
    })

    if (error) {
      console.error('Erro ao salvar produto:', error)
      return
    }

    setNome('')
    setPreco('')
    carregarProdutos()
    onSalvo()
  }

  // ⭐ ATIVAR EDIÇÃO
  function iniciarEdicao(produto: Produto) {
    setEditandoId(produto.id)
    setEditNome(produto.nome)
    setEditPreco(produto.preco.toString())
  }

  async function salvarEdicao(id: number) {
    const { error } = await supabase
      .from('produtos')
      .update({
        nome: editNome,
        preco: Number(editPreco)
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao editar produto:', error)
      return
    }

    setEditandoId(null)
    carregarProdutos()
  }

  async function inativarProduto(id: number) {
    if (!confirm('Deseja inativar este produto?')) return

    await supabase
      .from('produtos')
      .update({ ativo: false })
      .eq('id', id)

    carregarProdutos()
  }

  async function reativarProduto(id: number) {
    await supabase
      .from('produtos')
      .update({ ativo: true })
      .eq('id', id)

    carregarProdutos()
  }

  return (
    <div style={{
      maxWidth: 700,
      margin: '0 auto',
      background: '#fff',
      padding: 24,
      borderRadius: 12,
      boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
    }}>
      <h3 style={{ marginBottom: 16 }}>📦 Cadastro de Produtos</h3>

      {/* ➕ NOVO PRODUTO */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          placeholder="Nome do produto"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
        />
        <input
          type="number"
          placeholder="Preço"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          style={{ width: 120, padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
        />
        <button
          onClick={salvarProduto}
          style={{
            padding: '8px 16px',
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600
          }}
        >
          Salvar
        </button>
      </div>

      {/* 📋 LISTA */}
      <h4 style={{ marginBottom: 12 }}>📝 Produtos</h4>

      {loading && <p>Carregando...</p>}

      {!loading && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: 10, textAlign: 'left' }}>Nome</th>
              <th style={{ padding: 10, textAlign: 'right' }}>Preço</th>
              <th style={{ padding: 10, textAlign: 'center' }}>Status</th>
              <th style={{ padding: 10, textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 10 }}>
                  {editandoId === p.id ? (
                    <input
                      value={editNome}
                      onChange={e => setEditNome(e.target.value)}
                    />
                  ) : (
                    p.nome
                  )}
                </td>

                <td style={{ padding: 10, textAlign: 'right' }}>
                  {editandoId === p.id ? (
                    <input
                      type="number"
                      value={editPreco}
                      onChange={e => setEditPreco(e.target.value)}
                      style={{ width: 80 }}
                    />
                  ) : (
                    `R$ ${p.preco.toFixed(2)}`
                  )}
                </td>

                <td style={{ padding: 10, textAlign: 'center' }}>
                  {p.ativo ? '🟢 Ativo' : '🔴 Inativo'}
                </td>

                <td style={{ padding: 10, textAlign: 'center' }}>
                  {editandoId === p.id ? (
                    <>
                      <button onClick={() => salvarEdicao(p.id)}>💾</button>
                      <button onClick={() => setEditandoId(null)}>✖</button>
                    </>
                  ) : (
                    <>
                      {p.ativo && (
                        <>
                          <button onClick={() => iniciarEdicao(p)}>✏️</button>
                          <button onClick={() => inativarProduto(p.id)}>❌</button>
                        </>
                      )}
                      {!p.ativo && (
                        <button onClick={() => reativarProduto(p.id)}>♻️</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
