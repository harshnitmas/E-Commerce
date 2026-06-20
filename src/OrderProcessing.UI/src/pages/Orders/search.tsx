import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Package, Eye, ArrowLeft } from 'lucide-react'
import { useOrdersList } from '@/hooks/useOrders'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'
import { formatCurrency, formatDate, truncateId } from '@/lib/utils'
import type { OrderDto } from '@/api/types'

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function matchesOrder(order: OrderDto, q: string): boolean {
  const lower = q.toLowerCase()
  if (order.orderId.toLowerCase().includes(lower)) return true
  if (order.orderId.slice(0, 8).toLowerCase().includes(lower)) return true
  return order.items.some((item) => item.productName.toLowerCase().includes(lower))
}

export default function OrderSearchPage() {
  const [urlParams] = useSearchParams()
  const [query, setQuery] = useState(urlParams.get('q') ?? '')

  // Sync URL ?q= param into the input on first load
  useEffect(() => {
    const q = urlParams.get('q')
    if (q) setQuery(q)
  }, [urlParams])

  // Fetch up to 100 orders so we can filter client-side without pagination
  const { data, isLoading } = useOrdersList({ page: 1, pageSize: 100 })

  const results = useMemo<OrderDto[]>(() => {
    if (!data?.items) return []
    const q = query.trim()
    if (!q) return data.items
    return data.items.filter((o) => matchesOrder(o, q))
  }, [data, query])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Search Orders</h1>
      <p className="text-sm text-gray-500 mb-6">Search by order ID or product name</p>

      {/* Search input */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`e.g. "UltraBook Pro" or "77988021"`}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-base shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Result count */}
      {!isLoading && query.trim() && (
        <p className="text-sm text-gray-500 mb-4">
          {results.length === 0
            ? 'No orders match your search'
            : `${results.length} order${results.length !== 1 ? 's' : ''} found`}
        </p>
      )}

      {/* No query yet — show all */}
      {!isLoading && !query.trim() && (
        <p className="text-sm text-gray-400 mb-4">
          Showing all {data?.items.length ?? 0} orders — start typing to filter
        </p>
      )}

      {/* Results */}
      <div className="space-y-3">
        {results.map((order) => {
          const matchedItems = order.items.filter((item) =>
            query.trim() ? item.productName.toLowerCase().includes(query.toLowerCase()) : true
          )
          const displayItems = query.trim() && matchedItems.length > 0 ? matchedItems : order.items

          return (
            <div
              key={order.orderId}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-primary/30 transition-colors"
            >
              {/* Header strip */}
              <div className="bg-gray-50 px-5 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500 border-b border-gray-100">
                <span>
                  ORDER{' '}
                  <span className="font-mono font-bold text-gray-900">
                    #{highlight(truncateId(order.orderId), query)}
                  </span>
                </span>
                <span>
                  {formatDate(order.createdAt)}
                </span>
                <span className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                <span className="ml-auto">
                  <OrderStatusBadge status={order.status} />
                </span>
              </div>

              {/* Items + actions */}
              <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  {displayItems.slice(0, 3).map((item) => (
                    <div key={item.orderItemId} className="flex items-center gap-2 text-sm text-gray-700 mb-0.5">
                      <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">
                        {highlight(item.productName, query)}
                      </span>
                      <span className="text-gray-400 shrink-0">×{item.quantity}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs text-gray-400 ml-5">+{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    to={`/orders/${order.orderId}`}
                    className="flex items-center gap-1.5 text-sm bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                  <Link
                    to={`/orders/${order.orderId}/track`}
                    className="text-sm text-gray-500 hover:text-primary transition-colors"
                  >
                    Track
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {!isLoading && query.trim() && results.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No orders matching "{query}"</p>
          <p className="text-sm text-gray-400 mt-1">Try the order ID or a product you ordered</p>
        </div>
      )}

      {/* No orders at all */}
      {!isLoading && !query.trim() && results.length === 0 && (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No orders yet</p>
          <Link to="/products" className="text-primary hover:underline text-sm mt-2 inline-block">
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  )
}
