'use client'

import { useState } from 'react'
import {
  addMember,
  removeMember,
  updateMemberRole,
  ApiError,
} from '@/lib/api'
import type { Project, MyRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, MoreVertical, UserMinus, Shield, User } from 'lucide-react'

interface MembersPanelProps {
  project: Project
  myRole: MyRole
  onProjectUpdate: (project: Project) => void
}

export function MembersPanel({
  project,
  myRole,
  onProjectUpdate,
}: MembersPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsAdding(true)

    try {
      const { project: updatedProject } = await addMember(
        project._id,
        email,
        role
      )
      onProjectUpdate(updatedProject)
      setIsDialogOpen(false)
      setEmail('')
      setRole('member')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to add member')
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      const { project: updatedProject } = await removeMember(project._id, userId)
      onProjectUpdate(updatedProject)
    } catch (err) {
      console.error('Failed to remove member:', err)
    }
  }

  const handleRoleChange = async (
    userId: string,
    newRole: 'admin' | 'member'
  ) => {
    try {
      const { project: updatedProject } = await updateMemberRole(
        project._id,
        userId,
        newRole
      )
      onProjectUpdate(updatedProject)
    } catch (err) {
      console.error('Failed to update role:', err)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const adminCount = project.members.filter((m) => m.role === 'admin').length

  return (
    <div className="flex flex-col gap-4">
      {myRole === 'admin' && (
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddMember}>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Invite a user to join this project. They must already have
                    an account.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex flex-col gap-4">
                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="member-email">Email</Label>
                    <Input
                      id="member-email"
                      type="email"
                      placeholder="teammate@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="member-role">Role</Label>
                    <Select
                      value={role}
                      onValueChange={(v) => setRole(v as 'admin' | 'member')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Admins can manage members and create/delete tasks. Members
                      can only update their assigned tasks.
                    </p>
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
                  <Button type="submit" disabled={isAdding}>
                    {isAdding && <Spinner />}
                    Add Member
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {project.members.map((member) => {
          const isLastAdmin =
            member.role === 'admin' && adminCount === 1
          const isCreator = member.user._id === project.createdBy._id

          return (
            <Card key={member.user._id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(member.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {member.user.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {member.user.email}
                      </CardDescription>
                    </div>
                  </div>
                  {myRole === 'admin' && !isCreator && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role === 'member' ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(member.user._id, 'admin')
                            }
                          >
                            <Shield className="mr-2 size-4" />
                            Make Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(member.user._id, 'member')
                            }
                            disabled={isLastAdmin}
                          >
                            <User className="mr-2 size-4" />
                            Make Member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.user._id)}
                          disabled={isLastAdmin}
                          className="text-destructive"
                        >
                          <UserMinus className="mr-2 size-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={member.role === 'admin' ? 'default' : 'secondary'}
                  >
                    {member.role}
                  </Badge>
                  {isCreator && (
                    <Badge variant="outline" className="text-xs">
                      Creator
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
