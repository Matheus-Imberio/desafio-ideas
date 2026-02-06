import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Calendar,
  Download,
  ArrowLeft,
  ChefHat,
  DollarSign,
  ShoppingCart,
} from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { getOrCreateRestaurant } from '@/lib/restaurant'
import { getDashboardStats } from '@/lib/dashboard'
import type { DashboardStats } from '@/lib/types'
import {
  exportStockToCSV,
  exportStockToPDF,
  exportLossesReport,
  exportMonthlyConsumptionReport,
  downloadCSV,
} from '@/lib/reports'

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5']

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [restaurant, setRestaurant] = React.useState<{ id: string; name: string } | null>(null)
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [exporting, setExporting] = React.useState(false)

  // Carrega dados
  React.useEffect(() => {
    if (!user) return

    async function loadData() {
      try {
        setLoading(true)
        const restaurantData = await getOrCreateRestaurant(user.id)
        setRestaurant(restaurantData)

        const dashboardStats = await getDashboardStats(restaurantData.id)
        setStats(dashboardStats)
      } catch (error) {
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao carregar dashboard',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  // Exportações
  const handleExportStockCSV = async () => {
    if (!restaurant) return

    try {
      setExporting(true)
      const csv = await exportStockToCSV(restaurant.id)
      downloadCSV(csv, `estoque_${new Date().toISOString().split('T')[0]}.csv`)
      toast({
        title: 'Sucesso',
        description: 'Estoque exportado para CSV',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao exportar',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  const handleExportStockPDF = async () => {
    if (!restaurant) return

    try {
      setExporting(true)
      await exportStockToPDF(restaurant.id)
      toast({
        title: 'Sucesso',
        description: 'Estoque exportado para PDF',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao exportar',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  const handleExportLosses = async () => {
    if (!restaurant) return

    try {
      setExporting(true)
      const csv = await exportLossesReport(restaurant.id, 30)
      downloadCSV(csv, `perdas_${new Date().toISOString().split('T')[0]}.csv`)
      toast({
        title: 'Sucesso',
        description: 'Relatório de perdas exportado',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao exportar',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  const handleExportConsumption = async () => {
    if (!restaurant) return

    try {
      setExporting(true)
      const now = new Date()
      const csv = await exportMonthlyConsumptionReport(
        restaurant.id,
        now.getMonth() + 1,
        now.getFullYear()
      )
      downloadCSV(csv, `consumo_${now.getMonth() + 1}_${now.getFullYear()}.csv`)
      toast({
        title: 'Sucesso',
        description: 'Relatório de consumo exportado',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao exportar',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8 text-muted-foreground">Carregando dashboard...</div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8 text-muted-foreground">Nenhum dado disponível</div>
        </div>
      </div>
    )
  }

  // Prepara dados para gráficos
  const stockByCategoryData = stats.stockByCategory.map(item => ({
    name: item.category,
    quantidade: item.totalQuantity,
    itens: item.count,
  }))

  const movementsData = stats.movementsLast30Days.map(item => ({
    data: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    movimentações: item.count,
  }))

  const alertsData = [
    { name: 'Estoque Baixo', value: stats.lowStockCount, color: '#fbbf24' },
    { name: 'Vencendo em Breve', value: stats.expiringSoonCount, color: '#fb923c' },
    { name: 'Vencidos', value: stats.expiredCount, color: '#ef4444' },
  ].filter(item => item.value > 0)

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
                  Dashboard
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

          {/* Cards de Estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="card-restaurant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Ingredientes</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalIngredients}</div>
                <p className="text-xs text-muted-foreground">{stats.totalCategories} categorias</p>
              </CardContent>
            </Card>

            <Card className="card-restaurant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</div>
                <p className="text-xs text-muted-foreground">Precisam de reposição</p>
              </CardContent>
            </Card>

            <Card className="card-restaurant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencendo em Breve</CardTitle>
                <Calendar className="h-4 w-4 text-primary-dynamic" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary-dynamic">{stats.expiringSoonCount}</div>
                <p className="text-xs text-muted-foreground">Próximos 3 dias</p>
              </CardContent>
            </Card>

            <Card className="card-restaurant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.expiredCount}</div>
                <p className="text-xs text-muted-foreground">Precisam ser descartados</p>
              </CardContent>
            </Card>
          </div>

          {/* Cards de Faturamento */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="card-restaurant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {stats.totalRevenue.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-muted-foreground">{stats.totalSales} pratos vendidos</p>
              </CardContent>
            </Card>

            <Card className="card-restaurant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-primary-dynamic" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary-dynamic">{stats.totalSales}</div>
                <p className="text-xs text-muted-foreground">Pratos vendidos</p>
              </CardContent>
            </Card>

            <Card className="card-restaurant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas Cadastradas</CardTitle>
                <ChefHat className="h-4 w-4 text-primary-dynamic" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary-dynamic">
                  {stats.topSellingRecipes.length > 0 ? stats.topSellingRecipes.length : '0'}
                </div>
                <p className="text-xs text-muted-foreground">Receitas com vendas</p>
              </CardContent>
            </Card>
          </div>

          {/* Cards de Compras e Vendas Mensais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="card-restaurant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compras do Mês</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {stats.monthlyExpenses.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </CardContent>
            </Card>

            <Card className="card-restaurant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compras Totais</CardTitle>
                <ShoppingCart className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  R$ {stats.totalExpenses.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-muted-foreground">Total acumulado</p>
              </CardContent>
            </Card>

            <Card className="card-restaurant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {stats.monthlyRevenue.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.monthlySales} pratos em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
                </p>
              </CardContent>
            </Card>

            <Card className="card-restaurant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  R$ {stats.totalRevenue.toFixed(2).replace('.', ',')}
                </div>
                <p className="text-xs text-muted-foreground">{stats.totalSales} pratos vendidos</p>
              </CardContent>
            </Card>
          </div>

          {/* Card de Lucro Líquido */}
          <Card className="card-restaurant border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <DollarSign className="h-4 w-4 text-primary-dynamic" />
            </CardHeader>
            <CardContent>
              {(() => {
                const netProfit = stats.totalRevenue - stats.totalExpenses
                return (
                  <>
                    <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {netProfit.toFixed(2).replace('.', ',')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Receita: R$ {stats.totalRevenue.toFixed(2).replace('.', ',')} • 
                      Gastos: R$ {stats.totalExpenses.toFixed(2).replace('.', ',')}
                    </p>
                  </>
                )
              })()}
            </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Estoque por Categoria */}
            <Card className="card-restaurant">
              <CardHeader>
                <CardTitle>Estoque por Categoria</CardTitle>
                <CardDescription>Quantidade total por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                {stockByCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stockByCategoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantidade" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Movimentações dos Últimos 30 Dias */}
            <Card className="card-restaurant">
              <CardHeader>
                <CardTitle>Movimentações (30 dias)</CardTitle>
                <CardDescription>Histórico de movimentações</CardDescription>
              </CardHeader>
              <CardContent>
                {movementsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={movementsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="movimentações"
                        stroke="#f97316"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhuma movimentação nos últimos 30 dias
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alertas */}
            {alertsData.length > 0 && (
              <Card className="card-restaurant">
                <CardHeader>
                  <CardTitle>Distribuição de Alertas</CardTitle>
                  <CardDescription>Tipos de alertas ativos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={alertsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {alertsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Top Ingredientes Mais Usados */}
            <Card className="card-restaurant">
              <CardHeader>
                <CardTitle>Top 10 Ingredientes Mais Usados</CardTitle>
                <CardDescription>Últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topUsedIngredients.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topUsedIngredients.map((ing, index) => (
                      <div
                        key={ing.ingredient_id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="text-sm">{ing.ingredient_name}</span>
                        </div>
                        <span className="text-sm font-semibold">{ing.count} usos</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhum uso registrado
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Faturamento dos Últimos 30 Dias */}
            <Card className="card-restaurant">
              <CardHeader>
                <CardTitle>Faturamento dos Últimos 30 Dias</CardTitle>
                <CardDescription>Receita por dia</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.revenueLast30Days.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.revenueLast30Days.map(item => ({
                      data: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                      faturamento: item.revenue,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`} />
                      <Legend />
                      <Line type="monotone" dataKey="faturamento" stroke="#f97316" strokeWidth={2} name="Faturamento (R$)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhuma venda registrada
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Receitas Vendidas */}
            <Card className="card-restaurant">
              <CardHeader>
                <CardTitle>Top Receitas Vendidas</CardTitle>
                <CardDescription>Por faturamento</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topSellingRecipes.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topSellingRecipes.map((recipe, index) => (
                      <div
                        key={recipe.recipe_id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="text-sm truncate">{recipe.recipe_name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground">{recipe.sales} vendas</span>
                          <span className="font-semibold text-green-600">
                            R$ {recipe.revenue.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhuma receita vendida ainda
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ingredientes Vencendo nos Próximos 7 Dias */}
          {stats.expiringNext7Days.length > 0 && (
            <Card className="card-restaurant">
              <CardHeader>
                <CardTitle>Vencendo nos Próximos 7 Dias</CardTitle>
                <CardDescription>Ingredientes que precisam de atenção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {stats.expiringNext7Days.map(ing => {
                    const parts = ing.expiry_date?.split('-')
                    const expiryDate =
                      parts && parts.length === 3
                        ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                        : null
                    const daysUntilExpiry = expiryDate
                      ? Math.floor(
                          (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                        )
                      : null

                    return (
                      <div
                        key={ing.id}
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{ing.name}</span>
                          {daysUntilExpiry !== null && (
                            <Badge variant={daysUntilExpiry <= 1 ? 'destructive' : 'warning'}>
                              {daysUntilExpiry === 0
                                ? 'Hoje'
                                : daysUntilExpiry === 1
                                  ? '1 dia'
                                  : `${daysUntilExpiry} dias`}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Validade: {ing.expiry_date ? new Date(ing.expiry_date).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exportações */}
          <Card className="card-restaurant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exportar Relatórios
              </CardTitle>
              <CardDescription>Baixe relatórios em PDF ou CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <Button
                  onClick={handleExportStockCSV}
                  disabled={exporting}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Estoque CSV
                </Button>
                <Button
                  onClick={handleExportStockPDF}
                  disabled={exporting}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Estoque PDF
                </Button>
                <Button
                  onClick={handleExportLosses}
                  disabled={exporting}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Perdas CSV
                </Button>
                <Button
                  onClick={handleExportConsumption}
                  disabled={exporting}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Consumo CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
