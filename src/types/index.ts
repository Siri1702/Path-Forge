export type Role = 'mentor' | 'student'
export type Track = 'ML Engineer' | 'Data Scientist' | 'Data Analyst'
export type TaskStatus = 'todo' | 'inprogress' | 'done'
export type Priority = 'high' | 'medium' | 'low'
export type ResourceType = 'Video' | 'Article' | 'Project' | 'Practice'
export type DoubtStatus = 'open' | 'answered'
export type PaymentStatus = 'paid' | 'pending' | 'overdue'

export interface Profile {
  id: string
  user_id: string
  name: string
  email: string
  role: Role
  track?: Track
  current_phase?: number
  avatar_url?: string
  bio?: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  due_date?: string
  priority: Priority
  phase_tag?: number
  assigned_to?: string
  created_by?: string
  created_at: string
  profiles?: Profile
}

export interface TaskProgress {
  id: string
  task_id: string
  student_id: string
  status: TaskStatus
  updated_at: string
  tasks?: Task
}

export interface Resource {
  id: string
  title: string
  url: string
  type: ResourceType
  phase_tag?: number
  assigned_to?: string
  created_by?: string
  created_at: string
}

export interface ResourceProgress {
  id: string
  resource_id: string
  student_id: string
  completed: boolean
  completed_at?: string
}

export interface Note {
  id: string
  student_id: string
  title: string
  content: string
  phase_tag?: number
  week_tag?: string
  updated_at: string
  created_at: string
}

export interface Doubt {
  id: string
  student_id: string
  question: string
  topic_tag?: string
  status: DoubtStatus
  mentor_reply?: string
  created_at: string
  replied_at?: string
  profiles?: Profile
}

export interface Payment {
  id: string
  student_id: string
  plan_type: string
  amount: number
  due_date: string
  status: PaymentStatus
  notes?: string
  updated_at: string
  profiles?: Profile
}

export interface Announcement {
  id: string
  title: string
  body: string
  created_by?: string
  target?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  link?: string
  read: boolean
  created_at: string
}

export interface RoadmapPhase {
  id: string
  student_id: string
  phase_number: number
  topics: RoadmapTopic[]
  is_unlocked: boolean
  created_by?: string
}

export interface RoadmapTopic {
  id: string
  title: string
  completed: boolean
}

export interface TaskWithProgress extends Task {
  task_progress?: TaskProgress[]
}

export interface ResourceWithProgress extends Resource {
  resource_progress?: ResourceProgress[]
}
