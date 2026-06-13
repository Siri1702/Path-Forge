-- ================================================================
-- PATHFORGE — Supabase Schema + RLS Policies
-- Run this entire file in your Supabase SQL editor
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- PROFILES
-- ================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
  track TEXT CHECK (track IN ('ML Engineer', 'Data Scientist', 'Data Analyst')),
  current_phase INTEGER DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 4),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TASKS
-- ================================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  phase_tag INTEGER CHECK (phase_tag BETWEEN 1 AND 4),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TASK PROGRESS
-- ================================================================
CREATE TABLE public.task_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'inprogress', 'done')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, student_id)
);

-- ================================================================
-- RESOURCES
-- ================================================================
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Video', 'Article', 'Project', 'Practice')),
  phase_tag INTEGER CHECK (phase_tag BETWEEN 1 AND 4),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- RESOURCE PROGRESS
-- ================================================================
CREATE TABLE public.resource_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(resource_id, student_id)
);

-- ================================================================
-- NOTES
-- ================================================================
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Untitled Note',
  content TEXT DEFAULT '',
  phase_tag INTEGER CHECK (phase_tag BETWEEN 1 AND 4),
  week_tag TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- DOUBTS
-- ================================================================
CREATE TABLE public.doubts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  topic_tag TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered')),
  mentor_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  replied_at TIMESTAMPTZ
);

-- ================================================================
-- PAYMENTS
-- ================================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ANNOUNCEMENTS
-- ================================================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- NOTIFICATIONS
-- ================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ROADMAP PHASES
-- ================================================================
CREATE TABLE public.roadmap_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  phase_number INTEGER NOT NULL CHECK (phase_number BETWEEN 1 AND 4),
  topics JSONB DEFAULT '[]',
  is_unlocked BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(student_id, phase_number)
);

-- ================================================================
-- ENABLE ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_phases ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- HELPER FUNCTION — check if current user is mentor
-- ================================================================
CREATE OR REPLACE FUNCTION public.is_mentor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'mentor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ================================================================
-- HELPER FUNCTION — get profile id from auth uid
-- ================================================================
CREATE OR REPLACE FUNCTION public.my_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ================================================================
-- RLS POLICIES — PROFILES
-- ================================================================
-- NOTE: We do NOT use is_mentor() here to avoid circular RLS evaluation.
-- The profiles policy must be self-contained.
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.user_id = auth.uid() AND p.role = 'mentor'::text
    )
  );

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.user_id = auth.uid() AND p.role = 'mentor'::text
    )
  );

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.user_id = auth.uid() AND p.role = 'mentor'::text
    )
  );

-- ================================================================
-- RLS POLICIES — TASKS
-- ================================================================
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    public.is_mentor() OR assigned_to = public.my_profile_id()
  );

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (public.is_mentor());

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (public.is_mentor());

CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (public.is_mentor());

-- ================================================================
-- RLS POLICIES — TASK PROGRESS
-- ================================================================
CREATE POLICY "task_progress_select" ON public.task_progress
  FOR SELECT USING (
    public.is_mentor() OR student_id = public.my_profile_id()
  );

CREATE POLICY "task_progress_insert" ON public.task_progress
  FOR INSERT WITH CHECK (
    public.is_mentor() OR student_id = public.my_profile_id()
  );

CREATE POLICY "task_progress_update" ON public.task_progress
  FOR UPDATE USING (
    public.is_mentor() OR student_id = public.my_profile_id()
  );

-- ================================================================
-- RLS POLICIES — RESOURCES
-- ================================================================
CREATE POLICY "resources_select" ON public.resources
  FOR SELECT USING (
    public.is_mentor()
    OR assigned_to = public.my_profile_id()
    OR assigned_to IS NULL
  );

CREATE POLICY "resources_insert" ON public.resources
  FOR INSERT WITH CHECK (public.is_mentor());

CREATE POLICY "resources_update" ON public.resources
  FOR UPDATE USING (public.is_mentor());

CREATE POLICY "resources_delete" ON public.resources
  FOR DELETE USING (public.is_mentor());

