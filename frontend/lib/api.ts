import type { User, Project, Task, DashboardStats, MyRole } from './types'

// Default: same-origin `/api/...` (Next rewrites to Express in next.config.mjs).
// Set NEXT_PUBLIC_API_URL only when the UI and API are on different hosts (e.g. prod).
function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL
  if (raw === undefined || raw === '') return ''
  return raw.replace(/\/$/, '')
}

const API_URL = apiBase()

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
  return request('/api/auth/me')
}

// Projects
export async function getProjects(): Promise<{ projects: Project[] }> {
  return request('/api/projects')
}

export async function createProject(
  name: string,
  description?: string
): Promise<{ project: Project }> {
  return request('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export async function getProject(
  projectId: string
): Promise<{ project: Project; myRole: MyRole }> {
  return request(`/api/projects/${projectId}`)
}

export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string }
): Promise<{ project: Project }> {
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
  return request(`/api/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  })
}

export async function removeMember(
  projectId: string,
  userId: string
): Promise<{ project: Project }> {
  return request(`/api/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  })
}

export async function updateMemberRole(
  projectId: string,
  userId: string,
  role: 'admin' | 'member'
): Promise<{ project: Project }> {
  return request(`/api/projects/${projectId}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

// Tasks
export async function getTasks(
  projectId: string
): Promise<{ tasks: Task[]; myRole: MyRole }> {
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
  return request(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteTask(taskId: string): Promise<{ ok: boolean }> {
  return request(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  })
}

// Dashboard
export async function getDashboard(
  projectId: string
): Promise<DashboardStats> {
  return request(`/api/dashboard/project/${projectId}`)
}

export { ApiError }
