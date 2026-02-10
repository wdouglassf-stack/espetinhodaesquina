'use client'
import React from 'react'

type MesaCardProps = {
  numero: number
  status: 'LIVRE' | 'OCUPADA'
  onSingleClick: () => void
  onDoubleClick: () => void
}

export default function MesaCard({
  numero,
  status,
  onSingleClick,
  onDoubleClick,
}: MesaCardProps) {
  const bgColor = status === 'LIVRE' ? '#a5d6a7' : '#ef9a9a'

  return (
    <div
      onClick={onSingleClick}
      onDoubleClick={onDoubleClick}
      style={{
        cursor: 'pointer',
        backgroundColor: bgColor,
        padding: 16,
        borderRadius: 8,
        textAlign: 'center',
        userSelect: 'none',
      }}
    >
      <h2>Mesa {numero}</h2>
      <p>{status}</p>
    </div>
  )
}
