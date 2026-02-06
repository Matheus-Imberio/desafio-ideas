# 📋 Instruções para Funcionalidades de Vendas

## ⚠️ IMPORTANTE - Execute este SQL primeiro!

Antes de usar as funcionalidades de vendas, você precisa executar o SQL para adicionar o campo `price` na tabela `recipe_sales`.

### 1. Execute o SQL no Supabase

1. Abra o arquivo `ADD_PRICE_TO_RECIPE_SALES.sql`
2. Copie o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute (Run)

Isso adiciona o campo `price` na tabela `recipe_sales` para armazenar o preço de venda dos pratos.

## ✅ Funcionalidades Implementadas

### 1. **Correção do Erro 403**
- ✅ Corrigido erro ao vender prato
- ✅ Agora passa o `user_id` corretamente para a função `sellRecipe`

### 2. **Modal de Preço/Quantidade ao Salvar Receita**
- ✅ Ao salvar uma receita sugerida pela IA, aparece um modal
- ✅ Permite informar quantidade de porções
- ✅ Permite informar preço de venda (opcional)
- ✅ O preço é calculado automaticamente por porção

### 3. **Formulário para Adicionar Receitas Manualmente**
- ✅ Botão "Nova Receita" na página de Receitas
- ✅ Formulário completo com:
  - Nome da receita
  - Descrição
  - Quantidade de porções
  - Tempo de preparo
  - Custo por porção
  - Lista de ingredientes (pode adicionar/remover)

### 4. **Faturamento nos Gráficos**
- ✅ Card de "Faturamento Total" no Dashboard
- ✅ Card de "Total de Vendas"
- ✅ Gráfico de "Faturamento dos Últimos 30 Dias"
- ✅ Lista de "Top Receitas Vendidas" com faturamento

## 🎯 Como Usar

### Vender um Prato:
1. Vá na página "Receitas e Pratos"
2. Clique em "Vender Prato" na receita desejada
3. O estoque será atualizado automaticamente
4. A venda aparecerá nos gráficos de faturamento

### Salvar Receita Sugerida pela IA:
1. Na página de Estoque, clique em "Receitas Sugeridas"
2. Escolha uma receita
3. Clique em "Salvar Receita"
4. Informe quantidade de porções e preço (opcional)
5. Clique em "Salvar Receita"

### Adicionar Receita Manualmente:
1. Vá na página "Receitas e Pratos"
2. Clique em "Nova Receita"
3. Preencha os dados:
   - Nome da receita
   - Descrição (opcional)
   - Quantidade de porções
   - Tempo de preparo (opcional)
   - Custo por porção (opcional)
   - Ingredientes (adicione quantos precisar)
4. Clique em "Salvar Receita"

### Ver Faturamento:
1. Vá na página "Dashboard"
2. Veja os cards de faturamento no topo
3. Veja o gráfico de faturamento dos últimos 30 dias
4. Veja a lista de top receitas vendidas

## 📊 Dados de Faturamento

Os dados de faturamento são calculados automaticamente com base nas vendas registradas:
- **Faturamento Total**: Soma de todos os preços de venda
- **Total de Vendas**: Quantidade total de pratos vendidos
- **Gráfico**: Mostra o faturamento por dia nos últimos 30 dias
- **Top Receitas**: Lista as receitas mais vendidas ordenadas por faturamento

## 🔧 Notas Técnicas

- O campo `price` na tabela `recipe_sales` é opcional
- Se não informar o preço ao vender, o faturamento será 0 para aquela venda
- O preço pode ser informado ao salvar a receita ou ao vender o prato
- Todas as vendas são registradas com `user_id` para controle de quem vendeu
