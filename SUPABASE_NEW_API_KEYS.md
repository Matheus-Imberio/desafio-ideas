# 🔑 Configuração com Novas API Keys do Supabase

## Situação

O Supabase atualizou o sistema de API keys. Você tem duas opções:

### Opção 1: Usar as Chaves Legacy (Recomendado para compatibilidade)

1. No dashboard do Supabase, clique na aba **"Legacy anon, service_role API keys"**
2. Copie a chave **`anon` `public`** (começa com `eyJ...`)
3. Use essa chave no `.env.local`:

```bash
VITE_SUPABASE_URL=https://fefjgvjxmmwspuceanhy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (chave anon legacy)
```

### Opção 2: Usar a Nova Chave Publishable

Se quiser usar a nova chave `sb_publishable_`, você precisa:

1. Verificar se a versão do `@supabase/supabase-js` suporta (versão 2.39.0+)
2. A chave que você tem: `sb_publishable_tgaVoeNO6P6ar8aS2ee57w_GtDeUElw`

**IMPORTANTE:** Se ainda der erro 401 com a chave publishable, use a chave legacy `anon`.

## Solução Rápida

1. Clique na aba **"Legacy anon, service_role API keys"**
2. Copie a chave **`anon` `public`** completa
3. Atualize o `.env.local`:
   ```bash
   VITE_SUPABASE_ANON_KEY=eyJ... (cole a chave anon aqui)
   ```
4. Reinicie o servidor: `npm run dev`

## Por que usar a chave Legacy?

- ✅ Mais compatível com versões antigas do cliente
- ✅ Funciona garantidamente com `@supabase/supabase-js`
- ✅ É a chave padrão para autenticação
- ✅ Menos problemas de compatibilidade
