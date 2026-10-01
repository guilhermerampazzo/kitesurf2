'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { Header } from '@/components/layout/Header'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { buberApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function CadastroMotoristaPage() {
  const router = useRouter()
  const { checking } = useRequireAuth()
  const [cnh, setCnh] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [vehicleSeats, setVehicleSeats] = useState('4')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await buberApi.registerDriver({
        cnh: cnh || undefined,
        vehicleModel: vehicleModel || undefined,
        vehiclePlate: vehiclePlate || undefined,
        vehicleColor: vehicleColor || undefined,
        vehicleSeats: vehicleSeats ? parseInt(vehicleSeats, 10) : undefined,
      })
      toast.success('Cadastro enviado! Aguarde a aprovação.')
      router.push('/buber/motorista')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Erro ao enviar cadastro.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="header-offset w-full max-w-container mx-auto px-margin-desktop pb-24 pt-2">
        <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
            <Icon name="arrow_back" size={20} />
          </button>
          <div>
            <h1 className="text-headline-lg font-display font-black text-primary">Seja motorista Buber</h1>
            <p className="text-body-md text-secondary">Cadastre-se e ganhe dirigindo na sua região</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-bold text-on-surface">Habilitação</h2>
            <Input label="CNH (número)" placeholder="Ex: 01234567890" value={cnh} onChange={(e) => setCnh(e.target.value)} />
          </div>

          <div className="card-soft p-6 flex flex-col gap-4">
            <h2 className="text-title-lg font-bold text-on-surface">Veículo</h2>
            <Input label="Modelo" placeholder="Ex: VW Gol 1.6" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Placa" placeholder="Ex: ABC1D23" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} />
              <Input label="Cor" placeholder="Ex: Prata" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} />
            </div>
            <Input label="Assentos (incl. motorista)" type="number" min={1} max={8} value={vehicleSeats} onChange={(e) => setVehicleSeats(e.target.value)} required />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              <Icon name="local_taxi" size={18} />
              Enviar cadastro
            </Button>
          </div>
        </form>
        </div>
      </main>
    </>
  )
}
