'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'

interface Pagamento {
  id: number
  mesa_id: number
  total: number
  forma_pagamento: 'DINHEIRO' | 'PIX' | 'CARTAO'
  valor_pago: number
  troco: number
  created_at: string
}

export default function Caixa() {
  const hoje = new Date().toISOString().slice(0, 10)

  const [dataSelecionada, setDataSelecionada] = useState(hoje)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(false)
  const [diaFechado, setDiaFechado] = useState(false)

  // ⭐ DESCONTO MANUAL (mantido)
  const [descontoDia, setDescontoDia] = useState('')

  const { usuario, loading: loadingUsuario } = useAuth()

  async function verificarFechamento() {
    const { data } = await supabase
      .from('caixa_fechamentos')
      .select('id')
      .eq('data', dataSelecionada)
      .single()

    setDiaFechado(!!data)
  }

  async function carregarCaixa() {
    setLoading(true)

    await verificarFechamento()

    const inicio = new Date(`${dataSelecionada}T00:00:00`)
    const fim = new Date(`${dataSelecionada}T23:59:59`)

    const { data, error } = await supabase
      .from('pagamentos')
      .select('*')
      .gte('created_at', inicio.toISOString())
      .lte('created_at', fim.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar caixa:', error)
      setPagamentos([])
      setLoading(false)
      return
    }

    setPagamentos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarCaixa()
  }, [])

  // ✅ VALORES CORRETOS PARA CAIXA
  const totalGeral = pagamentos.reduce(
    (acc, p) => acc + Number(p.valor_pago),
    0
  )

  const totalDinheiro = pagamentos
    .filter(p => p.forma_pagamento === 'DINHEIRO')
    .reduce((a, p) => a + Number(p.valor_pago), 0)

  const totalPix = pagamentos
    .filter(p => p.forma_pagamento === 'PIX')
    .reduce((a, p) => a + Number(p.valor_pago), 0)

  const totalCartao = pagamentos
    .filter(p => p.forma_pagamento === 'CARTAO')
    .reduce((a, p) => a + Number(p.valor_pago), 0)

  // ⭐ TOTAL DE DESCONTOS AUTOMÁTICO
  const totalDescontos = pagamentos.reduce(
    (acc, p) => acc + (Number(p.total) - Number(p.valor_pago)),
    0
  )

  async function encerrarDia() {
    if (diaFechado) return

    const confirmacao = confirm(`Encerrar o caixa do dia ${dataSelecionada}?`)
    if (!confirmacao) return

    const { error } = await supabase
      .from('caixa_fechamentos')
      .insert({
        data: dataSelecionada,
        total_geral: totalGeral,
        total_dinheiro: totalDinheiro,
        total_pix: totalPix,
        total_cartao: totalCartao,
        desconto: totalDescontos + (Number(descontoDia) || 0)
      })

    if (error) {
      alert('Erro ao encerrar o dia')
      console.error(error)
      return
    }

    alert('✅ Caixa encerrado com sucesso!')
    setDiaFechado(true)
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>💰 Caixa do Dia</h1>

      {!loadingUsuario && usuario && (
        <p style={{ marginTop: 5 }}>
          👤 {usuario.nome} — <strong>{usuario.role}</strong>
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <input
          type="date"
          value={dataSelecionada}
          onChange={e => setDataSelecionada(e.target.value)}
        />
        <button onClick={carregarCaixa}>🔍 Buscar</button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          gap: 12,
          marginTop: 20
        }}
      >
        <Resumo titulo="💰 Total Geral (Recebido)" valor={totalGeral} />
        <Resumo titulo="💵 Dinheiro" valor={totalDinheiro} />
        <Resumo titulo="📲 Pix" valor={totalPix} />
        <Resumo titulo="💳 Cartão" valor={totalCartao} />
        <Resumo titulo="🏷️ Descontos" valor={totalDescontos} />
      </div>

      {/* ⭐ DESCONTO MANUAL EXTRA */}
      {!diaFechado && (
        <div style={{ marginTop: 20, maxWidth: 200 }}>
          <label>Desconto Extra (R$)</label>
          <input
            type="number"
            value={descontoDia}
            onChange={e => setDescontoDia(e.target.value)}
            placeholder="0,00"
            style={{ width: '100%', marginTop: 5 }}
          />
        </div>
      )}

      {!loadingUsuario && usuario?.role === 'GERENTE' && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={encerrarDia}
            disabled={diaFechado || pagamentos.length === 0}
            style={{
              padding: '10px 20px',
              background: diaFechado ? '#aaa' : '#d32f2f',
              color: '#fff',
              border: 'none',
              borderRadius: 6
            }}
          >
            {diaFechado ? '🔒 Dia Encerrado' : '🧾 Encerrar Dia'}
          </button>
        </div>
      )}

      <h2 style={{ marginTop: 30 }}>📋 Pagamentos</h2>

      {!loading && pagamentos.length === 0 && <p>Nenhum pagamento.</p>}

      {!loading && pagamentos.length > 0 && (
        <table style={{ width: '100%', marginTop: 10 }}>
          <thead>
            <tr>
              <th>Mesa</th>
              <th>Forma</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Desconto</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody>
            {pagamentos.map(p => {
              const desconto = Number(p.total) - Number(p.valor_pago)

              return (
                <tr key={p.id}>
                  <td>{p.mesa_id}</td>
                  <td>{p.forma_pagamento}</td>
                  <td>R$ {Number(p.total).toFixed(2)}</td>
                  <td>R$ {Number(p.valor_pago).toFixed(2)}</td>
                  <td>{desconto > 0 ? `R$ ${desconto.toFixed(2)}` : '—'}</td>
                  <td>
                    {new Date(p.created_at).toLocaleTimeString('pt-BR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </main>
  )
}

function Resumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
      <h3>{titulo}</h3>
      <strong>R$ {Number(valor).toFixed(2)}</strong>
    </div>
  )
}
