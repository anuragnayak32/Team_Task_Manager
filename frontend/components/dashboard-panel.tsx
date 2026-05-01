'use client'

import useSWR from 'swr'
import { getDashboard } from '@/lib/api'
import type { DashboardStats, MyRole } from '@/lib/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DashboardPanelProps {
  projectId: string
  myRole: MyRole
}

const STATUS_FALLBACK = {
  todo: '#38bdf8',
  in_progress: '#fbbf24',
  done: '#4ade80',
} as const

// Solid hex colors — reliable fills in Recharts SVG
const MEMBER_BAR_COLORS = ['#38bdf8', '#a78bfa', '#fb7185', '#fbbf24', '#4ade80'] as const

export function DashboardPanel({ projectId, myRole }: DashboardPanelProps) {
  const { data, error, isLoading } = useSWR<DashboardStats>(
    `dashboard-${projectId}`,
    () => getDashboard(projectId)
  )

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">Failed to load dashboard</p>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  const pieSlices = [
    { key: 'todo' as const, name: 'To Do', value: data.tasksByStatus.todo || 0 },
    { key: 'in_progress' as const, name: 'In Progress', value: data.tasksByStatus.in_progress || 0 },
    { key: 'done' as const, name: 'Done', value: data.tasksByStatus.done || 0 },
  ]
  const pieData = pieSlices
    .filter((d) => d.value > 0)
    .map((d) => ({
      ...d,
      fill: STATUS_FALLBACK[d.key],
    }))

  const completionRate =
    data.totalTasks > 0
      ? Math.round(((data.tasksByStatus.done || 0) / data.totalTasks) * 100)
      : 0

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {myRole === 'member' ? 'Assigned to you' : 'In this project'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.tasksByStatus.in_progress || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently being worked on
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.tasksByStatus.done || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {data.overdueCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of tasks by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.totalTasks > 0 ? (
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
                <div className="mx-auto h-52 w-52 shrink-0 sm:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="var(--border)"
                        strokeWidth={1}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, 'Tasks']}
                        contentStyle={{
                          backgroundColor: 'var(--popover)',
                          color: 'var(--popover-foreground)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-1 flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                  {pieSlices.map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 shrink-0 rounded-full ring-2 ring-background"
                          style={{
                            backgroundColor: STATUS_FALLBACK[row.key],
                            boxShadow: `0 0 0 1px var(--border), inset 0 0 0 2px var(--background)`,
                          }}
                        />
                        <span className="font-medium">{row.name}</span>
                      </div>
                      <span className="tabular-nums text-muted-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                No tasks to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completion Progress */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Overall completion status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span>Completion Rate</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold">
                  {data.tasksByStatus.todo || 0}
                </span>
                <span className="text-xs text-muted-foreground">To Do</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold">
                  {data.tasksByStatus.in_progress || 0}
                </span>
                <span className="text-xs text-muted-foreground">In Progress</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold">
                  {data.tasksByStatus.done || 0}
                </span>
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Per User (Admin only) */}
      {myRole === 'admin' && data.tasksPerUser && data.tasksPerUser.length > 0 && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <CardTitle>Tasks Per Team Member</CardTitle>
            </div>
            <CardDescription>
              Distribution of tasks across team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full min-w-0 rounded-lg border border-border/40 bg-muted/20 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.tasksPerUser}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fill: 'var(--foreground)', fontSize: 13, fontWeight: 500 }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.35 }}
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      color: 'var(--popover-foreground)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} task${value === 1 ? '' : 's'}`, 'Assigned']}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={36}>
                    {data.tasksPerUser.map((_, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={MEMBER_BAR_COLORS[index % MEMBER_BAR_COLORS.length]}
                        stroke="var(--background)"
                        strokeWidth={2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {data.tasksPerUser.map((user, index) => (
                <div
                  key={user.userId}
                  className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 shadow-sm"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: MEMBER_BAR_COLORS[index % MEMBER_BAR_COLORS.length],
                    }}
                  />
                  <Avatar className="size-7 border border-border/50">
                    <AvatarFallback className="text-[10px] font-medium">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({user.count} {user.count === 1 ? 'task' : 'tasks'})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
