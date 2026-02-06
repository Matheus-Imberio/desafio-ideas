# 🛒 Instruções para Vincular Fornecedores às Compras

## ⚠️ IMPORTANTE - Execute este SQL primeiro!

Antes de usar a funcionalidade de vincular fornecedores às compras, você precisa executar o SQL para adicionar o campo `supplier_id` na tabela de transações financeiras.

### 1. Execute o SQL no Supabase

1. Abra o arquivo `ADD_SUPPLIER_TO_FINANCIAL_TRANSACTIONS.sql`
2. Copie o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute (Run)

Isso vai:
- ✅ Adicionar campo `supplier_id` na tabela `financial_transactions`
- ✅ Criar índice para melhor performance
- ✅ Vincular à tabela `suppliers` com referência

## ✅ Funcionalidades Implementadas

### 1. **Seleção de Fornecedor ao Concluir Compra**
- ✅ Ao concluir uma lista de compras, aparece um diálogo para selecionar o fornecedor
- ✅ Você pode escolher entre os fornecedores cadastrados
- ✅ Opção de deixar em branco se não houver fornecedor específico
- ✅ O fornecedor é vinculado automaticamente à transação financeira

### 2. **Histórico Financeiro Atualizado**
- ✅ Transações de compra mostram o nome do fornecedor quando vinculado
- ✅ Badge "Fornecedor" aparece nas transações que têm fornecedor
- ✅ Informação do fornecedor aparece na descrição da transação

### 3. **Comportamento Inteligente**
- ✅ Se a lista não tiver itens com preço, conclui diretamente sem pedir fornecedor
- ✅ Se houver itens com preço, sempre pede para selecionar o fornecedor
- ✅ Mensagem de sucesso mostra o nome do fornecedor quando selecionado

## 🎯 Como Usar

### Concluir uma Lista de Compras com Fornecedor:

1. Vá na página "Listas de Compras"
2. Selecione uma lista
3. Adicione preços aos itens (opcional, mas recomendado)
4. Clique em "Concluir Lista"
5. Se houver itens com preço, aparecerá um diálogo
6. Selecione o fornecedor da lista (ou deixe em branco)
7. Clique em "Concluir Compra"
8. A compra será registrada com o fornecedor vinculado

### Ver Compras por Fornecedor:

1. Vá na página "Histórico Financeiro" (ícone $ no header)
2. Filtre por "Gastos" para ver apenas compras
3. As transações com fornecedor mostrarão:
   - Badge "Fornecedor"
   - Nome do fornecedor na descrição
   - Detalhes dos itens comprados

## 📝 Notas

- O fornecedor é opcional - você pode concluir compras sem selecionar um
- Apenas compras (expenses) podem ter fornecedor vinculado
- Vendas (revenues) não têm fornecedor
- O fornecedor precisa estar cadastrado antes de ser selecionado
