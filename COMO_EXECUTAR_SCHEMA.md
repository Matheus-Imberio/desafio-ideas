# 📋 Como Executar o Schema SQL no Supabase

## ⚠️ IMPORTANTE
Você precisa executar o arquivo `supabase_schema_extended.sql` no Supabase para que as funcionalidades de receitas, fornecedores e listas de compras funcionem!

## 🚀 Passo a Passo

### 1. Acesse o SQL Editor do Supabase

1. Vá para o seu projeto no Supabase: https://app.supabase.com
2. No menu lateral esquerdo, clique em **"SQL Editor"**
3. Clique no botão **"New query"** (ou use o atalho `Ctrl+N`)

### 2. Abra o arquivo SQL

1. No seu projeto, abra o arquivo: `supabase_schema_extended.sql`
2. **Selecione TODO o conteúdo** do arquivo (Ctrl+A ou Cmd+A)
3. **Copie** (Ctrl+C ou Cmd+C)

### 3. Cole e Execute no Supabase

1. **Cole** o conteúdo no SQL Editor do Supabase (Ctrl+V ou Cmd+V)
2. Clique no botão **"Run"** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

### 4. Verifique se Funcionou

Você deve ver uma mensagem de sucesso. Se houver erros, eles aparecerão em vermelho.

**Tabelas que serão criadas:**
- ✅ `suppliers` (Fornecedores)
- ✅ `supplier_products` (Produtos de Fornecedores)
- ✅ `recipes` (Receitas/Pratos)
- ✅ `recipe_ingredients` (Ingredientes das Receitas)
- ✅ `recipe_sales` (Vendas de Pratos)
- ✅ `shopping_lists` (Listas de Compras)
- ✅ `shopping_list_items` (Itens das Listas)
- ✅ `user_preferences` (Preferências do Usuário)

### 5. Verificar no Table Editor

1. No menu lateral do Supabase, clique em **"Table Editor"**
2. Você deve ver todas as novas tabelas listadas acima

## 🔍 Verificar se já foi executado

Se você não tem certeza se já executou o schema, verifique:

1. Vá em **"Table Editor"** no Supabase
2. Procure pela tabela `recipes`
3. Se ela existir, o schema já foi executado ✅
4. Se não existir, você precisa executar o `supabase_schema_extended.sql` ❌

## ⚠️ Erros Comuns

### Erro: "relation already exists"
- Significa que algumas tabelas já existem
- Isso é normal se você já executou parte do schema antes
- O script usa `CREATE TABLE IF NOT EXISTS`, então é seguro executar novamente

### Erro: "permission denied"
- Verifique se você está logado no Supabase
- Verifique se tem permissão de administrador no projeto

### Erro: "function does not exist"
- Execute o schema completo novamente
- Algumas funções podem não ter sido criadas

## ✅ Após Executar

Depois de executar o schema com sucesso:

1. **Recarregue a aplicação** no navegador
2. Tente **salvar uma receita** gerada pela IA
3. Vá na página **"Receitas e Pratos"** e verifique se aparece

## 📝 Nota

- O schema é **idempotente** (pode ser executado várias vezes sem problemas)
- Ele usa `CREATE TABLE IF NOT EXISTS` e `DROP POLICY IF EXISTS`, então é seguro reexecutar
- Se você já tem dados nas tabelas, eles **não serão perdidos** ao reexecutar
