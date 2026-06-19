import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, ShoppingCart, Minus, Plus, ArrowLeft, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { MOCK_PRODUCTS } from '@/mocks/products.mock'
import { useCartStore } from '@/stores/cart.store'
import { formatCurrency } from '@/lib/utils'
import { ProductCard } from '@/components/product/ProductCard'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const product = MOCK_PRODUCTS.find((p) => p.id === id)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const addItem = useCartStore((s) => s.addItem)

  if (!product) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500 mb-4">Product not found.</p>
        <Link to="/products" className="text-primary hover:underline">Back to Products</Link>
      </div>
    )
  }

  const allImages = [product.imageUrl, ...product.thumbnails]
  const related = MOCK_PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  const handleAddToCart = () => {
    addItem(product, qty)
    setAdded(true)
    toast.success('Added to cart!')
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    addItem(product, qty)
    navigate('/checkout')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
        {/* Image Gallery */}
        <div>
          <div className="rounded-xl overflow-hidden bg-gray-50 aspect-square mb-3">
            <img src={allImages[activeImg]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === activeImg ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm text-gray-500 mb-1">{product.brand} · {product.category}</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>

          <div className="flex items-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
            ))}
            <span className="text-sm text-gray-600">{product.rating} ({product.reviewCount.toLocaleString()} ratings)</span>
          </div>

          <div className="flex items-end gap-3 mb-4">
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
            {product.discountPercent > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                  Save {product.discountPercent}%
                </span>
              </>
            )}
          </div>

          <p className={`text-sm font-medium mb-4 ${product.inStock ? 'text-green-600' : 'text-red-500'}`}>
            {product.inStock ? `In Stock (${product.stockCount} available)` : 'Out of Stock'}
          </p>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            <div className="flex items-center border border-gray-200 rounded-md">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-gray-50">
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 font-medium">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stockCount, qty + 1))} className="px-3 py-2 hover:bg-gray-50">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-8">
            <motion.button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span key="added" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <Check className="h-5 w-5" /> Added!
                  </motion.span>
                ) : (
                  <motion.span key="add" className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" /> Add to Cart
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <button
              onClick={handleBuyNow}
              disabled={!product.inStock}
              className="bg-secondary text-white py-3 rounded-md font-semibold hover:bg-accent transition-colors disabled:opacity-50"
            >
              Buy Now
            </button>
          </div>

          <ul className="space-y-1 mb-6">
            {product.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-500 shrink-0" /> {f}
              </li>
            ))}
          </ul>

          <div className="text-xs text-gray-400">SKU: {product.sku}</div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
