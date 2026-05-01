'use client'

import { use, useState } from 'react'
import { DynamicProjectFavicon } from '@/components/dynamic-project-favicon'
import Link from 'next/link'
import useSWR from 'swr'
import { getProject, updateProject, ApiError } from '@/lib/api'
import type { Project, MyRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { DashboardPanel } from '@/components/dashboard-panel'
import { TasksPanel } from '@/components/tasks-panel'
import { MembersPanel } from '@/components/members-panel'
import {
  ArrowLeft,
  Settings,
  LayoutDashboard,
  ListTodo,
  Users,
} from 'lucide-react'

interface ProjectPageProps {
  params: Promise<{ projectId: string }>
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = use(params)
  const { data, error, isLoading, mutate } = useSWR(
    `project-${projectId}`,
    () => getProject(projectId)
  )

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')

  const handleOpenSettings = () => {
    if (data?.project) {
      setName(data.project.name)
      setDescription(data.project.description || '')
    }
    setIsSettingsOpen(true)
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateError('')
    setIsUpdating(true)

    try {
      const { project: updatedProject } = await updateProject(projectId, {
        name,
        description,
      })
      mutate({ project: updatedProject, myRole: data!.myRole }, false)
      setIsSettingsOpen(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setUpdateError(err.message)
      } else {
        setUpdateError('Failed to update project')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleProjectUpdate = (project: Project) => {
    mutate({ project, myRole: data!.myRole }, false)
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            Failed to load project
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
          <Link href="/projects" className="mt-4 inline-block">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  const { project, myRole } = data

  return (
    <div className="flex h-full flex-col">
      <DynamicProjectFavicon projectName={project.name} />
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{project.name}</h1>
              <Badge
                variant={myRole === 'admin' ? 'default' : 'secondary'}
              >
                {myRole}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
        </div>
        {myRole === 'admin' && (
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleOpenSettings}>
                <Settings className="size-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleUpdateProject}>
                <DialogHeader>
                  <DialogTitle>Project Settings</DialogTitle>
                  <DialogDescription>
                    Update your project details.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex flex-col gap-4">
                  {updateError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {updateError}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="settings-name">Name</Label>
                    <Input
                      id="settings-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="settings-description">Description</Label>
                    <Textarea
                      id="settings-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSettingsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating && <Spinner />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="dashboard" className="flex h-full flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="size-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ListTodo className="size-4" />
              Tasks
            </TabsTrigger>
            {myRole === 'admin' && (
              <TabsTrigger value="members">
                <Users className="size-4" />
                Members
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="mt-6 flex-1">
            <DashboardPanel projectId={projectId} myRole={myRole} />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6 flex-1">
            <TasksPanel project={project} myRole={myRole} />
          </TabsContent>

          {myRole === 'admin' && (
            <TabsContent value="members" className="mt-6 flex-1">
              <MembersPanel
                project={project}
                myRole={myRole}
                onProjectUpdate={handleProjectUpdate}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
