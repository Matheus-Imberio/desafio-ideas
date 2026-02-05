# 📧 Como Configurar Email no Supabase

## Opção 1: Usar SMTP do Supabase (Gratuito, Limitado)

O Supabase oferece um serviço de email básico gratuito, mas com limitações.

### Configuração:

1. Vá em: **Authentication → Email → Email Templates**
2. O Supabase já tem templates configurados
3. Para desenvolvimento/teste, pode usar o email do Supabase mesmo

**Limitação:** Emails podem ir para spam ou ter limite de envio.

## Opção 2: Configurar SMTP Personalizado (Recomendado)

### Usando Gmail (Gratuito):

1. Vá em: **Settings → Auth → SMTP Settings**
2. Configure:
   - **Host:** `smtp.gmail.com`
   - **Port:** `587`
   - **Username:** seu email Gmail
   - **Password:** Use uma "App Password" do Gmail (não sua senha normal)
   - **Sender email:** seu email Gmail
   - **Sender name:** Nome que aparece nos emails

### Como criar App Password no Gmail:

1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione "Mail" e "Other (Custom name)"
3. Digite "Supabase"
4. Copie a senha gerada (16 caracteres)
5. Use essa senha no Supabase (não sua senha normal do Gmail)

### Usando outros provedores:

**SendGrid, Mailgun, AWS SES** também funcionam. Configure as credenciais SMTP deles.

## Opção 3: Usar Resend (Recomendado para Produção)

Resend é um serviço moderno de email, fácil de configurar:

1. Crie conta em: https://resend.com
2. Obtenha sua API key
3. No Supabase, configure SMTP com:
   - **Host:** `smtp.resend.com`
   - **Port:** `587`
   - **Username:** `resend`
   - **Password:** sua API key do Resend
   - **Sender email:** um email verificado no Resend

## ⚡ Configuração Rápida (Gmail)

1. **Authentication → Email → SMTP Settings**
2. Preencha:
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: seuemail@gmail.com
   Password: [App Password do Gmail - 16 caracteres]
   Sender email: seuemail@gmail.com
   Sender name: Sistema de Estoque
   ```
3. Salve
4. Teste criando uma conta

## 🔍 Verificar se está funcionando:

1. Tente criar uma conta
2. Verifique a caixa de entrada (e spam)
3. Se não chegar, verifique os logs: **Logs → Edge Logs**

## ⚠️ Importante:

- Gmail tem limite de ~500 emails/dia
- Para produção, use Resend, SendGrid ou AWS SES
- App Password do Gmail é obrigatória (senha normal não funciona)
