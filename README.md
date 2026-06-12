# ⚡ Pathforge — Data Science Mentorship Platform

A full-stack mentorship tracking platform for Data Science mentors managing 10–30 students. Built with Next.js 14, Supabase, and Tailwind CSS.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/pathforge&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_APP_URL)

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| UI Components | shadcn/ui (Radix primitives) |
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime) |
| Hosting | Vercel (free tier) |
| Drag & Drop | @dnd-kit/core |
| Forms | react-hook-form + zod |

---

## 📋 Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon key** from Project Settings → API
3. Also copy your **service_role key** (keep this secret)

### 2. Run the Database Schema

1. In your Supabase dashboard, open the **SQL Editor**
2. Copy the entire contents of `supabase-schema.sql`
3. Paste and click **Run**
4. This creates all tables, RLS policies, helper functions, and triggers

### 3. Configure Supabase Auth

1. Go to **Authentication → Settings** in Supabase
2. Set **Site URL** to your app URL (e.g. `https://yourapp.vercel.app`)
3. Add `http://localhost:3000` to **Redirect URLs** for local dev
4. Under **Email**, ensure "Enable email confirmations" is configured as desired

### 4. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Install Dependencies & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 👤 Creating the First Mentor Account

Since there's no public sign-up, create the mentor account manually:

**Option A — Supabase Dashboard (recommended)**
1. Go to **Authentication → Users** in Supabase
2. Click **Invite user** and enter the mentor's email
3. The mentor sets their password via the invite link
4. In the **SQL Editor**, run:
```sql
UPDATE public.profiles
SET role = 'mentor', name = 'Your Name'
WHERE email = 'mentor@example.com';
```

**Option B — SQL Editor (quick setup)**
```sql
-- 1. Create the auth user
-- (Do this via Auth → Users → Invite User in dashboard)

-- 2. After the profile auto-creates via trigger, update the role:
UPDATE public.profiles
SET
  role = 'mentor',
  name = 'Dr. Jane Smith',
  track = NULL  -- mentors don't have tracks
WHERE email = 'mentor@example.com';
```

---

## 📁 Project Structure

```
pathforge/
├── src/
│   ├── app/
│   │   ├── login/               # Auth page
│   │   ├── dashboard/
│   │   │   ├── mentor/          # Mentor dashboard + all mentor pages
│   │   │   │   ├── students/    # Student list + [id] profile
│   │   │   │   ├── tasks/       # Task management
│   │   │   │   ├── resources/   # Resource library
│   │   │   │   ├── doubts/      # Doubts inbox
│   │   │   │   ├── announcements/
│   │   │   │   └── payments/    # Payment tracking
│   │   │   └── student/         # Student dashboard + all student pages
│   │   │       ├── roadmap/     # Phase-based roadmap
│   │   │       ├── tasks/       # Kanban board
│   │   │       ├── resources/   # Resource library
│   │   │       ├── notes/       # Personal notes w/ autosave
│   │   │       ├── doubts/      # Submit & view doubts
│   │   │       └── payments/    # Payment status (read-only)
│   │   └── api/
│   │       └── invite-student/  # Secure student invite endpoint
│   ├── components/
│   │   ├── ui/                  # Base UI components (shadcn)
│   │   ├── shared/              # Shared: layout, sidebar, notifications
│   │   ├── mentor/              # Mentor-specific components
│   │   └── student/             # Student-specific components
│   ├── hooks/                   # use-toast, etc.
│   ├── lib/
│   │   ├── supabase/            # client / server / middleware clients
│   │   └── utils.ts             # Utilities, formatters, color helpers
│   └── types/                   # TypeScript types for all DB entities
├── supabase-schema.sql          # Complete DB schema with RLS
└── .env.local.example           # Environment variables template
```

---

## 🔐 Role-Based Access

| Feature | Mentor | Student |
|---|---|---|
| View all students | ✅ | ❌ |
| Assign tasks | ✅ | ❌ (view only) |
| Add resources | ✅ | ❌ (view only) |
| Reply to doubts | ✅ | ❌ |
| Update payments | ✅ | ❌ (view only) |
| Post announcements | ✅ | ❌ (view only) |
| Drag tasks on Kanban | ❌ | ✅ |
| Write notes | ❌ | ✅ |
| Submit doubts | ❌ | ✅ |
| Mark resources done | ❌ | ✅ |

All access is enforced at the database level via **Row Level Security (RLS)** policies — not just frontend routing.

---

## 🚢 Deploy to Vercel

1. Push your code to GitHub
2. Click the **Deploy with Vercel** button above, or:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
3. Add all environment variables in the Vercel dashboard
4. Update `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL
5. Update **Supabase Auth → Settings → Site URL** to the same Vercel URL

---

## 🔔 Realtime Notifications

Pathforge uses **Supabase Realtime** for live notification delivery. The notification bell in the top bar polls and subscribes to the `notifications` table for the current user. No additional setup required — it works automatically once the schema is applied.

---

## 📝 Supabase RLS — How It Works

Every table has RLS enabled. Two helper functions power all policies:
- `is_mentor()` — returns true if the current auth user has the `mentor` role
- `my_profile_id()` — returns the profile ID for the current auth user

Students can only read/write their own rows. The mentor can read/write all rows.

---

## 🆘 Common Issues

**"relation 'profiles' does not exist"**
→ Run the full `supabase-schema.sql` in the SQL Editor first.

**Mentor sees student dashboard or vice versa**
→ Check the `role` field in the `profiles` table for that user.

**Invite email not sending**
→ Ensure Supabase email is configured (or use a custom SMTP under Auth → Settings).

**"service_role key" error**
→ The `SUPABASE_SERVICE_ROLE_KEY` is only available server-side. Never expose it in the browser.
