# Pull Request

## 📝 Descrição

<!-- Descreva brevemente as mudanças feitas neste PR -->

## 🎯 Tipo de Mudança

- [ ] 🐛 Bug fix (correção de bug que não quebra funcionalidades existentes)
- [ ] ✨ Nova feature (mudança que adiciona funcionalidade)
- [ ] 💥 Breaking change (correção ou feature que causa quebra de funcionalidades existentes)
- [ ] 📚 Documentação (apenas mudanças em documentação)
- [ ] 🎨 Refatoração (mudança de código que não corrige bug nem adiciona feature)
- [ ] ⚡ Performance (mudança que melhora performance)
- [ ] ✅ Testes (adição ou correção de testes)

## 🔍 Checklist de Code Review

### Código

- [ ] O código segue os padrões do projeto (ESLint, Prettier)
- [ ] Comentários foram adicionados onde necessário (em português)
- [ ] Não há código comentado ou console.log desnecessários
- [ ] Variáveis e funções têm nomes descritivos
- [ ] Não há duplicação desnecessária de código

### 🐛 Verificação de Bugs (CRÍTICO)

- [ ] ✅ **Executei o script de detecção de bugs**: `python3 /tmp/find-all-bugs.py`
- [ ] ✅ **Zero bugs de referência detectados** (padrão `const _var` usado como `var`)
- [ ] ✅ **Validei uso correto de variáveis com `_` prefix**
  - Exemplo correto: `const _response = await api.get()` → `return _response.data`
  - Exemplo incorreto: `const _response = await api.get()` → `return response.data` ❌

### Testes

- [ ] Testes unitários foram adicionados/atualizados
- [ ] Testes de integração foram considerados
- [ ] Todos os testes passam localmente (`npm test`)
- [ ] Cobertura de testes não diminuiu (mínimo 85%)
- [ ] Testes cobrem casos de sucesso E erro

### TypeScript

- [ ] Não há erros do TypeScript (`npm run type-check`)
- [ ] Tipos estão corretamente definidos (sem `any` desnecessários)
- [ ] Interfaces e types estão documentados

### Performance

- [ ] Não há problemas óbvios de performance
- [ ] Imagens e assets foram otimizados
- [ ] Não há memory leaks aparentes
- [ ] Operações assíncronas têm tratamento de erro

### Mobile Específico

- [ ] Testado em Android (emulador ou device)
- [ ] Testado em iOS (se aplicável)
- [ ] Não quebra funcionalidades offline
- [ ] Animações são suaves (60 fps)

### Segurança

- [ ] Não há credenciais ou secrets hardcoded
- [ ] Input de usuário é validado
- [ ] Dados sensíveis são tratados corretamente
- [ ] Dependências vulneráveis foram verificadas

### Documentação

- [ ] README foi atualizado (se necessário)
- [ ] Comentários JSDoc foram adicionados (para funções públicas)
- [ ] CHANGELOG foi atualizado (se aplicável)

## 🧪 Como Testar

<!-- Descreva os passos para testar as mudanças -->

1.
2.
3.

## 📸 Screenshots/Videos

<!-- Adicione screenshots ou vídeos se aplicável -->

## 🔗 Issues Relacionadas

<!-- Link para issues do GitHub, Jira, etc -->

Closes #
Related to #

## 📋 Checklist Adicional

- [ ] PR tem título descritivo seguindo padrão de commits convencionais
- [ ] PR foi atribuído a mim
- [ ] Labels apropriadas foram adicionadas
- [ ] Reviewer foi solicitado
- [ ] CI/CD está passando (se configurado)

## 💬 Notas para Reviewers

<!-- Informações adicionais para quem vai revisar este PR -->

---

### ⚠️ ATENÇÃO: Verificação Obrigatória de Bugs

**ANTES de aprovar este PR**, execute localmente:

```bash
python3 /tmp/find-all-bugs.py
```

Se o script reportar bugs, **NÃO APROVE** o PR até que sejam corrigidos.

**Padrão de bug detectado**:
```typescript
// ❌ ERRADO - Causa ReferenceError
const _response = await apiClient.get('/endpoint');
return response.data;  // 'response' não está definido

// ✅ CORRETO
const _response = await apiClient.get('/endpoint');
return _response.data;  // Usa '_response' com underscore
```

Este padrão causou **42 bugs críticos** em produção. Ver: `docs/SPRINT-8-WEEK-2-BUG-MASSACRE-REPORT.md`
