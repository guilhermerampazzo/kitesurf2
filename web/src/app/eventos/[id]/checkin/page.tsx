'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { eventsApi } from '@/lib/api'
import toast from 'react-hot-toast'

type Ticket = {
  id: string
  qrCode: string
  backupCode: string
  status: string
  holderName?: string | null
  holderEmail?: string | null
  checkedInAt?: string | null
  checkedInBy?: string | null
  ticketType: { id: string; name: string; price: number }
  order?: { id: string; buyerInfo?: unknown }
}

type EventBrief = { id: string; title: string }

export default function CheckinPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [event, setEvent] = useState<EventBrief | null>(null)
  const [code, setCode] = useState('')
  const [codeType, setCodeType] = useState<'auto' | 'qr' | 'backup'>('auto')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; ticket?: Ticket; error?: string } | null>(null)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function loadEvent() {
    try {
      const r = await eventsApi.get(eventId)
      setEvent({ id: r.data.id, title: r.data.title })
    } catch {}
  }
  async function loadTickets() {
    setLoadingTickets(true)
    try {
      const params: Record<string, string | number> = { limit: 100 }
      if (statusFilter) params.status = statusFilter
      const r = await eventsApi.listTickets(eventId, params as Record<string, string | number>)
      const data = Array.isArray(r.data) ? r.data : r.data.data ?? r.data
      setTickets((data as Ticket[]) ?? [])
    } catch {
      toast.error('Erro ao carregar ingressos.')
    } finally { setLoadingTickets(false) }
  }

  useEffect(() => { loadEvent(); loadTickets() }, [eventId])
  useEffect(() => { loadTickets() }, [statusFilter])

  async function handleCheckin(e?: React.FormEvent) {
    e?.preventDefault()
    const val = code.trim()
    if (!val) { toast.error('Informe o código.'); return }
    setChecking(true)
    setResult(null)
    try {
      let payload: Record<string,string> = {}
      if (codeType === 'qr') payload.qrCode = val
      else if (codeType === 'backup') payload.backupCode = val.toUpperCase()
      else {
        // auto: if length <=6 or alphanumeric without dash, assume backup, else qr
        if (val.length <= 8 && /^[A-Z0-9]+$/i.test(val.replace(/-/g,'')) && !val.includes('-')) payload.backupCode = val.toUpperCase()
        else payload.qrCode = val
      }
      const { data } = await eventsApi.checkin(payload)
      const ticket = (data.ticket ?? data) as Ticket
      setResult({ success: true, ticket })
      toast.success(`Check-in OK — ${ticket.ticketType?.name ?? 'Ingresso'} • ${ticket.holderName ?? 'Titular'}`)
      setCode('')
      loadTickets()
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      const msg = response ?? (err as Error)?.message ?? 'Erro no check-in'
      setResult({ success: false, error: msg })
      toast.error(msg)
    } finally { setChecking(false) }
  }

  const filtered = tickets.filter((t) => {
    if (!search.trim()) return true
    const s = search.trim().toLowerCase()
    return t.qrCode.toLowerCase().includes(s) || t.backupCode.toLowerCase().includes(s) || (t.holderName ?? '').toLowerCase().includes(s) || t.ticketType.name.toLowerCase().includes(s)
  })

  const statusBadge = (status: string) => {
    if (status === 'valid') return <Badge variant="success">Válido</Badge>
    if (status === 'used') return <Badge variant="pending">Usado</Badge>
    if (status === 'cancelled') return <Badge variant="error">Cancelado</Badge>
    return <Badge variant="pending">{status}</Badge>
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-5xl mx-auto px-margin-desktop pb-16">
        <nav className="flex items-center gap-2 text-body-md text-secondary mb-4">
          <Link href="/eventos" className="hover:text-primary">Eventos</Link>
          <Icon name="chevron_right" size={16}/>
          <Link href={`/eventos/${eventId}`} className="hover:text-primary truncate max-w-xs">{event?.title ?? 'Evento'}</Link>
          <Icon name="chevron_right" size={16}/>
          <span className="text-on-surface font-bold">Check-in</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-headline-lg font-display font-black text-primary flex items-center gap-2"><Icon name="qr_code_scanner" size={28}/> Check-in</h1>
            <p className="text-body-md text-secondary">Escaneie o QR ou digite o código backup de 6 dígitos.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/eventos/${eventId}`}><Button variant="ghost" size="sm"><Icon name="arrow_back" size={16}/> Voltar ao evento</Button></Link>
            <Link href={`/eventos/${eventId}/ingressos`}><Button variant="ghost" size="sm"><Icon name="confirmation_number" size={16}/> Ingressos</Button></Link>
          </div>
        </div>

        {/* Check-in form */}
        <div className="card-soft p-6 mb-6">
          <h2 className="text-title-lg font-display font-extrabold text-on-surface mb-4">Validar ingresso</h2>
          <form onSubmit={handleCheckin} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-3">
                <Select
                  label="Tipo"
                  options={[
                    { value: 'auto', label: 'Auto' },
                    { value: 'qr', label: 'QR Code' },
                    { value: 'backup', label: 'Backup (6 dígitos)' },
                  ]}
                  value={codeType}
                  onChange={(e) => setCodeType(e.target.value as never)}
                />
              </div>
              <div className="md:col-span-7">
                <Input
                  label={codeType === 'backup' ? 'Código backup' : codeType === 'qr' ? 'QR Code' : 'QR ou código backup'}
                  placeholder={codeType === 'backup' ? 'Ex: A1B2C3' : 'Cole o QR ou digite o backup'}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  icon="qr_code"
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <Button type="submit" loading={checking} className="w-full" variant="accent">
                  <Icon name="verified" size={18}/> Validar
                </Button>
              </div>
            </div>
          </form>

          {result && (
            <div className={`mt-6 rounded-2xl p-4 border ${result.success ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : 'bg-error-container border-error'}`}>
              {result.success && result.ticket ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-300 font-display font-extrabold">
                    <Icon name="check_circle" size={20} className="text-green-600"/> Check-in realizado!
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-body-md">
                    <div><span className="text-secondary">Ingresso:</span> <strong>{result.ticket.ticketType.name}</strong></div>
                    <div><span className="text-secondary">Status:</span> {statusBadge(result.ticket.status)}</div>
                    <div><span className="text-secondary">Titular:</span> {result.ticket.holderName ?? '—'}</div>
                    <div><span className="text-secondary">Backup:</span> <code className="bg-white px-2 py-0.5 rounded border">{result.ticket.backupCode}</code></div>
                    <div className="col-span-2"><span className="text-secondary">QR:</span> <code className="text-xs break-all bg-white px-2 py-1 rounded border">{result.ticket.qrCode}</code></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-on-error-container font-bold">
                  <Icon name="error" size={20}/> {result.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tickets list */}
        <div className="card-soft p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <h2 className="text-title-lg font-display font-extrabold text-on-surface">Ingressos do evento ({tickets.length})</h2>
            <div className="flex gap-2">
              <Select
                label=""
                options={[
                  { value: '', label: 'Todos status' },
                  { value: 'valid', label: 'Válidos' },
                  { value: 'used', label: 'Usados' },
                  { value: 'cancelled', label: 'Cancelados' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
              <Button variant="ghost" size="sm" onClick={loadTickets}><Icon name="refresh" size={16}/></Button>
            </div>
          </div>

          <div className="mb-4">
            <Input placeholder="Buscar por QR, backup, titular ou tipo..." value={search} onChange={(e) => setSearch(e.target.value)} icon="search" />
          </div>

          {loadingTickets ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="search_off" size={48} className="text-outline-variant mx-auto mb-3"/>
              <p className="text-body-md text-secondary">Nenhum ingresso encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-label-md uppercase tracking-wider text-secondary border-b border-outline-variant">
                    <th className="py-2 font-bold">Tipo</th>
                    <th className="py-2 font-bold">Titular</th>
                    <th className="py-2 font-bold">QR / Backup</th>
                    <th className="py-2 font-bold">Status</th>
                    <th className="py-2 font-bold">Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low">
                      <td className="py-3 text-body-md font-bold text-on-surface">{t.ticketType.name}</td>
                      <td className="py-3 text-body-md text-secondary">{t.holderName ?? '—'}<div className="text-label-md text-outline">{t.holderEmail ?? ''}</div></td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1">
                          <code className="text-[11px] bg-surface-container px-2 py-0.5 rounded border break-all max-w-[220px] truncate" title={t.qrCode}>{t.qrCode}</code>
                          <code className="text-label-md bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-bold text-amber-800 w-fit">{t.backupCode}</code>
                        </div>
                      </td>
                      <td className="py-3">{statusBadge(t.status)}</td>
                      <td className="py-3 text-body-md text-secondary">{t.checkedInAt ? new Date(t.checkedInAt).toLocaleString('pt-BR') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
