import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useLoginMutation } from './authApi'
import { setCredentials } from './authSlice'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, getFieldErrors } from '../../lib/utils'
import { getPortalHome } from '../../lib/portal'
import { useBranding } from '../settings/BrandingProvider'

function canUsePath(user, path) {
  const type = user?.portalType || 'STAFF'
  if (type === 'DRIVER') return path.startsWith('/driver')
  if (type === 'CUSTOMER') return path.startsWith('/portal')
  return path.startsWith('/app')
}

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [login, { isLoading }] = useLoginMutation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@tms.local', password: 'Admin@12345' },
  })

  const onSubmit = async (values) => {
    try {
      const res = await login(values).unwrap()
      dispatch(
        setCredentials({
          user: res.data.user,
          permissions: res.data.permissions,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        })
      )
      toast.success('Welcome back')
      const home = getPortalHome(res.data.user)
      const intended = location.state?.from?.pathname
      const redirectTo =
        intended && intended !== '/login' && intended !== '/register' && canUsePath(res.data.user, intended)
          ? intended
          : home
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      Object.entries(fieldErrors).forEach(([field, message]) => setError(field, { message }))
      toast.error(getErrorMessage(err, 'Login failed'))
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access your transport operations workspace"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" loading={isLoading}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        Online customer?{' '}
        <Link to="/register" className="font-medium text-brand-700 hover:text-brand-800">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}

export function AuthLayout({ title, subtitle, children }) {
  const branding = useBranding()
  return (
    <div className="relative min-h-svh overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.22),_transparent_45%),radial-gradient(ellipse_at_bottom_left,_rgba(14,165,233,0.12),_transparent_40%)]" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative mx-auto flex min-h-svh max-w-6xl flex-col justify-center gap-10 px-4 py-10 lg:flex-row lg:items-center lg:gap-16">
        <div className="max-w-md text-white lg:flex-1">
          <div className="mb-6 flex items-center gap-3">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.companyName} className="h-11 w-11 rounded-xl object-contain bg-white p-1" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 font-display text-base font-bold text-ink-950">
                {branding.initials}
              </div>
            )}
            <div>
              <p className="font-display text-xl font-semibold tracking-tight">{branding.companyName}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-400">{branding.tagline}</p>
            </div>
          </div>
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Move freight with clarity and control.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-300 sm:text-base">
            Bookings, fleet, drivers, live tracking, invoices, and settlements — one operational system for logistics teams.
          </p>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 shadow-[var(--shadow-elevated)] sm:p-8">
          <h2 className="font-display text-xl font-semibold text-ink-900">{title}</h2>
          <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
