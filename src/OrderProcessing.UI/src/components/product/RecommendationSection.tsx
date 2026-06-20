import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, ShoppingCart, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { Product } from '@/mocks/products.mock'
import { useCartStore } from '@/stores/cart.store'
import { formatCurrency } from '@/lib/utils'

const GRADIENTS: Record<string, string> = {
  orange: 'from-orange-500 via-primary to-red-500',
  blue:   'from-blue-600 via-blue-700 to-indigo-800',
  purple: 'from-purple-600 via-violet-700 to-pink-600',
  green:  'from-emerald-500 via-teal-600 to-cyan-700',
}

type Props = {
  title: string
  subtitle?: string
  products: Product[]
  viewAllCategory?: string
  icon?: React.ReactNode
  gradient?: 'orange' | 'blue' | 'purple' | 'green'
}

function ProductRecommendCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
    setAdded(true)
    toast.success(`Added to cart!`)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex-shrink-0 w-48 rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
    >
      {/* Image + hover overlay */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.imageUrl}
          alt={product.name}
          width={192}
          height={192}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Dark overlay + Add to Cart on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <button
            onClick={handleAdd}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              added
                ? 'bg-green-500 text-white scale-95'
                : 'bg-white text-gray-900 hover:bg-primary hover:text-white'
            }`}
          >
            {added
              ? <><Check className="h-4 w-4" /> Added!</>
              : <><ShoppingCart className="h-4 w-4" /> Add to Cart</>
            }
          </button>
        </div>

        {/* Floating badges */}
        {product.badge && (
          <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
            {product.badge}
          </span>
        )}
        {product.discountPercent > 0 && (
          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
            -{product.discountPercent}%
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        <p className="text-xs text-gray-400 mb-0.5 truncate">{product.brand}</p>
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2">
          {product.name}
        </p>

        {/* Stars */}
        <div className="flex items-center gap-0.5 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < Math.round(product.rating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1">
            ({product.reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-gray-900">
            {formatCurrency(product.price)}
          </span>
          {product.discountPercent > 0 && (
            <span className="text-xs text-gray-400 line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function RecommendationSection({
  title,
  subtitle,
  products,
  viewAllCategory,
  icon,
  gradient = 'orange',
}: Props) {
  if (products.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="max-w-7xl mx-auto px-4 py-4"
    >
      {/* Gradient header */}
      <div
        className={`bg-gradient-to-r ${GRADIENTS[gradient]} rounded-t-2xl px-6 py-4 flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-white opacity-90 shrink-0">{icon}</span>
          )}
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {viewAllCategory && (
          <Link
            to={`/products?category=${encodeURIComponent(viewAllCategory)}`}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/35 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors shrink-0 ml-4"
          >
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Cards strip */}
      <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl px-5 pt-5 pb-4 shadow-sm">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
            >
              <ProductRecommendCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
