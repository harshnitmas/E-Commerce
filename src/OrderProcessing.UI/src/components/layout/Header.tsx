import { ShoppingCart, Search, LogOut, ChevronDown, User, Package, LayoutDashboard, UserPlus } from 'lucide-react'
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
    navigate(
      looksLikeOrderId
        ? `/orders/search?q=${encodeURIComponent(query.trim())}`
        : `/products?q=${encodeURIComponent(query.trim())}`
    )
  }

  const handleLogout = () => {
    setShowMenu(false)
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-secondary shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">

        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-primary shrink-0 py-1">
          ShopNow
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 min-w-0">
          <div className="flex rounded-md overflow-hidden h-10">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products or paste an order ID..."
              className="flex-1 px-4 py-2 text-sm text-gray-900 outline-none min-w-0"
            />
            <button
              type="submit"
              className="bg-primary px-5 text-white hover:bg-orange-600 transition-colors flex items-center"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Nav items — Amazon style two-line */}
        <nav className="flex items-stretch gap-1 shrink-0">

          {/* Account */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="flex flex-col justify-center px-3 py-1 text-white hover:text-primary hover:outline hover:outline-1 hover:outline-white/30 rounded transition-colors h-full min-w-[110px]"
              >
                <span className="text-xs text-gray-300 leading-tight">
                  Hello, {user.displayName.split(' ')[0]}
                </span>
                <span className="flex items-center gap-0.5 text-sm font-bold leading-tight whitespace-nowrap">
                  Account &amp; Lists
                  <ChevronDown className="h-3.5 w-3.5 mt-0.5" />
                </span>
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 w-60 py-2 z-50">
                    {/* User info */}
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

                    <div className="py-1">
                      <Link
                        to="/orders"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Package className="h-4 w-4 text-gray-400" />
                        Your Orders
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-gray-400" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex flex-col justify-center px-3 py-1 text-white hover:text-primary hover:outline hover:outline-1 hover:outline-white/30 rounded transition-colors min-w-[110px]"
            >
              <span className="text-xs text-gray-300 leading-tight">Hello, sign in</span>
              <span className="flex items-center gap-0.5 text-sm font-bold leading-tight whitespace-nowrap">
                Account &amp; Lists
                <ChevronDown className="h-3.5 w-3.5 mt-0.5" />
              </span>
            </Link>
          )}

          {/* Orders & Returns */}
          <Link
            to="/orders"
            className="flex flex-col justify-center px-3 py-1 text-white hover:text-primary hover:outline hover:outline-1 hover:outline-white/30 rounded transition-colors"
          >
            <span className="text-xs text-gray-300 leading-tight">Returns &amp;</span>
            <span className="text-sm font-bold leading-tight">Orders</span>
          </Link>

          {/* Admin (visible only to admins, separate shortcut) */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex flex-col justify-center px-3 py-1 text-white hover:text-primary hover:outline hover:outline-1 hover:outline-white/30 rounded transition-colors"
            >
              <span className="text-xs text-gray-300 leading-tight">Seller</span>
              <span className="text-sm font-bold leading-tight">Admin</span>
            </Link>
          )}

          {/* Register shortcut when logged out */}
          {!user && (
            <Link
              to="/register"
              className="flex flex-col justify-center px-3 py-1 text-white hover:text-primary hover:outline hover:outline-1 hover:outline-white/30 rounded transition-colors"
            >
              <span className="text-xs text-gray-300 leading-tight">New here?</span>
              <span className="flex items-center gap-0.5 text-sm font-bold leading-tight">
                <UserPlus className="h-3.5 w-3.5" /> Register
              </span>
            </Link>
          )}

          {/* Cart */}
          <Link
            to="/cart"
            className="relative flex items-center gap-1.5 px-3 py-1 text-white hover:text-primary hover:outline hover:outline-1 hover:outline-white/30 rounded transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="h-8 w-8" />
              <span className={`absolute -top-1 left-1/2 -translate-x-1/2 text-sm font-bold leading-none text-primary min-w-[18px] text-center ${cartCount === 0 ? 'text-gray-400' : 'text-primary'}`}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            </div>
            <span className="text-sm font-bold self-end pb-1">Cart</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
