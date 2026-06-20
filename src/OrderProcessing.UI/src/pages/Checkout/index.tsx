import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart.store'
import { useCheckoutStore } from '@/stores/checkout.store'
import { useCreateOrder } from '@/hooks/useOrders'
import { processMockPayment } from '@/mocks/payment.mock'
import { MOCK_USER } from '@/mocks/user.mock'
import { DELIVERY_OPTIONS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

type Step = 'address' | 'delivery' | 'payment' | 'review'
const STEPS: Step[] = ['address', 'delivery', 'payment', 'review']
const STEP_LABELS: Record<Step, string> = {
  address: '1. Address', delivery: '2. Delivery', payment: '3. Payment', review: '4. Review'
}

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>('address')
  const { items, subtotal, clearCart } = useCartStore()
  const checkout = useCheckoutStore()
  const createOrder = useCreateOrder()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)

  const sub = subtotal()
  const total = sub + checkout.deliveryPrice + sub * 0.1

  if (items.length === 0 && !processing) {
    navigate('/cart')
    return null
  }

  const handlePlaceOrder = async () => {
    setProcessing(true)
    try {
      await processMockPayment(total)

      const order = await createOrder.mutateAsync({
        customerId: MOCK_USER.customerId,
        items: items.map(({ product, quantity }) => ({
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
        })),
      })

      const deliveryLabel = checkout.deliveryOption
      const deliveryPrice = checkout.deliveryPrice
      clearCart()
      checkout.reset()
      navigate(`/checkout/success?orderId=${order.orderId}`, {
        state: { deliveryLabel, deliveryPrice },
      })
    } catch {
      toast.error('Something went wrong. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified header */}
      <div className="bg-secondary py-4 px-4 text-center">
        <span className="text-primary font-bold text-2xl">ShopNow</span>
        <span className="text-gray-300 ml-3 text-sm">Secure Checkout</span>
      </div>

      {/* Stepper */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex justify-center gap-1 mb-8">
          {STEPS.map((s) => (
            <button
              key={s}
              onClick={() => { if (STEPS.indexOf(s) < STEPS.indexOf(step)) setStep(s) }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                s === step ? 'bg-primary text-white' :
                STEPS.indexOf(s) < STEPS.indexOf(step) ? 'bg-green-100 text-green-700 cursor-pointer' :
                'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {STEP_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step content */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6">
            {step === 'address' && (
              <AddressStep onNext={() => setStep('delivery')} />
            )}
            {step === 'delivery' && (
              <DeliveryStep onNext={() => setStep('payment')} />
            )}
            {step === 'payment' && (
              <PaymentStep onNext={() => setStep('review')} />
            )}
            {step === 'review' && (
              <ReviewStep onPlaceOrder={handlePlaceOrder} processing={processing} />
            )}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-xl shadow-sm p-5 h-fit">
            <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 line-clamp-1">{product.name} ×{quantity}</span>
                  <span className="font-medium">{formatCurrency(product.price * quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(sub)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{checkout.deliveryPrice === 0 ? 'FREE' : formatCurrency(checkout.deliveryPrice)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatCurrency(sub * 0.1)}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {processing && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4 animate-spin">💳</div>
            <p className="text-lg font-semibold text-gray-900">Processing your payment...</p>
            <p className="text-sm text-gray-500 mt-1">Please don't close this window.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function AddressStep({ onNext }: { onNext: () => void }) {
  const { address, setAddress } = useCheckoutStore()
  const update = (k: keyof typeof address, v: string) => setAddress({ ...address, [k]: v })

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-5">Shipping Address</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {([
          ['fullName', 'Full Name'], ['email', 'Email'], ['phone', 'Phone'],
          ['street', 'Street Address'], ['apt', 'Apt / Suite (optional)'],
          ['city', 'City'], ['state', 'State'], ['zipCode', 'ZIP Code'],
        ] as [keyof typeof address, string][]).map(([key, label]) => (
          <div key={key}>
            <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
            <input
              value={address[key]}
              onChange={(e) => update(key, e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>
      <button onClick={onNext} className="mt-6 bg-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors">
        Continue to Delivery
      </button>
    </div>
  )
}

function DeliveryStep({ onNext }: { onNext: () => void }) {
  const { deliveryOption, setDelivery } = useCheckoutStore()

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-5">Delivery Options</h2>
      <div className="space-y-3">
        {DELIVERY_OPTIONS.map((opt) => (
          <label key={opt.id} className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            deliveryOption === opt.id ? 'border-primary bg-orange-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input type="radio" name="delivery" value={opt.id} checked={deliveryOption === opt.id}
              onChange={() => setDelivery(opt.id, opt.price)} className="accent-primary" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{opt.label}</p>
              <p className="text-sm text-gray-500">{opt.description}</p>
            </div>
            <span className="font-bold text-gray-900">{opt.price === 0 ? 'FREE' : formatCurrency(opt.price)}</span>
          </label>
        ))}
      </div>
      <button onClick={onNext} className="mt-6 bg-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors">
        Continue to Payment
      </button>
    </div>
  )
}

function PaymentStep({ onNext }: { onNext: () => void }) {
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const update = (k: keyof typeof card, v: string) => setCard((c) => ({ ...c, [k]: v }))

  const formatCard = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-5">Payment Details</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Card Number</label>
          <input value={card.number} onChange={(e) => update('number', formatCard(e.target.value))}
            placeholder="1234 5678 9012 3456" maxLength={19}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Cardholder Name</label>
          <input value={card.name} onChange={(e) => update('name', e.target.value)}
            placeholder="Alex Johnson"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Expiry (MM/YY)</label>
            <input value={card.expiry} onChange={(e) => update('expiry', e.target.value)}
              placeholder="12/28" maxLength={5}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">CVV</label>
            <input value={card.cvv} onChange={(e) => update('cvv', e.target.value.slice(0, 3))}
              placeholder="123" maxLength={3} type="password"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">🔒 Your payment is encrypted and secure</p>
      <button onClick={onNext} className="mt-6 bg-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors">
        Review Order
      </button>
    </div>
  )
}

function ReviewStep({ onPlaceOrder, processing }: { onPlaceOrder: () => void; processing: boolean }) {
  const { address, deliveryOption, deliveryPrice } = useCheckoutStore()
  const { items, subtotal } = useCartStore()
  const total = subtotal() + deliveryPrice + subtotal() * 0.1

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-5">Review Your Order</h2>

      <div className="space-y-4 mb-6">
        <div className="border border-gray-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Shipping to</h4>
          <p className="text-sm text-gray-600">{address.fullName}, {address.street}, {address.city}, {address.state} {address.zipCode}</p>
        </div>
        <div className="border border-gray-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Delivery</h4>
          <p className="text-sm text-gray-600">{DELIVERY_OPTIONS.find((o) => o.id === deliveryOption)?.label} — {deliveryPrice === 0 ? 'FREE' : formatCurrency(deliveryPrice)}</p>
        </div>
        <div className="border border-gray-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment</h4>
          <p className="text-sm text-gray-600">Visa ending 4242</p>
        </div>
        <div className="border border-gray-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Items ({items.length})</h4>
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{product.name} ×{quantity}</span>
              <span>{formatCurrency(product.price * quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 mb-6">
        <div className="flex justify-between font-bold text-lg">
          <span>Order Total</span><span>{formatCurrency(total)}</span>
        </div>
      </div>

      <button
        onClick={onPlaceOrder}
        disabled={processing}
        className="w-full bg-primary text-white py-4 rounded-md font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {processing ? 'Placing Order...' : `Place Order — ${formatCurrency(total)}`}
      </button>
    </div>
  )
}
