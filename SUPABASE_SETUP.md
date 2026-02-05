# Guia de Configuração do Supabase via Terminal

## Instalação da CLI do Supabase

### Opção 1: Via npm (Recomendado)

```bash
npm install -g supabase
```

### Opção 2: Via Homebrew (se tiver instalado)

```bash
brew install supabase/tap/supabase
```

### Opção 3: Via Script de Instalação

```bash
# Baixar e instalar
curl -fsSL https://supabase.com/install.sh | sh
```

### Opção 4: Via AUR (Arch/Manjaro) - RECOMENDADO

```bash
# Instalar (vai pedir sua senha sudo)
yay -S supabase-bin
# ou
paru -S supabase-bin

# Versão mais atual disponível: 2.75.0
```

## Verificar Instalação

```bash
supabase --version
```

## Login no Supabase

```bash
# Fazer login (abre o navegador para autenticação)
supabase login

# Ou usar token diretamente
supabase login --token YOUR_ACCESS_TOKEN
```

## Inicializar Projeto Supabase

```bash
cd /home/appmoove/dyad-apps/desafio-ideas

# Inicializar projeto Supabase
supabase init

# Isso cria:
# - supabase/config.toml (configuração)
# - supabase/migrations/ (migrations do banco)
# - supabase/seed.sql (dados iniciais, opcional)
```

## Conectar ao Projeto Existente

Se você já tem um projeto no Supabase:

```bash
# 1. Fazer login
supabase login

# 2. Linkar ao projeto existente
supabase link --project-ref YOUR_PROJECT_REF

# O project-ref pode ser encontrado na URL do seu projeto:
# https://app.supabase.com/project/YOUR_PROJECT_REF
```

## Comandos Úteis

### Iniciar Supabase Local (Docker necessário)

```bash
# Iniciar todos os serviços localmente
supabase start

# Isso inicia:
# - PostgreSQL na porta 54322
# - API na porta 54321
# - Studio na porta 54323
```

### Criar Migration

```bash
# Criar nova migration
supabase migration new nome_da_migration

# Aplicar migrations
supabase db push
```

### Gerar Tipos TypeScript

```bash
# Gerar tipos TypeScript do banco
supabase gen types typescript --local > src/types/supabase.ts
# ou para projeto remoto
supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/supabase.ts
```

### Ver Status

```bash
# Ver status do projeto
supabase status

# Ver informações do projeto linkado
supabase projects list
```

## Configuração de Variáveis de Ambiente

Após conectar, você precisará das credenciais. Crie um arquivo `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

Para obter essas credenciais:

```bash
# Via terminal (se linkado)
supabase status

# Ou acesse: https://app.supabase.com/project/YOUR_PROJECT_REF/settings/api
```

## Troubleshooting

### Erro: "Docker not running"
- Instale o Docker: `sudo pacman -S docker` (Manjaro)
- Inicie o serviço: `sudo systemctl start docker`
- Adicione seu usuário ao grupo docker: `sudo usermod -aG docker $USER`
- Faça logout/login ou reinicie

### Erro: "Permission denied"
- Verifique se você tem permissões no projeto Supabase
- Tente fazer login novamente: `supabase login`

### Verificar se está conectado
```bash
supabase projects list
```

## Próximos Passos

1. Instalar a CLI: `npm install -g supabase`
2. Fazer login: `supabase login`
3. Inicializar ou linkar projeto: `supabase init` ou `supabase link`
4. Configurar variáveis de ambiente no projeto
5. Começar a usar o Supabase no código!

## Recursos

- [Documentação Supabase CLI](https://supabase.com/docs/reference/cli/introduction)
- [Guia de Início Rápido](https://supabase.com/docs/guides/cli)
