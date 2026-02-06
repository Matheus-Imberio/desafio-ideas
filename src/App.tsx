import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/components/AuthProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ToastProviderApp } from '@/components/ui/use-toast'
import { Toaster } from '@/components/Toaster'

import ForgotPassword from '@/pages/ForgotPassword'
import Login from '@/pages/Login'
import ResetPassword from '@/pages/ResetPassword'
import SignUp from '@/pages/SignUp'
import Stock from '@/pages/Stock'
import Profile from '@/pages/Profile'
import Dashboard from '@/pages/Dashboard'
import ShoppingLists from '@/pages/ShoppingLists'
import Recipes from '@/pages/Recipes'
import Suppliers from '@/pages/Suppliers'
import Consumption from '@/pages/Consumption'
import Settings from '@/pages/Settings'
import FinancialHistory from '@/pages/FinancialHistory'

function App() {
  return (
    <ToastProviderApp>
      <AuthProvider>
        <ThemeProvider>
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
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shopping-lists"
                element={
                  <ProtectedRoute>
                    <ShoppingLists />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recipes"
                element={
                  <ProtectedRoute>
                    <Recipes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/suppliers"
                element={
                  <ProtectedRoute>
                    <Suppliers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consumption"
                element={
                  <ProtectedRoute>
                    <Consumption />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
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
              <Route
                path="/financial-history"
                element={
                  <ProtectedRoute>
                    <FinancialHistory />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </ToastProviderApp>
  )
}

export default App
