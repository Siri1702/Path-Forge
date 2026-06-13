'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Zap, AlertTriangle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type LoginForm = z.infer<typeof loginSchema>

// Detect missing env vars at render time and show a clear error
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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Show configuration error instead of a cryptic "invalid URL" crash
  if (isMisconfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-6">
        <div className="glass-card p-8 max-w-md w-full space-y-4 border-red-500/30">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <h2 className="font-bold text-lg">Configuration Error</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Supabase environment variables are missing. The app cannot connect to the database.
          </p>
          <div className="bg-secondary rounded-lg p-4 space-y-2 font-mono text-xs text-red-300">
            {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
              <p>✗ NEXT_PUBLIC_SUPABASE_URL — not set</p>
            )}
            {!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && (
              <p>✗ NEXT_PUBLIC_SUPABASE_ANON_KEY — not set</p>
            )}
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">To fix this:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
              <li>Go to <strong>Vercel → Your Project → Settings → Environment Variables</strong></li>
              <li>Add both variables from your Supabase project's API settings</li>
              <li>Click <strong>Redeploy</strong> (without clearing build cache)</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      // Safe to create client here — env vars are confirmed present above
      const supabase = createClient()

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast({
          title: 'Login failed',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      // Use user_metadata.role first (set during invite or manual update)
      // Falls back to a DB check for manually-created accounts (first mentor)
      const metaRole = authData.user?.user_metadata?.role as string | undefined

      if (metaRole === 'mentor') {
        router.push('/dashboard/mentor')
        return
      }
      if (metaRole === 'student') {
        router.push('/dashboard/student')
        return
      }

      // No metadata — check the profiles table (manually-created mentor case)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', authData.user!.id)
        .single()

      if (profile?.role === 'mentor') {
        router.push('/dashboard/mentor')
      } else {
        router.push('/dashboard/student')
      }
    } catch (err) {
      toast({
        title: 'Unexpected error',
        description: 'Please try again. If the problem persists, check your Supabase configuration.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding panel */}
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
              Forge your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                data career.
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Track your roadmap, complete tasks, and grow under structured mentorship — all in one place.
            </p>
          </div>
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-2">
              {['ML', 'DS', 'DA'].map((t, i) => (
                <div
                  key={t}
                  className="w-9 h-9 rounded-full border-2 border-[#1e1b4b] flex items-center justify-center text-xs font-bold"
                  style={{ background: ['#6366f1','#8b5cf6','#a78bfa'][i], zIndex: 3 - i }}
                >
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
            <p className="mt-2 text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input-field"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary w-full h-11"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            New students receive an invite link from their mentor.
            <br />
            Contact your mentor if you need access.
          </p>
        </div>
      </div>
    </div>
  )
}
