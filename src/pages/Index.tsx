import { Navigate } from 'react-router-dom'

import { useAuth } from '@/components/AuthProvider'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }

  return <Navigate to={user ? '/' : '/login'} replace />
}
