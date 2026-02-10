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

  async function excluirProduto(id: number) {
    if (!confirm('Deseja realmente excluir este produto?')) return

    const { error } = await supabase
      .from('produtos')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir produto:', error)
      return
    }

    carregarProdutos()
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}>
      <h3 style={{ marginBottom: 16, color: '#020617' }}>➕ Novo Produto</h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          placeholder="Nome do produto"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ 
            flex: 1, 
            padding: 8, 
            borderRadius: 6, 
            border: '1px solid #cbd5e1', 
            color: '#0f172a',       // letra mais escura
            fontWeight: 500
          }}
        />
        <input
          type="number"
          placeholder="Preço"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          style={{ 
            width: 120, 
            padding: 8, 
            borderRadius: 6, 
            border: '1px solid #cbd5e1', 
            color: '#0f172a',       // letra mais escura
            fontWeight: 500
          }}
        />
        <button
          onClick={salvarProduto}
          style={{
            padding: '8px 16px',
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
        >
          Salvar
        </button>
      </div>

      <h4 style={{ marginBottom: 12, color: '#020617' }}>📝 Produtos Cadastrados</h4>
      {loading && <p>Carregando...</p>}

      {!loading && produtos.length === 0 && <p>Nenhum produto cadastrado.</p>}

      {!loading && produtos.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Nome</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Preço</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Ativo</th>
              <th style={{ padding: 12 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee', background: p.ativo ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: 12 }}>{p.nome}</td>
                <td style={{ padding: 12, textAlign: 'right' }}>R$ {p.preco.toFixed(2)}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>{p.ativo ? '✅' : '❌'}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  {p.ativo && (
                    <button
                      onClick={() => excluirProduto(p.id)}
                      style={{
                        padding: '4px 10px',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Excluir
                    </button>
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
