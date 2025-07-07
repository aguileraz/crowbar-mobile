# 📖 Crowbar Mobile - Runbook de Troubleshooting

Guia prático para resolução rápida de problemas em produção.

## 🚨 Alertas Críticos

### App Crash Rate > 1%

**Impacto:** Alto - Usuários não conseguem usar o app  
**SLA:** Resolução em 30 minutos

#### Investigação
```bash
# 1. Verificar Crashlytics
# Firebase Console > Crashlytics > Issues
# Identificar crash mais frequente

# 2. Analisar stack trace
# Verificar linha de código problemática
# Identificar padrão (device, OS, versão)

# 3. Verificar logs
adb logcat | grep -E "(FATAL|ERROR)" | grep CrowbarMobile
```

#### Resolução Imediata
```bash
# Se crash em versão específica
# 1. Rollback via CodePush (se disponível)
appcenter codepush rollback -a YourOrg/CrowbarMobile

# 2. Ou remover versão das stores
# App Store: Remover da venda
# Google Play: Pausar rollout
```

#### Fix Permanente
```bash
# 1. Reproduzir localmente
npm run env:prod
npm run android # ou npm run ios

# 2. Implementar fix
# Corrigir código problemático
# Adicionar tratamento de erro
# Adicionar logs para debug

# 3. Testar
npm run test:acceptance

# 4. Deploy hotfix
npm run build:production
# Submeter para stores com prioridade
```

### API Error Rate > 5%

**Impacto:** Alto - Funcionalidades não funcionam  
**SLA:** Resolução em 15 minutos

#### Investigação
```bash
# 1. Verificar status do backend
curl -I https://crowbar-backend.azurewebsites.net/health

# 2. Verificar logs do Azure
az webapp log tail --name crowbar-backend --resource-group crowbar-rg

# 3. Verificar métricas
# Azure Portal > App Service > Monitoring
```

#### Resolução
```bash
# Se backend está down
# 1. Restart do App Service
az webapp restart --name crowbar-backend --resource-group crowbar-rg

# 2. Verificar recursos
# CPU > 80%: Scale up
# Memory > 80%: Scale up
# Disk > 90%: Limpar logs

# 3. Se problema persiste
# Rollback para versão anterior
az webapp deployment slot swap --name crowbar-backend --resource-group crowbar-rg --slot production --target-slot staging
```

### Database Connection Issues

**Impacto:** Crítico - Perda de dados  
**SLA:** Resolução em 10 minutos

#### Investigação
```bash
# 1. Verificar status do Firebase
# Firebase Console > Project Overview
# Verificar se há incidents

# 2. Testar conectividade
# Firebase Console > Database > Data
# Tentar ler/escrever dados

# 3. Verificar quotas
# Firebase Console > Usage and billing
```

#### Resolução
```bash
# 1. Se quota excedida
# Upgrade do plano Firebase
# Ou implementar rate limiting

# 2. Se problema de rede
# Verificar regras de firewall
# Testar de diferentes locais

# 3. Se corrupção de dados
# Restaurar backup mais recente
gcloud firestore import gs://backup-bucket/latest
```

## ⚡ Problemas de Performance

### App Start Time > 5s

**Impacto:** Médio - Experiência ruim  
**SLA:** Resolução em 2 horas

#### Investigação
```bash
# 1. Verificar bundle size
npm run analyze:bundle

# 2. Verificar performance metrics
# Firebase Console > Performance
# Identificar bottlenecks

# 3. Profile local
# React Native Flipper
# Verificar render times
```

#### Resolução
```bash
# 1. Otimizar bundle
npm run optimize:assets

# 2. Implementar lazy loading
# Verificar src/utils/lazyLoading.tsx
# Adicionar mais componentes lazy

# 3. Otimizar imagens
# Comprimir assets
# Usar formatos modernos (WebP)

# 4. Deploy otimizado
npm run build:production
```

### Memory Usage > 150MB

**Impacto:** Médio - App pode crashar  
**SLA:** Resolução em 4 horas

#### Investigação
```bash
# 1. Verificar memory leaks
# React Native Flipper > Memory
# Identificar objetos não liberados

# 2. Analisar heap dumps
# Xcode Instruments (iOS)
# Android Studio Profiler (Android)

# 3. Verificar cache
# AsyncStorage usage
# Image cache size
```

