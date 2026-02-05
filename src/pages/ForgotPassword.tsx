import * as React from 'react'
import { Link } from 'react-router-dom'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

export default function ForgotPassword() {
  const { toast } = useToast()

  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setLoading(false)

    if (error) {
      toast({
        title: 'Não foi possível enviar o e-mail',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'E-mail enviado',
      description: 'Verifique sua caixa de entrada para redefinir sua senha.',
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>
            Enviaremos um link para você redefinir sua senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading || !email}>
              {loading ? 'Enviando...' : 'Enviar link'}
            </Button>

            <p className="text-sm text-muted-foreground">
              <Link
                to="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Voltar para o login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
