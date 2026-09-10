import { createContext, useContext, useEffect, useMemo } from 'react'
import { useGetPublicSettingsQuery } from './settingsApi'
import { mediaUrl } from '../../lib/utils'

const BrandingContext = createContext({
  companyName: 'SwiftHaul',
  tagline: 'Transport Management ERP',
  logoUrl: '',
  faviconUrl: '',
  supportEmail: '',
  supportPhone: '',
  gstin: '',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  initials: 'SH',
})

function applyFavicon(href) {
  const url = href || '/favicon.svg'
  let link = document.querySelector("link[rel='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = url
}

export function BrandingProvider({ children }) {
  const { data } = useGetPublicSettingsQuery()
  const branding = useMemo(() => {
    const raw = data?.data || {}
    const companyName = raw.companyName || 'SwiftHaul'
    return {
      companyName,
      tagline: raw.tagline || 'Transport Management ERP',
      logoUrl: mediaUrl(raw.logoUrl),
      faviconUrl: mediaUrl(raw.faviconUrl),
      supportEmail: raw.supportEmail || '',
      supportPhone: raw.supportPhone || '',
      gstin: raw.gstin || '',
      pan: raw.pan || '',
      currency: raw.currency || 'INR',
      timezone: raw.timezone || 'Asia/Kolkata',
      address: raw.address || '',
      city: raw.city || '',
      state: raw.state || '',
      pincode: raw.pincode || '',
      bankName: raw.bankName || '',
      bankAccount: raw.bankAccount || '',
      ifsc: raw.ifsc || '',
      paymentTerms: raw.paymentTerms || '',
      initials: companyName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('') || 'SH',
    }
  }, [data])

  useEffect(() => {
    document.title = `${branding.companyName} TMS`
    applyFavicon(branding.faviconUrl)
  }, [branding.companyName, branding.faviconUrl])

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>
}

export function useBranding() {
  return useContext(BrandingContext)
}
