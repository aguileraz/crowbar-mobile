# 🔧 Crowbar Mobile - Guia de Manutenção

Procedimentos e cronogramas para manutenção preventiva e corretiva do aplicativo.

## 📅 Cronograma de Manutenção

### Manutenção Diária (Automatizada)

#### 00:00 - Backup Automático
```bash
# Firebase Firestore backup
gcloud firestore export gs://crowbar-backups/$(date +%Y%m%d)

# Verificar sucesso do backup
gsutil ls gs://crowbar-backups/$(date +%Y%m%d)
```

#### 02:00 - Limpeza de Logs
```bash
# Azure App Service logs (manter 30 dias)
az webapp log config --name crowbar-backend --resource-group crowbar-rg --application-logging filesystem --level information --retention-in-days 30

# Limpeza local de logs de build
find ./logs -name "*.log" -mtime +7 -delete
```

#### 06:00 - Health Check
```bash
# Verificar saúde dos serviços
curl -f https://crowbar-backend.azurewebsites.net/health
curl -f https://crowbar-backend-staging.azurewebsites.net/health

# Verificar Firebase
firebase projects:list
```

#### 12:00 - Monitoramento de Métricas
```bash
# Gerar relatório de métricas
npm run metrics:daily

# Verificar alertas ativos
npm run alerts:check

# Enviar relatório para Slack
npm run report:slack
```

### Manutenção Semanal (Segunda-feira 02:00)

#### Análise de Performance
```bash
# Análise de bundle size
npm run analyze:bundle

# Relatório de performance
npm run performance:weekly

# Verificar memory leaks
npm run memory:analyze
```

#### Atualização de Dependências
```bash
# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências patch
npm update

# Verificar vulnerabilidades
npm audit

# Executar testes após atualizações
npm run test:acceptance
```

#### Limpeza de Dados
```bash
# Limpar dados de teste antigos
# Firebase Console > Firestore > Cleanup test data

# Limpar cache de CDN
# Azure CDN > Purge cache

# Limpar artifacts antigos
# GitHub Actions > Delete old artifacts
```

### Manutenção Mensal (Primeiro domingo 01:00)

#### Backup Completo
```bash
# Backup completo do Firebase
firebase use production
firebase firestore:backup

# Backup de configurações
git archive --format=tar.gz --output=config-backup-$(date +%Y%m).tar.gz HEAD:config/

# Backup de certificados
# Exportar certificados do Keychain (iOS)
# Backup do keystore (Android)
```

#### Análise de Segurança
```bash
# Auditoria completa de segurança
npm audit --audit-level=low

# Verificar certificados SSL
openssl s_client -connect crowbar-backend.azurewebsites.net:443 -servername crowbar-backend.azurewebsites.net

# Verificar expiração de certificados
# Apple Developer > Certificates
# Google Play Console > App signing
```

#### Otimização de Performance
```bash
# Análise de queries lentas
# Firebase Console > Performance > Slow queries

# Otimização de índices
firebase firestore:indexes

# Análise de custos
# Firebase Console > Usage and billing
# Azure Portal > Cost Management
```

### Manutenção Trimestral (Primeiro domingo do trimestre)

#### Revisão Arquitetural
- Análise de escalabilidade
- Revisão de padrões de código
- Avaliação de tecnologias
- Planejamento de upgrades

#### Disaster Recovery Test
```bash
# Teste de restore de backup
gcloud firestore import gs://crowbar-backups/test-restore

# Teste de failover
# Simular falha do backend
# Verificar comportamento do app

# Teste de rollback
# Deploy versão anterior
# Verificar funcionalidades
```

#### Auditoria Completa
- Revisão de logs de acesso
- Análise de padrões de uso
- Verificação de compliance
- Documentação de mudanças

## 🔧 Procedimentos de Manutenção

### Atualização de Dependências

#### Dependências Críticas (Imediato)
```bash
# React Native
npx react-native upgrade

# Firebase
npm install @react-native-firebase/app@latest

# Verificar breaking changes
npm run test:acceptance
```

#### Dependências Regulares (Semanal)
```bash
# Listar dependências desatualizadas
npm outdated

# Atualizar patch versions
npm update

# Atualizar minor versions (com cuidado)
npm install package@^new-version

# Testar após cada atualização
npm run test:unit
npm run test:integration
```

#### Dependências Major (Planejado)
```bash
# Criar branch para upgrade
git checkout -b upgrade/package-name

# Atualizar dependência
npm install package@latest

# Resolver breaking changes
# Consultar migration guide
# Atualizar código conforme necessário

# Testar extensivamente
npm run test:acceptance
npm run test:e2e

# Code review obrigatório
git push origin upgrade/package-name
# Criar PR para review
```

