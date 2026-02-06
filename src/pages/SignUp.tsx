import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChefHat, Mail, Lock, Building2, ArrowRight, CheckCircle2 } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { getOrCreateRestaurant } from '@/lib/restaurant'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/PasswordInput'
import { useToast } from '@/components/ui/use-toast'

export default function SignUp() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [restaurantName, setRestaurantName] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const passwordStrength = React.useMemo(() => {
    const p = password
    const checks = [
      p.length >= 8,
      /[A-Z]/.test(p),
      /[a-z]/.test(p),
      /[0-9]/.test(p),
    ]
    return checks.filter(Boolean).length
  }, [password])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'As senhas não coincidem',
        description: 'Confirme a senha novamente.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const restaurantNameToUse = restaurantName.trim() || 'Meu Restaurante'
    
    // Salva o nome do restaurante na metadata do usuário
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          restaurant_name: restaurantNameToUse
        }
      }
    })

    if (error) {
      setLoading(false)
      toast({
        title: 'Não foi possível criar a conta',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    // Se o email precisa ser confirmado, mostra mensagem diferente
    if (data.user && !data.session) {
      setLoading(false)
      toast({
        title: 'Conta criada',
        description: 'Verifique seu e-mail para confirmar o cadastro antes de entrar.',
      })
      navigate('/login', { replace: true })
      return
    }

    // Se criou com sucesso e tem sessão, cria restaurante com o nome fornecido
    if (data.user && data.session) {
      try {
        await getOrCreateRestaurant(data.user.id, restaurantNameToUse)
        toast({
          title: 'Conta criada',
          description: 'Bem-vindo! Redirecionando...',
        })
        navigate('/', { replace: true })
      } catch (restaurantError) {
        console.error('Erro ao criar restaurante:', restaurantError)
        toast({
          title: 'Conta criada',
          description: 'Bem-vindo! Redirecionando...',
        })
        navigate('/', { replace: true })
      }
    }
    
    setLoading(false)
  }

  const passwordRequirements = [
    { met: password.length >= 8, text: 'Mínimo 8 caracteres' },
    { met: /[A-Z]/.test(password), text: 'Uma letra maiúscula' },
    { met: /[a-z]/.test(password), text: 'Uma letra minúscula' },
    { met: /[0-9]/.test(password), text: 'Um número' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Lado esquerdo - Branding */}
        <div className="hidden md:flex flex-col items-start justify-center space-y-8 px-8">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-white/30 backdrop-blur-md shadow-2xl border border-white/20">
              <ChefHat className="h-12 w-12 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white drop-shadow-lg leading-tight">
                Comece agora!
              </h1>
              <p className="text-white/95 text-xl mt-3 font-medium drop-shadow-md">
                Crie sua conta e gerencie seu restaurante
              </p>
            </div>
          </div>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <CheckCircle2 className="h-5 w-5 text-white drop-shadow-md flex-shrink-0" />
              <span className="text-white font-medium text-lg drop-shadow-md">Cadastro rápido e simples</span>
            </div>
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <CheckCircle2 className="h-5 w-5 text-white drop-shadow-md flex-shrink-0" />
              <span className="text-white font-medium text-lg drop-shadow-md">Gestão completa de estoque</span>
            </div>
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <CheckCircle2 className="h-5 w-5 text-white drop-shadow-md flex-shrink-0" />
              <span className="text-white font-medium text-lg drop-shadow-md">Receitas inteligentes com IA</span>
            </div>
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <CheckCircle2 className="h-5 w-5 text-white drop-shadow-md flex-shrink-0" />
              <span className="text-white font-medium text-lg drop-shadow-md">Alertas automáticos</span>
            </div>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                <ChefHat className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Criar conta
            </CardTitle>
            <CardDescription className="text-center text-base">
              Preencha os dados abaixo para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-orange-600" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="restaurantName" className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-600" />
                  Nome do Restaurante
                </Label>
                <Input
                  id="restaurantName"
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="h-12"
                  placeholder="Ex: Restaurante do João"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Se não informar, será usado "Meu Restaurante".
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-orange-600" />
                  Senha
                </Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required
                />
                {password && (
                  <div className="space-y-2 mt-2">
                    <div className="h-2 w-full rounded-full bg-orange-100 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength <= 1 ? 'bg-red-500' :
                          passwordStrength === 2 ? 'bg-yellow-500' :
                          passwordStrength === 3 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {passwordRequirements.map((req, i) => (
                        <div key={i} className={`flex items-center gap-1.5 ${req.met ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <CheckCircle2 className={`h-3 w-3 ${req.met ? 'text-green-600' : 'text-gray-300'}`} />
                          <span>{req.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-orange-600" />
                  Confirmar senha
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12"
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">As senhas não coincidem</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password || !confirmPassword || password !== confirmPassword}
                className="h-12 text-base font-semibold mt-2"
                size="lg"
              >
                {loading ? 'Criando conta...' : (
                  <>
                    Criar conta
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-orange-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Já tem conta?{' '}
                <Link
                  to="/login"
                  className="text-orange-600 hover:text-orange-700 font-semibold underline-offset-4 hover:underline"
                >
                  Entrar agora
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
