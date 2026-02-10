'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PedidoDB {
  mesa_id: number
  produto_id: number
  quantidade: number
}

interface Produto {
  id: number
  nome: string
}

interface PedidoCozinha {
  mesa_id: number
  itens: {
    produto_nome: string
    quantidade: number
  }[]
}

export default function Cozinha() {
  const [mesas, setMesas] = useState<PedidoCozinha[]>([])
  const [loading, setLoading] = useState(true)

  // Função para carregar pedidos
  async function carregarPedidos() {
    setLoading(true)

    // Busca pedidos não impressos
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('mesa_id, produto_id, quantidade')
      .eq('impresso', false)
      .order('created_at', { ascending: true })

    if (pedidosError) {
      console.error('Erro ao carregar pedidos da cozinha:', pedidosError)
      setMesas([])
      setLoading(false)
      return
    }

    if (!pedidosData || pedidosData.length === 0) {
      setMesas([])
      setLoading(false)
      return
    }

    // Busca produtos para mapear o nome
    const { data: produtosData, error: produtosError } = await supabase
      .from('produtos')
      .select('id, nome')

    if (produtosError) {
      console.error('Erro ao carregar produtos:', produtosError)
      setLoading(false)
      return
    }

    const mapaProdutos = new Map<number, string>()
    produtosData?.forEach((p: Produto) => {
      mapaProdutos.set(p.id, p.nome)
    })

    // Agrupa pedidos por mesa
    const mapaMesas = new Map<number, PedidoCozinha>()
    pedidosData.forEach((p: PedidoDB) => {
      if (!mapaMesas.has(p.mesa_id)) {
        mapaMesas.set(p.mesa_id, { mesa_id: p.mesa_id, itens: [] })
      }

      mapaMesas.get(p.mesa_id)!.itens.push({
        produto_nome: mapaProdutos.get(p.produto_id) || 'Produto',
        quantidade: p.quantidade
      })
    })

    setMesas(Array.from(mapaMesas.values()))
    setLoading(false)
  }

  // Função para imprimir pedidos de todas as mesas, 1 impressão por mesa
  async function imprimirPedidos() {
    const pedidosNaoImpresso = mesas.flatMap(mesa =>
      mesa.itens.map(item => ({
        mesa_id: mesa.mesa_id,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade
      }))
    )

    if (pedidosNaoImpresso.length === 0) {
      alert('Nenhum pedido novo para imprimir.')
      return
    }

    // Agrupa por mesa
    const mesasMap = new Map<number, { produto: string; quantidade: number }[]>()
    pedidosNaoImpresso.forEach(p => {
      if (!mesasMap.has(p.mesa_id)) mesasMap.set(p.mesa_id, [])
      mesasMap.get(p.mesa_id)?.push({
        produto: p.produto_nome,
        quantidade: p.quantidade
      })
    })

    // Função auxiliar para imprimir uma mesa de cada vez
    const imprimirMesa = (mesa: number, itens: { produto: string; quantidade: number }[]) => {
      let html = `
<html>
<head>
  <title>Pedidos Mesa ${mesa}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      width: 58mm;
    }
    h3 {
      margin: 0 0 4px 0;
      font-size: 14px;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0 0 8px 0;
    }
    li {
      font-size: 12px;
      margin: 2px 0;
    }
    hr {
      border: 0;
      border-top: 1px dashed #000;
      margin: 4px 0;
    }
    @page { size: auto; margin: 0; }
    @media print {
      body { width: 58mm; margin: 0; }
    }
  </style>
</head>
<body>
<h3>🪑 Mesa ${mesa}</h3>
<ul>
`
      itens.forEach(i => {
        html += `<li>🍢 ${i.produto} — ${i.quantidade}</li>`
      })
      html += '</ul><hr></body></html>'

      const printWindow = window.open('', '', 'width=300,height=200')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    }

    // Imprime cada mesa sequencialmente
    mesasMap.forEach((itens, mesa) => {
      imprimirMesa(mesa, itens)
    })

    // Marca pedidos como impressos
    const { data: pedidosData, error } = await supabase
      .from('pedidos')
      .select('id')
      .eq('impresso', false)

    const idsParaAtualizar = pedidosData?.map(p => p.id) || []

    if (idsParaAtualizar.length > 0) {
      const { error: erroAtualizar } = await supabase
        .from('pedidos')
        .update({ impresso: true })
        .in('id', idsParaAtualizar)

      if (erroAtualizar)
        console.error('Erro ao marcar pedidos como impressos:', erroAtualizar)
    }

    carregarPedidos()
  }

  // useEffect para atualizar a cozinha a cada 3s
  useEffect(() => {
    carregarPedidos()

    const interval = setInterval(() => {
      carregarPedidos()
    }, 3000) // ⏱️ 3 segundos

    return () => {
      clearInterval(interval)
    }
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
          cursor: 'pointer',
          marginBottom: 20
        }}
      >
        🖨️ Imprimir Pedidos
      </button>

      {loading && <p>Carregando pedidos...</p>}

      {!loading && mesas.length === 0 && (
        <p>✅ Nenhum pedido pendente para preparo.</p>
      )}

      {!loading && mesas.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {mesas.map(mesa => (
            <div
              key={mesa.mesa_id}
              style={{
                padding: 16,
                marginBottom: 16,
                border: '2px solid #333',
                borderRadius: 10
              }}
            >
              <h3>🪑 Mesa {mesa.mesa_id}</h3>

              <ul style={{ marginTop: 8 }}>
                {mesa.itens.map((item, index) => (
                  <li key={index}>
                    🍢 {item.produto_nome} — <strong>{item.quantidade}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
