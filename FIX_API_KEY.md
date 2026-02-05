# 🔑 Como Corrigir o Erro "Invalid API key"

## Problema

O erro "Invalid API key" (401 Unauthorized) indica que a chave da API do Supabase está incorreta ou não é a chave adequada para uso no cliente.

## Solução

### 1. Obter a Chave Correta no Supabase

1. Acesse o dashboard do Supabase:
   ```
   https://app.supabase.com/project/fefjgvjxmmwspuceanhy/settings/api
   ```

2. Na seção **"Project API keys"**, você verá:
   - **`anon` `public`** - Esta é a chave que você precisa usar no cliente
   - **`service_role` `secret`** - NUNCA use esta no cliente (é privada)

3. Copie a chave **`anon` `public`** (ela geralmente começa com `eyJ`)

### 2. Atualizar o arquivo `.env.local`

Edite o arquivo `.env.local` na raiz do projeto e substitua a chave:

```bash
VITE_SUPABASE_URL=https://fefjgvjxmmwspuceanhy.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI
```

**Importante:** 
- Use a chave `anon` (não a `service_role`)
- A chave deve começar com `eyJ` (é um JWT token)
- Não use a chave `sb_publishable_` - essa é diferente

### 3. Reiniciar o Servidor

Após atualizar o arquivo:

1. Pare o servidor (Ctrl+C)
2. Inicie novamente:
   ```bash
   npm run dev
   ```

### 4. Testar Novamente

Tente criar uma conta novamente. O erro deve desaparecer.

## Verificação Rápida

A chave correta deve:
- ✅ Começar com `eyJ` (JWT token)
- ✅ Estar na seção "anon public" do Supabase
- ✅ Ter cerca de 200+ caracteres
- ❌ NÃO começar com `sb_`
- ❌ NÃO ser a chave "service_role"

## Exemplo de Chave Correta

```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZmpndmp4bW13cHVjZWFuaHkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2ODAwMCwiZXhwIjoyMDE0MzQ0MDAwfQ.abc123def456...
```

## Se Ainda Não Funcionar

1. Verifique se copiou a chave completa (sem espaços)
2. Verifique se o arquivo `.env.local` está na raiz do projeto
3. Certifique-se de que reiniciou o servidor após mudar o arquivo
4. Verifique se não há espaços extras ou quebras de linha na chave
