'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

// Fade in animation
export const FadeIn = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & { delay?: number }
>(({ children, delay = 0, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    transition={{ duration: 0.3, delay, ease: 'easeOut' }}
    {...props}
  >
    {children}
  </motion.div>
))
FadeIn.displayName = 'FadeIn'

// Stagger container for list animations
export const StaggerContainer = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & { staggerDelay?: number }
>(({ children, staggerDelay = 0.05, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial="hidden"
    animate="visible"
    exit="hidden"
    variants={{
      visible: {
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    }}
    {...props}
  >
    {children}
  </motion.div>
))
StaggerContainer.displayName = 'StaggerContainer'

// Stagger item for use inside StaggerContainer
export const StaggerItem = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.3, ease: 'easeOut' },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
StaggerItem.displayName = 'StaggerItem'

// Scale on hover card
export const HoverCard = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, className, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
)
HoverCard.displayName = 'HoverCard'

// Page transition wrapper
export const PageTransition = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'>
>(({ children, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    {...props}
  >
    {children}
  </motion.div>
))
PageTransition.displayName = 'PageTransition'

// Slide in from side
export const SlideIn = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & { direction?: 'left' | 'right' | 'up' | 'down' }
>(({ children, direction = 'left', ...props }, ref) => {
  const directionOffset = {
    left: { x: -30, y: 0 },
    right: { x: 30, y: 0 },
    up: { x: 0, y: -30 },
    down: { x: 0, y: 30 },
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...directionOffset[direction] }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  )
})
SlideIn.displayName = 'SlideIn'

// Number counter animation
export function AnimatedNumber({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {value}
    </motion.span>
  )
}

// Pulse animation for notifications/badges
export const Pulse = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
Pulse.displayName = 'Pulse'

// Shimmer loading skeleton
export function Shimmer({ className }: { className?: string }) {
  return (
    <motion.div
      className={`bg-muted rounded-md ${className}`}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        backgroundImage:
          'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
        backgroundSize: '200% 100%',
      }}
    />
  )
}
