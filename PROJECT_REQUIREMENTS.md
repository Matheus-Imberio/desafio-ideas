# 📋 Requisitos do Projeto - Sistema de Controle de Estoque para Restaurantes

## 🧑‍🍳 Histórias do Usuário

### 1️⃣ Controle de estoque em tempo real
**Como** gerente do restaurante  
**Quero** visualizar o estoque atual de cada ingrediente em tempo real  
**Para** saber exatamente o que está disponível antes e durante o serviço.

### 2️⃣ Alerta de ingredientes próximos do vencimento
**Como** gerente de estoque  
**Quero** receber alertas automáticos quando um ingrediente estiver próximo da data de vencimento  
**Para** evitar desperdício e perdas financeiras.

### 3️⃣ Bloqueio de uso de ingredientes vencidos
**Como** cozinheiro  
**Quero** que o sistema sinalize ingredientes vencidos  
**Para** não utilizá-los por engano no preparo dos pratos.

### 4️⃣ Alerta de estoque mínimo
**Como** gestor operacional  
**Quero** definir um estoque mínimo para cada item  
**Para** ser avisado antes que o ingrediente acabe durante o serviço.

### 5️⃣ Previsão de ruptura durante o serviço
**Como** gerente  
**Quero** saber se o estoque atual suporta o volume de vendas previsto  
**Para** evitar falta de itens no meio do atendimento.

### 6️⃣ Baixa automática de estoque por venda
**Como** gerente  
**Quero** que o estoque seja atualizado automaticamente a cada pedido vendido  
**Para** manter os dados sempre corretos sem controles manuais.

### 7️⃣ Sugestão automática de compras
**Como** responsável por compras  
**Quero** receber sugestões automáticas de reposição  
**Para** comprar na hora certa e evitar compras feitas tarde demais.

### 8️⃣ Lista de compras inteligente
**Como** comprador  
**Quero** gerar uma lista de compras baseada no consumo histórico e estoque atual  
**Para** agilizar o processo de compra e evitar esquecimentos.

### 9️⃣ Relatório de perdas e desperdícios
**Como** gestor financeiro  
**Quero** visualizar relatórios de ingredientes vencidos ou descartados  
**Para** entender onde estão ocorrendo perdas e reduzir custos.

### 🔟 Histórico de consumo por ingrediente
**Como** gerente  
**Quero** acompanhar o consumo histórico de cada ingrediente  
**Para** planejar melhor compras futuras e ajustar quantidades.

---

## ✅ Checklist de Boas Práticas - Adaptado para App de Estoque

### 1. Fundamentos de Produto
- [ ] **Proposta de valor clara:** "Controle de estoque em tempo real para restaurantes, evitando desperdícios e faltas durante o serviço"
- [ ] **Público-alvo:** Restaurantes, bares, lanchonetes (B2B - pequenos e médios estabelecimentos)
- [ ] **Problema recorrente:** Gestão manual de estoque causa desperdícios, faltas e perdas financeiras diárias
- [ ] **Valor em 5 minutos:** Usuário consegue cadastrar primeiro ingrediente e ver alertas funcionando
- [ ] **MVP resolve dor principal:** Controle de estoque em tempo real + alertas de vencimento + estoque mínimo
- [ ] **Roadmap:**
  - **Agora:** Controle básico de estoque, alertas, cadastro de ingredientes
  - **Próximo:** Integração com sistema de vendas, relatórios, lista de compras
  - **Depois:** Previsão de demanda, integração com fornecedores, app mobile

### 2. Autenticação & Conta

#### Login e Cadastro
- [ ] Cadastro com e-mail e senha
- [ ] Login social (Google no mínimo) - importante para restaurantes
- [ ] Validação de e-mail
- [ ] Mensagens de erro claras: "E-mail ou senha incorretos"
- [ ] Limite de tentativas de login (5 tentativas)
- [ ] **Contexto restaurante:** Cadastro permite múltiplos usuários por estabelecimento (gerente, cozinheiro, comprador)

#### Senhas
- [ ] Tela "Esqueci minha senha"
- [ ] Redefinição de senha por e-mail
- [ ] Campo de senha com opção de mostrar/ocultar
- [ ] Indicador de força da senha
- [ ] Requisitos visíveis antes do erro
- [ ] Confirmação de senha no cadastro

#### Sessão
- [ ] Manter usuário logado (importante para uso contínuo durante serviço)
- [ ] Logout manual
- [ ] Logout automático por inatividade (30 minutos - segurança em ambiente compartilhado)
- [ ] Invalidar sessões após troca de senha

### 3. UX Essencial

#### Estados da Interface
- [ ] **Estado de carregamento:** Skeleton para lista de ingredientes
- [ ] **Estado vazio:** "Nenhum ingrediente cadastrado. Clique em 'Adicionar Ingrediente' para começar"
- [ ] **Estado de erro:** "Não foi possível carregar o estoque. Tente novamente."
- [ ] **Feedback visual de sucesso:** Toast/notificação ao salvar ingrediente
- [ ] **Confirmação para ações destrutivas:** "Tem certeza que deseja excluir este ingrediente? Esta ação não pode ser desfeita."

