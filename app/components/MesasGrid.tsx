'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import MesaCard from './MesaCard'

type Mesa = {
  id: number
  numero: number
  status: 'LIVRE' | 'OCUPADA'
}

type MesasGridProps = {
  onMesaSelecionada: (mesaId: number) => void
}

export default function MesasGrid({ onMesaSelecionada }: MesasGridProps) {
  const [mesas, setMesas] = useState<Mesa[]>([])

  async function carregarMesas() {
    const { data } = await supabase
      .from('mesas')
      .select('*')
      .order('numero')

    if (data) {
      setMesas(
        data.map((m: any) => ({
          id: m.id,
          numero: m.numero,
          status: m.status,
        }))
      )
    }
  }

  async function alternarStatus(mesa: Mesa) {
    const novoStatus = mesa.status === 'LIVRE' ? 'OCUPADA' : 'LIVRE'

    await supabase
      .from('mesas')
      .update({ status: novoStatus })
      .eq('id', mesa.id)

    carregarMesas()
  }

  useEffect(() => {
    carregarMesas()
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {mesas.map((mesa) => (
        <MesaCard
          key={mesa.id}
          numero={mesa.numero}
          status={mesa.status}
          onSingleClick={() => onMesaSelecionada(mesa.id)}
          onDoubleClick={() => alternarStatus(mesa)}
        />
      ))}
    </div>
  )
}
