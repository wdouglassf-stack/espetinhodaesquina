'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface FecharMesaProps {
  mesaId: number
  onFechada: () => void
  atualizar: number
}

interface Pedido {
  id: number
  mesa_id: number
  produto_id: number
  quantidade: number
  valor_unit: number
  valor_total: number
  status: 'CONCLUÍDO'
}

type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO'

export default function FecharMesa({
  mesaId,
  onFechada,
  atualizar
}: FecharMesaProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [totalConsumido, setTotalConsumido] = useState(0)
  const [pagamentos, setPagamentos] = useState<
    { id: number; valor_pago: number; forma_pagamento: FormaPagamento; troco: number }[]
  >([])
  const [valorPago, setValorPago] = useState('')
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>('DINHEIRO')
  const [loading, setLoading] = useState(true)
  const [troco, setTroco] = useState(0)

  async function carregarMesa() {
    setLoading(true)

    const { data: pedidosData } = await supabase
      .from('pedidos')
      .select('*')
      .eq('mesa_id', mesaId)
      .eq('status', 'CONCLUÍDO')

    const total =
      pedidosData?.reduce((acc, p) => acc + p.valor_total, 0) || 0

    setPedidos(pedidosData || [])
    setTotalConsumido(total)

    const { data: pagamentosData } = await supabase
      .from('pagamentos_abertos')
      .select('*')
      .eq('mesa_id', mesaId)

    setPagamentos(pagamentosData || [])
    setLoading(false)
  }

  useEffect(() => {
    const saldoAtual =
      totalConsumido -
      pagamentos.reduce((acc, p) => acc + p.valor_pago, 0)

    if (formaPagamento === 'DINHEIRO') {
      const valor = Number(valorPago)
      if (!isNaN(valor) && valor > 0) {
        setTroco(valor > saldoAtual ? valor - saldoAtual : 0)
      } else {
        setTroco(0)
      }
    } else {
      setTroco(0)
    }
  }, [valorPago, formaPagamento, totalConsumido, pagamentos])

  async function registrarPagamento() {
    const saldoAtual =
      totalConsumido -
      pagamentos.reduce((acc, p) => acc + p.valor_pago, 0)

    let valor: number

    if (formaPagamento === 'DINHEIRO') {
      valor = Number(valorPago)
      if (isNaN(valor) || valor <= 0) {
        alert('Informe um valor válido')
        return
      }
      if (valor > saldoAtual) {
        valor = saldoAtual
      }
    } else {
      valor = saldoAtual
      if (valor <= 0) {
        alert('Não há saldo pendente')
        return
      }
    }

    const { error } = await supabase.from('pagamentos_abertos').insert([
      {
        mesa_id: mesaId,
        valor_pago: valor,
        forma_pagamento: formaPagamento,
        troco:
          formaPagamento === 'DINHEIRO'
            ? Number(valorPago) - valor
            : 0
      }
    ])

    if (error) {
      console.error('Erro ao registrar pagamento:', error)
      alert('Erro ao registrar pagamento, veja o console.')
      return
    }

    setValorPago('')
    setTroco(0)
    carregarMesa()
  }

  async function fecharMesa() {
    const totalPago = pagamentos.reduce(
      (acc, p) => acc + p.valor_pago,
      0
    )

    if (totalPago < totalConsumido) {
      alert('Ainda existe saldo pendente na mesa.')
      return
    }

    // 🔥 HISTÓRICO CORRETO (FK produto_id)
    if (pedidos.length > 0) {
      await supabase.from('pedidos_historico').insert(
        pedidos.map(p => ({
          mesa_id: mesaId,
          produto_id: p.produto_id, // ✅ FK correta
          quantidade: p.quantidade,
          valor_unit: p.valor_unit,
          valor_total: p.valor_total,
          created_at: new Date().toISOString(),
          fechado_em: new Date().toISOString()
        }))
      )

      await supabase.from('pedidos').delete().eq('mesa_id', mesaId)
    }

    await supabase.from('pagamentos').insert(
      pagamentos.map(p => ({
        mesa_id: mesaId,
        total: totalConsumido,
        forma_pagamento: p.forma_pagamento,
        valor_pago: p.valor_pago,
        troco: p.troco
      }))
    )

    await supabase.from('pagamentos_abertos')
      .delete()
      .eq('mesa_id', mesaId)

    await supabase.from('mesas')
      .update({ status: 'LIVRE' })
      .eq('id', mesaId)

    onFechada()
  }

  useEffect(() => {
    carregarMesa()
  }, [mesaId, atualizar])

  if (loading) return <p>Carregando fechamento...</p>
  if (pedidos.length === 0)
    return <p>Nenhum pedido concluído para fechar.</p>

  const totalPago = pagamentos.reduce(
    (acc, p) => acc + p.valor_pago,
    0
  )
  const saldo = totalConsumido - totalPago

  return (
    <div
      style={{
        marginTop: 20,
        padding: 16,
        border: '1px solid #ccc',
        borderRadius: 8,
        maxWidth: 400
      }}
    >
      <h3>💳 Mesa {mesaId}</h3>

      <p><strong>Total consumido:</strong> R$ {totalConsumido.toFixed(2)}</p>
      <p><strong>Total pago:</strong> R$ {totalPago.toFixed(2)}</p>
      <p><strong>Saldo:</strong> R$ {saldo.toFixed(2)}</p>

      <label>
        Forma de pagamento:
        <select
          value={formaPagamento}
          onChange={e =>
            setFormaPagamento(e.target.value as FormaPagamento)
          }
          style={{ width: '100%', marginTop: 4 }}
        >
          <option value="DINHEIRO">💵 Dinheiro</option>
          <option value="PIX">📲 Pix</option>
          <option value="CARTAO">💳 Cartão</option>
        </select>
      </label>

      {formaPagamento === 'DINHEIRO' && (
        <>
          <label style={{ marginTop: 8, display: 'block' }}>
            Valor pago:
            <input
              type="number"
              step="0.01"
              value={valorPago}
              onChange={e => setValorPago(e.target.value)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>

          <p style={{ marginTop: 8 }}>
            <strong>Troco:</strong> R$ {troco.toFixed(2)}
          </p>
        </>
      )}

      <button
        onClick={registrarPagamento}
        style={{
          marginTop: 12,
          width: '100%',
          padding: 10,
          background: '#16a34a',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer'
        }}
      >
        💰 Registrar Pagamento
      </button>

      <button
        onClick={fecharMesa}
        disabled={saldo > 0}
        style={{
          marginTop: 12,
          width: '100%',
          padding: 10,
          background: saldo > 0 ? '#ccc' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: saldo > 0 ? 'not-allowed' : 'pointer'
        }}
      >
        ✅ Fechar Mesa
      </button>
    </div>
  )
}
