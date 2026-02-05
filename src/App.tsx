import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/components/AuthProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ToastProviderApp } from '@/components/ui/use-toast'
import { Toaster } from '@/components/Toaster'

import ForgotPassword from '@/pages/ForgotPassword'
import Login from '@/pages/Login'
import ResetPassword from '@/pages/ResetPassword'
import SignUp from '@/pages/SignUp'
import Stock from '@/pages/Stock'
import Profile from '@/pages/Profile'

function App() {
  return (
    <ToastProviderApp>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Stock />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ToastProviderApp>
  )
}

export default App
