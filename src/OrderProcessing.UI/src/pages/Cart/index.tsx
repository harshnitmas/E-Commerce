import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Minus, Plus, ShoppingBag, Tag, Sparkles } from 'lucide-react'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart.store'
import { MOCK_PRODUCTS } from '@/mocks/products.mock'
import { RecommendationSection } from '@/components/product/RecommendationSection'
import { formatCurrency } from '@/lib/utils'
import { PROMO_CODES } from '@/lib/constants'

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore()
  const [promoInput, setPromoInput] = useState('')
  const [discount, setDiscount] = useState(0)
  const navigate = useNavigate()

  const cartProductIds = new Set(items.map((i) => i.product.id))
  const youMightLike = useMemo(() => {
    const cartCategories = [...new Set(items.map((i) => i.product.category))]
    return cartCategories
      .flatMap((cat) =>
        MOCK_PRODUCTS.filter((p) => p.category === cat && !cartProductIds.has(p.id))
          .sort((a, b) => b.rating - a.rating)
      )
      .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
      .slice(0, 8)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const applyPromo = () => {
    const pct = PROMO_CODES[promoInput.toUpperCase()]
    if (pct) {
      setDiscount(pct)
      toast.success(`Promo applied! ${pct * 100}% off`)
    } else {
      toast.error('Invalid promo code')
    }
  }

  const sub = subtotal()
  const discountAmt = sub * discount
  const shipping = sub > 50 ? 0 : 4.99
  const tax = (sub - discountAmt) * 0.1
  const total = sub - discountAmt + shipping + tax

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Start shopping to add items to your cart.</p>
        <Link to="/products" className="bg-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart ({items.length} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
              <img src={product.imageUrl} alt={product.name}
                className="w-20 h-20 object-cover rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <Link to={`/products/${product.id}`} className="font-medium text-gray-900 hover:text-primary line-clamp-2">
                  {product.name}
                </Link>
                <p className="text-sm text-gray-500">{product.brand}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(product.price)}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button onClick={() => removeItem(product.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button onClick={() => updateQuantity(product.id, quantity - 1)} className="px-2 py-1 hover:bg-gray-50">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">{quantity}</span>
                  <button onClick={() => updateQuantity(product.id, quantity + 1)} className="px-2 py-1 hover:bg-gray-50">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(product.price * quantity)}</p>
              </div>
            </div>
          ))}

          <Link to="/products" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2">
            ← Continue Shopping
          </Link>
        </div>


        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatCurrency(sub)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({discount * 100}%)</span><span>-{formatCurrency(discountAmt)}</span></div>}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600">FREE</span> : formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-600">Tax (10%)</span><span>{formatCurrency(tax)}</span></div>
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Promo */}
            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input value={promoInput} onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Promo code"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-primary" />
              </div>
              <button onClick={applyPromo} className="px-3 py-2 text-sm border border-primary text-primary rounded-md hover:bg-primary hover:text-white transition-colors">
                Apply
              </button>
            </div>

            <button onClick={() => navigate('/checkout')}
              className="w-full bg-primary text-white py-3 rounded-md font-bold hover:bg-orange-600 transition-colors">
              Proceed to Checkout
            </button>

            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
              🔒 Safe and Secure Checkout
            </div>
          </div>
        </div>
      </div>

      {/* You might also like */}
      {youMightLike.length > 0 && (
        <div className="mt-10">
          <RecommendationSection
            title="You Might Also Like"
            subtitle="More great picks based on your cart"
            products={youMightLike}
            icon={<Sparkles className="h-6 w-6" />}
            gradient="green"
          />
        </div>
      )}
    </div>
  )
}
