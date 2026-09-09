import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useRegisterMutation } from './authApi'
import { setCredentials } from './authSlice'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, getFieldErrors } from '../../lib/utils'
import { getPortalHome } from '../../lib/portal'
import { AuthLayout } from './LoginPage'

const schema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    mobile: z
      .string()
      .regex(/^[0-9+\-\s]{8,15}$/, 'Enter a valid mobile number')
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const [registerUser, { isLoading }] = useRegisterMutation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', mobile: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values) => {
    try {
      const { confirmPassword, ...payload } = values
      const res = await registerUser({ ...payload, portalType: 'CUSTOMER' }).unwrap()
      dispatch(
        setCredentials({
          user: res.data.user,
          permissions: res.data.permissions,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        })
      )
      toast.success('Account created')
      navigate(getPortalHome(res.data.user), { replace: true })
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      Object.entries(fieldErrors).forEach(([field, message]) => setError(field, { message }))
      toast.error(getErrorMessage(err, 'Registration failed'))
    }
  }

  return (
    <AuthLayout title="Create customer account" subtitle="Book and track shipments online">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Full name" required error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
        <Input label="Mobile" error={errors.mobile?.message} {...register('mobile')} />
        <Input
          label="Password"
          type="password"
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" className="w-full" loading={isLoading}>
          Register
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-ink-500">
        <Link to="/" className="font-medium text-ink-700 hover:text-ink-900">
          Back to home
        </Link>
      </p>
    </AuthLayout>
  )
}
