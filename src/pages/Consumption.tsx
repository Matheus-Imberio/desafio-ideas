import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, ArrowLeft, AlertTriangle } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { getOrCreateRestaurant } from '@/lib/restaurant'
import { analyzeAllConsumption, getRuptureRiskIngredients } from '@/lib/consumption'

export default function Consumption() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [restaurant, setRestaurant] = React.useState<{ id: string; name: string } | null>(null)
  const [ruptureRisks, setRuptureRisks] = React.useState<
    Array<{ riskLevel: 'high' | 'medium' | 'low' } & any>
  >([])
  const [loading, setLoading] = React.useState(true)

  // Carrega dados
  React.useEffect(() => {
    if (!user) return

    async function loadData() {
      try {
        setLoading(true)
        const restaurantData = await getOrCreateRestaurant(user.id)
        setRestaurant(restaurantData)

        const risks = await getRuptureRiskIngredients(restaurantData.id, 30)
        setRuptureRisks(risks)
      } catch (error) {
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao carregar análise',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary-icon shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-primary-text">
                  Análise de Consumo
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{restaurant?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="rounded-xl hover:bg-orange-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>

          {/* Risco de Ruptura */}
          <Card className="card-restaurant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary-dynamic" />
                Risco de Ruptura
              </CardTitle>
              <CardDescription>
                Ingredientes que podem acabar nos próximos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ruptureRisks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum risco de ruptura identificado
                </div>
              ) : (
                <div className="space-y-2">
                  {ruptureRisks.map((risk, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{risk.ingredient_name}</span>
                          <Badge
                            variant={
                              risk.riskLevel === 'high'
                                ? 'destructive'
                                : risk.riskLevel === 'medium'
                                  ? 'default'
                                  : 'outline'
                            }
                          >
                            {risk.riskLevel === 'high'
                              ? 'Alto Risco'
                              : risk.riskLevel === 'medium'
                                ? 'Médio Risco'
                                : 'Baixo Risco'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Consumo médio diário: {risk.averageDailyConsumption.toFixed(2)}
                          {risk.daysUntilEmpty !== null && (
                            <span className="ml-2">
                              • Estoque acaba em {risk.daysUntilEmpty} dia(s)
                            </span>
                          )}
                          {risk.predictedEmptyDate && (
                            <span className="ml-2">
                              • Previsão: {new Date(risk.predictedEmptyDate).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
