# Crowbar Mobile - Checklist de Testes (Versão Impressa)

**Versão**: 1.0.0 | **Data**: 2025-11-12 | **Testador**: ____________

---

## 📱 Informações do Dispositivo

- **Modelo**: ________________________
- **Android**: ______________________
- **RAM**: _________ | **Espaço**: _________
- **Rede**: ☐ WiFi  ☐ Dados Móveis

---

## ✅ Checklist Rápido (30 minutos)

### 1. Inicialização (2 min)
- ☐ App inicia sem crash
- ☐ Splash screen aparece
- ☐ Metro conecta automaticamente
- ☐ Nenhum erro visível

### 2. Navegação (3 min)
- ☐ Bottom tabs funcionam (4 tabs)
- ☐ Stack navigation OK
- ☐ Botão voltar Android OK
- ☐ Transições suaves

### 3. Autenticação (5 min)
- ☐ Login funciona
- ☐ Validação de campos OK
- ☐ OAuth2 funciona
- ☐ Logout limpa sessão

**Credenciais**: `teste@crowbar.com` / `Teste@123`

### 4. Browse & Search (5 min)
- ☐ Lista de boxes carrega
- ☐ Imagens aparecem
- ☐ Preços em R$ corretos
- ☐ Search bar funciona
- ☐ Filtros funcionam

### 5. Detalhes do Box (3 min)
- ☐ Tela de detalhes abre
- ☐ Todas informações aparecem
- ☐ Galeria de imagens funciona
- ☐ Reviews aparecem
- ☐ "Adicionar ao Carrinho" OK

### 6. Carrinho (5 min)
- ☐ Badge de quantidade OK
- ☐ Lista de items OK
- ☐ +/- quantidade funciona
- ☐ Remover funciona
- ☐ Subtotal correto
- ☐ Persiste após reiniciar

### 7. Checkout (5 min)
- ☐ Formulário endereço OK
- ☐ ViaCEP funciona (CEP: 01310-100)
- ☐ Métodos de pagamento aparecem
- ☐ Cupom funciona
- ☐ Total final correto

**Cartão Teste**: `4111 1111 1111 1111` | `12/25` | `123`

### 8. Gamificação (2 min)
- ☐ Animação de abertura funciona
- ☐ Haptic feedback OK
- ☐ Achievements acessíveis
- ☐ Daily spin wheel OK

### 9. Perfil & Reviews (3 min)
- ☐ Dados do usuário aparecem
- ☐ Editar perfil funciona
- ☐ Histórico de pedidos OK
- ☐ Criar review funciona

### 10. Performance (2 min)
- ☐ Inicia < 3 segundos
- ☐ Transições fluidas (60 FPS)
- ☐ Scroll suave
- ☐ Nenhum freeze

---

## 🎯 Cenários Críticos (10 minutos)

### Cenário 1: Compra Completa
1. ☐ Login
2. ☐ Browse boxes
3. ☐ Search "tech"
4. ☐ Ver detalhes
5. ☐ Adicionar 2x ao carrinho
6. ☐ Checkout com CEP
7. ☐ Pagamento
8. ☐ Confirmar pedido
9. ☐ Ver no histórico

**Tempo**: ______ min | **Resultado**: ☐ PASS  ☐ FAIL

### Cenário 2: Uso Offline
1. ☐ Navegar online
2. ☐ Adicionar ao carrinho
3. ☐ Favoritar box
4. ☐ Desativar conexão
5. ☐ Navegar (cache)
6. ☐ Ver carrinho
7. ☐ Tentar checkout (erro OK)
8. ☐ Reativar conexão
9. ☐ Sincroniza automaticamente

**Tempo**: ______ min | **Resultado**: ☐ PASS  ☐ FAIL

### Cenário 3: Stress Test
1. ☐ Scroll rápido (100+ items)
2. ☐ Alternar tabs rapidamente
3. ☐ Abrir 10 boxes rápido
4. ☐ Add/remove 20 items
5. ☐ App switching

**Tempo**: ______ min | **Resultado**: ☐ PASS  ☐ FAIL

---

## 🐛 Bugs Encontrados

### Bug #1
**Severidade**: ☐ Crítica  ☐ Alta  ☐ Média  ☐ Baixa

**Descrição**: ___________________________________________
___________________________________________
___________________________________________

**Passos para Reproduzir**:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

**Esperado**: ___________________________________________

**Atual**: ___________________________________________

---

### Bug #2
**Severidade**: ☐ Crítica  ☐ Alta  ☐ Média  ☐ Baixa

**Descrição**: ___________________________________________
___________________________________________
___________________________________________

**Passos para Reproduzir**:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

**Esperado**: ___________________________________________

**Atual**: ___________________________________________

---

### Bug #3
**Severidade**: ☐ Crítica  ☐ Alta  ☐ Média  ☐ Baixa

**Descrição**: ___________________________________________
___________________________________________
___________________________________________

**Passos para Reproduzir**:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

**Esperado**: ___________________________________________

**Atual**: ___________________________________________

---

## 📊 Resumo do Teste

**Data do Teste**: _____ / _____ / _____
**Hora Início**: _____:_____
**Hora Fim**: _____:_____
**Duração Total**: _______ minutos

**Testes Realizados**: _____
**Testes Passaram**: _____
**Testes Falharam**: _____

**Bugs Encontrados**:
- Críticos: _____
- Altos: _____
- Médios: _____
- Baixos: _____

**Classificação Geral**:
☐ ✅ PRONTO PARA PRODUÇÃO (Zero bugs críticos/altos)
☐ ⚠️ REQUER FIXES (Bugs críticos/altos encontrados)
☐ ❌ NÃO PRONTO (Múltiplos problemas bloqueantes)

**Notas Adicionais**:
___________________________________________
___________________________________________
___________________________________________
___________________________________________

**Recomendação**:
☐ Aprovar para próxima fase
☐ Re-testar após fixes
☐ Não aprovar

**Assinatura do Testador**: ________________________

---

**Próximos Passos**:
- [ ] Documentar bugs no sistema de tracking
- [ ] Enviar logs para dev team
- [ ] Agendar re-teste (se necessário)
- [ ] Atualizar status no projeto

---

*Crowbar Mobile Testing | v1.0.0 | 2025-11-12*
