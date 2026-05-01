'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format, isPast, parseISO } from 'date-fns'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  ApiError,
} from '@/lib/api'
import type { Task, Project, MyRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Plus,
  MoreVertical,
  Trash2,
  Calendar,
  AlertCircle,
  ListTodo,
} from 'lucide-react'

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
}

interface TasksPanelProps {
  project: Project
  myRole: MyRole
}

export function TasksPanel({ project, myRole }: TasksPanelProps) {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR(`tasks-${project._id}`, () =>
    getTasks(project._id).then((res) => res.tasks)
  )

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [assignedTo, setAssignedTo] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setIsCreating(true)

    try {
      const { task } = await createTask(project._id, {
        title,
        description,
        dueDate,
        priority,
        assignedTo,
      })
      mutate((prev) => (prev ? [...prev, task] : [task]))
      setIsDialogOpen(false)
      resetForm()
    } catch (err) {
      if (err instanceof ApiError) {
        setCreateError(err.message)
      } else {
        setCreateError('Failed to create task')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDueDate('')
    setPriority('medium')
    setAssignedTo('')
    setCreateError('')
  }

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      const { task } = await updateTask(taskId, { status })
      mutate(
        (prev) => prev?.map((t) => (t._id === taskId ? task : t)) || [],
        false
      )
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      mutate((prev) => prev?.filter((t) => t._id !== taskId) || [], false)
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const isOverdue = (task: Task) => {
    return (
      task.status !== 'done' &&
      task.dueDate &&
      isPast(parseISO(task.dueDate))
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">Failed to load tasks</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  const todoTasks = data?.filter((t) => t.status === 'todo') || []
  const inProgressTasks = data?.filter((t) => t.status === 'in_progress') || []
  const doneTasks = data?.filter((t) => t.status === 'done') || []

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-sm font-medium">
            {task.title}
          </CardTitle>
          {myRole === 'admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleDelete(task._id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {task.description && (
          <CardDescription className="line-clamp-2 text-xs">
            {task.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={PRIORITY_COLORS[task.priority]}
          >
            {task.priority}
          </Badge>
          {isOverdue(task) && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="size-3" />
              Overdue
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            {format(parseISO(task.dueDate), 'MMM d, yyyy')}
          </div>
          <div className="flex items-center gap-1">
            <Avatar className="size-6">
              <AvatarFallback className="text-[10px]">
                {getInitials(task.assignedTo.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <Select
          value={task.status}
          onValueChange={(value) =>
            handleStatusChange(task._id, value as Task['status'])
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )

  const Column = ({
    title,
    tasks,
    status,
  }: {
    title: string
    tasks: Task[]
    status: Task['status']
  }) => (
    <div className="flex flex-1 flex-col rounded-lg border bg-muted/30 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tasks
          </p>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-full flex-col gap-4">
      {myRole === 'admin' && (
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Task</DialogTitle>
                  <DialogDescription>
                    Create a new task and assign it to a team member.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex flex-col gap-4">
                  {createError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {createError}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="task-title">Title</Label>
                    <Input
                      id="task-title"
                      placeholder="Task title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="task-description">
                      Description (optional)
                    </Label>
                    <Textarea
                      id="task-description"
                      placeholder="Task description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="task-due-date">Due Date</Label>
                      <Input
                        id="task-due-date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="task-priority">Priority</Label>
                      <Select
                        value={priority}
                        onValueChange={(v) => setPriority(v as Task['priority'])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="task-assignee">Assign To</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {project.members.map((member) => (
                          <SelectItem
                            key={member.user._id}
                            value={member.user._id}
                          >
                            {member.user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating || !assignedTo}>
                    {isCreating && <Spinner />}
                    Create Task
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {data && data.length === 0 ? (
        <Empty className="h-64">
          <EmptyMedia>
            <ListTodo className="size-10 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>No tasks yet</EmptyTitle>
          <EmptyDescription>
            {myRole === 'admin'
              ? 'Create your first task to get started.'
              : 'No tasks have been assigned to you yet.'}
          </EmptyDescription>
          {myRole === 'admin' && (
            <EmptyContent>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="size-4" />
                New Task
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
          <Column title="To Do" tasks={todoTasks} status="todo" />
          <Column title="In Progress" tasks={inProgressTasks} status="in_progress" />
          <Column title="Done" tasks={doneTasks} status="done" />
        </div>
      )}
    </div>
  )
}
