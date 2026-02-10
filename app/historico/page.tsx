'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Produto {
  id: number
  nome: string
}

interface PedidoHistoricoDB {
  id: number
  mesa_id: number
  produto_id: number
  quantidade: number
  valor_total: number
  fechado_em: string
}

interface PedidoHistorico {
  id: number
  mesa: number
  produto: string
  quantidade: number
  valor_total: number
  fechado_em: string
}

interface RankingProduto {
  produto: string
  quantidade_total: number
  valor_total: number
}

const TIMEZONE = 'America/Campo_Grande'

function formatarData(data: string) {
  return new Date(data).toLocaleString('pt-BR', { timeZone: TIMEZONE })
}

export default function HistoricoPedidos() {
  const hoje = new Date()
  const yyyy = hoje.getFullYear()
  const mm = String(hoje.getMonth() + 1).padStart(2, '0')
  const dd = String(hoje.getDate()).padStart(2, '0')
  const dataHoje = `${yyyy}-${mm}-${dd}`

  const [pedidos, setPedidos] = useState<PedidoHistorico[]>([])
  const [ranking, setRanking] = useState<RankingProduto[]>([])
  const [loading, setLoading] = useState(false)
  const [dataInicio, setDataInicio] = useState(dataHoje)
  const [dataFim, setDataFim] = useState(dataHoje)

  async function carregarHistorico() {
    setLoading(true)
    try {
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos_historico')
        .select('*')
        .gte('fechado_em', `${dataInicio}T00:00:00`)
        .lte('fechado_em', `${dataFim}T23:59:59`)
        .order('fechado_em', { ascending: true })
      if (pedidosError) throw pedidosError
      if (!pedidosData) throw new Error('Nenhum pedido encontrado')

      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('*')
      if (produtosError) throw produtosError
      if (!produtosData) throw new Error('Nenhum produto encontrado')

      const produtoMap = new Map<number, string>()
      produtosData.forEach(p => produtoMap.set(p.id, p.nome))

      const pedidosFormatados: PedidoHistorico[] = pedidosData.map((p: PedidoHistoricoDB) => ({
        id: p.id,
        mesa: p.mesa_id,
        produto: produtoMap.get(p.produto_id) || 'Produto',
        quantidade: p.quantidade,
        valor_total: p.valor_total,
        fechado_em: p.fechado_em
      }))

      setPedidos(pedidosFormatados)

      const mapaRanking = new Map<string, RankingProduto>()
      pedidosFormatados.forEach(p => {
        if (!mapaRanking.has(p.produto)) {
          mapaRanking.set(p.produto, { produto: p.produto, quantidade_total: 0, valor_total: 0 })
        }
        const item = mapaRanking.get(p.produto)!
        item.quantidade_total += p.quantidade
        item.valor_total += p.valor_total
      })

      setRanking(Array.from(mapaRanking.values()).sort((a, b) => b.quantidade_total - a.quantidade_total))
      setLoading(false)
    } catch (err) {
      console.error('Erro Supabase:', err)
      setPedidos([])
      setRanking([])
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarHistorico()
  }, [])

  const totalVendido = pedidos.reduce((acc, p) => acc + p.valor_total, 0)

  return (
    <main
      style={{
        padding: 24,
        background: '#f5f6f8',
        minHeight: '100vh',
        color: '#0f172a',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
        }}
      >
        <h1 style={{ marginBottom: 24, color: '#020617' }}>📜 Histórico de Pedidos</h1>

        {/* 🔍 FILTRO */}
        <div
          style={{
            display: 'flex',
            alignItems: 'end',
            gap: 12,
            padding: 16,
            background: '#f9fafb',
            borderRadius: 8,
            marginBottom: 32
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Data início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Data fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}
            />
          </div>
          <button
            onClick={carregarHistorico}
            style={{
              padding: '10px 20px',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
          >
            🔍 Filtrar
          </button>
        </div>

        {loading && <p>Carregando...</p>}
        {!loading && pedidos.length === 0 && <p>✅ Nenhum pedido encontrado.</p>}

        {!loading && pedidos.length > 0 && (
          <>
            {/* 🏆 RANKING */}
            <h2 style={{ marginBottom: 12, color: '#020617' }}>🏆 Ranking de Produtos</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: 12 }}>#</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Produto</th>
                  <th style={{ textAlign: 'center', padding: 12 }}>Qtd</th>
                  <th style={{ textAlign: 'right', padding: 12 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r.produto} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ textAlign: 'center', padding: 12 }}>{i + 1}</td>
                    <td style={{ padding: 12 }}>{r.produto}</td>
                    <td style={{ textAlign: 'center', padding: 12 }}>{r.quantidade_total}</td>
                    <td style={{ textAlign: 'right', padding: 12 }}>R$ {r.valor_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 📋 DETALHAMENTO */}
            <h2 style={{ margin: '30px 0 12px', color: '#020617' }}>📋 Detalhamento</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: 12 }}>Mesa</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Produto</th>
                  <th style={{ textAlign: 'center', padding: 12 }}>Qtd</th>
                  <th style={{ textAlign: 'right', padding: 12 }}>Total</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ textAlign: 'center', padding: 12 }}>{p.mesa}</td>
                    <td style={{ padding: 12 }}>{p.produto}</td>
                    <td style={{ textAlign: 'center', padding: 12 }}>{p.quantidade}</td>
                    <td style={{ textAlign: 'right', padding: 12 }}>R$ {p.valor_total.toFixed(2)}</td>
                    <td style={{ padding: 12 }}>{formatarData(p.fechado_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 💰 TOTAL */}
            <div
              style={{
                marginTop: 20,
                padding: 16,
                background: '#f9fafb',
                borderRadius: 8,
                textAlign: 'right',
                fontSize: 18,
                fontWeight: 600,
                color: '#020617'
              }}
            >
              Total vendido: R$ {totalVendido.toFixed(2)}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
