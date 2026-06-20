import { useMemo } from 'react'
import { useActivityStore } from '@/stores/activity.store'
import { useOrdersList } from '@/hooks/useOrders'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_PRODUCTS } from '@/mocks/products.mock'
import type { Product } from '@/mocks/products.mock'

export type Recommendations = {
  recentlyViewed: Product[]
  basedOnBrowsing: Product[]
  basedOnOrders: Product[]
  popularPicks: Product[]
}

function topCategories(products: Product[]): string[] {
  const freq: Record<string, number> = {}
  for (const p of products) {
    freq[p.category] = (freq[p.category] ?? 0) + 1
  }
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .map(([cat]) => cat)
}

export function useRecommendations(): Recommendations {
  const viewedIds = useActivityStore((s) => s.viewedProductIds)
  const user = useAuthStore((s) => s.user)
  const { data: ordersData } = useOrdersList({ page: 1, pageSize: 50, customerId: user?.customerId })

  return useMemo<Recommendations>(() => {
    // Recently viewed — resolve IDs to Product objects preserving recency order
    const recentlyViewed = viewedIds
      .map((id) => MOCK_PRODUCTS.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined)
      .slice(0, 8)

    // Browsing-based: products from the same categories as viewed, excluding already viewed
    const browsedProducts = recentlyViewed
    const viewedIdSet = new Set(viewedIds)
    const browseCategories = topCategories(browsedProducts)
    const basedOnBrowsing = browseCategories
      .flatMap((cat) =>
        MOCK_PRODUCTS.filter((p) => p.category === cat && !viewedIdSet.has(p.id))
          .sort((a, b) => b.rating - a.rating)
      )
      .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i) // deduplicate
      .slice(0, 10)

    // Order-based: products from the same categories as previously ordered items
    let basedOnOrders: Product[] = []
    if (user && ordersData?.items.length) {
      const orderedProductIds = new Set(
        ordersData.items.flatMap((o) => o.items.map((i) => i.productId))
      )
      const orderedProducts = [...orderedProductIds]
        .map((id) => MOCK_PRODUCTS.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined)

      const orderCategories = topCategories(orderedProducts)
      basedOnOrders = orderCategories
        .flatMap((cat) =>
          MOCK_PRODUCTS.filter((p) => p.category === cat && !orderedProductIds.has(p.id))
            .sort((a, b) => b.rating - a.rating)
        )
        .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
        .slice(0, 10)
    }

    // Always-visible fallback: top-rated products across all categories
    const popularPicks = [...MOCK_PRODUCTS]
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      .slice(0, 10)

    return { recentlyViewed, basedOnBrowsing, basedOnOrders, popularPicks }
  }, [viewedIds, ordersData, user])
}
