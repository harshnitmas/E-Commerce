import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Eye, XCircle, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useOrdersList, useCancelOrder } from '@/hooks/useOrders'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'
import { formatCurrency, formatDate, truncateId } from '@/lib/utils'
import type { OrderStatus } from '@/api/types'

const STATUS_TABS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'All Orders', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Processing', value: 'Processing' },
  { label: 'Shipped', value: 'Shipped' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Cancelled', value: 'Cancelled' },
]

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(1)
  const [cancelDialog, setCancelDialog] = useState<{ id: string; reason: string } | null>(null)

  const { data, isLoading, refetch } = useOrdersList({
    status: statusFilter || undefined,
    page,
    pageSize: 10,
  })

  const cancelOrder = useCancelOrder()

  const handleCancel = async () => {
    if (!cancelDialog?.reason.trim()) { toast.error('Please enter a cancellation reason'); return }
    try {
      await cancelOrder.mutateAsync({ id: cancelDialog.id, reason: cancelDialog.reason })
      toast.success('Order cancelled successfully')
      setCancelDialog(null)
    } catch {
      toast.error('Failed to cancel order')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/orders/search"
            className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            <Search className="h-4 w-4" /> Search Orders
          </Link>
          <button onClick={() => refetch()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto mb-6 pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value as OrderStatus | ''); setPage(1) }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && data?.items.length === 0 && (
        <div className="text-center py-20">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">No orders found</p>
          <Link to="/products" className="text-primary hover:underline text-sm mt-2 inline-block">Start Shopping</Link>
        </div>
      )}

      <div className="space-y-4">
        {data?.items.map((order) => (
          <div key={order.orderId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 flex flex-wrap gap-4 text-xs text-gray-500 border-b border-gray-100">
              <span>ORDER PLACED<br /><strong className="text-gray-900 text-sm">{formatDate(order.createdAt)}</strong></span>
              <span>TOTAL<br /><strong className="text-gray-900 text-sm">{formatCurrency(order.totalAmount)}</strong></span>
              <span>CUSTOMER<br /><strong className="text-gray-900 text-sm">{order.customerId.slice(0, 12)}...</strong></span>
              <span className="ml-auto">ORDER # <strong className="text-gray-900">{truncateId(order.orderId)}</strong></span>
            </div>
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                {order.items.slice(0, 2).map((item) => (
                  <p key={item.orderItemId} className="text-sm text-gray-700">{item.productName} ×{item.quantity}</p>
                ))}
                {order.items.length > 2 && <p className="text-xs text-gray-400">+{order.items.length - 2} more items</p>}
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.status} />
                <Link to={`/orders/${order.orderId}`}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Eye className="h-4 w-4" /> View
                </Link>
                <Link to={`/orders/${order.orderId}/track`}
                  className="text-sm text-gray-600 hover:text-primary">Track</Link>
                {order.status === 'Pending' && (
                  <button
                    onClick={() => setCancelDialog({ id: order.orderId, reason: '' })}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:underline"
                  >
                    <XCircle className="h-4 w-4" /> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-md text-sm font-medium ${p === page ? 'bg-primary text-white' : 'bg-white border text-gray-600'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Cancel Dialog */}
      {cancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Order</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for cancellation.</p>
            <textarea
              value={cancelDialog.reason}
              onChange={(e) => setCancelDialog({ ...cancelDialog, reason: e.target.value })}
              placeholder="Enter reason..."
              rows={3}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-400 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={handleCancel} disabled={cancelOrder.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-md font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                Confirm Cancel
              </button>
              <button onClick={() => setCancelDialog(null)}
                className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors">
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
