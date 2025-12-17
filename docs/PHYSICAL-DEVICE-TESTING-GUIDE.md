# Guia de Testes em Dispositivo Físico - Android

**Versão**: 1.0.0
**Data**: 2025-11-12
**APK**: app-debug.apk (103 MB)
**Status**: ✅ Pronto para testes

---

## 📱 Pré-requisitos

### Dispositivo Android

**Requisitos Mínimos**:
- Android 5.0 (API 21) ou superior
- 200 MB espaço livre
- Conexão WiFi (mesma rede do computador de desenvolvimento)

**Recomendado**:
- Android 10+ para melhor experiência
- 4 GB RAM ou mais
- Tela 5.5" ou maior

### Computador de Desenvolvimento

**Instalado**:
- [x] Node.js 18+ (verificar: `node -v`)
- [x] Android SDK Platform Tools (adb)
- [x] Metro bundler pronto para executar

**Verificar ADB**:
```bash
adb --version
# Deve mostrar: Android Debug Bridge version 1.0.41 ou superior
```

---

## 🚀 Método 1: Instalação via ADB (Recomendado)

### Passo 1: Preparar Dispositivo

**No Dispositivo Android**:
1. Ir em **Configurações** → **Sobre o telefone**
2. Tocar 7x em **Número da compilação** (ativa modo desenvolvedor)
3. Voltar para **Configurações** → **Opções do desenvolvedor**
4. Ativar **Depuração USB**
5. Conectar dispositivo ao computador via USB

### Passo 2: Verificar Conexão

```bash
# Listar dispositivos conectados
adb devices

# Deve aparecer algo como:
# List of devices attached
# 1234567890ABCDEF    device
```

**Se aparecer "unauthorized"**:
- No dispositivo, aceitar prompt "Permitir depuração USB?"
- Marcar "Sempre permitir deste computador"

### Passo 3: Instalar APK

```bash
# Navegar para a pasta do projeto
cd /mnt/overpower/apps/dev/agl/crowbar/crowbar-mobile

# Instalar APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Resultado esperado:
# Performing Streamed Install
# Success
```

**Se der erro "INSTALL_FAILED_ALREADY_EXISTS"**:
```bash
# Desinstalar versão anterior
adb uninstall com.crowbarmobile

# Instalar novamente
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Passo 4: Iniciar Metro Bundler

**Em um terminal separado**:
```bash
cd /mnt/overpower/apps/dev/agl/crowbar/crowbar-mobile
npm start

# Aguardar mensagem:
# Loading dependency graph, done.
```

### Passo 5: Configurar Conexão Metro

**Se dispositivo não conectar automaticamente ao Metro**:

```bash
# Redirecionar porta do Metro
adb reverse tcp:8081 tcp:8081
```

**OU configurar manualmente no app**:
1. Abrir app Crowbar no dispositivo
2. Agitar dispositivo (shake gesture)
3. Menu de desenvolvedor aparece
4. Tocar em **Dev Settings**
5. Tocar em **Debug server host & port for device**
6. Digitar: `<IP_DO_SEU_COMPUTADOR>:8081` (ex: `192.168.1.100:8081`)
7. Voltar e tocar em **Reload**

**Encontrar IP do computador**:
```bash
# Linux/Mac
ifconfig | grep "inet "

