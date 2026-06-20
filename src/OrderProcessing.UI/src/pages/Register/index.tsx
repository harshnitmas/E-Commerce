import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Lock, Mail, UserCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

type FieldProps = {
  label: string
  icon: React.ReactNode
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete?: string
  rightSlot?: React.ReactNode
  autoFocus?: boolean
  hasError?: boolean
  hint?: string
}

function Field({ label, icon, type = 'text', value, onChange, placeholder, autoComplete, rightSlot, autoFocus, hasError, hint }: FieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
      <div className="relative">
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${hasError ? 'text-red-400' : 'text-gray-400'}`}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${
            hasError
              ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10'
          }`}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
      {hint && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{hint}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUsernameError('')
    if (!displayName.trim() || !username.trim() || !email.trim() || !password) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const result = await register(displayName.trim(), username.trim(), email.trim(), password)
    setLoading(false)
    if (!result.success) {
      const msg = result.error ?? 'Registration failed'
      // Surface username-taken errors directly on the username field
      if (msg.toLowerCase().includes('username') || msg.toLowerCase().includes('taken')) {
        setUsernameError(msg)
      } else {
        setError(msg)
      }
      return
    }
    navigate('/')
  }

  const togglePass = (
    <button type="button" onClick={() => setShowPass((v) => !v)} className="text-gray-400 hover:text-gray-600">
      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )

  const toggleConfirm = (
    <button type="button" onClick={() => setShowConfirm((v) => !v)} className="text-gray-400 hover:text-gray-600">
      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary">ShopNow</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-4">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join us and start shopping today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Full Name"
              icon={<UserCircle className="h-4 w-4" />}
              value={displayName}
              onChange={setDisplayName}
              placeholder="e.g. Harsh Kumar"
              autoComplete="name"
              autoFocus
            />
            <Field
              label="Username"
              icon={<User className="h-4 w-4" />}
              value={username}
              onChange={(v) => { setUsername(v); setUsernameError('') }}
              placeholder="Choose a username"
              autoComplete="username"
              hasError={!!usernameError}
              hint={usernameError || undefined}
            />
            <Field
              label="Email"
              icon={<Mail className="h-4 w-4" />}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Field
              label="Password"
              icon={<Lock className="h-4 w-4" />}
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="At least 4 characters"
              autoComplete="new-password"
              rightSlot={togglePass}
            />
            <Field
              label="Confirm Password"
              icon={<Lock className="h-4 w-4" />}
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat your password"
              autoComplete="new-password"
              rightSlot={toggleConfirm}
            />

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold text-sm hover:bg-orange-600 transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
