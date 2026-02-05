/**
 * Serviço de IA para recomendações inteligentes de receitas
 */

import type { Ingredient } from './types'

interface AIRecipeSuggestion {
  name: string
  description: string
  ingredients: string[]
  instructions: string[]
  cookingTime: number
  servings: number
  reason: string // Por que essa receita foi sugerida
}

/**
 * Gera recomendações de receitas usando IA (Groq)
 * Groq é rápido, gratuito e oferece modelos como Llama 3 e Mixtral
 */
export async function getAIRecipeSuggestions(
  ingredients: Ingredient[],
  expiringIngredients: Ingredient[],
  highStockIngredients: Ingredient[]
): Promise<AIRecipeSuggestion[]> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  
  if (!apiKey) {
    // Se não tiver API key, retorna array vazio (fallback para receitas estáticas)
    console.warn('VITE_GROQ_API_KEY não configurada. Usando receitas estáticas.')
    return []
  }

  try {
    // Prepara contexto para a IA
    const availableIngredients = ingredients
      .filter(ing => !isExpired(ing))
      .map(ing => `${ing.name} (${ing.quantity} ${ing.unit})`)
      .join(', ')

    const expiringList = expiringIngredients
      .map(ing => `${ing.name} (vence em ${getDaysUntilExpiry(ing)} dias)`)
      .join(', ')

    const highStockList = highStockIngredients
      .map(ing => `${ing.name} (${ing.quantity} ${ing.unit} - estoque alto)`)
      .join(', ')

    const prompt = `Você é um chef experiente. Sugira 3 receitas práticas e deliciosas baseadas nos ingredientes disponíveis.

INGREDIENTES DISPONÍVEIS: ${availableIngredients}

INGREDIENTES VENCENDO EM BREVE (priorizar usar): ${expiringList || 'Nenhum'}

INGREDIENTES COM MUITO ESTOQUE (priorizar usar): ${highStockList || 'Nenhum'}

REQUISITOS:
- Use principalmente ingredientes que estão vencendo em breve
- Priorize ingredientes com muito estoque disponível
- Receitas devem ser práticas e rápidas de fazer
- Se faltar algum ingrediente, mencione como substituição opcional
- Retorne APENAS um array JSON válido, sem markdown, sem código, sem texto adicional

FORMATO DE RESPOSTA (retorne APENAS o array JSON):
[
  {
    "name": "Nome da Receita",
    "description": "Breve descrição",
    "ingredients": ["ingrediente1", "ingrediente2"],
    "instructions": ["passo 1", "passo 2"],
    "cookingTime": 30,
    "servings": 4,
    "reason": "Por que essa receita foi sugerida (ex: usa tomate que vence em 2 dias)"
  }
]`

    // Groq API endpoint
    // Modelos disponíveis:
    // - llama-3.3-70b-versatile (mais poderoso, recomendado)
    // - llama-3.1-8b-instant (mais rápido e barato)
    const model = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Você é um chef experiente especializado em criar receitas práticas e deliciosas. Sua resposta deve ser APENAS um array JSON válido, sem markdown, sem código, sem explicações. Comece diretamente com [ e termine com ].'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro na API Groq: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('Resposta vazia da IA')
    }

    // Limpa a resposta removendo markdown code blocks se houver
    let cleanedContent = content.trim()
    cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    
    // Tenta parsear diretamente ou extrair JSON
    let recipes: AIRecipeSuggestion[]
    try {
      const parsed = JSON.parse(cleanedContent)
      if (parsed.recipes && Array.isArray(parsed.recipes)) {
        recipes = parsed.recipes
      } else if (Array.isArray(parsed)) {
        recipes = parsed
      } else {
        const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
          throw new Error('Formato de resposta inválido')
        }
        recipes = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error('Resposta da IA (Groq):', cleanedContent)
        throw new Error('Não foi possível extrair JSON da resposta')
      }
      recipes = JSON.parse(jsonMatch[0])
    }

    // Valida e limpa os dados
    return recipes
      .filter((r: any) => r && r.name && Array.isArray(r.ingredients) && Array.isArray(r.instructions))
      .map((r: any) => ({
        name: String(r.name || 'Receita sem nome'),
        description: String(r.description || ''),
        ingredients: Array.isArray(r.ingredients) ? r.ingredients.map(String) : [],
        instructions: Array.isArray(r.instructions) ? r.instructions.map(String) : [],
        cookingTime: Number(r.cookingTime) || 30,
        servings: Number(r.servings) || 4,
        reason: String(r.reason || 'Receita sugerida com base nos ingredientes disponíveis')
      }))
      .slice(0, 3) // Máximo 3 receitas

  } catch (error) {
    console.error('Erro ao buscar receitas da IA (Groq):', error)
    // Retorna array vazio em caso de erro (fallback para receitas estáticas)
    return []
  }
}

/**
 * Verifica se ingrediente está vencido
 */
function isExpired(ingredient: Ingredient): boolean {
  if (!ingredient.expiry_date) return false
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const parts = ingredient.expiry_date.split('-')
  const expiryDate = parts.length === 3
    ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    : new Date(ingredient.expiry_date)
  expiryDate.setHours(0, 0, 0, 0)
  
  return expiryDate < today
}

/**
 * Calcula dias até vencimento
 */
function getDaysUntilExpiry(ingredient: Ingredient): number {
  if (!ingredient.expiry_date) return 999
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const parts = ingredient.expiry_date.split('-')
  const expiryDate = parts.length === 3
    ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    : new Date(ingredient.expiry_date)
  expiryDate.setHours(0, 0, 0, 0)
  
  return Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Configuração do modelo Groq
 * Modelos disponíveis:
 * - llama-3.1-70b-versatile (recomendado - mais inteligente)
 * - llama-3.1-8b-instant (mais rápido)
 * - mixtral-8x7b-32768 (bom equilíbrio)
 */
export const GROQ_MODELS = {
  versatile: 'llama-3.3-70b-versatile', // Modelo mais poderoso (sucessor do 3.1-70b)
  fast: 'llama-3.1-8b-instant' // Modelo mais rápido e barato
} as const
