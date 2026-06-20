import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useOrder, useCancelOrder } from '@/hooks/useOrders'
import { useAuthStore } from '@/stores/auth.store'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'
import { OrderStatusTimeline } from '@/components/order/OrderStatusTimeline'
import { formatCurrency, formatDate, truncateId } from '@/lib/utils'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const customerId = useAuthStore((s) => s.user?.customerId)
  const { data: order, isLoading } = useOrder(id!, customerId)
  const cancelOrder = useCancelOrder()
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="h-96 bg-gray-100 rounded-xl animate-pulse" /></div>
  if (!order) return <div className="text-center py-24 text-gray-500">Order not found</div>

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Please enter a reason'); return }
    try {
      await cancelOrder.mutateAsync({ id: order.orderId, reason: cancelReason })
      toast.success('Order cancelled')
      setShowCancel(false)
    } catch {
      toast.error('Failed to cancel order')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{truncateId(order.orderId)}</h1>
          <p className="text-sm text-gray-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Order Progress</h2>
        <OrderStatusTimeline status={order.status} />
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Items Ordered</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Product</th>
              <th className="pb-2 text-center">Qty</th>
              <th className="pb-2 text-right">Unit Price</th>
              <th className="pb-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <tr key={item.orderItemId}>
                <td className="py-3 font-medium text-gray-900">{item.productName}</td>
                <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                <td className="py-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-right font-medium">{formatCurrency(item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td colSpan={3} className="pt-3 text-right font-bold text-gray-900">Order Total</td>
              <td className="pt-3 text-right font-bold text-primary text-lg">{formatCurrency(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Payment</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>💳</span> <span>Visa ending 4242</span>
          <span className="ml-2 text-green-600 font-medium">✓ Paid</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to={`/orders/${order.orderId}/track`}
          className="bg-primary text-white px-5 py-2.5 rounded-md font-medium hover:bg-orange-600 transition-colors text-sm">
          Track Order
        </Link>
        <Link to={`/orders/${order.orderId}/audit`}
          className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-md font-medium hover:border-primary hover:text-primary transition-colors text-sm">
          View Audit Log
        </Link>
        {order.status === 'Pending' && (
          <button onClick={() => setShowCancel(true)}
            className="flex items-center gap-1.5 border border-red-200 text-red-500 px-5 py-2.5 rounded-md font-medium hover:bg-red-50 transition-colors text-sm">
            <XCircle className="h-4 w-4" /> Cancel Order
          </button>
        )}
      </div>

      {showCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-3">Cancel Order</h3>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              rows={3} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-400 mb-4" />
            <div className="flex gap-3">
              <button onClick={handleCancel} disabled={cancelOrder.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-md font-medium disabled:opacity-50">
                Confirm
              </button>
              <button onClick={() => setShowCancel(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-md font-medium">
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
