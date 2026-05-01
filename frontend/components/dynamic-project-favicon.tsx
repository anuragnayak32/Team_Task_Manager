'use client'

import { useEffect, useRef } from 'react'
import { faviconDataUrlFromProjectName } from '@/lib/favicon-from-project-name'

/** Updates the tab icon for the current project; restores the default when you navigate away. */
export function DynamicProjectFavicon({
  projectName,
}: {
  projectName: string | undefined
}) {
  const defaultHref = useRef<string | null>(null)

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) return

    if (defaultHref.current === null) {
      defaultHref.current = link.getAttribute('href') || '/icon'
    }

    const reset = () => {
      if (defaultHref.current) link.href = defaultHref.current
    }

    if (!projectName?.trim()) {
      reset()
      return
    }

    link.href = faviconDataUrlFromProjectName(projectName)
    return reset
  }, [projectName])

  return null
}
