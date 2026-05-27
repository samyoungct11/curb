import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { clamp } from '@/lib/utils'

interface ProgressRingProps {
  /** Value 0-1 */
  value: number
  size?: number
  stroke?: number
  color?: string
  trackColor?: string
  children?: ReactNode
}

export function ProgressRing({
  value,
  size = 180,
  stroke = 10,
  color = 'var(--color-brand)',
  trackColor = 'var(--surface-2)',
  children,
}: ProgressRingProps) {
  const v = clamp(value, 0, 1)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - v)

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}
