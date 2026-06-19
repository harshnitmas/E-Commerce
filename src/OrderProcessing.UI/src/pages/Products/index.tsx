import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { MOCK_PRODUCTS, CATEGORIES } from '@/mocks/products.mock'
import { ProductCard } from '@/components/product/ProductCard'

const PAGE_SIZE = 12

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('category') ? [searchParams.get('category')!] : []
  )
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(3000)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState('featured')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const query = searchParams.get('q') ?? ''

  const filtered = useMemo(() => {
    let result = [...MOCK_PRODUCTS]
    if (query) result = result.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    if (selectedCategories.length) result = result.filter((p) => selectedCategories.includes(p.category))
    result = result.filter((p) => p.price >= minPrice && p.price <= maxPrice)
    if (inStockOnly) result = result.filter((p) => p.inStock)
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price)
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating)
    return result
  }, [query, selectedCategories, minPrice, maxPrice, inStockOnly, sortBy])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
    setSearchParams((p) => { p.set('page', '1'); return p })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
      {/* Sidebar Filters */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24">
          <div className="flex items-center gap-2 mb-5">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Category</h3>
            {CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="accent-primary"
                />
                {cat}
              </label>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Range</h3>
            <div className="flex gap-2 text-sm text-gray-600 mb-2">
              <span>${minPrice}</span> <span>—</span> <span>${maxPrice}</span>
            </div>
            <input type="range" min={0} max={3000} step={50} value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary" />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mb-4">
            <input type="checkbox" checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)} className="accent-primary" />
            In Stock Only
          </label>

          <button
            onClick={() => { setSelectedCategories([]); setMinPrice(0); setMaxPrice(3000); setInStockOnly(false) }}
            className="text-xs text-primary hover:underline"
          >
            Clear All Filters
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            {query ? `Results for "${query}" — ` : ''}{filtered.length} products
          </p>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Avg. Rating</option>
          </select>
        </div>

        {paginated.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-2">No products match your filters</p>
            <button onClick={() => setSelectedCategories([])} className="text-primary hover:underline text-sm">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {paginated.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setSearchParams((prev) => { prev.set('page', String(p)); return prev })}
                className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
                  p === page ? 'bg-primary text-white' : 'bg-white border text-gray-600 hover:border-primary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
