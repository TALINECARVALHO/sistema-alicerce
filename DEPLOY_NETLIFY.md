# 🚀 Guia de Deploy no Netlify - Sistema Alicerce

Este guia contém todas as etapas necessárias para fazer o deploy do Sistema Alicerce no Netlify.

## 📋 Pré-requisitos

- [ ] Conta no [Netlify](https://www.netlify.com/)
- [ ] Conta no GitHub (se for usar deploy via Git)
- [ ] Node.js instalado localmente
- [ ] Projeto funcionando localmente

## 🎯 Método 1: Deploy via GitHub (Recomendado)

### Passo 1: Preparar o Repositório Git

```bash
# Se ainda não inicializou o Git
git init

# Adicionar todos os arquivos
git add .

# Fazer o commit
git commit -m "Preparar para deploy no Netlify"
```

### Passo 2: Criar Repositório no GitHub

1. Acesse [GitHub](https://github.com/) e faça login
2. Clique em **"New repository"**
3. Nome do repositório: `sistema-alicerce`
4. Deixe como **Private** (recomendado)
5. **NÃO** inicialize com README, .gitignore ou license
6. Clique em **"Create repository"**

### Passo 3: Conectar Repositório Local ao GitHub

```bash
# Adicionar o remote (substitua SEU_USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU_USUARIO/sistema-alicerce.git

# Fazer push do código
git branch -M main
git push -u origin main
```

### Passo 4: Conectar ao Netlify

1. Acesse [Netlify](https://app.netlify.com/)
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Escolha **"Deploy with GitHub"**
4. Autorize o Netlify a acessar sua conta do GitHub
5. Selecione o repositório `sistema-alicerce`

### Passo 5: Configurar Build Settings

O Netlify deve detectar automaticamente as configurações do `netlify.toml`, mas verifique:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Branch to deploy**: `main`

### Passo 6: Configurar Variáveis de Ambiente

> [!IMPORTANT]
> As variáveis de ambiente são essenciais para o funcionamento do sistema!

1. No painel do Netlify, vá em **"Site configuration"** → **"Environment variables"**
2. Clique em **"Add a variable"** e adicione as seguintes variáveis:

#### Variáveis Necessárias:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_EMAILJS_SERVICE_ID=seu_service_id_do_emailjs
VITE_EMAILJS_TEMPLATE_ID=seu_template_id_do_emailjs
VITE_EMAILJS_PUBLIC_KEY=sua_public_key_do_emailjs
VITE_GEMINI_API_KEY=sua_api_key_do_gemini
```

> [!TIP]
> Copie os valores do seu arquivo `.env.local` local para garantir que sejam os mesmos.

### Passo 7: Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build completar (geralmente leva 2-5 minutos)
3. Quando concluído, você verá uma URL como: `https://random-name-123456.netlify.app`

### Passo 8: Configurar Domínio Personalizado (Opcional)

1. Vá em **"Domain management"**
2. Clique em **"Add custom domain"**
3. Siga as instruções para configurar seu domínio

---

## 🎯 Método 2: Deploy Manual (Drag & Drop)

### Passo 1: Build Local

```bash
# Instalar dependências (se ainda não fez)
npm install

# Criar build de produção
npm run build
```

Isso criará uma pasta `dist` com os arquivos otimizados.

### Passo 2: Deploy no Netlify

1. Acesse [Netlify](https://app.netlify.com/)
2. Na área **"Sites"**, arraste a pasta `dist` para a área de drop
3. Aguarde o upload completar

### Passo 3: Configurar Variáveis de Ambiente

1. Clique no site que acabou de criar
2. Vá em **"Site configuration"** → **"Environment variables"**
3. Adicione todas as variáveis listadas no Método 1, Passo 6

### Passo 4: Configurar Redirects

Como você fez deploy manual, precisa garantir que o arquivo `netlify.toml` está sendo respeitado:

1. Vá em **"Site configuration"** → **"Redirects and rewrites"**
2. Adicione a seguinte regra:
   - **From**: `/*`
   - **To**: `/index.html`
   - **Status**: `200`

### Passo 5: Rebuild

1. Vá em **"Deploys"**
2. Clique em **"Trigger deploy"** → **"Clear cache and deploy site"**

---

## ✅ Verificação Pós-Deploy

Após o deploy, verifique:

- [ ] Site está acessível na URL fornecida
- [ ] Login funciona corretamente
- [ ] Conexão com Supabase está funcionando
- [ ] Envio de emails está funcionando
- [ ] IA (Gemini) está respondendo
- [ ] Todas as páginas carregam corretamente
- [ ] Não há erros no console do navegador

## 🔧 Troubleshooting

### Erro: "Build failed"

**Solução**: Verifique os logs de build no Netlify. Geralmente é:
- Dependências faltando
- Erro de TypeScript
- Variáveis de ambiente não configuradas

### Erro: "Page not found" ao navegar

**Solução**: Verifique se o arquivo `netlify.toml` está configurado corretamente com os redirects.

### Erro: "Failed to fetch" ou problemas de API

**Solução**: Verifique se todas as variáveis de ambiente estão configuradas corretamente no Netlify.

### Erro: CORS ou problemas de autenticação

**Solução**: 
1. Vá no Supabase Dashboard
2. Em **"Authentication"** → **"URL Configuration"**
3. Adicione a URL do Netlify em **"Site URL"** e **"Redirect URLs"**

---

## 🔄 Atualizações Futuras

### Com GitHub (Método 1):
```bash
# Fazer alterações no código
git add .
git commit -m "Descrição das alterações"
git push
```

O Netlify detectará automaticamente e fará o redeploy!

### Com Deploy Manual (Método 2):
1. Fazer build local: `npm run build`
2. Arrastar a nova pasta `dist` para o Netlify

---

## 📊 Monitoramento

No painel do Netlify você pode:
- Ver estatísticas de acesso
- Monitorar builds
- Ver logs de erros
- Configurar notificações

---

## 🎉 Pronto!

Seu Sistema Alicerce está agora no ar! 🚀

**URL do site**: Será fornecida pelo Netlify após o deploy

> [!NOTE]
> Lembre-se de atualizar a URL do sistema em qualquer documentação ou comunicação com os usuários.
