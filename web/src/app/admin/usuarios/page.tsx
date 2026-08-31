'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { Icon } from '@/components/ui/Icon'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface AdminUser {
  id: string; name: string; email: string
  isVerified: boolean; isBanned: boolean; isAdmin: boolean; createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page }
      if (search) params.search = search
      const res = await adminApi.users(params)
      setUsers(res.data.data)
      setTotal(res.data.total)
    } catch { toast.error('Erro ao carregar usuários.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [page, search])

  const handleBan = async (id: string, banned: boolean) => {
    try {
      await adminApi.banUser(id)
      toast.success(banned ? 'Ação realizada.' : 'Usuário banido.')
      fetchUsers()
    } catch { toast.error('Erro.') }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-headline-lg font-display font-black text-primary">Usuários</h1>
              <p className="text-body-md text-on-surface-variant">{total} cadastrados</p>
            </div>
            <div className="relative w-72">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={20} />
              <input
                type="text" placeholder="Buscar por nome ou e-mail..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full rounded-full border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-body-md focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
              />
            </div>
          </div>
          <div className="card-soft overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="p-4 text-left text-label-md font-display font-bold uppercase tracking-wider text-on-surface-variant">Usuário</th>
                  <th className="p-4 text-left text-label-md font-display font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
                  <th className="p-4 text-left text-label-md font-display font-bold uppercase tracking-wider text-on-surface-variant">Cadastro</th>
                  <th className="p-4 text-right text-label-md font-display font-bold uppercase tracking-wider text-on-surface-variant">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-on-surface-variant">Carregando...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-on-surface-variant">Nenhum usuário encontrado.</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-on-surface">{user.name}</div>
                      <div className="text-body-md text-on-surface-variant">{user.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap">
                        {user.isBanned && <span className="rounded-full bg-error-container px-2.5 py-1 text-[11px] font-display font-bold text-on-error-container">Banido</span>}
                        {user.isVerified && <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-[11px] font-display font-bold text-on-primary-fixed">Verificado</span>}
                        {user.isAdmin && <span className="rounded-full btn-accent px-2.5 py-1 text-[11px] font-display font-bold text-accent-ink">Admin</span>}
                        {!user.isBanned && !user.isVerified && !user.isAdmin && (
                          <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-display font-bold text-on-surface-variant">Normal</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-body-md text-on-surface-variant">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleBan(user.id, user.isBanned)} disabled={user.isAdmin}
                        className={`rounded-full px-4 py-1.5 text-[11px] font-display font-bold transition-colors disabled:opacity-40 ${
                          user.isBanned ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-error-container text-on-error-container hover:opacity-80'
                        }`}>
                        {user.isBanned ? 'Desbanir' : 'Banir'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 20 && (
            <div className="mt-5 flex justify-center items-center gap-3">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-full border border-outline-variant px-5 py-2 text-body-md font-semibold disabled:opacity-50 hover:border-primary hover:text-primary transition-colors">Anterior</button>
              <span className="px-2 text-body-md text-on-surface-variant">Página {page} de {Math.ceil(total / 20)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
                className="rounded-full border border-outline-variant px-5 py-2 text-body-md font-semibold disabled:opacity-50 hover:border-primary hover:text-primary transition-colors">Próxima</button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
