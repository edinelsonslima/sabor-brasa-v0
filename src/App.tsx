import { Toaster } from '@/components/_ui/toast'
import { authStore } from '@/hooks/useAuth'
import { domMax, LazyMotion } from 'framer-motion'
import { createBrowserRouter, createRoutesFromElements, Navigate, Route, RouterProvider } from 'react-router-dom'
import AppLayout from './components/_layout'
import { Authenticated } from './components/auth/authenticated'
import { Unauthenticated } from './components/auth/unauthenticated'
import { Loading } from './pages/Loading'

function AuthGate() {
  const user = authStore.useStore((state) => state.user)
  const logged = user !== null

  return createRoutesFromElements(
    <Route errorElement={<div>Ops... Página não encontrada</div>}>
      <Route element={<Unauthenticated logged={logged} />}>
        <Route path='*' lazy={() => import('@/pages/Login')} hydrateFallbackElement={<Loading />} />
      </Route>

      <Route element={<Authenticated logged={logged} />}>
        <Route element={<AppLayout />}>
          <Route index path='/' lazy={() => import('@/pages/Index')} hydrateFallbackElement={<Loading />} />
          <Route path='/vendas' lazy={() => import('@/pages/Sales')} hydrateFallbackElement={<Loading />} />
          <Route
            path='/vendas/:id/editar'
            lazy={() => import('@/pages/EditSale')}
            hydrateFallbackElement={<Loading />}
          />
          <Route path='/comandas' lazy={() => import('@/pages/Orders')} hydrateFallbackElement={<Loading />} />
          <Route path='/comandas/:id' lazy={() => import('@/pages/Sales')} hydrateFallbackElement={<Loading />} />
          <Route path='/gastos' lazy={() => import('@/pages/Expenses')} hydrateFallbackElement={<Loading />} />
          <Route path='/pagamentos' lazy={() => import('@/pages/Payments')} hydrateFallbackElement={<Loading />} />
          <Route path='/produtos' lazy={() => import('@/pages/Products')} hydrateFallbackElement={<Loading />} />
          <Route path='/auditoria' lazy={() => import('@/pages/Audit')} hydrateFallbackElement={<Loading />} />
          <Route path='/sobre' lazy={() => import('@/pages/About')} hydrateFallbackElement={<Loading />} />
          <Route path='/historico' lazy={() => import('@/pages/History')} hydrateFallbackElement={<Loading />} />
          <Route path='/buscar' lazy={() => import('@/pages/Search')} hydrateFallbackElement={<Loading />} />
        </Route>
      </Route>

      <Route path='*' element={<Navigate to='/' replace />} />
    </Route>,
  )
}

const App = () => {
  const router = createBrowserRouter(AuthGate())

  return (
    <LazyMotion features={domMax}>
      <Toaster />
      <RouterProvider router={router} />
    </LazyMotion>
  )
}

export default App
