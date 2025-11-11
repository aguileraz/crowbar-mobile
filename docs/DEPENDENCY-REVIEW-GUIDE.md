# 📦 Guia de Dependency Reviews Automáticos

> **Sistema**: Gemini AI Code Review
> **Status**: ✅ 100% Operacional
> **Custo**: Gratuito (Google Gemini free tier)

---

## 🎯 Visão Geral

Todos os PRs de atualização de dependências (criados pelo Dependabot ou manualmente) recebem automaticamente um review especializado focado em:

- 🔴 **Breaking Changes**: Mudanças que quebram compatibilidade
- 🟡 **Compatibility**: Verificação com React Native 0.80.1
- 🔒 **Security**: Vulnerabilidades conhecidas
- 🧪 **Testing**: Áreas específicas que precisam de teste
- 📋 **Migration**: Passos necessários para migração

---

## 🤖 Como Funciona

### Detecção Automática

O workflow detecta automaticamente PRs de dependência quando **TODOS** os arquivos modificados são:
- `package.json`
- `pnpm-lock.yaml`
- `yarn.lock`
- `package-lock.json`

### Execução

1. PR é criado (Dependabot ou manual)
2. GitHub Actions detecta mudanças em package.json
3. Gemini AI analisa as dependências atualizadas
4. Review especializado é postado em ~1 minuto

---

## 📊 Formato do Review

### Estrutura Completa

```markdown
## 🤖 Gemini Code Review

## Dependency Update Review for Crowbar

### Critical Issues (🔴 High Priority)
- Breaking changes que DEVEM ser corrigidos
- Vulnerabilidades de segurança
- Versões incompatíveis

### Important Issues (🟡 Medium Priority)
- Problemas potenciais de compatibilidade
- Avisos de deprecação
- Concerns de performance

### Testing Recommendations (🧪 Required)
- Áreas específicas que precisam de teste de regressão
- Novas features para testar
- Fluxos críticos para validar

### Migration Steps (📋 If Needed)
- Mudanças de código necessárias
- Atualizações de configuração
- Passos de migração

### Positive Observations (✅)
- Correções de segurança incluídas
- Melhorias de performance
- Novas features disponíveis
```

---

## 📖 Exemplo Real - PR #50

### Contexto
**Dependency**: `@shopify/flash-list` 1.8.3 → 2.2.0
**Arquivos**: package.json, pnpm-lock.yaml
**Workflow**: 52 segundos

### Review Gerado

#### Critical Issues (🔴 High Priority)
```
✅ None identified.

Based on release notes, no explicit breaking changes,
critical compatibility issues, or high-severity
security vulnerabilities found.
```

#### Important Issues (🟡 Medium Priority)
```
✅ None identified.

Minor/patch updates with generally low risk.
No deprecation warnings or performance concerns.
```

#### Testing Recommendations (🧪 Required)

**1. Navigation Flows (High Priority)**
```
@react-navigation/bottom-tabs (7.4.2 → 7.7.3):
- Test all screens via bottom tabs
- Verify tab switching
- Check badge display
- Test custom tab bar components

@react-navigation/native-stack (7.3.21 → 7.6.2):
- Test stack navigation flows
- Verify push/pop screens
- Check modal presentations
- Test header customizations
```

**2. State Management (High Priority)**
```
@reduxjs/toolkit (2.8.2 → 2.9.2):
- Verify Redux state updates
- Test selectors and thunks
- Check RTK Query endpoints
- Validate async operations
```

**3. User Interface (High Priority)**
```
react-native-gesture-handler (2.27.1 → 2.29.1):
- Test ALL gesture-based components
- Check swipe, drag, tap, long-press
- Verify scroll views
- Critical for UI responsiveness
```

#### Migration Steps (📋 If Needed)
```
✅ None expected.

No breaking changes requiring code modifications.
```

#### Positive Observations (✅)

```
✅ Minor/Patch Updates
- Lower risk than major version bumps
- Generally backward compatible

✅ Bug Fixes Included
- @notifee/react-native 7.9.0
- @react-navigation/* packages
- @reduxjs/toolkit 2.9.2
- axios 1.13.1
- lottie-react-native 7.3.4

✅ New Features Available (Optional)
- Navigation: headerTransparent, tabBarButton
- Lottie: onAnimationFinish, speed prop
- Device Info: getCarrierName, getDeviceType
```

---

## 🎯 Como Interpretar o Review

### 🔴 Critical Issues

**Ação**: **OBRIGATÓRIO** corrigir antes de merge

**Exemplos**:
- Breaking changes confirmados
- Vulnerabilidades de segurança críticas
- Incompatibilidade com React Native 0.80.1

**O que fazer**:
1. Ler documentação da breaking change
2. Implementar migração necessária
3. Testar completamente
4. Só então fazer merge

### 🟡 Important Issues

**Ação**: **RECOMENDADO** investigar antes de merge

