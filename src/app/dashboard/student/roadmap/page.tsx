import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoadmapPhaseCard } from '@/components/student/roadmap-phase-card'
import { Map, Lock } from 'lucide-react'

export default async function StudentRoadmapPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('id, current_phase, track').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: phases } = await supabase
    .from('roadmap_phases')
    .select('*')
    .eq('student_id', profile.id)
    .order('phase_number')

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Roadmap</h1>
          <p className="text-muted-foreground mt-1">
            Currently on Phase {profile.current_phase ?? 1}
          </p>
        </div>
      </div>

      {!phases?.length ? (
        <div className="glass-card p-16 text-center">
          <Map className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Roadmap not set up yet</h3>
          <p className="text-sm text-muted-foreground">
            Your mentor will configure your learning roadmap soon.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress connector */}
          <div className="relative">
            {phases.map((phase, idx) => (
              <div key={phase.id} className="relative">
                {idx < phases.length - 1 && (
                  <div className={`absolute left-6 top-full w-0.5 h-6 z-0 ${
                    phase.is_unlocked ? 'bg-primary/40' : 'bg-border'
                  }`} />
                )}
                <RoadmapPhaseCard
                  phase={phase}
                  isCurrentPhase={phase.phase_number === (profile.current_phase ?? 1)}
                />
                {idx < phases.length - 1 && <div className="h-6" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
