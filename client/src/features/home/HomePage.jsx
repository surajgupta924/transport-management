import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ClipboardList,
  FileText,
  MapPinned,
  Menu,
  Phone,
  Radio,
  Shield,
  Truck,
  Wallet,
  X,
  Mail,
  ArrowRight,
  CheckCircle2,
  Navigation,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useBranding } from '../settings/BrandingProvider'
import { selectIsAuthenticated, selectCurrentUser } from '../auth/authSlice'
import { getPortalHome } from '../../lib/portal'
import { cn } from '../../lib/utils'

const navItems = [
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#how', label: 'How it works' },
  { href: '#portals', label: 'Portals' },
  { href: '#contact', label: 'Contact' },
]

const services = [
  {
    icon: ClipboardList,
    title: 'Freight bookings',
    body: 'Customers request a trip with full pickup and delivery details. Email OTP confirms every online booking before it enters operations.',
  },
  {
    icon: Truck,
    title: 'Fleet & drivers',
    body: 'Assign vehicles and drivers, keep documents current, and release the fleet automatically when a trip is closed.',
  },
  {
    icon: Radio,
    title: 'Live GPS tracking',
    body: 'Watch driver location in real time. Mobile GPS is the fallback when vehicle GPS is off. Tracking stops after delivery for privacy.',
  },
  {
    icon: FileText,
    title: 'Billing & invoices',
    body: 'Admin creates and issues invoices against bookings. Customers view and pay from the portal.',
  },
  {
    icon: Wallet,
    title: 'Driver expenses',
    body: 'Drivers log toll, fuel, food, and parking with a receipt photo or PDF for admin approval.',
  },
  {
    icon: Shield,
    title: 'POD & trip closure',
    body: 'Proof of delivery, GPS geofence, and admin verification close the trip and free the vehicle.',
  },
]

const steps = [
  { n: '01', title: 'Share trip details', body: 'Origin, destination, cargo, contacts, and schedule — collected in full before a booking is accepted.' },
  { n: '02', title: 'Verify email OTP', body: 'A one-time code is sent to a real email. Only verified requests become bookings.' },
  { n: '03', title: 'Assign & move', body: 'Operations assigns a vehicle and driver. Live GPS follows the trip from pickup to delivery.' },
  { n: '04', title: 'Deliver & bill', body: 'POD is uploaded, admin verifies, tracking stops, and the invoice is issued.' },
]

const portals = [
  {
    title: 'Admin / operations',
    body: 'Bookings, fleet, live map, billing, expenses, settings, and branding — one console for the transport office.',
    to: '/login',
    cta: 'Staff login',
  },
  {
    title: 'Driver app',
    body: 'Active trip, Start Mobile GPS, book for a walk-in client, log expenses with receipts, and submit POD from the phone.',
    to: '/login',
    cta: 'Driver login',
  },
  {
    title: 'Customer portal',
    body: 'Register, verify email, book freight, track shipments, and pay invoices without calling the control room.',
    to: '/register',
    cta: 'Create account',
  },
]

