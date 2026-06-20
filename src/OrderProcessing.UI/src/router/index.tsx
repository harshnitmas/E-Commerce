import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useAuthStore } from '@/stores/auth.store'

const Home = lazy(() => import('@/pages/Home'))
const Products = lazy(() => import('@/pages/Products'))
const ProductDetail = lazy(() => import('@/pages/Products/detail'))
const Cart = lazy(() => import('@/pages/Cart'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const OrderConfirmation = lazy(() => import('@/pages/OrderConfirmation'))
const Orders = lazy(() => import('@/pages/Orders'))
const OrderSearch = lazy(() => import('@/pages/Orders/search'))
const OrderDetail = lazy(() => import('@/pages/Orders/detail'))
const OrderTracking = lazy(() => import('@/pages/OrderTracking'))
const OrderAudit = lazy(() => import('@/pages/OrderAudit'))
const Admin = lazy(() => import('@/pages/Admin'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))

const Spinner = (
  <div className="h-96 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-1">
        <Suspense fallback={Spinner}>{children}</Suspense>
      </main>
      <Footer />
    </div>
  )
}

function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={Spinner}>{children}</Suspense>
}

function RequireAuth({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/', element: <Layout><Home /></Layout> },
  { path: '/products', element: <Layout><Products /></Layout> },
  { path: '/products/:id', element: <Layout><ProductDetail /></Layout> },
  { path: '/cart', element: <Layout><Cart /></Layout> },
  {
    path: '/login',
    element: <RequireGuest><Suspense fallback={Spinner}><Login /></Suspense></RequireGuest>,
  },
  {
    path: '/register',
    element: <RequireGuest><Suspense fallback={Spinner}><Register /></Suspense></RequireGuest>,
  },
  {
    path: '/checkout',
    element: <RequireAuth><CheckoutLayout><Checkout /></CheckoutLayout></RequireAuth>,
  },
  {
    path: '/checkout/success',
    element: <RequireAuth><Layout><OrderConfirmation /></Layout></RequireAuth>,
  },
  {
    path: '/orders',
    element: <RequireAuth><Layout><Orders /></Layout></RequireAuth>,
  },
  {
    path: '/orders/search',
    element: <RequireAuth><Layout><OrderSearch /></Layout></RequireAuth>,
  },
  {
    path: '/orders/:id',
    element: <RequireAuth><Layout><OrderDetail /></Layout></RequireAuth>,
  },
  {
    path: '/orders/:id/track',
    element: <RequireAuth><Layout><OrderTracking /></Layout></RequireAuth>,
  },
  {
    path: '/orders/:id/audit',
    element: <RequireAuth><Layout><OrderAudit /></Layout></RequireAuth>,
  },
  {
    path: '/admin',
    element: <RequireAuth adminOnly><Layout><Admin /></Layout></RequireAuth>,
  },
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
