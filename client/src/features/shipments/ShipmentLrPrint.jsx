import { Printer, X } from 'lucide-react'
import { tokenStorage } from '../../lib/tokenStorage'
import { formatMoney } from '../../lib/utils'
import { useBranding } from '../settings/BrandingProvider'

function fmt(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function cityOf(loc) {
  return loc?.city || loc?.address?.city || '—'
}

export function ShipmentLrPrint({ booking, onClose }) {
  const branding = useBranding()
  if (!booking) return null

  const charges = booking.charges || {}
  const items = booking.items?.length ? booking.items : [{ name: booking.cargo?.description || 'Goods', quantity: booking.cargo?.packages || 1, unit: 'PKG' }]
  const packages = booking.packages || []

  const savePdf = async () => {
    const base = import.meta.env.VITE_API_URL || '/api/v1'
    const res = await fetch(`${base}/bookings/${booking._id}/lr`, {
      headers: { Authorization: `Bearer ${tokenStorage.getAccess()}` },
    })
    if (!res.ok) {
      window.print()
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${booking.lrNumber || booking.shipmentNumber || 'LR'}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-900/50 print:static print:bg-white">
      <div className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl print:max-w-none print:shadow-none">
        <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white print:hidden">
          <p className="text-sm font-medium">Lorry Receipt</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.print()} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm">
              <Printer className="mr-1 inline h-4 w-4" /> Print / Save PDF
            </button>
            <button type="button" onClick={savePdf} className="rounded-md bg-white/10 px-3 py-1.5 text-sm">Download PDF</button>
            <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-slate-800">
          <div className="border border-slate-300">
            <div className="flex items-start justify-between gap-4 border-b border-slate-300 p-4">
              <div>
                <p className="text-lg font-bold tracking-wide">{branding.companyName}</p>
                <p className="text-[11px] font-semibold uppercase text-blue-800">{branding.tagline}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {[branding.address, branding.city, branding.state, branding.pincode].filter(Boolean).join(', ') || 'Head office'}
                </p>
                <p className="text-xs text-slate-600">
                  {branding.supportPhone ? `Phone: ${branding.supportPhone}` : ''} {branding.gstin ? ` · GSTIN: ${branding.gstin}` : ''} {branding.supportEmail ? ` · Email: ${branding.supportEmail}` : ''}
                </p>
              </div>
              <div className="min-w-[180px] bg-blue-900 p-3 text-right text-xs text-white">
                <p className="text-[10px] uppercase tracking-widest">Lorry Receipt</p>
                <p className="mt-2">LR Number: {booking.lrNumber || '—'}</p>
                <p>LR Date: {fmt(booking.bookingDate)}</p>
                <p>Booking: {booking.shipmentNumber || booking.bookingNumber}</p>
                <p>Payment: {booking.paymentMode || '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 border-b border-slate-300 text-xs">
              <div className="border-r border-slate-300 p-3">
                <p className="mb-1 font-semibold text-blue-800">Consignor (Dispatch from)</p>
                <p className="font-medium">{booking.consignor?.name || booking.customer?.name}</p>
                <p>{booking.consignor?.company}</p>
                <p>{booking.consignor?.address || booking.pickup?.address}</p>
                <p>{booking.consignor?.city || cityOf(booking.pickup)} {booking.consignor?.state}</p>
                <p>{booking.consignor?.mobile}</p>
                <p>GSTIN: {booking.consignor?.gstin || booking.customer?.gstin || '—'}</p>
              </div>
              <div className="p-3">
                <p className="mb-1 font-semibold text-emerald-800">Consignee (Deliver to)</p>
                <p className="font-medium">{booking.consignee?.name || '—'}</p>
                <p>{booking.consignee?.company}</p>
                <p>{booking.consignee?.address || booking.delivery?.address}</p>
                <p>{booking.consignee?.city || cityOf(booking.delivery)} {booking.consignee?.state}</p>
                <p>{booking.consignee?.mobile}</p>
                <p>GSTIN: {booking.consignee?.gstin || '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 border-b border-slate-300 text-xs">
              <div className="border-r border-slate-300 p-3"><p className="text-slate-500">Booking date</p><p className="font-medium">{fmt(booking.bookingDate)}</p></div>
              <div className="border-r border-slate-300 p-3"><p className="text-slate-500">Expected delivery</p><p className="font-medium">{fmt(booking.expectedDeliveryDate)}</p></div>
              <div className="border-r border-slate-300 p-3"><p className="text-slate-500">Vehicle</p><p className="font-medium">{booking.trip?.vehicle?.registrationNumber || 'To be assigned'}</p></div>
              <div className="p-3"><p className="text-slate-500">Driver</p><p className="font-medium">{booking.trip?.driver?.name || 'To be assigned'}</p></div>
            </div>
            <table className="w-full border-b border-slate-300 text-left text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2">Sr.</th>
                  <th className="p-2">Description of goods</th>
                  <th className="p-2">Packages & type</th>
                  <th className="p-2 text-right">Actual wt (kg)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-t border-slate-200">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{item.name} {item.hsn ? `· HSN ${item.hsn}` : ''}</td>
                    <td className="p-2">{item.quantity} {item.unit || ''} {packages[index]?.type || ''}</td>
                    <td className="p-2 text-right">{packages[index]?.weightKg || booking.cargo?.weightKg || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid grid-cols-2 text-xs">
              <div className="border-r border-slate-300 p-3">
                <p className="mb-1 font-semibold">Terms & special conditions</p>
                <ol className="list-decimal space-y-1 pl-4 text-slate-600">
                  <li>Goods booked solely at owner&apos;s risk.</li>
                  <li>Delivery will be made against surrender of original LR copy.</li>
                  <li>Shortage / damage must be endorsed on the delivery challan.</li>
                </ol>
                <p className="mt-3 font-semibold">Remarks / delivery notes</p>
                <p>{booking.notes || booking.remarks || '—'}</p>
              </div>
              <div className="p-3">
                <p className="mb-1 font-semibold">Freight & payment particulars</p>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Freight charges</span><span>{formatMoney(charges.freight)}</span></div>
                  <div className="flex justify-between"><span>Loading / unloading</span><span>{formatMoney((charges.loading || 0) + (charges.unloading || 0))}</span></div>
                  <div className="flex justify-between"><span>Taxable freight value</span><span>{formatMoney(charges.taxableAmount)}</span></div>
                  <div className="flex justify-between"><span>GST {charges.taxPercent || 0}%</span><span>{formatMoney(charges.taxAmount)}</span></div>
                  <div className="mt-2 flex justify-between bg-blue-900 px-2 py-1 font-semibold text-white">
                    <span>Net payable amount</span>
                    <span>{formatMoney(charges.total)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-slate-300 text-xs">
              <div className="border-r border-slate-300 p-3 min-h-20">Booking clerk / agent</div>
              <div className="border-r border-slate-300 p-3">Driver / carrier signature</div>
              <div className="p-3">Loader / dispatched by{(booking.loadingStaff || []).map((row) => row.staff?.name || '').filter(Boolean).join(', ') ? `: ${(booking.loadingStaff || []).map((row) => row.staff?.name).filter(Boolean).join(', ')}` : ''}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
