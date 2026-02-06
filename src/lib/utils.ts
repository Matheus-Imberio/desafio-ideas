import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Traduz a unidade para português
 */
export function translateUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    kg: 'kg',
    g: 'g',
    liters: 'litros',
    ml: 'ml',
    units: 'unidades',
  }
  return unitMap[unit] || unit
}

/**
 * Formata quantidade mostrando decimais apenas quando necessário
 * Para unidades (units): mostra inteiro
 * Para kg, liters, g, ml: mostra decimais quando houver (remove zeros à direita)
 */
export function formatQuantity(quantity: number, unit: string): string {
  // Unidades que devem ser inteiras
  const integerUnits = ['units', 'unidades']
  
  // Se for unidade inteira, retorna sem decimais
  if (integerUnits.includes(unit.toLowerCase())) {
    return Math.round(quantity).toString()
  }
  
  // Para outras unidades (kg, liters, g, ml), mostra decimais apenas se houver
  // Remove zeros à direita e ponto final se não houver decimais significativos
  const numStr = quantity.toString()
  
  // Se não tem ponto decimal, retorna como está
  if (!numStr.includes('.')) {
    return numStr
  }
  
  // Remove zeros à direita e ponto se não sobrar nada
  return numStr.replace(/\.?0+$/, '')
}

/**
 * Formata data em português (dd de MMM de yyyy)
 * Corrige problema de fuso horário ao criar data a partir de string YYYY-MM-DD
 */
export function formatDatePT(date: Date | string): string {
  let d: Date
  if (typeof date === 'string') {
    // Se for string no formato YYYY-MM-DD, cria data no fuso horário local
    const parts = date.split('-')
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  
  const months = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ]
  const day = d.getDate()
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  return `${day} de ${month} de ${year}`
}

/**
 * Formata data e hora em português (dd de MMM às HH:mm)
 */
export function formatDateTimePT(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const months = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ]
  const day = d.getDate()
  const month = months[d.getMonth()]
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day} de ${month} às ${hours}:${minutes}`
}