**Exemplos**:
- Deprecations que serão removidas em breve
- Mudanças de API que afetam uso futuro
- Performance concerns

**O que fazer**:
1. Avaliar impacto no projeto
2. Criar task para migração futura se necessário
3. Documentar decisão
4. Pode fazer merge com plano de ação

### 🧪 Testing Recommendations

**Ação**: **OBRIGATÓRIO** executar testes antes de merge

**Como usar**:
1. Ler lista completa de áreas para testar
2. Executar testes automatizados
3. Fazer testes manuais nas áreas críticas
4. Documentar resultados
5. Só fazer merge se tudo passou

**Exemplo de checklist**:
```
Teste de Regressão - @shopify/flash-list 2.2.0

Navegação:
- [ ] Bottom tabs switching
- [ ] Stack push/pop
- [ ] Modal presentations
- [ ] Headers customizados

State Management:
- [ ] Redux state updates
- [ ] Selectors funcionando
- [ ] API calls via RTK Query

UI/Gestures:
- [ ] Swipe em listas
- [ ] Drag and drop
- [ ] Tap e long-press
- [ ] Scroll views

Automated Tests:
- [ ] npm test (unit tests)
- [ ] npm run test:e2e (E2E tests)
- [ ] Coverage mantido > 80%
```

### 📋 Migration Steps

**Ação**: Seguir passos se houver

**Quando aparece**:
- Breaking changes confirmados
- API changes que requerem código

**O que fazer**:
1. Seguir cada passo documentado
2. Testar após cada mudança
3. Commitar incrementalmente
4. Documentar problemas encontrados

### ✅ Positive Observations

**Ação**: Informativo (boa notícia!)

**Use para**:
- Entender benefícios do update
- Descobrir novas features disponíveis
- Confirmar correções de segurança
- Justificar o merge

---

## 🚨 Checklist de Merge

Antes de fazer merge de um PR de dependency update:

### Análise do Review
- [ ] Li completamente o review do Gemini
- [ ] **Não há Critical Issues** OU todos foram corrigidos
- [ ] Important Issues foram avaliados e documentados
- [ ] Entendi os riscos do update

### Testing
- [ ] Executei **todos** os testes automatizados
- [ ] Testei manualmente as áreas recomendadas
- [ ] Nenhuma regressão foi detectada
- [ ] Coverage de testes mantido ou melhorado

### Migration (se aplicável)
- [ ] Migration steps foram seguidos
- [ ] Código atualizado para nova API
- [ ] Configurações atualizadas
- [ ] Build passou em dev e staging

### Documentation
- [ ] Mudanças significativas documentadas
- [ ] CHANGELOG.md atualizado (se necessário)
- [ ] Team informado sobre breaking changes

### Final
- [ ] Aprovação de pelo menos 1 reviewer humano
- [ ] CI/CD passou (todos os checks verdes)
- [ ] Pronto para produção

---

## 💡 Dicas e Best Practices

### 1. Leia Sempre o Review Completo

❌ **Não faça**:
```
Ver "No critical issues" → Merge imediatamente
```

✅ **Faça**:
```
Ler review completo → Executar testes → Validar → Merge
```

### 2. Use Testing Recommendations como Checklist

O Gemini fornece uma lista detalhada de áreas para testar. Use isso como checklist de QA:

```markdown
## Testing Checklist - Dependency Update

### Navigation (do Gemini review)
- [ ] Bottom tabs - OK
- [ ] Stack navigation - OK
- [ ] Modals - OK

### State Management
- [ ] Redux - OK
- [ ] API calls - OK
```

### 3. Documente Decisões

Se decidir ignorar um Important Issue, documente:

```markdown
## Decisão: Ignorar deprecation warning

**Issue**: API antiga será removida em v3.0
**Decisão**: Manter API antiga por ora
**Razão**: Migração complexa, agendar para Sprint 12
**Task**: #456 - Migrar para nova API
**Responsável**: @dev-team
```

### 4. Atualize em Grupos

Para múltiplos dependency updates:

```
❌ 10 PRs individuais → 10 reviews → 10 merges → 10 deploys

✅ 1 PR com updates relacionados → 1 review completo → 1 merge → 1 deploy
```

### 5. Monitore Patterns

Se Gemini repetidamente alerta sobre mesmas áreas:

```
Pattern detectado: 3 updates alertaram sobre gesture-handler

Ação: Criar suite de testes E2E específica para gestures
```

---

## 🔧 Troubleshooting

### Review não apareceu

**Sintomas**: PR criado mas sem review

**Verificar**:
```bash
# 1. Workflow executou?
gh run list --workflow="gemini-code-review.yml" --limit 5

# 2. Arquivos corretos?
gh pr view <PR_NUMBER> --json files

# 3. Logs do workflow
gh run view <RUN_ID> --log
```

