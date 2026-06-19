import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Bot, User, Shield } from 'lucide-react'
import { useOrderAudit } from '@/hooks/useOrders'
import { formatDate, truncateId } from '@/lib/utils'
import { cn } from '@/lib/utils'

const EVENT_COLORS: Record<string, string> = {
  OrderCreated: 'bg-blue-50 border-blue-200',
  StatusChanged: 'bg-orange-50 border-orange-200',
  OrderCancelled: 'bg-red-50 border-red-200',
}

const EVENT_LABELS: Record<string, string> = {
  OrderCreated: '🟢 Order Created',
  StatusChanged: '🔄 Status Changed',
  OrderCancelled: '🔴 Order Cancelled',
}

export default function OrderAuditPage() {
  const { id } = useParams<{ id: string }>()
  const { data: events, isLoading } = useOrderAudit(id!)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to={`/orders/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Order
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Activity Log</h1>
      <p className="text-sm text-gray-500 mb-8">Order #{truncateId(id!)}</p>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!events || events.length === 0) && (
        <div className="text-center py-16 text-gray-400">No audit events found for this order.</div>
      )}

      <div className="space-y-3">
        {events?.map((event) => (
          <div key={event.id} className={cn('rounded-xl border p-4', EVENT_COLORS[event.eventType] ?? 'bg-gray-50 border-gray-200')}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{EVENT_LABELS[event.eventType] ?? event.eventType}</p>
                {event.previousStatus && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    <span className="font-medium">{event.previousStatus}</span>
                    {' → '}
                    <span className="font-medium">{event.newStatus}</span>
                  </p>
                )}
                {!event.previousStatus && (
                  <p className="text-sm text-gray-600 mt-0.5">Status: <span className="font-medium">{event.newStatus}</span></p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {event.triggeredBy === 'BackgroundJob' ? (
                    <Bot className="h-3.5 w-3.5 text-gray-500" />
                  ) : event.triggeredBy === 'Admin' ? (
                    <Shield className="h-3.5 w-3.5 text-gray-500" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-gray-500" />
                  )}
                  <span className="text-xs text-gray-500">{event.triggeredBy}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 whitespace-nowrap shrink-0">{formatDate(event.occurredAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
