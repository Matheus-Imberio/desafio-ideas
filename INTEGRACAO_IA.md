# 🤖 Como Integrar IA no Sistema

## Opções de Integração

### 1. Groq (Recomendado - Rápido e Gratuito) ⚡

#### Passo 1: Obter API Key
1. Acesse: https://console.groq.com/
2. Crie uma conta gratuita (não precisa cartão!)
3. Vá em "API Keys"
4. Clique em "Create API Key"
5. Copie a chave

#### Passo 2: Configurar no Projeto
Adicione no arquivo `.env.local`:

```bash
VITE_GROQ_API_KEY=gsk_sua-chave-aqui
VITE_GROQ_MODEL=llama-3.3-70b-versatile
```

**Modelos disponíveis (atualizados em 2025):**
- `llama-3.3-70b-versatile` (recomendado - mais poderoso, 280 T/s)
- `llama-3.1-8b-instant` (mais rápido e barato, 560 T/s)

**Nota:** O modelo `llama-3.1-70b-versatile` foi descontinuado. Use `llama-3.3-70b-versatile` como alternativa.

#### Passo 3: Usar
O sistema já está configurado! Quando você tiver a API key configurada, as receitas serão geradas pela IA automaticamente.

**Vantagens do Groq:**
- ✅ **Totalmente gratuito** (até 30 requests/minuto)
- ✅ **Super rápido** (respostas em segundos)
- ✅ **Modelos poderosos** (Llama 3, Mixtral)
- ✅ **Sem necessidade de cartão de crédito**

---

### 2. OpenAI (Alternativa - Pago)

---

### 2. Anthropic Claude (Alternativa)

#### Passo 1: Obter API Key
1. Acesse: https://console.anthropic.com/
2. Crie uma conta
3. Vá em "API Keys"
4. Crie uma nova chave

#### Passo 2: Atualizar código
Edite `src/lib/ai.ts` e troque a URL e headers:

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  })
})
```

Adicione no `.env.local`:
```bash
VITE_ANTHROPIC_API_KEY=sua-chave-aqui
```

---

### 3. Google Gemini (Gratuito até certo limite)

#### Passo 1: Obter API Key
1. Acesse: https://makersuite.google.com/app/apikey
2. Crie uma chave gratuita

#### Passo 2: Atualizar código
Edite `src/lib/ai.ts`:

```typescript
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }]
  })
})
```

---

### 4. Ollama (Local - Gratuito, mas requer instalação)

#### Passo 1: Instalar Ollama
```bash
# Linux/Mac
curl -fsSL https://ollama.ai/install.sh | sh

# Ou baixe em: https://ollama.ai/download
```

#### Passo 2: Iniciar servidor
```bash
ollama serve
```

#### Passo 3: Atualizar código
Edite `src/lib/ai.ts`:

```typescript
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama2', // ou 'mistral', 'codellama', etc
    prompt: prompt,
    stream: false
  })
})
```

**Vantagem:** Totalmente gratuito e funciona offline!

---

## Como Funciona

1. **Com IA configurada:**
   - Sistema analisa seus ingredientes
   - Envia contexto para a IA (ingredientes disponíveis, vencendo, estoque alto)
   - IA gera receitas personalizadas e inteligentes
   - Receitas aparecem primeiro, depois as estáticas

2. **Sem IA (fallback):**
   - Sistema usa base de dados estática de receitas
   - Funciona normalmente, mas sem personalização

---

## Testando

1. Adicione a API key no `.env.local`
2. Reinicie o servidor (`npm run dev`)
3. Adicione alguns ingredientes
4. Clique em "Receitas"
5. Veja receitas geradas pela IA! 🎉

---

## Dicas

- **Groq**: ⚡ Rápido, gratuito e poderoso (RECOMENDADO)
- **OpenAI**: Melhor qualidade, pago mas barato
- **Gemini**: Gratuito até certo limite, boa qualidade
- **Ollama**: Gratuito e local, mas precisa rodar servidor
- **Sem API**: Sistema funciona com receitas estáticas

---

## Exemplo de Uso

```bash
# .env.local
VITE_GROQ_API_KEY=gsk_abc123...
VITE_GROQ_MODEL=llama-3.3-70b-versatile
```

Pronto! O sistema detecta automaticamente e usa a IA quando disponível.

## Limites do Groq (Gratuito)

- ✅ **30 requests por minuto**
- ✅ **14,400 requests por dia**
- ✅ **Sem limite de tokens** (dentro do razoável)
- ✅ **Sem necessidade de cartão**

Perfeito para uso pessoal e pequenos projetos! 🚀
