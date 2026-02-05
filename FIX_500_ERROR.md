# 🔧 Como Corrigir Erro 500 no Signup

## Possíveis Causas

O erro 500 (Internal Server Error) no signup pode ser causado por:

1. **Confirmação de email habilitada** - Supabase tentando enviar email e falhando
2. **Trigger automático falhando** - Algum trigger no banco está causando erro
3. **Políticas RLS muito restritivas** - Bloqueando criação de dados
4. **Schema não executado completamente** - Alguma tabela/função faltando

## ✅ Solução 1: Desabilitar Confirmação de Email (Rápido)

1. Acesse: https://app.supabase.com/project/fefjgvjxmmwspuceanhy/auth/providers
2. Role até a seção **"Email Auth"**
3. Desabilite **"Confirm email"** (toggle OFF)
4. Salve as alterações
5. Tente criar conta novamente

## ✅ Solução 2: Verificar Schema SQL

Execute este SQL no Supabase para verificar se tudo está criado:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Deve retornar:
-- alerts
-- ingredients  
-- restaurants
-- stock_movements
```

Se alguma tabela estiver faltando, execute o `supabase_schema.sql` novamente.

## ✅ Solução 3: Verificar Logs do Supabase

1. Acesse: https://app.supabase.com/project/fefjgvjxmmwspuceanhy/logs/edge-logs
2. Veja os logs mais recentes
3. Procure por erros relacionados ao signup
4. Isso vai mostrar o erro exato que está causando o 500

## ✅ Solução 4: Testar Signup com Email de Teste

O Supabase pode ter restrições de email. Tente:

1. Use um email válido (não precisa ser real)
2. Ou configure email de teste no Supabase:
   - Vá em Settings > Auth > Email Templates
   - Configure um email SMTP de teste

## 🔍 Diagnóstico Rápido

Execute este SQL para verificar se há problemas:

```sql
-- Verificar se a tabela restaurants existe e tem permissões
SELECT * FROM pg_tables WHERE tablename = 'restaurants';

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'restaurants';
```

## ⚡ Solução Mais Provável

**Desabilitar confirmação de email** resolve 90% dos casos de erro 500 no signup.

1. Vá em: Auth > Providers > Email
2. Desabilite "Confirm email"
3. Salve
4. Tente novamente

## 📝 Se Nada Funcionar

Verifique os logs do Supabase para ver o erro exato:
- Dashboard > Logs > Edge Logs
- Procure por erros relacionados a `/auth/v1/signup`
