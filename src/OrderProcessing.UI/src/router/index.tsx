import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const Home = lazy(() => import('@/pages/Home'))
const Products = lazy(() => import('@/pages/Products'))
const ProductDetail = lazy(() => import('@/pages/Products/detail'))
const Cart = lazy(() => import('@/pages/Cart'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const OrderConfirmation = lazy(() => import('@/pages/OrderConfirmation'))
const Orders = lazy(() => import('@/pages/Orders'))
const OrderDetail = lazy(() => import('@/pages/Orders/detail'))
const OrderTracking = lazy(() => import('@/pages/OrderTracking'))
const OrderAudit = lazy(() => import('@/pages/OrderAudit'))
const Admin = lazy(() => import('@/pages/Admin'))

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          {children}
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      {children}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  { path: '/', element: <Layout><Home /></Layout> },
  { path: '/products', element: <Layout><Products /></Layout> },
  { path: '/products/:id', element: <Layout><ProductDetail /></Layout> },
  { path: '/cart', element: <Layout><Cart /></Layout> },
  { path: '/checkout', element: <CheckoutLayout><Checkout /></CheckoutLayout> },
  { path: '/checkout/success', element: <Layout><OrderConfirmation /></Layout> },
  { path: '/orders', element: <Layout><Orders /></Layout> },
  { path: '/orders/:id', element: <Layout><OrderDetail /></Layout> },
  { path: '/orders/:id/track', element: <Layout><OrderTracking /></Layout> },
  { path: '/orders/:id/audit', element: <Layout><OrderAudit /></Layout> },
  { path: '/admin', element: <Layout><Admin /></Layout> },
  {
    path: '*',
    element: (
      <Layout>
        <div className="text-center py-24">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-500 mb-6">Page not found.</p>
          <a href="/" className="text-primary hover:underline">Go Home</a>
        </div>
      </Layout>
    ),
  },
])
