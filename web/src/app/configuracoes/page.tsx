'use client'
import { useEffect, useState } from 'react'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { authApi, usersApi } from '@/lib/api'
import type { User } from '@/types'
import toast from 'react-hot-toast'
import { useTheme } from 'next-themes'

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    authApi.me().then((r) => {
      setUser(r.data)
      setName(r.data.name)
      setEmail(r.data.email)
    })
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await usersApi.updateProfile({ name })
      toast.success('Perfil atualizado!')
    } catch { toast.error('Erro ao atualizar perfil.') }
    finally { setSaving(false) }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { toast.error('Senhas não conferem.'); return }
    if (newPw.length < 8) { toast.error('Mínimo 8 caracteres.'); return }
    setSavingPw(true)
    try {
      await usersApi.updateProfile({ currentPassword: currentPw, newPassword: newPw })
      toast.success('Senha alterada com sucesso!')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch { toast.error('Senha atual incorreta.') }
    finally { setSavingPw(false) }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar userName={user?.name} userAvatar={user?.avatar} />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <h1 className="text-headline-lg font-display font-black text-primary section-rule inline-block">Configurações</h1>

          {/* Profile */}
          <div className="card-soft p-8">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-6 flex items-center gap-2">
              <span className="trust-chip-icon !w-9 !h-9 !rounded-xl"><Icon name="person" size={18} /></span> Perfil
            </h2>
            <form onSubmit={saveProfile} className="flex flex-col gap-4">
              <div className="flex items-center gap-6 mb-2">
                <div className="w-20 h-20 rounded-3xl bg-brand-gradient flex items-center justify-center text-white text-3xl font-display font-black shadow-soft overflow-hidden">
                  {user?.name[0]}
                </div>
                <Button type="button" variant="ghost" size="sm">
                  <Icon name="upload" size={16} /> Trocar foto
                </Button>
              </div>
              <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="E-mail" type="email" value={email} disabled className="opacity-60 cursor-not-allowed" />
              <Button type="submit" variant="accent" loading={saving}>Salvar perfil</Button>
            </form>
          </div>

          {/* Password */}
          <div className="card-soft p-8">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-6 flex items-center gap-2">
              <span className="trust-chip-icon !w-9 !h-9 !rounded-xl"><Icon name="lock" size={18} /></span> Segurança
            </h2>
            <form onSubmit={changePassword} className="flex flex-col gap-4">
              <Input label="Senha atual" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
              <Input label="Nova senha" type="password" placeholder="Mínimo 8 caracteres" value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
              <Input label="Confirmar nova senha" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
              <Button type="submit" loading={savingPw} variant="primary">Alterar senha</Button>
            </form>
          </div>

          {/* Theme */}
          <div className="card-soft p-8">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-6 flex items-center gap-2">
              <span className="trust-chip-icon !w-9 !h-9 !rounded-xl"><Icon name="palette" size={18} /></span> Aparência
            </h2>
            <div className="flex gap-4">
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-display font-bold ${
                    theme === t ? 'border-primary bg-primary-fixed text-primary' : 'border-outline-variant hover:border-primary text-secondary'
                  }`}
                >
                  <Icon name={t === 'light' ? 'light_mode' : 'dark_mode'} size={22} className={theme === t ? 'text-primary' : 'text-secondary'} />
                  {t === 'light' ? 'Claro' : 'Escuro'}
                  {theme === t && <Icon name="check_circle" filled size={18} className="text-accent-strong ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-error-container border border-error rounded-card p-8">
            <h2 className="text-title-lg font-display font-extrabold text-error mb-2 flex items-center gap-2">
              <Icon name="warning" size={22} /> Zona de perigo
            </h2>
            <p className="text-body-md text-secondary mb-4">
              Excluir sua conta é permanente e irá remover todos os seus dados, anúncios e histórico.
            </p>
            <Button variant="danger" size="sm">Excluir minha conta</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