-- ================================================================
-- RLS POLICIES — RESOURCE PROGRESS
-- ================================================================
CREATE POLICY "resource_progress_select" ON public.resource_progress
  FOR SELECT USING (
    public.is_mentor() OR student_id = public.my_profile_id()
  );

CREATE POLICY "resource_progress_insert" ON public.resource_progress
  FOR INSERT WITH CHECK (student_id = public.my_profile_id());

CREATE POLICY "resource_progress_update" ON public.resource_progress
  FOR UPDATE USING (
    public.is_mentor() OR student_id = public.my_profile_id()
  );

-- ================================================================
-- RLS POLICIES — NOTES
-- ================================================================
CREATE POLICY "notes_select" ON public.notes
  FOR SELECT USING (
    public.is_mentor() OR student_id = public.my_profile_id()
  );

CREATE POLICY "notes_insert" ON public.notes
  FOR INSERT WITH CHECK (student_id = public.my_profile_id());

CREATE POLICY "notes_update" ON public.notes
  FOR UPDATE USING (student_id = public.my_profile_id());

CREATE POLICY "notes_delete" ON public.notes
  FOR DELETE USING (student_id = public.my_profile_id());

-- ================================================================
-- RLS POLICIES — DOUBTS
-- ================================================================
CREATE POLICY "doubts_select" ON public.doubts
  FOR SELECT USING (
    public.is_mentor() OR student_id = public.my_profile_id()
  );

CREATE POLICY "doubts_insert" ON public.doubts
  FOR INSERT WITH CHECK (student_id = public.my_profile_id());

CREATE POLICY "doubts_update" ON public.doubts
  FOR UPDATE USING (
    public.is_mentor() OR student_id = public.my_profile_id()
  );

-- ================================================================
-- RLS POLICIES — PAYMENTS
-- ================================================================
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT USING (
    public.is_mentor() OR student_id = public.my_profile_id()
  );

CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT WITH CHECK (public.is_mentor());

CREATE POLICY "payments_update" ON public.payments
  FOR UPDATE USING (public.is_mentor());

-- ================================================================
-- RLS POLICIES — ANNOUNCEMENTS
-- ================================================================
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT USING (
    public.is_mentor()
    OR target = public.my_profile_id()
    OR target IS NULL
  );

CREATE POLICY "announcements_insert" ON public.announcements
  FOR INSERT WITH CHECK (public.is_mentor());

CREATE POLICY "announcements_update" ON public.announcements
  FOR UPDATE USING (public.is_mentor());

CREATE POLICY "announcements_delete" ON public.announcements
  FOR DELETE USING (public.is_mentor());

-- ================================================================
-- RLS POLICIES — NOTIFICATIONS
-- ================================================================
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = public.my_profile_id());

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (public.is_mentor() OR user_id = public.my_profile_id());

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (user_id = public.my_profile_id());

-- ================================================================
-- RLS POLICIES — ROADMAP PHASES
-- ================================================================
CREATE POLICY "roadmap_select" ON public.roadmap_phases
  FOR SELECT USING (
    public.is_mentor() OR student_id = public.my_profile_id()
  );

CREATE POLICY "roadmap_insert" ON public.roadmap_phases
  FOR INSERT WITH CHECK (public.is_mentor());

CREATE POLICY "roadmap_update" ON public.roadmap_phases
  FOR UPDATE USING (public.is_mentor());

-- ================================================================
-- REALTIME — enable for notifications
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doubts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

-- ================================================================
-- TRIGGER — auto-create profile on signup
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- SEED — Default roadmap topics template
-- (Call this after creating the mentor and first students)
-- ================================================================
-- Example: Insert default phase 1 for a student
-- INSERT INTO public.roadmap_phases (student_id, phase_number, topics, is_unlocked, created_by)
-- VALUES (
--   '<student_profile_id>',
--   1,
--   '[
--     {"id": "1", "title": "Python Fundamentals", "completed": false},
--     {"id": "2", "title": "NumPy & Pandas", "completed": false},
--     {"id": "3", "title": "Data Visualization", "completed": false},
--     {"id": "4", "title": "Statistics Basics", "completed": false}
--   ]',
--   true,
--   '<mentor_profile_id>'
-- );
