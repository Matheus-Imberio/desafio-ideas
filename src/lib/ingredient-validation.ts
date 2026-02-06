/**
 * Validação de ingredientes - verifica se é realmente um ingrediente comestível
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

/**
 * Lista de palavras-chave que indicam que NÃO é um ingrediente comestível
 */
const NON_FOOD_KEYWORDS = [
  'cadeira', 'mesa', 'garfo', 'faca', 'prato', 'copo', 'panela', 'frigideira',
  'geladeira', 'fogão', 'microondas', 'liquidificador', 'batedeira', 'forno',
  'pia', 'torneira', 'lixeira', 'balcão', 'armário', 'gaveta', 'porta', 'janela',
  'parede', 'teto', 'chão', 'piso', 'tinta', 'tela', 'monitor', 'computador',
  'teclado', 'mouse', 'celular', 'telefone', 'tablet', 'notebook', 'impressora',
  'papel', 'caneta', 'lápis', 'borracha', 'caderno', 'livro', 'revista', 'jornal',
  'carro', 'moto', 'bicicleta', 'ônibus', 'avião', 'barco', 'navio', 'trem',
  'roupa', 'camisa', 'calça', 'sapato', 'tênis', 'meia', 'cueca', 'sutiã',
  'relógio', 'óculos', 'bolsa', 'mochila', 'carteira', 'chave', 'cadeado',
  'ferramenta', 'martelo', 'chave de fenda', 'alicate', 'serra', 'furadeira',
  'parafuso', 'prego', 'arame', 'fio', 'cabo', 'plugue', 'tomada', 'lâmpada',
  'interruptor', 'ventilador', 'ar condicionado', 'aquecedor', 'chuveiro',
  'sabonete', 'shampoo', 'condicionador', 'pasta de dente', 'escova de dente',
  'toalha', 'lençol', 'travesseiro', 'cobertor', 'edredom', 'cortina',
  'planta', 'vaso', 'terra', 'adubo', 'semente', 'flor', 'árvore', 'grama',
  'animal', 'cachorro', 'gato', 'pássaro', 'peixe', 'hamster', 'coelho',
  'brinquedo', 'boneca', 'carrinho', 'bola', 'jogo', 'videogame', 'console',
  'medicamento', 'remédio', 'vitamina', 'suplemento', 'pílula', 'comprimido',
  'produto de limpeza', 'detergente', 'sabão', 'desinfetante', 'água sanitária',
  'perfume', 'desodorante', 'creme', 'loção', 'protetor solar', 'maquiagem',
  'pincel', 'espelho', 'pente', 'tesoura', 'alicate de unha', 'lixa',
]

/**
 * Valida se um nome de ingrediente é realmente um ingrediente comestível
 * Usa IA (Groq) para validação inteligente - SEMPRE tenta usar IA primeiro
 */
