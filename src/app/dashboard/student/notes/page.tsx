import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotesClient } from '@/components/student/notes-client'

export default async function StudentNotesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('user_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('student_id', profile.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Notes</h1>
          <p className="text-muted-foreground mt-1">Personal notes · Autosaved every 30s</p>
        </div>
      </div>
      <NotesClient initialNotes={notes ?? []} studentId={profile.id} />
    </div>
  )
}
