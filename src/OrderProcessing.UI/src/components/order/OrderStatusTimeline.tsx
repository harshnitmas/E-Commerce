import { CheckCircle, Circle, XCircle } from 'lucide-react'
import { STATUS_STEPS } from '@/lib/constants'
import type { OrderStatus } from '@/api/types'

interface Props {
  status: OrderStatus
}

export function OrderStatusTimeline({ status }: Props) {
  const isCancelled = status === 'Cancelled'
  // 'Cancelled' is not in STATUS_STEPS; pin to idx 0 so the XCircle renders at the Pending step.
  const currentIdx = isCancelled ? 0 : STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number])

  return (
    <div className="flex items-center justify-between w-full py-4">
      {STATUS_STEPS.map((step, idx) => {
        const isCompleted = currentIdx > idx
        const isCurrent = currentIdx === idx && !isCancelled
        const isFuture = currentIdx < idx && !isCancelled

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              {isCancelled && idx === currentIdx ? (
                <XCircle className="h-8 w-8 text-red-500" />
              ) : isCompleted ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : isCurrent ? (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                </div>
              ) : (
                <Circle className={`h-8 w-8 ${isFuture ? 'text-gray-300' : 'text-gray-400'}`} />
              )}
              <span className={`mt-1 text-xs font-medium ${
                isCancelled && idx === 0 ? 'text-red-500' :
                isCurrent ? 'text-primary' :
                isCompleted ? 'text-green-600' :
                'text-gray-400'
              }`}>
                {isCancelled && idx === 0 ? 'Cancelled' : step}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
