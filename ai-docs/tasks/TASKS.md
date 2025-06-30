# TASKS.md - Crowbar Mobile (React Native)

## **📋 Visão Geral**
Este documento contém todas as tarefas do projeto Crowbar Mobile organizadas seguindo metodologia SCRUM. Cada tarefa possui critérios de aceitação claros, estimativas de esforço e dependências bem definidas.

**Data de Criação**: 2025-01-30
**Última Atualização**: 2025-01-30
**Status do Projeto**: � Documentação Completa → 🔨 Pronto para Implementação

## 🚨 **STATUS ATUAL DO PROJETO**
- ✅ **Documentação**: 100% completa (PROJECT_PLAN, ACCEPTANCE_CRITERIA, TASKS, BACKLOG)
- ✅ **Planejamento**: SCRUM estruturado com 21 tarefas organizadas
- ❌ **Código**: Projeto React Native ainda não foi inicializado
- ❌ **Ambiente**: Não configurado
- 🎯 **Próximo Passo**: Executar NEXT_STEPS_TASK_LIST.md para inicializar projeto

---

## **🎯 ÉPICOS E FASES DO PROJETO**

### **ÉPICO 1: Fundação e Setup**
**Objetivo**: Estabelecer base sólida para desenvolvimento
**Duração Estimada**: 2-3 sprints
**Status**: � PRONTO PARA EXECUÇÃO
**Próxima Ação**: Seguir NEXT_STEPS_TASK_LIST.md

### **ÉPICO 2: Autenticação e Usuário**
**Objetivo**: Sistema completo de autenticação e perfil
**Duração Estimada**: 2 sprints  
**Status**: ⏳ Aguardando

### **ÉPICO 3: Core Features - Caixas Misteriosas**
**Objetivo**: Funcionalidades principais do marketplace
**Duração Estimada**: 3-4 sprints
**Status**: ⏳ Aguardando

### **ÉPICO 4: Features Avançadas**
**Objetivo**: Notificações, pagamentos e recursos avançados
**Duração Estimada**: 2-3 sprints
**Status**: ⏳ Aguardando

### **ÉPICO 5: Qualidade e Release**
**Objetivo**: Testes, otimização e preparação para lançamento
**Duração Estimada**: 2 sprints
**Status**: ⏳ Aguardando

---

## **📋 BACKLOG ATUAL**

### **SPRINT 1: Setup e Configuração Inicial**
**Período**: Sprint 1 (2 semanas)  
**Objetivo**: Configurar ambiente e estrutura base do projeto

#### **🔧 SETUP-001: Configuração Inicial do Projeto**
- **Descrição**: Configurar projeto React Native com TypeScript e estrutura de pastas
- **Prioridade**: 🔴 Crítica
- **Estimativa**: 8 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**: 
  - Projeto React Native criado com TypeScript
  - Estrutura de pastas conforme PROJECT_PLAN.md
  - ESLint e Prettier configurados
  - Metro bundler otimizado
- **Dependências**: Nenhuma
- **Acceptance Criteria**: Seção 1.1 do ACCEPTANCE_CRITERIA.md

#### **🔧 SETUP-002: Configuração de Ambiente e Variáveis**
- **Descrição**: Configurar variáveis de ambiente e arquivos de configuração
- **Prioridade**: 🔴 Crítica
- **Estimativa**: 3 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**:
  - Arquivo .env configurado
  - Configuração para staging e production
  - Variáveis de API_BASE_URL e SOCKET_URL
- **Dependências**: SETUP-001
- **Acceptance Criteria**: Seção 1.1 do ACCEPTANCE_CRITERIA.md

#### **🔧 SETUP-003: Configuração Firebase**
- **Descrição**: Integrar Firebase para autenticação e configurações
- **Prioridade**: 🔴 Crítica
- **Estimativa**: 5 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**:
  - Firebase configurado para iOS e Android
  - Arquivos de configuração adicionados
  - SDK Firebase integrado
  - Testes de conectividade funcionais
- **Dependências**: SETUP-001
- **Acceptance Criteria**: Seção 1.2 do ACCEPTANCE_CRITERIA.md

#### **🎨 SETUP-004: Setup do Design System e Tema**
- **Descrição**: Configurar React Native Paper e tema Material Design 3
- **Prioridade**: 🟡 Alta
- **Estimativa**: 5 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**:
  - React Native Paper configurado
  - Tema customizado implementado
  - Cores e tipografia definidas
  - Componentes base criados
- **Dependências**: SETUP-001
- **Acceptance Criteria**: Seção 1.2 do ACCEPTANCE_CRITERIA.md

