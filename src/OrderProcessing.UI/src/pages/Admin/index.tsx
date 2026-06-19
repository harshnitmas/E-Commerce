import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, XCircle, RefreshCw, TrendingUp, Package, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useOrdersList, useUpdateOrderStatus, useCancelOrder } from '@/hooks/useOrders'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'
import { formatCurrency, formatDate, truncateId } from '@/lib/utils'
import type { OrderStatus } from '@/api/types'

const VALID_NEXT: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Processing'],
  Processing: ['Shipped'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
}

export default function AdminPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const { data, isLoading, refetch } = useOrdersList({
    status: statusFilter || undefined, page, pageSize: 15,
  })
  const updateStatus = useUpdateOrderStatus()
  const cancelOrder = useCancelOrder()

  const stats = [
    { label: 'Total Orders', value: data?.totalCount ?? '—', icon: <Package />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending', value: '—', icon: <Clock />, color: 'text-amber-600 bg-amber-50' },
    { label: 'Processing', value: '—', icon: <TrendingUp />, color: 'text-purple-600 bg-purple-50' },
    { label: 'Delivered', value: '—', icon: <CheckCircle />, color: 'text-green-600 bg-green-50' },
  ]

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success(`Order updated to ${status}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this order?')) return
    try {
      await cancelOrder.mutateAsync({ id, reason: 'Admin cancellation' })
      toast.success('Order cancelled')
    } catch {
      toast.error('Failed to cancel order')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mt-1">
            ⚠️ Admin View — Internal Use Only
          </div>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as (OrderStatus | '')[]).map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : data?.items.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{truncateId(order.orderId)}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-[120px] truncate">{order.customerId.slice(5, 15)}...</td>
                  <td className="px-4 py-3 text-gray-600">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} size="sm" /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/orders/${order.orderId}`} className="text-primary hover:underline text-xs">
                        <Eye className="h-4 w-4" />
                      </Link>
                      {VALID_NEXT[order.status].map((next) => (
                        <button key={next} onClick={() => handleUpdateStatus(order.orderId, next)}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors">
                          → {next}
                        </button>
                      ))}
                      {order.status === 'Pending' && (
                        <button onClick={() => handleCancel(order.orderId)}
                          className="text-red-400 hover:text-red-600 transition-colors">
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