#### Resolução
```bash
# 1. Limpar caches
# Implementar cache cleanup automático
# Reduzir TTL de cache

# 2. Otimizar imagens
# Reduzir resolução
# Implementar lazy loading

# 3. Fix memory leaks
# Remover listeners não utilizados
# Limpar timers/intervals
# Otimizar state management
```

## 🔐 Problemas de Segurança

### Vulnerabilidade Detectada

**Impacto:** Crítico - Risco de dados  
**SLA:** Resolução em 1 hora

#### Investigação
```bash
# 1. Verificar npm audit
npm audit --audit-level=high

# 2. Verificar Snyk
# Dashboard do Snyk
# Identificar vulnerabilidades

# 3. Verificar logs de acesso
# Procurar tentativas de exploit
```

#### Resolução
```bash
# 1. Patch imediato
npm audit fix

# 2. Se não há fix automático
# Atualizar dependência manualmente
# Ou remover se não crítica

# 3. Deploy emergencial
npm run test:security
npm run build:production

# 4. Monitorar
# Verificar logs por 24h
# Alertar equipe de segurança
```

## 📱 Problemas Específicos de Plataforma

### iOS App Rejected

**Impacto:** Médio - Delay no release  
**SLA:** Resolução em 24 horas

#### Investigação
```bash
# 1. Verificar rejection reason
# App Store Connect > App Review
# Ler feedback detalhado

# 2. Verificar guidelines
# Apple App Store Review Guidelines
# Identificar violação específica
```

#### Resolução
```bash
# 1. Fix do problema
# Corrigir código conforme feedback
# Atualizar metadata se necessário

# 2. Resubmissão
# Responder ao reviewer
# Submeter nova versão

# 3. Expedite se crítico
# Solicitar expedited review
# Justificar urgência
```

### Android Play Console Issues

**Impacto:** Médio - Problemas de distribuição  
**SLA:** Resolução em 12 horas

#### Investigação
```bash
# 1. Verificar Play Console
# Google Play Console > Policy status
# Verificar warnings/violations

# 2. Verificar crash reports
# Play Console > Android vitals
# Analisar ANRs e crashes
```

#### Resolução
```bash
# 1. Fix de policy violations
# Atualizar privacy policy
# Corrigir permissions

# 2. Fix de crashes
# Analisar stack traces
# Implementar fixes

# 3. Resubmissão
# Upload nova versão
# Aguardar review automático
```

## 🔧 Comandos Úteis

### Diagnóstico Rápido
```bash
# Status geral do app
npm run test:acceptance

# Verificar logs em tempo real
npm run logs:production

# Análise de performance
npm run analyze:performance

# Verificar segurança
npm run audit:security
```

### Deployment
```bash
# Deploy de emergência
npm run deploy:hotfix

# Rollback
npm run rollback:production

# Verificar deploy
npm run verify:production
```

### Monitoramento
```bash
# Verificar métricas
npm run metrics:check

# Gerar relatório
npm run report:health

# Alertas ativos
npm run alerts:list
```

## 📊 Métricas de SLA

### Disponibilidade
- **Target**: 99.9% uptime
- **Measurement**: Synthetic monitoring
- **Alert**: < 99.5% em 24h

### Performance
- **App Start**: < 3s (95th percentile)
- **API Response**: < 2s (95th percentile)
- **Screen Transition**: < 500ms (95th percentile)

### Qualidade
- **Crash Rate**: < 0.1%
- **ANR Rate**: < 0.05%
- **Error Rate**: < 1%

### Resolução
- **P0 (Crítico)**: 30 minutos
- **P1 (Alto)**: 2 horas
- **P2 (Médio)**: 8 horas
- **P3 (Baixo)**: 24 horas

## 📞 Escalação

### Nível 1 - Support Team
- Problemas conhecidos
- Documentação existente
- Soluções padrão

### Nível 2 - Development Team
- Problemas técnicos
- Debugging avançado
- Code fixes

### Nível 3 - Senior/Lead
- Problemas arquiteturais
- Decisões críticas
- Vendor escalation

### Nível 4 - Management
- Impacto no negócio
- Comunicação externa
- Recursos adicionais

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0  
**Responsável:** Equipe DevOps
