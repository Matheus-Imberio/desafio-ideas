import * as React from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function Stock() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = React.useState(false)

  async function onLogout() {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    setLoading(false)

    if (error) {
      toast({
        title: 'Não foi possível sair',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto grid gap-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">Estoque</h1>
              <p className="text-sm text-muted-foreground">
                Logado como {user?.email}
              </p>
            </div>
            <Button variant="outline" onClick={onLogout} disabled={loading}>
              {loading ? 'Saindo...' : 'Sair'}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>MVP - Fase 1</CardTitle>
              <CardDescription>
                Autenticação ok. Próximo passo: CRUD de ingredientes + alertas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Vou implementar agora a parte de ingredientes (tabela no Supabase +
                listagem paginada + filtros + alertas + histórico de movimentações).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
