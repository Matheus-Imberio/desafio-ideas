# 🚀 COMECE AQUI - Prompt Principal para o Dyad

**Copie TODO o texto abaixo e cole no chat do Dyad:**

---

IMPORTANTE: Antes de começar qualquer implementação, verifique e leia TODOS os arquivos de configuração e documentação existentes no projeto:

1. AI_RULES.md - Regras de arquitetura, tech stack e convenções de código
2. PROJECT_REQUIREMENTS.md - Histórias do usuário completas e checklist de boas práticas
3. package.json - Dependências já instaladas e disponíveis
4. src/lib/supabase.ts - Cliente Supabase já configurado (use variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)
5. .gitignore - Arquivos que não devem ser commitados
6. Qualquer outro arquivo de configuração na raiz do projeto

Use essas configurações existentes - não recrie do zero. O Supabase já está configurado e pronto para uso.

---

Crie um sistema de controle de estoque para restaurantes seguindo TODAS as especificações em PROJECT_REQUIREMENTS.md.

Principais funcionalidades a implementar (MVP - Fase 1):
- Autenticação completa (login, cadastro, recuperação de senha)
- CRUD completo de ingredientes com campos: nome, quantidade, unidade (kg/litros/unidades), data de validade, estoque mínimo, categoria
- Visualização de estoque em tempo real com lista paginada
- Alertas automáticos visuais para:
  * Estoque abaixo do mínimo
  * Ingredientes próximos do vencimento (3 dias)
  * Ingredientes vencidos (bloqueio de uso)
- Busca e filtros por categoria e status
- Estados vazios, de erro e de carregamento bem implementados
- Histórico de movimentações de estoque

Backend:
- Use Supabase (já configurado em src/lib/supabase.ts)
- Crie as tabelas necessárias conforme especificado em PROJECT_REQUIREMENTS.md
- Implemente Row Level Security (RLS) para segurança
- Use as variáveis de ambiente para conexão (não hardcode credenciais)

UI/UX:
- Siga TODAS as regras em AI_RULES.md
- Use componentes shadcn/ui para toda a interface
- Implemente TODAS as boas práticas listadas em PROJECT_REQUIREMENTS.md (seção "Checklist de Boas Práticas")
- Design responsivo e acessível
- Feedback visual para todas as ações

Estrutura de dados:
- Veja a seção "Notas Técnicas para Desenvolvimento" em PROJECT_REQUIREMENTS.md para o schema completo

Comece pela autenticação e depois implemente o CRUD de ingredientes. Use as configurações existentes e siga todas as convenções definidas nos arquivos de documentação.

---

## 📋 Resumo Rápido

**Arquivo para copiar:** `START_HERE.md` (este arquivo)

**O que fazer:**
1. Abra o chat do Dyad
2. Copie TODO o texto acima (da linha "IMPORTANTE" até o final)
3. Cole no chat
4. Pronto! O Dyad vai começar a desenvolver

**Arquivos de referência que o Dyad vai ler automaticamente:**
- `PROJECT_REQUIREMENTS.md` - Todas as histórias do usuário
- `AI_RULES.md` - Regras técnicas
- `src/lib/supabase.ts` - Configuração do Supabase
- `package.json` - Dependências
