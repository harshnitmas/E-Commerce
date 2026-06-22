import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'
import type { ProductDto } from '@/api/types'
import { MOCK_PRODUCTS } from '@/mocks/products.mock'

const PRODUCTS_KEY = ['products'] as const

export function useProducts() {
  return useQuery<ProductDto[]>({
    queryKey: PRODUCTS_KEY,
    queryFn: productsApi.getAll,
    staleTime: 30_000,
    // Merge live stock into mock product data shape on error/loading
    placeholderData: MOCK_PRODUCTS.map((p) => ({
      externalId: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      category: p.category,
      imageUrl: p.imageUrl,
      stockQuantity: p.stockCount,
      reservedQuantity: 0,
      availableQuantity: p.stockCount,
      inStock: p.inStock,
    })),
  })
}

export function useProductStock(externalId: string): ProductDto | undefined {
  const { data } = useProducts()
  return data?.find((p) => p.externalId === externalId)
}

export function useReserveStock() {
  return useMutation({
    mutationFn: ({ customerId, items }: { customerId: string; items: { externalProductId: string; quantity: number }[] }) =>
      productsApi.reserveStock(customerId, items),
  })
}

export function useReleaseReservations() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reservationIds: string[]) => productsApi.releaseReservations(reservationIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  })
}

export function useRequestRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, customerId }: { orderId: string; customerId: string }) =>
      productsApi.requestRefund(orderId, customerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useProcessRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, approve }: { orderId: string; approve: boolean }) =>
      productsApi.processRefund(orderId, approve),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
