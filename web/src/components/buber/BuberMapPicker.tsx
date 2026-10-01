'use client'
import { useEffect, useRef } from 'react'

export interface MapPoint {
  lat: number
  lng: number
}

interface BuberMapPickerProps {
  origin: MapPoint | null
  dest: MapPoint | null
  target: 'origin' | 'dest'
  onPick: (point: MapPoint) => void
  className?: string
}

const DEFAULT_CENTER: MapPoint = { lat: -3.6276, lng: -38.8661 } // Cumbuco, Caucaia/CE

/**
 * Mapa Leaflet + OSM clicável. O clique define o ponto do `target` ativo
 * (origem ou destino). Marcadores verde (origem) e vermelho (destino) + linha.
 */
export function BuberMapPicker({ origin, dest, target, onPick, className }: BuberMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const originMarkerRef = useRef<L.Marker | null>(null)
  const destMarkerRef = useRef<L.Marker | null>(null)
  const lineRef = useRef<L.Polyline | null>(null)
  const stateRef = useRef({ origin, dest })
  stateRef.current = { origin, dest }
  const cbRef = useRef(onPick)
  cbRef.current = onPick

  // Init (uma vez)
  useEffect(() => {
    let cancelled = false
    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const { origin: o, dest: d } = stateRef.current
      const center = o ?? d ?? DEFAULT_CENTER
      const map = L.map(containerRef.current, { zoomControl: true }).setView([center.lat, center.lng], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)
      map.on('click', (e: L.LeafletMouseEvent) => {
        cbRef.current({ lat: e.latlng.lat, lng: e.latlng.lng })
      })
      mapRef.current = map
      syncMarkers(L, map)
    })
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      originMarkerRef.current = null
      destMarkerRef.current = null
      lineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function syncMarkers(L: typeof import('leaflet'), map: L.Map) {
    const { origin: o, dest: d } = stateRef.current
    if (o && !originMarkerRef.current) {
      originMarkerRef.current = L.marker([o.lat, o.lng], { title: 'Origem' }).addTo(map)
    }
    if (d && !destMarkerRef.current) {
      destMarkerRef.current = L.marker([d.lat, d.lng], { title: 'Destino' }).addTo(map)
    }
    if (o && originMarkerRef.current) originMarkerRef.current.setLatLng([o.lat, o.lng])
    if (d && destMarkerRef.current) destMarkerRef.current.setLatLng([d.lat, d.lng])
    if (o && d) {
      const latlngs: L.LatLngExpression[] = [[o.lat, o.lng], [d.lat, d.lng]]
      if (lineRef.current) lineRef.current.setLatLngs(latlngs)
      else lineRef.current = L.polyline(latlngs, { color: '#1f477b', weight: 3, dashArray: '8 6' }).addTo(map)
      map.fitBounds(L.latLngBounds(latlngs).pad(0.3))
    } else {
      lineRef.current?.remove()
      lineRef.current = null
      const single = o ?? d
      if (single && !originMarkerRef.current && !destMarkerRef.current) map.setView([single.lat, single.lng], 14)
    }
  }

  // Sincroniza marcadores quando origem/destino mudam
  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then((L) => {
      if (mapRef.current) syncMarkers(L, mapRef.current)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lng, dest?.lat, dest?.lng])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="relative">
        <div ref={containerRef} className={`h-72 rounded-xl overflow-hidden border border-outline-variant z-0 ${className ?? ''}`} />
        <span className="absolute top-3 left-3 z-[500] bg-surface-container-lowest/95 border border-outline-variant rounded-full px-3 py-1 text-label-md font-bold text-secondary shadow-soft pointer-events-none">
          {target === 'origin' ? 'Toque no mapa para definir a origem' : 'Toque no mapa para definir o destino'}
        </span>
      </div>
    </>
  )
}
