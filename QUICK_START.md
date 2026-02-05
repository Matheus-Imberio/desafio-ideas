# 🚀 Guia Rápido - Como Executar o Projeto

## ✅ Pré-requisitos

1. ✅ Schema SQL executado no Supabase (você já fez isso!)
2. ✅ Node.js instalado
3. ✅ npm ou pnpm instalado

## 📝 Passo a Passo

### 1. Instalar Dependências

```bash
npm install
```

ou se estiver usando pnpm:

```bash
pnpm install
```

### 2. Verificar Variáveis de Ambiente

O arquivo `.env.local` já está configurado com:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Se precisar verificar, o arquivo está na raiz do projeto.

### 3. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

ou:

```bash
pnpm dev
```

### 4. Acessar o App

O Vite vai iniciar e mostrar uma URL, geralmente:
```
http://localhost:5173
```

Abra essa URL no navegador.

### 5. Primeiro Uso

1. **Cadastre-se** ou faça **login**
2. Um restaurante será criado automaticamente
3. Clique em **"Novo Ingrediente"** para começar
4. Adicione ingredientes ao estoque!

## 🎯 Funcionalidades Disponíveis

### ✅ Autenticação
- Login / Cadastro
- Recuperação de senha
- Logout

### ✅ Gestão de Ingredientes
- Criar ingrediente (nome, quantidade, unidade, estoque mínimo, validade, categoria)
- Editar ingrediente
- Excluir ingrediente
- Buscar por nome
- Filtrar por categoria e status
- Ver alertas visuais (estoque baixo, vencendo, vencido)

### ✅ Gestão de Estoque
- Ajustar estoque manualmente
- Tipos de movimentação: Compra, Venda, Ajuste, Desperdício, Vencido
- Histórico automático de movimentações

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
# Reinstale as dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env.local` existe na raiz
- Verifique se as variáveis começam com `VITE_` (não `NEXT_PUBLIC_`)

### Erro: "permission denied" no Supabase
- Verifique se executou o `supabase_schema.sql` completo
- Verifique se as políticas RLS foram criadas

### Porta 5173 já em uso
```bash
# Use outra porta
npm run dev -- --port 3000
```

## 📊 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Cria build de produção
npm run preview      # Preview do build de produção

# Lint
npm run lint         # Verifica erros de código
```

## ✨ Próximos Passos (Opcional)

O MVP está completo! Se quiser adicionar mais funcionalidades:

- [ ] Página de histórico detalhado de movimentações
- [ ] Relatórios e gráficos
- [ ] Exportação de dados (CSV/PDF)
- [ ] Notificações por e-mail
- [ ] Dashboard com estatísticas

---

**Status:** ✅ Pronto para usar!
**Próximo passo:** `npm run dev` e começar a usar! 🎉
