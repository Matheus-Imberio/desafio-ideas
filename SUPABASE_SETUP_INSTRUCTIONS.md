# 🗄️ Instruções para Configurar o Schema no Supabase

## Passo a Passo

### 1. Acesse o SQL Editor do Supabase

1. Vá para: https://app.supabase.com/project/fefjgvjxmmwspuceanhy
2. No menu lateral, clique em **"SQL Editor"**
3. Clique em **"New query"**

### 2. Execute o Schema SQL

1. Abra o arquivo `supabase_schema.sql` neste projeto
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **"Run"** ou pressione `Ctrl+Enter` (ou `Cmd+Enter` no Mac)

### 3. Verificar se Funcionou

Após executar, você deve ver:
- ✅ Mensagem de sucesso
- ✅ Tabelas criadas: `restaurants`, `ingredients`, `stock_movements`, `alerts`
- ✅ Políticas RLS habilitadas
- ✅ Triggers e funções criados

### 4. Verificar as Tabelas

No Supabase Dashboard:
1. Vá em **"Table Editor"** no menu lateral
2. Você deve ver as 4 tabelas criadas:
   - `restaurants`
   - `ingredients`
   - `stock_movements`
   - `alerts`

### 5. Criar Restaurante Inicial (Opcional)

Quando um usuário se cadastrar, você precisará criar um restaurante para ele. Isso pode ser feito:

**Opção A: Via código (recomendado)**
```typescript
// Após o cadastro/login bem-sucedido
const { data: restaurant } = await supabase
  .from('restaurants')
  .insert({ name: 'Meu Restaurante', owner_id: user.id })
  .select()
  .single()
```

**Opção B: Via função SQL (automático)**
Descomente a função no final do `supabase_schema.sql` se quiser criação automática.

## 🔐 Segurança (RLS)

O schema já está configurado com **Row Level Security (RLS)**:
- ✅ Usuários só veem seus próprios dados
- ✅ Usuários só podem modificar dados dos seus restaurantes
- ✅ Políticas de segurança aplicadas automaticamente

## 📊 Estrutura das Tabelas

### `restaurants`
- Armazena restaurantes (multi-tenancy)
- Cada usuário pode ter um ou mais restaurantes
- `owner_id` referencia `auth.users`

### `ingredients`
- Ingredientes do estoque
- Campos: nome, quantidade, unidade, estoque mínimo, validade, categoria
- Relacionado com `restaurants`

### `stock_movements`
- Histórico de todas as movimentações
- Criado automaticamente quando quantidade muda
- Tipos: purchase, sale, adjustment, waste, expired

### `alerts`
- Alertas automáticos gerados por triggers
- Tipos: low_stock, expiring_soon, expired
- Atualizados automaticamente quando ingredientes mudam

## ⚡ Funcionalidades Automáticas

O schema inclui **triggers automáticos** que:

1. **Atualizam `updated_at`** automaticamente
2. **Criam alertas** quando:
   - Estoque <= estoque mínimo
   - Vencimento em até 3 dias
   - Ingrediente vencido
3. **Registram movimentações** automaticamente quando quantidade muda

## 🐛 Troubleshooting

### Erro: "permission denied"
- Verifique se está logado no Supabase
- Certifique-se de estar no projeto correto

### Erro: "relation already exists"
- As tabelas já existem
- Você pode dropar e recriar, ou usar `CREATE TABLE IF NOT EXISTS`

### Erro: "function already exists"
- As funções já existem
- O script usa `CREATE OR REPLACE` então deve funcionar

### Verificar RLS
```sql
-- Ver políticas criadas
SELECT * FROM pg_policies WHERE tablename IN ('restaurants', 'ingredients', 'stock_movements', 'alerts');
```

## ✅ Próximos Passos

Após executar o schema:
1. ✅ Tabelas criadas
2. ✅ RLS configurado
3. ✅ Triggers funcionando
4. ⏳ O Dyad pode continuar implementando o CRUD
