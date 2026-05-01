import type { User, Project, Task, DashboardStats } from './types'

export const DEMO_USER: User = {
  _id: 'demo-user-1',
  name: 'Demo User',
  email: 'demo@taskflow.app',
}

export const DEMO_USERS: User[] = [
  DEMO_USER,
  { _id: 'demo-user-2', name: 'Alice Johnson', email: 'alice@example.com' },
  { _id: 'demo-user-3', name: 'Bob Smith', email: 'bob@example.com' },
  { _id: 'demo-user-4', name: 'Carol White', email: 'carol@example.com' },
]

export const DEMO_PROJECTS: Project[] = [
  {
    _id: 'project-1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern design',
    owner: DEMO_USER,
    members: [
      { user: DEMO_USER, role: 'admin' },
      { user: DEMO_USERS[1], role: 'member' },
      { user: DEMO_USERS[2], role: 'member' },
    ],
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    _id: 'project-2',
    name: 'Mobile App Development',
    description: 'Building a cross-platform mobile application',
    owner: DEMO_USERS[1],
    members: [
      { user: DEMO_USERS[1], role: 'admin' },
      { user: DEMO_USER, role: 'member' },
      { user: DEMO_USERS[3], role: 'member' },
    ],
    createdAt: '2024-02-01T10:00:00Z',
  },
  {
    _id: 'project-3',
    name: 'API Integration',
    description: 'Integrating third-party APIs and services',
    owner: DEMO_USER,
    members: [
      { user: DEMO_USER, role: 'admin' },
    ],
    createdAt: '2024-03-10T10:00:00Z',
  },
]

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const nextWeek = new Date(today)
nextWeek.setDate(nextWeek.getDate() + 7)
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)
const lastWeek = new Date(today)
lastWeek.setDate(lastWeek.getDate() - 7)

export const DEMO_TASKS: Record<string, Task[]> = {
  'project-1': [
    {
      _id: 'task-1',
      title: 'Design homepage mockup',
      description: 'Create wireframes and high-fidelity mockups for the new homepage',
      project: 'project-1',
      assignedTo: DEMO_USERS[1],
      status: 'done',
      priority: 'high',
      dueDate: lastWeek.toISOString(),
      createdAt: '2024-01-16T10:00:00Z',
    },
    {
      _id: 'task-2',
      title: 'Implement responsive navigation',
      description: 'Build mobile-first responsive navigation component',
      project: 'project-1',
      assignedTo: DEMO_USER,
      status: 'in_progress',
      priority: 'high',
      dueDate: tomorrow.toISOString(),
      createdAt: '2024-01-18T10:00:00Z',
    },
    {
      _id: 'task-3',
      title: 'Create contact form',
      description: 'Design and implement contact form with validation',
      project: 'project-1',
      assignedTo: DEMO_USERS[2],
      status: 'todo',
      priority: 'medium',
      dueDate: nextWeek.toISOString(),
      createdAt: '2024-01-20T10:00:00Z',
    },
    {
      _id: 'task-4',
      title: 'Optimize images',
      description: 'Compress and optimize all website images for performance',
      project: 'project-1',
      assignedTo: DEMO_USER,
      status: 'todo',
      priority: 'low',
      dueDate: nextWeek.toISOString(),
      createdAt: '2024-01-22T10:00:00Z',
    },
    {
      _id: 'task-5',
      title: 'Write content for About page',
      description: 'Draft compelling copy for the About Us section',
      project: 'project-1',
      assignedTo: DEMO_USERS[1],
      status: 'in_progress',
      priority: 'medium',
      dueDate: yesterday.toISOString(),
      createdAt: '2024-01-25T10:00:00Z',
    },
    {
      _id: 'task-6',
      title: 'Set up analytics',
      description: 'Integrate Google Analytics and set up conversion tracking',
      project: 'project-1',
      assignedTo: DEMO_USERS[2],
      status: 'done',
      priority: 'high',
      dueDate: lastWeek.toISOString(),
      createdAt: '2024-01-28T10:00:00Z',
    },
  ],
  'project-2': [
    {
      _id: 'task-7',
      title: 'Set up React Native project',
      description: 'Initialize the project with Expo and configure dependencies',
      project: 'project-2',
      assignedTo: DEMO_USER,
      status: 'done',
      priority: 'high',
      dueDate: lastWeek.toISOString(),
      createdAt: '2024-02-02T10:00:00Z',
    },
    {
      _id: 'task-8',
      title: 'Design app navigation',
      description: 'Create bottom tab navigation with stack navigators',
      project: 'project-2',
      assignedTo: DEMO_USERS[3],
      status: 'in_progress',
      priority: 'high',
      dueDate: tomorrow.toISOString(),
      createdAt: '2024-02-05T10:00:00Z',
    },
    {
      _id: 'task-9',
      title: 'Implement authentication flow',
      description: 'Build login, signup, and password reset screens',
      project: 'project-2',
      assignedTo: DEMO_USER,
      status: 'todo',
      priority: 'high',
      dueDate: nextWeek.toISOString(),
      createdAt: '2024-02-08T10:00:00Z',
    },
  ],
  'project-3': [
    {
      _id: 'task-10',
      title: 'Research payment APIs',
      description: 'Evaluate Stripe, PayPal, and Square for payment processing',
      project: 'project-3',
      assignedTo: DEMO_USER,
      status: 'done',
      priority: 'medium',
      dueDate: lastWeek.toISOString(),
      createdAt: '2024-03-11T10:00:00Z',
    },
    {
      _id: 'task-11',
      title: 'Implement Stripe integration',
      description: 'Set up Stripe checkout and webhook handlers',
      project: 'project-3',
      assignedTo: DEMO_USER,
      status: 'in_progress',
      priority: 'high',
      dueDate: yesterday.toISOString(),
      createdAt: '2024-03-15T10:00:00Z',
    },
  ],
}

export function getDemoStats(projectId: string): DashboardStats {
  const tasks = DEMO_TASKS[projectId] || []
  const now = new Date()
  
  const statusCounts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }
  
  const overdueTasks = tasks.filter(t => 
    t.status !== 'done' && new Date(t.dueDate) < now
  ).length
  
  const tasksByMember = tasks.reduce((acc, task) => {
    const name = task.assignedTo.name
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalTasks: tasks.length,
    statusCounts,
    overdueTasks,
    tasksByMember,
  }
}

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('demo_mode') === 'true'
}

export function enableDemoMode(): void {
  localStorage.setItem('demo_mode', 'true')
  localStorage.setItem('token', 'demo-token')
}

export function disableDemoMode(): void {
  localStorage.removeItem('demo_mode')
}