#### Usabilidade
- [ ] **Um CTA principal por tela:** Botão "Adicionar Ingrediente" destacado
- [ ] **Ações destrutivas destacadas:** Botão excluir em vermelho/destacado
- [ ] **Labels claros:** "Quantidade em estoque", "Data de validade", "Estoque mínimo"
- [ ] **Teclado correto no mobile:** Números para campos de quantidade, data para validade
- [ ] **Botões desabilitados:** Botão "Salvar" desabilitado se campos obrigatórios vazios

#### Acessibilidade Básica
- [ ] Contraste adequado (especialmente para alertas vermelhos de vencimento)
- [ ] Fonte com tamanho mínimo legível (14px mínimo)
- [ ] Navegação por teclado (web)
- [ ] **Informação não depende apenas de cor:** Usar ícones + cores para alertas (⚠️ + vermelho)

### 4. Onboarding & Ativação

#### Onboarding no primeiro login
- [ ] **Tour guiado:** Mostrar onde cadastrar primeiro ingrediente
- [ ] **Checklist de primeiros passos:**
  1. Cadastrar primeiro ingrediente
  2. Definir estoque mínimo
  3. Configurar alertas de vencimento
- [ ] **Dados de exemplo:** Opção de importar ingredientes comuns (opcional)
- [ ] **Tour com opção de pular**
- [ ] **Indicação clara do próximo passo:** "Comece cadastrando seu primeiro ingrediente"
- [ ] **Onboarding não bloqueia:** Usuário pode pular e voltar depois

### 5. Funcionalidades Essenciais do Produto

#### CRUD de Ingredientes
- [ ] **Criar ingrediente:** Nome, quantidade, unidade (kg, litros, unidades), data de validade, estoque mínimo, categoria
- [ ] **Editar ingrediente:** Todos os campos editáveis
- [ ] **Duplicar ingrediente:** Útil para ingredientes similares
- [ ] **Excluir com confirmação:** "Tem certeza? O histórico será mantido."
- [ ] **Busca:** Buscar por nome de ingrediente
- [ ] **Filtros:** 
  - Por categoria (carnes, vegetais, laticínios, etc.)
  - Por status (em estoque, estoque baixo, vencido, próximo do vencimento)
- [ ] **Ordenação:** 
  - Por nome (A-Z)
  - Por quantidade (maior/menor)
  - Por validade (mais próximo do vencimento primeiro)
  - Por estoque mínimo (mais críticos primeiro)
- [ ] **Paginação ou carregamento progressivo:** Para restaurantes com muitos ingredientes
- [ ] **Feedback visual após salvar:** Toast "Ingrediente salvo com sucesso"

#### Funcionalidades Específicas do Estoque
- [ ] **Baixa manual de estoque:** Permitir ajuste manual quando necessário
- [ ] **Histórico de movimentações:** Ver quando e por que o estoque mudou
- [ ] **Alertas visuais:** Badge/indicador para ingredientes críticos
- [ ] **Notificações:** Badge no menu quando há alertas pendentes

### 6. Segurança (Mínimo Aceitável)

- [ ] **HTTPS obrigatório:** Todas as requisições via HTTPS
- [ ] **Senhas armazenadas com hash seguro:** bcrypt ou similar
- [ ] **Tokens com expiração:** JWT com refresh token
- [ ] **Proteção contra injeções:** Validação e sanitização de inputs
- [ ] **Proteção contra XSS:** Sanitização de dados de saída
- [ ] **Validação de dados no backend:** Supabase RLS (Row Level Security)
- [ ] **Logs sem dados sensíveis:** Não logar senhas ou tokens
- [ ] **Contexto restaurante:** Controle de acesso por função (gerente pode tudo, cozinheiro só visualiza)

### 7. Observabilidade & Qualidade

- [ ] **Logs centralizados:** Logs de ações importantes (cadastro, exclusão, alertas)
- [ ] **Monitoramento de disponibilidade:** Health check do Supabase
- [ ] **Alertas de falha:** Notificar se Supabase estiver offline
- [ ] **Versionamento de API:** Preparar para futuras mudanças
- [ ] **Feature flags:** Para testar novas funcionalidades gradualmente
- [ ] **Ambiente de staging:** Testar antes de produção

### 8. Billing & Monetização

- [ ] **Trial com duração definida:** 14 dias grátis
- [ ] **Tela de upgrade simples:** "Upgrade para continuar usando após o trial"
- [ ] **Cancelamento fácil:** Botão de cancelar assinatura acessível
- [ ] **Confirmação de cancelamento:** "Tem certeza? Você perderá acesso aos dados."
- [ ] **Histórico de cobranças:** Ver faturas anteriores
- [ ] **Aviso antes do fim do trial:** E-mail 3 dias antes
- [ ] **Recuperação de pagamento falhado:** Tentar novamente automaticamente

