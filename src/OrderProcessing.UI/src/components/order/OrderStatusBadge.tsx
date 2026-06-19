import { cn } from '@/lib/utils'
import { ORDER_STATUS_CONFIG } from '@/lib/constants'
import type { OrderStatus } from '@/api/types'

interface Props {
  status: OrderStatus
  size?: 'sm' | 'md'
}

export function OrderStatusBadge({ status, size = 'md' }: Props) {
  const config = ORDER_STATUS_CONFIG[status] ?? ORDER_STATUS_CONFIG.Pending
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
      {config.label}
    </span>
  )
}
