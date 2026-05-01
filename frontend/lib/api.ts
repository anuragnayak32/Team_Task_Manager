import type { User, Project, Task, DashboardStats, MyRole } from './types'
import {
  DEMO_USER,
  DEMO_USERS,
  DEMO_PROJECTS,
  DEMO_TASKS,
  getDemoStats,
  isDemoMode,
} from './mock-data'

// Default: same-origin `/api/...` (Next rewrites to Express in next.config.mjs).
// Set NEXT_PUBLIC_API_URL only when the UI and API are on different hosts (e.g. prod).
function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL
  if (raw === undefined || raw === '') return ''
  return raw.replace(/\/$/, '')
}

const API_URL = apiBase()

// In-memory copy of sample data when demo mode is on
let demoProjects = [...DEMO_PROJECTS]
let demoTasks = JSON.parse(JSON.stringify(DEMO_TASKS)) as Record<string, Task[]>

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new ApiError(data.error || 'Request failed', res.status)
  }

  return res.json()
}

// Auth
export async function signup(
  name: string,
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  return request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getMe(): Promise<{ user: User }> {
  if (isDemoMode()) {
    return { user: DEMO_USER }
  }
  return request('/api/auth/me')
}

// Projects
export async function getProjects(): Promise<{ projects: Project[] }> {
  if (isDemoMode()) {
    return { projects: demoProjects }
  }
  return request('/api/projects')
}

export async function createProject(
  name: string,
  description?: string
): Promise<{ project: Project }> {
  if (isDemoMode()) {
    const newProject: Project = {
      _id: `project-${Date.now()}`,
      name,
      description,
      owner: DEMO_USER,
      members: [{ user: DEMO_USER, role: 'admin' }],
      createdAt: new Date().toISOString(),
    }
    demoProjects = [...demoProjects, newProject]
    demoTasks[newProject._id] = []
    return { project: newProject }
  }
  return request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export async function getProject(
  projectId: string
): Promise<{ project: Project; myRole: MyRole }> {
  if (isDemoMode()) {
    const project = demoProjects.find((p) => p._id === projectId)
    if (!project) throw new ApiError('Project not found', 404)
    const member = project.members.find((m) => m.user._id === DEMO_USER._id)
    return { project, myRole: member?.role || 'member' }
  }
  return request(`/api/projects/${projectId}`)
}

export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string }
): Promise<{ project: Project }> {
  if (isDemoMode()) {
    demoProjects = demoProjects.map((p) =>
      p._id === projectId ? { ...p, ...data } : p
    )
    const project = demoProjects.find((p) => p._id === projectId)
    if (!project) throw new ApiError('Project not found', 404)
    return { project }
  }
  return request(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function addMember(
  projectId: string,
  email: string,
  role: 'admin' | 'member' = 'member'
): Promise<{ project: Project }> {
  if (isDemoMode()) {
    const existingUser = DEMO_USERS.find((u) => u.email === email)
    const newUser = existingUser || {
      _id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
    }
    demoProjects = demoProjects.map((p) => {
      if (p._id !== projectId) return p
      const alreadyMember = p.members.some((m) => m.user.email === email)
      if (alreadyMember) return p
      return { ...p, members: [...p.members, { user: newUser, role }] }
    })
    const project = demoProjects.find((p) => p._id === projectId)
    if (!project) throw new ApiError('Project not found', 404)
    return { project }
  }
  return request(`/api/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  })
}

export async function removeMember(
  projectId: string,
  userId: string
): Promise<{ project: Project }> {
  if (isDemoMode()) {
    demoProjects = demoProjects.map((p) => {
      if (p._id !== projectId) return p
      return { ...p, members: p.members.filter((m) => m.user._id !== userId) }
    })
    const project = demoProjects.find((p) => p._id === projectId)
    if (!project) throw new ApiError('Project not found', 404)
    return { project }
  }
  return request(`/api/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  })
}

export async function updateMemberRole(
  projectId: string,
  userId: string,
  role: 'admin' | 'member'
): Promise<{ project: Project }> {
  if (isDemoMode()) {
    demoProjects = demoProjects.map((p) => {
      if (p._id !== projectId) return p
      return {
        ...p,
        members: p.members.map((m) =>
          m.user._id === userId ? { ...m, role } : m
        ),
      }
    })
    const project = demoProjects.find((p) => p._id === projectId)
    if (!project) throw new ApiError('Project not found', 404)
    return { project }
  }
  return request(`/api/projects/${projectId}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

// Tasks
export async function getTasks(
  projectId: string
): Promise<{ tasks: Task[]; myRole: MyRole }> {
  if (isDemoMode()) {
    const project = demoProjects.find((p) => p._id === projectId)
    const member = project?.members.find((m) => m.user._id === DEMO_USER._id)
    return { tasks: demoTasks[projectId] || [], myRole: member?.role || 'member' }
  }
  return request(`/api/tasks/project/${projectId}`)
}

export async function createTask(
  projectId: string,
  data: {
    title: string
    description?: string
    dueDate: string
    priority?: 'low' | 'medium' | 'high'
    assignedTo: string
  }
): Promise<{ task: Task }> {
  if (isDemoMode()) {
    const project = demoProjects.find((p) => p._id === projectId)
    const assignee = project?.members.find(
      (m) => m.user._id === data.assignedTo
    )?.user
    const newTask: Task = {
      _id: `task-${Date.now()}`,
      title: data.title,
      description: data.description,
      project: projectId,
      assignedTo: assignee || DEMO_USER,
      status: 'todo',
      priority: data.priority || 'medium',
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
    }
    demoTasks[projectId] = [...(demoTasks[projectId] || []), newTask]
    return { task: newTask }
  }
  return request(`/api/tasks/project/${projectId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTask(
  taskId: string,
  data: Partial<{
    title: string
    description: string
    dueDate: string
    priority: 'low' | 'medium' | 'high'
    status: 'todo' | 'in_progress' | 'done'
    assignedTo: string
  }>
): Promise<{ task: Task }> {
  if (isDemoMode()) {
    let updatedTask: Task | null = null
    for (const projectId of Object.keys(demoTasks)) {
      demoTasks[projectId] = demoTasks[projectId].map((t) => {
        if (t._id !== taskId) return t
        updatedTask = { ...t, ...data } as Task
        return updatedTask
      })
    }
    if (!updatedTask) throw new ApiError('Task not found', 404)
    return { task: updatedTask }
  }
  return request(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteTask(taskId: string): Promise<{ ok: boolean }> {
  if (isDemoMode()) {
    for (const projectId of Object.keys(demoTasks)) {
      demoTasks[projectId] = demoTasks[projectId].filter((t) => t._id !== taskId)
    }
    return { ok: true }
  }
  return request(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  })
}

// Dashboard
export async function getDashboard(
  projectId: string
): Promise<DashboardStats> {
  if (isDemoMode()) {
    // Compute stats from current demo tasks (in-memory)
    const tasks = demoTasks[projectId] || []
    const now = new Date()
    const statusCounts = {
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    }
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'done' && new Date(t.dueDate) < now
    ).length
    const tasksPerUser = Object.entries(
      tasks.reduce<Record<string, { userId: string; name: string; email: string; count: number }>>(
        (acc, task) => {
          const id = task.assignedTo._id
          if (!acc[id]) {
            acc[id] = {
              userId: id,
              name: task.assignedTo.name,
              email: task.assignedTo.email,
              count: 0,
            }
          }
          acc[id].count += 1
          return acc
        },
        {}
      )
    ).map(([, v]) => v)

    return {
      totalTasks: tasks.length,
      tasksByStatus: statusCounts,
      tasksPerUser,
      overdueCount: overdueTasks,
    }
  }
  return request(`/api/dashboard/project/${projectId}`)
}

export { ApiError }
