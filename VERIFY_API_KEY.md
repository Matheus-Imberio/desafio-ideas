# 🔍 Verificação das Chaves do Supabase

## Você tem duas chaves disponíveis:

1. **Publishable API Key:** `sb_publishable_tgaVoeNO6P6ar8aS2ee57w_GtDeUElw`
2. **Anon Key:** (precisa verificar no dashboard)

## ⚠️ Problema Atual

O erro "Invalid API key" (401) indica que a chave `sb_publishable_` pode não ser a correta para autenticação.

## ✅ Solução: Usar a Chave `anon`

O Supabase requer a chave **`anon`** (não a `publishable`) para operações de autenticação no cliente.

### Como encontrar a chave `anon`:

1. Acesse: https://app.supabase.com/project/fefjgvjxmmwspuceanhy/settings/api

2. Procure pela seção **"Project API keys"**

3. Você verá duas chaves:
   - **`anon` `public`** ← **USE ESTA** (começa com `eyJ...`)
   - **`service_role` `secret`** ← NUNCA use no cliente

4. Copie a chave **`anon` `public`** completa

### Atualizar o `.env.local`:

Substitua a linha da chave:

```bash
VITE_SUPABASE_URL=https://fefjgvjxmmwspuceanhy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (sua chave anon aqui)
```

**Importante:**
- A chave `anon` geralmente começa com `eyJ` (é um JWT token)
- A chave `sb_publishable_` pode ser para outro propósito
- Para autenticação, sempre use a chave `anon`

### Depois de atualizar:

1. Salve o arquivo `.env.local`
2. **Reinicie o servidor** (Ctrl+C e depois `npm run dev`)
3. Tente criar a conta novamente

## 🔄 Se ainda não funcionar:

Verifique se:
- ✅ Copiou a chave completa (sem espaços)
- ✅ A chave começa com `eyJ`
- ✅ Reiniciou o servidor após mudar
- ✅ O arquivo está na raiz do projeto