### Limpeza de Dados

#### Dados de Usuário (Mensal)
```bash
# Remover usuários inativos > 2 anos
# Firebase Console > Authentication > Users
# Filtrar por last sign-in date

# Limpar dados órfãos
# Firestore > Verificar referências quebradas
# Storage > Remover arquivos não referenciados
```

#### Logs e Analytics (Semanal)
```bash
# Limpar logs antigos
# Azure > App Service > Logs > Configure retention

# Arquivar dados de analytics
# Firebase > Analytics > Export to BigQuery

# Limpar crash reports antigos
# Crashlytics > Manter últimos 90 dias
```

#### Cache e Temporários (Diário)
```bash
# Limpar cache de build
npm run clean
rm -rf node_modules/.cache

# Limpar cache do Metro
npx react-native start --reset-cache

# Limpar cache do Gradle
cd android && ./gradlew clean
```

### Monitoramento de Saúde

#### Métricas de Sistema
```bash
# CPU e Memória
az monitor metrics list --resource crowbar-backend --metric "CpuPercentage,MemoryPercentage"

# Requests e Errors
az monitor metrics list --resource crowbar-backend --metric "Requests,Http5xx"

# Database Performance
# Firebase Console > Performance > Database
```

#### Métricas de Aplicação
```bash
# Crash Rate
# Firebase Console > Crashlytics > Overview

# Performance
# Firebase Console > Performance > Overview

# User Engagement
# Firebase Console > Analytics > Engagement
```

#### Alertas e Notificações
```bash
# Verificar alertas ativos
az monitor alert list --resource-group crowbar-rg

# Testar notificações
# Simular condição de alerta
# Verificar entrega de notificações
```

## 🚨 Manutenção de Emergência

### Hotfix Deployment

#### Processo Acelerado
```bash
# 1. Criar branch de hotfix
git checkout -b hotfix/critical-fix

# 2. Implementar fix mínimo
# Focar apenas no problema crítico
# Evitar mudanças desnecessárias

# 3. Testes essenciais
npm run test:unit -- --testPathPattern=critical
npm run test:integration -- --testPathPattern=affected

# 4. Build de emergência
npm run build:production

# 5. Deploy imediato
npm run deploy:hotfix

# 6. Monitoramento intensivo
# Verificar métricas por 2 horas
# Confirmar resolução do problema
```

#### Rollback de Emergência
```bash
# Mobile App
# CodePush rollback
appcenter codepush rollback -a YourOrg/CrowbarMobile

# Backend
# Azure slot swap
az webapp deployment slot swap --name crowbar-backend --resource-group crowbar-rg --slot production --target-slot staging

# Database
# Restore backup se necessário
gcloud firestore import gs://crowbar-backups/emergency-restore
```

### Incident Response

#### Comunicação
```bash
# 1. Notificar equipe
# Slack: #crowbar-incidents
# Email: team@crowbar.com

# 2. Atualizar status page
# status.crowbar.com
# Informar usuários sobre o problema

# 3. Documentar timeline
# Início do problema
# Ações tomadas
# Resolução
```

#### Post-Incident
```bash
# 1. Post-mortem meeting
# Análise de causa raiz
# Identificar melhorias
# Documentar lições aprendidas

# 2. Implementar melhorias
# Adicionar monitoramento
# Melhorar alertas
# Atualizar runbooks

# 3. Comunicar resolução
# Atualizar status page
# Notificar stakeholders
# Publicar post-mortem (se apropriado)
```

## 📊 Métricas de Manutenção

### KPIs de Manutenção

#### Disponibilidade
- **Uptime**: > 99.9%
- **MTTR** (Mean Time To Recovery): < 30 min
- **MTBF** (Mean Time Between Failures): > 720 horas

#### Performance
- **Response Time**: < 2s (95th percentile)
- **Error Rate**: < 1%
- **Throughput**: Baseline + 20% capacity

#### Qualidade
- **Code Coverage**: > 80%
- **Security Vulnerabilities**: 0 high/critical
- **Technical Debt**: < 20% do tempo de desenvolvimento

### Relatórios

#### Relatório Semanal
- Métricas de performance
- Incidentes e resoluções
- Atualizações realizadas
- Próximas manutenções

#### Relatório Mensal
- Análise de tendências
- Custos de infraestrutura
- Melhorias implementadas
- Roadmap de manutenção

#### Relatório Trimestral
- Revisão de SLAs
- ROI de melhorias
- Planejamento de capacidade
- Estratégia de evolução

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0  
**Responsável:** Equipe DevOps
