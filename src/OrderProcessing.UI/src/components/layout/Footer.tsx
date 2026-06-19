import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-secondary text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-3">ShopNow</h3>
          <p className="text-sm">Your one-stop shop for everything. Fast delivery, easy returns, and unbeatable prices.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-primary transition-colors">All Products</Link></li>
            <li><Link to="/orders" className="hover:text-primary transition-colors">My Orders</Link></li>
            <li><Link to="/admin" className="hover:text-primary transition-colors">Admin Panel</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Help & Support</h4>
          <ul className="space-y-2 text-sm">
            <li><span className="cursor-pointer hover:text-primary transition-colors">FAQs</span></li>
            <li><span className="cursor-pointer hover:text-primary transition-colors">Contact Us</span></li>
            <li><span className="cursor-pointer hover:text-primary transition-colors">Returns</span></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Stay Connected</h4>
          <div className="flex gap-3 mb-4 text-xl">
            <span className="cursor-pointer hover:text-primary">𝕏</span>
            <span className="cursor-pointer hover:text-primary">f</span>
            <span className="cursor-pointer hover:text-primary">in</span>
          </div>
          <input
            type="email"
            placeholder="Your email..."
            className="w-full px-3 py-2 text-sm rounded-md text-gray-900 outline-none"
          />
        </div>
      </div>
      <div className="border-t border-gray-700 py-4 text-center text-xs text-gray-500">
        © 2025 ShopNow. All rights reserved.
      </div>
    </footer>
  )
}
