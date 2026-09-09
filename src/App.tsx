import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useAuth } from './lib/auth'
import { FarmLayout } from './components/Layout'
import { AdminLayout } from './components/AdminLayout'
import { AppLayout } from './components/AppLayout'

import Landing from './pages/Landing'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Pricing from './pages/Pricing'
import Dashboard from './pages/Dashboard'
import ProductNew from './pages/ProductNew'
import ProductHub from './pages/ProductHub'
import DetailPageEditor from './pages/DetailPageEditor'
import ContentRequest from './pages/ContentRequest'
import Contents from './pages/Contents'
import ContentDetail from './pages/ContentDetail'
import BillingPage from './pages/Billing'
import Store from './pages/Store'
import VideoStudio from './pages/studio/VideoStudio'

import Shop from './pages/shop/Shop'
import ShopSearch from './pages/shop/ShopSearch'
import ShopSourcing from './pages/shop/ShopSourcing'
import ShopStudio from './pages/shop/ShopStudio'
import ShopReels from './pages/shop/ShopReels'
import ShopSanji from './pages/shop/ShopSanji'
import ShopProduct from './pages/shop/ShopProduct'
import ShopGroupBuyList from './pages/shop/ShopGroupBuyList'
import ShopGroupBuy from './pages/shop/ShopGroupBuy'
import ShopSubscribe from './pages/shop/ShopSubscribe'
import Cart from './pages/shop/Cart'
import ShopLogin from './pages/shop/ShopLogin'
import ShopSignup from './pages/shop/ShopSignup'
import ShopMyPage from './pages/shop/ShopMyPage'

import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminFarmDetail from './pages/admin/AdminFarmDetail'
import AdminContents from './pages/admin/AdminContents'
import AdminContentReview from './pages/admin/AdminContentReview'
import AdminRevenue from './pages/admin/AdminRevenue'
import AdminCommerce from './pages/admin/AdminCommerce'
import AdminAccount from './pages/admin/AdminAccount'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function RequireFarm({ children }: { children: ReactNode }) {
  const { farm } = useAuth()
  const loc = useLocation()
  if (!farm) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  return <FarmLayout>{children}</FarmLayout>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { admin } = useAuth()
  if (!admin) return <Navigate to="/admin/login" replace />
  return <AdminLayout>{children}</AdminLayout>
}

function Buyer({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}

function RequireBuyer({ children }: { children: ReactNode }) {
  const { buyer } = useAuth()
  const loc = useLocation()
  if (!buyer) return <Navigate to="/shop/login" state={{ from: loc.pathname }} replace />
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/studio/video" element={<VideoStudio />} />

        {/* 농가 */}
        <Route path="/dashboard" element={<RequireFarm><Dashboard /></RequireFarm>} />
        <Route path="/products/new" element={<RequireFarm><ProductNew /></RequireFarm>} />
        <Route path="/products/:id" element={<RequireFarm><ProductHub /></RequireFarm>} />
        <Route path="/products/:id/detail" element={<RequireFarm><DetailPageEditor /></RequireFarm>} />
        <Route path="/content/request" element={<RequireFarm><ContentRequest /></RequireFarm>} />
        <Route path="/contents" element={<RequireFarm><Contents /></RequireFarm>} />
        <Route path="/contents/:id" element={<RequireFarm><ContentDetail /></RequireFarm>} />
        <Route path="/billing" element={<RequireFarm><BillingPage /></RequireFarm>} />
        <Route path="/store" element={<RequireFarm><Store /></RequireFarm>} />

        {/* 구매자 앱 */}
        <Route path="/shop" element={<Buyer><Shop /></Buyer>} />
        <Route path="/shop/search" element={<Buyer><ShopSearch /></Buyer>} />
        <Route path="/shop/sourcing" element={<Buyer><ShopSourcing /></Buyer>} />
        <Route path="/shop/studio" element={<Buyer><ShopStudio /></Buyer>} />
        <Route path="/shop/reels" element={<Buyer><ShopReels /></Buyer>} />
        <Route path="/shop/sanji" element={<Buyer><ShopSanji /></Buyer>} />
        <Route path="/shop/product/:id" element={<Buyer><ShopProduct /></Buyer>} />
        <Route path="/shop/groupbuy" element={<Buyer><ShopGroupBuyList /></Buyer>} />
        <Route path="/shop/groupbuy/:id" element={<Buyer><ShopGroupBuy /></Buyer>} />
        <Route path="/shop/subscribe" element={<Buyer><ShopSubscribe /></Buyer>} />
        <Route path="/cart" element={<Buyer><Cart /></Buyer>} />
        <Route path="/shop/login" element={<ShopLogin />} />
        <Route path="/shop/signup" element={<ShopSignup />} />
        <Route path="/shop/mypage" element={<RequireBuyer><ShopMyPage /></RequireBuyer>} />

        {/* 운영자 */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/farms/:id" element={<RequireAdmin><AdminFarmDetail /></RequireAdmin>} />
        <Route path="/admin/contents" element={<RequireAdmin><AdminContents /></RequireAdmin>} />
        <Route path="/admin/contents/:id" element={<RequireAdmin><AdminContentReview /></RequireAdmin>} />
        <Route path="/admin/commerce" element={<RequireAdmin><AdminCommerce /></RequireAdmin>} />
        <Route path="/admin/revenue" element={<RequireAdmin><AdminRevenue /></RequireAdmin>} />
        <Route path="/admin/account" element={<RequireAdmin><AdminAccount /></RequireAdmin>} />
        <Route path="/admin/studio" element={<RequireAdmin><VideoStudio /></RequireAdmin>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
