import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { Button } from '../../components/ui/Button'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function ClickCapture({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

export function MapPinPicker({ open, title, lat, lng, onPick, onClose }) {
  const [draft, setDraft] = useState({
    lat: lat ? Number(lat) : 26.8467,
    lng: lng ? Number(lng) : 80.9462,
  })

  useEffect(() => {
    setDraft({
      lat: lat ? Number(lat) : 26.8467,
      lng: lng ? Number(lng) : 80.9462,
    })
  }, [lat, lng, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-medium">{title}</p>
          <button type="button" className="text-ink-400" onClick={onClose}>✕</button>
        </div>
        <div className="h-80">
          <MapContainer center={[draft.lat, draft.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickCapture onPick={(nextLat, nextLng) => setDraft({ lat: nextLat, lng: nextLng })} />
            <Marker position={[draft.lat, draft.lng]} />
          </MapContainer>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <p className="text-ink-500">{draft.lat.toFixed(6)}, {draft.lng.toFixed(6)}</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onPick(draft.lat, draft.lng); onClose() }}>Use this pin</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
