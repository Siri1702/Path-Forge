'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Send } from 'lucide-react'

const TOPIC_TAGS = [
  'Python', 'Statistics', 'Machine Learning', 'Deep Learning', 'SQL',
  'Data Wrangling', 'Visualization', 'Career', 'Project', 'Other'
]

const schema = z.object({
  question: z.string().min(10, 'Please describe your doubt (min 10 chars)'),
  topic_tag: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function AskDoubtForm({ studentId }: { studentId: string }) {
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const selectedTag = watch('topic_tag')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      // Get mentor profile to notify them
      const { data: mentor } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'mentor')
        .single()

      const { error } = await supabase.from('doubts').insert({
        student_id: studentId,
        question: data.question,
        topic_tag: data.topic_tag || null,
        status: 'open',
      })

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        return
      }

      // Notify mentor
      if (mentor) {
        await supabase.from('notifications').insert({
          user_id: mentor.id,
          type: 'new_doubt',
          message: `New doubt submitted${data.topic_tag ? ` about ${data.topic_tag}` : ''}`,
          link: '/dashboard/mentor/doubts',
        })
      }

      toast({ title: 'Doubt submitted!', description: "Your mentor will reply soon." })
      reset()
      setExpanded(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="glass-card w-full p-4 text-left hover:border-primary/40 transition-all group"
      >
        <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground">
          <Send className="w-4 h-4 text-primary" />
          <span className="text-sm">Ask your mentor a question...</span>
        </div>
      </button>
    )
  }

  return (
    <div className="glass-card p-5 border-primary/30">
      <p className="font-semibold text-sm mb-4">Ask a doubt</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Your Question *</label>
          <textarea
            className="input-field h-24 resize-none"
            placeholder="Describe your doubt in detail..."
            autoFocus
            {...register('question')}
          />
          {errors.question && <p className="text-xs text-red-400">{errors.question.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Topic (optional)</label>
          <div className="flex flex-wrap gap-2">
            {TOPIC_TAGS.map(tag => (
              <button
                type="button"
                key={tag}
                onClick={() => setValue('topic_tag', selectedTag === tag ? '' : tag)}
                className={`badge-pill cursor-pointer transition-all ${
                  selectedTag === tag
                    ? 'text-primary bg-primary/20 border-primary/40'
                    : 'text-slate-400 bg-slate-400/10 border-slate-400/20 hover:border-slate-400/40'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary" onClick={() => setExpanded(false)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting</>
              : <><Send className="w-3.5 h-3.5" /> Submit</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
