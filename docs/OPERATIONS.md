# 🔧 Crowbar Mobile - Guia de Operações e Manutenção

Este documento fornece informações essenciais para operação, manutenção e troubleshooting do aplicativo Crowbar Mobile em produção.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Monitoramento](#monitoramento)
- [Manutenção Preventiva](#manutenção-preventiva)
- [Troubleshooting](#troubleshooting)
- [Procedimentos de Emergência](#procedimentos-de-emergência)
- [Backup e Recuperação](#backup-e-recuperação)
- [Atualizações](#atualizações)
- [Contatos e Escalação](#contatos-e-escalação)

## 🔍 Visão Geral

### Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Backend API   │    │    Database     │
│  (iOS/Android)  │◄──►│   (Azure)       │◄──►│   (Firebase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │   Monitoring    │    │   File Storage  │
│  (Auth/Push)    │    │   (Sentry/GA)   │    │   (Firebase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Componentes Principais

- **Mobile App**: React Native (iOS/Android)
- **Backend**: Azure App Service
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Monitoring**: Firebase Analytics, Crashlytics, Sentry
- **CI/CD**: GitHub Actions
- **Distribution**: App Store, Google Play

## 📊 Monitoramento

### Métricas Principais

#### Performance
- **App Start Time**: < 3 segundos
- **Screen Transition**: < 500ms
- **API Response Time**: < 2 segundos
- **Memory Usage**: < 100MB
- **Crash Rate**: < 0.1%

#### Business
- **Daily Active Users (DAU)**
- **Monthly Active Users (MAU)**
- **Session Duration**
- **Conversion Rate**
- **Revenue per User**

### Dashboards

#### Firebase Console
- **Analytics**: Usuários, eventos, conversões
- **Crashlytics**: Crashes, ANRs, performance
- **Performance**: Tempos de carregamento, network

#### Sentry
- **Errors**: Erros em tempo real
- **Performance**: Transações, queries
- **Releases**: Deploy tracking

#### Azure Portal
- **App Service**: CPU, memória, requests
- **Application Insights**: Logs, métricas
- **Alerts**: Notificações automáticas

### Alertas Configurados

#### Críticos (Imediato)
- Crash rate > 1%
- API error rate > 5%
- Backend down
- Database connection issues

#### Importantes (30 min)
- Performance degradation > 50%
- Memory usage > 150MB
- High error rate > 2%

#### Informativos (2 horas)
- Unusual traffic patterns
- New error types
- Performance trends

## 🔧 Manutenção Preventiva

### Tarefas Diárias

#### Monitoramento
- [ ] Verificar dashboards de saúde
- [ ] Revisar alertas e notificações
- [ ] Monitorar métricas de performance
- [ ] Verificar logs de erro

#### Validação
- [ ] Testar funcionalidades críticas
- [ ] Verificar integrações externas
- [ ] Validar backups automáticos

### Tarefas Semanais

#### Análise
- [ ] Revisar relatórios de analytics
- [ ] Analisar tendências de performance
- [ ] Verificar feedback de usuários
- [ ] Revisar crash reports

#### Manutenção
- [ ] Limpar logs antigos
- [ ] Verificar espaço de armazenamento
- [ ] Atualizar dependências críticas
- [ ] Revisar configurações de segurança

### Tarefas Mensais

#### Otimização
- [ ] Análise de performance detalhada
- [ ] Otimização de queries
- [ ] Limpeza de dados obsoletos
- [ ] Revisão de custos

#### Segurança
- [ ] Auditoria de segurança
- [ ] Rotação de chaves/tokens
- [ ] Revisão de permissões
- [ ] Teste de backup/restore

### Tarefas Trimestrais

#### Planejamento
- [ ] Revisão de capacidade
- [ ] Planejamento de upgrades
- [ ] Análise de ROI
- [ ] Roadmap de melhorias

## 🚨 Troubleshooting

### Problemas Comuns

#### App Crashes

**Sintomas:**
- Crash rate elevada
- Relatórios no Crashlytics
- Reclamações de usuários

**Diagnóstico:**
```bash
# Verificar logs do Crashlytics
# Analisar stack traces
# Identificar padrões (device, OS, versão)
```

**Resolução:**
1. Identificar causa raiz no código
2. Criar hotfix se crítico
3. Testar em dispositivos afetados
4. Deploy via CodePush ou app update

#### Performance Lenta

**Sintomas:**
- Tempos de resposta elevados
- Reclamações de lentidão
- Métricas de performance degradadas

**Diagnóstico:**
```bash
# Verificar métricas de performance
# Analisar network requests
# Verificar uso de memória
# Identificar bottlenecks
```

**Resolução:**
1. Otimizar queries lentas
2. Implementar cache adicional
3. Reduzir payload de APIs
4. Otimizar imagens/assets

#### Problemas de Conectividade

**Sintomas:**
- Falhas de API
- Timeouts frequentes
- Problemas de sincronização

**Diagnóstico:**
```bash
# Verificar status do backend
# Testar conectividade de rede
# Analisar logs de API
# Verificar rate limits
```

**Resolução:**
1. Verificar saúde do backend
2. Implementar retry logic
3. Melhorar handling de offline
4. Otimizar timeouts

### Comandos de Diagnóstico

#### Logs do App
```bash
# iOS
xcrun simctl spawn booted log stream --predicate 'process == "CrowbarMobile"'

# Android
adb logcat | grep CrowbarMobile
```

#### Performance
```bash
# Análise de bundle
npm run analyze:bundle

# Testes de performance
npm run test:performance

# Relatório completo
npm run test:acceptance
```

#### Backend
```bash
# Logs do Azure
az webapp log tail --name crowbar-backend --resource-group crowbar-rg

# Métricas
az monitor metrics list --resource crowbar-backend
```

## 🚑 Procedimentos de Emergência

### Incidente Crítico

#### Definição
- App inacessível para > 50% dos usuários
- Crash rate > 5%
- Perda de dados
- Vulnerabilidade de segurança

#### Processo de Resposta

1. **Detecção (0-5 min)**
   - Alertas automáticos
   - Relatórios de usuários
   - Monitoramento proativo

2. **Avaliação (5-15 min)**
   - Confirmar severidade
   - Identificar escopo
   - Ativar equipe de resposta

3. **Contenção (15-30 min)**
   - Implementar workaround
   - Rollback se necessário
   - Comunicar status

4. **Resolução (30 min - 4h)**
   - Implementar fix
   - Testar solução
   - Deploy gradual

5. **Recuperação (4-24h)**
   - Monitorar estabilidade
   - Validar métricas
   - Comunicar resolução

6. **Post-mortem (24-72h)**
   - Análise de causa raiz
   - Documentar lições
   - Implementar melhorias

### Rollback de Emergência

#### Mobile App
```bash
# CodePush rollback (se disponível)
appcenter codepush rollback -a YourOrg/CrowbarMobile

# App Store/Play Store
# Remover versão problemática
# Promover versão anterior
```

#### Backend
```bash
# Azure App Service
az webapp deployment slot swap --name crowbar-backend --resource-group crowbar-rg --slot staging --target-slot production
```

### Contatos de Emergência

#### Equipe Principal
- **Tech Lead**: +55 11 99999-0001
- **DevOps**: +55 11 99999-0002
- **Product Owner**: +55 11 99999-0003

#### Fornecedores
- **Azure Support**: Portal Azure
- **Firebase Support**: Firebase Console
- **App Store**: Developer Portal

## 💾 Backup e Recuperação

### Estratégia de Backup

#### Dados de Usuário
- **Firebase Firestore**: Backup automático diário
- **Firebase Storage**: Replicação automática
- **User Preferences**: Sincronização em tempo real

#### Configurações
- **Environment Variables**: Versionadas no Git
- **Firebase Config**: Backup manual mensal
- **Certificates**: Armazenamento seguro

#### Código
- **Git Repository**: GitHub com backup
- **Build Artifacts**: Armazenamento por 90 dias
- **Documentation**: Versionada com código

### Procedimentos de Recuperação

#### Recuperação de Dados
```bash
# Firebase Firestore
gcloud firestore import gs://backup-bucket/backup-folder

# Verificar integridade
firebase firestore:indexes
```

#### Recuperação de Aplicação
```bash
# Rebuild from source
git checkout <stable-tag>
npm install
npm run build:production

# Deploy
npm run deploy:production
```

## 🔄 Atualizações

### Processo de Atualização

#### Planejamento
1. Revisar changelog
2. Testar em staging
3. Agendar janela de manutenção
4. Comunicar usuários

#### Execução
1. Backup completo
2. Deploy em staging
3. Testes de validação
4. Deploy em produção
5. Monitoramento intensivo

#### Validação
1. Verificar métricas
2. Testar funcionalidades
3. Monitorar feedback
4. Confirmar estabilidade

### Tipos de Atualização

#### Patch (Baixo Risco)
- Bug fixes menores
- Atualizações de segurança
- Melhorias de performance

#### Minor (Médio Risco)
- Novas funcionalidades
- Mudanças de UI
- Atualizações de dependências

#### Major (Alto Risco)
- Mudanças arquiteturais
- Breaking changes
- Migrações de dados

## 📞 Contatos e Escalação

### Matriz de Escalação

| Severidade | Tempo | Contato | Backup |
|------------|-------|---------|---------|
| P0 (Crítico) | Imediato | Tech Lead | CTO |
| P1 (Alto) | 30 min | Dev Team | Tech Lead |
| P2 (Médio) | 2 horas | Support | Dev Team |
| P3 (Baixo) | 24 horas | Support | - |

### Canais de Comunicação

#### Interno
- **Slack**: #crowbar-alerts
- **Email**: team@crowbar.com
- **Phone**: Plantão 24/7

#### Externo
- **Status Page**: status.crowbar.com
- **Support**: support@crowbar.com
- **Social Media**: @crowbarmobile

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0  
**Responsável:** Equipe DevOps
