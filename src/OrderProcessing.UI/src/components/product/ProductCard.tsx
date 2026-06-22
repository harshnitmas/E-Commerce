import { ShoppingCart, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart.store'
import { formatCurrency } from '@/lib/utils'
import { useProductStock } from '@/hooks/useProducts'
import type { Product } from '@/mocks/products.mock'

interface Props {
  product: Product
}

export function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const liveStock = useProductStock(product.id)

  const available = liveStock?.availableQuantity ?? product.stockCount
  const inStock = liveStock ? liveStock.inStock : product.inStock

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!inStock) return
    addItem(product)
    toast.success(`${product.name} added to cart!`)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <Link to={`/products/${product.id}`} className="flex flex-col flex-1">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          {product.badge && (
            <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {product.badge}
            </span>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col flex-1">
          <p className="text-xs text-gray-500 mb-0.5">{product.brand}</p>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs text-gray-600">{product.rating} ({product.reviewCount.toLocaleString()})</span>
          </div>
          <div className="mt-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
              {product.discountPercent > 0 && (
                <>
                  <span className="text-xs text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                  <span className="text-xs font-medium text-green-600">-{product.discountPercent}%</span>
                </>
              )}
            </div>
            {inStock && available <= 10 && (
              <p className="text-xs text-red-500 mb-1">
                {available <= 3 ? `Only ${available} left — order soon!` : `${available} left in stock`}
              </p>
            )}
          </div>
        </div>
      </Link>
      <div className="px-3 pb-3">
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="h-4 w-4" />
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </motion.div>
  )
}
