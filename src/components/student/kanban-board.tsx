'use client'

import { useState, useCallback } from 'react'
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay,
  DragStartEvent, PointerSensor, useSensor, useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { formatDateIST, getPriorityColor, isOverdue } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Clock, AlertCircle } from 'lucide-react'

type Status = 'todo' | 'inprogress' | 'done'

interface TaskItem {
  id: string
  task_id: string
  status: Status
  task: {
    id: string
    title: string
    description?: string
    due_date?: string
    priority: string
    phase_tag?: number
  }
}

interface Columns {
  todo: TaskItem[]
  inprogress: TaskItem[]
  done: TaskItem[]
}

const COLUMN_LABELS: Record<Status, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  done: 'Done',
}

const COLUMN_COLORS: Record<Status, string> = {
  todo: 'border-slate-500/30',
  inprogress: 'border-primary/30',
  done: 'border-green-500/30',
}

function TaskCard({ item, isDragging = false }: { item: TaskItem; isDragging?: boolean }) {
  const overdue = item.task.due_date ? isOverdue(item.task.due_date) && item.status !== 'done' : false

  return (
    <div className={`kanban-card ${isDragging ? 'opacity-50 rotate-1 scale-105' : ''} ${overdue ? 'border-red-400/30' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium leading-snug line-clamp-2">{item.task.title}</p>
        <span className={`badge-pill text-xs flex-shrink-0 ${getPriorityColor(item.task.priority)}`}>
          {item.task.priority}
        </span>
      </div>
      {item.task.description && (
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{item.task.description}</p>
      )}
      <div className="flex items-center justify-between gap-2 mt-3">
        {item.task.phase_tag && (
          <span className="text-xs text-muted-foreground">Phase {item.task.phase_tag}</span>
        )}
        {item.task.due_date && (
          <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-muted-foreground'}`}>
            {overdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {formatDateIST(item.task.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}

function SortableTaskCard({ item }: { item: TaskItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'task', item },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard item={item} />
    </div>
  )
}

function KanbanColumn({
  status, items, children,
}: {
  status: Status
  items: TaskItem[]
  children: React.ReactNode
}) {
  return (
    <div className={`kanban-col border ${COLUMN_COLORS[status]}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {COLUMN_LABELS[status]}
        </p>
        <span className="w-5 h-5 bg-secondary rounded-full text-xs flex items-center justify-center font-bold">
          {items.length}
        </span>
      </div>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-8 border-2 border-dashed border-border/50 rounded-lg">
            <p className="text-xs text-muted-foreground/50">Drop here</p>
          </div>
        ) : (
          <div className="space-y-2">{children}</div>
        )}
      </SortableContext>
    </div>
  )
}

interface Props {
  initialColumns: Columns
  studentId: string
}

export function KanbanBoard({ initialColumns, studentId }: Props) {
  const [columns, setColumns] = useState<Columns>(initialColumns)
  const [activeItem, setActiveItem] = useState<TaskItem | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const findColumn = (id: string): Status | null => {
    for (const [col, items] of Object.entries(columns)) {
      if (items.some((i: TaskItem) => i.id === id)) return col as Status
    }
    return null
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    const col = findColumn(active.id as string)
    if (!col) return
    setActiveItem(columns[col].find(i => i.id === active.id) ?? null)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const fromCol = findColumn(active.id as string)
    const toCol = (Object.keys(columns) as Status[]).includes(over.id as Status)
      ? (over.id as Status)
      : findColumn(over.id as string)

    if (!fromCol || !toCol || fromCol === toCol) return

    setColumns(prev => {
      const item = prev[fromCol].find(i => i.id === active.id)!
      return {
        ...prev,
        [fromCol]: prev[fromCol].filter(i => i.id !== active.id),
        [toCol]: [...prev[toCol], { ...item, status: toCol }],
      }
    })
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveItem(null)
    if (!over) return

    const fromCol = findColumn(active.id as string)
    const toCol = (Object.keys(columns) as Status[]).includes(over.id as Status)
      ? (over.id as Status)
      : findColumn(over.id as string)

    if (!fromCol || !toCol) return

    // Persist to DB
    const item = columns[toCol].find(i => i.id === active.id) ?? columns[fromCol].find(i => i.id === active.id)
    if (!item) return

    const { error } = await supabase
      .from('task_progress')
      .update({ status: toCol, updated_at: new Date().toISOString() })
      .eq('id', active.id)
      .eq('student_id', studentId)

    if (error) {
      toast({ title: 'Failed to update task', variant: 'destructive' })
    } else if (toCol === 'done') {
      toast({ title: '✅ Task completed!', description: item.task.title })
    }
  }

  const allItems = [...columns.todo, ...columns.inprogress, ...columns.done]

  if (allItems.length === 0) {
    return (
      <div className="glass-card p-16 text-center">
        <CheckSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">No tasks yet</h3>
        <p className="text-sm text-muted-foreground">
          Your mentor will assign tasks here. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['todo', 'inprogress', 'done'] as Status[]).map(status => (
          <KanbanColumn key={status} status={status} items={columns[status]}>
            {columns[status].map(item => (
              <SortableTaskCard key={item.id} item={item} />
            ))}
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeItem ? <TaskCard item={activeItem} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}
