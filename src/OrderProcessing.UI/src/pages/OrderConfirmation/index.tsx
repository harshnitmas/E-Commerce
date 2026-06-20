import { useEffect } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Package, Home, List, MapPin, Truck, CreditCard, Clock } from 'lucide-react'
import { useOrder } from '@/hooks/useOrders'
import { MOCK_USER } from '@/mocks/user.mock'
import { DELIVERY_OPTIONS } from '@/lib/constants'
import { formatCurrency, formatDate, truncateId } from '@/lib/utils'

type NavState = { deliveryLabel?: string; deliveryPrice?: number } | null

export default function OrderConfirmationPage() {
  const [params] = useSearchParams()
  const location = useLocation()
  const orderId = params.get('orderId') ?? ''
  const navState = (location.state as NavState) ?? {}

  const deliveryOption = DELIVERY_OPTIONS.find((o) => o.id === navState.deliveryLabel)
  const { data: order, isLoading, isError } = useOrder(orderId)

  useEffect(() => {
    const colors = ['#FF6B35', '#1A1A2E', '#16213E', '#FFD700', '#00CC66']
    for (let i = 0; i < 80; i++) {
      const el = document.createElement('div')
      el.style.cssText = `position:fixed;width:8px;height:8px;border-radius:50%;background:${colors[i % colors.length]};left:${Math.random() * 100}vw;top:-10px;animation:fall ${1.5 + Math.random()}s linear forwards;z-index:9999;opacity:0.8;`
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 3000)
    }
    const style = document.createElement('style')
    style.textContent = '@keyframes fall{to{transform:translateY(110vh) rotate(720deg);opacity:0;}}'
    document.head.appendChild(style)
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Success header */}
      <div className="text-center mb-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Order Placed Successfully!</h1>
          <p className="text-gray-600">
            Thank you, <strong>{MOCK_USER.name.split(' ')[0]}</strong>! Your order{' '}
            <span className="font-mono font-bold text-gray-900">#{truncateId(orderId)}</span> is confirmed.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            A confirmation has been sent to <strong>{MOCK_USER.email}</strong>
          </p>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        {/* Order details card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
          {/* Meta info row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 border-b border-gray-100">
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-0.5">Order ID</p>
              <p className="font-mono text-sm font-bold text-gray-900">#{truncateId(orderId)}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-0.5">Status</p>
              <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {isLoading ? '—' : order?.status ?? 'Pending'}
              </span>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-0.5">Placed</p>
              <p className="text-sm font-medium text-gray-900">
                {isLoading ? '—' : order ? formatDate(order.createdAt) : '—'}
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-0.5">Est. Delivery</p>
              <p className="text-sm font-medium text-gray-900">
                {deliveryOption?.description ?? '3–5 business days'}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Items Ordered</h3>

            {isLoading && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex justify-between animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-48" />
                    <div className="h-4 bg-gray-100 rounded w-16" />
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <p className="text-sm text-red-500">Could not load order details. Check your Orders page.</p>
            )}

            {order && (
              <div className="divide-y divide-gray-50">
                {order.items.map((item) => (
                  <div key={item.orderItemId} className="flex items-center justify-between py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 ml-4 shrink-0">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          {order && (
            <div className="bg-gray-50 px-5 py-4 space-y-1.5 text-sm border-t border-gray-100">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.totalAmount - (navState.deliveryPrice ?? 0) - order.totalAmount * 0.091)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{navState.deliveryPrice === 0 ? 'FREE' : formatCurrency(navState.deliveryPrice ?? 0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (10%)</span>
                <span>{formatCurrency(order.totalAmount * 0.091)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Paid</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Shipping / delivery / payment info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Shipping to</p>
              <p className="text-sm font-medium text-gray-900">{MOCK_USER.name}</p>
              <p className="text-xs text-gray-500">{MOCK_USER.address.street}, {MOCK_USER.address.city}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
            <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Delivery</p>
              <p className="text-sm font-medium text-gray-900">{deliveryOption?.label ?? 'Standard'}</p>
              <p className="text-xs text-gray-500">{navState.deliveryPrice === 0 ? 'FREE' : formatCurrency(navState.deliveryPrice ?? 0)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
            <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Payment</p>
              <p className="text-sm font-medium text-gray-900">Visa •••• 4242</p>
              <p className="text-xs text-green-600 font-medium">Charged successfully</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/orders/${orderId}`}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            <Package className="h-5 w-5" /> Track Order
          </Link>
          <Link
            to="/orders"
            className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            <Clock className="h-5 w-5" /> Order History
          </Link>
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            <Home className="h-5 w-5" /> Keep Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