#### **🧭 SETUP-005: Configuração de Navegação**
- **Descrição**: Implementar React Navigation com estrutura base
- **Prioridade**: 🟡 Alta
- **Estimativa**: 8 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**:
  - Stack Navigator configurado
  - Tab Navigator implementado
  - Deep linking configurado
  - Estrutura de navegação definida
- **Dependências**: SETUP-001, SETUP-004
- **Acceptance Criteria**: Seção 1.3 do ACCEPTANCE_CRITERIA.md

#### **🗃️ SETUP-006: Configuração Redux e Estado Global**
- **Descrição**: Configurar Redux Toolkit e estrutura de estado
- **Prioridade**: 🟡 Alta
- **Estimativa**: 8 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**:
  - Redux Toolkit configurado
  - Store estruturado
  - RTK Query configurado
  - Persistência com AsyncStorage
- **Dependências**: SETUP-001
- **Acceptance Criteria**: Seção 1.5 do ACCEPTANCE_CRITERIA.md

#### **🌐 SETUP-007: Configuração Cliente HTTP (Axios)**
- **Descrição**: Configurar Axios com interceptors e tratamento de erros
- **Prioridade**: 🟡 Alta
- **Estimativa**: 5 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**:
  - Cliente Axios configurado
  - Interceptors para auth e errors
  - Retry logic implementado
  - Timeout configurado
- **Dependências**: SETUP-002, SETUP-006
- **Acceptance Criteria**: Seção 1.5 do ACCEPTANCE_CRITERIA.md

#### **🧪 SETUP-008: Configuração de Testes**
- **Descrição**: Configurar Jest, React Native Testing Library e Detox
- **Prioridade**: 🟡 Alta
- **Estimativa**: 8 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**:
  - Jest configurado para React Native
  - Testing Library configurado
  - Detox configurado para E2E
  - Scripts de teste funcionais
- **Dependências**: SETUP-001
- **Acceptance Criteria**: Seção 4.1 do ACCEPTANCE_CRITERIA.md

---

### **SPRINT 2: Autenticação e Onboarding**
**Período**: Sprint 2 (2 semanas)  
**Objetivo**: Implementar sistema completo de autenticação

#### **🔐 AUTH-001: Tela de Login**
- **Descrição**: Implementar tela de login com Firebase Auth
- **Prioridade**: 🔴 Crítica
- **Estimativa**: 8 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**:
  - Interface de login Material Design 3
  - Validação de formulário com Formik/Yup
  - Integração com Firebase Auth
  - Estados de loading e erro
- **Dependências**: SETUP-003, SETUP-004, SETUP-005
- **Acceptance Criteria**: Seção 1.2 do ACCEPTANCE_CRITERIA.md

#### **🔐 AUTH-002: Tela de Registro**
- **Descrição**: Implementar tela de cadastro de novos usuários
- **Prioridade**: 🔴 Crítica
- **Estimativa**: 8 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**:
  - Formulário de cadastro completo
  - Validação de dados em tempo real
  - Integração com Firebase Auth
  - Confirmação de email
- **Dependências**: AUTH-001
- **Acceptance Criteria**: Seção 1.2 do ACCEPTANCE_CRITERIA.md

#### **🔐 AUTH-003: Recuperação de Senha**
- **Descrição**: Implementar fluxo de recuperação de senha
- **Prioridade**: 🟡 Alta
- **Estimativa**: 5 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**:
  - Tela de recuperação de senha
  - Envio de email via Firebase
  - Feedback visual adequado
  - Validação de email
- **Dependências**: AUTH-001
- **Acceptance Criteria**: Seção 1.2 do ACCEPTANCE_CRITERIA.md

#### **👤 AUTH-004: Tela de Perfil do Usuário**
- **Descrição**: Implementar tela de visualização e edição de perfil
- **Prioridade**: 🟡 Alta
- **Estimativa**: 8 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**:
  - Visualização de dados do perfil
  - Edição de informações pessoais
  - Upload de foto de perfil
  - Validação de dados
- **Dependências**: AUTH-001, SETUP-007
- **Acceptance Criteria**: Seção 1.2 do ACCEPTANCE_CRITERIA.md

#### **🔐 AUTH-005: Gerenciamento de Sessão**
- **Descrição**: Implementar persistência e gerenciamento de sessão
- **Prioridade**: 🔴 Crítica
- **Estimativa**: 5 pontos de história
- **Assignee**: TBD
- **Status**: [ ] Não Iniciado
- **Critérios de Aceitação**:
  - Persistência de sessão entre aberturas
  - Auto-logout em caso de token expirado
  - Refresh token automático
  - Estado de autenticação global
- **Dependências**: AUTH-001, SETUP-006
- **Acceptance Criteria**: Seção 1.2 do ACCEPTANCE_CRITERIA.md

