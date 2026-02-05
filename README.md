# 🧑‍🍳 Sistema de Controle de Estoque para Restaurantes

Sistema completo de gestão de estoque em tempo real para restaurantes, com alertas automáticos de vencimento e estoque mínimo.

## 📋 Documentação do Projeto

- **`PROJECT_REQUIREMENTS.md`** - Histórias do usuário completas e checklist de boas práticas
- **`AI_RULES.md`** - Regras de arquitetura, tech stack e convenções de código
- **`DYAD_GUIDE.md`** - Guia de como trabalhar com o Dyad neste projeto
- **`PROMPT_TEMPLATE.md`** - Template pronto para usar no chat do Dyad
- **`SUPABASE_CONFIG.md`** - Configuração do Supabase
- **`SUPABASE_SETUP.md`** - Guia de setup do Supabase CLI

## 🚀 Início Rápido

### Para Desenvolver com Dyad

1. Abra o chat do Dyad
2. Use o prompt em `PROMPT_TEMPLATE.md`
3. O Dyad vai ler todas as configurações e começar a implementar

### Configuração Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env.local com:
# VITE_SUPABASE_URL=sua_url_aqui
# VITE_SUPABASE_ANON_KEY=sua_chave_aqui

# Iniciar desenvolvimento
npm run dev
```

## 🛠️ Tech Stack

- **React + TypeScript** - Framework e linguagem
- **Vite** - Build tool
- **React Router** - Roteamento
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Supabase** - Backend (banco de dados + autenticação)
- **lucide-react** - Ícones

## 📁 Estrutura do Projeto

```
src/
├── lib/
│   └── supabase.ts          # Cliente Supabase configurado
├── pages/                   # Páginas/rotas do app
└── components/              # Componentes reutilizáveis
    └── ui/                  # Componentes shadcn/ui (não editar)
```

## ⚠️ Importante

- **Nunca commite** arquivos `.env.local` (já está no `.gitignore`)
- **Sempre verifique** os arquivos de configuração antes de fazer mudanças
- **Siga** as regras em `AI_RULES.md` para manter consistência

## 📝 Histórias do Usuário

Veja todas as 10 histórias do usuário detalhadas em `PROJECT_REQUIREMENTS.md`

Principais funcionalidades:
- ✅ Controle de estoque em tempo real
- ✅ Alertas de vencimento e estoque mínimo
- ✅ Bloqueio de ingredientes vencidos
- ✅ Baixa automática por venda
- ✅ Relatórios e histórico de consumo

