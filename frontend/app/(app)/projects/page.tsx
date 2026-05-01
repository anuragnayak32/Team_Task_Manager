'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import { getProjects, createProject, ApiError } from '@/lib/api'
import type { Project } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Plus, FolderKanban, Users } from 'lucide-react'
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  HoverCard,
} from '@/components/motion'

export default function ProjectsPage() {
  const { user } = useAuth()

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (link) link.href = '/icon'
  }, [])

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR('projects', () => getProjects().then((res) => res.projects))

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setIsCreating(true)

    try {
      const { project } = await createProject(name, description)
      mutate((prev) => (prev ? [...prev, project] : [project]))
      setIsDialogOpen(false)
      setName('')
      setDescription('')
    } catch (err) {
      if (err instanceof ApiError) {
        setCreateError(err.message)
      } else {
        setCreateError('Failed to create project')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const getMyRole = (project: Project) => {
    const member = project.members.find((m) => m.user._id === user?._id)
    return member?.role || 'member'
  }

  if (error) {
    return (
      <PageTransition className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">
            Failed to load projects
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="flex h-full flex-col">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between border-b px-6 py-4"
      >
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team projects
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="group">
              <motion.span
                className="flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="size-4 transition-transform group-hover:rotate-90" />
                New Project
              </motion.span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
                <DialogDescription>
                  Create a new project to start collaborating with your team.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex flex-col gap-4">
                <AnimatePresence>
                  {createError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                    >
                      {createError}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="project-name">Name</Label>
                  <Input
                    id="project-name"
                    placeholder="My Awesome Project"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="project-description">
                    Description (optional)
                  </Label>
                  <Textarea
                    id="project-description"
                    placeholder="What is this project about?"
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
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Spinner />}
                  Create Project
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.header>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Spinner className="size-8" />
            </motion.div>
          </div>
        ) : data && data.length > 0 ? (
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((project) => (
              <StaggerItem key={project._id}>
                <Link href={`/projects/${project._id}`}>
                  <HoverCard>
                    <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ rotate: 5, scale: 1.1 }}
                              className="flex size-10 items-center justify-center rounded-md bg-primary/10"
                            >
                              <FolderKanban className="size-5 text-primary" />
                            </motion.div>
                            <div>
                              <CardTitle className="line-clamp-1 text-base">
                                {project.name}
                              </CardTitle>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge
                                  variant={
                                    getMyRole(project) === 'admin'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {getMyRole(project)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="line-clamp-2 min-h-10">
                          {project.description || 'No description'}
                        </CardDescription>
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="size-4" />
                          <span>
                            {project.members.length}{' '}
                            {project.members.length === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </HoverCard>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Empty className="h-64">
              <EmptyMedia>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FolderKanban className="size-10 text-muted-foreground" />
                </motion.div>
              </EmptyMedia>
              <EmptyTitle>No projects yet</EmptyTitle>
              <EmptyDescription>
                Create your first project to get started.
              </EmptyDescription>
              <EmptyContent>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="size-4" />
                  New Project
                </Button>
              </EmptyContent>
            </Empty>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
