import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Truck } from 'lucide-react'
import { useOrder } from '@/hooks/useOrders'
import { useAuthStore } from '@/stores/auth.store'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'
import { formatDate, truncateId } from '@/lib/utils'
import type { OrderStatus } from '@/api/types'

function getTrackingEvents(status: OrderStatus, createdAt: string) {
  const base = new Date(createdAt)
  const at = (offsetMs: number) => new Date(base.getTime() + offsetMs).toISOString()

  const events = [
    { label: 'Order Confirmed', sub: 'Your order has been received', time: at(0), done: true },
    { label: 'Order Processing', sub: 'Preparing your package', time: at(3.6e6), done: ['Processing', 'Shipped', 'Delivered'].includes(status) },
    { label: 'Picked Up by Courier', sub: 'SwiftShip Express picked up your package', time: at(7.2e6), done: ['Shipped', 'Delivered'].includes(status) },
    { label: 'In Transit', sub: 'Package is on its way', time: at(10.8e6), done: ['Shipped', 'Delivered'].includes(status) },
    { label: 'Out for Delivery', sub: 'Your package will arrive today', time: at(14.4e6), done: status === 'Delivered' },
    { label: 'Delivered', sub: 'Package delivered successfully', time: at(18e6), done: status === 'Delivered' },
  ]
  return events
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>()
  const customerId = useAuthStore((s) => s.user?.customerId)
  const { data: order, isLoading } = useOrder(id!, customerId)

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-8"><div className="h-96 bg-gray-100 rounded-xl animate-pulse" /></div>
  if (!order) return <div className="text-center py-24 text-gray-500">Order not found</div>

  const events = getTrackingEvents(order.status, order.createdAt)
  const trackingNum = `TRK${order.orderId.slice(0, 8).toUpperCase()}`

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to={`/orders/${order.orderId}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Order
      </Link>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Track Order #{truncateId(order.orderId)}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Tracking: <span className="font-mono font-medium">{trackingNum}</span></p>
            <p className="text-sm text-gray-500">Carrier: <span className="font-medium">SwiftShip Express</span></p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Route Illustration */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 flex items-center justify-between mb-2">
          <div className="text-center">
            <MapPin className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-700">San Jose, CA</p>
            <p className="text-xs text-gray-400">Origin</p>
          </div>
          <div className="flex-1 relative mx-4">
            <div className="h-1 bg-gray-200 rounded-full">
              <div className="h-1 bg-primary rounded-full" style={{
                width: order.status === 'Pending' ? '10%' :
                       order.status === 'Processing' ? '30%' :
                       order.status === 'Shipped' ? '65%' : '100%'
              }} />
            </div>
            <Truck className="absolute top-1/2 -translate-y-1/2 h-5 w-5 text-primary" style={{
              left: order.status === 'Pending' ? '8%' :
                    order.status === 'Processing' ? '28%' :
                    order.status === 'Shipped' ? '63%' : '95%'
            }} />
          </div>
          <div className="text-center">
            <MapPin className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-700">San Francisco, CA</p>
            <p className="text-xs text-gray-400">Destination</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Tracking Timeline</h2>
        <div className="relative pl-8">
          {events.map((ev, idx) => (
            <div key={idx} className={`relative pb-6 ${idx === events.length - 1 ? '' : 'before:absolute before:left-[-17px] before:top-3 before:h-full before:w-0.5 before:bg-gray-200'}`}>
              <div className={`absolute left-[-21px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${ev.done ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>
                {ev.done && <span className="text-white text-xs">✓</span>}
              </div>
              <p className={`font-medium text-sm ${ev.done ? 'text-gray-900' : 'text-gray-400'}`}>{ev.label}</p>
              <p className={`text-xs ${ev.done ? 'text-gray-500' : 'text-gray-300'}`}>{ev.sub}</p>
              {ev.done && <p className="text-xs text-gray-400 mt-0.5">{formatDate(ev.time)}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
