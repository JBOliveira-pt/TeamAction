import { fetchStaff, fetchEquipas, fetchUsersForStaff } from '@/app/lib/data'
import { AdicionarMembroModal } from './_components/AdicionarMembroModal.client'
import { EditarMembroModal } from './_components/EditarMembroModal.client'
import { RemoverMembroModal } from './_components/RemoverMembroModal.client'

export const dynamic = 'force-dynamic'

const funcaoColors: Record<string, string> = {
  'Treinador Principal': 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  'Treinador Adjunto':   'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  'Fisioterapeuta':      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  'Preparador Físico':   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'Team Manager':        'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  'Médico':              'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  'Nutricionista':       'bg-lime-500/10 text-lime-400 border border-lime-500/20',
  'Delegado':            'bg-orange-500/10 text-orange-400 border border-orange-500/20',
}

function getFuncaoColor(funcao: string) {
  return funcaoColors[funcao] ?? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
}

type StaffRow = {
  id: string
  nome: string
  funcao: string
  equipa_id: string | null
  equipa_nome: string | null
  equipa_escalao: string | null
  user_id: string | null
  user_email: string | null
  created_at: string
}

type EquipaRow = {
  id: string
  nome: string
  escalao: string
  desporto: string | null
}

type UserRow = {
  id: string
  name: string
  email: string
  image_url: string | null
}

export default async function StaffPage() {
  const [staff, equipas, users] = await Promise.all([
    fetchStaff(),
    fetchEquipas(),
    fetchUsersForStaff(),
  ])

  const equipasProps = (equipas as EquipaRow[]).map(e => ({
    id: e.id,
    nome: e.nome,
    escalao: e.escalao ?? '',
  }))

  const usersProps = (users as UserRow[]).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    imageurl: u.image_url,
  }))

  const treinadoresPrincipais = (staff as StaffRow[]).filter(s => s.funcao === 'Treinador Principal').length
  const treinadoresAdjuntos = (staff as StaffRow[]).filter(s => s.funcao === 'Treinador Adjunto').length
  const semEquipa = (staff as StaffRow[]).filter(s => !s.equipa_id).length

  return (
    <div className="p-6 space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {staff.length} {staff.length === 1 ? 'membro registado' : 'membros registados'}
          </p>
        </div>
        <AdicionarMembroModal equipas={equipasProps} users={usersProps} />
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-cyan-500/30 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total</p>
          <p className="text-3xl font-bold text-cyan-400 mt-2">{staff.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-violet-500/30 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tren. Principais</p>
          <p className="text-3xl font-bold text-violet-400 mt-2">{treinadoresPrincipais}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-blue-500/30 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tren. Adjuntos</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{treinadoresAdjuntos}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-amber-500/30 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sem Equipa</p>
          <p className="text-3xl font-bold text-amber-400 mt-2">{semEquipa}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {staff.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum membro de staff registado ainda.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">Clica em "Adicionar Membro" para começar.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-6 py-4">Nome</th>
                <th className="text-left px-6 py-4">Função</th>
                <th className="text-left px-6 py-4">Equipa</th>
                <th className="text-left px-6 py-4">Entrada</th>
                <th className="text-left px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {(staff as StaffRow[]).map(s => (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-violet-400">
                          {s.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{s.nome}</p>
                        {s.user_email && (
                          <p className="text-xs text-gray-400">{s.user_email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getFuncaoColor(s.funcao)}`}>
                      {s.funcao}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {s.equipa_nome ? (
                      <div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">{s.equipa_nome}</p>
                        {s.equipa_escalao && (
                          <p className="text-xs text-gray-400">{s.equipa_escalao}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs italic text-gray-400">Sem equipa</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('pt-PT') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <EditarMembroModal
                        membro={{
                          id: s.id,
                          nome: s.nome,
                          funcao: s.funcao,
                          equipaid: s.equipa_id,
                          userid: s.user_id,
                        }}
                        equipas={equipasProps}
                        users={usersProps}
                      />
                      <RemoverMembroModal id={s.id} nome={s.nome} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}



