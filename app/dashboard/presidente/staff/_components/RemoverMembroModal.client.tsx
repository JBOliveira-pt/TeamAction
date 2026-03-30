'use client'

import { useState, useTransition } from 'react'
import { removerMembro } from '@/app/lib/actions'
import { Trash2, X } from 'lucide-react'

export function RemoverMembroModal({ id, nome }: { id: string; nome: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRemover() {
    startTransition(async () => {
      try {
        await removerMembro(id)
        setOpen(false)
      } catch {
        setError('Erro ao remover membro. Tenta novamente.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
      >
        Remover
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Trash2 size={16} className="text-red-400" />
                </div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Remover Membro</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tens a certeza que queres remover <span className="font-semibold text-gray-900 dark:text-white">"{nome}"</span> do staff? Esta ação não pode ser desfeita.
            </p>

            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemover}
                disabled={isPending}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {isPending ? 'A remover...' : 'Sim, remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