### 9. Growth & Retenção

- [ ] **E-mail de boas-vindas:** "Bem-vindo ao Sistema de Estoque! Comece cadastrando seus ingredientes."
- [ ] **E-mails transacionais:** Confirmação de cadastro, reset de senha
- [ ] **E-mails de ativação:** 
  - "Seu ingrediente X está próximo do vencimento"
  - "Estoque baixo: Y está abaixo do mínimo"
  - Resumo semanal de estoque
- [ ] **Coleta de feedback in-app:** "Como está sendo sua experiência?" após 7 dias
- [ ] **Changelog visível:** "Novidades: Agora você pode gerar lista de compras!"
- [ ] **Canal de contato acessível:** Suporte via chat ou e-mail
- [ ] **Contexto restaurante:** 
  - Dicas semanais sobre gestão de estoque
  - Casos de sucesso de outros restaurantes

---

## 🎯 Priorização MVP (Minimum Viable Product)

### Fase 1 - Essencial (MVP)
1. ✅ Autenticação (login/cadastro)
2. ✅ CRUD de ingredientes
3. ✅ Visualização de estoque em tempo real
4. ✅ Alertas de estoque mínimo
5. ✅ Alertas de vencimento próximo
6. ✅ Estados vazios e de erro
7. ✅ Busca e filtros básicos

### Fase 2 - Importante
1. ⏳ Baixa automática por venda (requer integração)
2. ⏳ Histórico de consumo
3. ⏳ Relatórios básicos
4. ⏳ Lista de compras inteligente
5. ⏳ Onboarding completo

### Fase 3 - Nice to Have
1. 🔮 Previsão de ruptura
2. 🔮 Sugestões automáticas avançadas
3. 🔮 App mobile
4. 🔮 Integração com fornecedores
5. 🔮 Dashboard analítico avançado

---

## 📝 Notas Técnicas para Desenvolvimento

### Estrutura de Dados (Supabase)

**Tabela: `ingredients`**
- id (uuid)
- name (text)
- quantity (numeric)
- unit (text) - 'kg', 'liters', 'units', etc.
- min_stock (numeric) - estoque mínimo
- expiry_date (date)
- category (text)
- restaurant_id (uuid) - FK para restaurante
- created_at (timestamp)
- updated_at (timestamp)

**Tabela: `stock_movements`**
- id (uuid)
- ingredient_id (uuid) - FK
- type (text) - 'purchase', 'sale', 'adjustment', 'waste'
- quantity (numeric)
- previous_quantity (numeric)
- new_quantity (numeric)
- notes (text)
- created_at (timestamp)
- user_id (uuid) - quem fez a movimentação

**Tabela: `alerts`**
- id (uuid)
- ingredient_id (uuid) - FK
- type (text) - 'low_stock', 'expiring_soon', 'expired'
- is_read (boolean)
- created_at (timestamp)

### Regras de Negócio

1. **Alerta de estoque mínimo:** Quando `quantity <= min_stock`
2. **Alerta de vencimento próximo:** Quando `expiry_date <= hoje + 3 dias`
3. **Bloqueio de vencidos:** Quando `expiry_date < hoje`, não permitir uso
4. **Baixa automática:** Calcular quantidade usada por receita e subtrair do estoque

---

## 🚀 Próximos Passos

1. ✅ Histórias do usuário definidas
2. ✅ Checklist de boas práticas adaptado
3. ✅ Configurações do projeto prontas (Supabase, package.json, AI_RULES.md)
4. ⏳ **No chat do Dyad, comece pedindo para verificar todas as configurações existentes:**
   - "Antes de começar, verifique todos os arquivos de configuração no projeto"
   - "Leia AI_RULES.md, PROJECT_REQUIREMENTS.md, package.json e src/lib/supabase.ts"
   - "Use as configurações existentes - Supabase já está configurado"
5. ⏳ Implementar autenticação
6. ⏳ Implementar CRUD de ingredientes
7. ⏳ Implementar sistema de alertas

## 📋 Instrução para o Dyad

**SEMPRE inclua esta instrução no início do prompt:**

```
IMPORTANTE: Antes de começar qualquer implementação, verifique e leia TODOS os arquivos de configuração e documentação existentes no projeto:

1. AI_RULES.md - Regras de arquitetura, tech stack e convenções
2. PROJECT_REQUIREMENTS.md - Histórias do usuário completas e checklist de boas práticas
3. package.json - Dependências já instaladas
4. src/lib/supabase.ts - Cliente Supabase já configurado (use variáveis de ambiente)
5. .gitignore - Arquivos que não devem ser commitados
6. Qualquer outro arquivo de configuração na raiz do projeto

Use essas configurações existentes - não recrie do zero. O Supabase já está configurado e pronto para uso.
```
