'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, AlertCircle, Eye, EyeOff, User, CheckCircle, UserPlus, LogIn } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')

  // Login fields
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Signup extra fields
  const [nombre, setNombre]             = useState('')
  const [confirmPass, setConfirmPass]   = useState('')
  const [showConfirm, setShowConfirm]   = useState(false)

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const demoMode = !isSupabaseConfigured()

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (demoMode) {
      setTimeout(() => router.push('/'), 800)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      const msg = authError.message.includes('Email not confirmed')
        ? 'Debes confirmar tu correo antes de ingresar. Revisa tu bandeja de entrada.'
        : authError.message.includes('Invalid login credentials')
        ? 'Correo o contraseña incorrectos.'
        : `Error: ${authError.message}`
      setError(msg)
      setLoading(false)
      return
    }

    // Refresh primero para que el servidor reconozca la cookie de sesión,
    // luego navegar al dashboard
    router.refresh()
    router.push('/')
  }

  // ── Signup ─────────────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPass) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    if (demoMode) {
      setSuccess('Cuenta creada (modo demo). Ahora puedes iniciar sesión.')
      setMode('login')
      setLoading(false)
      return
    }

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre: nombre || email.split('@')[0] },
      },
    })

    setLoading(false)

    if (signupError) {
      const msg = signupError.message.includes('User already registered')
        ? 'Ya existe una cuenta con ese correo.'
        : `Error al crear cuenta: ${signupError.message}`
      setError(msg)
      return
    }

    // Registro exitoso
    setSuccess(
      '✅ Cuenta creada. Si la confirmación de correo está activada en Supabase, revisa tu bandeja de entrada. De lo contrario, ya puedes iniciar sesión.'
    )
    setMode('login')
    setEmail(email)
    setPassword('')
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPass('')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900" />

      <div className="relative w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">

          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">CIDFAE</h1>
            <p className="text-slate-400 text-sm mt-1">Gestión de proyectos</p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-lg overflow-hidden border border-slate-600 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
                mode === 'login'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
              )}
            >
              <LogIn size={15} />
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
                mode === 'signup'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
              )}
            >
              <UserPlus size={15} />
              Crear cuenta
            </button>
          </div>

          {/* Demo mode notice */}
          {demoMode && (
            <div className="mb-5 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-amber-300 text-xs">
              <strong>Modo demostración</strong> — Supabase no configurado. Ingresa cualquier credencial para continuar.
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-5 flex items-start gap-2 p-3 bg-emerald-900/30 border border-emerald-700/50 rounded-lg text-emerald-300 text-sm">
              <CheckCircle size={15} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@fae.mil.ec"
                    required={!demoMode}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required={!demoMode}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className={cn(
                  'w-full py-2.5 rounded-lg text-sm font-semibold transition-all',
                  loading ? 'bg-blue-600/50 text-blue-300 cursor-wait'
                           : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                )}>
                {loading ? 'Iniciando sesión...' : 'Ingresar al sistema'}
              </button>
            </form>
          )}

          {/* ── SIGNUP FORM ── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nombre completo
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Ej: Carlos Rodríguez"
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@fae.mil.ec"
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Contraseña <span className="text-slate-500 font-normal">(mín. 6 caracteres)</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={cn(
                      'w-full pl-9 pr-10 py-2.5 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent text-sm',
                      confirmPass && confirmPass !== password
                        ? 'border-red-500 focus:ring-red-500'
                        : confirmPass && confirmPass === password
                        ? 'border-emerald-500 focus:ring-emerald-500'
                        : 'border-slate-600 focus:ring-blue-500'
                    )}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="p-3 bg-blue-900/20 border border-blue-800/40 rounded-lg text-blue-300 text-xs">
                💡 Las nuevas cuentas se crean con rol <strong>Técnico</strong>. Un administrador puede cambiar el rol desde Configuración.
              </div>

              <button type="submit" disabled={loading}
                className={cn(
                  'w-full py-2.5 rounded-lg text-sm font-semibold transition-all',
                  loading ? 'bg-blue-600/50 text-blue-300 cursor-wait'
                           : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                )}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <p className="text-xs text-slate-500">
              Centro de Investigación y Desarrollo de la FAE
              <br />
              Acceso restringido al personal autorizado
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
