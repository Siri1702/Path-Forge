'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'
import { calcProgress } from '@/lib/utils'
import {
  Lock, LockOpen, Plus, Trash2, CheckCircle,
  Circle, GripVertical, Save, Loader2, Map,
} from 'lucide-react'

interface Topic {
  id: string
  title: string
  completed: boolean
}

interface Phase {
  id: string
  student_id: string
  phase_number: number
  topics: Topic[]
  is_unlocked: boolean
}

interface Props {
  studentId: string
  mentorId: string
  initialPhases: Phase[]
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

export function RoadmapManager({ studentId, mentorId, initialPhases }: Props) {
  const [phases, setPhases] = useState<Phase[]>(initialPhases)
  const [saving, setSaving] = useState<string | null>(null)
  const [addingPhase, setAddingPhase] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // ── Save a single phase to DB ──────────────────────────────────
  const savePhase = async (phase: Phase) => {
    setSaving(phase.id)
    try {
      const { error } = await supabase
        .from('roadmap_phases')
        .upsert({
          id: phase.id.startsWith('new-') ? undefined : phase.id,
          student_id: studentId,
          phase_number: phase.phase_number,
          topics: phase.topics,
          is_unlocked: phase.is_unlocked,
          created_by: mentorId,
        }, { onConflict: 'student_id,phase_number' })

      if (error) {
        toast({ title: 'Save failed', description: error.message, variant: 'destructive' })
      } else {
        toast({ title: `Phase ${phase.phase_number} saved!` })
        router.refresh()
      }
    } finally {
      setSaving(null)
    }
  }

  // ── Toggle lock/unlock ─────────────────────────────────────────
  const toggleLock = async (phaseId: string) => {
    const phase = phases.find(p => p.id === phaseId)!
    const updated = { ...phase, is_unlocked: !phase.is_unlocked }
    setPhases(prev => prev.map(p => p.id === phaseId ? updated : p))
    await savePhase(updated)
  }

  // ── Add new topic to a phase ───────────────────────────────────
  const addTopic = (phaseId: string) => {
    setPhases(prev => prev.map(p =>
      p.id === phaseId
        ? { ...p, topics: [...p.topics, { id: generateId(), title: '', completed: false }] }
        : p
    ))
  }

  // ── Update topic title ─────────────────────────────────────────
  const updateTopicTitle = (phaseId: string, topicId: string, title: string) => {
    setPhases(prev => prev.map(p =>
      p.id === phaseId
        ? { ...p, topics: p.topics.map(t => t.id === topicId ? { ...t, title } : t) }
        : p
    ))
  }

  // ── Toggle topic completed ─────────────────────────────────────
  const toggleTopic = (phaseId: string, topicId: string) => {
    setPhases(prev => prev.map(p =>
      p.id === phaseId
        ? { ...p, topics: p.topics.map(t => t.id === topicId ? { ...t, completed: !t.completed } : t) }
        : p
    ))
  }

  // ── Delete topic ───────────────────────────────────────────────
  const deleteTopic = (phaseId: string, topicId: string) => {
    setPhases(prev => prev.map(p =>
      p.id === phaseId
        ? { ...p, topics: p.topics.filter(t => t.id !== topicId) }
        : p
    ))
  }

  // ── Delete entire phase ────────────────────────────────────────
  const deletePhase = async (phase: Phase) => {
    if (!confirm(`Delete Phase ${phase.phase_number} and all its topics? This cannot be undone.`)) return

    if (!phase.id.startsWith('new-')) {
      const { error } = await supabase
        .from('roadmap_phases')
        .delete()
        .eq('id', phase.id)

      if (error) {
        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
        return
      }
    }

    setPhases(prev => prev.filter(p => p.id !== phase.id))
    toast({ title: `Phase ${phase.phase_number} deleted` })
    router.refresh()
  }

  // ── Add new phase ──────────────────────────────────────────────
  const addPhase = async () => {
    const existingNums = phases.map(p => p.phase_number)
    const nextNum = Math.max(0, ...existingNums) + 1
    if (nextNum > 4) {
      toast({ title: 'Maximum 4 phases supported', variant: 'destructive' })
      return
    }

    setAddingPhase(true)
    const tempId = `new-${generateId()}`
    const newPhase: Phase = {
      id: tempId,
      student_id: studentId,
      phase_number: nextNum,
      topics: [],
      is_unlocked: nextNum === 1,
    }

    // Save immediately to get a real DB id
    const { data, error } = await supabase
      .from('roadmap_phases')
      .insert({
        student_id: studentId,
        phase_number: nextNum,
        topics: [],
        is_unlocked: nextNum === 1,
        created_by: mentorId,
      })
      .select()
      .single()

    setAddingPhase(false)

    if (error) {
      toast({ title: 'Failed to add phase', description: error.message, variant: 'destructive' })
      return
    }

    setPhases(prev => [...prev, { ...newPhase, id: data.id }])
    toast({ title: `Phase ${nextNum} added!` })
  }

  if (phases.length === 0) {
    return (
      <div className="glass-card p-12 text-center space-y-4">
        <Map className="w-12 h-12 text-muted-foreground/30 mx-auto" />
        <div>
          <h3 className="font-semibold text-lg mb-1">No roadmap yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add phases and topics to build this student's learning roadmap.
          </p>
        </div>
        <button onClick={addPhase} disabled={addingPhase} className="btn-primary">
          {addingPhase
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            : <><Plus className="w-4 h-4" /> Add Phase 1</>
          }
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {phases
        .sort((a, b) => a.phase_number - b.phase_number)
        .map(phase => {
          const completed = phase.topics.filter(t => t.completed).length
          const progress = calcProgress(completed, phase.topics.length)
          const isSaving = saving === phase.id

          return (
            <div
              key={phase.id}
              className={`glass-card p-5 transition-all ${
                phase.is_unlocked ? 'border-border' : 'opacity-80 border-dashed'
              }`}
            >
              {/* Phase header */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    phase.is_unlocked ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {phase.phase_number}
                  </div>
                  <div>
                    <p className="font-semibold">Phase {phase.phase_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {completed}/{phase.topics.length} topics complete
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Lock / Unlock toggle */}
                  <button
                    onClick={() => toggleLock(phase.id)}
                    disabled={!!saving}
                    title={phase.is_unlocked ? 'Click to lock this phase' : 'Click to unlock this phase'}
                    className={`btn-ghost text-xs gap-1.5 ${
                      phase.is_unlocked ? 'text-green-400 hover:text-green-300' : 'text-muted-foreground'
                    }`}
                  >
                    {phase.is_unlocked
                      ? <><LockOpen className="w-3.5 h-3.5" /> Unlocked</>
                      : <><Lock className="w-3.5 h-3.5" /> Locked</>
                    }
                  </button>

                  {/* Save phase */}
                  <button
                    onClick={() => savePhase(phase)}
                    disabled={!!saving}
                    className="btn-ghost text-xs"
                    title="Save changes to this phase"
                  >
                    {isSaving
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <><Save className="w-3.5 h-3.5" /> Save</>
                    }
                  </button>

                  {/* Delete phase */}
                  <button
                    onClick={() => deletePhase(phase)}
                    className="btn-ghost text-xs text-red-400 hover:text-red-300"
                    title="Delete this phase"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {phase.topics.length > 0 && (
                <div className="mb-4">
                  <Progress value={progress} className="h-1.5" />
                </div>
              )}

              {/* Topics list */}
              <div className="space-y-2 mb-3">
                {phase.topics.map((topic) => (
                  <div key={topic.id} className="flex items-center gap-2 group">
                    {/* Completed toggle */}
                    <button
                      onClick={() => toggleTopic(phase.id, topic.id)}
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      title={topic.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {topic.completed
                        ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <Circle className="w-4 h-4" />
                      }
                    </button>

                    {/* Topic title input */}
                    <input
                      value={topic.title}
                      onChange={e => updateTopicTitle(phase.id, topic.id, e.target.value)}
                      placeholder="Topic name..."
                      className={`flex-1 bg-transparent border-none outline-none text-sm py-1
                        border-b border-transparent focus:border-primary/40 transition-colors
                        placeholder:text-muted-foreground/40
                        ${topic.completed ? 'line-through text-muted-foreground' : ''}
                      `}
                    />

                    {/* Delete topic */}
                    <button
                      onClick={() => deleteTopic(phase.id, topic.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add topic */}
              <button
                onClick={() => addTopic(phase.id)}
                className="btn-ghost text-xs text-muted-foreground w-full justify-start mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add topic
              </button>
            </div>
          )
        })}

      {/* Add next phase */}
      {phases.length < 4 && (
        <button
          onClick={addPhase}
          disabled={addingPhase}
          className="btn-secondary w-full"
        >
          {addingPhase
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
            : <><Plus className="w-4 h-4" /> Add Phase {Math.max(0, ...phases.map(p => p.phase_number)) + 1}</>
          }
        </button>
      )}
    </div>
  )
}
