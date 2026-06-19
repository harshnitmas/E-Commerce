export const ORDER_STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-800',
    dotColor: 'bg-amber-500',
  },
  Processing: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-500',
  },
  Shipped: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800',
    dotColor: 'bg-purple-500',
  },
  Delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500',
  },
  Cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-600',
    dotColor: 'bg-gray-400',
  },
} as const

export const STATUS_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'] as const

export const DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Standard Shipping', description: 'Arrives in 5–7 days', price: 0 },
  { id: 'express', label: 'Express Shipping', description: 'Arrives in 2–3 days', price: 9.99 },
  { id: 'nextday', label: 'Next Day Delivery', description: 'Arrives tomorrow', price: 19.99 },
] as const

export const PROMO_CODES: Record<string, number> = {
  SAVE10: 0.1,
  SAVE20: 0.2,
}

export const MOCK_CARD_LAST4 = '4242'
export const MOCK_CARD_BRAND = 'Visa'
