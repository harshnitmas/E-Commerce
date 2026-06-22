import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, XCircle, RefreshCw, TrendingUp, Package, Clock, CheckCircle, RotateCcw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useOrdersList, useUpdateOrderStatus, useCancelOrder } from '@/hooks/useOrders'
import { useProcessRefund } from '@/hooks/useProducts'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'
import { formatCurrency, formatDate, truncateId } from '@/lib/utils'
import type { OrderStatus } from '@/api/types'

type AdminTab = 'orders' | 'refunds'

const VALID_NEXT: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Processing'],
  Processing: ['Shipped'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
  RefundRequested: [],
  RefundApproved: [],
  RefundRejected: [],
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [refundSearch, setRefundSearch] = useState('')

  const { data, isLoading, refetch } = useOrdersList({
    status: statusFilter || undefined, page, pageSize: 15,
  })
  const { data: refundData, isLoading: refundLoading, refetch: refetchRefunds } = useOrdersList({
    status: 'RefundRequested', page: 1, pageSize: 50,
  })

  const updateStatus = useUpdateOrderStatus()
  const cancelOrder = useCancelOrder()
  const processRefund = useProcessRefund()

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

  const handleRefund = async (orderId: string, approve: boolean) => {
    const action = approve ? 'approve' : 'reject'
    if (!confirm(`${approve ? 'Approve' : 'Reject'} this refund? ${approve ? 'Stock will be restored.' : ''}`)) return
    try {
      await processRefund.mutateAsync({ orderId, approve })
      toast.success(`Refund ${action}d successfully`)
      refetchRefunds()
    } catch {
      toast.error(`Failed to ${action} refund`)
    }
  }

  const filteredRefunds = refundData?.items.filter((o) => {
    if (!refundSearch.trim()) return true
    const q = refundSearch.toLowerCase()
    return o.orderId.toLowerCase().includes(q) || o.customerId.toLowerCase().includes(q)
  }) ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mt-1">
            ⚠️ Admin View — Internal Use Only
          </div>
        </div>
        <button onClick={() => { refetch(); refetchRefunds() }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary">
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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Orders
        </button>
        <button
          onClick={() => setActiveTab('refunds')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'refunds' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <RotateCcw className="h-4 w-4" />
          Refund Requests
          {(refundData?.totalCount ?? 0) > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
              {refundData?.totalCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Orders Tab ── */}
      {activeTab === 'orders' && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {(['', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'RefundRequested', 'RefundApproved'] as (OrderStatus | '')[]).map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {s || 'All'}
              </button>
            ))}
          </div>

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
        </>
      )}

      {/* ── Refunds Tab ── */}
      {activeTab === 'refunds' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={refundSearch}
                onChange={(e) => setRefundSearch(e.target.value)}
                placeholder="Search by Order ID or Customer ID..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {refundLoading && (
            <div className="p-8 text-center text-gray-400 text-sm">Loading refund requests...</div>
          )}

          {!refundLoading && filteredRefunds.length === 0 && (
            <div className="p-12 text-center">
              <RotateCcw className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No refund requests</p>
              <p className="text-xs text-gray-400 mt-1">Refund requests from customers will appear here.</p>
            </div>
          )}

          {filteredRefunds.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Requested</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRefunds.map((order) => (
                    <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600 block">{truncateId(order.orderId)}</span>
                        <span className="text-xs text-gray-400">{order.orderId}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px]">
                        <span className="block truncate">{order.customerId}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.items.slice(0, 2).map((i) => (
                          <p key={i.orderItemId} className="text-xs">{i.productName} ×{i.quantity}</p>
                        ))}
                        {order.items.length > 2 && <p className="text-xs text-gray-400">+{order.items.length - 2} more</p>}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(order.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/orders/${order.orderId}`} className="text-primary">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleRefund(order.orderId, true)}
                            disabled={processRefund.isPending}
                            className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50 font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRefund(order.orderId, false)}
                            disabled={processRefund.isPending}
                            className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
