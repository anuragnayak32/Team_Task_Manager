export interface User {
  _id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  user: User
  role: 'admin' | 'member'
}

export interface Project {
  _id: string
  name: string
  description: string
  createdBy: User
  members: ProjectMember[]
  createdAt: string
  updatedAt: string
}

export interface Task {
  _id: string
  title: string
  description: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  project: string
  assignedTo: User
  createdBy: User
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalTasks: number
  tasksByStatus: {
    todo: number
    in_progress: number
    done: number
  }
  tasksPerUser: Array<{
    userId: string
    name: string
    email: string
    count: number
  }>
  overdueCount: number
}

export type MyRole = 'admin' | 'member'
