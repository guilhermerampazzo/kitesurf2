'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { trainingApi } from '@/lib/api'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

type ServiceDetail = {
  id: string
  title: string
  description?: string
  category?: string
  price: number
  duration?: number
  maxParticipants?: number
  trainer?: {
    id: string
    businessName: string
    bio?: string
    city?: string
    state?: string
    specialties?: string[]
    rating?: number
    avatar?: string
    user?: { name?: string; avatar?: string }
  }
  availabilities?: { dayOfWeek: number; startTime: string; endTime: string }[]
}

type Slot = { startTime: string; endTime: string; available: boolean }

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function TreinoServicePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [service, setService] = useState<ServiceDetail | null>(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    trainingApi
      .getService(id)
      .then((r) => setService(r.data?.data ?? r.data))
      .catch(() => toast.error('Serviço não encontrado.'))
  }, [id])

  async function fetchSlots() {
    if (!date) return
    setSlotsLoading(true)
    setSelectedSlot(null)
    try {
      const res = await trainingApi.slots(id, date)
      const data = res.data?.data ?? res.data ?? []
      const arr: Slot[] = Array.isArray(data) ? data : data.slots ?? []
      setSlots(arr)
      if (arr.length === 0) toast('Nenhum horário disponível nesta data.', { icon: 'ℹ️' })
    } catch {
      toast.error('Erro ao buscar horários.')
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  useEffect(() => {
    if (date && service) fetchSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?.id])

  async function handleBook() {
    if (!selectedSlot) {
      toast.error('Selecione um horário.')
      return
    }
    setBookingLoading(true)
    try {
      await trainingApi.book(id, { date, startTime: selectedSlot, notes, paymentMethod })
      toast.success('Agendamento realizado com sucesso!')
      router.push('/treino/agenda')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao reservar. Faça login e tente novamente.')
    } finally {
      setBookingLoading(false)
    }
  }

  if (!service) {
    return (
      <>
        <Header />
        <main className="header-offset max-w-container mx-auto px-margin-desktop py-unit-xl flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    )
  }

  const trainer = service.trainer

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop mb-unit-xl">
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-unit-lg">
          <Link href="/treino" className="hover:text-primary">
            Treino
          </Link>
          <Icon name="chevron_right" size={16} />
          <span className="text-on-surface truncate max-w-xs">{service.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-unit-xl">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="card-soft p-6 md:p-8 mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {service.category && <Badge variant="verified" className="capitalize">{service.category}</Badge>}
                {service.duration && (
                  <span className="inline-flex items-center gap-1 text-body-md text-secondary">
                    <Icon name="schedule" size={14} /> {service.duration} min
                  </span>
                )}
                {service.maxParticipants && (
                  <span className="inline-flex items-center gap-1 text-body-md text-secondary">
                    <Icon name="group" size={14} /> até {service.maxParticipants} participantes
                  </span>
                )}
              </div>

              <h1 className="text-headline-lg font-display font-black text-primary mb-2">{service.title}</h1>
              <div className="text-display-lg font-display font-black text-primary mb-4">{formatPrice(service.price)}</div>

              {service.description && (
                <div className="prose prose-sm max-w-none text-body-lg text-on-surface-variant leading-relaxed" dangerouslySetInnerHTML={{ __html: service.description }} />
              )}

              {service.availabilities && service.availabilities.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-title-lg font-bold text-on-surface mb-3">Disponibilidade semanal</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-body-md">
                      <thead>
                        <tr className="text-label-md uppercase tracking-wider text-secondary">
                          <th className="text-left py-2 px-3">Dia</th>
                          <th className="text-left py-2 px-3">Início</th>
                          <th className="text-left py-2 px-3">Fim</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {service.availabilities.map((a, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-semibold">{DAY_LABELS[a.dayOfWeek] ?? a.dayOfWeek}</td>
                            <td className="py-2 px-3">{a.startTime}</td>
                            <td className="py-2 px-3">{a.endTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Trainer card */}
            {trainer && (
              <div className="card-soft p-6">
                <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-4">Treinador</h2>
                <Link href={`/treino/trainer/${trainer.id}`} className="flex items-center gap-4 group">
                  <div className="w-16 h-16 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xl font-display font-black overflow-hidden shrink-0">
                    {trainer.avatar || trainer.user?.avatar ? (
                      <img src={trainer.avatar ?? trainer.user?.avatar ?? ''} alt={trainer.businessName} className="w-full h-full object-cover" />
                    ) : (
                      trainer.businessName[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-title-lg font-bold text-on-surface group-hover:text-primary transition-colors">{trainer.businessName}</div>
                    {trainer.city && (
                      <div className="flex items-center gap-1 text-body-md text-secondary">
                        <Icon name="location_on" size={14} />
                        {trainer.city}
                        {trainer.state ? `, ${trainer.state}` : ''}
                      </div>
                    )}
                    {trainer.specialties && trainer.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {trainer.specialties.slice(0, 4).map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-primary-fixed text-on-primary-fixed-variant">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
                {trainer.bio && <p className="text-body-md text-secondary mt-4 leading-relaxed">{trainer.bio}</p>}
              </div>
            )}
          </div>

          {/* Booking calendar sidebar */}
          <aside className="w-full lg:w-[380px] shrink-0">
            <div className="sticky top-32 flex flex-col gap-unit-md">
              <div className="card-soft p-6">
                <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-4 flex items-center gap-2">
                  <Icon name="calendar_month" size={20} className="text-primary" />
                  Agendar horário
                </h2>

                <div className="flex flex-col gap-4">
                  <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

                  <Button type="button" variant="secondary" onClick={fetchSlots} loading={slotsLoading} className="w-full">
                    <Icon name="search" size={18} />
                    Ver horários
                  </Button>

                  {slots.length > 0 && (
                    <div>
                      <p className="text-label-md font-bold uppercase tracking-wider text-secondary mb-2">Horários disponíveis em {formatDate(date)}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((s) => (
                          <button
                            key={s.startTime}
                            type="button"
                            disabled={!s.available}
                            onClick={() => setSelectedSlot(s.startTime)}
                            className={`py-2.5 rounded-xl text-body-md font-bold border transition-all ${
                              selectedSlot === s.startTime
                                ? 'bg-primary text-on-primary border-primary shadow-soft'
                                : s.available
                                  ? 'bg-surface-container-lowest border-outline-variant hover:border-primary hover:text-primary'
                                  : 'bg-surface-container text-outline border-transparent cursor-not-allowed opacity-60'
                            }`}
                          >
                            {s.startTime}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {slots.length === 0 && !slotsLoading && (
                    <p className="text-body-md text-secondary text-center py-2">Selecione uma data e clique em Ver horários.</p>
                  )}

                  <Textarea label="Observações (opcional)" placeholder="Ex: primeira aula, tenho lesão no joelho..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />

                  <Select
                    label="Forma de pagamento"
                    options={[
                      { value: 'pix', label: 'PIX' },
                      { value: 'card', label: 'Cartão' },
                    ]}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />

                  <Button onClick={handleBook} loading={bookingLoading} disabled={!selectedSlot} variant="accent" className="w-full">
                    <Icon name="event_available" size={18} />
                    Confirmar agendamento
                  </Button>

                  <p className="text-label-md text-secondary text-center">Você receberá confirmação do treinador em breve.</p>
                </div>
              </div>

              <div className="p-4 bg-primary-fixed dark:bg-primary-container rounded-xl text-label-md text-on-primary-fixed-variant dark:text-primary-fixed flex items-start gap-2">
                <Icon name="security" size={16} className="shrink-0 mt-0.5" />
                Pagamento e dados protegidos. Cancele com até 24h de antecedência.
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
