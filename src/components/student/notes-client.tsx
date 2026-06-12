'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { formatRelativeIST } from '@/lib/utils'
import { Plus, Trash2, Save, FileText } from 'lucide-react'

interface Note {
  id: string
  student_id: string
  title: string
  content: string
  phase_tag?: number
  updated_at: string
  created_at: string
}

interface Props {
  initialNotes: Note[]
  studentId: string
}

export function NotesClient({ initialNotes, studentId }: Props) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const { toast } = useToast()
  const supabase = createClient()
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null)
  const pendingChanges = useRef(false)

  const selected = notes.find(n => n.id === selectedId) ?? null

  const updateNote = (field: keyof Note, value: string | number) => {
    if (!selectedId) return
    setNotes(prev =>
      prev.map(n => n.id === selectedId ? { ...n, [field]: value } : n)
    )
    pendingChanges.current = true
    scheduleAutosave()
  }

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      saveNote()
    }, 30_000)
  }, [selectedId])

  const saveNote = async () => {
    if (!selectedId || !pendingChanges.current) return
    setSaving(true)
    const note = notes.find(n => n.id === selectedId)
    if (!note) return

    const { error } = await supabase
      .from('notes')
      .update({
        title: note.title,
        content: note.content,
        phase_tag: note.phase_tag,
        updated_at: new Date().toISOString(),
      })
      .eq('id', note.id)

    setSaving(false)
    if (!error) {
      pendingChanges.current = false
      setLastSaved(new Date())
      setNotes(prev => prev.map(n =>
        n.id === selectedId ? { ...n, updated_at: new Date().toISOString() } : n
      ))
    }
  }

  const createNote = async () => {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        student_id: studentId,
        title: 'Untitled Note',
        content: '',
      })
      .select()
      .single()

    if (data) {
      setNotes(prev => [data, ...prev])
      setSelectedId(data.id)
    }
  }

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
    if (selectedId === id) {
      const remaining = notes.filter(n => n.id !== id)
      setSelectedId(remaining[0]?.id ?? null)
    }
    toast({ title: 'Note deleted' })
  }

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveNote()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedId, notes])

  // Cleanup timer
  useEffect(() => {
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
  }, [])

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
      {/* Sidebar */}
      <div className="w-64 flex flex-col gap-2 flex-shrink-0">
        <button onClick={createNote} className="btn-primary w-full">
          <Plus className="w-4 h-4" /> New Note
        </button>

        <div className="flex-1 overflow-y-auto space-y-1 mt-1">
          {notes.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No notes yet. Create one!</p>
            </div>
          ) : (
            notes.map(note => (
              <button
                key={note.id}
                onClick={() => {
                  saveNote()
                  setSelectedId(note.id)
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedId === note.id
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-border bg-card/40 hover:bg-secondary/50'
                }`}
              >
                <p className="text-sm font-medium truncate">{note.title || 'Untitled'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeIST(note.updated_at)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      {selected ? (
        <div className="flex-1 glass-card p-5 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <input
              value={selected.title}
              onChange={e => updateNote('title', e.target.value)}
              className="text-xl font-bold bg-transparent border-none outline-none flex-1 placeholder:text-muted-foreground/40"
              placeholder="Note title..."
            />
            <div className="flex items-center gap-2">
              {saving && (
                <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>
              )}
              {lastSaved && !saving && (
                <span className="text-xs text-muted-foreground">Saved</span>
              )}
              <button onClick={saveNote} className="btn-ghost text-xs" title="Save (Ctrl+S)">
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteNote(selected.id)}
                className="btn-ghost text-xs text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <select
            value={selected.phase_tag ?? ''}
            onChange={e => updateNote('phase_tag', e.target.value ? parseInt(e.target.value) : '')}
            className="input-field w-36 text-xs h-8"
          >
            <option value="">No phase</option>
            <option value="1">Phase 1</option>
            <option value="2">Phase 2</option>
            <option value="3">Phase 3</option>
            <option value="4">Phase 4</option>
          </select>

          <textarea
            value={selected.content}
            onChange={e => updateNote('content', e.target.value)}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-foreground/90 placeholder:text-muted-foreground/30"
            placeholder="Start writing your notes here...

Tips:
• Use Ctrl+S to save manually
• Notes autosave every 30 seconds
• Tag notes by phase to organize them"
          />
        </div>
      ) : (
        <div className="flex-1 glass-card flex flex-col items-center justify-center gap-3">
          <FileText className="w-12 h-12 text-muted-foreground/20" />
          <p className="text-muted-foreground text-sm">Select a note or create a new one</p>
          <button onClick={createNote} className="btn-primary mt-2">
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>
      )}
    </div>
  )
}
