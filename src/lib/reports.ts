import { supabase } from './supabase'
import type { Ingredient, StockMovement } from './types'
import { getIngredients } from './ingredients'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Exporta estoque atual para CSV
 */
export async function exportStockToCSV(restaurantId: string): Promise<string> {
  const result = await getIngredients(restaurantId, 1, {})
  const ingredients = result.data

  // Cabeçalho CSV
  const headers = [
    'Nome',
    'Categoria',
    'Quantidade',
    'Unidade',
    'Estoque Mínimo',
    'Data de Validade',
    'Status',
  ]

  // Linhas de dados
  const rows = ingredients.map(ing => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let status = 'OK'
    if (ing.quantity <= ing.min_stock) {
      status = 'Estoque Baixo'
    }
    if (ing.expiry_date) {
      const parts = ing.expiry_date.split('-')
      if (parts.length === 3) {
        const expiryDate = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2])
        )
        expiryDate.setHours(0, 0, 0, 0)
        const daysDiff = Math.floor(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysDiff < 0) {
          status = 'Vencido'
        } else if (daysDiff <= 3) {
          status = 'Vencendo em Breve'
        }
      }
    }

    return [
      ing.name,
      ing.category || '',
      ing.quantity.toString(),
      ing.unit,
      ing.min_stock.toString(),
      ing.expiry_date || '',
      status,
    ]
  })

  // Combina cabeçalho e linhas
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return csvContent
}

/**
 * Exporta estoque atual para PDF
 */
export async function exportStockToPDF(restaurantId: string): Promise<void> {
  const result = await getIngredients(restaurantId, 1, {})
  const ingredients = result.data

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 10
  const startY = 20
  let y = startY

  // Título
  doc.setFontSize(18)
  doc.text('Relatório de Estoque', margin, y)
  y += 10

  doc.setFontSize(10)
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, y)
  y += 15

  // Tabela
  const tableHeaders = ['Nome', 'Categoria', 'Quantidade', 'Unidade', 'Mínimo', 'Validade', 'Status']
  const colWidths = [50, 30, 25, 20, 20, 30, 40]

  // Cabeçalho da tabela
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  let x = margin
  tableHeaders.forEach((header, i) => {
    doc.text(header, x, y)
    x += colWidths[i]
  })
  y += 8

  // Linhas da tabela
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)

  ingredients.forEach(ing => {
    // Verifica se precisa de nova página
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      y = startY
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let status = 'OK'
    if (ing.quantity <= ing.min_stock) {
      status = 'Estoque Baixo'
    }
    if (ing.expiry_date) {
      const parts = ing.expiry_date.split('-')
      if (parts.length === 3) {
        const expiryDate = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2])
        )
        expiryDate.setHours(0, 0, 0, 0)
        const daysDiff = Math.floor(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysDiff < 0) {
          status = 'Vencido'
        } else if (daysDiff <= 3) {
          status = 'Vencendo'
        }
      }
    }

    const row = [
      ing.name.substring(0, 25),
      (ing.category || '').substring(0, 15),
      ing.quantity.toString(),
      ing.unit,
      ing.min_stock.toString(),
      ing.expiry_date || '',
      status.substring(0, 15),
    ]

    x = margin
    row.forEach((cell, i) => {
      doc.text(cell, x, y)
      x += colWidths[i]
    })
    y += 6
  })

  // Salva o PDF
  doc.save(`estoque_${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Exporta relatório de perdas e desperdícios
 */
export async function exportLossesReport(restaurantId: string, days: number = 30): Promise<string> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: movements, error } = await supabase
    .from('stock_movements')
    .select('*, ingredients(name, unit)')
    .eq('type', 'waste')
    .or('type.eq.expired')
    .gte('created_at', startDate.toISOString())
    .in(
      'ingredient_id',
      (
        await supabase
          .from('ingredients')
          .select('id')
          .eq('restaurant_id', restaurantId)
      ).data?.map(i => i.id) || []
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar movimentações: ${error.message}`)
  }

  const csvHeaders = ['Data', 'Ingrediente', 'Tipo', 'Quantidade', 'Unidade', 'Notas']
  const csvRows = (movements || []).map((mov: any) => [
    new Date(mov.created_at).toLocaleDateString('pt-BR'),
    mov.ingredients?.name || 'Desconhecido',
    mov.type === 'waste' ? 'Desperdício' : 'Vencido',
    mov.quantity.toString(),
    mov.ingredients?.unit || '',
    mov.notes || '',
  ])

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return csvContent
}

/**
 * Exporta relatório de consumo mensal
 */
export async function exportMonthlyConsumptionReport(
  restaurantId: string,
  month: number,
  year: number
): Promise<string> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const { data: movements, error } = await supabase
    .from('stock_movements')
    .select('*, ingredients(name, unit, category)')
    .eq('type', 'sale')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .in(
      'ingredient_id',
      (
        await supabase
          .from('ingredients')
          .select('id')
          .eq('restaurant_id', restaurantId)
      ).data?.map(i => i.id) || []
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar movimentações: ${error.message}`)
  }

  // Agrupa por ingrediente
  const consumptionMap = new Map<
    string,
    { name: string; unit: string; category: string; total: number }
  >()

  ;(movements || []).forEach((mov: any) => {
    const ingId = mov.ingredient_id
    const ing = mov.ingredients

    if (!ing) return

    const current = consumptionMap.get(ingId) || {
      name: ing.name,
      unit: ing.unit,
      category: ing.category || '',
      total: 0,
    }

    consumptionMap.set(ingId, {
      ...current,
      total: current.total + mov.quantity,
    })
  })

  const csvHeaders = ['Ingrediente', 'Categoria', 'Total Consumido', 'Unidade']
  const csvRows = Array.from(consumptionMap.values())
    .sort((a, b) => b.total - a.total)
    .map(consumption => [
      consumption.name,
      consumption.category,
      consumption.total.toString(),
      consumption.unit,
    ])

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return csvContent
}

/**
 * Função auxiliar para download de CSV
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