export function HomePage() {
  const branding = useBranding()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const [menuOpen, setMenuOpen] = useState(false)
  const dashboard = getPortalHome(user)
  const supportEmail = branding.supportEmail || 'office@tms.local'
  const supportPhone = branding.supportPhone || '+91-9999999999'

  return (
    <div className="min-h-svh bg-ink-50 text-ink-800">
      <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-display text-sm font-bold text-ink-950">
                {branding.initials}
              </span>
            )}
            <span>
              <span className="block font-display text-sm font-semibold text-ink-900">{branding.companyName}</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-ink-400">{branding.tagline}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink-600 md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-ink-900">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <Link to={dashboard}>
                <Button>Open dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="secondary">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Book a trip</Button>
                </Link>
              </>
            )}
          </div>
          <button type="button" className="rounded-md p-2 text-ink-700 md:hidden" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-ink-100 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-3 text-sm font-medium">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="py-1 text-ink-700">
                  {item.label}
                </a>
              ))}
              {isAuthenticated ? (
                <Link to={dashboard} onClick={() => setMenuOpen(false)}>
                  <Button className="w-full">Open dashboard</Button>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link to="/login">
                    <Button variant="secondary" className="w-full">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button className="w-full">Register</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="top">
        <section className="relative overflow-hidden bg-ink-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.22),_transparent_45%),radial-gradient(ellipse_at_bottom_left,_rgba(14,165,233,0.12),_transparent_40%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">Transport management system</p>
              <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Move freight across India with one operations platform.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-300">
                {branding.companyName} runs bookings, fleet, live GPS, proof of delivery, billing, and driver expenses
                in a single ERP. Customers book online with email OTP. Drivers share live location and receipts.
                Admins control branding, invoices, and trip closure.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-ink-200">
                {[
                  'Complete pickup and delivery addresses, contacts, and cargo details',
                  'Real email OTP before an online booking is accepted',
                  'Live GPS on the map, with mobile fallback and privacy after delivery',
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <Link to={dashboard}>
                    <Button size="lg">Go to your workspace</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <Button size="lg">
                        Login
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button size="lg" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                        Customer register
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Online + offline bookings', value: 'One workflow' },
                { label: 'GPS refresh', value: 'Every 10–30s' },
                { label: 'Portals', value: 'Admin · Driver · Client' },
                { label: 'Documents', value: 'POD, LR, invoices' },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="font-display text-lg font-semibold">{card.value}</p>
                  <p className="mt-1 text-sm text-ink-400">{card.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">About</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink-900">A complete TMS for a working transport company</h2>
          <p className="mt-4 max-w-3xl text-ink-600">
            {branding.companyName} is built for Indian road freight: Ghazipur to Lucknow, Gonda to Gorakhpur, or any
            lane you run. Staff manage the office. Drivers work from a mobile-first app. Shippers and consignees use
            the customer portal. Branding (logo, favicon, company name) is controlled by admin in Settings, so the
            dashboard matches your company — not a generic template.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Fact title="Who we serve" body="Fleet owners, transport offices, contract drivers, and customers who need AWB-style tracking and invoices." />
            <Fact title="What we collect" body="Trip start and end points, contact names and phones, cargo, vehicle type, and a verified email for every online request." />
            <Fact title="How we close trips" body="GPS geofence, driver POD upload, admin verification, then tracking off and vehicle released." />
          </div>
        </section>

        <section id="services" className="border-y border-ink-200 bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Services</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink-900">Everything from booking to settlement</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <article key={s.title} className="rounded-2xl border border-ink-200 p-5 shadow-[var(--shadow-card)]">
                  <s.icon className="h-6 w-6 text-brand-600" />
                  <h3 className="mt-3 font-display text-lg font-semibold text-ink-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink-900">From request to closed trip</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((s) => (
              <article key={s.n} className="rounded-2xl border border-ink-200 bg-white p-5">
                <p className="font-display text-sm font-semibold text-brand-700">{s.n}</p>
                <h3 className="mt-2 font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-600">{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="portals" className="border-y border-ink-200 bg-ink-950 py-16 text-white">
          <div className="mx-auto max-w-6xl px-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">Access</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Login to the right workspace</h2>
            <p className="mt-3 max-w-2xl text-ink-300">
              Use the same Login page. Your account type opens Admin, Driver, or Customer automatically.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {portals.map((p) => (
                <article key={p.title} className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-300">{p.body}</p>
                  <Link to={isAuthenticated ? dashboard : p.to} className="mt-5">
                    <Button variant="secondary" className="w-full border-white/20 bg-white text-ink-900">
                      {isAuthenticated ? 'Open dashboard' : p.cta}
                    </Button>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-8 rounded-3xl border border-ink-200 bg-white p-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Contact</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink-900">Talk to operations</h2>
              <p className="mt-3 text-ink-600">
                For new contracts, tracking help, or billing questions, reach the control room. Admin can change this
                phone and email in Settings.
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <p className="flex items-center gap-2 text-ink-800">
                  <Phone className="h-4 w-4 text-brand-600" />
                  {supportPhone}
                </p>
                <p className="flex items-center gap-2 text-ink-800">
                  <Mail className="h-4 w-4 text-brand-600" />
                  {supportEmail}
                </p>
                {branding.gstin ? (
                  <p className="text-ink-500">GSTIN {branding.gstin}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-2xl bg-ink-50 p-6">
              <p className="font-display text-lg font-semibold text-ink-900">Ready to move a load?</p>
              <p className="mt-2 text-sm text-ink-600">
                Login if you already have an account. New shippers register, verify email OTP, and submit pickup and
                delivery in full.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/login">
                  <Button>
                    <Navigation className="h-4 w-4" />
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary">Register as customer</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {branding.companyName}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-ink-800">Login</Link>
            <Link to="/register" className="hover:text-ink-800">Register</Link>
            <a href="#services" className="hover:text-ink-800">Services</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Fact({ title, body }) {
  return (
    <div className={cn('rounded-2xl border border-ink-200 bg-white p-5')}>
      <MapPinned className="h-5 w-5 text-brand-600" />
      <h3 className="mt-3 font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm text-ink-600">{body}</p>
    </div>
  )
}
