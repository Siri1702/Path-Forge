'use client'

import { calcProgress } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Lock, CheckCircle, Circle } from 'lucide-react'

interface Topic {
  id: string
  title: string
  completed: boolean
}

interface Phase {
  id: string
  phase_number: number
  topics: Topic[]
  is_unlocked: boolean
}

interface Props {
  phase: Phase
  isCurrentPhase: boolean
}

export function RoadmapPhaseCard({ phase, isCurrentPhase }: Props) {
  const topics: Topic[] = Array.isArray(phase.topics) ? phase.topics : []
  const completedCount = topics.filter(t => t.completed).length
  const progress = calcProgress(completedCount, topics.length)

  if (!phase.is_unlocked) {
    return (
      <div className="glass-card p-5 opacity-60 relative overflow-hidden">
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-xl">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Lock className="w-6 h-6" />
            <p className="text-xs font-medium">Locked</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-muted-foreground">
            {phase.phase_number}
          </div>
          <div>
            <h3 className="font-semibold">Phase {phase.phase_number}</h3>
            <p className="text-xs text-muted-foreground">{topics.length} topics</p>
          </div>
        </div>
        <div className="space-y-2">
          {topics.slice(0, 3).map(t => (
            <div key={t.id} className="h-3 bg-secondary rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`glass-card p-5 transition-all ${isCurrentPhase ? 'border-primary/40' : ''}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
            ${isCurrentPhase ? 'bg-primary text-white' : 'bg-secondary text-foreground'}`}>
            {phase.phase_number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Phase {phase.phase_number}</h3>
              {isCurrentPhase && (
                <span className="badge-pill text-xs text-primary bg-primary/10 border-primary/20">
                  Current
                </span>
              )}
              {progress === 100 && (
                <span className="badge-pill text-xs text-green-400 bg-green-400/10 border-green-400/20">
                  Complete ✓
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{completedCount}/{topics.length} topics done</p>
          </div>
        </div>
      </div>

      {topics.length > 0 && (
        <>
          <Progress value={progress} className="mb-4 h-1.5" />
          <div className="space-y-2">
            {topics.map(topic => (
              <div key={topic.id} className="flex items-center gap-3 py-1.5">
                {topic.completed
                  ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                }
                <span className={`text-sm ${topic.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {topic.title}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {topics.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Topics will be added by your mentor
        </p>
      )}
    </div>
  )
}
