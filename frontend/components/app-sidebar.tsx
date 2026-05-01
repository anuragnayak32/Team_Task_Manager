'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  CheckSquare,
  FolderKanban,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'

const STORAGE_KEY = 'taskflow-sidebar-collapsed'

const navItems = [
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderKanban,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      /* ignore */
    }
    setMounted(true)
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // avoid layout jump before localStorage is read
  const narrow = mounted && collapsed

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 shadow-[4px_0_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur-md supports-[backdrop-filter]:bg-sidebar/80',
        'transition-[width] duration-200 ease-out',
        narrow ? 'w-[4.5rem]' : 'w-64'
      )}
    >
      {/* header */}
      <div
        className={cn(
          'flex shrink-0 items-center border-b border-sidebar-border',
          narrow ? 'flex-col gap-2 px-2 py-3' : 'h-14 justify-between gap-2 px-3'
        )}
      >
        <div
          className={cn(
            'flex min-w-0 items-center gap-2',
            narrow && 'flex-col justify-center'
          )}
        >
          <motion.div
            initial={false}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <CheckSquare className="size-6 shrink-0 text-primary" />
          </motion.div>
          {!narrow && (
            <span className="truncate text-lg font-semibold text-sidebar-foreground">
              TaskFlow
            </span>
          )}
        </div>

        <div
          className={cn(
            'flex items-center gap-1',
            narrow ? 'flex-col' : 'shrink-0'
          )}
        >
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={toggleCollapsed}
            aria-expanded={!narrow}
            aria-label={narrow ? 'Expand sidebar' : 'Collapse sidebar'}
            title={narrow ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {narrow ? (
              <PanelLeft className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </Button>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2">
        <ul className="flex flex-col gap-1">
          {navItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <motion.li
                key={item.href}
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  title={narrow ? item.label : undefined}
                  className={cn(
                    'relative flex items-center rounded-lg text-sm font-medium transition-colors',
                    narrow ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-sidebar-primary/15 text-sidebar-primary shadow-sm ring-1 ring-sidebar-primary/25'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  {isActive && !narrow && (
                    <span
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-sidebar-primary"
                      aria-hidden
                    />
                  )}
                  {isActive && narrow && (
                    <span
                      className="absolute inset-x-1 top-0 h-0.5 rounded-full bg-sidebar-primary"
                      aria-hidden
                    />
                  )}
                  <item.icon
                    className={cn(
                      'relative size-4 shrink-0',
                      isActive ? 'text-sidebar-primary' : 'opacity-80'
                    )}
                  />
                  {!narrow && <span className="relative">{item.label}</span>}
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border bg-sidebar/50 p-2 backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'gap-2 px-2',
                narrow ? 'h-11 w-full flex-col justify-center py-0' : 'w-full justify-start gap-3'
              )}
              title={narrow && user ? user.name : undefined}
            >
              <Avatar className={cn('shrink-0', narrow ? 'size-9' : 'size-8')}>
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {user ? getInitials(user.name) : '??'}
                </AvatarFallback>
              </Avatar>
              {!narrow && (
                <>
                  <div className="flex min-w-0 flex-1 flex-col items-start text-left">
                    <span className="truncate text-sm font-medium text-sidebar-foreground">
                      {user?.name || 'Loading...'}
                    </span>
                    <span className="w-full truncate text-xs text-sidebar-foreground/60">
                      {user?.email || ''}
                    </span>
                  </div>
                  <ChevronDown className="size-4 shrink-0 text-sidebar-foreground/60" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" side={narrow ? 'right' : 'top'}>
            <DropdownMenuItem disabled className="flex flex-col items-start">
              <span className="font-medium">{user?.name}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  )
}
