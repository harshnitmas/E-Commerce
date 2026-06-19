import { create } from 'zustand'
import { MOCK_USER } from '@/mocks/user.mock'

export type CheckoutStep = 'address' | 'delivery' | 'payment' | 'review'

export interface AddressForm {
  fullName: string
  email: string
  phone: string
  street: string
  apt: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface CheckoutStore {
  step: CheckoutStep
  address: AddressForm
  deliveryOption: string
  deliveryPrice: number
  promoCode: string
  promoDiscount: number
  setStep: (step: CheckoutStep) => void
  setAddress: (address: AddressForm) => void
  setDelivery: (option: string, price: number) => void
  setPromo: (code: string, discount: number) => void
  reset: () => void
}

const defaultAddress: AddressForm = {
  fullName: MOCK_USER.address.fullName,
  email: MOCK_USER.address.email,
  phone: MOCK_USER.address.phone,
  street: MOCK_USER.address.street,
  apt: MOCK_USER.address.apt,
  city: MOCK_USER.address.city,
  state: MOCK_USER.address.state,
  zipCode: MOCK_USER.address.zipCode,
  country: MOCK_USER.address.country,
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  step: 'address',
  address: defaultAddress,
  deliveryOption: 'standard',
  deliveryPrice: 0,
  promoCode: '',
  promoDiscount: 0,

  setStep: (step) => set({ step }),
  setAddress: (address) => set({ address }),
  setDelivery: (option, price) => set({ deliveryOption: option, deliveryPrice: price }),
  setPromo: (code, discount) => set({ promoCode: code, promoDiscount: discount }),
  reset: () => set({
    step: 'address',
    address: defaultAddress,
    deliveryOption: 'standard',
    deliveryPrice: 0,
    promoCode: '',
    promoDiscount: 0,
  }),
}))
