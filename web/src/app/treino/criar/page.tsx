'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { trainingApi } from '@/lib/api'
import toast from 'react-hot-toast'

const TRAINER_TYPES = [
  { value: 'personal', label: 'Personal Trainer' },
  { value: 'academia', label: 'Academia / Estúdio' },
]

const CATEGORY_OPTIONS = [
  { value: 'musculacao', label: 'Musculação' },
  { value: 'funcional', label: 'Funcional' },
  { value: 'crossfit', label: 'Crossfit' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'fisioterapia', label: 'Fisioterapia' },
  { value: 'personal', label: 'Personal' },
]

export default function TreinoCriarPage() {
  const router = useRouter()
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Trainer profile form
  const [tType, setTType] = useState('personal')
  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [specialtiesInput, setSpecialtiesInput] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('CE')
  const [creatingProfile, setCreatingProfile] = useState(false)

  // Service form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('musculacao')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('60')
  const [maxParticipants, setMaxParticipants] = useState('1')
  const [creatingService, setCreatingService] = useState(false)

  const { checking, user } = useRequireAuth()

  useEffect(() => {
    if (checking || !user) return
    trainingApi
      .getTrainer('me')
      .then(() => {
        setHasProfile(true)
      })
      .catch(() => {
        // Try fetching via update endpoint check or list; assume no profile
        setHasProfile(false)
      })
      .finally(() => setProfileLoading(false))
  }, [checking, user])

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault()
    setCreatingProfile(true)
    try {
      const specialties = specialtiesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      await trainingApi.createTrainer({
        type: tType,
        businessName,
        bio,
        specialties,
        city,
        state,
      })
      toast.success('Perfil de treinador criado!')
      setHasProfile(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao criar perfil. Verifique os campos.')
    } finally {
      setCreatingProfile(false)
    }
  }

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault()
    setCreatingService(true)
    try {
      await trainingApi.createService({
        title,
        description,
        category,
        price: parseFloat(price),
        duration: parseInt(duration, 10),
        maxParticipants: parseInt(maxParticipants, 10),
      })
      toast.success('Serviço criado com sucesso!')
      router.push('/treino')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao criar serviço.')
    } finally {
      setCreatingService(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
              <Icon name="arrow_back" size={20} />
            </button>
            <div>
              <h1 className="text-headline-lg font-display font-black text-primary">Treino — Criar oferta</h1>
              <p className="text-body-md text-secondary">Cadastre seu perfil de treinador e publique seus serviços.</p>
            </div>
          </div>

          {!hasProfile ? (
            <form onSubmit={handleCreateProfile} className="card-soft p-6 md:p-8 flex flex-col gap-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="trust-chip-icon !w-10 !h-10">
                  <Icon name="person_add" size={20} />
                </span>
                <div>
                  <h2 className="text-title-lg font-display font-extrabold text-on-surface">Crie seu perfil de treinador</h2>
                  <p className="text-body-md text-secondary">Necessário antes de publicar serviços.</p>
                </div>
              </div>

              <Select label="Tipo" options={TRAINER_TYPES} value={tType} onChange={(e) => setTType(e.target.value)} />

              <Input label="Nome do negócio / Nome profissional" placeholder="Ex: Studio Vento Forte • Rafael Costa" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />

              <Textarea label="Bio" placeholder="Fale sobre sua formação, experiência e metodologia..." value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />

              <Input label="Especialidades (separadas por vírgula)" placeholder="Ex: hipertrofia, mobilidade, reabilitação" value={specialtiesInput} onChange={(e) => setSpecialtiesInput(e.target.value)} />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Cidade" placeholder="Ex: Fortaleza" value={city} onChange={(e) => setCity(e.target.value)} required />
                <Input label="Estado (UF)" placeholder="CE" value={state} onChange={(e) => setState(e.target.value.toUpperCase())} maxLength={2} required />
              </div>

              <Button type="submit" loading={creatingProfile} variant="accent" className="w-full">
                <Icon name="check" size={18} />
                Criar perfil de treinador
              </Button>
            </form>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 flex items-center gap-2 mb-6 text-body-md">
                <Icon name="check_circle" size={20} className="text-green-600" />
                Perfil de treinador ativo — você já pode publicar serviços.
              </div>

              <form onSubmit={handleCreateService} className="card-soft p-6 md:p-8 flex flex-col gap-5">
                <h2 className="text-title-lg font-display font-extrabold text-on-surface flex items-center gap-2">
                  <Icon name="fitness_center" size={20} className="text-primary" />
                  Novo serviço / aula
                </h2>

                <Input label="Título do serviço" placeholder="Ex: Personal — Preparação física para kitesurf" value={title} onChange={(e) => setTitle(e.target.value)} required />

                <Textarea label="Descrição" placeholder="Descreva o serviço, público-alvo, diferenciais, local..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />

                <Select label="Categoria" options={CATEGORY_OPTIONS} value={category} onChange={(e) => setCategory(e.target.value)} />

                <div className="grid grid-cols-3 gap-4">
                  <Input label="Preço (R$)" type="number" min="0" step="0.01" placeholder="150" value={price} onChange={(e) => setPrice(e.target.value)} required />
                  <Input label="Duração (min)" type="number" min="15" step="15" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                  <Input label="Máx. participantes" type="number" min="1" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} required />
                </div>

                <div className="flex gap-3 mt-2">
                  <Button type="button" variant="ghost" onClick={() => router.push('/treino')} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" loading={creatingService} className="flex-1">
                    Publicar serviço
                  </Button>
                </div>
              </form>

              <div className="mt-6 flex justify-center">
                <Button variant="ghost" onClick={() => router.push('/treino/agenda')}>
                  <Icon name="calendar_month" size={18} />
                  Gerenciar agenda
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