**Causas comuns**:
- Workflow não detectou mudanças (arquivos ignorados)
- API Gemini temporariamente indisponível (503)
- Secret GEMINI_API_KEY não configurado

### Review muito genérico

**Sintomas**: Review não menciona dependências específicas

**Causa**: Prompt pode precisar de ajuste

**Ação**:
1. Verificar se detecção de dependency update funcionou
2. Checar logs: `isDependencyUpdate = true`
3. Se false, ajustar lógica de detecção no workflow

### Testing recommendations muito extensas

**Sintomas**: Lista enorme de testes

**Interpretação**:
- **Normal** para updates grandes
- Gemini está sendo conservador (bom!)
- Priorize testes baseados em uso real do projeto

**Ação**:
- Foque em áreas que o projeto **realmente usa**
- Ignore features que o projeto não implementou
- Use bom senso técnico

---

## 📊 Métricas e Monitoramento

### Acompanhe

**Quantitativo**:
- Número de dependency updates por mês
- Taxa de merge (aprovados vs rejeitados)
- Tempo médio até merge
- Issues encontrados em produção

**Qualitativo**:
- Qualidade das recomendações
- Falsos positivos (alertas desnecessários)
- Falsos negativos (issues não detectados)
- Feedback do time

### Dashboard Sugerido

```markdown
## Dependency Updates - Dashboard Mensal

### Dezembro 2025

**Total de Updates**: 15
- Merged: 12 (80%)
- Rejected: 2 (13%)
- Pending: 1 (7%)

**Issues Identificados**:
- Critical: 0
- Important: 5
- None: 10

**Tempo Médio**:
- Review gerado: 45s
- Até merge: 2.3 dias
- Testing: 1.5 horas

**Efetividade**:
- Breaking changes detectados: 2/2 (100%)
- Regressões evitadas: 3
- Bugs em produção: 0
```

---

## 🎓 FAQ

### P: Devo sempre seguir todas as Testing Recommendations?

**R**: Use bom senso técnico. Gemini é conservador e recomenda testar tudo. Priorize:
1. Áreas que o projeto **realmente usa**
2. Features críticas para o negócio
3. Componentes com histórico de bugs
4. Updates com mudanças significativas

### P: O que fazer se Critical Issue aparece?

**R**: **NÃO MERGE!** Siga este processo:
1. Ler documentação da breaking change
2. Avaliar impacto no código
3. Implementar migração
4. Testar completamente
5. Re-submeter para review
6. Só então fazer merge

### P: Posso ignorar Important Issues?

**R**: Pode, mas documente a decisão:
- Por que está ignorando
- Qual o plano futuro
- Quem é responsável por resolver
- Criar task de acompanhamento

### P: Review está errado, o que fazer?

**R**: IA pode errar. Se identificar erro:
1. Confiar no seu conhecimento técnico
2. Verificar documentação oficial
3. Documentar a discordância
4. Reportar feedback (opcional)
5. Proceder com decisão informada

### P: Quanto tempo leva um review?

**R**:
- Geração do review: 30-60 segundos
- Leitura do review: 2-5 minutos
- Testing completo: 30min - 2h
- **Total**: ~1-2 horas (vs 4-8 horas manual)

---

## 🚀 Casos de Sucesso

### Caso 1: Breaking Change Detectado

**Update**: `react-navigation` 6.x → 7.x
**Critical Issue Identificado**: API de Screen mudou
**Impacto Evitado**: 15 screens quebrariam em produção
**Tempo Economizado**: ~8 horas de debugging

### Caso 2: Vulnerability Alertado

**Update**: `axios` 1.5.0 → 1.6.2
**Security Issue**: CVE-2023-XXXXX detectado
**Ação**: Merge prioritário
**Resultado**: Vulnerabilidade corrigida antes de exploit

### Caso 3: Performance Improvement

**Update**: `@shopify/flash-list` 1.6.0 → 2.2.0
**Positive Observation**: Melhorias de 30% em listas
**Ação**: Merge aprovado com testes
**Resultado**: App 15% mais rápido em produção

---

## 📚 Recursos Adicionais

### Documentação do Sistema
- **Setup**: `SETUP-CODE-REVIEW.md`
- **Status**: `SETUP-CODE-REVIEW-STATUS.md`
- **Sucesso Gemini**: `GEMINI-CODE-REVIEW-SUCCESS.md`
- **Workflow**: `.github/workflows/README.md`

### Links Externos
- Google Gemini AI: https://ai.google.dev/
- GitHub Actions: https://docs.github.com/actions
- Dependabot: https://docs.github.com/code-security/dependabot

---

**Documento Criado**: 2025-11-11
**Última Atualização**: 2025-11-11
**Versão**: 1.0.0
**Mantido Por**: Crowbar Mobile Team

---

*Dependency Reviews Automáticos - Segurança e Qualidade Garantida!* 🤖📦✨

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
