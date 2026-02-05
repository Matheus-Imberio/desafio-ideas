# Guia: O que fornecer ao Dyad para gerar o app

## ✅ O que o Dyad DEVE ver (arquivos no repositório)

### Arquivos de Configuração (OK para commit)
- ✅ `package.json` - Dependências do projeto
- ✅ `AI_RULES.md` - Regras de arquitetura e tech stack
- ✅ `src/lib/supabase.ts` - Cliente Supabase (sem credenciais hardcoded)
- ✅ `.gitignore` - Arquivos ignorados
- ✅ Estrutura de pastas (`src/`, `src/pages/`, `src/components/`)

### Arquivos que o Dyad usa para entender o projeto
- ✅ `README.md` - Descrição do projeto
- ✅ `AI_RULES.md` - Regras técnicas e arquitetura
- ✅ Código fonte em `src/`
- ✅ Configurações de build (Vite, TypeScript, etc.)

## ❌ O que o Dyad NÃO deve ver (arquivos ignorados)

### Credenciais e Segredos (NUNCA commitar)
- ❌ `.env.local` - Credenciais do Supabase (já está no `.gitignore`)
- ❌ `.env` - Variáveis de ambiente sensíveis
- ❌ Chaves de API, tokens, senhas

**Por quê?** O `.env.local` contém suas credenciais reais. O Dyad não precisa delas - ele só precisa saber que o Supabase está configurado.

## 📝 O que fornecer ao Dyad no Chat

> **📋 IMPORTANTE:** Veja o arquivo `PROJECT_REQUIREMENTS.md` para as histórias do usuário completas e checklist de boas práticas adaptado para este projeto.

### 1. Histórias do Usuário (User Stories) - RECOMENDADO ✅

**Formato ideal:**

```
Como [tipo de usuário],
Eu quero [ação/objetivo],
Para que [benefício/valor].

Exemplos:
- Como usuário, eu quero criar uma ideia, para que eu possa compartilhar minhas sugestões.
- Como usuário, eu quero ver todas as ideias, para que eu possa descobrir novas propostas.
- Como usuário, eu quero votar em ideias, para que eu possa apoiar as que mais gosto.
```

**Por que histórias do usuário?**
- ✅ Focadas no usuário e valor
- ✅ Fáceis de entender
- ✅ Permitem que o Dyad crie a melhor solução
- ✅ Mais flexíveis que especificações técnicas rígidas

### 2. PRD (Product Requirements Document) - Alternativa

Se você tem um PRD formal, pode usar, mas:
- ✅ Funciona bem se bem estruturado
- ⚠️ Pode ser muito detalhado e limitar a criatividade do Dyad
- ⚠️ Pode conter especificações técnicas desnecessárias

**Quando usar PRD:**
- Projeto complexo com muitos requisitos
- Você já tem um PRD bem definido
- Precisa de especificações muito detalhadas

### 3. Descrição Simples do Projeto

**Exemplo:**

```
App de gerenciamento de ideias onde usuários podem:
- Criar ideias com título e descrição
- Ver lista de todas as ideias
- Votar em ideias que gostam
- Filtrar ideias por categoria
- Ver ideias mais votadas

Tecnologias: React + TypeScript + Supabase
```

## 🎯 Estrutura Recomendada para o Chat do Dyad

### Opção 1: Histórias do Usuário (Melhor para começar)

```
Quero criar um app de gerenciamento de ideias com as seguintes funcionalidades:

1. Como usuário, eu quero criar uma ideia com título e descrição
2. Como usuário, eu quero ver uma lista de todas as ideias
3. Como usuário, eu quero votar em ideias que gostar
4. Como usuário, eu quero filtrar ideias por categoria
5. Como usuário, eu quero ver as ideias mais votadas primeiro

O app deve usar Supabase para armazenar os dados.
```

### Opção 2: Descrição + Funcionalidades

```
Crie um app de gerenciamento de ideias com:

Funcionalidades principais:
- Criar ideias (título, descrição, categoria)
- Listar ideias com paginação
- Sistema de votos
- Filtros por categoria
- Ordenação por mais votadas

Backend: Supabase já configurado
UI: Usar shadcn/ui components
```

## 📋 Checklist: Antes de pedir ao Dyad

- [ ] `AI_RULES.md` está atualizado com tech stack
- [ ] `package.json` tem as dependências necessárias
- [ ] `src/lib/supabase.ts` está configurado (sem credenciais)
- [ ] `.env.local` está no `.gitignore` (não será commitado)
- [ ] Histórias do usuário ou descrição do projeto prontas
- [ ] README.md com descrição básica (opcional mas útil)

## 🔐 Segurança: Credenciais

### ✅ Correto (o que está configurado)
```typescript
// src/lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

### ❌ ERRADO (nunca fazer)
```typescript
// NUNCA faça isso!
const supabaseUrl = 'https://fefjgvjxmmwspuceanhy.supabase.co'
const supabaseAnonKey = 'sb_publishable_tgaVoeNO6P6ar8aS2ee57w_GtDeUElw'
```

## 💡 Dica Final

**Para o Dyad gerar o melhor app:**

1. **⚠️ SEMPRE peça para verificar configurações existentes** - "Antes de começar, verifique os arquivos de configuração no projeto"
2. **Seja claro sobre o objetivo** - O que o app deve fazer?
3. **Forneça contexto** - Quem vai usar? Qual o problema que resolve?
4. **Seja específico sobre funcionalidades** - Mas deixe o Dyad decidir a melhor implementação
5. **Mencione integrações** - "Use Supabase para armazenar dados (já configurado)"
6. **Referencie arquivos existentes** - "Siga as regras em AI_RULES.md", "Veja PROJECT_REQUIREMENTS.md"
7. **Use configurações existentes** - Não recrie do zero, aproveite o que já está configurado

**Exemplo de prompt ideal para este projeto:**

```
IMPORTANTE: Antes de começar, verifique todas as configurações existentes no projeto:
- Leia o arquivo AI_RULES.md para entender a arquitetura e tech stack
- Verifique src/lib/supabase.ts - Supabase já está configurado
- Veja package.json para as dependências disponíveis
- Consulte PROJECT_REQUIREMENTS.md para todas as histórias do usuário e checklist de boas práticas
- Verifique .gitignore para entender o que não deve ser commitado

Crie um sistema de controle de estoque para restaurantes seguindo as especificações em PROJECT_REQUIREMENTS.md.

Principais funcionalidades:
- CRUD de ingredientes com quantidade, validade e estoque mínimo
- Visualização de estoque em tempo real
- Alertas automáticos de estoque baixo e vencimento próximo
- Bloqueio de uso de ingredientes vencidos
- Histórico de movimentações
- Relatórios de perdas e desperdícios

Backend: Use Supabase (já configurado em src/lib/supabase.ts - use as variáveis de ambiente)
UI: Siga as regras em AI_RULES.md, use shadcn/ui components
Checklist: Implemente as boas práticas listadas em PROJECT_REQUIREMENTS.md

Use as configurações existentes - não recrie do zero!
```

## 🚀 Próximos Passos

1. ✅ Configurações já estão prontas
2. ✅ Supabase configurado (credenciais no .env.local, não commitado)
3. ⏳ Agora é só abrir o chat do Dyad e fornecer as histórias do usuário!
