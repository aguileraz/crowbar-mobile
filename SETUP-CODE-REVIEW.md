# 🤖 Setup Automático de Code Review com Claude

## Guia Rápido de Configuração (5 minutos)

**Status**: ✅ Workflow configurado e pronto para uso
**Necessário**: Adicionar API key da Anthropic ao GitHub

---

## 📋 Passo a Passo

### 1️⃣ Obter API Key da Anthropic (2 min)

1. Acesse: **https://console.anthropic.com/**
2. Faça login ou crie uma conta
3. Clique em **"API Keys"** no menu lateral
4. Clique em **"Create Key"**
5. Dê um nome: `crowbar-github-actions`
6. **Copie a chave** (começa com `sk-ant-...`)

⚠️ **Importante**: A chave só aparece uma vez! Copie agora.

---

### 2️⃣ Adicionar Secret no GitHub (2 min)

1. Acesse seu repositório: **https://github.com/aguileraz/crowbar-mobile**
2. Clique em **Settings** (aba no topo)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **"New repository secret"**
5. Preencha:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Secret**: Cole a chave que copiou (sk-ant-...)
6. Clique em **"Add secret"**

---

### 3️⃣ Habilitar Permissões do Workflow (1 min)

1. Ainda em **Settings**
2. No menu lateral, clique em **Actions** → **General**
3. Role até **"Workflow permissions"**
4. Selecione **"Read and write permissions"**
5. Marque **"Allow GitHub Actions to create and approve pull requests"**
6. Clique em **"Save"**

---

## ✅ Pronto! Como Usar

### Uso Automático

O workflow roda automaticamente quando você:

✅ **Criar um Pull Request** para `main` ou `develop`
```bash
git checkout -b feature/minha-feature
git add .
git commit -m "feat: nova feature"
git push origin feature/minha-feature
# Crie PR no GitHub → Review automático aparece!
```

✅ **Fazer Push** para `develop` ou branches `feature/*`
```bash
git checkout develop
git add .
git commit -m "fix: correção de bug"
git push origin develop
# Review é criado como Issue!
```

### Uso Local (Testar antes de push)

```bash
# Configure a API key localmente
export ANTHROPIC_API_KEY='sk-ant-sua-chave-aqui'

# Execute o script de teste
.github/workflows/test-review.sh

# Veja o review gerado em: code-review-YYYYMMDD-HHMMSS.md
```

---

## 📊 O Que o Review Analisa

O Claude revisa automaticamente:

🔴 **Crítico** (HIGH):
- Vulnerabilidades de segurança
- Bugs que podem quebrar produção
- Problemas de autenticação/autorização

🟡 **Importante** (MEDIUM):
- Issues de performance
- Violações de best practices
- Código difícil de manter

🟢 **Sugestões** (LOW):
- Melhorias de qualidade
- Refatorações recomendadas
- Otimizações menores

✅ **Positivo**:
- Código bem escrito
- Boas práticas aplicadas
- Testes adequados

---

## 📝 Exemplo de Review

```markdown
## 🤖 Claude Code Review

### Critical Issues (🔴 High Priority)
- **authService.ts:L145**: Potential security vulnerability
  Token stored without encryption. Consider using Keychain.

  ```typescript
  // ❌ Insecure
  AsyncStorage.setItem('token', token);

  // ✅ Secure
  await Keychain.setGenericPassword('token', token);
  ```

### Important Issues (🟡 Medium Priority)
- **HomeScreen.tsx:L89**: Performance issue
  Component re-renders unnecessarily. Use React.memo()

### Suggestions (🟢 Low Priority)
- **utils.ts:L23**: Consider extracting to helper function

### Positive Observations (✅)
- Excellent test coverage in authService.test.ts (48.1%)
- Good TypeScript typing throughout
- Well-documented code with Portuguese comments

---
*Automated review by Claude (Anthropic)*
```

---

## 💰 Custos

### Preços da Anthropic

- **Claude 3.5 Sonnet**: $3 / 1M tokens input, $15 / 1M tokens output
- **Custo estimado por review**: $0.01 - $0.10
- **Custo mensal estimado**: $5-50 (desenvolvimento ativo)

### Como Economizar

✅ Já configurado no workflow:
- Exclui arquivos de teste (*.test.ts)
- Exclui node_modules
- Só analisa arquivos TypeScript/JavaScript
- Só roda em branches importantes

---

## 🐛 Troubleshooting

### Workflow não executa

**Problema**: PR criado mas não vejo o review

**Soluções**:
1. Verifique se GitHub Actions está habilitado
2. Vá em **Actions** tab e veja se há erros
3. Confirme que a branch do PR é `main` ou `develop`

### Review não aparece nos comentários

**Problema**: Workflow rodou mas não postou comentário

**Soluções**:
1. Verifique se `ANTHROPIC_API_KEY` está configurado corretamente
2. Confira se a chave ainda é válida em https://console.anthropic.com/
3. Veja os logs do workflow em **Actions** tab
4. Confirme que permissões estão habilitadas (passo 3)

### Erro de permissão

**Problema**: "Resource not accessible by integration"

**Solução**:
Volte no passo 3 e habilite "Read and write permissions"

---

## 📚 Documentação Completa

Para mais detalhes, veja:

- **`.github/workflows/README.md`** - Documentação completa do workflow
- **`.github/workflows/claude-code-review.yml`** - Configuração do workflow
- **`.github/workflows/test-review.sh`** - Script de teste local

---

## 🎯 Próximos Passos

### Agora Mesmo (5 min)
1. [ ] Obter API key da Anthropic
2. [ ] Adicionar `ANTHROPIC_API_KEY` ao GitHub
3. [ ] Habilitar permissões do workflow
4. [ ] Testar com um PR de exemplo

### Teste Inicial (10 min)
```bash
# 1. Crie uma branch de teste
git checkout -b test/claude-review

# 2. Faça uma mudança simples
echo "// Test change" >> src/App.tsx

# 3. Commit e push
git add src/App.tsx
git commit -m "test: testing Claude review"
git push origin test/claude-review

# 4. Crie PR no GitHub
# 5. Aguarde ~1-2 minutos
# 6. Veja o review aparecer nos comentários!
```

### Validação
- [ ] Review apareceu como comentário no PR
- [ ] Review tem seções: Critical, Important, Suggestions, Positive
- [ ] Review menciona linhas específicas do código
- [ ] Recomendações fazem sentido para o código

---

## ✅ Checklist de Configuração

- [ ] **API Key obtida** da Anthropic Console
- [ ] **Secret adicionado** no GitHub (`ANTHROPIC_API_KEY`)
- [ ] **Permissões habilitadas** (Read and write)
- [ ] **Workflow testado** com PR de exemplo
- [ ] **Review recebido** e validado
- [ ] **Time informado** sobre novo processo

---

## 🎉 Pronto para Produção!

Após configurar, todo PR receberá automaticamente:

✅ Análise de segurança
✅ Verificação de performance
✅ Sugestões de melhoria
✅ Feedback sobre boas práticas

**Benefícios**:
- 🚀 Código revisado em 1-2 minutos (vs 1-2 horas manual)
- 🔍 Análise consistente e detalhada
- 📚 Conhecimento do projeto incluído no contexto
- 💡 Aprenda com as sugestões da IA

---

**Setup**: 5 minutos
**Custo**: ~$5-50/mês
**Valor**: Inestimável

**Configurado por**: Claude Code (Anthropic)
**Data**: 2025-11-11

---

*Automated Code Review - Ready to Go!* 🤖✅🚀