export async function validateIngredientName(name: string): Promise<{
  isValid: boolean
  reason?: string
  suggestion?: string
}> {
  // Normaliza o nome
  const normalizedName = name.trim().toLowerCase()

  // Validação básica de tamanho
  if (normalizedName.length < 2) {
    return {
      isValid: false,
      reason: 'Nome muito curto. Use um nome descritivo do ingrediente.',
    }
  }

  // Se não tem API key, usa validação com palavras-chave como fallback
  if (!GROQ_API_KEY) {
    console.warn('VITE_GROQ_API_KEY não configurada. Usando validação básica.')
    
    // Verificação rápida com palavras-chave
    for (const keyword of NON_FOOD_KEYWORDS) {
      if (normalizedName.includes(keyword.toLowerCase())) {
        return {
          isValid: false,
          reason: `"${name}" não parece ser um ingrediente comestível. Parece ser um(a) ${keyword}.`,
        }
      }
    }

    // Se passou na validação básica, aceita
    return { isValid: true }
  }

  // SEMPRE usa IA quando disponível
  try {
    const prompt = `Você é um especialista em culinária, ingredientes de cozinha e alimentos comestíveis.

Analise cuidadosamente se "${name}" é um ingrediente comestível que pode ser usado em receitas de cozinha ou preparação de alimentos.

Considere:
- Ingredientes comestíveis: frutas, verduras, legumes, carnes, peixes, grãos, especiarias, condimentos, laticínios, etc.
- NÃO são ingredientes: móveis, utensílios, eletrônicos, roupas, ferramentas, produtos de limpeza, medicamentos, etc.
- Erros de digitação: se parecer um erro de digitação de um ingrediente válido, sugira a correção

Responda APENAS com um JSON válido no formato:
{
  "isValid": true ou false,
  "reason": "explicação curta e clara em português",
  "suggestion": "sugestão de nome correto se houver erro de digitação (opcional, apenas se isValid for true)"
}

Exemplos de respostas corretas:
- "tomate" → {"isValid": true, "reason": "Ingrediente válido - tomate é um legume comestível"}
- "cadeira" → {"isValid": false, "reason": "Não é um ingrediente comestível. Cadeira é um móvel, não um alimento."}
- "tomatee" → {"isValid": true, "reason": "Ingrediente válido (possível erro de digitação)", "suggestion": "tomate"}
- "garfo" → {"isValid": false, "reason": "Não é um ingrediente comestível. Garfo é um utensílio de cozinha, não um alimento."}
- "pão" → {"isValid": true, "reason": "Ingrediente válido - pão é um alimento básico"}
- "mesa" → {"isValid": false, "reason": "Não é um ingrediente comestível. Mesa é um móvel, não um alimento."}
- "alho" → {"isValid": true, "reason": "Ingrediente válido - alho é um tempero comestível"}
- "computador" → {"isValid": false, "reason": "Não é um ingrediente comestível. Computador é um equipamento eletrônico, não um alimento."}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em culinária e ingredientes comestíveis. Sua função é analisar se um nome representa um ingrediente comestível. Responda APENAS com JSON válido, sem markdown, sem código, sem texto adicional. Comece diretamente com { e termine com }.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2, // Temperatura muito baixa para respostas mais consistentes e precisas
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro na API Groq:', response.status, errorText)
      // Se a API falhar, usa validação básica como fallback
      return quickValidateIngredientName(name)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      console.warn('Resposta vazia da IA, usando validação básica')
      return quickValidateIngredientName(name)
    }

    // Limpa e parseia JSON
    let cleanedContent = content.trim()
    cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

    try {
      const result = JSON.parse(cleanedContent)
      return {
        isValid: result.isValid === true,
        reason: result.reason,
        suggestion: result.suggestion,
      }
    } catch (parseError) {
      // Se não conseguir parsear, tenta extrair JSON do texto
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0])
          return {
            isValid: result.isValid === true,
            reason: result.reason,
            suggestion: result.suggestion,
          }
        } catch (e) {
          console.error('Erro ao parsear JSON extraído:', e)
        }
      }
      
      console.error('Não foi possível parsear resposta da IA:', cleanedContent)
      // Fallback para validação básica
      return quickValidateIngredientName(name)
    }
  } catch (error) {
    console.error('Erro ao validar ingrediente com IA:', error)
    // Fallback para validação básica em caso de erro
    return quickValidateIngredientName(name)
  }
}

/**
 * Validação rápida sem IA (para uso quando não há API key)
 */
export function quickValidateIngredientName(name: string): {
  isValid: boolean
  reason?: string
} {
  const normalizedName = name.trim().toLowerCase()

  // Verifica palavras-chave não comestíveis
  for (const keyword of NON_FOOD_KEYWORDS) {
    if (normalizedName.includes(keyword.toLowerCase())) {
      return {
        isValid: false,
        reason: `"${name}" não parece ser um ingrediente comestível. Parece ser um(a) ${keyword}.`,
      }
    }
  }

  // Validação básica
  if (normalizedName.length < 2) {
    return {
      isValid: false,
      reason: 'Nome muito curto. Use um nome descritivo do ingrediente.',
    }
  }

  // Se passou nas validações, aceita
  return { isValid: true }
}