# Windows
ipconfig
```

### Passo 6: Abrir Aplicativo

1. No dispositivo, abrir **Crowbar** no launcher
2. App deve carregar e conectar ao Metro
3. Verificar mensagem no terminal Metro: "Running application 'Crowbar'"

---

## 📦 Método 2: Instalação Direta (Sem ADB)

### Passo 1: Transferir APK

**Opções**:
- **USB**: Copiar `app-debug.apk` para pasta Downloads do dispositivo
- **Email**: Enviar APK por email e baixar no dispositivo
- **Cloud**: Upload para Google Drive/Dropbox e baixar no dispositivo

### Passo 2: Permitir Fontes Desconhecidas

**Android 8.0+**:
1. Ao tentar instalar, aparecerá prompt
2. Tocar em **Configurações**
3. Ativar **Permitir desta fonte**

**Android 7.0 e inferior**:
1. **Configurações** → **Segurança**
2. Ativar **Fontes desconhecidas**

### Passo 3: Instalar APK

1. Abrir **Arquivos** ou **Gerenciador de arquivos**
2. Navegar até pasta Downloads
3. Tocar em **app-debug.apk**
4. Tocar em **Instalar**
5. Aguardar instalação (10-30 segundos)
6. Tocar em **Abrir**

### Passo 4: Conectar ao Metro

**Importante**: Dispositivo deve estar na mesma rede WiFi do computador!

1. Iniciar Metro bundler no computador: `npm start`
2. No app, agitar dispositivo para abrir menu dev
3. Configurar IP do computador (ver Método 1, Passo 5)
4. Tocar em **Reload**

---

## 📋 Checklist de Validação

### ✅ Funcionalidades Básicas

#### 1. Splash Screen & Inicialização (2 min)
- [ ] App inicia sem crashes
- [ ] Splash screen aparece
- [ ] Transição suave para tela principal
- [ ] Nenhum erro no Metro terminal

#### 2. Navegação (3 min)
- [ ] Bottom tabs funcionam (Home, Search, Cart, Profile)
- [ ] Stack navigation funciona (push/pop)
- [ ] Botão voltar do Android funciona
- [ ] Transições são suaves (sem lag)

#### 3. UI/UX Básico (2 min)
- [ ] Textos legíveis e em português BR
- [ ] Ícones carregam corretamente
- [ ] Cores do tema aplicadas
- [ ] Nenhum componente quebrado visualmente

### 🔐 Autenticação (10 min)

#### Login/Registro
- [ ] Tela de login aparece para usuário não autenticado
- [ ] Formulário de login funciona
- [ ] Validação de campos funciona
- [ ] Erros são exibidos corretamente
- [ ] Login com Keycloak OAuth2 funciona
- [ ] Redirecionamento após login correto

**Credenciais de Teste**:
- Email: `teste@crowbar.com`
- Senha: `Teste@123`

#### Logout
- [ ] Botão de logout presente no perfil
- [ ] Logout limpa sessão
- [ ] Redirecionamento para login após logout

### 📦 Funcionalidades de Box (15 min)

#### Browse & Search
- [ ] Lista de boxes carrega na home
- [ ] Imagens dos boxes aparecem
- [ ] Preços formatados corretamente (R$)
- [ ] Search bar funciona
- [ ] Filtros funcionam (categoria, preço, raridade)
- [ ] Scroll infinito funciona

#### Detalhes do Box
- [ ] Tocar em box abre tela de detalhes
- [ ] Todas informações aparecem (título, preço, descrição, raridade)
- [ ] Imagens em galeria funcionam
- [ ] Reviews aparecem
- [ ] Botão "Adicionar ao Carrinho" funciona

#### Favoritos
- [ ] Botão de favorito (coração) funciona
- [ ] Box é adicionado/removido dos favoritos
- [ ] Lista de favoritos acessível no perfil
- [ ] Favoritos persistem após reiniciar app

### 🛒 Carrinho & Checkout (15 min)

#### Carrinho
- [ ] Badge de quantidade no ícone do carrinho
- [ ] Lista de items no carrinho
- [ ] Quantidade pode ser alterada (+/-)
- [ ] Item pode ser removido
- [ ] Subtotal calcula corretamente
- [ ] Carrinho persiste após reiniciar app

#### Checkout
- [ ] Botão "Finalizar Compra" acessível
- [ ] Formulário de endereço funciona
- [ ] ViaCEP autocomplete funciona (testar CEP: 01310-100)
- [ ] Seleção de método de pagamento
- [ ] Aplicar cupom funciona
- [ ] Cálculo de frete funciona
- [ ] Total final correto

**Teste de CEP**:
- CEP: `01310-100`
- Deve preencher: Av. Paulista, Bela Vista, São Paulo - SP

#### Pagamento (ATENÇÃO: Ambiente de Teste)
- [ ] Formulário de cartão aparece
- [ ] Validação de cartão funciona
- [ ] Boleto pode ser selecionado
- [ ] PIX pode ser selecionado
- [ ] Confirmação de pedido funciona

**Cartão de Teste**:
- Número: `4111 1111 1111 1111`
- Validade: `12/25`
- CVV: `123`

### 🎮 Gamificação (10 min)

#### Abertura de Box
- [ ] Animação de abertura funciona
- [ ] Efeitos sonoros (se implementados)
- [ ] Haptic feedback funciona
- [ ] Revelação de conteúdo suave
- [ ] Pode compartilhar resultado

#### Achievements
- [ ] Lista de conquistas acessível
- [ ] Progresso de conquistas visível
- [ ] Notificação ao desbloquear achievement

#### Daily Spin Wheel
- [ ] Roda da sorte acessível
- [ ] Animação de rotação funciona
- [ ] Prêmio é creditado
- [ ] Cooldown de 24h funciona

### ⭐ Reviews & Ratings (5 min)

- [ ] Lista de reviews em box details
- [ ] Formulário de review funciona
- [ ] Rating com estrelas funciona
- [ ] Review é salvo e aparece na lista
- [ ] Pode editar própria review
- [ ] Pode deletar própria review

### 👤 Perfil (5 min)

- [ ] Dados do usuário aparecem
- [ ] Foto de perfil pode ser alterada
- [ ] Dados pessoais podem ser editados
- [ ] Lista de endereços salvos
- [ ] Histórico de pedidos acessível
- [ ] Configurações acessíveis

### 🔔 Notificações (5 min)

- [ ] Permissão de notificação solicitada
- [ ] Notificações push funcionam (testar envio)
- [ ] Notificações in-app aparecem
- [ ] Tocar em notificação navega corretamente

### 📶 Funcionalidades Offline (10 min)

#### Teste de Offline
1. Desativar WiFi e dados móveis
2. Tentar navegar no app

**Esperado**:
- [ ] App não crasha
- [ ] Dados em cache aparecem
- [ ] Mensagem de "Sem conexão" clara
- [ ] Retry button funciona
- [ ] Ao voltar online, sincroniza automaticamente

#### Persistência
- [ ] Carrinho persiste offline
- [ ] Favoritos persistem offline
- [ ] Login persiste após reiniciar app
- [ ] Preferências persistem

### ⚡ Performance (5 min)

- [ ] App inicia em < 3 segundos
- [ ] Transições são fluidas (60 FPS)
- [ ] Scroll é suave em listas longas
- [ ] Imagens carregam rapidamente
- [ ] Nenhum freeze perceptível
- [ ] Consumo de bateria normal (verificar após 10 min uso)

---

## 🐛 Relatório de Bugs

### Template de Bug Report

```markdown
## Bug #[NÚMERO]

