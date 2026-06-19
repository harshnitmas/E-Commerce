import { ShoppingCart, User, Package, LayoutDashboard, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCartStore } from '@/stores/cart.store'
import { MOCK_USER } from '@/mocks/user.mock'

export function Header() {
  const cartCount = useCartStore((s) => s.totalItems())
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate(`/products?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 z-50 bg-secondary shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-primary shrink-0">
          ShopNow
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="flex rounded-md overflow-hidden">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-4 py-2 text-sm text-gray-900 outline-none"
            />
            <button type="submit" className="bg-primary px-4 text-white hover:bg-orange-600 transition-colors">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Nav icons */}
        <nav className="flex items-center gap-3 shrink-0">
          <Link to="/orders" className="flex flex-col items-center text-white hover:text-primary transition-colors text-xs gap-0.5">
            <Package className="h-5 w-5" />
            <span className="hidden sm:block">Orders</span>
          </Link>
          <Link to="/admin" className="flex flex-col items-center text-white hover:text-primary transition-colors text-xs gap-0.5">
            <LayoutDashboard className="h-5 w-5" />
            <span className="hidden sm:block">Admin</span>
          </Link>
          <div className="flex flex-col items-center text-white text-xs gap-0.5">
            <User className="h-5 w-5" />
            <span className="hidden sm:block">{MOCK_USER.name.split(' ')[0]}</span>
          </div>
          <Link to="/cart" className="relative flex flex-col items-center text-white hover:text-primary transition-colors text-xs gap-0.5">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
            <span className="hidden sm:block">Cart</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
