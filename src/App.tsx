import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import { PublicLayout } from './components/PublicLayout'
import { HomePage } from './pages/HomePage'
import { BrowsePage } from './pages/BrowsePage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminMapPage } from './pages/admin/AdminMapPage'
import { AdminPropertyFormPage } from './pages/admin/AdminPropertyFormPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/listing/:id" element={<ListingDetailPage />} />
            </Route>

            <Route path="/admin/login" element={<AdminLoginPage />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="map" element={<AdminMapPage />} />
              <Route path="new" element={<AdminPropertyFormPage />} />
              <Route path="edit/:id" element={<AdminPropertyFormPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
