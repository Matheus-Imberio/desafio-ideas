# 💰 Instruções para Controle Financeiro

## ⚠️ IMPORTANTE - Execute este SQL primeiro!

Antes de usar as funcionalidades financeiras, você precisa executar o SQL para adicionar o campo `price` e criar a tabela de transações.

### 1. Execute o SQL no Supabase

1. Abra o arquivo `ADD_FINANCIAL_TRACKING.sql`
2. Copie o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute (Run)

Isso vai:
- ✅ Adicionar campo `price` na tabela `shopping_list_items`
- ✅ Criar tabela `financial_transactions` para histórico completo
- ✅ Criar políticas RLS para segurança

## ✅ Funcionalidades Implementadas

### 1. **Preços na Lista de Compras**
- ✅ Campo de preço editável em cada item da lista
- ✅ Preço é salvo automaticamente ao digitar
- ✅ Total da lista é calculado e exibido automaticamente
- ✅ Preço aparece ao lado de cada item

### 2. **Registro Automático de Gastos**
- ✅ Ao concluir uma lista de compras, os gastos são registrados automaticamente
- ✅ Soma todos os preços dos itens com preço preenchido
- ✅ Cria transação financeira do tipo "expense" (gasto)
- ✅ Categoria: "shopping_list"

### 3. **Registro Automático de Receitas**
- ✅ Ao vender um prato com preço, registra como receita
- ✅ Cria transação financeira do tipo "revenue" (receita)
- ✅ Categoria: "recipe_sale"

### 4. **Histórico Financeiro Completo**
- ✅ Nova página "Histórico Financeiro" (ícone $ no header)
- ✅ Mostra todas as transações (receitas e gastos)
- ✅ Filtros: Todas / Receitas / Gastos
- ✅ Cards de resumo:
  - Receita Total
  - Gastos Total
  - Lucro Líquido (Receita - Gastos)

### 5. **Dashboard Atualizado**
- ✅ Card de "Lucro Líquido" destacado
- ✅ Mostra Receita - Gastos
- ✅ Cor verde se positivo, vermelho se negativo
- ✅ Detalhes de receita e gastos abaixo

## 🎯 Como Usar

### Adicionar Preços na Lista de Compras:
1. Vá na página "Listas de Compras"
2. Selecione ou crie uma lista
3. Em cada item, há um campo de preço (R$)
4. Digite o preço e ele será salvo automaticamente
5. O total da lista aparece no topo

### Concluir Lista e Registrar Gastos:
1. Preencha os preços dos itens comprados
2. Clique em "Concluir" na lista
3. O sistema calcula o total automaticamente
4. Registra como gasto no histórico financeiro
5. Mostra mensagem com o total gasto

### Ver Histórico Financeiro:
1. Clique no ícone $ (DollarSign) no header da página de Estoque
2. Ou acesse diretamente `/financial-history`
3. Veja todas as transações
4. Use os filtros para ver apenas receitas ou gastos
5. Veja o resumo no topo (Receita, Gastos, Lucro)

### Ver Lucro no Dashboard:
1. Vá na página "Dashboard"
2. Veja o card destacado de "Lucro Líquido"
3. Mostra Receita - Gastos
4. Cor verde = lucro positivo
5. Cor vermelha = prejuízo

## 📊 Estrutura de Dados

### Transações Financeiras (`financial_transactions`):
- `type`: 'revenue' (receita) ou 'expense' (gasto)
- `description`: Descrição da transação
- `amount`: Valor (sempre positivo)
- `category`: 'recipe_sale', 'shopping_list', ou 'other'
- `reference_id`: ID da receita vendida ou lista concluída
- `transaction_date`: Data da transação

### Itens de Lista (`shopping_list_items`):
- `price`: Preço pago pelo item (opcional)

## 🔧 Notas Técnicas

- Preços são opcionais - você pode deixar em branco
- Apenas itens com preço são somados ao concluir a lista
- Transações são criadas automaticamente ao:
  - Concluir lista de compras (se houver preços)
  - Vender prato (se houver preço na venda)
- Histórico mostra todas as transações ordenadas por data (mais recente primeiro)
- Lucro Líquido = Total de Receitas - Total de Gastos
