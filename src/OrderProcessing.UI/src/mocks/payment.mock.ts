export interface PaymentResult {
  success: boolean
  transactionId: string
  last4: string
  brand: string
  amount: number
  processedAt: string
}

export async function processMockPayment(amount: number): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return {
    success: true,
    transactionId: `txn-${crypto.randomUUID()}`,
    last4: '4242',
    brand: 'Visa',
    amount,
    processedAt: new Date().toISOString(),
  }
}

export function detectCardBrand(cardNumber: string): string {
  const num = cardNumber.replace(/\s/g, '')
  if (num.startsWith('4')) return 'Visa'
  if (num.startsWith('5')) return 'Mastercard'
  if (num.startsWith('3')) return 'Amex'
  if (num.startsWith('6')) return 'Discover'
  return 'Card'
}
