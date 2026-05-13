import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { DbProperty } from '../../types/property'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

type Props = { properties: DbProperty[] }

export function AdminMap({ properties }: Props) {
  const pts = useMemo(
    () => properties.filter((p) => p.latitude != null && p.longitude != null),
    [properties],
  )
  const center: [number, number] =
    pts[0]?.latitude != null && pts[0]?.longitude != null
      ? [Number(pts[0].latitude), Number(pts[0].longitude)]
      : [-1.2921, 36.8219]

  return (
    <div className="h-[min(70vh,640px)] w-full overflow-hidden rounded-2xl border border-white/10">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="z-0 h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {pts.map((p) => (
          <Marker key={p.id} position={[Number(p.latitude), Number(p.longitude)]}>
            <Popup>
              <strong className="text-trace-dusk">{p.title}</strong>
              <div className="text-xs">{p.estate ?? p.area_label ?? p.town}</div>
              <div className="text-[11px] text-zinc-600 mt-1">Ref {p.listing_reference}</div>
              {p.owner_phone && <div className="text-[11px]">Owner/agent: {p.owner_phone}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
