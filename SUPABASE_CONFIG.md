# Configuração do Supabase - Projeto desafio-ideas

## Credenciais do Projeto

**Project URL:** `https://fefjgvjxmmwspuceanhy.supabase.co`
**Project Ref:** `fefjgvjxmmwspuceanhy`
**Publishable API Key:** `sb_publishable_tgaVoeNO6P6ar8aS2ee57w_GtDeUElw`

## Configuração Manual

Como os arquivos `.env.local` são bloqueados, você precisa criar manualmente:

### 1. Criar arquivo `.env.local` na raiz do projeto:

```bash
cd /home/appmoove/dyad-apps/desafio-ideas
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://fefjgvjxmmwspuceanhy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_tgaVoeNO6P6ar8aS2ee57w_GtDeUElw
EOF
```

### 2. Instalar o cliente Supabase:

```bash
npm install @supabase/supabase-js
```

### 3. Usar no código:

O arquivo `src/lib/supabase.ts` já foi criado. Importe e use assim:

```typescript
import { supabase } from '@/lib/supabase'

// Exemplo: buscar dados
const { data, error } = await supabase.from('sua_tabela').select('*')

// Exemplo: inserir dados
const { data, error } = await supabase
  .from('sua_tabela')
  .insert([{ campo: 'valor' }])
```

## Conectar via CLI (Opcional)

Se quiser usar a CLI do Supabase:

```bash
# 1. Instalar CLI
yay -S supabase-bin

# 2. Fazer login
supabase login

# 3. Linkar ao projeto
supabase link --project-ref fefjgvjxmmwspuceanhy
```

## Status

✅ Cliente Supabase configurado em `src/lib/supabase.ts`
✅ `.gitignore` configurado para não commitar arquivos `.env.local`
⏳ Você precisa criar o arquivo `.env.local` manualmente (veja acima)
⏳ Instalar dependência: `npm install @supabase/supabase-js`
