import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Truck, RefreshCw, Headphones, Shield } from 'lucide-react'
import { MOCK_PRODUCTS, CATEGORIES } from '@/mocks/products.mock'
import { ProductCard } from '@/components/product/ProductCard'
import { formatCurrency } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: '💻', Books: '📚', Clothing: '👕',
  'Home & Kitchen': '🏠', Sports: '🏃', Beauty: '✨',
}

export default function HomePage() {
  const deals = MOCK_PRODUCTS.filter((p) => p.badge === 'Deal').slice(0, 6)
  const featured = MOCK_PRODUCTS.slice(0, 8)
  const bestSellers = MOCK_PRODUCTS.filter((p) => p.badge === 'Best Seller')

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-secondary to-accent text-white py-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Shop Everything,<br />
              <span className="text-primary">Delivered Fast</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Discover thousands of products at unbeatable prices with free shipping on orders over $50.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors text-lg"
            >
              Shop Now <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-4"
          >
            {MOCK_PRODUCTS.slice(0, 3).map((p, i) => (
              <motion.img
                key={p.id}
                src={p.imageUrl}
                alt={p.name}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
                className="w-28 h-28 md:w-36 md:h-36 rounded-xl object-cover shadow-xl hidden sm:block"
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${encodeURIComponent(cat)}`}
              className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-primary hover:shadow-md transition-all group"
            >
              <span className="text-3xl mb-2">{CATEGORY_ICONS[cat]}</span>
              <span className="text-sm font-medium text-gray-700 text-center group-hover:text-primary">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Deals of the Day */}
      <section className="bg-primary bg-opacity-10 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🔥</span>
            <h2 className="text-2xl font-bold text-gray-900">Deals of the Day</h2>
            <span className="ml-auto text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">Limited time offers</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {deals.map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                <img src={p.imageUrl} alt={p.name} className="w-full aspect-square object-cover rounded-md mb-2" />
                <p className="text-xs font-medium text-gray-800 line-clamp-1">{p.name}</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(p.price)}</p>
                <p className="text-xs text-gray-400 line-through">{formatCurrency(p.originalPrice)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Trending Now</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">⭐ Best Sellers</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {bestSellers.map((p) => (
            <Link
              key={p.id}
              to={`/products/${p.id}`}
              className="flex-shrink-0 w-40 bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow"
            >
              <img src={p.imageUrl} alt={p.name} className="w-full aspect-square object-cover rounded-md mb-2" />
              <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1">{p.name}</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(p.price)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: <Truck />, title: 'Free Shipping', sub: 'On orders over $50' },
            { icon: <RefreshCw />, title: 'Easy Returns', sub: '30-day return policy' },
            { icon: <Headphones />, title: '24/7 Support', sub: 'Always here to help' },
            { icon: <Shield />, title: 'Secure Payment', sub: 'SSL encrypted checkout' },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-3">
              <div className="text-primary">{b.icon}</div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{b.title}</p>
                <p className="text-xs text-gray-500">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