**Severidade**: [Crítica/Alta/Média/Baixa]
**Prioridade**: [P0/P1/P2/P3]

### Descrição
[Descrição clara e concisa do bug]

### Passos para Reproduzir
1. [Primeiro passo]
2. [Segundo passo]
3. [...]

### Comportamento Esperado
[O que deveria acontecer]

### Comportamento Atual
[O que realmente acontece]

### Screenshots/Vídeo
[Anexar evidências]

### Informações do Dispositivo
- Modelo: [ex: Samsung Galaxy S21]
- Android: [ex: 12]
- Versão do App: [0.0.1]
- Build: [debug]

### Logs
```
[Logs do adb logcat, se disponível]
```

### Ambiente
- [ ] Reproduz em WiFi
- [ ] Reproduz em dados móveis
- [ ] Reproduz offline
- [ ] Reproduz sempre / intermitente

### Impacto no Usuário
[Baixo/Médio/Alto] - [Explicar impacto]
```

### Categorias de Severidade

**Crítica (Bloqueante)**:
- App crasha ao iniciar
- Não é possível fazer login
- Não é possível finalizar compra
- Perda de dados

**Alta**:
- Funcionalidade principal quebrada
- UX severamente prejudicada
- Performance muito ruim

**Média**:
- Bug visual significativo
- Funcionalidade secundária quebrada
- Workaround difícil

**Baixa**:
- Bug visual menor
- Typos
- Funcionalidade terciária
- Workaround fácil

---

## 📊 Coletar Logs

### Via ADB

**Logs Gerais**:
```bash
# Logs em tempo real
adb logcat | grep Crowbar

# Salvar logs em arquivo
adb logcat > crowbar-logs.txt

# Filtrar por erro
adb logcat *:E > crowbar-errors.txt
```

**Logs de Crash**:
```bash
# Últimos crashes
adb logcat -b crash

