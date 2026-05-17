import * as React from "react"
import { cn } from "./utils"

const STATUS_STYLES = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Draft' },
  SUBMITTED: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', label: 'Submitted' },
  APPROVED: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Approved' },
  LOCKED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Locked' },
  RETURNED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Returned' },
}

export type StatusType = keyof typeof STATUS_STYLES;

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md', className, ...props }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.DRAFT;
  
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        style.bg,
        style.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-sm',
        className
      )}
      {...props}
    >
      <span className={cn("mr-1.5 rounded-full", style.dot, size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
      {style.label}
    </div>
  )
}
