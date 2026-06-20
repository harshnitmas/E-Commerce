import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Truck, RefreshCw, Headphones, Shield, Clock, Sparkles, ShoppingBag, Star, ShoppingCart, TrendingUp } from 'lucide-react'
import { MOCK_PRODUCTS, CATEGORIES } from '@/mocks/products.mock'
import { ProductCard } from '@/components/product/ProductCard'
import { RecommendationSection } from '@/components/product/RecommendationSection'
import { useRecommendations } from '@/hooks/useRecommendations'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: '💻', Books: '📚', Clothing: '👕',
  'Home & Kitchen': '🏠', Sports: '🏃', Beauty: '✨',
}

export default function HomePage() {
  const deals = MOCK_PRODUCTS.filter((p) => p.badge === 'Deal').slice(0, 5)
  const featured = MOCK_PRODUCTS.slice(0, 8)
  const bestSellers = MOCK_PRODUCTS.filter((p) => p.badge === 'Best Seller')
  const { recentlyViewed, basedOnBrowsing, basedOnOrders, popularPicks } = useRecommendations()
  const user = useAuthStore((s) => s.user)
  const addItem = useCartStore((s) => s.addItem)

  const hasPersonalRecs = recentlyViewed.length > 0 || basedOnBrowsing.length > 0 || basedOnOrders.length > 0

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-secondary to-accent text-white py-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
            {user && (
              <p className="text-primary font-semibold mb-2">
                Welcome back, {user.displayName.split(' ')[0]}!
              </p>
            )}
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
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-4">
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

      {/* ── RECOMMENDATIONS ── */}
      <div className="pt-6 pb-2">
        {/* Personalised sections — only once the user has browsing/order history */}
        {recentlyViewed.length > 0 && (
          <RecommendationSection
            title="Recently Viewed"
            subtitle="Pick up where you left off"
            products={recentlyViewed}
            icon={<Clock className="h-6 w-6" />}
            gradient="blue"
          />
        )}

        {basedOnBrowsing.length > 0 && (
          <RecommendationSection
            title="Based on Your Browsing History"
            subtitle="Tailored picks from your recent activity"
            products={basedOnBrowsing}
            viewAllCategory={basedOnBrowsing[0]?.category}
            icon={<Sparkles className="h-6 w-6" />}
            gradient="orange"
          />
        )}

        {basedOnOrders.length > 0 && (
          <RecommendationSection
            title="Inspired by Your Orders"
            subtitle="More from the categories you love"
            products={basedOnOrders}
            viewAllCategory={basedOnOrders[0]?.category}
            icon={<ShoppingBag className="h-6 w-6" />}
            gradient="purple"
          />
        )}

        {/* Always-visible fallback — shown when no personal history yet */}
        {!hasPersonalRecs && (
          <RecommendationSection
            title="Popular Right Now"
            subtitle="Top-rated picks loved by our customers"
            products={popularPicks}
            icon={<TrendingUp className="h-6 w-6" />}
            gradient="green"
          />
        )}
      </div>

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
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-xl p-2.5">
                <span className="text-2xl leading-none">🔥</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Deals of the Day</h2>
                <p className="text-sm text-gray-400">Handpicked offers — updated daily</p>
              </div>
            </div>
            <Link to="/products" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-orange-600 transition-colors">
              View all deals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {deals.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden"
              >
                <Link to={`/products/${p.id}`} className="flex flex-col flex-1">
                  {/* Image */}
                  <div className="relative overflow-hidden bg-gray-50">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    {/* Discount badge */}
                    <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                      -{p.discountPercent}%
                    </span>
                    {/* Savings chip */}
                    <span className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-green-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      Save {formatCurrency(p.originalPrice - p.price)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{p.brand}</p>
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug flex-1">{p.name}</p>
                    <div className="flex items-center gap-1 mt-2 mb-3">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-gray-500 font-medium">{p.rating}</span>
                      <span className="text-xs text-gray-300 ml-0.5">({p.reviewCount.toLocaleString()})</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-auto">
                      <span className="text-lg font-bold text-primary">{formatCurrency(p.price)}</span>
                      <span className="text-xs text-gray-400 line-through">{formatCurrency(p.originalPrice)}</span>
                    </div>
                  </div>
                </Link>

                {/* Add to cart */}
                <div className="px-4 pb-4">
                  <button
                    onClick={() => { addItem(p); toast.success(`${p.name} added to cart!`) }}
                    className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold text-sm py-2.5 rounded-xl transition-colors duration-150"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Now */}
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
              className="flex-shrink-0 w-40 bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow flex flex-col"
            >
              <img src={p.imageUrl} alt={p.name} className="w-full aspect-square object-cover rounded-md mb-2" />
              <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1 flex-1">{p.name}</p>
              <p className="text-sm font-bold text-gray-900 mt-auto">{formatCurrency(p.price)}</p>
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
