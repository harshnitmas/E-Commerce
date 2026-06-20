import { ShoppingCart, User, Package, LayoutDashboard, Search, LogOut, ChevronDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'

export function Header() {
  const cartCount = useCartStore((s) => s.totalItems())
  const [query, setQuery] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    const looksLikeOrderId = /^[0-9a-f-]{6,36}$/i.test(query.trim())
    if (looksLikeOrderId) {
      navigate(`/orders/search?q=${encodeURIComponent(query.trim())}`)
    } else {
      navigate(`/products?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleLogout = () => {
    setShowMenu(false)
    logout()
    navigate('/login')
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

          {user?.role === 'admin' && (
            <Link to="/admin" className="flex flex-col items-center text-white hover:text-primary transition-colors text-xs gap-0.5">
              <LayoutDashboard className="h-5 w-5" />
              <span className="hidden sm:block">Admin</span>
            </Link>
          )}

          <Link to="/cart" className="relative flex flex-col items-center text-white hover:text-primary transition-colors text-xs gap-0.5">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
            <span className="hidden sm:block">Cart</span>
          </Link>

          {/* Account */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="flex flex-col items-center text-white hover:text-primary transition-colors text-xs gap-0.5"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:flex items-center gap-0.5">
                  {user.displayName.split(' ')[0]}
                  <ChevronDown className="h-3 w-3" />
                </span>
              </button>

              {showMenu && (
                <>
                  {/* Backdrop to close on outside click */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 w-52 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900">{user.displayName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">@{user.username}</p>
                      {user.email && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                      )}
                      {user.role === 'admin' && (
                        <span className="inline-block mt-1.5 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/login" className="flex flex-col items-center text-white hover:text-primary transition-colors text-xs gap-0.5">
              <User className="h-5 w-5" />
              <span className="hidden sm:block">Sign in</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