---

### **BACKLOG FUTURO (Próximos Sprints)**

#### **📦 BOXES-001: Lista Principal de Caixas**
- **Descrição**: Implementar tela principal com lista de caixas misteriosas
- **Prioridade**: 🔴 Crítica
- **Estimativa**: 13 pontos de história
- **Status**: [ ] Não Iniciado
- **Sprint Planejado**: Sprint 3

#### **📦 BOXES-002: Detalhes da Caixa**
- **Descrição**: Tela com informações detalhadas de uma caixa
- **Prioridade**: 🔴 Crítica
- **Estimativa**: 8 pontos de história
- **Status**: [ ] Não Iniciado
- **Sprint Planejado**: Sprint 3

#### **🔍 BOXES-003: Sistema de Busca e Filtros**
- **Descrição**: Implementar busca e filtros para caixas
- **Prioridade**: 🟡 Alta
- **Estimativa**: 8 pontos de história
- **Status**: [ ] Não Iniciado
- **Sprint Planejado**: Sprint 4

#### **❤️ BOXES-004: Sistema de Favoritos**
- **Descrição**: Funcionalidade de adicionar/remover favoritos
- **Prioridade**: 🟢 Média
- **Estimativa**: 5 pontos de história
- **Status**: [ ] Não Iniciado
- **Sprint Planejado**: Sprint 4

#### **🛒 PURCHASE-001: Fluxo de Compra**
- **Descrição**: Implementar processo completo de compra
- **Prioridade**: 🔴 Crítica
- **Estimativa**: 13 pontos de história
- **Status**: [ ] Não Iniciado
- **Sprint Planejado**: Sprint 5

#### **🎁 BOXES-005: Animação de Abertura**
- **Descrição**: Implementar animação para abertura de caixas
- **Prioridade**: 🟡 Alta
- **Estimativa**: 8 pontos de história
- **Status**: [ ] Não Iniciado
- **Sprint Planejado**: Sprint 5

#### **🔔 NOTIF-001: Sistema de Notificações Push**
- **Descrição**: Implementar notificações push nativas
- **Prioridade**: 🟡 Alta
- **Estimativa**: 8 pontos de história
- **Status**: [ ] Não Iniciado
- **Sprint Planejado**: Sprint 6

#### **⚡ REALTIME-001: Integração Socket.IO**
- **Descrição**: Implementar funcionalidades real-time
- **Prioridade**: 🟡 Alta
- **Estimativa**: 8 pontos de história
- **Status**: [ ] Não Iniciado
- **Sprint Planejado**: Sprint 6

---

## **📊 MÉTRICAS E ACOMPANHAMENTO**

### **Resumo Atual**
- **Total de Tarefas**: 21 tarefas identificadas
- **Tarefas Concluídas**: 0 ✅
- **Tarefas em Andamento**: 0 🔄
- **Tarefas Pendentes**: 21 ⏳

### **Distribuição por Prioridade**
- **🔴 Crítica**: 8 tarefas (38%)
- **🟡 Alta**: 11 tarefas (52%)
- **🟢 Média**: 2 tarefas (10%)

### **Estimativas de Esforço**
- **Sprint 1**: 50 pontos de história
- **Sprint 2**: 34 pontos de história
- **Backlog Futuro**: ~100 pontos estimados

---

## **📝 NOTAS E CONVENÇÕES**

### **Estados das Tarefas**
- **[ ] Não Iniciado**: Tarefa ainda não começou
- **[/] Em Progresso**: Tarefa sendo desenvolvida
- **[x] Concluído**: Tarefa finalizada e validada
- **[-] Cancelado**: Tarefa cancelada ou não mais relevante

### **Prioridades**
- **🔴 Crítica**: Bloqueia outras tarefas ou é essencial para MVP
- **🟡 Alta**: Importante para funcionalidade completa
- **🟢 Média**: Melhoria ou feature adicional
- **🔵 Baixa**: Nice-to-have ou otimização

### **Estimativas (Story Points)**
- **1-2 pontos**: Tarefa simples (< 4 horas)
- **3-5 pontos**: Tarefa média (4-8 horas)
- **8 pontos**: Tarefa complexa (1-2 dias)
- **13 pontos**: Tarefa muito complexa (2-3 dias)
- **21+ pontos**: Épico - deve ser quebrado

### **Processo de Atualização**
- **Daily**: Atualizar status das tarefas em progresso
- **Weekly**: Review e replanejamento se necessário
- **Sprint Review**: Marcar tarefas concluídas e planejar próximo sprint
- **Retrospective**: Ajustar estimativas e processos

---

**Última atualização**: 2025-01-30  
**Próxima revisão**: Início do Sprint 1
