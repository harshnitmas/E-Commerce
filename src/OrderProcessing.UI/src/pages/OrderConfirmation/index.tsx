import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Package, Home, List } from 'lucide-react'
import { MOCK_USER } from '@/mocks/user.mock'

export default function OrderConfirmationPage() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId') ?? ''

  useEffect(() => {
    // Simple confetti-like animation via DOM (no extra lib needed)
    const colors = ['#FF6B35', '#1A1A2E', '#16213E', '#FFD700', '#00CC66']
    const confettiCount = 80
    const container = document.body
    for (let i = 0; i < confettiCount; i++) {
      const el = document.createElement('div')
      el.style.cssText = `
        position:fixed;width:8px;height:8px;border-radius:50%;
        background:${colors[i % colors.length]};
        left:${Math.random() * 100}vw;top:-10px;
        animation:fall ${1.5 + Math.random()}s linear forwards;
        z-index:9999;opacity:0.8;
      `
      container.appendChild(el)
      setTimeout(() => el.remove(), 3000)
    }
    const style = document.createElement('style')
    style.textContent = '@keyframes fall{to{transform:translateY(110vh) rotate(720deg);opacity:0;}}'
    document.head.appendChild(style)
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-6" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-lg text-gray-600 mb-1">Thank you, {MOCK_USER.name.split(' ')[0]}!</p>
        <p className="text-gray-500 mb-2">
          Your order <span className="font-mono font-bold text-gray-900">#{orderId.slice(0, 8).toUpperCase()}</span> has been confirmed.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          A confirmation has been sent to <strong>{MOCK_USER.email}</strong>
        </p>

        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-0.5">Delivery Address</p>
              <p className="font-medium text-gray-900">{MOCK_USER.address.street}, {MOCK_USER.address.city}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Payment Method</p>
              <p className="font-medium text-gray-900">Visa ending 4242</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Estimated Delivery</p>
              <p className="font-medium text-gray-900">3–5 business days</p>
            </div>
            <div>
              <p className="text-gray-500 mb-0.5">Order Status</p>
              <p className="font-medium text-amber-600">Pending Processing</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/orders/${orderId}`}
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors">
            <Package className="h-5 w-5" /> Track Your Order
          </Link>
          <Link to="/orders"
            className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-semibold hover:border-primary hover:text-primary transition-colors">
            <List className="h-5 w-5" /> View All Orders
          </Link>
          <Link to="/"
            className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-semibold hover:border-primary hover:text-primary transition-colors">
            <Home className="h-5 w-5" /> Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
