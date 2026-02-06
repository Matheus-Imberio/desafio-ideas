import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Filter } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { getOrCreateRestaurant } from '@/lib/restaurant'
import { getFinancialTransactions, getFinancialStats } from '@/lib/financial'
import type { FinancialTransaction } from '@/lib/types'

export default function FinancialHistory() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [restaurant, setRestaurant] = React.useState<{ id: string; name: string } | null>(null)
  const [transactions, setTransactions] = React.useState<FinancialTransaction[]>([])
  const [stats, setStats] = React.useState<{
    totalRevenue: number
    totalExpenses: number
    netProfit: number
  } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [filterType, setFilterType] = React.useState<'all' | 'revenue' | 'expense'>('all')

  // Carrega dados
  React.useEffect(() => {
    if (!user) return

    async function loadData() {
      try {
        setLoading(true)
        const restaurantData = await getOrCreateRestaurant(user.id)
        setRestaurant(restaurantData)

        const [transactionsData, statsData] = await Promise.all([
          getFinancialTransactions(restaurantData.id),
          getFinancialStats(restaurantData.id),
        ])

        setTransactions(transactionsData)
        setStats(statsData)
      } catch (error) {
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao carregar histórico',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  // Filtra transações
  const filteredTransactions = React.useMemo(() => {
    if (filterType === 'all') return transactions
    return transactions.filter(t => t.type === filterType)
  }, [transactions, filterType])

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
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-primary-text">
                  Histórico Financeiro
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

          {/* Cards de Resumo */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="card-restaurant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {stats.totalRevenue.toFixed(2).replace('.', ',')}
                  </div>
                  <p className="text-xs text-muted-foreground">Total de vendas</p>
                </CardContent>
              </Card>

              <Card className="card-restaurant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gastos Total</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    R$ {stats.totalExpenses.toFixed(2).replace('.', ',')}
                  </div>
                  <p className="text-xs text-muted-foreground">Total de compras</p>
                </CardContent>
              </Card>

              <Card className="card-restaurant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary-dynamic" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {stats.netProfit.toFixed(2).replace('.', ',')}
                  </div>
                  <p className="text-xs text-muted-foreground">Receita - Gastos</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros */}
          <Card className="card-restaurant">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transações</CardTitle>
                  <CardDescription>
                    Histórico completo de receitas e gastos
                  </CardDescription>
                </div>
                <Select value={filterType} onValueChange={(value: 'all' | 'revenue' | 'expense') => setFilterType(value)}>
                  <SelectTrigger className="w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="revenue">Receitas</SelectItem>
                    <SelectItem value="expense">Gastos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma transação registrada
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className="p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge
                            variant={transaction.type === 'revenue' ? 'default' : 'destructive'}
                            className="shrink-0"
                          >
                            {transaction.type === 'revenue' ? 'Receita' : 'Gasto'}
                          </Badge>
                          {transaction.category && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {transaction.category === 'recipe_sale' ? 'Venda de Prato' : 
                               transaction.category === 'shopping_list' ? 'Lista de Compras' : 
                               transaction.category}
                            </Badge>
                          )}
                          {transaction.supplier_id && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              Fornecedor
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium break-words">{transaction.description.split('\n')[0]}</p>
                          {transaction.description.includes('\n') && (
                            <div className="text-sm text-muted-foreground pl-2 border-l-2 border-muted">
                              {transaction.description.split('\n').slice(1).map((line, idx) => (
                                <p key={idx} className="break-words">{line}</p>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(transaction.transaction_date).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className={`text-xl font-bold shrink-0 ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'revenue' ? '+' : '-'}R${' '}
                        {transaction.amount.toFixed(2).replace('.', ',')}
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
