'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Zap, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type LoginForm = z.infer<typeof loginSchema>

function isMisconfigured() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  if (isMisconfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-6">
        <div className="glass-card p-8 max-w-md w-full space-y-4 border-red-500/30">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <h2 className="font-bold text-lg">Configuration Error</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Supabase environment variables are missing.
          </p>
          <div className="bg-secondary rounded-lg p-4 space-y-1 font-mono text-xs text-red-300">
            {!process.env.NEXT_PUBLIC_SUPABASE_URL && <p>✗ NEXT_PUBLIC_SUPABASE_URL</p>}
            {!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && <p>✗ NEXT_PUBLIC_SUPABASE_ANON_KEY</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            Add these in Vercel → Project → Settings → Environment Variables, then redeploy.
          </p>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setErrorDetail(null)

    try {
      const supabase = createClient()

      // Step 1: Sign in
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        // Surface the exact Supabase error — never hide it
        setErrorDetail(`Auth error: ${signInError.message} (status ${signInError.status ?? 'unknown'})`)
        toast({
          title: 'Login failed',
          description: signInError.message,
          variant: 'destructive',
        })
        return
      }

      if (!authData?.user) {
        setErrorDetail('signInWithPassword returned no user and no error. Check Supabase project status.')
        toast({ title: 'Login failed', description: 'No user returned.', variant: 'destructive' })
        return
      }

      const userId = authData.user.id

      // Step 2: Try metadata role first (fast, no DB call)
      const metaRole = authData.user.user_metadata?.role as string | undefined

      if (metaRole === 'mentor') {
        router.push('/dashboard/mentor')
        return
      }
      if (metaRole === 'student') {
        router.push('/dashboard/student')
        return
      }

      // Step 3: No metadata — query profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('user_id', userId)
        .single()

      if (profileError) {
        // This is the most common cause of "unexpected error" for manually-created accounts
        setErrorDetail(
          `Profile lookup failed: ${profileError.message} (code: ${profileError.code})\n` +
          `user_id queried: ${userId}\n` +
          `Hint: Run the SQL in the fix instructions to create the profiles row.`
        )
        toast({
          title: 'Profile not found',
          description: 'Your account exists but has no profile row. See the fix instructions below.',
          variant: 'destructive',
        })
        setShowDebug(true)
        return
      }

      if (!profile?.role) {
        setErrorDetail(`Profile row found but role is empty. user_id: ${userId}`)
        toast({ title: 'Role not set', description: 'Profile exists but has no role assigned.', variant: 'destructive' })
        setShowDebug(true)
        return
      }

      if (profile.role === 'mentor') {
        router.push('/dashboard/mentor')
      } else {
        router.push('/dashboard/student')
      }

    } catch (err: any) {
      // Now we log the REAL error, not hide it
      const msg = err?.message ?? String(err)
      setErrorDetail(`Uncaught exception: ${msg}`)
      toast({
        title: 'Unexpected error',
        description: msg,
        variant: 'destructive',
      })
      setShowDebug(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-[#0F172A] via-[#1e1b4b] to-[#312e81] p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Pathforge</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Data Science Mentorship
            </p>
            <h1 className="text-5xl font-bold text-white leading-tight">
              Forge your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                data career.
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Track your roadmap, complete tasks, and grow under structured mentorship.
            </p>
          </div>
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-2">
              {['ML','DS','DA'].map((t,i) => (
                <div key={t}
                  className="w-9 h-9 rounded-full border-2 border-[#1e1b4b] flex items-center justify-center text-xs font-bold"
                  style={{ background: ['#6366f1','#8b5cf6','#a78bfa'][i], zIndex: 3-i }}>
                  {t}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400">
              Tracking <span className="text-white font-semibold">30+</span> learning paths
            </p>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-xs text-slate-600">© 2024 Pathforge. All rights reserved.</p>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0F172A]">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">Pathforge</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Email address</label>
              <input
                id="email" type="email" autoComplete="email"
                className="input-field" placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <input
                id="password" type="password" autoComplete="current-password"
                className="input-field" placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" className="btn-primary w-full h-11" disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : 'Sign in'
              }
            </button>
          </form>

          {/* Debug panel — shows exact error when something goes wrong */}
          {errorDetail && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 overflow-hidden">
              <button
                onClick={() => setShowDebug(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-red-400 hover:bg-red-950/30 transition-colors"
              >
                <span className="font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Error details
                </span>
                {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showDebug && (
                <div className="px-4 pb-4 space-y-3">
                  <pre className="text-xs text-red-300 whitespace-pre-wrap break-all bg-black/30 rounded-lg p-3 font-mono">
                    {errorDetail}
                  </pre>
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground">Quick fixes:</p>
                    <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                      <li>
                        <strong>Profile missing?</strong> Run this in Supabase SQL Editor:
                        <pre className="mt-1 bg-black/30 rounded p-2 text-[11px] text-slate-300 overflow-x-auto">{`INSERT INTO profiles (user_id, name, email, role)
SELECT id, split_part(email,'@',1), email, 'mentor'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id) DO UPDATE SET role = 'mentor';`}</pre>
                      </li>
                      <li>
                        <strong>Wrong password?</strong> Use Supabase Auth → Users → Send password reset.
                      </li>
                      <li>
                        <strong>Email not confirmed?</strong> Supabase Auth → Users → find user → confirm manually.
                      </li>
                      <li>
                        <strong>RLS blocking profiles?</strong> Check that <code>supabase-schema.sql</code> was fully executed.
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            New students receive an invite link from their mentor.<br />
            Contact your mentor if you need access.
          </p>
        </div>
      </div>
    </div>
  )
}
