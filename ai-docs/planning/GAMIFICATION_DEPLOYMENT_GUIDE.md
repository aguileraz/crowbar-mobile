# 🚀 Guia de Deploy - Sistema de Gamificação

**Data:** 2025-08-12  
**Versão:** 1.0.0  
**Status:** Pronto para Deploy  

## 📋 Checklist Pré-Deploy

### Frontend ✅
- [x] Todos os 10 componentes de gamificação implementados
- [x] Hooks e serviços configurados
- [x] Tela unificada GamificationHub criada
- [x] Integração com Redux preparada
- [x] Sistema de notificações configurado

### Backend 📝
- [x] Especificações de API documentadas
- [x] Script SQL de migração pronto
- [x] WebSocket events definidos
- [x] Jobs e cron tasks especificados

### DevOps 🔧
- [x] Script de build automatizado
- [x] GitHub Actions workflow configurado
- [x] Docker Compose preparado
- [x] Makefile com comandos úteis

## 🎯 Passos para Deploy

### 1. Preparação do Ambiente

```bash
# Clone do repositório
git clone https://github.com/crowbar/crowbar-mobile.git
cd crowbar-mobile

# Instalar dependências
make -f Makefile.gamification install

# Verificar qualidade do código
make -f Makefile.gamification quality
```

### 2. Configuração de Variáveis

Criar arquivo `.env.production`:
```env
# Firebase
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-domain
FIREBASE_PROJECT_ID=your-project-id

# Backend
API_BASE_URL=https://api.crowbar.com.br
WEBSOCKET_URL=wss://ws.crowbar.com.br

# Gamification
DAILY_SPINS_LIMIT=3
STREAK_FREEZE_DAYS=1
XP_PER_LEVEL=1000
POINTS_PER_PURCHASE=100
```

### 3. Deploy do Banco de Dados

```bash
# Via Docker
make -f Makefile.gamification docker-up
make -f Makefile.gamification db-migrate

# Ou direto no PostgreSQL
psql -U postgres -d crowbar_db < scripts/gamification-migration.sql
```

### 4. Build da Aplicação

```bash
# Build completo (Android + iOS)
make -f Makefile.gamification build

# Ou usar o script diretamente
./scripts/build-gamification.sh production all

# Build específico
make -f Makefile.gamification build-android
make -f Makefile.gamification build-ios
```

### 5. Deploy via GitHub Actions

```bash
# Push para branch de produção
git add .
git commit -m "feat: deploy gamification system"
git push origin production

# Ou trigger manual
gh workflow run gamification-deploy.yml \
  --field environment=production
```

### 6. Deploy Manual

#### Android (Google Play)
```bash
# Upload AAB para Google Play Console
cd builds/android
# Use fastlane ou upload manual
fastlane android deploy
```

#### iOS (App Store)
```bash
# Upload IPA para App Store Connect
cd builds/ios
# Use fastlane ou Transporter
fastlane ios deploy
```

## 🐳 Deploy com Docker

### Iniciar Todos os Serviços
```bash
# Subir ambiente completo
docker-compose -f docker-compose.gamification.yml up -d

# Verificar status
docker-compose -f docker-compose.gamification.yml ps

# Ver logs
docker-compose -f docker-compose.gamification.yml logs -f
```

### Serviços Disponíveis
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Backend API**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3001`
- **Admin Dashboard**: `http://localhost:3002`
- **Grafana**: `http://localhost:3003` (admin/admin)
- **Prometheus**: `http://localhost:9090`

## 📊 Monitoramento Pós-Deploy

### 1. Verificar Saúde dos Serviços
```bash
# Health check endpoints
curl http://api.crowbar.com.br/health
curl http://api.crowbar.com.br/api/v1/gamification/status

# WebSocket test
wscat -c wss://ws.crowbar.com.br
```

### 2. Dashboard de Métricas
```bash
# Abrir Grafana
make -f Makefile.gamification monitor

# Métricas importantes:
# - Taxa de conversão com timers
# - Engajamento diário (DAU)
# - Completion rate de challenges
# - Uso da spin wheel
# - Distribuição de níveis
```

### 3. Logs e Alertas
```bash
# Tail logs em produção
kubectl logs -f deployment/crowbar-backend

# Verificar eventos de gamificação
SELECT * FROM gamification_events 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## 🔄 Rollback (se necessário)

```bash
# Rollback do banco
psql -U postgres -d crowbar_db < backups/backup-YYYYMMDD.sql

# Rollback da aplicação (Google Play)
# Via Console -> Release Management -> Rollback

# Rollback da aplicação (App Store)
# Via App Store Connect -> Remove from Sale
```

## 📈 Métricas de Sucesso

### KPIs para Monitorar (Primeiras 48h)
- [ ] **Crash Rate**: < 1%
- [ ] **App Launch Time**: < 3s
- [ ] **API Response Time**: < 200ms (P95)
- [ ] **Daily Active Users**: +20%
- [ ] **Challenge Completion**: > 40%
- [ ] **Spin Wheel Usage**: > 60% DAU

### Alertas Configurados
```yaml
# prometheus/alerts.yml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  
- alert: LowEngagement
  expr: gamification_dau < 1000
  
- alert: DatabaseSlow
  expr: pg_query_duration_seconds > 1
```

## 🛠️ Troubleshooting

### Problema: Build Android falha
```bash
# Limpar cache
cd android && ./gradlew clean
rm -rf ~/.gradle/caches

# Reinstalar dependências
rm -rf node_modules
npm install --legacy-peer-deps
```

### Problema: iOS não compila
```bash
# Atualizar pods
cd ios
pod deintegrate
pod install --repo-update
```

### Problema: Migrations falham
```bash
# Verificar conexão
psql -U postgres -h localhost -d crowbar_db -c "SELECT 1"

# Rodar manualmente
docker exec -it crowbar-postgres psql -U crowbar_user -d crowbar_db
\i /scripts/gamification-migration.sql
```

## 📝 Checklist Final

### Antes do Deploy
- [ ] Todos os testes passando
- [ ] Sem erros de lint críticos
- [ ] Console.logs removidos
- [ ] Variáveis de ambiente configuradas
- [ ] Backup do banco realizado

### Durante o Deploy
- [ ] Migrations executadas com sucesso
- [ ] Build sem erros
- [ ] Upload para stores completo
- [ ] Health checks OK

### Após o Deploy
- [ ] Monitoramento ativo
- [ ] Métricas sendo coletadas
- [ ] Sem aumento de crashes
- [ ] Features funcionando
- [ ] Notificações disparando

## 🎉 Comandos Rápidos

```bash
# Deploy completo
make -f Makefile.gamification deploy-prod

# Apenas build
./scripts/build-gamification.sh production all

# Docker ambiente
docker-compose -f docker-compose.gamification.yml up -d

# Monitoramento
make -f Makefile.gamification monitor

# Backup
make -f Makefile.gamification db-backup
```

## 📞 Suporte

Em caso de problemas:
1. Verificar logs: `docker-compose logs -f`
2. Consultar métricas: Grafana Dashboard
3. Rollback se necessário
4. Documentar incidente

---

**Preparado por:** AI Assistant  
**Data:** 2025-08-12  
**Status:** Sistema Pronto para Deploy 🚀