# Logs React Native
adb logcat | grep ReactNativeJS
```

**Limpar Logs**:
```bash
# Limpar buffer antes de teste
adb logcat -c
```

### Via App (Dev Menu)

1. Agitar dispositivo
2. Tocar em **Show Perf Monitor**
3. Observar FPS e uso de memória
4. Tocar em **Debug** → **Enable Remote JS Debugging**
5. Abrir Chrome DevTools no computador
6. Ver console para erros JavaScript

---

## 🎯 Cenários de Teste Críticos

### Cenário 1: Jornada Completa de Compra (Happy Path)

**Tempo Estimado**: 10 minutos

1. **Iniciar**: Abrir app
2. **Login**: Fazer login com credenciais de teste
3. **Browse**: Navegar pela home, ver boxes
4. **Search**: Buscar "tech" e aplicar filtro de preço
5. **Details**: Tocar em um box, ver detalhes
6. **Add to Cart**: Adicionar 2 unidades ao carrinho
7. **Cart**: Ir ao carrinho, verificar total
8. **Checkout**: Preencher endereço com CEP autocomplete
9. **Payment**: Selecionar cartão, preencher dados de teste
10. **Confirm**: Confirmar pedido
11. **Success**: Ver tela de sucesso
12. **Order History**: Ver pedido no histórico

**Critério de Sucesso**: Todos os passos completados sem erros

### Cenário 2: Uso Offline

**Tempo Estimado**: 5 minutos

1. **Online**: Navegar no app, carregar alguns boxes
2. **Add to Cart**: Adicionar item ao carrinho
3. **Favorite**: Favoritar um box
4. **Offline**: Desativar conexão
5. **Navigate**: Tentar navegar (deve mostrar cache)
6. **Cart**: Ver carrinho (deve persistir)
7. **Checkout**: Tentar checkout (deve mostrar erro claro)
8. **Online**: Reativar conexão
9. **Sync**: Verificar se sincroniza automaticamente

**Critério de Sucesso**: App funciona offline com feedback claro

### Cenário 3: Teste de Stress

**Tempo Estimado**: 5 minutos

1. **Scroll Rápido**: Scroll rápido em lista com 100+ items
2. **Multiple Tabs**: Alternar rapidamente entre tabs
3. **Image Loading**: Entrar em 10 boxes rapidamente
4. **Cart Operations**: Adicionar/remover 20 items rapidamente
5. **App Switching**: Sair do app, abrir outros apps, voltar

**Critério de Sucesso**: App não crasha, performance aceitável

---

## 📝 Checklist Final

### Antes de Reportar "PRONTO PARA PRODUÇÃO"

- [ ] Todos os cenários críticos testados
- [ ] Zero crashes durante 30 min de uso
- [ ] Todas funcionalidades core funcionando
- [ ] Performance aceitável (transições < 500ms)
- [ ] Consumo de bateria normal
- [ ] Todos bugs P0/P1 reportados
- [ ] Screenshots/vídeos de evidências coletados
- [ ] Logs salvos para análise
- [ ] Teste realizado em pelo menos 2 dispositivos diferentes
- [ ] Teste realizado em WiFi e dados móveis

---

## 🚀 Próximos Passos Após Teste

### Se Teste PASSOU (Zero P0/P1 bugs)

1. ✅ Marcar Sprint 9 Week 2 como **PRODUCTION READY**
2. ✅ Criar build de release (assinado)
3. ✅ Iniciar processo de publicação na Play Store
4. ✅ Preparar materiais de lançamento

### Se Teste FALHOU (Bugs P0/P1 encontrados)

1. ⚠️ Documentar todos bugs encontrados
2. ⚠️ Priorizar fixes (P0 primeiro, depois P1)
3. ⚠️ Criar tasks de correção
4. ⚠️ Estimar tempo de fix
5. ⚠️ Re-testar após fixes

---

## 📞 Suporte

**Problemas de Instalação**:
- Ver seção "Troubleshooting" abaixo

**Problemas de Conexão Metro**:
- Verificar firewall
- Verificar mesma rede WiFi
- Tentar `adb reverse tcp:8081 tcp:8081`

**App Crashing**:
- Coletar logs: `adb logcat > crash-log.txt`
- Anexar em bug report

---

## 🔧 Troubleshooting

### "adb: device not found"
```bash
# Verificar drivers USB (Windows)
# Verificar cabo USB (testar outro cabo)
# Reiniciar adb
adb kill-server
adb start-server
```

### "INSTALL_FAILED_INSUFFICIENT_STORAGE"
```bash
# Liberar espaço no dispositivo (mínimo 200 MB)
# Desinstalar apps não utilizados
```

### "Could not connect to development server"
```bash
# Verificar Metro rodando
npm start

# Verificar porta
adb reverse tcp:8081 tcp:8081

# OU configurar IP manual no app
```

### App em tela branca/red screen
```bash
# Limpar cache
npm start -- --reset-cache

# Reinstalar app
adb uninstall com.crowbarmobile
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

**Guia Versão**: 1.0.0
**Última Atualização**: 2025-11-12
**Próxima Revisão**: Após primeira rodada de testes

*Crowbar Mobile: Testes rigorosos para qualidade garantida! 🧪📱✅*
