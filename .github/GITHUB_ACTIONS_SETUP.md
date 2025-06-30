# GitHub Actions Setup Guide - Crowbar Backend

## Secrets Necessários

Configure os seguintes secrets no repositório GitHub:

### 1. Azure Deployment
```
AZURE_WEBAPP_PUBLISH_PROFILE_STAGING
AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION
```

### 2. Security Tools
```
SNYK_TOKEN - Token do Snyk para security scanning
```

### 3. Notifications
```
SLACK_WEBHOOK_URL - Webhook do Slack para notificações
```

## Environments

### Staging Environment
- **Nome**: `staging`
- **URL**: https://crowbar-backend-staging.azurewebsites.net
- **Protection Rules**: Nenhuma (deploy automático)
- **Secrets**: 
  - DATABASE_URL
  - FIREBASE_CONFIG
  - PAGARME_API_KEY

### Production Environment
- **Nome**: `production`
- **URL**: https://crowbar-backend-production.azurewebsites.net
- **Protection Rules**: 
  - Required reviewers: 1
  - Wait timer: 5 minutes
- **Secrets**:
  - DATABASE_URL
  - FIREBASE_CONFIG
  - PAGARME_API_KEY

## Branch Protection Rules

### Main Branch
```yaml
Protection Rules:
  - Require pull request reviews: 1 reviewer
  - Dismiss stale reviews: true
  - Require status checks: 
    - Build and Test
    - Security Scan
  - Require branches to be up to date: true
  - Restrict pushes: true
```

### Develop Branch
```yaml
Protection Rules:
  - Require pull request reviews: 1 reviewer
  - Require status checks:
    - Build and Test
  - Require branches to be up to date: true
```

## Configuração de Badges

Adicione ao README.md:

```markdown
[![CI/CD Pipeline](https://github.com/aguileraz/crowbar-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/aguileraz/crowbar-backend/actions/workflows/ci.yml)
[![Security Checks](https://github.com/aguileraz/crowbar-backend/actions/workflows/security.yml/badge.svg)](https://github.com/aguileraz/crowbar-backend/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/aguileraz/crowbar-backend/branch/main/graph/badge.svg)](https://codecov.io/gh/aguileraz/crowbar-backend)
```

## Scripts Package.json Necessários

```json
{
  "scripts": {
    "lint": "eslint src/ --ext .js --max-warnings 0",
    "lint:fix": "eslint src/ --ext .js --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --coverageReporters=lcov --coverageReporters=text --coverageReporters=json-summary",
    "test:ci": "jest --ci --coverage --watchAll=false --reporters=default --reporters=jest-junit",
    "start": "node index.js",
    "start:dev": "nodemon index.js"
  }
}
```

## Configuração do Jest

Criar `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/db/migrations/**',
    '!src/db/seeders/**',
    '!src/bin/**'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  testMatch: [
    '**/test/**/*.js',
    '**/__tests__/**/*.js',
    '**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js']
};
```

## Configuração do ESLint

Criar `.eslintrc.js`:

```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'no-undef': 'error',
    'semi': ['error', 'always'],
    'quotes': ['error', 'single']
  }
};
```

## Monitoramento

### Métricas Coletadas
- Build time
- Test coverage
- Security vulnerabilities
- Deployment success rate
- Response time (health checks)

### Alertas Configurados
- Build failures
- Coverage below 85%
- Security vulnerabilities
- Deployment failures
- Health check failures

## Troubleshooting

### Build Falha
1. Verificar logs do GitHub Actions
2. Verificar se todas as dependências estão no package.json
3. Verificar se Node.js version está correta

### Testes Falham
1. Verificar se banco de dados de teste está configurado
2. Verificar variáveis de ambiente
3. Verificar se Redis está disponível

### Deploy Falha
1. Verificar publish profile
2. Verificar se App Service está rodando
3. Verificar secrets do environment
4. Verificar health check endpoint

### Security Scan Falha
1. Verificar token do Snyk
2. Verificar se há vulnerabilidades críticas
3. Atualizar dependências vulneráveis
