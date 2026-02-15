'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PedidoDB {
  id: number
  mesa_id: number
  produto_id: number
  quantidade: number
  created_at: string
}

interface ItemCozinha {
  produto_nome: string
  quantidade: number
}

interface PedidoCozinha {
  mesa_id: number
  dataHora: string
  itens: ItemCozinha[]
}

export default function Cozinha() {
  const [mesas, setMesas] = useState<PedidoCozinha[]>([])
  const [loading, setLoading] = useState(true)

  const totalPedidosAnterior = useRef(0)
  const somPedido = useRef<HTMLAudioElement | null>(null)
  const audioLiberado = useRef(false)

  // 🔓 Libera áudio SOMENTE após clique (regra do navegador)
  useEffect(() => {
    const liberarAudio = () => {
      if (!audioLiberado.current) {
        const audio = document.createElement('audio')
        audio.src = '/alerta-cozinha.mp3'
        audio.preload = 'auto'
        somPedido.current = audio
        audioLiberado.current = true
      }
      document.removeEventListener('click', liberarAudio)
    }

    document.addEventListener('click', liberarAudio)
    return () => document.removeEventListener('click', liberarAudio)
  }, [])

  async function carregarPedidos() {
    setLoading(true)

    const { data: pedidosData } = await supabase
      .from('pedidos')
      .select('id, mesa_id, produto_id, quantidade, created_at')
      .eq('impresso', false)
      .order('created_at', { ascending: true })

    if (!pedidosData || pedidosData.length === 0) {
      setMesas([])
      totalPedidosAnterior.current = 0
      setLoading(false)
      return
    }

    // 🔔 SOM quando chega pedido novo
    if (
      audioLiberado.current &&
      pedidosData.length > totalPedidosAnterior.current &&
      somPedido.current
    ) {
      try {
        somPedido.current.currentTime = 0
        somPedido.current.play()
      } catch {}
    }
    totalPedidosAnterior.current = pedidosData.length

    const { data: produtosData } = await supabase
      .from('produtos')
      .select('id, nome')

    const mapaProdutos = new Map<number, string>()
    produtosData?.forEach(p => mapaProdutos.set(p.id, p.nome))

    const mapaMesas = new Map<
      number,
      { dataHora: string; itens: Map<number, ItemCozinha> }
    >()

    pedidosData.forEach(p => {
      // ✅ AJUSTE DEFINITIVO DO HORÁRIO (UTC → Campo Grande)
      const data = new Date(p.created_at)
      data.setHours(data.getHours() + 4)

      const dataHora = data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      if (!mapaMesas.has(p.mesa_id)) {
        mapaMesas.set(p.mesa_id, {
          dataHora,
          itens: new Map()
        })
      }

      const mesa = mapaMesas.get(p.mesa_id)!
      const nome = mapaProdutos.get(p.produto_id) || 'Produto'

      if (mesa.itens.has(p.produto_id)) {
        mesa.itens.get(p.produto_id)!.quantidade += p.quantidade
      } else {
        mesa.itens.set(p.produto_id, {
          produto_nome: nome,
          quantidade: p.quantidade
        })
      }
    })

    setMesas(
      Array.from(mapaMesas.entries()).map(([mesa_id, dados]) => ({
        mesa_id,
        dataHora: dados.dataHora,
        itens: Array.from(dados.itens.values())
      }))
    )

    setLoading(false)
  }

  // 🖨️ IMPRESSÃO — NÃO ALTERADA
  async function imprimirPedidos() {
    if (mesas.length === 0) {
      alert('Nenhum pedido novo para imprimir.')
      return
    }

    mesas.forEach(mesa => {
      let html = `
<html>
<head>
<style>
  body { font-family: Arial; width: 58mm; margin: 0; padding: 0; }
  h3 { margin: 0; font-size: 14px; }
  .data { font-size: 11px; margin-bottom: 6px; }
  li { font-size: 12px; margin: 2px 0; }
  hr { border-top: 1px dashed #000; }
  @page { margin: 0; }
</style>
</head>
<body>
<h3>🪑 Mesa ${mesa.mesa_id}</h3>
<div class="data">⏰ ${mesa.dataHora}</div>
<ul>
`

      mesa.itens.forEach(i => {
        html += `<li>🍢 ${i.produto_nome} — ${i.quantidade}</li>`
      })

      html += `
</ul>
<hr />
</body>
</html>
`

      const w = window.open('', '', 'width=300,height=300')
      if (!w) return
      w.document.write(html)
      w.document.close()
      w.focus()
      w.print()
      w.close()
    })

    const { data } = await supabase
      .from('pedidos')
      .select('id')
      .eq('impresso', false)

    const ids = data?.map(p => p.id) || []
    if (ids.length > 0) {
      await supabase.from('pedidos').update({ impresso: true }).in('id', ids)
    }

    carregarPedidos()
  }

  useEffect(() => {
    carregarPedidos()
    const interval = setInterval(carregarPedidos, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main style={{ padding: 20 }}>
      <h1>👨‍🍳 Cozinha</h1>

      <button
        onClick={imprimirPedidos}
        style={{
          padding: '8px 16px',
          backgroundColor: '#16a34a',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          marginBottom: 20
        }}
      >
        🖨️ Imprimir Pedidos
      </button>

      {loading && <p>Carregando pedidos...</p>}

      {!loading && mesas.length === 0 && (
        <p>✅ Nenhum pedido pendente.</p>
      )}

      {!loading &&
        mesas.map(mesa => (
          <div
            key={mesa.mesa_id}
            style={{
              border: '2px solid #333',
              borderRadius: 10,
              padding: 16,
              marginBottom: 16
            }}
          >
            <h3>🪑 Mesa {mesa.mesa_id}</h3>
            <small>⏰ {mesa.dataHora}</small>

            <ul>
              {mesa.itens.map((i, idx) => (
                <li key={idx}>
                  🍢 {i.produto_nome} — <strong>{i.quantidade}</strong>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </main>
  )
}
