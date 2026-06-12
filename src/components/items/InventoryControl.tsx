'use client'

import { Minus, Plus } from 'lucide-react'
import { useInventoryStore } from '@/store/useInventoryStore'

interface InventoryControlProps {
  nodeId:    string
  className?: string
}

/** Stepper to track how many of an item are already in stock. */
export function InventoryControl({ nodeId, className = '' }: InventoryControlProps) {
  const amount    = useInventoryStore(s => s.inventory.find(i => i.nodeId === nodeId)?.amount ?? 0)
  const setAmount = useInventoryStore(s => s.setAmount)

  const update = (val: number) => setAmount(nodeId, Math.max(0, isNaN(val) ? 0 : val))

  const btnClass =
    'w-6 h-6 rounded-lg border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 ' +
    'text-gray-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0 ' +
    'hover:bg-rose-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-default transition-colors'

  return (
    <div className={`flex items-center gap-1 ${className}`} onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => update(amount - 1)}
        disabled={amount <= 0}
        className={btnClass}
        aria-label="Bestand verringern"
      >
        <Minus size={11} />
      </button>
      <input
        type="number"
        min="0"
        value={amount}
        onChange={e => update(parseInt(e.target.value))}
        className="w-12 h-6 rounded-lg border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800
          text-center text-xs text-gray-700 dark:text-slate-200 outline-none focus:border-pink-400
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Bestand"
      />
      <button
        type="button"
        onClick={() => update(amount + 1)}
        className={btnClass}
        aria-label="Bestand erhöhen"
      >
        <Plus size={11} />
      </button>
    </div>
  )
}
